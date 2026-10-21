'use client'

import { createContext, useContext, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { createDemoQuestionRepository } from '@/lib/demo-question-repository'
import type { DemoQuestionRepository } from '@/lib/demo-question-repository'

const DemoContext = createContext<DemoQuestionRepository | null>(null)

export function DemoProvider({ children }: { children: ReactNode }) {
  const [repository] = useState(createDemoQuestionRepository)
  return <DemoContext.Provider value={repository}>{children}</DemoContext.Provider>
}

export function useDemo() {
  const repository = useContext(DemoContext)
  if (!repository) throw new Error('DemoProviderが必要です。')
  const snapshot = useSyncExternalStore(repository.subscribe, repository.getSnapshot, repository.getSnapshot)
  return { repository, ...snapshot }
}

export function DemoNotice() {
  const { repository } = useDemo()
  return <aside aria-label="デモの制限" className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 bg-blue-50 px-5 py-3 text-xs text-blue-900">
    <div className="min-w-0 flex-1">
      <p>デモ：架空の問題・学習進捗だけを操作します。再読み込みで初期化されます。</p>
      <details className="mt-1"><summary className="cursor-pointer underline">デモの制限</summary><p className="mt-2">保存はこのブラウザ内のみです。ログイン・権限変更・他ユーザーとの同時更新、実DBの通信/障害は再現しません。</p></details>
    </div>
    <button type="button" onClick={repository.reset} className="min-h-11 font-bold underline">デモをリセット</button>
  </aside>
}
