'use client'

import { useState } from 'react'
import { Code2, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isCorrectAnswer } from '@/lib/learning'
import { useDemo } from '@/components/DemoProvider'

export default function DemoExperience() {
  const { revision } = useDemo()
  return <DemoLearningSession key={revision} />
}

function DemoLearningSession() {
  const { questions, completedIds: completed, repository } = useDemo()
  const [selected, setSelected] = useState('demo-html')
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<boolean | null>(null)
  const question = questions.find(row => row.id === selected) ?? questions[0]
  function select(id: string) { setSelected(id); setAnswer(''); setResult(null) }
  return <main className="demo-surface min-h-screen bg-[#f7f9fc] px-5 py-10 text-slate-900 sm:py-14">
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">まずは一問、体験しよう。</h1>
        <nav aria-label="サンプル問題" className="flex flex-wrap gap-2">{questions.map((row, index) => <button key={row.id} onClick={() => select(row.id)} aria-current={question?.id === row.id ? 'step' : undefined} className={`rounded-full border px-4 py-2 text-sm font-bold ${question?.id === row.id ? 'border-blue-600 bg-blue-600 text-white' : 'bg-white text-slate-700'}`}>{index + 1}. {row.category}{completed.includes(row.id) ? ' ✓' : ''}</button>)}</nav>
        {question ? <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="demo-question-title">
          <Code2 aria-hidden className="size-8 text-blue-600" />
          <h2 id="demo-question-title" className="text-xl font-bold">{question.title}</h2>
          <p className="whitespace-pre-wrap break-words leading-7">{question.question_text}</p>
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); const correct = isCorrectAnswer(question, answer); setResult(correct); if (correct) repository.complete(question.id) }}>
            <label className="block text-sm font-bold">回答コード<textarea required value={answer} onChange={e => { setAnswer(e.target.value); setResult(null) }} rows={4} spellCheck={false} className="demo-input mt-2 block w-full rounded-xl border bg-slate-50 p-4 font-mono text-base font-normal" /></label>
            <Button type="submit" disabled={!answer.trim()}>回答する</Button>
          </form>
          {result !== null && <p role="status" className={`font-bold ${result ? 'text-emerald-700' : 'text-rose-700'}`}>{result ? '正解です！ デモ内でクリアしました。' : 'もう一度考えてみましょう。解説も参考にできます。'}</p>}
          <details className="rounded-xl bg-blue-50 p-4"><summary className="cursor-pointer font-bold text-blue-800"><Lightbulb aria-hidden className="mr-2 inline size-4" />解説と正解を見る</summary><p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7">{question.explanation}</p><pre className="mt-3 overflow-x-auto rounded-lg bg-white p-3 text-sm"><code>{question.answer_code}</code></pre></details>
          <p className="text-xs text-slate-500">前後の空白を除いた文字列一致で判定します。入力コードは実行しません。</p>
        </section> : <p>問題がありません。「デモをリセット」で再開できます。</p>}
        <p className="text-sm text-slate-600">デモ内のクリア：{completed.length} / {questions.length} 問</p>
    </div>
  </main>
}
