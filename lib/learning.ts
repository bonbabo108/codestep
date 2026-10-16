import type { SupabaseClient } from '@supabase/supabase-js'
import type { Question } from './questions'

type Client = Pick<SupabaseClient, 'from'>
export type Progress = {
  id: string
  user_id: string
  question_id: string
  submitted_code: string | null
  is_completed: boolean | null
  updated_at: string | null
}
export type ProgressMap = Record<string, Progress>
const columns = 'id,user_id,question_id,submitted_code,is_completed,updated_at'
const missingResult = '保存結果を確認できません。進捗を再読み込みしてください。'

export function isCorrectAnswer(question: Pick<Question, 'answer_code'>, answer: string): boolean {
  // JavaScriptのconstとCONSTは別物。学習用の文字列一致でありコードは実行しない。
  return answer.trim().length > 0 && answer.trim() === question.answer_code.trim()
}

function readProgress(value: unknown, userId: string): Progress {
  if (!value || typeof value !== 'object') throw new Error(missingResult)
  const row = value as Record<string, unknown>
  if (typeof row.id !== 'string' || !row.id || row.user_id !== userId
    || typeof row.question_id !== 'string' || !row.question_id
    || !(row.submitted_code === null || typeof row.submitted_code === 'string')
    || !(row.is_completed === null || typeof row.is_completed === 'boolean')
    || !(row.updated_at === null || typeof row.updated_at === 'string')) throw new Error(missingResult)
  return row as Progress
}

export async function fetchProgress(client: Client, userId: string, questionIds: string[], signal: AbortSignal): Promise<ProgressMap> {
  if (!userId) throw new Error('進捗を保存するにはログインしてください。')
  if (questionIds.length === 0) return {}
  const { data, error } = await client.from('user_progress').select(columns)
    .eq('user_id', userId).in('question_id', questionIds)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .order('id', { ascending: false }).abortSignal(signal)
  if (error) throw error
  if (!Array.isArray(data)) throw new Error(missingResult)
  const progress: ProgressMap = {}
  const allowed = new Set(questionIds)
  for (const value of data) {
    const row = readProgress(value, userId)
    if (!allowed.has(row.question_id)) throw new Error(missingResult)
    // 本番の既存重複にも対応。stagingではペア一意制約で新たな重複を防ぐ。
    if (!progress[row.question_id]) progress[row.question_id] = row
  }
  return progress
}

async function ensureOwnProfile(client: Client, userId: string, signal: AbortSignal): Promise<void> {
  const lookup = () => client.from('profiles').select('id').eq('id', userId).abortSignal(signal).maybeSingle()
  const existing = await lookup()
  if (existing.error) throw existing.error
  if (existing.data?.id === userId) return
  if (existing.data) throw new Error(missingResult)
  // user_progressの既存FKを満たす。メール・管理者情報をプロフィールへ複製しない。
  const created = await client.from('profiles').insert({ id: userId, name: '学習者' })
    .select('id').abortSignal(signal).maybeSingle()
  if (created.error?.code === '23505') {
    const raced = await lookup()
    if (raced.error) throw raced.error
    if (raced.data?.id !== userId) throw new Error(missingResult)
    return
  }
  if (created.error) throw created.error
  if (created.data?.id !== userId) throw new Error(missingResult)
}

export async function saveCompletedProgress(client: Client, userId: string, question: Question, answer: string, signal: AbortSignal): Promise<Progress> {
  if (!userId) throw new Error('進捗を保存するにはログインしてください。')
  if (!isCorrectAnswer(question, answer)) throw new Error('正解した回答だけを進捗として保存します。')
  const readLatest = async () => {
    const latest = await client.from('user_progress').select(columns)
      .eq('user_id', userId).eq('question_id', question.id)
      .order('updated_at', { ascending: false, nullsFirst: false }).order('id', { ascending: false })
      .limit(1).abortSignal(signal).maybeSingle()
    if (latest.error) throw latest.error
    const row = latest.data ? readProgress(latest.data, userId) : null
    if (row && row.question_id !== question.id) throw new Error(missingResult)
    return row
  }
  const update = (previous: Progress) => client.from('user_progress')
    .update({ submitted_code: answer, is_completed: true, updated_at: new Date().toISOString() })
    .eq('id', previous.id).eq('user_id', userId).eq('question_id', question.id)
    .select(columns).abortSignal(signal).maybeSingle()
  const previous = await readLatest()
  let response
  if (previous) {
    response = await update(previous)
  } else {
    await ensureOwnProfile(client, userId, signal)
    response = await client.from('user_progress')
      .insert({ user_id: userId, question_id: question.id, submitted_code: answer, is_completed: true })
      .select(columns).abortSignal(signal).maybeSingle()
    // 別タブの初回INSERTと競合した場合だけ、本人・同じ問題の行を再確認して更新。
    // 結果不明の通信エラーでは自動再送しない。一意制約が未適用の本番にも互換性を保つ。
    if (response.error?.code === '23505') {
      const raced = await readLatest()
      if (!raced) throw response.error
      response = await update(raced)
    }
  }
  const { data, error } = response
  if (error) throw error
  const saved = readProgress(data, userId)
  if (saved.question_id !== question.id || saved.is_completed !== true || saved.submitted_code !== answer) throw new Error(missingResult)
  return saved
}

export function restoredAnswer(progress: Progress | undefined): string {
  return progress?.is_completed === true ? progress.submitted_code ?? '' : ''
}

export function learningErrorMessage(error: unknown, operation: 'load' | 'save' = 'save'): string {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : null
  if (operation === 'load') {
    return code === '42501' || code === 'PGRST301' || code === 'PGRST303'
      ? '読み込みの権限を確認できません。ログイン状態を確認して再読み込みしてください。'
      : '問題または学習進捗を読み込めませんでした。通信状態を確認して再読み込みしてください。'
  }
  if (code === '42501' || code === 'PGRST301' || code === 'PGRST303') return '保存する権限を確認できません。ログインし直してから再試行してください。'
  if (code === '23503') return '問題またはアカウント情報を確認できません。一覧を再読み込みしてください。'
  if (error instanceof Error && [missingResult, '進捗を保存するにはログインしてください。', '正解した回答だけを進捗として保存します。'].includes(error.message)) return error.message
  return '通信に失敗しました。保存できたか確認できないため、進捗を再読み込みしてください。'
}
