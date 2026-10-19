# CodeStep 再開用の現在地

更新：2026-10-19。恒久ルールは[AGENTS.md](./AGENTS.md)、共同作業の改善・承認基準は[AI_WORKFLOW.md](./AI_WORKFLOW.md)。最新の再開点を本書に集約し、詳細履歴は[判断記録](./docs/decisions.md)へ残す。

## 目標と優先順

講座評価基準に沿ってポートフォリオを完成し、本人が技術を説明できる状態にする。登録不要の管理画面デモは実装・公開確認まで完了。残る本人認証テストと最終説明を確認し、本番変更/mainマージは最終承認を待つ。

## 実確認したGitとPR

- cwdは実pwdでcodestepリポジトリのルート、worktreeはこの1件。個人ホームのパスは公開資料に保存しない。
- branch：`codex/admin-rls-portfolio`。[アプリPR #3](https://github.com/bonbabo108/codestep/pull/3)はopen/draft・未マージ。新PRなし。
- 恒久ルール保存：`8399cdf`。管理デモ/証拠/設計更新：`be683af62366d862cd98caa0018164b69b761dd3`。この最終引き継ぎ記録の後続コミットも同PRへ保存するため、最新HEADは `git log -1` で取得する。
- コード反映後の実 `git status --short` は空。中断前のデモ8パスは破棄せずbe683afへ保存済み。未コミットの引き継ぎ対象はなし。再開時に現地差分があれば保持する。
- [提出用READMEの既存PR #3](https://github.com/bonbabo108/codestep-portfolio/pull/3)：branch `codex/staging-auth-status-20261019`、更新commit `3fc35442d37ddfc04729833b8c5f5cd11e2b2ba9`。READMEのUTF-8/読み戻し全文一致を確認。mainへマージしていない。
- `codestep_key_files.txt`はGit対象外のまま保持。提出用READMEの保存場所はcodestep-portfolioに維持。アプリ側にREADMEを再作成・移動しない。

## 完了した実装と証拠

- `/demo/admin`：公開ページの「管理画面デモ（登録不要）」から1クリック。アカウント/管理者権限不要。独立したサンプルで追加・一覧・編集・削除・取消・初期化・学習切替が可能。再読込で初期化される。
- `/demo`と共通DemoExperience、共有の入力検証/回答判定、メモリだけのCRUDモデル。実管理画面/AuthProvider/管理者判定/SQL/RLSの変更なし。
- ローカル70テスト、lint、typecheck、ダミーWebpackビルド成功。[be683afのPR CI成功](https://github.com/bonbabo108/codestep/actions/runs/39214651348)。後続が資料のみなら同じアプリ試験を最初から反復せず、最新PRのCIを確認する。
- PC/390px：空白エラー時の入力保持、追加連打で1件、一覧/編集/削除取消・確定、学習でその問題の正解、全件削除/空/初期化/再読込。390=scrollWidth390。直接デモ訪問から操作終了までダミーAuth/DBへの要求0件。
- 固定stagingの公開 `/demo/admin` で390pxの追加/編集/削除/初期化と横溢れなしを実ブラウザ確認。Vercelアカウント不要。これは実Android操作とは区別する。[PC画像](./docs/screenshots/final-20261019/admin-demo-desktop.jpg)、[390px画像](./docs/screenshots/final-20261019/admin-demo-mobile.jpg)。
- 設計/ER/画面遷移・評価証拠・技術説明・READMEへデモを反映。[最終設計](./docs/final-design.md)、[評価](./docs/evaluation-evidence.md)、[説明](./docs/mentor-notes.md)。Auth UUIDの論理対応と実DBにないauth.users FKを区別する。
- 認証は126a152で入力表示/実フォーム値/SDK初期化/再送をstaging反映済み。管理者CRUD・本人進捗/RLSの既存staging実試験は再利用し、現在のDB状態と断定しない。

## 環境と残存プロセス

- 固定staging：<https://codestep-git-codex-admin-rls-portfolio-touya1896-7818s-projects.vercel.app/demo/admin>。公開例外はこのhostname1件のみ、他Previewの保護を維持。追加の解除・公開設定変更なし。
- staging Supabase：`ezjzgebehancbxqpgany`。本番：`xdnmlfoblqdygsnhkxxp`。本番URL <https://codestep-two.vercel.app> は旧main。今回、本番/DB/Authユーザー/RLS/管理者権限/課金は変更していない。
- `.env.local`は本番接続。ローカルbuildは公開URLを `http://127.0.0.1:54321`、公開キーを `local-test-placeholder` へプロセス上書きした。
- 検証用Next3100/ダミーAPI54321は今回のランチャーだけを停止し、lsofで両ポートのLISTENなしを確認。不要な起動し直し不要。一時ファイルは再開の必須依存にしない。実データや秘密ファイルは削除していない。

## 残る本人確認と承認

1. [認証チェックリスト](./docs/auth-release-checklist.md)の8項目：今回の新規アカウントによる修正後Android/PCの実メール確認・ログイン・再読込維持・再送後確認、実dark/autofill。本人報告ではスマホのstaging到達と以前のメール受信は成功、今回の確認フローは修正前に失敗。修正後の本人結果は未確認。
2. 最新メールでも失敗するかは未確認。token検索失敗から先読み/旧リンク/時間切れを断定しない。本人の試行時刻/ブラウザ/表示文言を受け取った場合だけ必要最小限で調査する。パスワード/確認リンク/コードは求めない。
3. 本人による操作感と技術説明の確認。OAuth・独立外部API・画像/音声入力は未実装で最高点の全達成とは説明しない。
4. main/Productionと本番RLS/ACL/RPC/制約/Authへの反映は未承認。[公開前提](./docs/release-readiness.md)を確認し、最終承認前に実行しない。
5. メールの日本語化・差出人ブランド化は低優先で記録済み。SMTP/契約を勝手に変更しない。

通常の安全な編集・検証・作業ブランチcommit/push・既存PR更新・stagingコード更新は包括承認済み。同じ業務承認を再質問しない。ツール権限は正規に扱う。緊急停止/復旧・旧7→4試験は一部未検証のまま再開禁止。

## 新しいチャットの最初の一手

AGENTS→AI_WORKFLOWと本書、既存資料の最新節を確認する。実cwd/worktree/branch/status/diff/PR headを照合し、記録以降の差分だけを調べる。管理デモの実装・70テスト・公開CRUDは完了済み。本人の新しい結果がなければ同じ認証質問やDB調査を繰り返さず、残る最終確認・説明準備を進める。安全な通常作業は自律実行し、高リスクの具体的な最終承認だけを人間へ依頼する。
