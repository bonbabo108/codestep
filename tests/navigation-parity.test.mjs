import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const app = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
const demo = readFileSync(new URL('../components/DemoProvider.tsx', import.meta.url), 'utf8')

test('デモ学習・管理の双方に通常画面への明示的な出口がある', () => {
  assert.match(demo, /<nav aria-label="通常画面へ戻る"/)
  assert.match(demo, /<Link href="\/"[^>]*>通常の学習画面へ（デモ終了）<\/Link>/)
  assert.match(demo, /<Link href="\/admin\/login"[^>]*>管理者ログインへ<\/Link>/)
  assert.match(demo, /<DemoContext\.Provider value=\{repository\}>/)
})

test('本番学習画面は取得した問題を一覧から選べる', () => {
  assert.match(app, /<nav aria-label="学習問題を選択"/)
  assert.match(app, /questions\.map\(\(item, position\) =>/)
  assert.match(app, /onClick=\{\(\) => selectQuestion\(position\)\}/)
  assert.match(app, /aria-current=\{position === index \? 'step' : undefined\}/)
  assert.match(app, /progress\[item\.id\]\?\.is_completed === true/)
})

test('問題切替中は誤保存を防ぎ、次問の保存済み回答のみ復元する', () => {
  assert.match(app, /if \(saving \|\| next < 0 \|\| next >= questions\.length \|\| next === index\) return/)
  assert.match(app, /restoredAnswer\(progress\[questions\[next\]\.id\]\)/)
  assert.match(app, /setAnswer\(previousAnswer\)/)
  assert.match(app, /setResult\(null\)/)
  assert.match(app, /disabled=\{saving\}/)
  assert.match(app, /saveCompletedProgress\(supabase, userId, question, answer, signal\)/)
})
