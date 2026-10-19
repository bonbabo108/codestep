import type { SupabaseClient } from '@supabase/supabase-js'

export function confirmationRedirect(origin: string): string {
  const url = new URL(origin)
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) {
    throw new Error('invalid confirmation origin')
  }
  return new URL('/login', url.origin).href
}

export async function authenticate(client: Pick<SupabaseClient, 'auth'>, email: string, password: string, signUp: boolean, emailRedirectTo?: string): Promise<'signed-in' | 'confirm-email'> {
  if (signUp) {
    const { data, error } = await client.auth.signUp({ email: email.trim(), password,
      ...(emailRedirectTo ? { options: { emailRedirectTo } } : {}),
    })
    if (error) throw error
    // メール確認前にはセッションがない。プロフィール作成は初回進捗保存時。
    return data.session ? 'signed-in' : 'confirm-email'
  }
  const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password })
  if (error) throw error
  if (!data.session) throw new Error('session unavailable')
  return 'signed-in'
}

export async function resendConfirmation(client: Pick<SupabaseClient, 'auth'>, email: string, origin: string): Promise<void> {
  const { error } = await client.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: confirmationRedirect(origin) } })
  if (error) throw error
}

// URL内の生のエラー文やトークンは表示・ログ出力しない。
export function confirmationError(url: URL): string {
  const hash = new URLSearchParams(url.hash.slice(1))
  const code = hash.get('error_code') || url.searchParams.get('error_code')
  if (code === 'otp_expired') return '確認リンクの有効期限が切れているか、使用済みです。メールアドレスを入力して確認メールを再送してください。'
  if (code || hash.has('error') || hash.has('error_description') || url.searchParams.has('error') || url.searchParams.has('error_description')) {
    return 'メールの確認を完了できませんでした。メールアドレスを入力して確認メールを再送してください。'
  }
  return ''
}

export function authErrorMessage(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : null
  if (code === 'invalid_credentials') return 'メールアドレスとパスワードを確認してください。'
  if (code === 'email_not_confirmed') return '確認メールからメールアドレスを確認してください。'
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') return '送信回数の上限に達しました。しばらく待ってから再試行してください。'
  if (code === 'email_address_not_authorized') return 'この宛先への確認メール送信は現在許可されていません。運営者にメール送信設定の確認を依頼してください。'
  if (code === 'email_address_invalid') return '有効なメールアドレスを入力してください。'
  if (code === 'weak_password') return 'パスワードが安全性の条件を満たしていません。文字数や文字の組み合わせを見直してください。'
  if (code === 'signup_disabled') return '現在、新規登録は停止しています。既存のアカウントでログインしてください。'
  return '認証を完了できませんでした。入力内容と通信状態を確認してください。'
}
