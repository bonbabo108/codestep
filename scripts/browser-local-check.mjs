// ローカル画面 + 全API応答モック。RLS/実DB試験ではない。実資格情報は読み込まない。
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { setTimeout as delay } from 'node:timers/promises'

if (process.env.CODESTEP_LOCAL_UI_TESTS !== '1') throw Error('local UI opt-in required')
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.CODESTEP_PLAYWRIGHT_MODULE || 'playwright')
const origin = 'http://127.0.0.1:3117'
const api = 'http://127.0.0.1:54321'
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/KEY|TOKEN|SECRET|PASSWORD|STAGING_CREDENTIAL/.test(k)))
Object.assign(env, { NEXT_PUBLIC_SUPABASE_URL: api, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'local-ui-fictional-key', NEXT_TELEMETRY_DISABLED: '1' })
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', '3117'], { env, stdio: 'ignore' })
let browser
const report = []
const q = { id: 'local-q1', title: 'ローカル検証用の定数', question_text: '定数を宣言するキーワードは？', answer_code: 'const', explanation: 'constは再代入できません。', category: 'JavaScript', created_at: null }

async function fixture(role, mode = 'normal') {
  const context = await browser.newContext()
  const state = { questions: [{ ...q }], progress: [], requests: [], dialogs: 0 }
  const user = { id: 'local-learner', aud: 'authenticated', role: 'authenticated', app_metadata: { codestep_admin: role === 'admin' }, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' }
  const exp = Math.floor(Date.now() / 1000) + 3600
  const enc = v => Buffer.from(JSON.stringify(v)).toString('base64url')
  const session = { access_token: `${enc({ alg: 'HS256', typ: 'JWT' })}.${enc({ sub: user.id, exp, role: 'authenticated' })}.local-fixture-signature`, refresh_token: 'local-fixture-refresh', expires_in: 3600, expires_at: exp, token_type: 'bearer', user }
  await context.addInitScript(({ role, session }) => {
    if (role !== 'guest') localStorage.setItem('sb-127-auth-token', JSON.stringify(session))
  }, { role, session })
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url())
    if (url.origin === origin) return route.continue()
    if (url.origin !== api) return route.abort()
    const table = url.pathname.split('/').at(-1), method = request.method()
    state.requests.push({ table, method })
    const send = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
    const fail = code => send({ code, message: 'private fixture detail' }, code === '23503' ? 409 : 403)
    if (url.pathname === '/auth/v1/user') return send(user)
    if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204 })
    const singular = (request.headers().accept || '').includes('vnd.pgrst.object')
    const rows = value => send(singular ? value[0] ?? null : value)
    if (table === 'questions') {
      if (method === 'GET') return rows(state.questions)
      if (role !== 'admin') return fail('42501')
      if (mode === 'network') return send({ message: 'private fixture detail' }, 503)
      if (mode === 'denied') return fail('42501')
      if (mode === 'zero') return rows([])
      if (method === 'DELETE') {
        if (mode === 'fk') return fail('23503')
        state.questions = []
        return rows([{ id: q.id }])
      }
      if (method === 'PATCH') { Object.assign(state.questions[0], request.postDataJSON()); return rows(state.questions) }
    }
    if (table === 'profiles' && method === 'GET') return rows([{ id: user.id }])
    if (table === 'user_progress') {
      if (mode === 'progress-load' && method === 'GET') return fail('42501')
      if (method === 'GET') return rows(state.progress)
      const row = { id: 'local-progress', user_id: user.id, question_id: q.id, updated_at: '2026-01-01T00:00:00Z', ...request.postDataJSON() }
      state.progress = [row]
      if (mode === 'response-lost' && method === 'POST') return send({ message: 'private fixture detail' }, 503)
      return rows(state.progress)
    }
    return send({ message: 'unexpected local fixture request' }, 400)
  })
  const page = await context.newPage()
  page.setDefaultTimeout(12000)
  const errors = []
  page.on('pageerror', e => errors.push(e.name))
  page.on('dialog', async dialog => { state.dialogs++; await dialog.accept() })
  return { page, context, state, errors }
}

async function check(name, role, mode, action) {
  const f = await fixture(role, mode)
  try {
    await action(f)
    assert.deepEqual(f.errors, [], 'unhandled browser exception')
    report.push({ name, result: 'pass' })
    console.log(`PASS ${name}`)
  } catch (error) {
    report.push({ name, result: 'fail' })
    console.log(`FAIL ${name}: ${String(error.message).slice(0, 200)}`)
  } finally { await f.context.close() }
}
const manage = async page => { await page.goto(`${origin}/question`); await page.getByRole('heading', { name: '新規問題を作成' }).waitFor(); await page.getByRole('button', { name: `${q.title}を削除`, exact: true }).waitFor() }
const learn = async page => { await page.goto(origin); await page.getByRole('heading', { name: q.title }).waitFor(); await page.getByLabel('あなたの解答').fill('const'); await page.getByRole('button', { name: '回答をチェックする' }).click() }
const writes = f => f.state.requests.filter(r => r.method !== 'GET')
try {
  let ready = false
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(origin)).ok) { ready = true; break } } catch {}
    if (server.exitCode !== null) break
    await delay(500)
  }
  assert.ok(ready, 'local Next server unavailable')
  browser = await chromium.launch({ channel: 'chrome', headless: true, timeout: 15000 })
  await check('UI-M01 guest管理フォーム非表示', 'guest', 'normal', async f => {
    await f.page.goto(`${origin}/question`)
    await f.page.getByRole('heading', { name: '問題管理は管理者専用です' }).waitFor()
    assert.equal(await f.page.getByRole('button', { name: '問題を作成する' }).count(), 0)
    assert.equal(writes(f).length, 0)
  })
  await check('UI-M02 管理者の削除確認と成功表示', 'admin', 'normal', async f => {
    await manage(f.page)
    await f.page.getByRole('button', { name: `${q.title}を削除`, exact: true }).click()
    await f.page.getByText('問題を削除しました。', { exact: true }).waitFor()
    assert.equal(f.state.questions.length, 0)
    assert.equal(f.state.dialogs, 1)
    assert.equal(writes(f).length, 1)
  })
  for (const [mode, label, message] of [
    ['fk', 'UI-M03 FK拒否', '学習履歴がある問題は削除できません。'],
    ['zero', 'UI-M04 0件削除', '対象の問題を変更できませんでした。権限や一覧を確認してください。'],
    ['network', 'UI-M05 通信失敗', '通信または操作に失敗しました。結果を一覧で確認してから再試行してください。'],
    ['denied', 'UI-M06 権限拒否', '操作する権限を確認できません。権限情報を更新するか、もう一度ログインしてください。'],
  ]) await check(label, 'admin', mode, async f => {
    await manage(f.page)
    await f.page.getByRole('button', { name: `${q.title}を削除`, exact: true }).click()
    await f.page.getByRole('alert').filter({ hasText: message }).waitFor()
    assert.equal(f.state.questions.length, 1)
    assert.equal(writes(f).length, 1)
    assert.equal(await f.page.getByText('問題を削除しました。', { exact: true }).count(), 0)
    assert.ok(!(await f.page.locator('body').innerText()).includes('private fixture detail'))
  })
  await check('UI-M07 0件更新は成功表示しない', 'admin', 'zero', async f => {
    await manage(f.page)
    await f.page.getByRole('button', { name: `${q.title}を編集`, exact: true }).click()
    await f.page.getByLabel('問題タイトル').fill('変更後のタイトル')
    await f.page.getByRole('button', { name: '変更を保存する' }).click()
    await f.page.getByRole('alert').filter({ hasText: '対象の問題を変更できませんでした。' }).waitFor()
    assert.equal(f.state.questions[0].title, q.title)
    assert.equal(writes(f).length, 1)
  })
  await check('UI-M08 進捗取得失敗中は判定のみで保存しない', 'learner', 'progress-load', async f => {
    await learn(f.page)
    await f.page.getByText('正解です！', { exact: true }).waitFor()
    await f.page.getByRole('alert').filter({ hasText: '回答は判定のみで保存しません' }).waitFor()
    assert.equal(writes(f).length, 0)
  })
  await check('UI-M09 保存応答不明→明示再試行で重複せず保存表示', 'learner', 'response-lost', async f => {
    await learn(f.page)
    await f.page.getByRole('button', { name: '保存を再試行', exact: true }).waitFor()
    assert.equal(f.state.progress.length, 1)
    assert.equal(writes(f).length, 1)
    assert.equal(await f.page.getByText('正解と学習進捗を保存しました。', { exact: true }).count(), 0)
    await f.page.getByRole('button', { name: '保存を再試行', exact: true }).click()
    await f.page.getByText('正解と学習進捗を保存しました。', { exact: true }).waitFor()
    assert.equal(f.state.progress.length, 1)
    assert.deepEqual(writes(f).map(r => r.method), ['POST', 'PATCH'])
  })
  console.log(JSON.stringify({ environment: 'local browser + API mocks; no real DB', pass: report.filter(r => r.result === 'pass').length, fail: report.filter(r => r.result === 'fail').length }))
  process.exitCode = report.some(r => r.result === 'fail') ? 1 : 0
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
