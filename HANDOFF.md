# CodeStep 再開用の現在地

更新：2026-10-21。恒久ルールは[AGENTS.md](./AGENTS.md)、改善・承認基準は[AI_WORKFLOW.md](./AI_WORKFLOW.md)。最新状態を本書へ集約し、詳細は[判断記録](./docs/decisions.md)。

## 現在の目的と今回の訂正

講座最終課題を完成し、本人が説明できる状態にする。本人のスマホ評価により「旧デモはCRUDできるが、本物と操作感が違う」と判明。旧デモの完成判断を訂正し、本物UI再利用へ変更した。[比較と証拠](./docs/admin-demo-parity.md)。今後も簡易版を別制作せず共通UI＋データ処理分離を優先する。

## 実Git・PRと保存状態

- cwdはcodestepルート、worktreeは1件、branch `codex/admin-rls-portfolio`。開始HEAD `f77050e079f471c4d965441ae89350413bdb4896`、開始statusは空。想定外差分なし、破棄なし。
- [既存アプリPR #3](https://github.com/bonbabo108/codestep/pull/3)はopen/draft/未マージ。今回も同PRへ集約。最新HEAD/statusは再開時に実Gitで確認する。
- 共通UIのコード/比較資料は`b07a65f77b6a789a8315a6f4baa4b855c941f2d6`でcommit/push済み。公開確認を記録する後続資料も同PRへ保存。最新HEAD/statusは実Gitで確認し、想定外差分を保持する。新たなPRは作らない。
- 提出用READMEは[既存portfolio PR #3](https://github.com/bonbabo108/codestep-portfolio/pull/3)、branch `codex/staging-auth-status-20261019`、前回確認commit `3fc35442d37ddfc04729833b8c5f5cd11e2b2ba9`。今回は移動/削除/重複作成していない。
- `codestep_key_files.txt`と既存画像は保持、Git対象へ追加しない。`git add .`禁止。

## 実装済み

- `components/QuestionManager.tsx`：実管理画面から抽出した共通フォーム/一覧/編集/取消/通知/進捗確認付きAlertDialog/操作lock。通常`/admin`と`/demo/admin`が同じUIを利用。ダブルクリックの第2送信を抑制し、16px入力色・44px操作領域を双方へ適用。
- `SiteHeader.tsx`：共通メニュー/レイアウト。通常は既存Auth表示、デモは小さなデモ表示。デモ内リンクは学習/管理デモへ留める。
- `QuestionRepository`：通常は既存Supabase CRUD/RPCへ委譲。デモは訪問単位のメモリのみ、架空3問/進捗1件、CRUD/関連進捗確認/再確認/リセット。学習・管理の遷移で共有、再読込/デモ外離脱で初期化。実Auth/DBを受け取らず、通常側へのフォールバックなし。
- 制限表示：実ログイン/権限変更/他ユーザーとの同時更新/DB通信障害は再現しない。操作できるふりをしない。
- 実Authガード、app_metadata.codestep_admin===true、SQL/RLS/RPC/管理者権限/本番環境は未変更。

## 検証済みと限界

- 最終ソースのnpm test **77件成功**（既存70＋repository7）、lint・typecheck・ダミーWebpackビルド成功。追加テストはCRUD/進捗再確認/隔離/abort/実SDK接続境界/権限拒否/デモ依存分離。
- PC幅1280/スマホ幅390：通常UI＋架空Auth/APIとデモの画像/CRUD/編集・取消/通知を比較。PC列幅・フォーム種類一致。スマホ双方390=scrollWidth390、セクション350px、入力16px/同じ文字色。
- 通常UI＋モックで保存拒否時の入力保持、900ms保存中の操作禁止、履歴確認拒否時の削除禁止、匿名/一般の管理フォーム拒否。デモCRUD/進捗削除/リセット中のAuth/Data追加要求0。PCダブルクリックも作成1件/成功通知。
- 学習正解→デモ管理へ戻ると関連進捗の警告を表示。再読み込み/リセットで初期化。
- [画像と範囲](./docs/admin-demo-parity.md)、[テスト記録](./docs/test-plan.md)。旧2026-10-19画像/70件成功は履歴で、現在UIの比較証拠は2026-10-20を参照。
- **2026-10-21の本人Android確認：** 修正版の公開管理画面デモについて、前版から改善し操作感に問題ないとの本人報告を受領。本人報告の範囲は管理デモであり、実staging管理者ログイン・実DB CRUD・修正後の実メール認証まで成功した根拠ではない。
- **実staging管理者での最新画面/実DB CRUD再確認は未実施**。Chromeに有効セッションがなく、一時資格情報も残っていない。本人へ既存管理者でのログインを依頼済み。認証迂回/アカウント作成/パスワード変更はしていない。本人の返答がなければ同じ質問やDB調査を繰り返さない。
- 通常UIの最新証拠は架空API。2026-10-17の実staging CRUD/RLS結果を再利用するが、今回実DBを再検証したとは説明しない。

## 環境・残存プロセス

- 固定staging：[管理デモ](https://codestep-git-codex-admin-rls-portfolio-touya1896-7818s-projects.vercel.app/demo/admin)。公開例外はこの1hostnameだけ。今回公開範囲変更なし。
- staging Supabase `ezjzgebehancbxqpgany`、本番 `xdnmlfoblqdygsnhkxxp`。[本番](https://codestep-two.vercel.app)は旧main、今回触れない。
- `.env.local`は本番。ローカルは公開変数を127.0.0.1:54321/local-test-placeholderへ上書きしてbuild。
- 再利用用`npm run verify:admin-ui`：実接続ビルドを拒否し、ループバックだけで架空Auth/Data＋Next3100を起動。今回のランチャー停止後、3100/54321のLISTENなしを確認。再起動は[比較資料](./docs/admin-demo-parity.md)の手順。古い一時ファイルやトークンは再開の必須依存にしない。

## 未確認・承認と次の一手

1. コード[CI成功](https://github.com/bonbabo108/codestep/actions/runs/39364164572)、[Preview Ready](https://vercel.com/touya1896-7818s-projects/codestep/3KQPoc6DfR1NHA1Ks4HhRVFdsaqC)、固定stagingの新UI/PC追加・390px編集/削除/リセットを確認済み。本人Androidの管理デモ操作感は確認済み。次は実管理画面への既存管理者ログイン後の比較と認証確認。main/本番へ進めない。
2. 本人が既存管理者でログイン済みになれば、実画面比較を追加する。資格情報はチャット/公開資料へ保存しない。
3. [認証の8項目](./docs/auth-release-checklist.md)：修正後の新しいアカウントによるAndroid/PC実メール確認・ログイン・再読込維持・再送後確認・dark/autofillは本人結果が未確認。以前のメール受信/別アカウント成功と混同しない。
4. 本人の技術説明確認（Androidでの管理デモ操作感は本人確認済み）。OAuth・独立外部API・画像/音声入力は未実装、満点達成と説明しない。メール日本語化/差出人ブランド化は低優先。
5. 本番DB/Auth/RLS/ACL/RPC/制約への反映・mainマージ/Productionは最終承認待ち。[公開前提](./docs/release-readiness.md)。緊急停止/復旧・旧7→4試験は再開禁止。

安全な通常編集・仮API/テスト・作業ブランチcommit/push・既存PR更新・通常stagingデプロイは包括承認済み。高リスクとツール自体の許可は正規に扱う。再開時はAGENTS→AI_WORKFLOW→本書と実Git/PR/プロセスを照合し、差分と未完了から継続する。
