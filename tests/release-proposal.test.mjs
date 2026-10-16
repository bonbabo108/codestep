import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const sql = readFileSync(new URL('../docs/sql/progress-release-proposal.sql', import.meta.url), 'utf8')
const executable = sql.replace(/--.*$/gm, '')
const unique = readFileSync(new URL('../docs/sql/progress-unique-proposal.sql', import.meta.url), 'utf8').replace(/--.*$/gm, '')

test('進捗公開案はデータ削除・ポリシー削除・FK変更なしの単一TX', () => {
  assert.equal((executable.match(/^BEGIN;$/gm) || []).length, 1)
  assert.equal((executable.match(/^COMMIT;$/gm) || []).length, 1)
  assert.doesNotMatch(executable, /\bDROP\b|\bTRUNCATE\b|\bDELETE\s+FROM\b|\bUPDATE\s+public\.|\bINSERT\s+INTO\b|\bCASCADE\b|DISABLE ROW LEVEL SECURITY/i)
  assert.ok(executable.indexOf('LOCK TABLE') < executable.indexOf('DO $review$'))
  assert.ok(executable.indexOf('$review$;') < executable.indexOf('GRANT INSERT'))
  assert.doesNotMatch(executable, /ADD CONSTRAINT/)
  assert.match(unique, /UNIQUE \(user_id,question_id\)/)
})

test('既存ポリシー不一致・重複データ・適用済み制約は安全化成功とせず中断する案', () => {
  assert.match(executable, /SELECT \* FROM actual EXCEPT SELECT \* FROM expected/)
  assert.match(executable, /SELECT \* FROM expected EXCEPT SELECT \* FROM actual/)
  assert.match(unique, /HAVING count\(\*\)>1/)
  assert.match(unique, /RAISE EXCEPTION 'duplicate progress exists/)
  assert.match(unique, /RAISE EXCEPTION 'unique constraint already exists/)
  assert.equal((unique.match(/^BEGIN;$/gm) || []).length, 1)
  assert.equal((unique.match(/^COMMIT;$/gm) || []).length, 1)
  assert.doesNotMatch(unique, /\bGRANT\b|\bDROP\b|\bTRUNCATE\s+TABLE|\bDELETE\s+FROM\b/)
})

test('学習者には保存に必要な列だけを許可し、匿名とservice_roleの権限を増やさない案', () => {
  const grants = executable.match(/^GRANT [\s\S]*?;/gm) || []
  assert.equal(grants.length, 5)
  assert.ok(grants.every(g => g.endsWith('TO authenticated;')))
  assert.doesNotMatch(grants.join('\n'), /DELETE|TRUNCATE|REFERENCES|TRIGGER|MAINTAIN|ALL|created_at/)
  assert.match(executable, /REVOKE ALL PRIVILEGES \(id,name,created_at\)/)
  assert.match(executable, /REVOKE ALL PRIVILEGES \(id,user_id,question_id,submitted_code,is_completed,updated_at\)/)
})
