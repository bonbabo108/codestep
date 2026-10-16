import type { SupabaseClient } from '@supabase/supabase-js'

export async function authenticate(client: Pick<SupabaseClient, 'auth'>, email: string, password: string, signUp: boolean): Promise<'signed-in' | 'confirm-email'> {
  if (signUp) {
    const { data, error } = await client.auth.signUp({ email: email.trim(), password })
    if (error) throw error
    // メール確認前にはセッションがない。プロフィール作成は初回進捗保存時。
    return data.session ? 'signed-in' : 'confirm-email'
  }
  const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password })
  if (error) throw error
  if (!data.session) throw new Error('session unavailable')
  return 'signed-in'
}

export function authErrorMessage(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : null
  if (code === 'invalid_credentials') return 'メールアドレスとパスワードを確認してください。'
  if (code === 'email_not_confirmed') return '確認メールからメールアドレスを確認してください。'
  return '認証を完了できませんでした。入力内容と通信状態を確認してください。'
}
