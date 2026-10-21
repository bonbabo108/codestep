// ローカルUI比較専用。実Auth/DB/RLSの試験には使わない。
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { createDemoQuestions } from '../lib/demo.ts'

const appOrigin = 'http://127.0.0.1:3100'
const fixtureOrigin = 'http://127.0.0.1:54321'
const ledgerPath = join(tmpdir(), 'codestep-admin-ui-requests.json')
const controlPath = join(tmpdir(), 'codestep-admin-ui-control.json')
const requests = []
const tokens = new Map()
let questions = createDemoQuestions()
const progress = new Set(['demo-html'])
let serial = 0
let app

function checkBuild(path) {
  let dummy = false
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const full = join(path, entry.name)
    if (entry.isDirectory()) dummy = checkBuild(full) || dummy
    else if (entry.name.endsWith('.js')) {
      const content = readFileSync(full, 'utf8')
      if (['xdnmlfoblqdygsnhkxxp.supabase.co', 'ezjzgebehancbxqpgany.supabase.co'].some(host => content.includes(host))) throw new Error('Real Supabase build refused; rebuild with dummy public variables')
      dummy = content.includes(fixtureOrigin) || dummy
    }
  }
  return dummy
}
if (!checkBuild(resolve('.next/static/chunks'))) throw new Error('Dummy build required')
writeFileSync(controlPath, JSON.stringify({ delayMs: 0, failure: null }))
writeFileSync(ledgerPath, '[]')

function issue(admin) {
  const user = { id: admin ? 'fixture-admin' : 'fixture-learner', aud: 'authenticated', email: admin ? 'admin@example.invalid' : 'learner@example.invalid', app_metadata: { codestep_admin: admin }, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' }
  const access = [Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'), Buffer.from(JSON.stringify({ sub: user.id, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600, app_metadata: user.app_metadata })).toString('base64url'), Buffer.from(`fictional-signature-${++serial}`).toString('base64url')].join('.')
  tokens.set(access, user)
  return { access_token: access, refresh_token: admin ? 'fictional-admin-refresh' : 'fictional-learner-refresh', expires_in: 3600, token_type: 'bearer', user }
}

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', appOrigin)
  res.setHeader('Access-Control-Allow-Headers', 'authorization,apikey,content-type,x-client-info,x-supabase-api-version,prefer,accept-profile,content-profile')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS')
  res.setHeader('Access-Control-Expose-Headers', 'X-Supabase-Api-Version')
  res.setHeader('X-Supabase-Api-Version', '2024-01-01')
  res.setHeader('Content-Type', 'application/json')
  if (req.method === 'OPTIONS') {
    requests.push({ path: new URL(req.url, fixtureOrigin).pathname, method: 'OPTIONS', requestHeaders: req.headers['access-control-request-headers'] ?? '', status: 200 })
    writeFileSync(ledgerPath, JSON.stringify(requests)); res.end(); return
  }
  const url = new URL(req.url, fixtureOrigin)
  if (url.pathname === '/__fixture/requests') { res.end(JSON.stringify(requests)); return }
  const token = (req.headers.authorization ?? '').replace(/^Bearer /, '')
  const user = tokens.get(token)
  const isAdmin = user?.app_metadata.codestep_admin === true
  let raw = ''; for await (const chunk of req) raw += chunk
  const body = raw ? JSON.parse(raw) : {}
  const entry = { path: url.pathname, method: req.method, actor: isAdmin ? 'admin' : user ? 'learner' : 'guest', status: 0 }
  const send = (status, value) => {
    entry.status = status; requests.push(entry); writeFileSync(ledgerPath, JSON.stringify(requests))
    res.writeHead(status); res.end(JSON.stringify(value))
  }
  if (url.pathname === '/auth/v1/token') {
    if (body.grant_type || url.searchParams.get('grant_type') === 'refresh_token') { send(200, issue(body.refresh_token === 'fictional-admin-refresh')); return }
    if (!['admin@example.invalid', 'learner@example.invalid'].includes(body.email) || body.password !== 'fictional-password') { send(400, { code: 'invalid_credentials', msg: 'Fictional fixture credentials required' }); return }
    send(200, issue(body.email === 'admin@example.invalid')); return
  }
  if (url.pathname === '/auth/v1/user') { send(user ? 200 : 401, user ?? { code: 'bad_jwt' }); return }
  if (url.pathname === '/auth/v1/logout') { tokens.delete(token); send(200, {}); return }
  let control = {}
  try { control = JSON.parse(readFileSync(controlPath, 'utf8')) } catch {}
  const writing = req.method !== 'GET'
  if ((writing && !isAdmin) || control.failure === 'all' || (writing && control.failure === 'write') || (url.pathname.includes('/rpc/') && control.failure === 'delete')) { send(403, { code: '42501', message: 'Fixture rejects request' }); return }
  if (control.delayMs > 0) await new Promise(done => setTimeout(done, Math.min(control.delayMs, 5000)))
  if (url.pathname === '/rest/v1/questions') {
    const id = url.searchParams.get('id')?.replace(/^eq\./, '')
    if (req.method === 'GET') { send(200, questions); return }
    if (req.method === 'POST') {
      const row = { ...body, id: `fixture-created-${++serial}`, created_at: null }
      questions = [row, ...questions]; send(201, row); return
    }
    if (req.method === 'PATCH') {
      const row = questions.find(question => question.id === id)
      if (!row) { send(200, null); return }
      Object.assign(row, body); send(200, row); return
    }
  }
  if (url.pathname === '/rest/v1/rpc/delete_question_with_progress') {
    const id = body.p_question_id
    if (!questions.some(row => row.id === id)) { send(200, null); return }
    const has = progress.has(id)
    const deleted = body.p_confirm && (!has || body.p_delete_progress)
    if (deleted) { questions = questions.filter(row => row.id !== id); progress.delete(id) }
    send(200, { question_id: id, has_progress: has, deleted }); return
  }
  send(404, {})
})

const stop = () => {
  if (app && app.exitCode === null) { try { process.kill(-app.pid, 'SIGTERM') } catch {} }
  server.close(() => process.exit())
}
server.on('error', error => { console.error(error.code); stop() })
server.listen(54321, '127.0.0.1', () => {
  console.log('Loopback-only UI fixture. Fictional admin/learner@example.invalid; password fictional-password. No external Auth/DB.')
  console.log(`Request metadata: ${ledgerPath}; fixture scenarios: ${controlPath}`)
  app = spawn('npm', ['run', 'start', '--', '--hostname', '127.0.0.1', '--port', '3100'], { detached: true, stdio: 'inherit', env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: fixtureOrigin, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'local-test-placeholder', NEXT_TELEMETRY_DISABLED: '1' } })
  app.on('exit', () => server.close())
})
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
