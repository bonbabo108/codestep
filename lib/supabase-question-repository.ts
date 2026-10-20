import type { SupabaseClient } from '@supabase/supabase-js'
import type { QuestionRepository } from './question-repository'
import { fetchQuestions, saveQuestion, inspectQuestionDeletion, deleteQuestion } from './questions.ts'

export function createSupabaseQuestionRepository(client: Pick<SupabaseClient, 'from' | 'rpc'>): QuestionRepository {
  return {
    list: signal => fetchQuestions(client, signal),
    save: (form, id, signal) => saveQuestion(client, form, id, signal),
    inspectDeletion: (id, signal) => inspectQuestionDeletion(client, id, signal),
    remove: (id, signal, deleteProgress) => deleteQuestion(client, id, signal, deleteProgress),
  }
}
