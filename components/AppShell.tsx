'use client'

import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import { DemoNotice, DemoProvider } from '@/components/DemoProvider'

// デモの直接訪問ではAuthクライアントをロード・初期化しない。
const ApplicationShell = dynamic(() => import('@/components/ApplicationShell'), {
  loading: () => <main className="p-8" role="status">画面を準備中...</main>,
})

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const demo = pathname === '/demo' || pathname === '/demo/admin'
  return <>
    {demo ? <DemoProvider>
      <SiteHeader pathname={pathname} adminHref="/demo/admin" demo><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">デモ</span></SiteHeader>
      <DemoNotice />
      {children}
    </DemoProvider> : <ApplicationShell>{children}</ApplicationShell>}
    <footer className="flex flex-wrap items-center justify-center gap-4 border-t bg-white px-5 py-6 text-sm text-slate-600">
      <span>CodeStep · 一問ずつ、理解を積み重ねる</span>
      <Link href="/demo" className="font-bold text-blue-600 underline">登録不要の体験デモ</Link>
      <Link href="/demo/admin" className="font-bold text-blue-600 underline">管理画面デモ（登録不要）</Link>
      <a href="https://github.com/bonbabo108/codestep" className="underline">ソース・設計資料</a>
    </footer>
  </>
}
