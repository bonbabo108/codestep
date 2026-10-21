"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import SiteHeader from '@/components/SiteHeader'

export default function Header() {
  const { session, status, isAdmin, pending, error, signOut } = useAuth()
  const pathname = usePathname()

  return (
    <SiteHeader pathname={pathname} adminHref={isAdmin ? '/admin' : '/admin/login'} alert={error && <div role="alert" className="w-full text-sm text-rose-700">{error} <button type="button" disabled={pending} onClick={() => void signOut()} className="underline">ログアウトを再試行</button></div>}>
        {status === 'loading' || (pending && !session) ? <span role="status" className="border-l pl-4 text-sm text-gray-400">Loading...</span> : session ? (
          <div className="flex items-center gap-4 border-l pl-4">
            <span className="max-w-28 truncate text-sm font-semibold text-slate-700">{session.user.email?.split('@')[0]} さん</span>
            <button type="button" disabled={pending} onClick={() => void signOut()} className="text-sm text-rose-500 hover:underline disabled:opacity-50">ログアウト</button>
          </div>
        ) : <Link href="/login" className="border-l pl-4 text-sm font-bold text-blue-600 hover:underline">ログイン</Link>}
    </SiteHeader>
  )
}
