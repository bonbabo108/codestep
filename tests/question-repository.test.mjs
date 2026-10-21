import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { createDemoQuestionRepository } from '../lib/demo-question-repository.ts'
import { createSupabaseQuestionRepository } from '../lib/supabase-question-repository.ts'

const form = { category: 'HTML', title: '  共有画面の試験  ', question_text: '見出しは？', answer_code: '<h1>', explanation: '大見出しです。' }
const signal = () => new AbortController().signal

test('デモの同じrepositoryでCRUD・検証・通知・新しい順を維持する', async () => {
  const repository = createDemoQuestionRepository()
  const before = repository.getSnapshot()
  let notifications = 0
  const unsubscribe = repository.subscribe(() => notifications++)
  await assert.rejects(repository.save({ ...form, title: ' ' }, null, signal()))
  assert.equal(repository.getSnapshot(), before)
  const row = await repository.save(form, null, signal())
  assert.equal(row.title, '共有画面の試験')
  assert.equal((await repository.list(signal()))[0].id, row.id)
  const updated = await repository.save({ ...form, title: '変更後' }, row.id, signal())
  assert.equal(updated.id, row.id)
  assert.equal(updated.title, '変更後')
  assert.deepEqual(await repository.inspectDeletion(row.id, signal()), { hasProgress: false, deleted: false })
  assert.deepEqual(await repository.remove(row.id, signal(), false), { hasProgress: false, deleted: true })
  assert.equal((await repository.list(signal())).length, 3)
  assert.equal(notifications, 3)
  unsubscribe()
  repository.reset()
  assert.equal(notifications, 3)
})

test('デモでも履歴確認は削除せず、関連進捗の明示確認なしでは削除しない', async () => {
  const repository = createDemoQuestionRepository()
  assert.deepEqual(await repository.inspectDeletion('demo-html', signal()), { hasProgress: true, deleted: false })
  const before = repository.getSnapshot()
  assert.deepEqual(await repository.remove('demo-html', signal(), false), { hasProgress: true, deleted: false })
  assert.equal(repository.getSnapshot(), before)
  assert.deepEqual(await repository.remove('demo-html', signal(), true), { hasProgress: true, deleted: true })
  assert.equal(repository.getSnapshot().completedIds.includes('demo-html'), false)
  await assert.rejects(repository.remove('demo-html', signal(), true))
})

test('履歴確認後に架空進捗が増えた場合も、再確認するまで対象を保持する', async () => {
  const repository = createDemoQuestionRepository()
  assert.equal((await repository.inspectDeletion('demo-css', signal())).hasProgress, false)
  repository.complete('demo-css')
  assert.equal((await repository.remove('demo-css', signal(), false)).deleted, false)
  assert.ok(repository.getSnapshot().questions.some(row => row.id === 'demo-css'))
  assert.equal((await repository.remove('demo-css', signal(), true)).deleted, true)
})

test('中断済み操作はメモリを書き換えず、他の訪問にも影響しない', async () => {
  const first = createDemoQuestionRepository()
  const second = createDemoQuestionRepository()
  const controller = new AbortController()
  controller.abort()
  const before = first.getSnapshot()
  await assert.rejects(first.list(controller.signal))
  await assert.rejects(first.save(form, null, controller.signal))
  await assert.rejects(first.inspectDeletion('demo-html', controller.signal))
  await assert.rejects(first.remove('demo-html', controller.signal, true))
  assert.equal(first.getSnapshot(), before)
  const rows = await first.list(signal())
  rows[0].title = '返却配列の変更'
  assert.notEqual(first.getSnapshot().questions[0].title, rows[0].title)
  await first.remove('demo-html', signal(), true)
  assert.equal(second.getSnapshot().questions.length, 3)
  first.reset()
  assert.equal(first.getSnapshot().revision, 1)
  assert.equal(first.getSnapshot().questions.length, 3)
})

test('通常repositoryは実SDKの既存CRUD/RPCと確認フラグをそのまま利用する（通信はモック）', async () => {
  const calls = []
  const row = { ...form, title: '共有画面の試験', id: 'fixture-real-route', created_at: null }
  const client = createClient('http://127.0.0.1:54321', 'fictional-test-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, init) => {
      const request = new Request(input, init)
      const url = new URL(request.url)
      assert.equal(url.origin, 'http://127.0.0.1:54321')
      const body = request.method === 'GET' ? null : await request.json()
      calls.push({ path: url.pathname, method: request.method, body, query: url.searchParams })
      const result = url.pathname.includes('/rpc/')
        ? { question_id: row.id, has_progress: true, deleted: body.p_confirm }
        : request.method === 'GET' ? [row] : row
      return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } })
    } },
  })
  const repository = createSupabaseQuestionRepository(client)
  assert.equal((await repository.list(signal())).length, 1)
  assert.equal((await repository.save(form, null, signal())).id, row.id)
  assert.equal((await repository.save(form, row.id, signal())).id, row.id)
  assert.equal((await repository.inspectDeletion(row.id, signal())).deleted, false)
  assert.equal((await repository.remove(row.id, signal(), true)).deleted, true)
  assert.deepEqual(calls.map(call => call.method), ['GET', 'POST', 'PATCH', 'POST', 'POST'])
  assert.equal(calls[2].query.get('id'), `eq.${row.id}`)
  assert.deepEqual(calls[3].body, { p_question_id: row.id, p_confirm: false, p_delete_progress: false })
  assert.deepEqual(calls[4].body, { p_question_id: row.id, p_confirm: true, p_delete_progress: true })
  assert.equal(calls[1].body.title, '共有画面の試験')
})

test('通常repositoryは権限拒否をデモ処理へフォールバックせず失敗として返す', async () => {
  const client = createClient('http://127.0.0.1:54321', 'fictional-test-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async () => new Response(JSON.stringify({ code: '42501', message: 'fixture denial' }), { status: 403, headers: { 'Content-Type': 'application/json' } }) },
  })
  const repository = createSupabaseQuestionRepository(client)
  for (const run of [() => repository.list(signal()), () => repository.save(form, null, signal()), () => repository.inspectDeletion('fixture', signal()), () => repository.remove('fixture', signal(), true)]) {
    await assert.rejects(run(), error => error.code === '42501')
  }
})

test('デモのruntime依存に実接続クライアント・通常repositoryを含めない', () => {
  const visited = new Set()
  function visit(file) {
    if (visited.has(file)) return
    visited.add(file)
    assert.doesNotMatch(file, /lib\/(?:supabase|supabase-question-repository)\.ts$/)
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(/import\s+(?!type\b)[\s\S]*?\sfrom\s+['"]([^'"]+)['"]/g)) {
      const specifier = match[1]
      if (!specifier.startsWith('@/') && !specifier.startsWith('.')) continue
      const base = specifier.startsWith('@/') ? resolve(specifier.slice(2)) : resolve(dirname(file), specifier)
      const dependency = [base, `${base}.ts`, `${base}.tsx`].find(path => existsSync(path))
      assert.ok(dependency, specifier)
      visit(dependency)
    }
  }
  for (const file of ['components/DemoQuestionManager.tsx', 'components/DemoProvider.tsx', 'components/DemoExperience.tsx', 'components/SiteHeader.tsx']) visit(resolve(file))
})
