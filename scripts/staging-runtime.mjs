import { readFileSync, statSync } from 'node:fs'
import { spawn } from 'node:child_process'

export const stagingRef = 'ezjzgebehancbxqpgany'
export const stagingUrl = `https://${stagingRef}.supabase.co`
export const credentialFile = process.env.CODESTEP_STAGING_CREDENTIALS || '/tmp/codestep-staging-session.json'

export function readStagingConfig(path = credentialFile) {
  if (process.env.CODESTEP_STAGING_TESTS !== '1') throw new Error('staging opt-in required')
  if (statSync(path).mode & 0o077) throw new Error('credentials must be private (0600)')
  const config = JSON.parse(readFileSync(path, 'utf8'))
  if (config.url !== stagingUrl || !config.publishableKey?.startsWith('sb_publishable_')
    || !config.secretKey?.startsWith('sb_secret_')) throw new Error('staging configuration mismatch')
  return config
}

export function guardedFetch(input, init) {
  const url = new URL(input instanceof Request ? input.url : String(input))
  if (url.origin !== stagingUrl) throw new Error('non-staging request blocked')
  return fetch(input, init)
}

// .env.localは読み替えず、プロセス環境の公開用2変数だけ上書き。
// サーバー専用キーやテストパスワードは子プロセス環境へ渡さない。
export function runStagingApp(args) {
  const config = readStagingConfig()
  const env = { ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: config.url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: config.publishableKey,
    NEXT_TELEMETRY_DISABLED: '1',
  }
  for (const name of Object.keys(env)) {
    if (/SERVICE_ROLE|SECRET_KEY|STAGING_CREDENTIALS/.test(name)) delete env[name]
  }
  const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', ...args], { env, stdio: 'inherit' })
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
  child.on('exit', code => { process.exitCode = code ?? 1 })
}

if (process.argv[1]?.endsWith('/staging-runtime.mjs')) {
  try { runStagingApp(process.argv.slice(2)) }
  catch { console.error('staging起動拒否：専用接続設定と明示opt-inを確認してください。'); process.exitCode = 1 }
}
