'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import type { FormEvent } from 'react'
import { FilePlus2, Pencil, Trash2, X } from 'lucide-react'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/AuthProvider'
import { createOperationLock } from '@/lib/admin'
import { supabase } from '@/lib/supabase'
import { deleteQuestion, emptyQuestionForm, fetchQuestions, inspectQuestionDeletion, isCategory, isUnchanged, questionErrorMessage, questionToForm, saveQuestion } from '@/lib/questions'
import type { Category, Question, QuestionForm } from '@/lib/questions'

const categoryClass: Record<Category, string> = {
  HTML: 'bg-orange-50 text-orange-700 ring-orange-200',
  CSS: 'bg-blue-50 text-blue-700 ring-blue-200',
  JavaScript: 'bg-amber-50 text-amber-700 ring-amber-200',
}

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
  return <QuestionManager key={revision} />
}

function QuestionManager() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [form, setForm] = useState<QuestionForm>(emptyQuestionForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [deletion, setDeletion] = useState<{ question: Question; hasProgress: boolean | null; error: string; notice: string } | null>(null)
  const deletionVersion = useRef(0)
  const lock = useRef(createOperationLock())
  const lifetime = useRef<AbortController | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    lifetime.current = controller
    setLoading(true)
    setError('')
    void fetchQuestions(supabase, controller.signal).then(rows => {
      if (!controller.signal.aborted) setQuestions(rows)
    }).catch(cause => {
      if (!controller.signal.aborted) setError(questionErrorMessage(cause))
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [])

  function updateField(field: keyof QuestionForm, value: string) {
    if (field === 'category' && value !== '' && !isCategory(value)) return
    setForm(current => ({ ...current, [field]: value }))
  }

  function handleEdit(question: Question) {
    if (busy) return
    setForm(questionToForm(question))
    setEditingId(question.id)
    setError('')
    setNotice('')
  }

  function cancelEdit() {
    setForm(emptyQuestionForm())
    setEditingId(null)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const signal = lifetime.current?.signal
    if (loading || !signal || signal.aborted || !lock.current.acquire()) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const id = editingId
      const original = questions.find(q => q.id === id)
      if (original && isUnchanged(form, original)) {
        setNotice('変更内容はありません。')
        return
      }
      const saved = await saveQuestion(supabase, form, id, signal)
      if (signal.aborted) return
      setQuestions(current => id ? current.map(q => q.id === id ? saved : q) : [saved, ...current])
      cancelEdit()
      setNotice(id ? '問題を更新しました。' : '問題を作成しました。')
    } catch (cause) {
      if (!signal.aborted) setError(questionErrorMessage(cause))
    } finally {
      lock.current.release()
      if (!signal.aborted) setBusy(false)
    }
  }

  function cancelDeletion() {
    if (busy) return
    deletionVersion.current += 1
    setDeletion(null)
  }

  async function confirmDeletion(question: Question) {
    const signal = lifetime.current?.signal
    if (loading || busy || !signal || signal.aborted) return
    const version = ++deletionVersion.current
    setDeletion({ question, hasProgress: null, error: '', notice: '' })
    try {
      const result = await inspectQuestionDeletion(supabase, question.id, signal)
      if (!signal.aborted && deletionVersion.current === version) {
        setDeletion({ question, hasProgress: result.hasProgress, error: '', notice: '' })
      }
    } catch (cause) {
      if (!signal.aborted && deletionVersion.current === version) {
        setDeletion({ question, hasProgress: null, error: questionErrorMessage(cause), notice: '' })
      }
    }
  }

  async function remove() {
    const signal = lifetime.current?.signal
    if (loading || busy || !signal || signal.aborted || !deletion || deletion.hasProgress === null || deletion.error) return
    if (!lock.current.acquire()) return
    const id = deletion.question.id
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await deleteQuestion(supabase, id, signal, deletion.hasProgress)
      if (signal.aborted) return
      if (!result.deleted) {
        setDeletion({ ...deletion, hasProgress: true, notice: '学習進捗が追加されました。削除する内容をもう一度確認してください。' })
        return
      }
      setDeletion(null)
      setQuestions(current => current.filter(q => q.id !== id))
      if (editingId === id) cancelEdit()
      setNotice('問題を削除しました。')
    } catch (cause) {
      if (!signal.aborted) setDeletion({ ...deletion, error: questionErrorMessage(cause) })
    } finally {
      lock.current.release()
      if (!signal.aborted) setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-900">
      <AlertDialog.Root open={deletion !== null} onOpenChange={open => { if (!open) cancelDeletion() }}>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-slate-900/40" />
          <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%_-_2.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl sm:p-8">
            <AlertDialog.Title className="text-xl font-bold">問題を削除しますか？</AlertDialog.Title>
            <AlertDialog.Description className="mt-4 space-y-3 text-sm leading-6" render={<div />}>
              <p className="break-words font-semibold">{deletion?.question.title}</p>
              {deletion?.hasProgress === null && !deletion.error && <p role="status">学習履歴を確認中...</p>}
              {deletion?.hasProgress === true && <p className="font-bold text-rose-700">この問題に紐づく学習進捗も削除され、元に戻せません</p>}
              {deletion?.hasProgress === false && <p>この問題を削除します。元に戻せません。</p>}
            </AlertDialog.Description>
            {deletion?.notice && <p role="status" className="mt-3 text-sm text-rose-700">{deletion.notice}</p>}
            {deletion?.error && <p role="alert" className="mt-3 text-sm text-rose-700">{deletion.error}</p>}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <AlertDialog.Close render={<Button variant="outline" disabled={busy} />}>いいえ</AlertDialog.Close>
              <Button disabled={busy || deletion?.hasProgress == null || !!deletion?.error} onClick={() => void remove()} className="bg-rose-600 text-white hover:bg-rose-700">{busy ? '削除中...' : 'はい、削除する'}</Button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
      <div className="mx-auto max-w-[1440px] space-y-2 px-5 pt-5 empty:hidden" aria-live="polite">
        {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-700">{error}</p>}
        {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-emerald-700">{notice}</p>}
        {loading && <p role="status">問題を読み込み中...</p>}
      </div>
     

     <div className="mx-auto grid max-w-[1440px] gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(320px,40%)_1fr] lg:gap-8 lg:py-10">
        
        {/* 左側：フォーム領域 */}
        <section className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_45px_-25px_rgba(30,64,175,0.22)] sm:p-8">
          <div className="mb-7 flex items-start gap-3">
            <div className={`flex size-10 items-center justify-center rounded-xl ${editingId ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
              {editingId ? <Pencil className="size-5" /> : <FilePlus2 className="size-5" />}
            </div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-[0.18em] ${editingId ? 'text-amber-600' : 'text-blue-600'}`}>
                {editingId ? 'Edit' : 'Create'}
              </p>
              <h1 className="mt-1 text-xl font-bold">{editingId ? '問題を編集' : '新規問題を作成'}</h1>
            </div>
          </div>
          
          <form onSubmit={submit}>
            <fieldset disabled={busy || loading} className="flex min-w-0 flex-col gap-5">
            <Field label="カテゴリ">
              <select value={form.category} onChange={(event) => updateField('category', event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10">
                <option value="" disabled>選択してください</option>
                <option>HTML</option>
                <option>CSS</option>
                <option>JavaScript</option>
              </select>
            </Field>
            <Field label="問題タイトル">
              <input value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="例：リンクの作り方" className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
            </Field>
            <Field label="問題文">
              <textarea value={form.question_text} onChange={(event) => updateField('question_text', event.target.value)} placeholder="学習者への質問を入力してください" className="min-h-24 resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
            </Field>
            <Field label="正解コード">
              <input value={form.answer_code} onChange={(event) => updateField('answer_code', event.target.value)} placeholder="例：<a>" className="h-11 rounded-xl border border-slate-200 bg-white px-4 font-mono text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
            </Field>
            <Field label="初心者向けワンストップ解説">
              <textarea value={form.explanation} onChange={(event) => updateField('explanation', event.target.value)} placeholder="答えの理由やポイントを丁寧に解説してください" className="min-h-28 resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
            </Field>
            
            {/* 編集モードと新規作成モードでボタンを切り替え */}
            <div className="mt-1 flex gap-3">
              <Button type="submit" className={`h-12 flex-1 rounded-xl font-bold shadow-lg ${editingId ? 'bg-amber-600 shadow-amber-200 hover:bg-amber-700' : 'bg-blue-600 shadow-blue-200 hover:bg-blue-700'}`}>
                {busy ? '処理中...' : editingId ? '変更を保存する' : '問題を作成する'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit} aria-label="編集をキャンセル" className="h-12 rounded-xl px-4 text-slate-500">
                  <X className="size-5" />
                </Button>
              )}
            </div>
            </fieldset>
          </form>
        </section>

        {/* 右側：問題一覧領域 */}
        <section className="min-w-0">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Question bank</p>
              <h2 className="mt-1 text-xl font-bold">登録済み問題一覧 <span className="ml-1 text-sm font-medium text-slate-400">({questions.length}件)</span></h2>
            </div>
          </div>
          <div className="flex max-h-[calc(100vh-190px)] flex-col gap-3 overflow-y-auto pr-1">
            {questions.map((question) => (
              <article key={question.id} className={`rounded-2xl border bg-white p-5 transition-shadow hover:shadow-md sm:p-6 ${editingId === question.id ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${isCategory(question.category) ? categoryClass[question.category] : 'bg-slate-50 text-slate-600'}`}>{question.category ?? '未分類'}</span>
                    <h3 className="mt-3 truncate text-base font-bold">{question.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{question.question_text}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {/* 編集ボタンのonClickにhandleEditを設定 */}
                    <Button variant="ghost" size="icon" disabled={busy || loading} aria-label={`${question.title}を編集`} onClick={() => handleEdit(question)} className="text-slate-400 hover:text-amber-600">
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" disabled={busy || loading} aria-label={`${question.title}を削除`} onClick={() => void confirmDeletion(question)} className="text-slate-400 hover:text-rose-600">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
            {!loading && !error && questions.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">登録済みの問題はありません。</div>}
          </div>
        </section>
      </div>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { 
  return <label className="flex flex-col gap-2 text-sm font-bold text-slate-700">{label}{children}</label> 
}
