import test from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { restoreAuthSession } from '../lib/auth-actions.ts'

// ブラウザAPIのメモリ内fixture。実ブラウザ・メール・DBには接続しない。
// 別端末の新しいブラウザにもPKCE verifierなしで戻れるimplicit callbackを検査。
const user = { id: 'fixture-confirmed-learner', aud: 'authenticated', app_metadata: {}, user_metadata: {}, email: 'learner@example.invalid' }
function browser(url) {
  const originals = new Map(['window', 'document', 'BroadcastChannel'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  const win = { location: new URL(url), addEventListener() {}, removeEventListener() {}, history: { replaceState(_state, _title, href) { win.location = new URL(href, win.location) } } }
  Object.defineProperties(globalThis, {
    window: { configurable: true, value: win },
    document: { configurable: true, value: { visibilityState: 'hidden' } },
    BroadcastChannel: { configurable: true, value: undefined },
  })
  return { win, restore() {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  } }
}
const storageKeys = new WeakMap()
let serial = 0
function fixture(storage, fetch) {
  if (!storageKeys.has(storage)) storageKeys.set(storage, `fixture-auth-session-${++serial}`)
  return createClient('http://127.0.0.1:54321', 'fictional-test-key', {
    auth: { autoRefreshToken: false, persistSession: true, storage, storageKey: storageKeys.get(storage) },
    global: { fetch: async (input, init) => {
      const request = new Request(input, init)
      assert.equal(new URL(request.url).origin, 'http://127.0.0.1:54321', 'external requests forbidden')
      return fetch(request)
    } },
  })
}
function memoryStorage() {
  const values = new Map()
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }
}

test('新しいブラウザの確認callbackを実SDKが処理し、URLからトークンを消し、再読込相当でセッションを復元する', async () => {
  const env = browser('https://staging.example/login#access_token=fictional-callback-access&refresh_token=fictional-callback-refresh&expires_in=3600&token_type=bearer&type=signup')
  const storage = memoryStorage()
  let userRequests = 0
  try {
    const client = fixture(storage, request => {
      assert.equal(new URL(request.url).pathname, '/auth/v1/user')
      userRequests++
      return new Response(JSON.stringify(user), { headers: { 'Content-Type': 'application/json' } })
    })
    const initial = await restoreAuthSession(client)
    assert.equal(initial.user.id, user.id)
    assert.equal(env.win.location.hash, '')
    assert.equal(userRequests, 1)
    // 新クライアントは保存済みセッションを読む。メールリンクの再利用は不要。
    env.restore()
    const reloaded = fixture(storage, () => { throw new Error('unexpected network request') })
    const restored = await restoreAuthSession(reloaded)
    assert.equal(restored.user.id, user.id)
    assert.deepEqual(restored.user.app_metadata, {})
  } finally { env.restore() }
})

test('期限切れcallbackはセッションを作らず、SDKからエラーを取得できる', async () => {
  const env = browser('https://staging.example/login#error=access_denied&error_code=otp_expired&error_description=fictional')
  try {
    const client = fixture(memoryStorage(), () => { throw new Error('callback error must not call Auth') })
    await assert.rejects(restoreAuthSession(client), error => error.details.code === 'otp_expired')
    assert.equal((await client.auth.getSession()).data.session, null)
  } finally { env.restore() }
})

test('callbackのユーザー検証失敗を確認成功やログイン成功として扱わない', async () => {
  const env = browser('https://staging.example/login#access_token=fictional-invalid-access&refresh_token=fictional-invalid-refresh&expires_in=3600&token_type=bearer&type=signup')
  try {
    const client = fixture(memoryStorage(), () => new Response(JSON.stringify({ error_code: 'bad_jwt', msg: 'fictional failure' }), { status: 401, headers: { 'Content-Type': 'application/json' } }))
    await assert.rejects(restoreAuthSession(client), error => error.code === 'bad_jwt')
    assert.equal((await client.auth.getSession()).data.session, null)
  } finally { env.restore() }
})
