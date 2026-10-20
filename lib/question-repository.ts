import type { Question, QuestionDeletion, QuestionForm } from './questions'

// 画面は認証クライアントや接続先を知らない。認可は通常ルートとDBで保証する。
export interface QuestionRepository {
  list(signal: AbortSignal): Promise<Question[]>
  save(form: QuestionForm, id: string | null, signal: AbortSignal): Promise<Question>
  inspectDeletion(id: string, signal: AbortSignal): Promise<QuestionDeletion>
  remove(id: string, signal: AbortSignal, deleteProgress: boolean): Promise<QuestionDeletion>
}
