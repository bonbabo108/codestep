import test from 'node:test'
import assert from 'node:assert/strict'
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { guardedFetch, readStagingConfig, stagingUrl } from '../scripts/staging-runtime.mjs'

test('検証ランナーは本番・TodoApp・別ホストへの要求を通信前に拒否する', () => {
  for (const host of ['xdnmlfoblqdygsnhkxxp.supabase.co', 'onsijskrauwkkydelsge.supabase.co', 'example.com']) {
    assert.throws(() => guardedFetch(`https://${host}/rest/v1/questions`), /non-staging/)
  }
})

test('検証ランナーは明示opt-in・接続先一致・秘密ファイル権限を必要とする', () => {
  const dir = mkdtempSync(join(tmpdir(), 'codestep-guard-'))
  const path = join(dir, 'fixture.json')
  const previous = process.env.CODESTEP_STAGING_TESTS
  const write = url => writeFileSync(path, JSON.stringify({ url, publishableKey: 'sb_publishable_fixture', secretKey: 'sb_secret_fixture' }), { mode: 0o600 })
  try {
    write(stagingUrl)
    delete process.env.CODESTEP_STAGING_TESTS
    assert.throws(() => readStagingConfig(path), /opt-in/)
    process.env.CODESTEP_STAGING_TESTS = '1'
    assert.equal(readStagingConfig(path).url, stagingUrl)
    write('https://xdnmlfoblqdygsnhkxxp.supabase.co')
    assert.throws(() => readStagingConfig(path), /mismatch/)
    write(stagingUrl); chmodSync(path, 0o644)
    assert.throws(() => readStagingConfig(path), /private/)
  } finally {
    if (previous === undefined) delete process.env.CODESTEP_STAGING_TESTS
    else process.env.CODESTEP_STAGING_TESTS = previous
    rmSync(dir, { recursive: true }) // このテスト自身が作った架空設定だけを削除。
  }
})
