'use client'

import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// デモの直接訪問ではAuthクライアントをロード・初期化しない。
const ApplicationShell = dynamic(() => import('@/components/ApplicationShell'), {
  loading: () => <main className="p-8" role="status">画面を準備中...</main>,
})

export default function AppShell({ children }: { children: ReactNode }) {
  const demo = usePathname() === '/demo'
  return <>
    {demo ? <>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-white p-4">
        <Link href="/" prefetch={false} className="text-xl font-bold text-slate-900">CodeStep</Link>
        <nav aria-label="デモナビゲーション"><Link href="/" prefetch={false} className="text-sm font-bold text-blue-600">実際の学習画面へ</Link></nav>
      </header>
      {children}
    </> : <ApplicationShell>{children}</ApplicationShell>}
    <footer className="flex flex-wrap items-center justify-center gap-4 border-t bg-white px-5 py-6 text-sm text-slate-600">
      <span>CodeStep · 一問ずつ、理解を積み重ねる</span>
      <Link href="/demo" className="font-bold text-blue-600 underline">登録不要の体験デモ</Link>
      <a href="https://github.com/bonbabo108/codestep" className="underline">ソース・設計資料</a>
    </footer>
  </>
}
