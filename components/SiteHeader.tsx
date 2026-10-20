import Link from 'next/link'
import type { ReactNode } from 'react'

export default function SiteHeader({ pathname, adminHref, demo = false, children, alert }: {
  pathname: string; adminHref: string; demo?: boolean; children: ReactNode; alert?: ReactNode
}) {
  const learningHref = demo ? '/demo' : '/'
  const inAdmin = pathname.startsWith('/question') || pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/demo/admin'
  return <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-white p-4">
    <Link href={learningHref} prefetch={demo ? false : undefined} className="flex items-center gap-2 text-xl font-bold text-slate-900">CodeStep</Link>
    <nav aria-label="メインナビゲーション" className="flex flex-wrap items-center gap-4">
      <Link href="/demo" prefetch={demo ? false : undefined} className="text-sm font-bold text-blue-600 hover:underline">体験デモ</Link>
      <Link href="/demo/admin" prefetch={demo ? false : undefined} className="inline-flex min-h-11 items-center text-sm font-bold text-blue-600 hover:underline">管理画面デモ（登録不要）</Link>
      {inAdmin ? <Link href={learningHref} prefetch={demo ? false : undefined} className="text-sm font-bold text-slate-500 transition-colors hover:text-blue-600">学習画面へ戻る</Link>
        : <Link href={adminHref} prefetch={demo ? false : undefined} className="text-sm font-bold text-slate-500 transition-colors hover:text-blue-600">管理画面へ</Link>}
      {children}
    </nav>
    {alert}
  </header>
}
