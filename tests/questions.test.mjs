import test from 'node:test'
import assert from 'node:assert/strict'
import { deleteQuestion, inspectQuestionDeletion, fetchQuestions, saveQuestion, validateQuestionForm, questionErrorMessage, questionToForm, isUnchanged } from '../lib/questions.ts'

const row = {
  id: 'fixture-question', title: '見出し', question_text: '大見出しのタグは？',
  answer_code: '<h1>', explanation: '見出しタグです。', category: 'HTML', created_at: null,
}
const form = questionToForm(row)
const signal = () => new AbortController().signal

// 通信は行わない。実際のRLSやデータ永続化の検証とは区別する。
function fakeClient(result, rejection) {
  const calls = []
  const query = {}
  for (const method of ['select', 'order', 'abortSignal', 'eq', 'insert', 'update', 'delete', 'maybeSingle']) {
    query[method] = (...args) => { calls.push([method, ...args]); return query }
  }
  query.then = (resolve, reject) => (rejection ? Promise.reject(rejection) : Promise.resolve(result)).then(resolve, reject)
  return { calls, from(table) { calls.push(['from', table]); return query }, rpc(...args) { calls.push(['rpc', ...args]); return query } }
}

test('保存対象を許可された5列だけに制限する', () => {
  const draft = validateQuestionForm({ ...form, id: 'injected', created_at: 'injected' })
  assert.deepEqual(Object.keys(draft).sort(), ['answer_code', 'category', 'explanation', 'question_text', 'title'])
})

test('未入力や未知カテゴリではリクエストを送らない', async () => {
  const client = fakeClient({ data: row, error: null })
  for (const invalid of [{ ...form, title: ' ' }, { ...form, category: 'SQL' }, { ...form, answer_code: ' ' }]) {
    await assert.rejects(saveQuestion(client, invalid, null, signal()))
  }
  assert.deepEqual(client.calls, [])
})

test('一覧を取得しNULL可カラムも扱える', async () => {
  const client = fakeClient({ data: [{ ...row, category: null, explanation: null }], error: null })
  const rows = await fetchQuestions(client, signal())
  assert.equal(rows.length, 1)
  assert.equal(questionToForm(rows[0]).category, '')
  assert.equal(questionToForm(rows[0]).explanation, '')
})

test('異常な一覧レスポンスを空の正常結果として扱わない', async () => {
  await assert.rejects(fetchQuestions(fakeClient({ data: null, error: null }), signal()))
  await assert.rejects(fetchQuestions(fakeClient({ data: [{ id: 'broken' }], error: null }), signal()))
})

test('新規作成では返却された行を使用する', async () => {
  const client = fakeClient({ data: row, error: null })
  assert.deepEqual(await saveQuestion(client, form, null, signal()), row)
  assert.ok(client.calls.some(call => call[0] === 'insert'))
})

test('更新では主キーで絞り、返却行を確認する', async () => {
  const client = fakeClient({ data: row, error: null })
  assert.deepEqual(await saveQuestion(client, form, row.id, signal()), row)
  assert.ok(client.calls.some(call => call[0] === 'eq' && call[1] === 'id' && call[2] === row.id))
})

test('UPDATEが0件、または別IDの返却なら成功させない', async () => {
  for (const data of [null, { ...row, id: 'other-fixture' }]) {
    await assert.rejects(saveQuestion(fakeClient({ data, error: null }), form, row.id, signal()))
  }
})

test('削除は対象IDと明示確認を1つのRPCへ渡し、削除結果を確認する', async () => {
  const client = fakeClient({ data: { question_id: row.id, has_progress: true, deleted: true }, error: null })
  assert.deepEqual(await deleteQuestion(client, row.id, signal(), true), { hasProgress: true, deleted: true })
  assert.deepEqual(client.calls.find(call => call[0] === 'rpc'), ['rpc', 'delete_question_with_progress', { p_question_id: row.id, p_confirm: true, p_delete_progress: true }])
  assert.equal(client.calls.some(call => call[0] === 'from'), false)
})

test('削除が0件・別ID・不正な応答なら成功させない', async () => {
  for (const data of [null, { question_id: 'other-fixture', has_progress: false, deleted: true }, { question_id: row.id }, { question_id: row.id, has_progress: false, deleted: false }]) {
    await assert.rejects(deleteQuestion(fakeClient({ data, error: null }), row.id, signal()))
  }
})

test('削除の事前確認は削除フラグを送らず、履歴の有無だけを確認する', async () => {
  const client = fakeClient({ data: { question_id: row.id, has_progress: true, deleted: false }, error: null })
  assert.deepEqual(await inspectQuestionDeletion(client, row.id, signal()), { hasProgress: true, deleted: false })
  assert.equal(client.calls.find(c => c[0] === 'rpc')[2].p_confirm, false)
  await assert.rejects(inspectQuestionDeletion(fakeClient({ data: { question_id: row.id, has_progress: false, deleted: true } }), row.id, signal()))
})

test('確認後の履歴追加は未削除として再確認し、関連削除の許可を自動で増やさない', async () => {
  const client = fakeClient({ data: { question_id: row.id, has_progress: true, deleted: false }, error: null })
  assert.deepEqual(await deleteQuestion(client, row.id, signal(), false), { hasProgress: true, deleted: false })
  assert.equal(client.calls.find(c => c[0] === 'rpc')[2].p_delete_progress, false)
  assert.equal(client.calls.filter(c => c[0] === 'rpc').length, 1)
  await assert.rejects(deleteQuestion(client, row.id, signal(), true))
})

test('権限拒否は上位へ伝え、内部メッセージは表示しない', async () => {
  const error = { code: '42501', message: 'private server detail' }
  await assert.rejects(saveQuestion(fakeClient({ data: null, error }), form, null, signal()), error)
  assert.match(questionErrorMessage(error), /権限/)
  assert.doesNotMatch(questionErrorMessage(error), /private/)
})

test('通信例外を成功とせず、無条件に再送もしない', async () => {
  const client = fakeClient(null, new TypeError('network private detail'))
  await assert.rejects(deleteQuestion(client, row.id, signal()))
  assert.equal(client.calls.filter(call => call[0] === 'rpc').length, 1)
  assert.doesNotMatch(questionErrorMessage(new TypeError('network private detail')), /private/)
})

test('予期しないFK不整合は履歴の削除禁止と誤案内しない', () => {
  assert.match(questionErrorMessage({ code: '23503' }), /整合性/)
  assert.doesNotMatch(questionErrorMessage({ code: '23503' }), /学習履歴がある問題は削除できません/)
})

test('変更なしの編集を識別する', () => {
  assert.equal(isUnchanged(form, row), true)
  assert.equal(isUnchanged({ ...form, title: '別の見出し' }, row), false)
})

test('リクエストに中断用シグナルを渡す', async () => {
  const client = fakeClient({ data: row, error: null })
  const abort = signal()
  await saveQuestion(client, form, null, abort)
  assert.ok(client.calls.some(call => call[0] === 'abortSignal' && call[1] === abort))
})
