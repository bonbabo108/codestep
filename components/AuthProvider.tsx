'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { isAdminSession, sameAuthSession } from '@/lib/admin'

type AuthState = {
  session: Session | null
  status: 'loading' | 'ready' | 'error'
  revision: number
}

type AuthContextValue = AuthState & {
  isAdmin: boolean
  pending: boolean
  error: string
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ session: null, status: 'loading', revision: 0 })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const eventVersion = useRef(0)
  const alive = useRef(false)
  const actionPending = useRef(false)
  const latestSession = useRef<Session | null>(null)

  const applySession = useCallback((session: Session | null, status: AuthState['status'] = 'ready') => {
    if (!alive.current) return
    eventVersion.current += 1
    latestSession.current = session
    setAuth(current => ({ session, status, revision: current.revision + (sameAuthSession(current.session, session) ? 0 : 1) }))
    if (status === 'ready') setError('')
  }, [])

  useEffect(() => {
    alive.current = true
    let active = true
    // コールバック内では別のAuth APIをawaitしない。
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) applySession(session)
    })
    const version = eventVersion.current
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active || eventVersion.current !== version) return
      applySession(sessionError ? null : data.session, sessionError ? 'error' : 'ready')
      if (sessionError) setError('ログイン状態を確認できません。再読み込みしてください。')
    }).catch(() => {
      if (!active || eventVersion.current !== version) return
      applySession(null, 'error')
      setError('ログイン状態を確認できません。再読み込みしてください。')
    })
    return () => {
      active = false
      alive.current = false
      subscription.unsubscribe()
    }
  }, [applySession])

  useEffect(() => {
    if (!auth.session?.expires_at) return
    // 自動更新できず期限切れになったJWTで、管理フォームを表示し続けない。
    const expiresAt = auth.session.expires_at
    const token = auth.session.access_token
    let timer: ReturnType<typeof setTimeout>
    function checkExpiry() {
      if (latestSession.current?.access_token !== token || latestSession.current.expires_at !== expiresAt) return
      const remaining = expiresAt * 1000 - Date.now()
      if (remaining > 0) {
        timer = setTimeout(checkExpiry, Math.min(remaining + 10, 2_147_483_647))
        return
      }
      applySession(null)
      setError('セッションの有効期限が切れました。もう一度ログインしてください。')
    }
    timer = setTimeout(checkExpiry, Math.min(Math.max(expiresAt * 1000 - Date.now() + 10, 0), 2_147_483_647))
    return () => clearTimeout(timer)
  }, [auth.session, applySession])

  async function refresh() {
    if (actionPending.current) return
    actionPending.current = true
    setPending(true)
    setError('')
    const version = eventVersion.current
    try {
      const { data, error: refreshError } = await supabase.auth.refreshSession()
      if (!alive.current) return
      if (refreshError) throw refreshError
      if (eventVersion.current === version) applySession(data.session)
    } catch {
      if (alive.current && eventVersion.current === version) {
        applySession(null, 'error')
        setError('権限情報を更新できませんでした。もう一度ログインしてください。')
      }
    } finally {
      actionPending.current = false
      if (alive.current) setPending(false)
    }
  }

  async function signOut() {
    if (actionPending.current) return
    actionPending.current = true
    setPending(true)
    setError('')
    // 通信中も管理操作を隠す。失敗しても古い管理画面へ戻さない。
    applySession(null)
    try {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
    } catch {
      if (alive.current) {
        setError('ログアウトを完了できませんでした。再試行してください。')
      }
    } finally {
      actionPending.current = false
      if (alive.current) setPending(false)
    }
  }

  return (
    <AuthContext.Provider value={{ ...auth, isAdmin: !pending && isAdminSession(auth.session), pending, error, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('AuthProviderが必要です。')
  return auth
}
