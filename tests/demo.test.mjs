import test from 'node:test'
import assert from 'node:assert/strict'
import { createDemoQuestions, saveDemoQuestion, deleteDemoQuestion } from '../lib/demo.ts'
import { validateQuestionForm } from '../lib/questions.ts'

const form = { category: 'HTML', title: '追加問題', question_text: '見出しを書こう', answer_code: '<h2>Demo</h2>', explanation: 'h2を使います。' }

test('デモの訪問と初期化は独立し、元のサンプルを変更しない', () => {
  const first = createDemoQuestions()
  first[0].title = 'この画面だけの変更'
  first.pop()
  const next = createDemoQuestions()
  assert.equal(next.length, 3)
  assert.equal(next[0].title, '見出しをつくろう')
  assert.ok(next.every(row => row.id.startsWith('demo-')))
})

test('追加→一覧→編集→削除は対象サンプルだけを変更し、入力配列を変更しない', () => {
  const original = createDemoQuestions()
  const before = structuredClone(original)
  const created = saveDemoQuestion(original, validateQuestionForm(form), 'demo-created', false)
  assert.equal(created.length, 4)
  assert.equal(created.at(-1).title, form.title)
  const updated = saveDemoQuestion(created, validateQuestionForm({ ...form, title: '更新した問題' }), 'demo-created', true)
  assert.equal(updated.length, 4)
  assert.equal(updated.at(-1).title, '更新した問題')
  assert.equal(created.at(-1).title, form.title)
  assert.deepEqual(deleteDemoQuestion(updated, 'demo-created'), before)
  assert.deepEqual(original, before)
})

test('重複追加・存在しない更新や削除・デモ外IDを成功扱いしない', () => {
  const questions = createDemoQuestions()
  const fields = validateQuestionForm(form)
  assert.throws(() => saveDemoQuestion(questions, fields, questions[0].id, false))
  assert.throws(() => saveDemoQuestion(questions, fields, 'demo-missing', true))
  assert.throws(() => deleteDemoQuestion(questions, 'demo-missing'))
  assert.throws(() => saveDemoQuestion(questions, fields, 'real-question', false))
  assert.throws(() => deleteDemoQuestion(questions, 'real-question'))
  assert.equal(questions.length, 3)
})

test('本物の管理フォームと同じ検証で不正な入力を拒否し、入力を保持する', () => {
  const invalid = { ...form, title: '   ', category: 'SQL' }
  const copy = structuredClone(invalid)
  assert.throws(() => validateQuestionForm(invalid))
  assert.deepEqual(invalid, copy)
  const fields = validateQuestionForm({ ...form, title: '  追加問題  ' })
  const row = saveDemoQuestion([], { ...fields, id: 'injected', app_metadata: { codestep_admin: true } }, 'demo-created', false)[0]
  assert.equal(row.id, 'demo-created')
  assert.equal(row.title, '追加問題')
  assert.equal('app_metadata' in row, false)
})

test('全サンプルを削除した空状態から初期化できる', () => {
  let questions = createDemoQuestions()
  for (const { id } of [...questions]) questions = deleteDemoQuestion(questions, id)
  assert.deepEqual(questions, [])
  assert.equal(createDemoQuestions().length, 3)
})
