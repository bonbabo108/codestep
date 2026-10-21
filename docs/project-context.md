# CodeStep 共通コンテキスト

**再開案内（2026-10-19）：** 最新状態は[HANDOFF.md](../HANDOFF.md)、通常作業の包括承認と改善基準は[AI_WORKFLOW.md](../AI_WORKFLOW.md)。既存の詳細履歴を最初から再調査しない。管理画面デモを優先し、認証の実端末未確認は最終確認へ残す。以下は観測日付きの履歴。


**2026-10-19 認証の最新状態：** 本人の新規登録→確認は失敗報告あり。入力の配色・自動入力値の送信・callback初期化エラー・再送案内を126a152でstagingへ反映済み。自動65件/ローカル架空APIは成功。修正後Android/PCの実メール認証と再読込維持は本人確認待ち。最新の手順と8項目の判定は[認証チェックリスト](./auth-release-checklist.md)を参照。過去の公開到達成功を認証成功とは扱わない。

**2026-10-19 公開アクセス最新結果：** 承認条件を読み取り照合し、固定stagingドメイン1件だけをVercel公開例外へ追加済み。検証DB接続、架空の公開問題3行一致、本人データの匿名拒否、全3表RLS/管理者条件/削除RPC定義維持を確認。Require Log In/Standard Protectionは維持、個別Previewは引き続き保護。本番・DB・権限・mainは未変更。Vercel未ログインのPC/390pxで固定/loginへ到達成功。確認メール受信は本人報告で成功、実PC/実スマホの認証完了・再ログインは本人確認待ち。

**2026-10-19 最新結果：stagingのみURL設定を承認・反映済み。** Site URLは有効なブランチ固定Preview、Redirect URLsは同じoriginの/loginを完全一致で1件。保存後の再読込と既定メールテンプレート .ConfirmationURL の整合を確認。本番は変更なし。実メール受信・PC/実スマートフォンでの確認はユーザー本人が行うため未実施。アプリPR #3はdraft、本番移行待ち。53a5d43のpush/PR CIは62テスト・lint・型・ダミービルド成功、Previewは同SHA/Ready。提出用README PR #2はマージ済み。以下の未適用記載は当時の履歴。

**2026-10-19 最終完成フェーズ：** 緊急停止・復旧の追加試験は行わない。認証・デモ・設計・README・CIを仕上げる。最新の[評価証拠](./evaluation-evidence.md)、[最終設計](./final-design.md)、[認証の設定確認/変更案](./auth-release-checklist.md)を参照。開始HEAD d82ad0e、同一worktree、既存未コミット30ファイルを0600アーカイブへ保全済み。両SupabaseのURL設定を読み取り、Site URL=localhost:3000/許可URLなしと確認した（変更なし）。本番DB移行・URL設定・実メール確認が揃うまでmain/Production反映は保留。以下は過去の観測を含み、最新状態とは断定しない。

更新日：2026-10-17。ブランチcodex/admin-rls-portfolio。現在地だけをまとめ、過去の経緯はdecisions.mdを参照する。

**2026-10-19 10:56 JST 緊急停止試験の最新結果：一部成功・試験データ4行の片付け完了。** 原本stop/resumeによる権限の停止と安全な通常ACLへの復旧は実DB確認済み。今回承認された改訂cleanup（SHA cb183dcda4a43c5ca113034560cf1d72d726418e989425486ba777c32ecf84f1）だけを1回・単一TXで実行し、今回分2問題/1進捗/1profileの残存0、対象外3表の全行照合値/件数、AuthのID/app_metadata、ACL/RLS/関数不変を前後比較で確認。終了時questions3/profiles4/progress4/Auth10。試験Auth2件と新規試験管理者trueは最新指示で保持し、Auth削除・権限解除はしていない。以前の想定外Auth/profile/progress増加の原因は未確認で、不明分は保持。停止中の実API閲覧/拒否・旧JWT拒否・本人保存/復元と復旧後CRUD/一般拒否・意図的ロールバックは未実施のまま。片付けや同じ静的調査の再実行は不要。詳細/前後結果はdocs/emergency-drill-20261018/review.md冒頭とapproved-cleanup-result.json、以前のlive-run-results.jsonは履歴。試験再開・残存Authの削除/権限解除・本番適用へ自動で進めない。

**最新の削除仕様（Preview実確認済み）：** cb34946ecbad71c3b10446fdefb3a53fd0c7fb17を承認された作業ブランチだけへpush。https://codestep-bywtked27-touya1896-7818s-projects.vercel.app は同SHA/refでREADY・非Production、Preview限定URL/公開キーはstagingと照合済み。実Chromeで履歴あり警告→取消（問題1/進捗2維持）→明示承認（両方0）、履歴なしUI削除まで成功。新規の試験2問題/2進捗を除去し、既存3テーブル全行とデモ管理者trueを含むメタデータは開始時と完全一致。既存FK/RLS/テーブルACLは変更せず、stagingの承認済みRPCを使用。本番SQL/公開は未承認。詳細はdocs/question-deletion.md。以下のac4692b/旧ダイアログ障害は過去の記録。

**最新：管理者入口をPreview反映・実確認済み。** ac4692bをcodex/admin-rls-portfolioだけへpushし、新Preview https://codestep-jvkfz5ng1-touya1896-7818s-projects.vercel.app は同SHAでREADY・非Production。右上の「管理画面へ」は全員に表示、管理者→/admin、その他→/admin/login。専用ログイン→管理画面、学習者の保存/再ログイン復元、一般の管理拒否/セッション維持、使い捨て問題の作成/編集を実確認。削除は対象限定APIの後片付けとして成功、既知のUI確認ダイアログ障害は再試行せずUI削除未検証を維持。今回の試験変更だけを戻し、questions3/profiles2/progress3の全行が開始時と完全一致した。製品コードの追加変更なし。

**デモ管理者を保持する：** 学習者とは別のstaging専用架空admin（UUID末尾e6917b32）について、今回の明示承認後に既存メタデータを保ちcodestep_admin=trueを付与した。新規アカウント/パスワード変更なし。本人の確認前に解除せず、以前のフラグ解除付きcleanupを流用しない。ログイン情報は/private/tmp/codestep-admin-demo-login.txt（0600、Git外、内容を出力しない）、新Previewの/admin/loginを利用する。試験ブラウザはログアウト済み、ログイン画面を本人確認用に残した。他の既存ユーザー/Auth/スキーマ/RLS変更と追加pushは対象を明示した新しい承認が必要。

前回54f3b66の試験は後片付け時に管理者falseへ戻したが、今回のデモ管理者承認前の履歴であり、現在のフラグに読み替えない。本番は今回アクセス・変更せず、直前の観測は旧main/35c13e3。

開始スナップショット/接続設定は0600のGit外ファイルに保持し、値は出さない。今回の復元は新しいユーザー指示とツール実行許可の後に実行済み。復元処理を再実行したり、次の試験で古い開始スナップショットを流用したりしない。後片付けAPIの削除成功を管理画面の削除成功とは扱わない。

## 目的と範囲

講座最終課題・転職用ポートフォリオ。要件/設計/実装/テスト/READMEを整合させ、本人が説明できること。CodeStepは問題・回答・本人進捗を対象にする。OneCodeの高度な構想は追加しない。

UIは改修前mainの35c13e3を基準に維持する。2026-10-16のユーザー指示により、依頼外の常設説明/再読込/権限更新UIを除き、元の表示と安全な現在の内部機能を統合した。クリア/復元は実データがある場合だけ表示。最新指示で管理リンクは全員に表示し、操作の認可は維持する。参照・判断・画像はdocs/ui-restoration.md。以後も明示依頼なく説明文/ボタン/デザインを追加しない。

## 本番・安全境界

- 本番はxdnmlfoblqdygsnhkxxp。前フェーズの限定承認でquestions-emergency-stop.sqlだけ適用済み。APIロールはSELECTのみ、RLS/旧7ポリシー/既存2件を維持した。今回の追加本番変更はない。
- 本番の管理者フラグ、管理者RLS、制約、main反映、本番Vercel公開は未承認。作業ブランチ限定のpush/Previewは16日の明示承認で実施済み。旧Permissiveを残して権限だけ戻さない。
- 公開判断の入口はdocs/release-readiness.md。profiles/progressの本人6ポリシーを維持した最小ACL案と別TXのUNIQUE案をdocs/sqlへ準備済み（未適用・原本の実DB実行は未検証）。2026-10-15の追加本番READ ONLY観測ではprofile1/progress0/重複0、両表のAPIロールに不要なTRUNCATE等あり。通常のRLS対象外なので本番前の修正対象。
- .env.localは本番接続のまま。編集しない。検証起動はscripts/staging-runtime.mjsで公開用URL/キーをプロセス上書きする。サーバーキーは子プロセス/ブラウザへ渡さない。
- stagingはezjzgebehancbxqpgany（codestep-staging、東京、Free）。本番/TodoAppとは別プロジェクト。新規課金・本番データコピーなし。
- 16日にProduction Branch=mainをユーザーがPC確認。APIでPreview限定2変数を照合し、stagingのルートURL（/rest/v1/なし）・有効なstaging公開キーとの完全一致、ブランチ固有上書きなしを確認。秘密値は出力/保存していない。承認済み3110162をcodex/admin-rls-portfolioだけへpushし、同じSHA/refのPreviewがREADY。URL・詳細はrelease-readiness.md冒頭。本番変更・main反映は引き続き禁止。

## stagingの現在地

- 初期化SQLを適用成功。SHA-256は471571d743080915ecda2b0dae50f6c88754c62262d02eaaa4a82ea159ceb7b1。既に3テーブルがあるのでbootstrapを再適用しない。
- profilesはid/name/created_at。全16列・既存FK2件は本番に一致し、FKは更新/削除ともNO ACTION。AuthへのFK/CASCADE/追加NOT NULL/DB時刻トリガーなし。構造上の追加はprogressのUNIQUE(user_id,question_id)だけ。
- 全3テーブルRLS有効。questionsは公開SELECT＋管理者I/U/Dの4ポリシー。profiles/progressは本人限定。anonは問題SELECTのみ、authenticatedは必要列だけ書込権限を持ちRLSで制限。TRUNCATE等と禁止列の権限なし。
- 架空Auth4件・架空問題3件、進捗3件、profile2件。今回の使い捨て問題と進捗更新は開始値へ復元済み。最新のデモ利用承認により専用admin1件のtrueを保持する（以前の全員falseは過去の記録）。
- 緊急停止→ポリシー指紋確認→管理者用限定GRANTで復旧し、匿名/一般拒否と管理者CRUD再開を実API確認。危険な旧許可に戻していない。
- 本番旧7件からの切替試験は実DB未検証のまま、今回の開発工程から省略して再送を保留する。管理者RLS/CRUD/停止・復旧は別に実DB成功済みで、旧7件を再現する試験をローカル作業の必須条件にしない。SQL原本/生成器と承認ハッシュは変更せず、静的検査を補強した。本番の移行SQL実行・複合ロールバック等の未検証リスクは本番承認資料へ明示する（test-plan.md末尾）。
- 過去3回の切替要求はInvalid or expired requestState。最後の直前直後読取では安全な4ポリシー/ACL/3テーブル全行ハッシュが一致し履歴0。今回の新しいDB観測ではない。公開MCP実装の検知条件にDROP POLICYも該当するが、エラーの発生層・原因解消は未確認。警告やチャット承認だけを根拠に再送しない。AGENTS.mdのSQL警告対応を適用する。

## 実装（Preview公開済み・本番未反映）

- Next.js App Router / React / TypeScript / Tailwind。ブラウザ→Supabase Auth/JWT付きData API→PostgreSQLの権限/RLS。
- /：questionsのDB出題。前後空白を除く大小文字を区別した文字列一致。コードは実行しない。ゲストは判定だけ、ログイン後の本人正解を保存・復元。
- lib/learning.ts：本人profile不足時の作成、最新進捗の更新/追加。23505競合時だけ本人・同じ問題の行を再確認して更新。通信結果不明は自動再送しない。
- /login：登録/ログイン/メール確認待ちを区別。初期認証確認中は入力・送信を無効化。
- /question：app_metadata.codestep_admin === trueのみ表示。初期確認/ログアウト/期限切れ/更新中は隠す。CRUDは0件を成功にしない。最終保証はRLS。
- AuthProviderでセッション共有。利用者変更で個人状態破棄。更新日時はクライアント時刻。本番にはペアUNIQUEがないためstagingの一意性を現本番へ一般化しない。

## 検証・資料

- 実DB/API41項目成功（基本20＋追加8＋フラグ欠落1＋停止6＋復旧6）。前フェーズの実Auth9項目も成功済み。
- 実ブラウザ：ゲストの出題/正誤/未保存、本人保存/ログアウト時クリア/再ログイン復元、管理者の作成/編集成功。390pxで学習画面に横溢れなし。スクリーンショットはdocs/screenshots。
- 旧Chromeの確認ダイアログ/タブはMacロック時に未整理で、解除後に確認が必要。別のheadless Chrome＋ローカルNext＋全APIモックで、削除確認/FK拒否/0件/通信・権限失敗/保存応答不明後の再試行など9件成功。実DB/RLSやstaging実画面の未完了試験を成功に読み替えない。新しいサーバー/ブラウザは停止済み。
- npm test計56件・lint/typecheck・ダミー接続Webpack本番ビルドがクリーンな一時コピーでも成功。Node24/npm11/package-lock.jsonへ統一し旧pnpmロックを除去、既存依存を更新せずnpm ci --ignore-scripts成功。Vercel PreviewのREADYと実画面も16日に確認。ローカルの通常インストールスクリプトは未検証。buildとtscは並列化しない。
- Previewの実画面で匿名の出題/正誤/未保存、一般ログイン/保存/ログアウト/再ログイン復元・管理拒否、管理者の作成/編集、フラグ解除後JWT更新で管理拒否を確認。stagingの進捗更新1件・追加重複なしとAPI照合。削除確認はCDP操作タイムアウトで未完了、DBでは未削除と確認しAPIで使い捨て1件だけ後片付け。最後は問題3/進捗3/重複0、試験管理者false・Previewログアウト済み。ブラウザ操作障害をアプリ不具合と断定しない。
- Week9全5シートの既存照合を再利用。外部シート未編集、画像原本保持。design-review.md/test-plan.md/mentor-notes.mdを更新。
- 一時資格情報は/tmp/codestep-staging-session.json（0600、Git外）。値を表示/コミットしない。消失時は安全に再準備し、架空ユーザーをむやみに再作成しない。

再開はtest-plan.mdの最新節。初期構築SQLは毎回ファイルとreview.jsonを照合する仕組みだが、現在は適用済み。旧ストアの本文や古い承認カードを再利用しない。
