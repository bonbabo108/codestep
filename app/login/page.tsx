'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Code2, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false) // ログインか新規登録かの切り替え
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        // 【新規登録モード】
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })
        if (signUpError) throw signUpError

        // ★登録成功したら、先ほど作った profiles（プロフィール箱）にもデータを入れる
        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            name: email.split('@')[0], // 例：test@abc.com なら「test」を名前にする
          })
          if (profileError) throw profileError
        }
      } else {
        // 【ログインモード】
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
      }

      // 成功したら学習画面（トップページ）へ移動してリロード
      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました。入力内容を確認してください。')
    } finally {
      setLoading(false)
    }
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
            {isSignUp ? 'アカウント作成' : 'ログイン'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">メールアドレス</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition"
                placeholder="hello@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">パスワード (6文字以上)</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm font-bold text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100 text-center">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-blue-600 font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '処理中...' : isSignUp ? '登録して始める' : 'ログイン'}
              {!loading && <ArrowRight className="ml-2 size-4" />}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('') // 切り替え時にエラーメッセージを消す
              }}
              className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
            >
              {isSignUp ? 'すでにアカウントをお持ちの方はこちら' : '初めての方はこちら（新規登録）'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}