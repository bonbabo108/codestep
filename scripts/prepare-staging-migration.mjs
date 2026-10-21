// ローカルの適用要求生成のみ。ネットワーク接続・SQL実行機能は持たない。
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const projectId = 'ezjzgebehancbxqpgany'
const migrationName = 'codestep_staging_bootstrap'
const sqlRelativePath = 'docs/sql/staging-bootstrap.sql'
const sqlPath = new URL('../docs/sql/staging-bootstrap.sql', import.meta.url)
const reviewPath = new URL('../docs/sql/staging-bootstrap.review.json', import.meta.url)

export function sqlSha256(sql) {
  return createHash('sha256').update(sql, 'utf8').digest('hex')
}

export function createReviewedRequest(sql, review) {
  if (review.version !== 1 || review.project_id !== projectId || review.name !== migrationName
    || review.sql_file !== sqlRelativePath) throw new Error('review target mismatch')
  if (sqlSha256(sql) !== review.sha256) throw new Error('SQL changed: review and approval required')
  // 古いSQLを、単にハッシュ更新して再利用することも拒否する。
  if (/\bcreatedAt\b|\bREFERENCES\s+auth\s*\.|\bCASCADE\b|\bCREATE\s+(?:SCHEMA|FUNCTION|TRIGGER)\b|\bGRANT\s+ALL\b/i.test(sql)) {
    throw new Error('SQL contains withdrawn schema changes')
  }
  return { project_id: projectId, name: migrationName, query: sql }
}

export function prepareStagingMigration() {
  // 毎回ファイルを読み直す。過去の関数実行ストアやチャット本文は入力にしない。
  const sql = readFileSync(sqlPath, 'utf8')
  const review = JSON.parse(readFileSync(reviewPath, 'utf8'))
  const request = createReviewedRequest(sql, review)
  return { sha256: sqlSha256(sql), apply_migration: request }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(prepareStagingMigration(), null, 2)) }
  catch (error) { console.error(error.message); process.exitCode = 1 }
}
