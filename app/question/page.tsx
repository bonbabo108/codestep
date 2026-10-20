'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/AuthProvider'
import QuestionManager from '@/components/QuestionManager'
import { supabase } from '@/lib/supabase'
import { createSupabaseQuestionRepository } from '@/lib/supabase-question-repository'

const repository = createSupabaseQuestionRepository(supabase)

export default function QuestionAdminPage() {
  const { status, isAdmin, session, revision, pending, refresh } = useAuth()
  if (status === 'loading' || pending) return <main className="p-8" role="status">権限を確認中...</main>
  if (!isAdmin) return (
    <main className="mx-auto max-w-xl space-y-4 p-8">
      <h1 className="text-xl font-bold">問題管理は管理者専用です</h1>
      <p>{status === 'error' ? 'ログイン状態を確認できません。' : '管理操作を利用するには管理者権限が必要です。'}</p>
      {session && <Button onClick={() => void refresh()}>権限情報を更新</Button>}
      <p><Link href="/admin/login" className="text-blue-600 underline">管理者ログインへ</Link></p>
      <p><Link href="/" className="text-blue-600 underline">学習画面へ戻る</Link></p>
    </main>
  )
  // JWT更新・ユーザー切替・ログアウトで古い一覧や編集中の状態を引き継がない。
  return <QuestionManager key={revision} repository={repository} />
}
