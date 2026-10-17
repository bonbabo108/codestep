import type { SupabaseClient } from '@supabase/supabase-js'

export type Category = 'HTML' | 'CSS' | 'JavaScript'
export type Question = {
  id: string
  title: string
  question_text: string
  answer_code: string
  explanation: string | null
  category: string | null
  created_at: string | null
}
export type QuestionForm = {
  category: Category | ''
  title: string
  question_text: string
  answer_code: string
  explanation: string
}

type Client = Pick<SupabaseClient, 'from'>
type DeletionClient = Pick<SupabaseClient, 'rpc'>
const columns = 'id,title,question_text,answer_code,explanation,category,created_at'

export function isCategory(value: unknown): value is Category {
  return value === 'HTML' || value === 'CSS' || value === 'JavaScript'
}

export function emptyQuestionForm(): QuestionForm {
  return { category: 'HTML', title: '', question_text: '', answer_code: '', explanation: '' }
}

export function questionToForm(question: Question): QuestionForm {
  return {
    category: isCategory(question.category) ? question.category : '',
    title: question.title,
    question_text: question.question_text,
    answer_code: question.answer_code,
    explanation: question.explanation ?? '',
  }
}

export function validateQuestionForm(form: QuestionForm) {
  if (!isCategory(form.category) || !form.title.trim() || !form.question_text.trim()
    || !form.answer_code.trim() || !form.explanation.trim()) {
    throw new Error('カテゴリとすべての入力項目を確認してください。')
  }
  // 許可された5列だけ送る。id・created_atはDBに任せる。
  return {
    category: form.category,
    title: form.title.trim(),
    question_text: form.question_text.trim(),
    answer_code: form.answer_code,
    explanation: form.explanation.trim(),
  }
}

export function isUnchanged(form: QuestionForm, question: Question): boolean {
  const draft = validateQuestionForm(form)
  const original = questionToForm(question)
  return (Object.keys(draft) as (keyof typeof draft)[]).every(key => draft[key] === original[key])
}

function readQuestion(value: unknown): Question {
  if (!value || typeof value !== 'object') throw new Error('保存結果を確認できません。一覧を再読み込みしてください。')
  const row = value as Record<string, unknown>
  if (typeof row.id !== 'string' || !row.id || typeof row.title !== 'string'
    || typeof row.question_text !== 'string' || typeof row.answer_code !== 'string'
    || !(row.category === null || typeof row.category === 'string')
    || !(row.explanation === null || typeof row.explanation === 'string')
    || !(row.created_at === null || typeof row.created_at === 'string')) {
    throw new Error('問題データの形式を確認できません。一覧を再読み込みしてください。')
  }
  return row as Question
}

export function questionErrorMessage(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : null
  if (code === '42501' || code === 'PGRST301' || code === 'PGRST303') {
    return '操作する権限を確認できません。権限情報を更新するか、もう一度ログインしてください。'
  }
  if (code === '23503') return '関連データとの整合性を確認できないため、削除を中止しました。'
  if (code === 'P0002') return '対象の問題を変更できませんでした。権限や一覧を確認してください。'
  // DBの内部エラー・ヒント・入力データを画面やコンソールへ出さない。
  if (error instanceof Error && !('code' in error) && [
    'カテゴリとすべての入力項目を確認してください。',
    '保存結果を確認できません。一覧を再読み込みしてください。',
    '問題データの形式を確認できません。一覧を再読み込みしてください。',
    '対象の問題を変更できませんでした。権限や一覧を確認してください。',
  ].includes(error.message)) return error.message
  return '通信または操作に失敗しました。結果を一覧で確認してから再試行してください。'
}

export async function fetchQuestions(client: Client, signal: AbortSignal): Promise<Question[]> {
  const { data, error } = await client.from('questions').select(columns)
    .order('created_at', { ascending: false }).order('id', { ascending: false }).abortSignal(signal)
  if (error) throw error
  if (!Array.isArray(data)) throw new Error('問題データの形式を確認できません。一覧を再読み込みしてください。')
  return data.map(readQuestion)
}

export async function saveQuestion(client: Client, form: QuestionForm, id: string | null, signal: AbortSignal): Promise<Question> {
  const draft = validateQuestionForm(form)
  const query = id
    ? client.from('questions').update(draft).eq('id', id)
    : client.from('questions').insert(draft)
  const { data, error } = await query.select(columns).abortSignal(signal).maybeSingle()
  if (error) throw error
  if (!data || (id && data.id !== id)) throw new Error('対象の問題を変更できませんでした。権限や一覧を確認してください。')
  return readQuestion(data)
}

export type QuestionDeletion = { hasProgress: boolean; deleted: boolean }

async function requestQuestionDeletion(client: DeletionClient, id: string, signal: AbortSignal, confirm: boolean, deleteProgress: boolean): Promise<QuestionDeletion> {
  const { data, error } = await client.rpc('delete_question_with_progress', {
    p_question_id: id, p_confirm: confirm, p_delete_progress: deleteProgress,
  }).abortSignal(signal).maybeSingle()
  if (error) throw error
  const row = data && typeof data === 'object' ? data as Record<string, unknown> : null
  if (!row || row.question_id !== id || typeof row.has_progress !== 'boolean'
    || typeof row.deleted !== 'boolean' || (!confirm && row.deleted)
    || (confirm && !row.deleted && (!row.has_progress || deleteProgress))) {
    throw new Error('対象の問題を変更できませんでした。権限や一覧を確認してください。')
  }
  return { hasProgress: row.has_progress, deleted: row.deleted }
}

export async function inspectQuestionDeletion(client: DeletionClient, id: string, signal: AbortSignal): Promise<QuestionDeletion> {
  return requestQuestionDeletion(client, id, signal, false, false)
}

export async function deleteQuestion(client: DeletionClient, id: string, signal: AbortSignal, deleteProgress = false): Promise<QuestionDeletion> {
  return requestQuestionDeletion(client, id, signal, true, deleteProgress)
}
