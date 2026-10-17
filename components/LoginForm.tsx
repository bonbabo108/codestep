'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Code2, ArrowRight } from 'lucide-react'
import { authenticate, authErrorMessage } from '@/lib/auth-actions'
import Link from 'next/link'
import { createOperationLock } from '@/lib/admin'
import { useAuth } from '@/components/AuthProvider'

export default function LoginForm({ adminOnly = false }: { adminOnly?: boolean }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const lock = useRef(createOperationLock())
  const router = useRouter()
  const { status, pending, session, isAdmin, error: sessionError, refresh, signOut } = useAuth()
  const unavailable = loading || status === 'loading' || pending

  useEffect(() => {
    if (adminOnly && status === 'ready' && !pending && isAdmin) router.replace('/admin')
  }, [adminOnly, status, pending, isAdmin, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (unavailable || (adminOnly && session) || !lock.current.acquire()) return
    setLoading(true)
    setError('')
    setNotice('')
    try {
      const outcome = await authenticate(supabase, email, password, !adminOnly && isSignUp)
      if (outcome === 'confirm-email') {
        setNotice('確認メールを確認してください。確認後にログインできます。')
        return
      }
      if (!adminOnly) {
        router.push('/')
        router.refresh()
      }
    } catch (cause) {
      setError(authErrorMessage(cause))
    } finally {
      if (adminOnly) setPassword('')
      lock.current.release()
      setLoading(false)
    }
  }

  if (adminOnly && (status === 'loading' || pending || isAdmin)) {
    return <main className="p-8" role="status">権限を確認中...</main>
  }

  if (adminOnly && (session || sessionError || status === 'error')) {
    return (
      <main className="mx-auto max-w-xl space-y-4 p-8">
        <h1 className="text-xl font-bold">問題管理は管理者専用です</h1>
        <p role="alert">{sessionError || (status === 'error' ? 'ログイン状態を確認できません。' : 'このアカウントには管理者権限がありません。')}</p>
        {session && <Button disabled={pending} onClick={() => void refresh()}>権限情報を更新</Button>}
        <Button disabled={pending} onClick={() => void signOut()}>{session ? 'ログアウトして別のアカウントでログイン' : 'ログアウトを再試行'}</Button>
        <p><Link href="/" className="text-blue-600 underline">学習画面へ戻る</Link></p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-blue-600 px-8 py-10 text-center">
          <div className="flex justify-center mb-4">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-md">
              <Code2 className="size-8" />
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">CodeStep</h1>
          <p className="text-blue-100 mt-2 text-sm">楽しく学ぶコーディング</p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
            {adminOnly ? '管理者ログイン' : isSignUp ? 'アカウント作成' : 'ログイン'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">メールアドレス</label>
              <input id="email" type="email" required disabled={unavailable} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition" placeholder="hello@example.com" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2">パスワード (6文字以上)</label>
              <input id="password" type="password" required minLength={6} disabled={unavailable} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition" placeholder="••••••••" />
            </div>

            {notice && <p role="status" className="text-sm text-blue-700">{notice}</p>}
            {error && <p role="alert" className="text-sm font-bold text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100 text-center">{error}</p>}

            <Button type="submit" disabled={unavailable} className="h-12 w-full rounded-xl bg-blue-600 font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50">
              {loading ? '処理中...' : unavailable ? '認証状態を確認中...' : isSignUp ? '登録して始める' : 'ログイン'}
              {!unavailable && <ArrowRight className="ml-2 size-4" />}
            </Button>
          </form>

          {!adminOnly && <div className="mt-8 text-center">
            <button type="button" disabled={unavailable} onClick={() => { setIsSignUp(!isSignUp); setError(''); setNotice('') }} className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
              {isSignUp ? 'すでにアカウントをお持ちの方はこちら' : '初めての方はこちら（新規登録）'}
            </button>
          </div>}
        </div>
      </div>
    </main>
  )
}
