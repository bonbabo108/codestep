import type { Question } from './questions'
import type { QuestionRepository } from './question-repository'
import { validateQuestionForm } from './questions.ts'
import { createDemoQuestions, saveDemoQuestion, deleteDemoQuestion } from './demo.ts'

type Snapshot = { questions: Question[]; completedIds: string[]; revision: number }
export interface DemoQuestionRepository extends QuestionRepository {
  subscribe(listener: () => void): () => void
  getSnapshot(): Snapshot
  reset(): void
  complete(id: string): void
}

// クライアント/URL/資格情報を受け取らず、fetch・Storage・Authを参照しない。
// 架空の進捗1件で、本物と同じ関連進捗の削除警告も体験できる。
export function createDemoQuestionRepository(): DemoQuestionRepository {
  let snapshot: Snapshot = { questions: createDemoQuestions(), completedIds: ['demo-html'], revision: 0 }
  const listeners = new Set<() => void>()
  const publish = (next: Snapshot) => { snapshot = next; listeners.forEach(listener => listener()) }
  const find = (id: string) => {
    const question = snapshot.questions.find(row => row.id === id)
    if (!question) throw new Error('サンプル問題が見つかりません。リセットして再試行してください。')
    return question
  }
  return {
    subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener) } },
    getSnapshot: () => snapshot,
    reset: () => publish({ questions: createDemoQuestions(), completedIds: ['demo-html'], revision: snapshot.revision + 1 }),
    complete: id => {
      find(id)
      if (!snapshot.completedIds.includes(id)) publish({ ...snapshot, completedIds: [...snapshot.completedIds, id] })
    },
    list: async signal => { signal.throwIfAborted(); return snapshot.questions.map(row => ({ ...row })) },
    save: async (form, id, signal) => {
      signal.throwIfAborted()
      const fields = validateQuestionForm(form)
      const key = id ?? `demo-${crypto.randomUUID()}`
      const questions = saveDemoQuestion(snapshot.questions, fields, key, id !== null)
      const saved = questions.find(row => row.id === key)!
      publish({ ...snapshot, questions: id ? questions : [saved, ...questions.filter(row => row.id !== key)] })
      return { ...saved }
    },
    inspectDeletion: async (id, signal) => {
      signal.throwIfAborted(); find(id)
      return { hasProgress: snapshot.completedIds.includes(id), deleted: false }
    },
    remove: async (id, signal, deleteProgress) => {
      signal.throwIfAborted(); find(id)
      const hasProgress = snapshot.completedIds.includes(id)
      if (hasProgress && !deleteProgress) return { hasProgress, deleted: false }
      publish({ ...snapshot, questions: deleteDemoQuestion(snapshot.questions, id), completedIds: snapshot.completedIds.filter(key => key !== id) })
      return { hasProgress, deleted: true }
    },
  }
}
