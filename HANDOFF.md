# CodeStep 再開用の現在地

更新：2026-10-21。恒久ルールは[AGENTS.md](./AGENTS.md)、改善・承認基準は[AI_WORKFLOW.md](./AI_WORKFLOW.md)。最新状態を本書へ集約し、詳細は[判断記録](./docs/decisions.md)。

## 2026-10-21 本番準備の最新結果（以下の過去状態より優先）

- 本人の条件付きDB/Auth承認を受領。唯一の既存Authアカウントは本人所有との回答済み。暗号化backup内のIDと現在の唯一のIDの一致を非公開で確認し、同じ所有確認を質問し直さない。
- 非公開backupはGit外の `~/.codestep-private-backups/2026-10-21/`（0700、各ファイル0600）。本番内READ ONLYで3表全行/列/制約/RLS/ACL/所有者・対象Auth app_metadata/IDを公開鍵暗号化し保存。復号→隔離PostgreSQL17.5で全行/カタログ/Authメタデータ一致、本番17.6との適用前再照合も全true。Auth資格情報/セッションやHosted Supabase/PITR全体の復元試験ではない。
- HomebrewはmacOS27未対応で停止し、OS判定を回避していない。公式OpenPGP.js6.3.2/PGlite0.4.6をアプリ外 `/private/tmp/codestep-backup-tools` へ固定導入。`scripts/production-backup.mjs verify` は既存ファイルを上書きせず同じbackupの検証を再開可能。init/query/receiveは再実行しない。schema-restore.sqlは旧危険ACLも含む検証用で、本番へ一括復元禁止。
- **本番適用済みSQLは2本だけ**：`progress-release-proposal.sql`（migration `codestep_production_progress_acl_20261021`）→ `progress-unique-proposal.sql`（`codestep_production_progress_unique_20261021`）。各原本の承認ハッシュを新規要求前に照合。profiles/progressの本人6ポリシー・RLSを維持、anonの表/列権限なし、authenticatedはSELECTと必要列I/Uのみ、DELETE/TRUNCATE等なし。UNIQUE(user_id,question_id)確認、重複0。
- 適用後も全3表の全行はbackupと一致（profiles1/questions2/progress0）、対象Authも変更なし。catalog比較falseは上の意図したACL/UNIQUE差分。security advisorは漏洩パスワード保護OFFの既存警告1件、DB/RLSの追加警告なし。これは実利用者APIの書込試験ではない。
- **Auth URL反映済み**：Site URL `https://codestep-two.vercel.app`、Redirect URLsは同 `/login` 完全一致1件。GUI保存→再読込で一致。私的証跡 `/private/tmp/codestep-production-auth-after-20261021.jpg`。Confirm email OFF/独自SMTPなしを維持、新規メール/ユーザー作成なし。
- **管理者指定・questions RLS/RPCは未適用**：正規Auth Admin APIを実行する接続手段がなく、既存GUIのUsers詳細/Raw JSONも閲覧のみ。Authテーブル直接UPDATEや資格情報探索へ切り替えない。唯一の本人アカウントを既存app_metadata保持で管理者指定し、新JWTを本人が取得/検証できる正規手段を準備するまで、計画のquestions書込停止と残り2 SQLを保留。秘密をチャットへ送らせない。
- **main/Productionは未承認・未実行**。必要DB/Auth/SMTP・検証・最新CI/レビューが揃ったマージ直前に再確認する。SMTPはない/不明、新規契約/課金禁止。標準SMTPの事前承認宛先のみ・2通/時では一般公開の認証メールを完成扱いしない。
- 保存対象は本書/AI_WORKFLOW/公開計画/review manifest/判断・テスト記録/backup補助スクリプトだけ。同じ作業ブランチ・PR #3へまとめる。最終HEAD/未commitは実Gitで解決。鍵/backup/実データ/私的画像はcommitしない。
- **次の一手**：正規Auth Admin APIの利用手段とSMTPサービス/送信元の本人判断を解決する。既存2 SQLの再適用・backup作り直し・緊急停止/復旧試験・追加機能へ進まない。

## 2026-10-21 本番準備の読取観測（上の承認・条件を優先）

- 開始HEAD6d7eaf1/単一worktree/未commitなし。PR head6836a44の差分はHANDOFF/評価資料だけ3コミットと照合し、fast-forward済み。本人Androidのデモ評価は引き継ぎ記録で確認済み。コードは既存77テスト/CIを再利用、最新headの[CI成功](https://github.com/bonbabo108/codestep/actions/runs/39454790710)。PR #3=draft/open、競合なし・4 checks成功・レビュー0。GitHubの保護一覧/rulesetsは空で、設定は変更していない。
- 本番xdnmlfoblqdygsnhkxxp：2問題/1profile/進捗0/Auth1（確認済み1/admin0）、重複/孤児0、3表RLS/16列/NO ACTION FK。questionsは旧7ポリシー＋SELECTのみ。profiles/progressの匿名・一般に過大ACL/TRUNCATEが残る。UNIQUE/RPC/privateスキーマなし。
- Vercel Productionは現在main274eb79、Ready/dpl_7y4n5KfqLz8jHYn9KRh2SmTyDpjF、公開codestep-two.vercel.app。Production URL/公開キーは本番ref/anon/期限内、secretではないと値非記録で照合済み。変数変更不要。実チームはteam_ElBqxblU9glF6Lgu1Ekw0jzo、project prj_5yGFbE2rPl1XdsEje93egTHl01do。
- コネクタは正しい実scopeでも403、CLIなし。保護解除/資格情報探索/迂回はしない。既存の正規ログイン済みGUIで閲覧できる設定だけ読んだ。最初の照会はscope指定違いで訂正済み、権限復旧とは説明しない。
- **新しい公開前提**：本番Site URLはlocalhost、許可戻り先0、Confirm email OFF、独自SMTPなし。標準SMTPは一般宛先へ制限があるため、SMTP本体はブランド化と異なりメール認証公開の必須項目。認証OFFのまま完成扱いしない。
- **バックアップ未取得**：Free/no backups。非公開ローカルbackup取得/検証と復元手順を本番書込の前提へ設定。既存DBパスワードの本人による非表示入力等が必要になり得る。チャットへ資格情報を求めない。
- [最新の最小変更・保全・復旧・承認計画](./docs/release-readiness.md)と[本番レビューmanifest](./docs/production-release.review.json)を準備。RPCの本番用提案はコメント2行以外staging原本と同一。原本と既存承認は保持し、新しい本番承認だけを求める。
- 本番DB/Auth/権限・メール送信・ユーザー作成/削除・Vercel設定・mainマージは未実施。今回の読取でmigration履歴表がなく1照会が失敗したが、変更なし。後続は存在確認へ修正し、成功と混同しない。
- 当初の承認質問は回答受領済み。以後は最上段の未達条件だけを解決し、同じ承認質問を繰り返さない。

## 2026-10-21 本人の最新決定：本番公開が完成条件

本人は最終評価（PR・マージ・CI/CD・公開URL・実演）を踏まえ、Preview提出を終点にせず、既存アプリPR #3を安全にmainへマージし、Productionでアプリを動作確認できる状態を最優先とした。ローカルAI構築・追加のトークン節約設計は本番完成後に延期する。追加機能や評価点目的の実験を増やさない。

読取専用の2026-10-21現在地：staging DBはquestions=3/profiles=4/user_progress=4、Productionは2/1/0、3表ともRLS有効。stagingのquestionsは公開SELECT＋管理者I/U/Dの4ポリシー、本番は旧7ポリシー（authenticated write3・Demo public write3・公開read1）。Productionにはuser_progress(user_id,question_id)のUNIQUEがなく、delete_question_with_progress RPCもない。実効ACL・ロール権限・Auth URL・Production Vercel接続先・バックアップと復旧計画は本番変更前に照合する。実データのコピー・全件上書き禁止。

Vercelコネクタは対象チームに403で現在読み取り不可。既存の接続済みGUIまたはCodexの正規認証済みローカル手段で読み取りを優先し、アクセス制限の回避は禁止。今回DB書込・マージ・Production操作は未実施。

次はAGENTS/AI_WORKFLOW・docs/release-readiness.md既存案の再利用で本番向け限定差分とバックアップ・段階適用・停止/復旧手順を一括レビューし、対象とリスクと復元方法が明確になった時点で本人に**本番変更・mainマージ/Production公開の個別実行承認**をまとめて求める。未承認の高リスク操作だけ止め、独立した安全な事前検証は自律実行する。最終説明は短く、未確認を成功へ昇格させない。

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
5. 本番DB/Auth/RLS/ACL/RPC/制約への反映・mainマージ/Productionは上の最新計画の明示承認待ち。[公開前提](./docs/release-readiness.md)。緊急停止/復旧・旧7→4試験は再開禁止。

安全な通常編集・仮API/テスト・作業ブランチcommit/push・既存PR更新・通常stagingデプロイは包括承認済み。高リスクとツール自体の許可は正規に扱う。再開時はAGENTS→AI_WORKFLOW→本書と実Git/PR/プロセスを照合し、差分と未完了から継続する。
