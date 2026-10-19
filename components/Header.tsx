"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

export default function Header() {
  const { session, status, isAdmin, pending, error, signOut } = useAuth()
  const pathname = usePathname()

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-white p-4">
      <Link href="/" className="flex items-center gap-2 text-xl font-bold text-slate-900">CodeStep</Link>
      <nav aria-label="メインナビゲーション" className="flex flex-wrap items-center gap-4">
        <Link href="/demo" className="text-sm font-bold text-blue-600 hover:underline">体験デモ</Link>
        <Link href="/demo/admin" className="inline-flex min-h-11 items-center text-sm font-bold text-blue-600 hover:underline">管理画面デモ（登録不要）</Link>
        {pathname.startsWith('/question') || pathname === '/admin' || pathname.startsWith('/admin/') ? (
          <Link href="/" className="text-sm font-bold text-slate-500 transition-colors hover:text-blue-600">学習画面へ戻る</Link>
        ) : (
          <Link href={isAdmin ? '/admin' : '/admin/login'} className="text-sm font-bold text-slate-500 transition-colors hover:text-blue-600">管理画面へ</Link>
        )}
        {status === 'loading' || (pending && !session) ? <span role="status" className="border-l pl-4 text-sm text-gray-400">Loading...</span> : session ? (
          <div className="flex items-center gap-4 border-l pl-4">
            <span className="max-w-28 truncate text-sm font-semibold text-slate-700">{session.user.email?.split('@')[0]} さん</span>
            <button type="button" disabled={pending} onClick={() => void signOut()} className="text-sm text-rose-500 hover:underline disabled:opacity-50">ログアウト</button>
          </div>
        ) : <Link href="/login" className="border-l pl-4 text-sm font-bold text-blue-600 hover:underline">ログイン</Link>}
      </nav>
      {error && <div role="alert" className="w-full text-sm text-rose-700">{error} <button type="button" disabled={pending} onClick={() => void signOut()} className="underline">ログアウトを再試行</button></div>}
    </header>
  )
}
