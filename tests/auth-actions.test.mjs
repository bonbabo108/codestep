import test from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { authenticate, confirmationRedirect, confirmationError, resendConfirmation, authErrorMessage } from '../lib/auth-actions.ts'

test('確認メールは利用中の公開originへ戻り、URLのパラメータを引き継がない', () => {
  assert.equal(confirmationRedirect('https://codestep.example/login?next=https://other.invalid'), 'https://codestep.example/login')
  assert.equal(confirmationRedirect('http://localhost:3000'), 'http://localhost:3000/login')
  assert.throws(() => confirmationRedirect('http://public.example'))
  assert.throws(() => confirmationRedirect('javascript:alert(1)'))
})

test('SDKが生成する登録と再送の両方に同じメール確認URLを渡す（外部通信なし）', async () => {
  const requests = []
  const client = createClient('http://127.0.0.1:54321', 'fictional-test-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, init) => {
      const request = new Request(input, init)
      const url = new URL(request.url)
      assert.equal(url.origin, 'http://127.0.0.1:54321')
      requests.push({ path: url.pathname, redirect: url.searchParams.get('redirect_to'), body: await request.json() })
      return new Response(JSON.stringify({ user: { id: 'fictional-user' }, session: null }), { headers: { 'Content-Type': 'application/json' } })
    } },
  })
  assert.equal(await authenticate(client, ' learner@example.invalid ', 'fictional-password', true, confirmationRedirect('https://preview.example')), 'confirm-email')
  await resendConfirmation(client, ' learner@example.invalid ', 'https://preview.example')
  assert.deepEqual(requests.map(({ path, redirect }) => ({ path, redirect })), [
    { path: '/auth/v1/signup', redirect: 'https://preview.example/login' },
    { path: '/auth/v1/resend', redirect: 'https://preview.example/login' },
  ])
  assert.ok(requests.every(request => request.body.email === 'learner@example.invalid'))
  assert.equal(requests[1].body.type, 'signup')
})

test('再送の拒否や送信上限を成功扱いにせず、生の内部エラーを表示しない', async () => {
  const failure = { code: 'over_email_send_rate_limit', message: 'private internal details' }
  await assert.rejects(resendConfirmation({ auth: { resend: async () => ({ error: failure }) } }, 'learner@example.invalid', 'https://preview.example'), error => error === failure)
  for (const code of ['over_email_send_rate_limit', 'over_request_rate_limit', 'email_address_not_authorized', 'weak_password', 'signup_disabled']) {
    assert.doesNotMatch(authErrorMessage({ code, message: 'private internal details' }), /private/)
  }
  assert.match(authErrorMessage(failure), /上限/)
  assert.match(authErrorMessage({ code: 'email_address_not_authorized' }), /送信設定/)
  // GoTrueの旧応答とAPIバージョン付き応答を、実SDKのエラー変換まで確認。
  for (const modern of [false, true]) {
    const client = createClient('http://127.0.0.1:54321', 'fictional-test-key', {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: async () => new Response(JSON.stringify({
        [modern ? 'code' : 'error_code']: 'email_not_confirmed', msg: 'private details',
      }), { status: 400, headers: { 'Content-Type': 'application/json', ...(modern ? { 'X-Supabase-Api-Version': '2024-01-01' } : {}) } }) },
    })
    await assert.rejects(authenticate(client, 'learner@example.invalid', 'fictional-password', false), error => authErrorMessage(error) === '確認メールからメールアドレスを確認してください。')
  }
})

test('期限切れ・使用済みの確認リンクを固定文言へ変換し、任意のURL内容を表示しない', () => {
  assert.match(confirmationError(new URL('https://preview.example/login#error=access_denied&error_code=otp_expired&error_description=private-value')), /有効期限/)
  assert.match(confirmationError(new URL('https://preview.example/login?error_code=otp_expired')), /再送/)
  assert.doesNotMatch(confirmationError(new URL('https://preview.example/login#error_description=private-value')), /private-value/)
  assert.equal(confirmationError(new URL('https://preview.example/login')), '')
})
