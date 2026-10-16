// 明示実行専用。npm testには含めない。実在利用者/本番データは使わない。
import { writeFileSync } from 'node:fs'
import { randomBytes, randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { credentialFile, guardedFetch, readStagingConfig } from './staging-runtime.mjs'
import { fetchQuestions, saveQuestion, deleteQuestion } from '../lib/questions.ts'
import { fetchProgress, saveCompletedProgress, restoredAnswer } from '../lib/learning.ts'

const report = []
const signal = () => new AbortController().signal
const ensure = (condition, label = 'expectation failed') => { if (!condition) throw new Error(label) }
const checked = async request => { const r = await request; ensure(!r.error); return r.data }
const mode = process.argv[2]
const clientOptions = { global: { fetch: guardedFetch }, auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
const claim = session => JSON.parse(Buffer.from(session.access_token.split('.')[1], 'base64url').toString()).app_metadata?.codestep_admin
let config, service
async function check(name, action) {
  try { await action(); report.push({ name, result: 'pass' }); console.log(`PASS ${name}`) }
  catch { report.push({ name, result: 'fail' }); console.log(`FAIL ${name}`) }
}
function saveConfig() { writeFileSync(credentialFile, JSON.stringify(config), { mode: 0o600 }) }
function browserClient() { return createClient(config.url, config.publishableKey, clientOptions) }
async function login(role) {
  const client = browserClient()
  const { email, password } = config.users[role]
  const data = await checked(client.auth.signInWithPassword({ email, password }))
  ensure(data.session)
  return client
}
async function setAdmin(value) { await checked(service.auth.admin.updateUserById(config.users.admin.id, { app_metadata: { codestep_admin: value } })) }
async function setupUsers() {
  config.users ??= {}
  for (const role of ['learner', 'other', 'admin']) {
    if (config.users[role]) continue
    const email = `codestep-${role}-${randomUUID().slice(0, 8)}@example.invalid`
    const password = randomBytes(30).toString('base64url')
    const { user } = await checked(service.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { codestep_admin: false } }))
    config.users[role] = { id: user.id, email, password }
    saveConfig()
  }
}
async function authChecks() {
  await setupUsers()
  await check('AUTH-01 staging一般ユーザーの実ログイン', async () => {
    const c = await login('learner'); ensure((await checked(c.auth.getUser())).user.id === config.users.learner.id)
  })
  await check('AUTH-02 不正なパスワードを拒否', async () => {
    const r = await browserClient().auth.signInWithPassword({ email: config.users.learner.email, password: 'wrong-test-password' }); ensure(r.error)
  })
  await check('AUTH-03 user_metadataによる自己昇格不可', async () => {
    const c = await login('learner'); await checked(c.auth.updateUser({ data: { codestep_admin: true } }))
    const r = await checked(c.auth.refreshSession()); ensure(claim(r.session) !== true)
  })
  await check('AUTH-04 一般APIからapp_metadataを自己変更不可', async () => {
    const c = await login('learner'); await c.auth.updateUser({ app_metadata: { codestep_admin: true } })
    const r = await checked(c.auth.refreshSession()); ensure(claim(r.session) !== true)
  })
  try {
    await setAdmin(false)
    const c = await login('admin')
    const old = (await checked(c.auth.getSession())).session
    await setAdmin(true)
    await check('AUTH-05 付与前JWTは古い権限のまま', async () => { ensure(claim(old) === false) })
    let current
    await check('AUTH-06 JWT更新後に管理者フラグ反映', async () => { current = (await checked(c.auth.refreshSession())).session; ensure(claim(current) === true) })
    await setAdmin(false)
    await check('AUTH-07 権限解除後も旧JWTにtrueが残る', async () => { ensure(current && claim(current) === true) })
    await check('AUTH-08 更新JWTでは管理者権限解除', async () => { ensure(claim((await checked(c.auth.refreshSession())).session) === false) })
  } finally { await setAdmin(true) }
  await check('AUTH-09 ログアウト・再ログイン成功', async () => {
    const c = await login('learner'); await checked(c.auth.signOut()); ensure(!(await checked(c.auth.getSession())).session)
    ensure((await checked((await login('learner')).auth.getUser())).user.id === config.users.learner.id)
  })
}

async function dbChecks() {
  ensure(config.users?.learner && config.users?.admin, 'run auth mode first')
  // 3テーブルが揃うまでテストデータを書かない。DDL実行機能は持たせない。
  for (const table of ['questions', 'profiles', 'user_progress']) await checked(service.from(table).select('id').limit(0))
  const drafts = [
    { category: 'HTML', title: '見出しタグ', question_text: '最も大きな見出しを「Hello」で作成してください。', answer_code: '<h1>Hello</h1>', explanation: 'h1はページの主見出しを表す要素です。' },
    { category: 'CSS', title: '文字色の指定', question_text: '文字色を赤にするCSS宣言を書いてください。', answer_code: 'color: red;', explanation: 'colorプロパティで文字色を指定します。' },
    { category: 'JavaScript', title: '定数の宣言', question_text: '定数を宣言するキーワードを答えてください。', answer_code: 'const', explanation: 'constで宣言した変数は再代入できません。' },
  ]
  if (!config.questionIds) {
    const rows = await checked(service.from('questions').insert(drafts).select('id'))
    config.questionIds = rows.map(r => r.id); saveConfig()
  }
  const q = await checked(service.from('questions').select('*').eq('id', config.questionIds[2]).single())
  const anon = browserClient(), learner = await login('learner'), other = await login('other'), admin = await login('admin')
  const snapshot = async () => JSON.stringify(await checked(service.from('questions').select('*').order('id')))
  await check('DB-01 匿名のDB出題SELECT', async () => { ensure((await fetchQuestions(anon, signal())).length >= 3) })
  for (const [role, c] of [['匿名', anon], ['一般', learner]]) {
    await check(`DB-02 ${role}SELECT`, async () => { ensure((await fetchQuestions(c, signal())).some(r => r.id === q.id)) })
    for (const op of ['insert', 'update', 'delete']) {
      await check(`DB-03 ${role}${op}拒否・既存データ不変`, async () => {
        const before = await snapshot()
        const r = await (op === 'insert' ? c.from('questions').insert(drafts[0]).select('id')
          : op === 'update' ? c.from('questions').update({ title: '拒否対象' }).eq('id', q.id).select('id')
          : c.from('questions').delete().eq('id', q.id).select('id'))
        ensure(r.error || r.data?.length === 0); ensure(await snapshot() === before)
      })
    }
  }
  let created
  await check('DB-04 管理者の作成・編集・削除', async () => {
    created = await saveQuestion(admin, { ...drafts[0], title: 'CRUD専用の架空問題' }, null, signal())
    const updated = await saveQuestion(admin, { ...drafts[0], title: 'CRUD編集済み' }, created.id, signal())
    ensure(updated.title === 'CRUD編集済み'); await deleteQuestion(admin, created.id, signal())
    ensure(!(await checked(service.from('questions').select('id').eq('id', created.id))).length)
  })
  for (const field of ['id', 'created_at']) await check(`DB-05 管理者でも禁止列${field}変更拒否`, async () => {
    const before = await snapshot()
    const r = await admin.from('questions').update({ [field]: field === 'id' ? randomUUID() : new Date().toISOString() }).eq('id', q.id)
    ensure(r.error); ensure(await snapshot() === before)
  })
  await check('DB-06 存在しないIDの更新・削除を成功扱いしない', async () => {
    for (const action of [() => saveQuestion(admin, drafts[0], randomUUID(), signal()), () => deleteQuestion(admin, randomUUID(), signal())]) {
      let rejected = false; try { await action() } catch { rejected = true } ensure(rejected)
    }
  })
  const uid = config.users.learner.id
  await check('LEARN-01 不正解は保存しない', async () => {
    let rejected = false; try { await saveCompletedProgress(learner, uid, q, 'let', signal()) } catch { rejected = true } ensure(rejected)
  })
  await check('LEARN-02 初回正解・プロフィール・進捗保存', async () => {
    const r = await saveCompletedProgress(learner, uid, q, 'const', signal()); ensure(r.is_completed === true)
    const profiles = await checked(service.from('profiles').select('id,name,created_at').eq('id', uid))
    ensure(profiles.length === 1 && (profiles[0].created_at === null || Number.isFinite(Date.parse(profiles[0].created_at))))
  })
  await check('LEARN-03 再ログイン後の復元', async () => {
    await checked(learner.auth.signOut()); const c = await login('learner')
    ensure(restoredAnswer((await fetchProgress(c, uid, [q.id], signal()))[q.id]) === 'const')
  })
  const fresh = await login('learner')
  await check('LEARN-04 同時初回保存・再保存で1件を維持', async () => {
    const otherQ = await checked(service.from('questions').select('*').eq('id', config.questionIds[0]).single())
    await Promise.all([1, 2, 3].map(() => saveCompletedProgress(fresh, uid, otherQ, otherQ.answer_code, signal())))
    const rows = await checked(service.from('user_progress').select('*').eq('user_id', uid).eq('question_id', otherQ.id))
    ensure(rows.length === 1)
  })
  await check('LEARN-05 他人の進捗SELECT/INSERT/UPDATEを拒否', async () => {
    const progress = await checked(service.from('user_progress').select('*').eq('user_id', uid).eq('question_id', q.id).single())
    ensure((await checked(other.from('user_progress').select('id').eq('user_id', uid))).length === 0)
    ensure((await other.from('user_progress').insert({ user_id: uid, question_id: q.id, is_completed: true })).error)
    const changed = await checked(other.from('user_progress').update({ submitted_code: 'not-own' }).eq('id', progress.id).select('id'))
    ensure(changed.length === 0)
    ensure((await checked(service.from('user_progress').select('submitted_code').eq('id', progress.id).single())).submitted_code === 'const')
  })
  await check('LEARN-06 参照中の問題削除はFKで拒否', async () => { ensure((await admin.from('questions').delete().eq('id', q.id)).error?.code === '23503') })
  await check('LEARN-07 既存コードの更新日時を保存・再取得', async () => {
    const started = Date.now()
    const r = await saveCompletedProgress(fresh, uid, q, 'const', signal())
    const updated = Date.parse(r.updated_at ?? '')
    ensure(updated >= started && updated <= Date.now())
    const stored = await checked(service.from('user_progress').select('updated_at').eq('id', r.id).single())
    ensure(Date.parse(stored.updated_at) === updated)
  })
}

async function extraChecks() {
  const anon = browserClient(), learner = await login('learner')
  const q = await checked(service.from('questions').select('*').eq('id', config.questionIds[2]).single())
  const draft = { title: '権限試験用', question_text: '架空問題', answer_code: 'test', category: 'HTML', explanation: 'staging専用' }
  const snapshot = async () => JSON.stringify(await checked(service.from('questions').select('*').order('id')))
  await setAdmin(true)
  let admin = await login('admin'), transient
  try {
    await check('EXTRA-01 管理者でもid/created_at付きINSERT拒否', async () => {
      const before = await snapshot()
      for (const field of ['id', 'created_at']) ensure((await admin.from('questions').insert({ ...draft, [field]: field === 'id' ? randomUUID() : new Date().toISOString() })).error)
      ensure(await snapshot() === before)
    })
    for (const flag of [false, 'true', null]) await check(`EXTRA-02 app_metadata=${JSON.stringify(flag)}で実RLSのI/U/D拒否`, async () => {
      await setAdmin(flag); const c = await login('admin'); const before = await snapshot()
      ensure((await c.from('questions').insert(draft)).error)
      ensure((await checked(c.from('questions').update({ title: '拒否対象' }).eq('id', q.id).select('id'))).length === 0)
      ensure((await checked(c.from('questions').delete().eq('id', q.id).select('id'))).length === 0)
      ensure(await snapshot() === before)
    })
    await check('EXTRA-03 権限解除後の旧JWTと新JWTを実DBで比較', async () => {
      await setAdmin(true); admin = await login('admin')
      transient = await saveQuestion(admin, draft, null, signal())
      await setAdmin(false)
      ensure((await (await login('admin')).from('questions').insert(draft)).error)
      ensure((await saveQuestion(admin, { ...draft, title: '旧JWTに権限残存' }, transient.id, signal())).title === '旧JWTに権限残存')
    })
  } finally {
    await setAdmin(true)
    if (transient) await deleteQuestion(await login('admin'), transient.id, signal())
  }
  await check('EXTRA-04 匿名の進捗読み書きを拒否', async () => {
    ensure((await anon.from('user_progress').select('id')).error)
    ensure((await anon.from('user_progress').insert({ user_id: config.users.learner.id, question_id: q.id, is_completed: true })).error)
  })
  await check('EXTRA-05 進捗の所有者/問題/ID列の変更を拒否', async () => {
    const row = await checked(service.from('user_progress').select('*').eq('user_id', config.users.learner.id).eq('question_id', q.id).single())
    for (const field of ['id', 'user_id', 'question_id']) ensure((await learner.from('user_progress').update({ [field]: randomUUID() }).eq('id', row.id)).error)
    ensure(JSON.stringify(await checked(service.from('user_progress').select('*').eq('id', row.id).single())) === JSON.stringify(row))
  })
  await check('EXTRA-06 初回プロフィールと進捗の同時作成競合', async () => {
    const c = await login('other'), uid = config.users.other.id
    const question = await checked(service.from('questions').select('*').eq('id', config.questionIds[1]).single())
    await Promise.all([1, 2, 3].map(() => saveCompletedProgress(c, uid, question, question.answer_code, signal())))
    ensure((await checked(service.from('profiles').select('id').eq('id', uid))).length === 1)
    ensure((await checked(service.from('user_progress').select('id').eq('user_id', uid).eq('question_id', question.id))).length === 1)
  })
}

async function operationChecks(stopped) {
  const q = await checked(service.from('questions').select('*').eq('id', config.questionIds[2]).single())
  const draft = { title: '停止復旧試験', question_text: '架空問題', answer_code: 'test', explanation: 'staging専用', category: 'HTML' }
  for (const [role, c] of [['匿名', browserClient()], ['一般', await login('learner')], ['管理者', await login('admin')]]) {
    await check(`OPS ${stopped ? '停止中' : '復旧後'} ${role}SELECT継続`, async () => { ensure((await fetchQuestions(c, signal())).some(r => r.id === q.id)) })
    if (stopped || role !== '管理者') await check(`OPS ${stopped ? '停止中' : '復旧後'} ${role}書込み拒否`, async () => {
      const before = JSON.stringify(await checked(service.from('questions').select('*').order('id')))
      const r = [await c.from('questions').insert(draft).select('id'), await c.from('questions').update({ title: '拒否' }).eq('id', q.id).select('id'), await c.from('questions').delete().eq('id', q.id).select('id')]
      ensure(r.every(x => x.error || x.data?.length === 0))
      ensure(JSON.stringify(await checked(service.from('questions').select('*').order('id'))) === before)
    })
  }
  if (!stopped) await check('OPS 復旧後に管理者だけCRUD再開', async () => {
    const c = await login('admin'), row = await saveQuestion(c, draft, null, signal())
    ensure((await saveQuestion(c, { ...draft, title: '限定復旧済み' }, row.id, signal())).title === '限定復旧済み')
    await deleteQuestion(c, row.id, signal())
  })
}

try {
  ensure(['auth', 'db', 'extra', 'missing-claim', 'stopped', 'resumed', 'ui-remove', 'ui-cleanup', 'admin-off', 'admin-on'].includes(mode))
  config = readStagingConfig(); service = createClient(config.url, config.secretKey, clientOptions)
  if (mode === 'auth') await authChecks()
  else if (mode === 'db') await dbChecks()
  else if (mode === 'extra') await extraChecks()
  else if (mode === 'missing-claim') {
    if (!config.users.missing) {
      const email = `codestep-missing-${randomUUID().slice(0, 8)}@example.invalid`
      const password = randomBytes(30).toString('base64url')
      const { user } = await checked(service.auth.admin.createUser({ email, password, email_confirm: true }))
      config.users.missing = { id: user.id, email, password }; saveConfig()
    }
    await check('EXTRA-07 管理者フラグ欠落の実JWTでもI/U/D拒否', async () => {
      const c = await login('missing'), session = (await checked(c.auth.getSession())).session
      ensure(claim(session) === undefined)
      const q = await checked(service.from('questions').select('*').eq('id', config.questionIds[0]).single())
      const snapshot = async () => JSON.stringify(await checked(service.from('questions').select('*').order('id')))
      const before = await snapshot()
      ensure((await c.from('questions').insert({ title: '拒否', question_text: '架空', answer_code: 'test' })).error)
      ensure((await checked(c.from('questions').update({ title: '拒否' }).eq('id', q.id).select('id'))).length === 0)
      ensure((await checked(c.from('questions').delete().eq('id', q.id).select('id'))).length === 0)
      ensure(await snapshot() === before)
    })
  }
  else if (mode === 'stopped' || mode === 'resumed') await operationChecks(mode === 'stopped')
  else if (mode === 'ui-remove') {
    const c = await login('admin')
    const rows = await checked(c.from('questions').select('id').eq('title', 'ブラウザ0件検証'))
    ensure(rows.length === 1)
    await deleteQuestion(c, rows[0].id, signal())
    console.log('stagingのブラウザ0件検証用の1件だけ削除しました。')
  }
  else if (mode === 'ui-cleanup') {
    const c = await login('admin')
    for (const title of ['ブラウザCRUD検証', 'ブラウザCRUD検証・編集済み', 'ブラウザ0件検証']) {
      const rows = await checked(c.from('questions').select('id').eq('title', title))
      ensure(rows.length <= 1)
      if (rows.length) await deleteQuestion(c, rows[0].id, signal())
    }
    console.log('固定名のstaging画面試験用データだけを片付けました。')
  }
  else { await setAdmin(mode === 'admin-on'); console.log('stagingテスト管理者のフラグだけ更新しました。') }
} catch { report.push({ name: 'setup/prerequisite', result: 'fail' }); console.error('前提条件または接続に失敗。秘密値・サーバー応答は出力しません。') }
const output = { mode, project: 'codestep-staging', checks: report, passed: report.filter(r => r.result === 'pass').length, failed: report.filter(r => r.result === 'fail').length }
writeFileSync(`/tmp/codestep-staging-${mode}-results.json`, JSON.stringify(output, null, 2))
console.log(`RESULT ${output.passed} passed / ${output.failed} failed`)
process.exitCode = output.failed ? 1 : 0
