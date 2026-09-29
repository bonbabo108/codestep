'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, CheckCircle2, Code2, FilePlus2, Pencil, Plus, Trash2, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Category = 'HTML' | 'CSS' | 'JavaScript'
type Question = { id: number; category: Category; title: string; prompt: string; answer: string; explanation: string; cleared: boolean }

const initialQuestions: Question[] = [
  { id: 1, category: 'HTML', title: '見出しタグの基本', prompt: '最も重要な大見出しを表すタグを半角で記述してください。', answer: '<h1>', explanation: 'h1はページの中で最も重要な見出しを表します。', cleared: true },
  { id: 2, category: 'CSS', title: '文字色を変えるプロパティ', prompt: '文字の色を指定するCSSプロパティ名を記述してください。', answer: 'color', explanation: 'colorプロパティでテキストの色を指定できます。', cleared: false },
  { id: 3, category: 'JavaScript', title: '定数を作るキーワード', prompt: '値を再代入できない変数を宣言するキーワードを記述してください。', answer: 'const', explanation: 'constは値を再代入しない定数を宣言します。', cleared: true },
]

const categoryClass: Record<Category, string> = { HTML: 'bg-orange-50 text-orange-700 ring-orange-200', CSS: 'bg-blue-50 text-blue-700 ring-blue-200', JavaScript: 'bg-amber-50 text-amber-700 ring-amber-200' }

export default function QuestionAdminPage() {
  const [questions, setQuestions] = useState(initialQuestions)
  const [form, setForm] = useState({ category: 'HTML' as Category, title: '', prompt: '', answer: '', explanation: '' })

  function updateField(field: keyof typeof form, value: string) { setForm((current) => ({ ...current, [field]: value })) }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.title.trim() || !form.prompt.trim() || !form.answer.trim() || !form.explanation.trim()) return
    setQuestions((current) => [...current, { ...form, id: Date.now(), cleared: false }])
    setForm({ category: 'HTML', title: '', prompt: '', answer: '', explanation: '' })
  }
  function remove(id: number) { setQuestions((current) => current.filter((question) => question.id !== id)) }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex h-18 max-w-[1440px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight"><span className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white"><Code2 className="size-5" /></span><span className="text-lg">CodeStep <span className="font-medium text-slate-400">管理画面</span></span></Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-1.5 pr-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-blue-100 text-blue-700"><UserRound className="size-4" /></span>
              <span className="text-sm font-semibold text-slate-700">テストユーザー</span>
            </div>
            <Link href="/" className="group hidden items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 sm:flex"><ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" /> 学習画面へ戻る</Link>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1440px] gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(320px,40%)_1fr] lg:gap-8 lg:py-10">
        <section className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_45px_-25px_rgba(30,64,175,0.22)] sm:p-8">
          <div className="mb-7 flex items-start gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><FilePlus2 className="size-5" /></div><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Create</p><h1 className="mt-1 text-xl font-bold">新規問題を作成</h1></div></div>
          <form onSubmit={submit} className="flex flex-col gap-5">
            <Field label="カテゴリ"><select value={form.category} onChange={(event) => updateField('category', event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"><option>HTML</option><option>CSS</option><option>JavaScript</option></select></Field>
            <Field label="問題タイトル"><input value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="例：リンクの作り方" className="field-input" /></Field>
            <Field label="問題文"><textarea value={form.prompt} onChange={(event) => updateField('prompt', event.target.value)} placeholder="学習者への質問を入力してください" className="field-input min-h-24 resize-y py-3" /></Field>
            <Field label="正解コード"><input value={form.answer} onChange={(event) => updateField('answer', event.target.value)} placeholder="例：<a>" className="field-input font-mono" /></Field>
            <Field label="初心者向けワンストップ解説"><textarea value={form.explanation} onChange={(event) => updateField('explanation', event.target.value)} placeholder="答えの理由やポイントを丁寧に解説してください" className="field-input min-h-28 resize-y py-3" /></Field>
            <Button type="submit" className="mt-1 h-12 rounded-xl bg-blue-600 font-bold shadow-lg shadow-blue-200 hover:bg-blue-700"><Plus data-icon="inline-start" />問題を作成する</Button>
          </form>
        </section>
        <section className="min-w-0">
          <div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Question bank</p><h2 className="mt-1 text-xl font-bold">登録済み問題一覧 <span className="ml-1 text-sm font-medium text-slate-400">({questions.length}件)</span></h2></div></div>
          <div className="flex max-h-[calc(100vh-190px)] flex-col gap-3 overflow-y-auto pr-1">
            {questions.map((question) => <article key={question.id} className="rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md sm:p-6"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${categoryClass[question.category]}`}>{question.category}</span><h3 className="mt-3 truncate text-base font-bold">{question.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{question.prompt}</p><div className={`mt-4 inline-flex items-center gap-1.5 text-xs font-bold ${question.cleared ? 'text-emerald-600' : 'text-slate-400'}`}><CheckCircle2 className="size-4" />{question.cleared ? 'クリア済み' : '未クリア'}</div></div><div className="flex shrink-0 gap-1"><Button variant="ghost" size="icon" aria-label={`${question.title}を編集`} className="text-slate-400 hover:text-blue-600"><Pencil /></Button><Button variant="ghost" size="icon" aria-label={`${question.title}を削除`} onClick={() => remove(question.id)} className="text-slate-400 hover:text-rose-600"><Trash2 /></Button></div></div></article>)}
            {questions.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">登録済みの問題はありません。</div>}
          </div>
        </section>
      </div>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="flex flex-col gap-2 text-sm font-bold text-slate-700">{label}{children}</label> }
