import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const loginForm = readFileSync(new URL('../components/LoginForm.tsx', import.meta.url), 'utf8')

test('確認メール未使用の通常登録画面では再送案内を常時表示しない', () => {
  assert.doesNotMatch(loginForm, /!canResend\s*&&\s*<button[^>]*>確認メールが届かない/)
  assert.match(loginForm, /!adminOnly\s*&&\s*canResend\s*&&/)
})

test('確認が必要な登録と未確認エラーのときに再送機能を維持する', () => {
  assert.match(loginForm, /outcome === 'confirm-email'/)
  assert.match(loginForm, /setCanResend\(true\)/)
  assert.match(loginForm, /cause\.code === 'email_not_confirmed'/)
  assert.match(loginForm, /確認メールを再送する/)
})
