#!/usr/bin/env node
/**
 * One-off CodeStep production Auth Admin API helper.
 * Run locally on the account owner's Mac, from a checkout with @supabase/supabase-js installed.
 * Secrets are entered on a hidden terminal prompt, never printed, saved or sent to GitHub.
 * Only app_metadata.codestep_admin is added; all existing metadata is preserved.
 */
import { createClient } from '@supabase/supabase-js';
import { createInterface } from 'node:readline/promises';

const PROJECT_REF = 'xdnmlfoblqdygsnhkxxp';
const PROJECT_URL = `https://${PROJECT_REF}.supabase.co`;

class SafeError extends Error {}
function fail(message) {
  throw new SafeError(message);
}

function hiddenInput(label) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || !process.stdout.isTTY || typeof process.stdin.setRawMode !== 'function') {
      reject(new SafeError('Macのターミナルで直接実行してください（パイプや自動実行では動きません）。'));
      return;
    }
    process.stdout.write(label);
    let value = '';
    process.stdin.setRawMode(true);
    process.stdin.resume();
    const finish = (err) => {
      process.stdin.removeListener('data', onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
      if (err) reject(err);
      else resolve(value.trim());
    };
    const onData = (bytes) => {
      for (const c of bytes.toString('utf8')) {
        if (c === '\r' || c === '\n') { finish(); return; }
        if (c === '\u0003') { finish(new SafeError('中止しました。')); return; }
        if (c === '\u007f' || c === '\b') { value = value.slice(0, -1); continue; }
        if (c.charCodeAt(0) >= 32) value += c;
        if (value.length > 4096) { finish(new SafeError('入力値が長すぎます。')); return; }
      }
    };
    process.stdin.on('data', onData);
  });
}

function displayEmail(email) {
  const [name = '', domain = ''] = String(email || '').split('@');
  return `${name.slice(0, 2)}***@${domain || 'unknown'}`;
}

async function main() {
  console.log(`対象: CodeStep 本番 Supabase (${PROJECT_REF})`);
  console.log('このツールは既存1アカウントの管理者フラグだけを変更します。');
  const key = await hiddenInput('本番Settings > API Keys の secret（またはlegacy service_role）を貼り付け、Enter: ');
  if (!(key.startsWith('sb_secret_') || (key.split('.').length === 3 && key.startsWith('eyJ')))) {
    fail('秘密鍵の形式が違います。anon / publishable key は使用できません。');
  }

  const client = createClient(PROJECT_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const usersResult = await client.auth.admin.listUsers({ page: 1, perPage: 2 });
  if (usersResult.error || !Array.isArray(usersResult.data?.users)) {
    fail('ユーザー一覧を取得できません。キーが正しい本番プロジェクトのものか確認してください。');
  }
  const users = usersResult.data.users;
  if (users.length !== 1 || (typeof usersResult.data.total === 'number' && usersResult.data.total !== 1)) {
    fail('本番のユーザーがちょうど1件ではありません。対象を推測せず停止しました。');
  }

  const target = users[0];
  if (!target?.id || !target.email || target.is_anonymous) {
    fail('既存アカウントの属性を確認できません。変更せず停止しました。');
  }
  const { data: before, error: readError } = await client.auth.admin.getUserById(target.id);
  if (readError || before?.user?.id !== target.id) fail('管理者指定前の本人情報を再取得できません。');
  const existing = before.user.app_metadata;
  if (!existing || typeof existing !== 'object' || Array.isArray(existing)) {
    fail('既存app_metadataを安全に維持できないため停止しました。');
  }

  console.log(`対象の既存アカウント: ${displayEmail(target.email)}`);
  console.log('※自分のアカウントでなければ、YESを入力せず中止してください。');
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question('この1アカウントだけに管理者権限を付けるなら YES と入力: ')).trim();
  rl.close();
  if (answer !== 'YES') fail('中止しました。変更なし。');

  if (existing.codestep_admin !== true) {
    const result = await client.auth.admin.updateUserById(target.id, {
      app_metadata: { ...existing, codestep_admin: true },
    });
    if (result.error || result.data?.user?.id !== target.id) {
      fail('更新結果を確認できません。再試行せず、管理画面で現状を確認してください。');
    }
  }
  const { data: after, error: verifyError } = await client.auth.admin.getUserById(target.id);
  if (verifyError || after?.user?.id !== target.id || after.user.app_metadata?.codestep_admin !== true) {
    fail('更新後の確認ができません。再実行せず現状を確認してください。');
  }
  for (const [name, value] of Object.entries(existing)) {
    if (name !== 'codestep_admin' && JSON.stringify(after.user.app_metadata[name]) !== JSON.stringify(value)) {
      fail('既存app_metadataの一致を確認できません。追加変更せず管理画面で確認してください。');
    }
  }
  console.log('成功：本番の本人アカウント1件だけに codestep_admin: true を設定・再読取確認しました。');
  console.log('次はCodeStepからログアウトして、同じアカウントでログインし直してください。');
}

main().catch((error) => {
  // Never print API errors, token details, server payloads or stack traces.
  console.error(`停止：${error instanceof SafeError ? error.message : '予期しないエラー（鍵は表示しません）。'}`);
  process.exitCode = 1;
});
