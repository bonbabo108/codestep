import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createReviewedRequest, prepareStagingMigration, sqlSha256 } from '../scripts/prepare-staging-migration.mjs'

const sql = readFileSync(new URL('../docs/sql/staging-bootstrap.sql', import.meta.url), 'utf8')
const review = JSON.parse(readFileSync(new URL('../docs/sql/staging-bootstrap.review.json', import.meta.url), 'utf8'))

test('適用要求のqueryは原本ファイルと改行を含めて完全一致する', () => {
  const prepared = prepareStagingMigration()
  assert.equal(prepared.apply_migration.query, sql)
  assert.equal(prepared.sha256, review.sha256)
  assert.equal(prepared.apply_migration.project_id, 'ezjzgebehancbxqpgany')
  assert.deepEqual(Object.keys(prepared.apply_migration).sort(), ['name', 'project_id', 'query'])
})

test('以前のSQLや未レビューの本文差し替えは承認ハッシュ不一致で止まる', () => {
  assert.throws(() => createReviewedRequest(sql.replace('created_at timestamptz', '"createdAt" timestamptz'), review), /SQL changed/)
  assert.throws(() => createReviewedRequest(sql + '\n-- unreviewed change', review), /SQL changed/)
})

test('本番・TodoApp・別マイグレーションへの対象差し替えは拒否する', () => {
  for (const project_id of ['xdnmlfoblqdygsnhkxxp', 'onsijskrauwkkydelsge']) {
    assert.throws(() => createReviewedRequest(sql, { ...review, project_id }), /target mismatch/)
  }
  assert.throws(() => createReviewedRequest(sql, { ...review, name: 'other_migration' }), /target mismatch/)
})

test('撤回した差分はハッシュだけを書き換えても再利用できない', () => {
  for (const suffix of [
    '\n-- createdAt',
    '\nALTER TABLE public.profiles ADD FOREIGN KEY(id) REFERENCES auth.users(id);',
    '\n-- ON DELETE CASCADE',
    '\nCREATE FUNCTION unexpected_function()',
    '\nGRANT ALL ON public.questions TO service_role;',
  ]) {
    const changed = sql + suffix
    assert.throws(() => createReviewedRequest(changed, { ...review, sha256: sqlSha256(changed) }), /withdrawn/)
  }
})
