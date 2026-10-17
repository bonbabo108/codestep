// ローカル画面 + 全API応答モック。RLS/実DB試験ではない。実資格情報は読み込まない。
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'

if (process.env.CODESTEP_LOCAL_UI_TESTS !== '1') throw Error('local UI opt-in required')
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.CODESTEP_PLAYWRIGHT_MODULE || 'playwright')
const origin = 'http://127.0.0.1:3117'
const api = 'http://127.0.0.1:54321'
const screenshotDir = process.env.CODESTEP_UI_SCREENSHOT_DIR || '/tmp/codestep-admin-entry-ui'
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/KEY|TOKEN|SECRET|PASSWORD|STAGING_CREDENTIAL/.test(k)))
Object.assign(env, { NEXT_PUBLIC_SUPABASE_URL: api, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'local-ui-fictional-key', NEXT_TELEMETRY_DISABLED: '1' })
const serverArgs = process.env.CODESTEP_UI_USE_BUILD === '1' ? ['start'] : ['dev', '--webpack']
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', ...serverArgs, '--hostname', '127.0.0.1', '--port', '3117'], { env, stdio: 'ignore' })
let browser
const report = []
const q = { id: 'local-q1', title: 'ローカル検証用の定数', question_text: '定数を宣言するキーワードは？', answer_code: 'const', explanation: 'constは再代入できません。', category: 'JavaScript', created_at: null }

async function fixture(role, mode = 'normal') {
  const context = await browser.newContext()
  const state = { questions: [{ ...q }], progress: [], requests: [], dialogs: 0 }
  const logoutGate = new Promise(resolve => { state.finishLogout = resolve })
  const loginGate = new Promise(resolve => { state.finishLogin = resolve })
  const user = { id: 'local-learner', email: 'portfolio@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: { codestep_admin: role === 'admin' || mode === 'admin-login' || mode === 'slow-login' }, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' }
  const exp = Math.floor(Date.now() / 1000) + 3600
  const enc = v => Buffer.from(JSON.stringify(v)).toString('base64url')
  const session = { access_token: `${enc({ alg: 'HS256', typ: 'JWT' })}.${enc({ sub: user.id, exp, role: 'authenticated' })}.local-fixture-signature`, refresh_token: 'local-fixture-refresh', expires_in: 3600, expires_at: exp, token_type: 'bearer', user }
  await context.addInitScript(({ role, session }) => {
    if (!sessionStorage.getItem('local-fixture-seeded')) {
      if (role !== 'guest') localStorage.setItem('sb-127-auth-token', JSON.stringify(session))
      sessionStorage.setItem('local-fixture-seeded', 'true')
    }
  }, { role, session })
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url())
    if (url.origin === origin) return route.continue()
    if (url.origin !== api) return route.abort()
    const table = url.pathname.split('/').at(-1), method = request.method()
    state.requests.push({ table, method })
    const send = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'x-supabase-api-version': '2024-01-01', 'access-control-expose-headers': 'x-supabase-api-version' }, body: JSON.stringify(body) })
    const fail = code => send({ code, message: 'private fixture detail' }, code === '23503' ? 409 : 403)
    if (url.pathname === '/auth/v1/user') return send(user)
    if (url.pathname === '/auth/v1/logout') {
      if (mode === 'slow-logout') await logoutGate
      if (mode === 'logout-error') return send({ message: 'private fixture detail' }, 500)
      return route.fulfill({ status: 204 })
    }
    if (url.pathname === '/auth/v1/signup') return send({ user, session: null })
    if (url.pathname === '/auth/v1/token') {
      if (mode === 'login-invalid') return send({ code: 'invalid_credentials', message: 'private fixture detail' }, 400)
      if (mode === 'login-network') return send({ message: 'private fixture detail' }, 503)
      if (mode === 'slow-login') await loginGate
      if (mode === 'switch-admin' && url.searchParams.get('grant_type') === 'password') user.app_metadata.codestep_admin = true
      return send(session)
    }
    const singular = (request.headers().accept || '').includes('vnd.pgrst.object')
    const rows = value => send(singular ? value[0] ?? null : value)
    if (table === 'questions') {
      if (method === 'GET') return rows(state.questions)
      if (user.app_metadata.codestep_admin !== true) return fail('42501')
      if (mode === 'network') return send({ message: 'private fixture detail' }, 503)
      if (mode === 'denied') return fail('42501')
      if (mode === 'zero') return rows([])
      const target = state.questions.filter(row => url.searchParams.get('id') === `eq.${row.id}`)
      if (method === 'DELETE') {
        if (mode === 'fk') return fail('23503')
        state.questions = state.questions.filter(row => !target.includes(row))
        return rows(target.map(row => ({ id: row.id })))
      }
      if (method === 'PATCH') { target.forEach(row => Object.assign(row, request.postDataJSON())); return rows(target) }
      if (method === 'POST') {
        const created = { id: 'local-created', created_at: null, ...request.postDataJSON() }
        state.questions.unshift(created)
        return rows([created])
      }
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
  page.on('pageerror', e => errors.push(`${e.name}: ${e.message.slice(0, 180)}`))
  page.on('dialog', async dialog => { state.dialogs++; await dialog.accept() })
  return { page, context, state, errors, user }
}

async function check(name, role, mode, action) {
  if (process.env.CODESTEP_UI_TEST_FILTER && !process.env.CODESTEP_UI_TEST_FILTER.split('|').some(term => name.includes(term))) return
  const f = await fixture(role, mode)
  try {
    await action(f)
    assert.deepEqual(f.errors, [], 'unhandled browser exception')
    report.push({ name, result: 'pass' })
    console.log(`PASS ${name}`)
  } catch (error) {
    report.push({ name, result: 'fail' })
    console.log(`FAIL ${name}: ${String(error.message).slice(0, 200)}`)
    console.log(JSON.stringify({ localUrl: f.page.url(), browserErrors: f.errors, visibleState: (await f.page.locator('body').innerText().catch(() => '')).slice(0, 400) }))
  } finally { await f.context.close() }
}
const manage = async page => { await page.goto(`${origin}/question`); await page.getByRole('heading', { name: '新規問題を作成' }).waitFor(); await page.getByRole('button', { name: `${q.title}を削除`, exact: true }).waitFor() }
const learn = async page => { await page.goto(origin); await page.getByRole('heading', { name: q.title }).waitFor(); await page.getByLabel('あなたの解答').fill('const'); await page.getByRole('button', { name: '回答をチェックする' }).click() }
const writes = f => f.state.requests.filter(r => r.method !== 'GET')
const correctMessage = '正解です！すばらしいです。'
const restoredMessage = '※前回の正解コードを復元しました'
const assertNoExtraUi = async page => {
  const text = await page.locator('body').innerText()
  assert.doesNotMatch(text, /ログインなしで学習できます|ログインすれば学習進捗が保存|回答・進捗を保存するには|正解した回答をアカウントに保存します|問題・進捗を再読み込み|一覧を再読み込み/)
}
const assertNoOverflow = async page => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'horizontal overflow')
const loginForm = async page => {
  await page.getByLabel('メールアドレス', { exact: true }).fill('portfolio@example.invalid')
  await page.getByLabel('パスワード (6文字以上)', { exact: true }).fill('local-fixture-password')
  await page.getByRole('button', { name: 'ログイン', exact: true }).click()
  await page.getByRole('button', { name: 'ログアウト', exact: true }).waitFor()
}
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
    await f.page.getByText(correctMessage, { exact: true }).waitFor()
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
  await check('UI-R01 元の学習文言・匿名正誤・DB出題・不要UIなし', 'guest', 'normal', async f => {
    await f.page.goto(origin)
    await f.page.getByRole('heading', { name: q.title, exact: true }).waitFor()
    await assertNoExtraUi(f.page)
    assert.ok(f.state.requests.some(r => r.table === 'questions' && r.method === 'GET'))
    assert.equal(await f.page.getByRole('link', { name: '管理画面へ', exact: true }).getAttribute('href'), '/admin/login')
    assert.equal(await f.page.getByText('クリア済', { exact: true }).count(), 0)
    assert.equal(await f.page.getByText(restoredMessage, { exact: true }).count(), 0)
    await f.page.getByLabel('あなたの解答').fill('let')
    await f.page.getByRole('button', { name: '回答をチェックする', exact: true }).click()
    await f.page.getByText('入力内容を見直して、正解コードをヒントにしてみてください。', { exact: true }).waitFor()
    await f.page.getByLabel('あなたの解答').fill(q.answer_code)
    await f.page.getByRole('button', { name: '回答をチェックする', exact: true }).click()
    await f.page.getByText(correctMessage, { exact: true }).waitFor()
    await f.page.getByRole('button', { name: '次の問題へ進む', exact: true }).click()
    assert.equal(await f.page.getByLabel('あなたの解答').inputValue(), '')
    assert.equal(writes(f).length, 0)
  })
  await check('UI-R02 右上管理導線→作成/編集/キャンセル→学習へ戻る', 'admin', 'normal', async f => {
    await f.page.goto(origin)
    const link = f.page.getByRole('link', { name: '管理画面へ', exact: true })
    await link.waitFor()
    assert.ok(await f.page.locator('header').getByRole('link', { name: '管理画面へ', exact: true }).isVisible())
    await link.click()
    await f.page.getByRole('heading', { name: '新規問題を作成', exact: true }).waitFor()
    await assertNoExtraUi(f.page)
    await f.page.getByLabel('問題タイトル').fill('UI復元の使い捨て問題')
    await f.page.getByLabel('問題文', { exact: true }).fill('架空の質問')
    await f.page.getByLabel('正解コード', { exact: true }).fill('test')
    await f.page.getByLabel('初心者向けワンストップ解説').fill('架空の解説')
    await f.page.getByRole('button', { name: '問題を作成する', exact: true }).click()
    await f.page.getByText('問題を作成しました。', { exact: true }).waitFor()
    await f.page.getByRole('button', { name: 'UI復元の使い捨て問題を編集', exact: true }).click()
    await f.page.getByRole('button', { name: '編集をキャンセル', exact: true }).click()
    await f.page.getByRole('heading', { name: '新規問題を作成', exact: true }).waitFor()
    await f.page.getByRole('button', { name: 'UI復元の使い捨て問題を編集', exact: true }).click()
    await f.page.getByLabel('問題タイトル').fill('UI復元の編集済み問題')
    await f.page.getByRole('button', { name: '変更を保存する', exact: true }).click()
    await f.page.getByText('問題を更新しました。', { exact: true }).waitFor()
    await f.page.getByRole('link', { name: '学習画面へ戻る', exact: true }).click()
    await f.page.getByRole('heading', { name: '今日のコーディング問題', exact: true }).waitFor()
    assert.equal(await f.page.getByRole('button', { name: '権限情報を更新', exact: true }).count(), 0)
  })
  await check('UI-R03 本人保存/再読込復元/ログアウト消去/再ログイン復元', 'learner', 'normal', async f => {
    await learn(f.page)
    await f.page.getByText('正解と学習進捗を保存しました。', { exact: true }).waitFor()
    await f.page.reload()
    await f.page.getByText(restoredMessage, { exact: true }).waitFor()
    assert.equal(await f.page.getByLabel('あなたの解答').inputValue(), q.answer_code)
    assert.ok(await f.page.getByText('クリア済', { exact: true }).isVisible())
    await assertNoExtraUi(f.page)
    assert.equal(await f.page.getByRole('link', { name: '管理画面へ', exact: true }).getAttribute('href'), '/admin/login')
    await f.page.getByRole('button', { name: 'ログアウト', exact: true }).click()
    await f.page.getByRole('link', { name: 'ログイン', exact: true }).waitFor()
    assert.equal(await f.page.getByLabel('あなたの解答').inputValue(), '')
    assert.equal(await f.page.getByText(restoredMessage, { exact: true }).count(), 0)
    await f.page.getByRole('link', { name: 'ログイン', exact: true }).click()
    await loginForm(f.page)
    await f.page.getByText(restoredMessage, { exact: true }).waitFor()
    assert.equal(f.state.progress.length, 1)
    await f.page.goto(`${origin}/question`)
    await f.page.getByRole('heading', { name: '問題管理は管理者専用です', exact: true }).waitFor()
  })
  await check('UI-R04 元の登録画面切替・確認メール案内・ログイン', 'guest', 'normal', async f => {
    await f.page.goto(`${origin}/login`)
    await f.page.getByRole('button', { name: '初めての方はこちら（新規登録）', exact: true }).click()
    await f.page.getByRole('heading', { name: 'アカウント作成', exact: true }).waitFor()
    await f.page.getByLabel('メールアドレス', { exact: true }).fill('portfolio@example.invalid')
    await f.page.getByLabel('パスワード (6文字以上)', { exact: true }).fill('local-fixture-password')
    await f.page.getByRole('button', { name: '登録して始める', exact: true }).click()
    await f.page.getByText('確認メールを確認してください。確認後にログインできます。', { exact: true }).waitFor()
    assert.ok(f.page.url().endsWith('/login'))
    await f.page.getByRole('button', { name: 'すでにアカウントをお持ちの方はこちら', exact: true }).click()
    await loginForm(f.page)
    await f.page.getByRole('heading', { name: q.title, exact: true }).waitFor()
  })
  await check('UI-R05 権限取得は専用拒否画面で維持・ログアウトで管理入口へ変更', 'learner', 'normal', async f => {
    await f.page.goto(`${origin}/question`)
    await f.page.getByRole('heading', { name: '問題管理は管理者専用です', exact: true }).waitFor()
    f.user.app_metadata.codestep_admin = true
    await f.page.getByRole('button', { name: '権限情報を更新', exact: true }).click()
    await f.page.getByRole('heading', { name: '新規問題を作成', exact: true }).waitFor()
    await f.page.getByRole('link', { name: '学習画面へ戻る', exact: true }).click()
    await f.page.getByRole('link', { name: '管理画面へ', exact: true }).waitFor()
    await f.page.getByRole('button', { name: 'ログアウト', exact: true }).click()
    await f.page.getByRole('link', { name: 'ログイン', exact: true }).waitFor()
    assert.equal(await f.page.getByRole('link', { name: '管理画面へ', exact: true }).getAttribute('href'), '/admin/login')
  })
  await check('UI-R07 ログアウト完了まではログイン導線を出さず管理操作も隠す', 'admin', 'slow-logout', async f => {
    await manage(f.page)
    await f.page.getByRole('button', { name: 'ログアウト', exact: true }).click()
    await f.page.getByText('Loading...', { exact: true }).waitFor()
    assert.equal(await f.page.getByRole('link', { name: 'ログイン', exact: true }).count(), 0)
    assert.equal(await f.page.getByRole('button', { name: '問題を作成する', exact: true }).count(), 0)
    f.state.finishLogout()
    await f.page.getByRole('link', { name: 'ログイン', exact: true }).waitFor()
    await f.page.getByRole('heading', { name: '問題管理は管理者専用です', exact: true }).waitFor()
  })
  await mkdir(screenshotDir, { recursive: true })
  for (const width of [1440, 390]) await check(`UI-R06 ${width}px学習/管理/ログイン/登録のレイアウト`, 'admin', 'normal', async f => {
    await f.page.setViewportSize({ width, height: 900 })
    await f.page.goto(origin)
    await f.page.getByRole('heading', { name: q.title, exact: true }).waitFor()
    await assertNoOverflow(f.page)
    await assertNoExtraUi(f.page)
    await f.page.screenshot({ path: `${screenshotDir}/learning-${width}.png`, fullPage: true })
    await f.page.getByRole('link', { name: '管理画面へ', exact: true }).click()
    await f.page.getByRole('button', { name: `${q.title}を削除`, exact: true }).waitFor()
    await assertNoOverflow(f.page)
    await f.page.screenshot({ path: `${screenshotDir}/admin-${width}.png`, fullPage: true })
    await f.page.getByRole('button', { name: 'ログアウト', exact: true }).click()
    await f.page.getByRole('link', { name: 'ログイン', exact: true }).waitFor()
    await f.page.goto(`${origin}/login`)
    await f.page.getByRole('heading', { name: 'ログイン', exact: true }).waitFor()
    await assertNoOverflow(f.page)
    await f.page.screenshot({ path: `${screenshotDir}/login-${width}.png`, fullPage: true })
    await f.page.getByRole('button', { name: '初めての方はこちら（新規登録）', exact: true }).click()
    await f.page.getByRole('heading', { name: 'アカウント作成', exact: true }).waitFor()
    await assertNoOverflow(f.page)
    await f.page.screenshot({ path: `${screenshotDir}/signup-${width}.png`, fullPage: true })
  })

  await check('UI-A01 未ログインの管理入口→管理者ログイン→adminで既存CRUD', 'guest', 'admin-login', async f => {
    await f.page.goto(origin)
    await f.page.getByRole('heading', { name: q.title, exact: true }).waitFor()
    await f.page.getByRole('link', { name: '管理画面へ', exact: true }).click()
    await f.page.getByRole('heading', { name: '管理者ログイン', exact: true }).waitFor()
    assert.equal(await f.page.getByRole('button', { name: /新規登録/ }).count(), 0)
    assert.ok(f.page.url().endsWith('/admin/login'))
    await loginForm(f.page)
    await f.page.waitForURL(`${origin}/admin`)
    await f.page.getByRole('heading', { name: '新規問題を作成', exact: true }).waitFor()
    await f.page.getByRole('button', { name: `${q.title}を削除`, exact: true }).click()
    await f.page.getByText('問題を削除しました。', { exact: true }).waitFor()
    assert.equal(f.state.questions.length, 0)
    assert.equal(f.state.requests.filter(r => r.table === 'signup').length, 0)
  })
  await check('UI-A02 認証済み管理者はadmin/loginから直接adminへ・再読込維持', 'admin', 'normal', async f => {
    await f.page.goto(`${origin}/admin/login`)
    await f.page.waitForURL(`${origin}/admin`)
    await f.page.getByRole('heading', { name: '新規問題を作成', exact: true }).waitFor()
    await f.page.reload()
    await f.page.getByRole('heading', { name: '新規問題を作成', exact: true }).waitFor()
    assert.equal(f.state.requests.filter(r => r.table === 'token').length, 0)
  })
  await check('UI-A03 一般ユーザーはセッション維持・本人の操作でアカウント切替', 'learner', 'switch-admin', async f => {
    await f.page.goto(origin)
    await f.page.getByRole('link', { name: '管理画面へ', exact: true }).click()
    await f.page.getByRole('alert').filter({ hasText: 'このアカウントには管理者権限がありません。' }).waitFor()
    assert.equal(writes(f).length, 0)
    assert.equal(await f.page.locator('form').count(), 0)
    await f.page.getByRole('link', { name: '学習画面へ戻る', exact: true }).last().click()
    await f.page.getByRole('button', { name: 'ログアウト', exact: true }).waitFor()
    await f.page.getByRole('link', { name: '管理画面へ', exact: true }).click()
    await f.page.getByRole('button', { name: 'ログアウトして別のアカウントでログイン', exact: true }).click()
    await f.page.getByRole('heading', { name: '管理者ログイン', exact: true }).waitFor()
    assert.equal(f.state.requests.filter(r => r.table === 'logout').length, 1)
    await loginForm(f.page)
    await f.page.waitForURL(`${origin}/admin`)
    await f.page.getByRole('heading', { name: '新規問題を作成', exact: true }).waitFor()
  })
  await check('UI-A04 専用入口で一般アカウントがログインしても管理画面を開かない', 'guest', 'normal', async f => {
    await f.page.goto(`${origin}/admin/login`)
    await loginForm(f.page)
    await f.page.getByRole('alert').filter({ hasText: 'このアカウントには管理者権限がありません。' }).waitFor()
    assert.ok(f.page.url().endsWith('/admin/login'))
    assert.equal(await f.page.getByRole('button', { name: '問題を作成する', exact: true }).count(), 0)
    assert.equal(f.state.requests.filter(r => r.table === 'logout').length, 0)
    for (const path of ['/admin', '/question']) {
      await f.page.goto(`${origin}${path}`)
      await f.page.getByRole('heading', { name: '問題管理は管理者専用です', exact: true }).waitFor()
      assert.equal(await f.page.getByRole('button', { name: '問題を作成する', exact: true }).count(), 0)
    }
    assert.equal(f.state.requests.filter(r => r.table === 'questions' && r.method !== 'GET').length, 0)
  })
  for (const [mode, message] of [
    ['login-invalid', 'メールアドレスとパスワードを確認してください。'],
    ['login-network', '認証を完了できませんでした。入力内容と通信状態を確認してください。'],
  ]) await check(`UI-A05 管理者ログイン失敗 ${mode}`, 'guest', mode, async f => {
    await f.page.goto(`${origin}/admin/login`)
    await f.page.getByLabel('メールアドレス', { exact: true }).fill('portfolio@example.invalid')
    await f.page.getByLabel('パスワード (6文字以上)', { exact: true }).fill('local-fixture-password')
    await f.page.getByRole('button', { name: 'ログイン', exact: true }).click()
    await f.page.getByRole('alert').filter({ hasText: message }).waitFor()
    assert.equal(await f.page.getByLabel('パスワード (6文字以上)', { exact: true }).inputValue(), '')
    assert.ok(f.page.url().endsWith('/admin/login'))
    assert.ok(!(await f.page.locator('body').innerText()).includes('private fixture detail'))
  })
  await check('UI-A06 管理者ログイン中の二重送信防止', 'guest', 'slow-login', async f => {
    await f.page.goto(`${origin}/admin/login`)
    await f.page.getByLabel('メールアドレス', { exact: true }).fill('portfolio@example.invalid')
    await f.page.getByLabel('パスワード (6文字以上)', { exact: true }).fill('local-fixture-password')
    await f.page.locator('form').evaluate(form => { form.requestSubmit(); form.requestSubmit() })
    await f.page.getByRole('button', { name: '処理中...', exact: true }).waitFor()
    assert.equal(await f.page.getByRole('button', { name: '処理中...', exact: true }).isDisabled(), true)
    f.state.finishLogin()
    await f.page.waitForURL(`${origin}/admin`)
    assert.equal(f.state.requests.filter(r => r.table === 'token').length, 1)
  })
  await check('UI-A07 切替ログアウト失敗時はログインフォームを出さず再試行案内', 'learner', 'logout-error', async f => {
    await f.page.goto(`${origin}/admin/login`)
    await f.page.getByRole('button', { name: 'ログアウトして別のアカウントでログイン', exact: true }).click()
    await f.page.getByRole('button', { name: 'ログアウトを再試行', exact: true }).last().waitFor()
    assert.equal(await f.page.locator('form').count(), 0)
    assert.equal(f.state.requests.filter(r => r.table === 'token').length, 0)
  })
  for (const width of [1440, 390]) await check(`UI-A08 ${width}px専用ログイン/拒否表示`, 'guest', 'normal', async f => {
    await f.page.setViewportSize({ width, height: 900 })
    await f.page.goto(origin)
    await f.page.getByRole('heading', { name: q.title, exact: true }).waitFor()
    await assertNoOverflow(f.page)
    await f.page.screenshot({ path: `${screenshotDir}/guest-learning-${width}.png`, fullPage: true })
    await f.page.getByRole('link', { name: '管理画面へ', exact: true }).click()
    await f.page.getByRole('heading', { name: '管理者ログイン', exact: true }).waitFor()
    await assertNoOverflow(f.page)
    await assertNoExtraUi(f.page)
    await f.page.screenshot({ path: `${screenshotDir}/admin-login-${width}.png`, fullPage: true })
    await loginForm(f.page)
    await f.page.getByRole('heading', { name: '問題管理は管理者専用です', exact: true }).waitFor()
    await assertNoOverflow(f.page)
    await f.page.screenshot({ path: `${screenshotDir}/admin-denied-${width}.png`, fullPage: true })
  })
  console.log(JSON.stringify({ environment: 'local browser + API mocks; no real DB', pass: report.filter(r => r.result === 'pass').length, fail: report.filter(r => r.result === 'fail').length }))
  process.exitCode = report.some(r => r.result === 'fail') ? 1 : 0
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
