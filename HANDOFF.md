# CodeStep 再開用の現在地

更新：2026-10-19。恒久ルールは[AGENTS.md](./AGENTS.md)、共同作業の判断・改善は[AI_WORKFLOW.md](./AI_WORKFLOW.md)。このファイルは最新の再開点を上書き更新し、長い履歴は[判断記録](./docs/decisions.md)へ残す。

## 目標と現在の優先順

講座評価基準に沿ってポートフォリオを完成し、本人が技術を説明できるようにする。現在は登録不要の管理画面デモを先に完成。認証の本人未確認項目は最終確認へ保持する。main/本番は最終承認まで反映しない。

## 再開時に実確認したGit/PR（2026-10-19）

- cwd/worktree：実際のpwdでcodestepリポジトリのルートと確認、worktreeはこの1件。個人のホームパスは公開資料に保存しない。branch：`codex/admin-rls-portfolio`。
- 資料整備開始時HEAD：`126a1524062f94d933206644b0142657dac84a31`。認証修正のコミット。現在のHEADは `git log -1` で確認する（この資料自身のSHAは固定しない）。
- [アプリPR #3](https://github.com/bonbabo108/codestep/pull/3)：API読取でopen/draft・未マージ、headは上記branch/126a152と照合した。再開時も最新headを読む。
- 未コミットの途中デモ8パスを保持：`app/demo/page.tsx`、`app/globals.css`、`components/AppShell.tsx`、`components/Header.tsx`、新規`app/demo/admin/page.tsx`、`components/DemoExperience.tsx`、`lib/demo.ts`、`tests/demo.test.mjs`。本資料3ファイルは先に別コミットへ保存し、デモを破棄せず続ける。
- [提出用READMEの既存PR #3](https://github.com/bonbabo108/codestep-portfolio/pull/3)：open、branch `codex/staging-auth-status-20261019`、観測head `db26cd16e56f8c07aa5fe7e89552d580c354a66e`。READMEの場所はそのまま。新PRやアプリREADMEは作らない。
- `codestep_key_files.txt`はGit対象外のまま保持。秘密ファイルを開いて引き継ぎにコピーしない。

## 実装・検証の現在地

- 認証：公開origin/loginへの確認・再送、入力のlight配色/自動入力対策、SDK initialize→getSession、専用エラー、URL認証パラメータ除去、再送入口を126a152でstaging反映済み。
- 管理者CRUD・本人進捗保存/復元・RLSは既存実装を維持。既存stagingの実CRUD/RLS/本人制限試験、削除警告→取消/確定の証拠を再利用する。現在の実DB状態と過去の試験日を混同しない。
- 既存 `/demo` はメモリの架空データで学習と問題管理を体験可能。途中変更は `/demo/admin` の管理開始・公開ページのワンクリックリンク、共通DemoExperience、サンプルCRUDモデル、入力配色/タップ領域、5件のモデル試験。
- 中断前の途中ソースで70テスト・lint・typecheck・ダミーWebpackビルド成功。新資料だけの変更でアプリ試験を重複実行しない。デモのPC/390pxブラウザ・API非通信検証と、新ソースのCI/Previewはまだ未確認。
- 126a152の[認証修正PR CI成功](https://github.com/bonbabo108/codestep/actions/runs/39199480395)。Vercel Preview Readyを前回確認済み。今回の資料/デモのCI成功とは読み替えない。
- 本人報告：スマホから固定stagingへ到達可能。確認メール受信は以前成功。今回の新規アカウント確認は修正前に失敗。修正後Android/PCのメール認証・ログイン維持・期限切れ再送後の確認、実dark/autofillは[8項目](./docs/auth-release-checklist.md)で未確認のまま。

## 環境・残存プロセス

- 固定staging：<https://codestep-git-codex-admin-rls-portfolio-touya1896-7818s-projects.vercel.app>。この1ドメインだけ公開例外化が承認・反映済み。他PreviewのVercel保護は維持。新たな公開解除は行わない。
- staging Supabase：`ezjzgebehancbxqpgany`。本番：`xdnmlfoblqdygsnhkxxp`。本番URL <https://codestep-two.vercel.app> は旧main。本番DBは書込停止中で、完成版の適用済みと説明しない。
- `.env.local`は本番。ダミービルドはNEXT_PUBLIC_SUPABASE_URLを `http://127.0.0.1:54321`、公開キーを `local-test-placeholder` へプロセス上書きした。
- 中断前に起動した `/private/tmp/codestep-demo-verify-20261019.mjs` は3100のダミー接続Nextと54321の通信記録APIを管理。再開時に残存を確認してから再起動/停止する。記録 `/private/tmp/codestep-demo-api-requests.json` はパス/メソッドだけ。今回の読取は `[]`。まだブラウザ操作をしていないのでデモの通信0件成功とは扱わない。

## 次の一手と完了条件

1. AGENTS/AI_WORKFLOW/HANDOFFの3ファイルだけを指定してcommit/pushし、既存PR #3へ保存。未検証デモは途中差分として保持する。
2. 既存のローカルビルド/サーバーを再利用し、PC/390pxで管理デモ直達、作成/入力保持/連打/編集/削除取消・確定/空/初期化/再読込を確認。通信記録が0件か照合する。本物の管理者機能/RLSは変更しない。
3. 設計・評価証拠・ワイヤー/機能一覧・技術説明を実装に合わせて整える。提出用READMEは既存場所/PRで更新する。Supabaseメールの日本語化・差出人ブランド化は低優先の改善として記録する。
4. まとめたデモ変更を同じアプリPRへcommit/push。CI/Previewと公開URLの画面を確認して本ファイルを更新する。必要な本人テスト/本番前の承認条件だけを残す。

## 承認と未解決

通常編集・仮API・ローカル試験・作業ブランチcommit/push・既存PR更新・stagingコード更新は包括承認済み。同じ業務承認を再質問しない。ツール固有の実行許可は正規に扱う。本番/DB/Auth変更、セキュリティ低下、新たな公開、機密公開、重要な差分消失、課金、主要仕様変更、main/Productionは事前承認が必要。

未解決：最新メールでも失効するかは本人再テスト待ち。ログのtoken検索失敗から先読み/旧リンク/時間切れのどれかを断定できない。緊急停止・復旧/旧7→4試験は一部未検証のまま再開禁止。本番反映には未適用のRLS/ACL/RPC/制約等の別承認が必要。詳細は[公開判断](./docs/release-readiness.md)と[評価証拠](./docs/evaluation-evidence.md)。
