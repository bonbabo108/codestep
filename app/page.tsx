'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, CheckCircle2, ChevronRight, Code2, Lightbulb, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/AuthProvider'
import { createOperationLock } from '@/lib/admin'
import { supabase } from '@/lib/supabase'
import { fetchQuestions, isCategory } from '@/lib/questions'
import type { Category, Question } from '@/lib/questions'
import { fetchProgress, isCorrectAnswer, learningErrorMessage, restoredAnswer, saveCompletedProgress } from '@/lib/learning'
import type { ProgressMap } from '@/lib/learning'

const categoryClass: Record<Category, string> = {
  HTML: 'bg-orange-50 text-orange-700 ring-orange-200',
  CSS: 'bg-blue-50 text-blue-700 ring-blue-200',
  JavaScript: 'bg-amber-50 text-amber-700 ring-amber-200',
}

export default function Page() {
  const { session, status } = useAuth()
  if (status === 'loading') return <main className="p-8" role="status">ログイン状態を確認中...</main>
  const userId = session && session.expires_at && session.expires_at * 1000 > Date.now() ? session.user.id : null
  // ログアウト・別ユーザーへの切替で、個人の入力・復元データを破棄する。
  return <LearningSession key={userId ?? 'guest'} userId={userId} />
}

function LearningSession({ userId }: { userId: string | null }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [progress, setProgress] = useState<ProgressMap>({})
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [restored, setRestored] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')
  const [error, setError] = useState('')
  const [progressError, setProgressError] = useState('')
  const [saveError, setSaveError] = useState('')
  const lock = useRef(createOperationLock())
  const lifetime = useRef<AbortController | null>(null)
  const question = questions[index]

  useEffect(() => {
    const controller = new AbortController()
    lifetime.current = controller
    setLoading(true)
    setError('')
    setProgressError('')
    setSaveError('')
    void (async () => {
      try {
        const rows = await fetchQuestions(supabase, controller.signal)
        if (controller.signal.aborted) return
        let saved: ProgressMap = {}
        if (userId) {
          try {
            saved = await fetchProgress(supabase, userId, rows.map(q => q.id), controller.signal)
          } catch (cause) {
            if (!controller.signal.aborted) setProgressError(learningErrorMessage(cause, 'load'))
          }
        }
        if (controller.signal.aborted) return
        setQuestions(rows)
        setProgress(saved)
        setIndex(0)
        const previousAnswer = restoredAnswer(saved[rows[0]?.id])
        setAnswer(previousAnswer)
        setRestored(Boolean(previousAnswer))
        setResult(null)
        setSaveState('idle')
      } catch (cause) {
        if (!controller.signal.aborted) setError(learningErrorMessage(cause, 'load'))
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })()
    return () => controller.abort()
  }, [userId])

  async function persist() {
    const signal = lifetime.current?.signal
    if (!userId || !question || progressError || !signal || signal.aborted || !lock.current.acquire()) return
    setSaving(true)
    setSaveError('')
    setSaveState('idle')
    try {
      const saved = await saveCompletedProgress(supabase, userId, question, answer, signal)
      if (signal.aborted) return
      setProgress(current => ({ ...current, [saved.question_id]: saved }))
      setRestored(false)
      setSaveState('saved')
    } catch (cause) {
      if (!signal.aborted) {
        setSaveState('error')
        setSaveError(learningErrorMessage(cause))
      }
    } finally {
      lock.current.release()
      if (!signal.aborted) setSaving(false)
    }
  }

  function checkAnswer() {
    if (!question || saving || !answer.trim()) return
    const correct = isCorrectAnswer(question, answer)
    setResult(correct)
    setSaveState('idle')
    setSaveError('')
    if (correct && userId && !progressError) void persist()
  }

  function nextQuestion() {
    if (saving || !questions.length) return
    const next = (index + 1) % questions.length
    const previousAnswer = restoredAnswer(progress[questions[next].id])
    setIndex(next)
    setAnswer(previousAnswer)
    setRestored(Boolean(previousAnswer))
    setResult(null)
    setSaveState('idle')
    setSaveError('')
  }

  if (loading) return <main className="p-8" role="status">問題と学習進捗を読み込み中...</main>
  if (error) return <main className="mx-auto max-w-3xl space-y-4 p-8"><p role="alert">{error}</p></main>
  if (!question) return <main className="mx-auto max-w-3xl space-y-4 p-8"><h1 className="text-xl font-bold">公開されている問題はありません。</h1></main>

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-900">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Learning step {String(index + 1).padStart(2, '0')}</p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">今日のコーディング問題</h1>
              {progress[question.id]?.is_completed === true && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200"><CheckCircle2 className="size-4" />クリア済</span>}
            </div>
          </div>
          <div className="hidden items-center gap-1.5 text-sm text-slate-400 sm:flex"><span className="font-semibold text-slate-600">{index + 1}</span> / {questions.length}</div>
        </div>
        {progressError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">進捗を取得できないため、回答は判定のみで保存しません。{progressError}</p>}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_16px_45px_-25px_rgba(30,64,175,0.28)]">
          <div className="border-b border-slate-100 px-6 py-6 sm:px-9 sm:py-8">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${isCategory(question.category) ? categoryClass[question.category] : 'bg-slate-50 text-slate-600'}`}>{question.category ?? '未分類'}</span>
            <h2 className="mt-4 text-xl font-bold sm:text-2xl">{question.title}</h2>
          </div>
          <div className="flex flex-col gap-7 px-6 py-7 sm:px-9 sm:py-9">
            <div className="rounded-2xl bg-slate-50 px-5 py-5 sm:px-6"><p className="mb-2 text-xs font-bold tracking-wide text-blue-600">QUESTION</p><p className="text-base leading-7 text-slate-700">Q. {question.question_text}</p></div>
            <div aria-live="polite" className="space-y-2 text-sm empty:hidden">
              {restored && <p className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-blue-800"><span className="font-bold">※前回の正解コードを復元しました</span><span className="ml-2 text-blue-600">学習進捗はアカウントに同期されています。</span></p>}
              {saving && <p role="status">正解を保存中...</p>}
              {saveState === 'saved' && <p role="status" className="text-emerald-700">正解と学習進捗を保存しました。</p>}
              {saveError && <div role="alert" className="space-y-2 rounded-xl bg-rose-50 p-3 text-rose-700"><p>今回の回答の保存を確認できません。{saveError}</p><Button variant="outline" disabled={saving} onClick={() => void persist()}>保存を再試行</Button></div>}
            </div>
            <div className="flex flex-col gap-2.5">
              <label htmlFor="answer" className="text-sm font-bold text-slate-700">あなたの解答</label>
              <input id="answer" disabled={saving} value={answer} onChange={event => { setAnswer(event.target.value); setResult(null); setRestored(false); setSaveState('idle'); setSaveError('') }} onKeyDown={event => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) checkAnswer() }} placeholder="解答コードを入力（例: <h1>）" className="h-13 rounded-xl border border-slate-200 bg-white px-4 font-mono text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50" />
            </div>
            <Button onClick={checkAnswer} disabled={saving || !answer.trim()} className="h-12 w-full rounded-xl bg-blue-600 font-bold shadow-lg shadow-blue-200 hover:bg-blue-700">回答をチェックする <ChevronRight data-icon="inline-end" /></Button>
            {result !== null && (
              <div className={`rounded-2xl border p-5 sm:p-6 ${result ? 'border-emerald-200 bg-emerald-50/70' : 'border-rose-200 bg-rose-50/70'}`}>
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-white ${result ? 'bg-emerald-500' : 'bg-rose-500'}`}>{result ? <Check className="size-5" /> : <X className="size-5" />}</span>
                  <div>
                    <p className={`font-bold ${result ? 'text-emerald-800' : 'text-rose-800'}`}>{result ? '正解です！すばらしいです。' : 'もう一度考えてみましょう。'}</p>
                    {!result && <p className="mt-1 text-sm text-rose-700">入力内容を見直して、正解コードをヒントにしてみてください。</p>}
                  </div>
                </div>
                <div className="mt-5 border-t border-current/10 pt-5">
                  <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-slate-500"><Code2 className="size-4" /> 正解コード</p>
                  <code className="mt-2 block whitespace-pre-wrap rounded-lg bg-slate-900 px-4 py-3 font-mono text-sm text-blue-200">{question.answer_code}</code>
                  <p className="mt-5 flex items-start gap-2 text-sm leading-7 text-slate-700"><Lightbulb className="mt-1 size-4 shrink-0 text-amber-500" /><span><strong className="text-slate-900">初心者向けワンストップ解説</strong><br />{question.explanation || 'この問題の解説はまだ登録されていません。'}</span></p>
                </div>
                <Button onClick={nextQuestion} disabled={saving} variant="outline" className="mt-6 w-full rounded-xl border-slate-300 bg-white font-bold hover:bg-slate-50">{saveState === 'error' ? '今回の保存を確認せず次へ進む' : '次の問題へ進む'} <ArrowRight data-icon="inline-end" /></Button>
              </div>
            )}
          </div>
        </section>
        <p className="flex items-center justify-center gap-2 text-xs text-slate-400"><RotateCcw className="size-3.5" /> 自分のペースで、少しずつ進めよう</p>
      </div>
    </main>
  )
}
