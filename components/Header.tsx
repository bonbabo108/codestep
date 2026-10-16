"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

export default function Header() {
  const { session, status, isAdmin, pending, error, refresh, signOut } = useAuth()
  const pathname = usePathname()

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-white p-4">
      <Link href="/" className="text-xl font-bold text-slate-900">CodeStep</Link>
      <nav aria-label="メインナビゲーション" className="flex flex-wrap items-center gap-4 text-sm">
        {pathname.startsWith('/question') ? (
          <Link href="/" className="font-bold text-slate-500 hover:text-blue-600">学習画面へ戻る</Link>
        ) : isAdmin ? (
          <Link href="/question" className="font-bold text-slate-500 hover:text-blue-600">管理画面へ</Link>
        ) : null}
        {status === 'loading' ? <span role="status">ログイン状態を確認中...</span> : session ? (
          <>
            <span className="font-semibold text-slate-700">ログイン中</span>
            <button type="button" disabled={pending} onClick={() => void refresh()} className="text-blue-600 hover:underline disabled:opacity-50">権限情報を更新</button>
            <button type="button" disabled={pending} onClick={() => void signOut()} className="text-rose-500 hover:underline disabled:opacity-50">ログアウト</button>
          </>
        ) : <Link href="/login" className="font-bold text-blue-600 hover:underline">ログイン</Link>}
      </nav>
      {error && <div role="alert" className="w-full text-sm text-rose-700">{error} <button type="button" disabled={pending} onClick={() => void signOut()} className="underline">ログアウトを再試行</button></div>}
    </header>
  )
}
