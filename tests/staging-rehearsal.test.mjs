import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const script = fileURLToPath(new URL('../scripts/prepare-staging-rls-rehearsal.mjs', import.meta.url))
const prepare = (...args) => JSON.parse(execFileSync(process.execPath, [script, ...args], { encoding: 'utf8' }))

test('旧7ポリシーの再現は排他ロックと1トランザクションの中だけに置く', () => {
  const { apply_migration: r } = prepare('cutover')
  assert.equal(r.project_id, 'ezjzgebehancbxqpgany')
  assert.equal((r.query.match(/^BEGIN;$/gm) || []).length, 1)
  assert.equal((r.query.match(/^COMMIT;$/gm) || []).length, 1)
  assert.ok(r.query.indexOf('LOCK TABLE public.questions IN ACCESS EXCLUSIVE MODE') < r.query.indexOf('CREATE POLICY'))
  assert.ok(r.query.indexOf('REVOKE ALL PRIVILEGES (id,') < r.query.indexOf('CREATE POLICY'))
  assert.ok(r.query.includes('rows_before'))
  assert.equal((r.query.match(/IS DISTINCT FROM '1da0740667b5fb3f57013e5ff673d898'/g) || []).length, 2)
})

test('切替要求はquestionsの10ポリシーだけをDROPし、永続データを削除しない', () => {
  const { query } = prepare('cutover').apply_migration
  const drops = [...query.matchAll(/^DROP POLICY "([^"]+)" ON public\.questions;$/gm)].map(m => m[1])
  assert.deepEqual(drops.sort(), [
    ...['insert', 'update', 'delete'].map(op => `CodeStep admins ${op} questions`),
    'CodeStep rehearsal unexpected policy',
    ...['insert', 'update', 'delete'].map(op => `Demo public ${op} questions`),
    ...['insert', 'update', 'delete'].map(op => `Authenticated users can ${op} questions`),
  ].sort())
  assert.doesNotMatch(query, /\bDELETE\s+FROM\b|\bTRUNCATE\b|\bDROP\s+(?:TABLE|SCHEMA|COLUMN)\b/i)
  assert.match(query, /CREATE TEMP TABLE cutover_before ON COMMIT DROP AS SELECT/)
  assert.doesNotMatch(query, /DISABLE ROW LEVEL SECURITY/)
})

test('切替試験は本番用ファイルの処理本体と不一致ガードをそのまま含む', () => {
  const p = prepare('cutover')
  const source = readFileSync(new URL('../docs/sql/questions-admin-rls.sql', import.meta.url), 'utf8')
  assert.equal(p.source_sha256, createHash('sha256').update(source).digest('hex'))
  // 承認済み全文からの差分は、実行せず再レビューの対象にする。
  assert.equal(createHash('sha256').update(p.apply_migration.query).digest('hex'), '186e456a5f5851c52ca8fcf87d11384bf6dffe1fc29f22fe9aa6894315a0abf4')
  const body = source.replace(/^BEGIN;\s*$/m, '').replace(/COMMIT;\s*$/, '')
  assert.ok(p.apply_migration.query.includes(body))
  assert.ok(p.apply_migration.query.includes('review guard did not reject unexpected policy'))
})

test('本番用原本は旧書込6ポリシーだけを置換し公開SELECTを残す（静的検査）', () => {
  const source = readFileSync(new URL('../docs/sql/questions-admin-rls.sql', import.meta.url), 'utf8')
  const drops = [...source.matchAll(/^DROP POLICY "([^"]+)" ON public\.questions;$/gm)].map(m => m[1]).sort()
  const expected = [
    ...['insert', 'update', 'delete'].map(op => `Demo public ${op} questions`),
    ...['insert', 'update', 'delete'].map(op => `Authenticated users can ${op} questions`),
  ].sort()
  assert.deepEqual(drops, expected)
  assert.doesNotMatch(source, /\bDELETE\s+FROM\b|\bTRUNCATE\b|\bDROP\s+(?:TABLE|SCHEMA|COLUMN)\b|DISABLE ROW LEVEL SECURITY/i)
  assert.ok(source.indexOf('LOCK TABLE') < source.indexOf('DO $review$'))
  assert.ok(source.indexOf('$review$;') < source.indexOf('GRANT INSERT'))
  assert.match(source, /SELECT \* FROM actual EXCEPT SELECT \* FROM expected/)
  assert.match(source, /SELECT \* FROM expected EXCEPT SELECT \* FROM actual/)
  assert.match(source, /GRANT SELECT ON TABLE public\.questions TO anon, authenticated/)
})

test('緊急停止要求は原本と一致し、復旧は検証済みポリシー指紋を要求する', () => {
  assert.equal(prepare('stop').apply_migration.query, readFileSync(new URL('../docs/sql/questions-emergency-stop.sql', import.meta.url), 'utf8'))
  const r = prepare('resume', 'a'.repeat(32)).apply_migration
  assert.equal(r.project_id, 'ezjzgebehancbxqpgany')
  assert.ok(r.query.includes('RLS changed; keep writes stopped'))
  assert.equal((r.query.match(/GRANT /g) || []).length, 3)
  assert.doesNotMatch(r.query, /GRANT ALL|TO anon|TO PUBLIC/)
})

test('復旧指紋の欠落・不正形式では要求を生成しない', () => {
  for (const args of [['resume'], ['resume', 'not-a-fingerprint']]) {
    const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' })
    assert.notEqual(r.status, 0)
    assert.equal(r.stdout, '')
  }
})
