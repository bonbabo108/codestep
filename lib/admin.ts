import type { Session } from '@supabase/supabase-js'

// 表示用の判定。データの操作権限は、署名済みJWTを読むDBのRLSで保証する。
export function isAdminSession(session: Session | null, now = Date.now()): boolean {
  return session !== null
    && session.user.app_metadata.codestep_admin === true
    && typeof session.expires_at === 'number'
    && session.expires_at * 1000 > now
}

// 同じセッションの再通知（タブへの復帰等）では、編集中のフォームを破棄しない。
export function sameAuthSession(left: Session | null, right: Session | null): boolean {
  if (left === null || right === null) return left === right
  return left.access_token === right.access_token
    && left.user.id === right.user.id
    && left.expires_at === right.expires_at
    && left.user.app_metadata.codestep_admin === right.user.app_metadata.codestep_admin
}

// Reactの再描画前に連打されても、同じ画面から複数の変更を送らない。
export function createOperationLock() {
  let locked = false
  return {
    acquire() {
      if (locked) return false
      locked = true
      return true
    },
    release() { locked = false },
  }
}
