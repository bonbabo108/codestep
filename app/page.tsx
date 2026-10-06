'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, Check, CheckCircle2, ChevronRight, Code2, Lightbulb, RotateCcw, UserRound, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Question = {
  category: 'HTML' | 'CSS' | 'JavaScript'
  title: string
  prompt: string
  answer: string
  explanation: string
}

const questions: Question[] = [
  {
    category: 'HTML',
    title: '見出しタグの基本',
    prompt: '最も重要な大見出しを表すタグを半角で記述してください。',
    answer: '<h1>',
    explanation: 'HTMLでは、見出しの重要度を h1 から h6 までのタグで表します。h1 はページの中で最も重要な見出しなので、通常はページのタイトルなどに一度使います。タグは半角の小文字で書くのが基本です。',
  },
  {
    category: 'CSS',
    title: '文字色を変えるプロパティ',
    prompt: '文字の色を指定するCSSプロパティ名を記述してください。',
    answer: 'color',
    explanation: 'CSSの color プロパティは、テキストの色を指定します。たとえば color: blue; のように、プロパティ名のあとにコロンと値を続けて書きます。',
  },
  {
    category: 'JavaScript',
    title: '定数を作るキーワード',
    prompt: '値を再代入できない変数を宣言するキーワードを記述してください。',
    answer: 'const',
    explanation: 'const は、あとから別の値を代入しない定数を宣言するキーワードです。値を変更する必要がある場合は let を使います。',
  },
]

const categoryClass: Record<Question['category'], string> = {
  HTML: 'bg-orange-50 text-orange-700 ring-orange-200',
  CSS: 'bg-blue-50 text-blue-700 ring-blue-200',
  JavaScript: 'bg-amber-50 text-amber-700 ring-amber-200',
}

export default function Page() {
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<boolean | null>(null)
  const question = questions[index]

  function checkAnswer() {
    setResult(answer.trim().toLowerCase() === question.answer.toLowerCase())
  }

  function nextQuestion() {
    setIndex((current) => (current + 1) % questions.length)
    setAnswer('')
    setResult(null)
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-900">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Learning step {String(index + 1).padStart(2, '0')}</p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">今日のコーディング問題</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200"><CheckCircle2 className="size-4" />クリア済</span>
            </div>
          </div>
          <div className="hidden items-center gap-1.5 text-sm text-slate-400 sm:flex"><span className="font-semibold text-slate-600">{index + 1}</span> / {questions.length}</div>
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_16px_45px_-25px_rgba(30,64,175,0.28)]">
          <div className="border-b border-slate-100 px-6 py-6 sm:px-9 sm:py-8">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${categoryClass[question.category]}`}>{question.category}</span>
            <h2 className="mt-4 text-xl font-bold sm:text-2xl">{question.title}</h2>
          </div>
          <div className="flex flex-col gap-7 px-6 py-7 sm:px-9 sm:py-9">
            <div className="rounded-2xl bg-slate-50 px-5 py-5 sm:px-6">
              <p className="mb-2 text-xs font-bold tracking-wide text-blue-600">QUESTION</p>
              <p className="text-base leading-7 text-slate-700">Q. {question.prompt}</p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-800">
              <span className="font-bold">※前回の正解コードを復元しました</span><span className="ml-2 text-blue-600">学習進捗はアカウントに同期されています。</span>
            </div>
            <div className="flex flex-col gap-2.5">
              <label htmlFor="answer" className="text-sm font-bold text-slate-700">あなたの解答</label>
              <input id="answer" value={answer} onChange={(event) => { setAnswer(event.target.value); setResult(null) }} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) checkAnswer() }} placeholder="解答コードを入力（例: <h1>）" className="h-13 rounded-xl border border-slate-200 bg-white px-4 font-mono text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
            </div>
            <Button onClick={checkAnswer} disabled={!answer.trim()} className="h-12 w-full rounded-xl bg-blue-600 font-bold shadow-lg shadow-blue-200 hover:bg-blue-700">回答をチェックする <ChevronRight data-icon="inline-end" /></Button>

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
                  <code className="mt-2 block rounded-lg bg-slate-900 px-4 py-3 font-mono text-sm text-blue-200">{question.answer}</code>
                  <p className="mt-5 flex items-start gap-2 text-sm leading-7 text-slate-700"><Lightbulb className="mt-1 size-4 shrink-0 text-amber-500" /><span><strong className="text-slate-900">初心者向けワンストップ解説</strong><br />{question.explanation}</span></p>
                </div>
                <Button onClick={nextQuestion} variant="outline" className="mt-6 w-full rounded-xl border-slate-300 bg-white font-bold hover:bg-slate-50">次の問題へ進む <ArrowRight data-icon="inline-end" /></Button>
              </div>
            )}
          </div>
        </section>
        <p className="flex items-center justify-center gap-2 text-xs text-slate-400"><RotateCcw className="size-3.5" /> 自分のペースで、少しずつ進めよう</p>
      </div>
    </main>
  )
}
