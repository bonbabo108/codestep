import test from 'node:test'
import assert from 'node:assert/strict'
import { isAdminSession, sameAuthSession, createOperationLock } from '../lib/admin.ts'

const now = 1_000_000
const session = (flag, expiry = now / 1000 + 60) => ({
  user: { app_metadata: { codestep_admin: flag }, user_metadata: { codestep_admin: true } },
  expires_at: expiry,
})

test('未ログインと一般ユーザーには管理権限を表示しない', () => {
  assert.equal(isAdminSession(null, now), false)
  for (const flag of [undefined, false, 'true', 1, {}, []]) {
    assert.equal(isAdminSession(session(flag), now), false)
  }
})

test('有効なセッションのapp_metadataのboolean trueだけを許可する', () => {
  assert.equal(isAdminSession(session(true), now), true)
})

test('期限切れ・有効期限不明のセッションは許可しない', () => {
  assert.equal(isAdminSession(session(true, now / 1000), now), false)
  assert.equal(isAdminSession(session(true, now / 1000 - 1), now), false)
  assert.equal(isAdminSession({ ...session(true), expires_at: undefined }, now), false)
})

test('一般ユーザーのuser_metadataを書き換えても管理者扱いしない', () => {
  assert.equal(isAdminSession(session(false), now), false)
})

test('権限更新・解除後の新しいセッションで判定が変わる', () => {
  assert.equal(isAdminSession(session(true), now), true)
  assert.equal(isAdminSession(session(false), now), false)
  // 古いJWT自体を無効化するテストではない。実際の失効はDB検証が必要。
})

test('連打を同期的に拒否し、完了後に再試行できる', () => {
  const lock = createOperationLock()
  assert.equal(lock.acquire(), true)
  assert.equal(lock.acquire(), false)
  lock.release()
  assert.equal(lock.acquire(), true)
})

test('同じセッションの再通知と、権限やJWTの変更を区別する', () => {
  const first = { ...session(true), access_token: 'fictional-test-value' }
  assert.equal(sameAuthSession(first, structuredClone(first)), true)
  assert.equal(sameAuthSession(first, { ...first, access_token: 'fictional-refreshed-value' }), false)
  assert.equal(sameAuthSession(first, { ...session(false), access_token: first.access_token }), false)
  assert.equal(sameAuthSession(first, null), false)
  assert.equal(sameAuthSession(null, null), true)
})
