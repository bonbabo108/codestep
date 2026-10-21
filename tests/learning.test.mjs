import test from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { fetchProgress, isCorrectAnswer, learningErrorMessage, restoredAnswer, saveCompletedProgress } from '../lib/learning.ts'
import { fetchQuestions } from '../lib/questions.ts'
import { authenticate, authErrorMessage } from '../lib/auth-actions.ts'

const user = 'fixture-learner'
const otherUser = 'fixture-other-learner'
const question = { id: 'fixture-q1', title: '定数', category: 'JavaScript', question_text: '定数のキーワード', answer_code: 'const', explanation: '再代入不可', created_at: null }
const progressRow = overrides => ({ id: 'fixture-p1', user_id: user, question_id: question.id, submitted_code: 'const', is_completed: true, updated_at: '2026-01-01T00:00:00Z', ...overrides })
const signal = () => new AbortController().signal

// 実際のSupabase JSのクエリ生成を使うが、fetchは全件メモリ内で処理する。
// データベース/RLSを再現・検証するものではなく、外部通信は一切行わない。
function fixture(options = {}) {
  const state = {
    questions: options.questions ?? [question],
    profiles: options.profiles ?? [],
    user_progress: options.progress ?? [],
  }
  const requests = []
  let serial = 0
  let failure = options.failure
  const fetch = async (input, init) => {
    const req = new Request(input, init)
    const url = new URL(req.url)
    assert.equal(url.hostname, '127.0.0.1', 'external request forbidden')
    const table = url.pathname.split('/').at(-1)
    const method = req.method
    const body = method === 'GET' ? null : await req.json()
    requests.push({ table, method, filters: Object.fromEntries(url.searchParams), body })
    if (options.override) {
      const response = options.override({ table, method, body })
      if (response) return response
    }
    if (failure) {
      const failed = failure({ table, method, body })
      if (failed instanceof Error) throw failed
      if (failed) return new Response(JSON.stringify(failed), { status: 403, headers: { 'Content-Type': 'application/json' } })
    }
    assert.ok(Object.hasOwn(state, table), 'unknown table')
    const matches = row => [...url.searchParams].every(([key, value]) => {
      if (value.startsWith('eq.')) return row[key] === value.slice(3)
      if (value.startsWith('in.(')) return value.slice(4, -1).split(',').includes(row[key])
      return true
    })
    let result
    if (method === 'GET') {
      result = state[table].filter(matches).toSorted((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? '') || b.id.localeCompare(a.id))
      const limit = url.searchParams.get('limit')
      if (limit) result = result.slice(0, Number(limit))
    } else if (method === 'POST') {
      result = { id: `fixture-created-${++serial}`, updated_at: '2026-01-02T00:00:00Z', ...body }
      state[table].push(result)
    } else if (method === 'PATCH') {
      const rows = state[table].filter(matches)
      rows.forEach(row => Object.assign(row, body))
      result = rows[0] ?? null
    } else throw new Error('unsupported fixture operation')
    return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  const client = createClient('http://127.0.0.1:54321', 'fictional-test-key', {
    global: { fetch }, auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  return { client, state, requests, setFailure: value => { failure = value } }
}

const fakeAuth = ({ signedIn = true, registrationSession = false, error = null } = {}) => ({ auth: {
  signUp: async () => ({ data: { session: registrationSession ? { user: { id: user } } : null }, error }),
  signInWithPassword: async () => ({ data: { session: signedIn ? { user: { id: user } } : null }, error }),
} })

test('認証は確認メール待ちとログイン成功を区別する', async () => {
  assert.equal(await authenticate(fakeAuth(), 'learner@example.invalid', 'fictional-password', true), 'confirm-email')
  assert.equal(await authenticate(fakeAuth(), 'learner@example.invalid', 'fictional-password', false), 'signed-in')
  assert.equal(await authenticate(fakeAuth({ registrationSession: true }), 'learner@example.invalid', 'fictional-password', true), 'signed-in')
})

test('認証失敗とセッション欠落を成功扱いしない', async () => {
  await assert.rejects(authenticate(fakeAuth({ signedIn: false }), 'learner@example.invalid', 'fictional-password', false))
  await assert.rejects(authenticate(fakeAuth({ error: { code: 'invalid_credentials' } }), 'learner@example.invalid', 'fictional-password', false))
  assert.doesNotMatch(authErrorMessage(new Error('private detail')), /private/)
})

test('DBの問題を取得し、固定3問を前提としない', async () => {
  const f = fixture()
  const rows = await fetchQuestions(f.client, signal())
  assert.deepEqual(rows, [question])
  assert.equal(f.requests[0].table, 'questions')
  assert.equal(f.requests[0].method, 'GET')
})

test('問題0件を安全に扱う', async () => {
  const f = fixture({ questions: [] })
  assert.deepEqual(await fetchQuestions(f.client, signal()), [])
  assert.deepEqual(await fetchProgress(f.client, user, [], signal()), {})
  assert.equal(f.requests.length, 1)
})

test('回答は前後空白を除く完全一致、大小文字は区別する', () => {
  assert.equal(isCorrectAnswer(question, ' const '), true)
  assert.equal(isCorrectAnswer(question, 'CONST'), false)
  assert.equal(isCorrectAnswer(question, ''), false)
})

test('未ログイン・不正解では書き込みリクエストを送らない', async () => {
  const f = fixture()
  await assert.rejects(saveCompletedProgress(f.client, '', question, 'const', signal()))
  await assert.rejects(saveCompletedProgress(f.client, user, question, 'let', signal()))
  assert.equal(f.requests.length, 0)
})

test('初回正解で本人プロフィールを作り、問題IDに紐付けて保存する', async () => {
  const f = fixture()
  const saved = await saveCompletedProgress(f.client, user, question, 'const', signal())
  assert.equal(saved.is_completed, true)
  assert.deepEqual(f.state.profiles.map(p => ({ id: p.id, name: p.name })), [{ id: user, name: '学習者' }])
  const write = f.requests.find(r => r.table === 'user_progress' && r.method === 'POST')
  assert.deepEqual(Object.keys(write.body).sort(), ['is_completed', 'question_id', 'submitted_code', 'user_id'])
  assert.equal(write.body.user_id, user)
  assert.equal(write.body.question_id, question.id)
})

test('既存プロフィールは変更せず利用する', async () => {
  const f = fixture({ profiles: [{ id: user, name: '既存の表示名' }] })
  await saveCompletedProgress(f.client, user, question, 'const', signal())
  assert.equal(f.state.profiles[0].name, '既存の表示名')
  assert.equal(f.requests.filter(r => r.table === 'profiles' && r.method !== 'GET').length, 0)
})

test('既存進捗は本人・問題・主キーの3条件で更新する', async () => {
  const f = fixture({ progress: [progressRow({})] })
  await saveCompletedProgress(f.client, user, question, ' const ', signal())
  assert.equal(f.state.user_progress.length, 1)
  const patch = f.requests.find(r => r.method === 'PATCH')
  assert.equal(patch.filters.user_id, 'eq.' + user)
  assert.equal(patch.filters.question_id, 'eq.' + question.id)
  assert.equal(patch.filters.id, 'eq.fixture-p1')
  assert.equal(f.state.user_progress[0].submitted_code, ' const ')
})

test('ログイン→出題→回答保存→再ログイン後の復元（通信モック）', async () => {
  const f = fixture()
  assert.equal(await authenticate(fakeAuth(), 'learner@example.invalid', 'fictional-password', false), 'signed-in')
  const [q] = await fetchQuestions(f.client, signal())
  await saveCompletedProgress(f.client, user, q, 'const', signal())
  // 画面のReact stateを使わず、DB応答に見立てた保存先から再取得する。
  assert.equal(await authenticate(fakeAuth(), 'learner@example.invalid', 'fictional-password', false), 'signed-in')
  const restored = await fetchProgress(f.client, user, [q.id], signal())
  assert.equal(restoredAnswer(restored[q.id]), 'const')
})

test('別ユーザーの進捗を取得・復元しない', async () => {
  const f = fixture({ progress: [progressRow({}), progressRow({ id: 'other-progress', user_id: otherUser, submitted_code: 'other-answer' })] })
  const own = await fetchProgress(f.client, user, [question.id], signal())
  assert.equal(restoredAnswer(own[question.id]), 'const')
  const empty = await fetchProgress(f.client, 'new-fixture-user', [question.id], signal())
  assert.deepEqual(empty, {})
  assert.ok(f.requests.every(r => r.filters.user_id?.startsWith('eq.')))
})

test('重複した進捗は最新を復元し、未完了コードは復元しない', async () => {
  const f = fixture({ progress: [progressRow({}), progressRow({ id: 'latest-progress', updated_at: '2026-01-03T00:00:00Z', submitted_code: ' const ' })] })
  assert.equal(restoredAnswer((await fetchProgress(f.client, user, [question.id], signal()))[question.id]), ' const ')
  assert.equal(restoredAnswer(progressRow({ is_completed: false })), '')
})

test('権限拒否と通信失敗は保存済みとせず、機密エラーを表示しない', async () => {
  const f = fixture({ profiles: [{ id: user }], failure: ({ table, method }) => table === 'user_progress' && method === 'POST' ? { code: '42501', message: 'private detail' } : null })
  await assert.rejects(saveCompletedProgress(f.client, user, question, 'const', signal()))
  assert.equal(f.state.user_progress.length, 0)
  assert.match(learningErrorMessage({ code: '42501' }), /権限/)
  assert.doesNotMatch(learningErrorMessage(new Error('private detail')), /private/)
})

test('書き込み確定後に応答を失っても、明示再試行時に既存行を更新する', async () => {
  const f = fixture({ profiles: [{ id: user }] })
  await saveCompletedProgress(f.client, user, question, 'const', signal())
  // 「画面では結果不明」の状態を想定し、再試行はfresh SELECTから行う。
  await saveCompletedProgress(f.client, user, question, 'const', signal())
  assert.equal(f.state.user_progress.length, 1)
  assert.equal(f.requests.filter(r => r.table === 'user_progress' && r.method === 'POST').length, 1)
})

test('進捗取得の通信エラーを空の正常進捗に変換しない', async () => {
  const f = fixture({ failure: () => new TypeError('network unavailable') })
  await assert.rejects(fetchProgress(f.client, user, [question.id], signal()))
  assert.match(learningErrorMessage(new Error('private'), 'load'), /読み込めません/)
  assert.doesNotMatch(learningErrorMessage(new Error('private'), 'load'), /保存できたか|private/)
})


test('0件更新は保存済みとせず、前の進捗を変更しない', async () => {
  const f = fixture({ progress: [progressRow({})], override: ({ method }) => method === 'PATCH' ? new Response('null', { status: 200, headers: { 'Content-Type': 'application/json' } }) : null })
  await assert.rejects(saveCompletedProgress(f.client, user, question, ' const ', signal()))
  assert.equal(f.state.user_progress[0].submitted_code, 'const')
})

test('返却データの所有者が異なれば復元しない', async () => {
  const f = fixture({ override: ({ table }) => table === 'user_progress' ? new Response(JSON.stringify([progressRow({ user_id: otherUser })]), { status: 200, headers: { 'Content-Type': 'application/json' } }) : null })
  await assert.rejects(fetchProgress(f.client, user, [question.id], signal()))
})

test('プロフィール作成の競合は本人行を再確認してから進める', async () => {
  const f = fixture({ failure: ({ table, method }) => {
    if (table === 'profiles' && method === 'POST') {
      f.state.profiles.push({ id: user, name: '別タブで作成済み' })
      return { code: '23505', message: 'duplicate' }
    }
    return null
  } })
  await saveCompletedProgress(f.client, user, question, 'const', signal())
  assert.equal(f.state.profiles.length, 1)
  assert.equal(f.state.profiles[0].name, '別タブで作成済み')
  assert.equal(f.state.user_progress.length, 1)
})

test('同時初回保存の一意制約競合は本人行を再読込して1件を更新する', async () => {
  const f = fixture({ profiles: [{ id: user }], failure: ({ table, method }) => {
    if (table === 'user_progress' && method === 'POST') {
      f.state.user_progress.push(progressRow({ submitted_code: 'const' }))
      return { code: '23505', message: 'duplicate' }
    }
    return null
  } })
  const saved = await saveCompletedProgress(f.client, user, question, ' const ', signal())
  assert.equal(saved.submitted_code, ' const ')
  assert.equal(f.state.user_progress.length, 1)
  assert.equal(f.requests.filter(r => r.table === 'user_progress' && r.method === 'POST').length, 1)
  assert.equal(f.requests.filter(r => r.table === 'user_progress' && r.method === 'PATCH').length, 1)
})

test('一意制約競合後も本人行が確認できなければ成功にしない', async () => {
  const f = fixture({ profiles: [{ id: user }], failure: ({ table, method }) =>
    table === 'user_progress' && method === 'POST' ? { code: '23505' } : null })
  await assert.rejects(saveCompletedProgress(f.client, user, question, 'const', signal()))
  assert.equal(f.requests.filter(r => r.method === 'PATCH').length, 0)
})
