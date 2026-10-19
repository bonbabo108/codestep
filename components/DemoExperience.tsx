'use client'

import { useRef, useState } from 'react'
import { Code2, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isCorrectAnswer } from '@/lib/learning'
import { emptyQuestionForm, questionToForm, validateQuestionForm, questionErrorMessage } from '@/lib/questions'
import { createDemoQuestions, saveDemoQuestion, deleteDemoQuestion } from '@/lib/demo'
import { createOperationLock } from '@/lib/admin'
import type { QuestionForm } from '@/lib/questions'


export default function DemoExperience({ initialAdmin = false }: { initialAdmin?: boolean }) {
  const [questions, setQuestions] = useState(createDemoQuestions)
  const [selected, setSelected] = useState('demo-html')
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<boolean | null>(null)
  const [completed, setCompleted] = useState<string[]>([])
  const [admin, setAdmin] = useState(initialAdmin)
  const [draft, setDraft] = useState<QuestionForm>(emptyQuestionForm)
  const [editing, setEditing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const saveLock = useRef(createOperationLock())
  const question = questions.find(row => row.id === selected) ?? questions[0]

  function select(id: string) {
    setSelected(id)
    setAnswer('')
    setResult(null)
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    if (!saveLock.current.acquire()) return
    setError('')
    try {
      const fields = validateQuestionForm(draft)
      const id = editing ?? `demo-${crypto.randomUUID()}`
      setQuestions(saveDemoQuestion(questions, fields, id, editing !== null))
      select(id)
      setCompleted(current => current.filter(value => value !== id))
      setDraft(emptyQuestionForm())
      setEditing(null)
      setNotice(editing ? 'デモ内の問題を更新しました。' : 'デモ内に問題を作成しました。')
      setDeleting(null)
    } catch (cause) {
      setError(questionErrorMessage(cause))
    } finally {
      saveLock.current.release()
    }
  }

  return <main className="demo-surface min-h-screen bg-[#f7f9fc] px-5 py-10 text-slate-900 sm:py-14">
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600">CodeStep Demo</p>
        <h1 className="text-3xl font-bold">{admin ? '管理画面を、登録なしで体験。' : 'まずは一問、体験しよう。'}</h1>
        <p className="text-sm leading-7 text-slate-600">サンプル問題の追加・一覧・編集・削除を試せます。変更はこの画面内だけで、再読み込みすると元に戻ります。</p>
        <p className="text-xs text-slate-500">デモでは実際のデータを変更しません。アカウント登録や管理者権限は不要です。</p>
      </div>
      <div className="flex flex-wrap items-center gap-3" aria-label="デモの表示切り替え">
        <Button onClick={() => { setAdmin(false); setDeleting(null) }} aria-pressed={!admin}>学習を体験</Button>
        <Button onClick={() => setAdmin(true)} aria-pressed={admin}>問題管理を体験</Button>
        <button type="button" className="text-sm text-slate-600 underline" onClick={() => {
          setQuestions(createDemoQuestions()); select('demo-html'); setCompleted([]); setDraft(emptyQuestionForm()); setEditing(null); setDeleting(null); setError(''); setNotice('デモを最初の状態に戻しました。')
        }}>最初に戻す</button>
      </div>
      {notice && <p role="status" className="text-sm text-blue-700">{notice}</p>}
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      {admin ? <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8" aria-labelledby="demo-admin-title">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="demo-admin-title" className="text-xl font-bold">サンプル問題の管理</h2><span className="text-sm text-slate-600">全{questions.length}問</span></div>
        <form onSubmit={save} className="space-y-4">
          <label className="block text-sm font-bold">カテゴリ<select className="demo-input mt-2 block min-h-11 w-full rounded-xl border border-slate-300 bg-white p-3 text-base" value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value as QuestionForm['category'] })}>
            {['HTML', 'CSS', 'JavaScript'].map(value => <option key={value}>{value}</option>)}
          </select></label>
          {([['title', 'タイトル'], ['question_text', '問題文'], ['answer_code', '正解コード'], ['explanation', '解説']] as const).map(([key, label]) => <label key={key} className="block text-sm font-bold">{label}
            <textarea required rows={key === 'title' ? 1 : 2} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} className="demo-input mt-2 block w-full rounded-xl border border-slate-300 bg-white p-3 text-base font-normal" />
          </label>)}
          <div className="flex flex-wrap gap-3"><Button type="submit">{editing ? '変更を保存' : '問題を作成'}</Button>
            {editing && <Button type="button" onClick={() => { setEditing(null); setDraft(emptyQuestionForm()) }}>編集をやめる</Button>}</div>
        </form>
        <ul aria-label="サンプル問題一覧" className="divide-y">{questions.map(row => <li key={row.id} className="space-y-3 py-4">
          <p className="break-words font-bold">{row.title}</p>
          <div className="flex flex-wrap gap-4">
            <button className="min-h-11 py-2 text-left text-sm text-blue-700 underline" onClick={() => { setEditing(row.id); setDraft(questionToForm(row)); setError(''); setNotice(''); setDeleting(null) }}>「{row.title}」を編集</button>
            <button className="min-h-11 py-2 text-left text-sm text-rose-700 underline" onClick={() => setDeleting(row.id)}>「{row.title}」を削除</button>
          </div>
          {deleting === row.id && <div role="group" aria-label="削除の確認" className="space-y-3 rounded-xl bg-rose-50 p-4">
            <p className="text-sm">このサンプル問題とデモ内のクリア状態を削除しますか？</p>
            <div className="flex flex-wrap gap-3"><Button onClick={() => {
              setQuestions(deleteDemoQuestion(questions, row.id)); setCompleted(current => current.filter(value => value !== row.id)); setDeleting(null); setResult(null); setAnswer(''); setNotice('デモ内の問題を削除しました。')
              if (editing === row.id) { setEditing(null); setDraft(emptyQuestionForm()) }
            }}>削除を確定</Button><Button onClick={() => setDeleting(null)}>キャンセル</Button></div>
          </div>}
        </li>)}</ul>
        {!questions.length && <p>サンプル問題がありません。作成するか「最初に戻す」を選んでください。</p>}
      </section> : <>
        <nav aria-label="サンプル問題" className="flex flex-wrap gap-2">{questions.map((row, index) => <button key={row.id} onClick={() => select(row.id)} aria-current={question?.id === row.id ? 'step' : undefined} className={`rounded-full border px-4 py-2 text-sm font-bold ${question?.id === row.id ? 'border-blue-600 bg-blue-600 text-white' : 'bg-white text-slate-700'}`}>{index + 1}. {row.category}{completed.includes(row.id) ? ' ✓' : ''}</button>)}</nav>
        {question ? <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="demo-question-title">
          <Code2 aria-hidden className="size-8 text-blue-600" />
          <h2 id="demo-question-title" className="text-xl font-bold">{question.title}</h2>
          <p className="whitespace-pre-wrap break-words leading-7">{question.question_text}</p>
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); const correct = isCorrectAnswer(question, answer); setResult(correct); if (correct) setCompleted(current => current.includes(question.id) ? current : [...current, question.id]) }}>
            <label className="block text-sm font-bold">回答コード<textarea required value={answer} onChange={e => { setAnswer(e.target.value); setResult(null) }} rows={4} spellCheck={false} className="demo-input mt-2 block w-full rounded-xl border bg-slate-50 p-4 font-mono text-base font-normal" /></label>
            <Button type="submit" disabled={!answer.trim()}>回答する</Button>
          </form>
          {result !== null && <p role="status" className={`font-bold ${result ? 'text-emerald-700' : 'text-rose-700'}`}>{result ? '正解です！ デモ内でクリアしました。' : 'もう一度考えてみましょう。解説も参考にできます。'}</p>}
          <details className="rounded-xl bg-blue-50 p-4"><summary className="cursor-pointer font-bold text-blue-800"><Lightbulb aria-hidden className="mr-2 inline size-4" />解説と正解を見る</summary><p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7">{question.explanation}</p><pre className="mt-3 overflow-x-auto rounded-lg bg-white p-3 text-sm"><code>{question.answer_code}</code></pre></details>
          <p className="text-xs text-slate-500">前後の空白を除いた文字列一致で判定します。入力コードは実行しません。</p>
        </section> : <p>問題がありません。「最初に戻す」で再開できます。</p>}
        <p className="text-sm text-slate-600">デモ内のクリア：{completed.length} / {questions.length} 問</p>
      </>}
    </div>
  </main>
}
