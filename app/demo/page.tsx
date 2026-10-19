'use client'

import { useState } from 'react'
import { Code2, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isCorrectAnswer } from '@/lib/learning'
import { emptyQuestionForm, questionToForm, validateQuestionForm, questionErrorMessage } from '@/lib/questions'
import type { Question, QuestionForm } from '@/lib/questions'

const initialQuestions: Question[] = [
  { id: 'demo-html', category: 'HTML', title: '見出しをつくろう', question_text: 'いちばん大きな見出しで「Hello」を表示してください。', answer_code: '<h1>Hello</h1>', explanation: 'h1はページの主題を表す見出しです。開始タグと終了タグで文字を囲みます。', created_at: null },
  { id: 'demo-css', category: 'CSS', title: '文字に色をつけよう', question_text: '文字の色を青にするCSSの宣言を書いてください。', answer_code: 'color: blue;', explanation: 'colorで文字色を指定し、セミコロンで宣言を区切ります。', created_at: null },
  { id: 'demo-js', category: 'JavaScript', title: '定数のキーワード', question_text: '再代入できない変数を宣言するキーワードを書いてください。', answer_code: 'const', explanation: 'constは変数への再代入を防ぎます。オブジェクトの中身を凍結するものではありません。', created_at: null },
]

export default function DemoPage() {
  const [questions, setQuestions] = useState(initialQuestions)
  const [selected, setSelected] = useState('demo-html')
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<boolean | null>(null)
  const [completed, setCompleted] = useState<string[]>([])
  const [admin, setAdmin] = useState(false)
  const [draft, setDraft] = useState<QuestionForm>(emptyQuestionForm)
  const [editing, setEditing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const question = questions.find(row => row.id === selected) ?? questions[0]

  function select(id: string) {
    setSelected(id)
    setAnswer('')
    setResult(null)
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const fields = validateQuestionForm(draft)
      const id = editing ?? `demo-${crypto.randomUUID()}`
      setQuestions(current => editing ? current.map(row => row.id === editing ? { ...row, ...fields } : row) : [...current, { ...fields, id, created_at: null }])
      select(id)
      setCompleted(current => current.filter(value => value !== id))
      setDraft(emptyQuestionForm())
      setEditing(null)
      setNotice(editing ? 'デモ内の問題を更新しました。' : 'デモ内に問題を作成しました。')
    } catch (cause) {
      setError(questionErrorMessage(cause))
    }
  }

  return <main className="min-h-screen bg-[#f7f9fc] px-5 py-10 text-slate-900 sm:py-14">
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600">CodeStep Demo</p>
        <h1 className="text-3xl font-bold">まずは一問、体験しよう。</h1>
        <p className="text-sm leading-7 text-slate-600">登録不要で回答・解説・問題管理を試せます。この画面のデータはサンプルで、変更はこの画面を開いている間だけ有効です。</p>
        <p className="text-xs text-slate-500">実際のメール認証・DB保存・権限制御は、通常の学習画面と管理画面で動作します。</p>
      </div>
      <div className="flex flex-wrap items-center gap-3" aria-label="デモの表示切り替え">
        <Button onClick={() => { setAdmin(false); setDeleting(null) }} aria-pressed={!admin}>学習を体験</Button>
        <Button onClick={() => setAdmin(true)} aria-pressed={admin}>問題管理を体験</Button>
        <button type="button" className="text-sm text-slate-600 underline" onClick={() => {
          setQuestions(initialQuestions); select('demo-html'); setCompleted([]); setDraft(emptyQuestionForm()); setEditing(null); setDeleting(null); setError(''); setNotice('デモを最初の状態に戻しました。')
        }}>最初に戻す</button>
      </div>
      {notice && <p role="status" className="text-sm text-blue-700">{notice}</p>}
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      {admin ? <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8" aria-labelledby="demo-admin-title">
        <h2 id="demo-admin-title" className="text-xl font-bold">サンプル問題の管理</h2>
        <form onSubmit={save} className="space-y-4">
          <label className="block text-sm font-bold">カテゴリ<select className="mt-2 block w-full rounded-xl border p-3" value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value as QuestionForm['category'] })}>
            {['HTML', 'CSS', 'JavaScript'].map(value => <option key={value}>{value}</option>)}
          </select></label>
          {([['title', 'タイトル'], ['question_text', '問題文'], ['answer_code', '正解コード'], ['explanation', '解説']] as const).map(([key, label]) => <label key={key} className="block text-sm font-bold">{label}
            <textarea required rows={key === 'title' ? 1 : 2} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} className="mt-2 block w-full rounded-xl border p-3 font-normal" />
          </label>)}
          <div className="flex flex-wrap gap-3"><Button type="submit">{editing ? '変更を保存' : '問題を作成'}</Button>
            {editing && <Button type="button" onClick={() => { setEditing(null); setDraft(emptyQuestionForm()) }}>編集をやめる</Button>}</div>
        </form>
        <ul className="divide-y">{questions.map(row => <li key={row.id} className="space-y-3 py-4">
          <p className="break-words font-bold">{row.title}</p>
          <div className="flex flex-wrap gap-4">
            <button className="text-sm text-blue-700 underline" onClick={() => { setEditing(row.id); setDraft(questionToForm(row)); setError(''); setNotice(''); setDeleting(null) }}>「{row.title}」を編集</button>
            <button className="text-sm text-rose-700 underline" onClick={() => setDeleting(row.id)}>「{row.title}」を削除</button>
          </div>
          {deleting === row.id && <div role="group" aria-label="削除の確認" className="space-y-3 rounded-xl bg-rose-50 p-4">
            <p className="text-sm">このサンプル問題とデモ内のクリア状態を削除しますか？</p>
            <div className="flex flex-wrap gap-3"><Button onClick={() => {
              setQuestions(current => current.filter(value => value.id !== row.id)); setCompleted(current => current.filter(value => value !== row.id)); setDeleting(null); setResult(null); setAnswer(''); setNotice('デモ内の問題を削除しました。')
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
            <label className="block text-sm font-bold">回答コード<textarea required value={answer} onChange={e => { setAnswer(e.target.value); setResult(null) }} rows={4} spellCheck={false} className="mt-2 block w-full rounded-xl border bg-slate-50 p-4 font-mono text-base font-normal" /></label>
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
