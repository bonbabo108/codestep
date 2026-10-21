// CodeStep stagingの使い捨てデータだけ。実行には明示opt-inと0600の設定が必要。
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, statSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'
import { readStagingConfig, guardedFetch, stagingRef } from './staging-runtime.mjs'
import { deleteQuestion, inspectQuestionDeletion } from '../lib/questions.ts'

const require = createRequire(import.meta.url)
const { createClient } = require('@supabase/supabase-js')
const file = '/tmp/codestep-question-deletion-test-state.json'
const mode = process.argv[2]
const options = { global: { fetch: guardedFetch }, auth: { persistSession: false, autoRefreshToken: false } }
const clients = []
let state
async function check(p) { const { data, error } = await p; if (error) throw Error('staging operation failed'); return data }
async function login(cfg, role) {
  const client = createClient(cfg.url, cfg.publishableKey, options)
  const data = await check(client.auth.signInWithPassword({ email: cfg.users[role].email, password: cfg.users[role].password }))
  assert.equal(data.user.id, cfg.users[role].id)
  clients.push(client)
  return client
}
function save() { writeFileSync(file, JSON.stringify(state), { mode: 0o600 }) }
async function tables(service) { const data = {}; for (const table of ['questions', 'profiles', 'user_progress']) data[table] = await check(service.from(table).select('*').order('id')); return data }
const signal = () => new AbortController().signal
try {
  const cfg = readStagingConfig()
  const service = createClient(cfg.url, cfg.secretKey, options)
  const admin = await login(cfg, 'admin')
  const user = await check(service.auth.admin.getUserById(cfg.users.admin.id))
  assert.equal(user.user.app_metadata.codestep_admin, true)
  if (mode === 'setup') {
    const baseline = await tables(service)
    for (const role of ['learner', 'other']) assert.ok(baseline.profiles.some(p => p.id === cfg.users[role].id))
    state = { project: stagingRef, prefix: `CodeStep削除試験-${randomUUID().slice(0, 8)}`, baseline, adminMetadata: user.user.app_metadata, questions: {}, progressIds: [], apiPassed: false }
    writeFileSync(file, JSON.stringify(state), { mode: 0o600, flag: 'wx' })
    const learner = await login(cfg, 'learner'), other = await login(cfg, 'other')
    for (const label of ['empty', 'history', 'race', 'atomic', 'unrelated', 'ui-history', 'ui-empty']) {
      const question = await check(admin.from('questions').insert({ title: `${state.prefix}-${label}`, question_text: '削除確認用の使い捨て問題', answer_code: 'fixture', explanation: '試験後に片付けます。', category: 'HTML' }).select('id,title').single())
      state.questions[label] = question; save()
    }
    for (const [label, role] of [['history', 'learner'], ['history', 'other'], ['atomic', 'learner'], ['unrelated', 'other'], ['ui-history', 'learner'], ['ui-history', 'other']]) {
      const progress = await check((role === 'learner' ? learner : other).from('user_progress').insert({ user_id: cfg.users[role].id, question_id: state.questions[label].id, submitted_code: 'fixture', is_completed: true }).select('id').single())
      state.progressIds.push(progress.id); save()
    }
    console.log(JSON.stringify({ stagingOnly: true, setup: true, disposableQuestions: 7, disposableProgress: 6, baselineProtected: true }))
  } else {
    assert.equal(statSync(file).mode & 0o077, 0)
    state = JSON.parse(readFileSync(file, 'utf8')); assert.equal(state.project, stagingRef)
    const q = label => state.questions[label].id
    const counts = async id => ({ questions: (await check(service.from('questions').select('id').eq('id', id))).length, progress: (await check(service.from('user_progress').select('id').eq('question_id', id))).length })
    if (mode === 'seed-progress') {
      assert.equal(state.progressIds.length, 0)
      const current = await tables(service)
      assert.equal(current.user_progress.some(p => Object.values(state.questions).some(q => q.id === p.question_id)), false)
      for (const question of Object.values(state.questions)) assert.ok(current.questions.some(q => q.id === question.id && q.title === question.title))
      const learner = await login(cfg, 'learner'), other = await login(cfg, 'other')
      for (const [label, role] of [['history', 'learner'], ['history', 'other'], ['atomic', 'learner'], ['unrelated', 'other'], ['ui-history', 'learner'], ['ui-history', 'other']]) {
        const progress = await check((role === 'learner' ? learner : other).from('user_progress').insert({ user_id: cfg.users[role].id, question_id: q(label), submitted_code: 'fixture', is_completed: true }).select('id').single())
        state.progressIds.push(progress.id); save()
      }
      console.log(JSON.stringify({ remainingProgressSetup: true, disposableProgress: 6, questionsNotRecreated: true }))
    } else if (mode === 'api') {
      assert.deepEqual(await inspectQuestionDeletion(admin, q('empty'), signal()), { hasProgress: false, deleted: false })
      assert.equal((await deleteQuestion(admin, q('empty'), signal())).deleted, true)
      assert.deepEqual(await counts(q('empty')), { questions: 0, progress: 0 })
      assert.deepEqual(await inspectQuestionDeletion(admin, q('history'), signal()), { hasProgress: true, deleted: false })
      assert.deepEqual(await counts(q('history')), { questions: 1, progress: 2 })
      const learner = await login(cfg, 'learner')
      await assert.rejects(deleteQuestion(learner, q('history'), signal(), true), e => e.code === '42501')
      const anon = createClient(cfg.url, cfg.publishableKey, options)
      await assert.rejects(deleteQuestion(anon, q('history'), signal(), true), e => e.code === '42501')
      assert.deepEqual(await counts(q('history')), { questions: 1, progress: 2 })
      assert.equal((await deleteQuestion(admin, q('history'), signal(), true)).deleted, true)
      assert.deepEqual(await counts(q('history')), { questions: 0, progress: 0 })
      assert.deepEqual(await counts(q('unrelated')), { questions: 1, progress: 1 })
      assert.equal((await inspectQuestionDeletion(admin, q('race'), signal())).hasProgress, false)
      const added = await check(learner.from('user_progress').insert({ user_id: cfg.users.learner.id, question_id: q('race'), submitted_code: 'fixture', is_completed: true }).select('id').single())
      state.progressIds.push(added.id); save()
      assert.deepEqual(await deleteQuestion(admin, q('race'), signal(), false), { hasProgress: true, deleted: false })
      assert.deepEqual(await counts(q('race')), { questions: 1, progress: 1 })
      assert.equal((await deleteQuestion(admin, q('race'), signal(), true)).deleted, true)
      assert.deepEqual(await counts(q('race')), { questions: 0, progress: 0 })
      state.apiPassed = true; save()
      console.log(JSON.stringify({ noHistoryDelete: true, crossUserProgressDelete: true, previewWithoutMutation: true, generalAndAnonDenied: true, unrelatedPreserved: true, concurrentHistoryRequiresReconfirmation: true }))
    } else if (mode === 'inspect') {
      const current = await tables(service)
      const existingUnchanged = Object.entries(state.baseline).every(([table, rows]) => rows.every(row => isDeepStrictEqual(current[table].find(x => x.id === row.id), row)))
      const selected = {}; for (const label of ['atomic', 'ui-history', 'ui-empty', 'unrelated']) selected[label] = await counts(q(label))
      console.log(JSON.stringify({ existingUnchanged, selected, demoAdminRetained: user.user.app_metadata.codestep_admin === true }))
    } else if (mode === 'cleanup') {
      for (const { id, title } of Object.values(state.questions)) {
        const current = await check(service.from('questions').select('id,title').eq('id', id))
        if (!current.length) continue
        assert.equal(current[0].title, title)
        assert.ok(title.startsWith(state.prefix))
        assert.equal((await deleteQuestion(admin, id, signal(), true)).deleted, true)
      }
      const final = await tables(service)
      const after = await check(service.auth.admin.getUserById(cfg.users.admin.id))
      assert.deepEqual(final, state.baseline)
      assert.deepEqual(after.user.app_metadata, state.adminMetadata)
      console.log(JSON.stringify({ allExistingTablesExactlyPreserved: true, allDisposableDataRemoved: true, demoAdminMetadataUnchanged: true, demoAdminRetained: true }))
      state.cleaned = true; save()
    } else throw Error('unsupported mode')
  }
} catch {
  console.error(`staging deletion ${mode || 'unknown'} failed; inspect saved state before further changes`)
  process.exitCode = 1
} finally {
  for (const client of clients) {
    const { error } = await client.auth.signOut({ scope: 'local' })
    if (error) { console.error('test session sign-out not confirmed'); process.exitCode = 1 }
  }
}
