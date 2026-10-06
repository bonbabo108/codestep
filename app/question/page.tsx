'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2, Code2, FilePlus2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

type Category = 'HTML' | 'CSS' | 'JavaScript'

type Question = { 
  id: string;
  category: Category; 
  title: string; 
  question_text: string;
  answer_code: string;
  explanation: string; 
  cleared?: boolean; 
}

const categoryClass: Record<Category, string> = { 
  HTML: 'bg-orange-50 text-orange-700 ring-orange-200', 
  CSS: 'bg-blue-50 text-blue-700 ring-blue-200', 
  JavaScript: 'bg-amber-50 text-amber-700 ring-amber-200' 
}

export default function QuestionAdminPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [form, setForm] = useState({ category: 'HTML' as Category, title: '', question_text: '', answer_code: '', explanation: '' })
  
  // 【追加】現在「編集モード」かどうかを判定・記憶するためのState
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchQuestions()
  }, [])

  async function fetchQuestions() {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      alert(`【通信エラーの詳細】\nメッセージ: ${error.message}\nヒント: ${error.hint || 'なし'}`)
      console.error('取得エラー詳細:', error)
    } else if (data) {
      setQuestions(data as Question[])
    }
  }

  function updateField(field: keyof typeof form, value: string) { 
    setForm((current) => ({ ...current, [field]: value })) 
  }
  
  // 【追加】「編集」ボタンが押されたとき、フォームに既存データを入れて編集モードにする関数
  function handleEdit(question: Question) {
    setForm({
      category: question.category,
      title: question.title,
      question_text: question.question_text,
      answer_code: question.answer_code,
      explanation: question.explanation,
    })
    setEditingId(question.id) // 編集中のIDを記憶
  }

  // 【追加】編集をキャンセルして、新規作成モードに戻す関数
  function cancelEdit() {
    setForm({ category: 'HTML', title: '', question_text: '', answer_code: '', explanation: '' })
    setEditingId(null)
  }

  // 【修正】追加（Insert）と更新（Update）を分岐させる
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.title.trim() || !form.question_text.trim() || !form.answer_code.trim() || !form.explanation.trim()) return

    if (editingId) {
      // ▼ Update（更新）の処理
      const { data, error } = await supabase
        .from('questions')
        .update(form)
        .eq('id', editingId)
        .select()

      if (error) {
        console.error('更新エラー:', error)
        alert('問題の更新に失敗しました。')
      } else if (data) {
        // 成功したら一覧の該当データを差し替えて、編集モードを終了
        setQuestions((current) => current.map(q => q.id === editingId ? (data[0] as Question) : q))
        cancelEdit()
        alert('問題を更新しました！')
      }
    } else {
      // ▼ Insert（新規作成）の処理
      const { data, error } = await supabase
        .from('questions')
        .insert([form])
        .select()

      if (error) {
        console.error('追加エラー:', error)
        alert('問題の追加に失敗しました。')
      } else if (data) {
        setQuestions((current) => [data[0] as Question, ...current])
        setForm({ category: 'HTML', title: '', question_text: '', answer_code: '', explanation: '' })
        alert('問題を作成しました！')
      }
    }
  }

  async function remove(id: string) {
    if (!window.confirm('本当にこの問題を削除しますか？')) return;

    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました。')
    } else {
      setQuestions((current) => current.filter((question) => question.id !== id))
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-900">
      {/* 以前ここに直書きされていた <header>...</header> を丸ごと削除しました */}
     

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
          
          <form onSubmit={submit} className="flex flex-col gap-5">
            <Field label="カテゴリ">
              <select value={form.category} onChange={(event) => updateField('category', event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10">
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
                {editingId ? '変更を保存する' : '問題を作成する'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit} className="h-12 rounded-xl px-4 text-slate-500">
                  <X className="size-5" />
                </Button>
              )}
            </div>
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
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${categoryClass[question.category]}`}>{question.category}</span>
                    <h3 className="mt-3 truncate text-base font-bold">{question.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{question.question_text}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {/* 編集ボタンのonClickにhandleEditを設定 */}
                    <Button variant="ghost" size="icon" aria-label={`${question.title}を編集`} onClick={() => handleEdit(question)} className="text-slate-400 hover:text-amber-600">
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={`${question.title}を削除`} onClick={() => remove(question.id)} className="text-slate-400 hover:text-rose-600">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
            {questions.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">登録済みの問題はありません。</div>}
          </div>
        </section>
      </div>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { 
  return <label className="flex flex-col gap-2 text-sm font-bold text-slate-700">{label}{children}</label> 
}