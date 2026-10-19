# テスト仕様と実施結果

実施日：2026-10-15。本番変更は前フェーズの承認済みquestions緊急停止だけ。今回のAuth変更・試験はcodestep-stagingの架空ユーザー限定。本番データ書き込み・push・デプロイなし。最新の結果と未実施事項は末尾を参照。

前段は準備段階の履歴も含む。現在はstaging初期構築と実DB/API41項目が成功済み。旧7ポリシーからの移行試験とは分け、最新節で残課題を確認する。

## 環境

既存.env.localは今回も本番接続先と値を表示せず照合。未編集。専用staging（ezjzgebehancbxqpgany、Free）を使い、開発プロセス環境で公開用URL/キーだけ上書き。TodoApp転用・本番データ複製なし。通常ビルドはダミー接続を使用。

単体テストは架空データ/モックで通信しない。ビルドはプロセス環境変数で127.0.0.1:54321とダミーキーへ上書きし、Nextテレメトリーを無効化。検証DBの存在や分離を証明するものではない。

## 実施済み

| 検証 | 結果 | 範囲・限界 |
| --- | --- | --- |
| npm test・追加回帰 | 成功：計56件 | 管理者/CRUD/学習のモック・接続先/SQL生成ガード。実DBではない |
| npm run lint | 成功 | TypeScriptの未使用変数/引数と型の検査。ESLintではない |
| npm run typecheck | 成功 | 型チェック。実DBの保証ではない |
| npm run build（Turbopack） | 失敗：環境制限 | 内部のポートbindがOperation not permitted。権限付き再実行でも同じ |
| npm run build -- --webpack | 成功 | ダミー接続先。型チェック・3画面と404の静的生成 |
| 生成HTML確認 | 前フェーズで4項目成功 | 今回はDB読込方式へ変更。最終ビルドの初期HTMLは認証確認中で、固定問題・個人データを埋め込まない |
| SQL適用 | staging初期構築・停止/限定復旧成功 | 本番は過去の緊急停止だけ。旧7ポリシーからの置換試験は未完了 |

初回型チェックのJSX構文とabortSignalのメソッド順エラーは修正後に再検証。NodeテストにTypeScriptモジュール形式の検出警告が出るが全件成功。依存追加・インストールはなし。

## 自動テストの内容

- tests/admin.test.mjs：未ログイン、一般ユーザー、boolean true、期限切れ、user_metadataの自己昇格拒否、権限変更、同一セッション再通知、二重送信ロック。
- tests/questions.test.mjs：5列だけ送信、入力検証、NULL可カラム、異常レスポンス、新規/更新の返却行、0件/別IDの更新・削除、権限拒否、通信例外と非再送、FK拒否、変更なし、要求中断シグナル。

## 隔離環境の試験仕様（最新の実施状況は末尾）

架空アカウント・架空問題だけで実施。UIに加えて直接Data APIからも拒否を確認する。管理接続の成功を利用者権限の証明にしない。

| ID | 操作・条件 | 期待結果 |
| --- | --- | --- |
| DB-01 | 未ログインSELECT | 問題を閲覧できる |
| DB-02 | 未ログインI/U/D | DBが変わらない。0件応答も確認 |
| DB-03 | 一般ユーザーSELECT/I/U/D | 閲覧のみ成功、変更なし |
| DB-04 | 管理者新JWTのI/U/D | 架空問題の作成・編集・削除と再取得が一致 |
| DB-05 | 管理者のid/created_at変更 | 拒否。正規5列は操作可能 |
| DB-06 | フラグ欠落/false/文字列true、user_metadata=true | 管理者にならない |
| DB-07 | フラグ付与前の旧JWT→更新後JWT | 更新後に許可。トークンをログへ出さない |
| DB-08 | 管理者解除後の旧JWT/新JWT | 新JWTは拒否。旧JWTの残存を確認 |
| DB-09 | TRUNCATE等の権限 | カタログ上false。破壊的実行試験はしない |
| UI-01 | 初期ロード/一般ユーザーのURL直入力 | 確認中・権限なしの間フォーム非表示 |
| UI-02 | ログアウト/利用者切替/JWT更新 | 表示更新。古い一覧/入力を引き継がない |
| UI-03 | 同一セッションの再通知 | 入力フォームを不要に初期化しない |
| UI-04 | 存在しないIDの更新/削除 | 未成功表示。画面の行を誤って変更しない |
| UI-05 | 保存/削除連打 | 処理中は操作不可。要求は1回 |
| UI-06 | 通信遮断・権限拒否・取得失敗 | 内部情報なしのエラー。空一覧と区別、自動再送なし |
| UI-07 | 進捗から参照された問題の削除 | FK拒否の説明。DB/一覧は保持 |
| UI-08 | 学習/ログイン画面・スマホ幅 | DB問題が動作。ゲストは未保存、本人は応答確認後に保存済みと表示。大幅なデザイン変更なし |
| OPS-01 | 緊急停止 | 全ブラウザ利用者の書き込み不可、閲覧継続 |
| OPS-02 | 安全なポリシー確認後の限定権限復旧 | 管理者だけCRUD可能、旧許可なし |

実ブラウザ成功系/セッション競合/JWT更新、実DBの管理者RLS/学習永続化、停止後の管理者限定復旧は未実施。緊急停止の本番実績は下記と専用記録に分ける。

## 再実行

Node.js 24系の組み込みTypeScript読取を使用。

```sh
npm test
npm run lint
npm run typecheck
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=local-test-placeholder NEXT_TELEMETRY_DISABLED=1 npm run build -- --webpack
```

生成HTML確認対象は.next/server/app/question.htmlとindex.html。hydration・ブラウザ操作の検証は含まない。安全な検証設定ができるまで既存.env.localでCRUDを試さない。

## 最新の追加検証

- tests/learning.test.mjsの18件を追加し、合計39件成功。実Supabase JSのクエリ生成にメモリ内fetchを接続し、外部通信を禁止。
- 認証成功/確認メール待ち/失敗、DB問題/0件、正誤/大小文字、ゲストや不正解の非送信、本人保存/再ログイン後復元、既存行更新、プロフィール不足/競合、異なる所有者、0件応答、結果不明後の再試行、通信拒否を検証。
- ダミー接続の実ブラウザ：未ログイン管理フォーム/リンク非表示、ログイン画面のラベル付き入力、登録モード切替、問題取得失敗の案内と再読込を確認。成功系・モバイル幅・管理者フォーム操作は未確認。アカウント登録/本番ログインは行わない。
- 本番緊急停止：テーブル/列の書き込み権限なし、SELECT維持、RLS/7ポリシー維持、既存2件の内容一致、anonロールSELECT2件、匿名HEAD HTTP200/2件を確認。変更SQLは承認済みファイル1回だけ。書き込み拒否の実試行はユーザー禁止のため行わない。
- 実DB手段は前回に加えpodman/initdb/PGlite/pg-memも不在。新規リソース・Docker導入・TodoApp転用なし。モックはRLS検証を代替しない。

### 学習の実DB追加試験（未実施）

1. 架空の一般ユーザーで出題→不正解（保存なし）→正解（本人行を保存）→再ログイン→コード/完了を復元。
2. プロフィールなし・既存名ありの両方でFKを満たし、他人のプロフィールやAuthを変えない。
3. 他人のuser_idへSELECT/INSERT/UPDATE要求を送り、読取不可/変更なしをDBでも確認。
4. user_progress権限拒否、0件更新、プロフィール競合、通信切断で未保存/結果不明を表示する。
5. 複数タブ同時保存の重複とクライアント時刻の影響を測る。一意性を保証できたとは判定しない。
6. データ0件・NULLカテゴリ/解説・問題削除後の再読込を確認する。

実際の認証/DBのセットアップと書き込みは、本番と識別子が異なる検証環境でのみ実行する。

最終確認：39件のテスト、lint、typecheck、Webpackビルド成功。生成HTMLも「学習初期は認証確認中」「固定問題を埋め込まない」「管理初期フォームなし」「管理初期は権限確認中」の4項目成功。ローカル資料リンク切れなし。接続ソース・画像原本一致、変更ファイル内の秘密情報パターン検査で検出なし。

## 次回の実DBテスト再開地点（2026-10-15）

今回の追加成功：無料の専用プロジェクト作成、別プロジェクトIDの照合、読取専用DB接続、publicテーブル0件の確認。総合テスト成功とは扱わない。既存39テスト等は以前の成功記録であり、今回は再実施なし。

- 検証先：codestep-staging / ezjzgebehancbxqpgany / ap-northeast-1 / bonbabo108's Org（Free）。[管理画面](https://supabase.com/dashboard/project/ezjzgebehancbxqpgany)。本番はxdnmlfoblqdygsnhkxxp。画面上のmain「PRODUCTION」は検証プロジェクト自身の標準ブランチ表示であり、公開CodeStep本番と同一ではない。
- 未準備：questions/profiles/user_progress、テスト用Authユーザー、架空の問題・進捗、検証用アプリ接続設定。空のpublicに対するCRUD/RLS/匿名読み取り成功は未検証。
- 接続情報は未取得・未保存。.env.localは本番のまま。秘密値はチャット・資料・Gitへ出さない。

再開順：

1. この節とproject-context.md、既存SQL/runbookを読み、get_project/get_organizationで検証ID・状態・Freeを確認する。停止中なら状況確認し、有料化・重複プロジェクト作成・TodoApp操作はしない。
2. 接続先を必ずezjzgebehancbxqpganyに固定し、本番と異なることを再照合。メタデータのみを読み、現在も空か確認する。
3. 既知スキーマを基に隔離DBだけの初期化SQLを用意・レビューする。本番データ/個人情報はコピーせず、架空の最小データを使用。最初からRLSと最小権限を設定し、外部に広い書き込み許可を開けない。
4. questions-admin-rls.sqlは既存7ポリシーを前提にするため空DBへ直接実行しない。安全な検証用の前提構築/移行試験方法を先に決め、SQLの既存ポリシー検査と権限制御を検証する。
5. 検証用の一般/管理者/別ユーザーのみ用意し、検証Authだけにapp_metadata.codestep_adminを設定。キーは非追跡の検証専用設定かプロセス環境で扱い、既存の本番.env.localを上書きしない。開発・ビルド・ブラウザの全接続先を検証先に統一してから書き込みテストを始める。
6. 上記の既存テスト仕様を再利用し、匿名/一般の拒否、管理者CRUDと禁止列、JWT更新/解除、本人進捗保存/再ログイン復元/他人拒否、0件/通信失敗、緊急停止/安全な復旧を実DBと画面で確認。モック成功と区別して結果を追記する。
7. 変更が必要になった範囲だけ静的検査/関連テストを再実施し、README/設計照合へ実測結果を反映。本番SQL/Auth変更、push、デプロイは別途承認まで実施しない。

無料枠の確認元：[公式料金](https://supabase.com/pricing)、[無料2枠と停止中除外の条件](https://supabase.com/docs/guides/platform/billing-on-supabase)。新規クラウド追加や有料変更は承認範囲外。

## 利用枠回復後の最新結果・次回再開（2026-10-15）

### 今回の実測

| 項目 | 結果 | 根拠・範囲 |
| --- | --- | --- |
| 分離・無料プラン | 成功 | get_projectでstaging名/ID/ACTIVE_HEALTHY、get_organizationでFree。既存.env.localは本番のまま。公開用変数をstagingへプロセス上書き |
| stagingスキーマ適用 | 拒否・未適用 | apply_migrationが3回ともuser rejected MCP tool call。初回後のチャット再承認あり。最後は旧広域ポリシーを除いた安全側の案でも拒否。理由詳細なし |
| 拒否後のDB状態 | 確認済み | 読取専用SELECTでpublicテーブル0件。適用成功/部分成功とは扱わず、別経路でDDLを実行しない |
| 実Supabase Auth | 成功：9件 | scripts/staging-check.mjs auth。架空3ユーザーをAdmin APIで確認済み扱いで作成、メール送信なし |
| 管理者条件のJSON式 | 成功：5ケース | staging PostgreSQLの読取SELECT。boolean trueのみ許可、false/文字列true/user_metadataのみ/欠落は拒否。RLS行アクセス試験ではない |
| ブラウザ・実Auth | 成功 | 誤パスワードの安全な案内、一般ログイン/管理画面拒否、ログアウト、管理者ログイン/リンク/フォーム表示 |
| ブラウザ・JWT解除 | 成功 | staging架空管理者のフラグfalse化後も旧JWTでフォームあり。画面の権限更新後にフォーム消失・入力0件。実DB変更の拒否は未確認 |
| ブラウザ・失敗表示 | 成功 | スキーマ未構築の取得失敗をエラーと再読込ボタンで表示。空の正常問題一覧とは扱わない。進捗保存の通信遮断試験とは別 |
| 初期化前ログイン送信 | 修正・再検証成功 | 早い送信で/login?へ通常遷移した現象。Auth初期化中の入力/送信/登録切替をdisabledにし、実画面で初期無効→有効→ログイン成功を確認 |
| 画面幅・画像 | 成功（ログインのみ） | 390×844で横スクロールなし。PC/モバイル画像保存。認証入力が空で秘密値なし。学習成功画面の証拠ではない |
| 開発バンドル | 成功 | .next/dev/static/chunksにstaging URLあり、本番URL/実サーバーキーなし。.next/staticは前回の別ビルドなので混同しない |
| ローカルテスト | 成功：43件 | 既存39＋進捗23505競合2＋接続先/設定ガード2。DBではない |
| lint/typecheck/ビルド | 最終成功 | Webpack・ダミーURL/キー。ビルドと並行した検査は生成型の一時消失でTS6053となったため、ビルド完了後に順次再検査して成功。今後も並列化しない |
| DBのRLS/管理CRUD/進捗保存 | 未実施 | テーブル未構築のため、Data APIの権限差・禁止列・FK・同時保存・再ログイン復元・停止復旧は検証不能 |

実Authの9項目：一般ログイン、誤パスワード拒否、user_metadata自己昇格不可、一般APIからapp_metadata自己変更不可、付与前の旧JWT値保持、更新JWTへの付与反映、解除後の旧JWT値保持、更新JWTへの解除反映、ログアウト/再ログイン。

Auth APIへの最初のローカル接続はsandboxのDNS制限（ENOTFOUND）で失敗。ネットワーク許可後に9件成功した。SQLツールの拒否とは別の問題。現在のテスト管理者フラグはUI解除検証のためfalse。架空Auth3件以外のデータは作成していない。

### 未適用SQLと再開手順

docs/sql/staging-bootstrap.sqlは空DB専用。初めからquestionsの管理者限定4ポリシー、profiles/progressの本人限定RLS、最小列権限を設定。本番と同じ全16列・PK/FKを維持し、構造上はprogressペアUNIQUEだけ追加する案。profiles/Auth FK・CASCADE・NOT NULL強化・追加索引・DB時刻トリガーは今回の照合で外した。静的レビューのみで未適用。旧7ポリシーを再現する案は撤回済み。本番用questions-admin-rls.sqlの7件からの置換試験は別途未実施。

1. **SQL変更ツールの拒否を解消する。** チャット上のstaging作業承認は取得済みで、未承認とは扱わない。ツールの実行許可/接続状況を人間と確認する。別経路による回避はしない。本番/TodoAppを対象にしない。
2. stagingのID/Free/テーブル数を確認してから、staging-bootstrap.sqlをレビュー・適用。現在の空DB以外へ流用しない。結果不明なら追加変更前に状態照合する。
3. /tmp/codestep-staging-session.jsonは0600の一時設定。URL/公開キー/既存サーバーキー/架空テストユーザーの認証情報を含むため、表示・コミット・共有禁止。アプリへ渡すのは公開用2変数だけ。消失していれば安全な方法で資格情報を再準備し、既存の架空ユーザーをむやみに再作成しない。
4. 実Auth9件は成功済みなので、スキーマ構築だけで再実施する必要はない。テスト管理者は現在falseなので、staging限定でadmin-onを実行して新JWTでログインする。

```sh
# 実行先はランナー内でcodestep-stagingに固定。本番.env.localは読み込まない。
CODESTEP_STAGING_TESTS=1 node scripts/staging-check.mjs admin-on
CODESTEP_STAGING_TESTS=1 node scripts/staging-check.mjs db
CODESTEP_STAGING_TESTS=1 node scripts/staging-runtime.mjs dev --webpack --hostname 127.0.0.1 --port 3100
```

5. dbモードは3テーブルの存在確認後に架空問題3件を作り、匿名/一般の拒否とデータ不変、管理者CRUD/禁止列/0件、本人保存/再ログイン復元/同時保存/他人拒否/FK/更新日時の保存を試す。profilesの列名確認はcreated_at（NULL可）を使用。更新日時は既存コードのクライアント時刻を保存・再取得する試験に変更し、DB時刻による強制上書きは要求しない。**このモードは未実行で、ランナー自体も実DBでは未検証。** モックの代用や成功実績と説明しない。
6. 既存仕様の残項目（実JWTのfalse/文字列trueによるRLS拒否、禁止列INSERT、UIの保存/0件/通信遮断/連打、緊急停止・限定復旧、本番7ポリシーからの移行）はランナー外も含めて実施・記録する。DB正常系を確認してから学習/管理の最新スクリーンショットを取得する。
7. テスト後はadmin-offで架空管理者の権限を解除し、新JWT/ログアウトでUIも終了。必要な範囲だけテスト/型/ビルドを順次再実行。本番Auth/RLS/制約、push、Vercel公開は別途承認まで行わない。

今回のローカル開発サーバー・検証タブは終了し、画面サイズ上書きも解除。既存画像/接続ソース/本番.env.localは保持。外部設計資料の再調査・編集なし。

### 修正版の適用前レビュー（2026-10-15）

本番へのBEGIN READ ONLYメタデータSELECTで、全16列（profiles 3 / questions 7 / user_progress 6）、PK3件・既存FK2件・ユーザートリガーなし・PK以外の索引なしを確認。修正版SQLの列名/順序/型/NULL可否/デフォルト/identity/generatedを全列静的比較し差分0。FKはカタログの更新/削除コードがともにa（NO ACTION）、非遅延で一致する。

stagingはpublicテーブル0件、anon/authenticatedはSUPERUSER/BYPASSRLS/public CREATEなし・ロール所属0。今回は読取とローカル修正だけ。修正版の適用・実DB試験は再承認待ち。ランナーの変更箇所はnode --checkで構文確認し、実DB成功とは判定しない。未変更のアプリ機能・既存43テスト/ビルドを不必要に再実施しない。

### 適用本文の再確認と旧キャッシュ防止

以前のSQL文字列ストア2件に旧createdAt/FK/CASCADEが残っていたため無効化。修正済みファイルだけを確認して適用本文まで一致と説明した点を是正した。新しい準備処理は毎回原本を読み、review.jsonとSHA-256を照合し、未承認の変更や対象差し替えを拒否する。

```sh
# ローカルの確認・要求生成だけ。SQLは実行しない。
node --test tests/staging-migration.test.mjs
node scripts/prepare-staging-migration.mjs
```

今回の結果：回帰4件成功、生成queryと原本ファイル完全一致、要求本文の全16列差分0、FK2件NO ACTION、旧createdAt/Auth FK/CASCADEなし。stagingへの読取専用SELECTでpublicテーブル0件を再確認。既存43件は再実施しておらず、SQL適用・実DBCRUD/保存は未実施。

修正版の承認後の呼出契約（今は実行しない）：prepare-staging-migration.mjsの成功したJSON出力のapply_migrationオブジェクトを、そのままSupabase apply_migrationへ渡す。呼出直前に新規生成する。手書きのqueryや過去のstore/loadを使わない。承認ハッシュ471571d743080915ecda2b0dae50f6c88754c62262d02eaaa4a82ea159ceb7b1と異なれば再レビュー・再承認。

## 最新：staging構築・実DB総合検証の結果（2026-10-15）

### 構築と構造の実確認

最新ユーザー指示の「修正後はstaging限定で構築・総合テストを続行」を承認として実行。原本から毎回生成し、SHA-256が471571d743080915ecda2b0dae50f6c88754c62262d02eaaa4a82ea159ceb7b1の要求をapply_migrationへ渡してsuccessを確認した。既に構築済みなのでbootstrapを再実行しない。

読取確認：3テーブルのRLS有効、全16列、profilesの列はid/name/created_at。FKはprogress→profiles/questionsの2件だけ、更新/削除ともNO ACTION。Auth FK/CASCADE/時刻トリガーなし。進捗ペアUNIQUEあり。questionsの4ポリシーと、禁止列/TRUNCATE等の権限なしを確認した。Freeプランのまま、本番/TodoAppは変更なし。

### 実API/DB試験（全41項目成功）

| モード | 件数 | 実際に確認した内容 |
| --- | ---: | --- |
| db | 20 | 匿名/一般SELECTとI/U/D拒否、データ不変、管理者CRUD、禁止列UPDATE、0件更新/削除、正解保存、プロフィール作成、再ログイン復元、同時保存1件、他人の進捗拒否、FK、既存更新日時の永続化 |
| extra | 8 | 禁止列INSERT、app_metadataがfalse/文字列true/nullのJWTでI/U/D拒否、解除後の旧JWTは書込可能・新JWTは拒否、匿名進捗拒否、進捗のid/所有者/問題変更拒否、profile/進捗の同時作成競合 |
| missing-claim | 1 | 管理者フラグを指定せず作った一般ユーザーの実JWT（欠落を検査）でもI/U/D拒否、データ不変 |
| stopped | 6 | 緊急停止SQL後、匿名/一般/管理者それぞれのSELECT継続とI/U/D拒否。テーブル/列権限でも全員書込不可 |
| resumed | 6 | ポリシー指紋が不変であることを確認して限定GRANTのみ復旧。匿名/一般の拒否、全員SELECT、管理者CRUD再開 |

停止/復旧のポリシー指紋は1da0740667b5fb3f57013e5ff673d898。RLSを無効化せず、広い旧書込許可へ戻していない。これは管理者限定状態からの停止/復旧であり、旧7件からの切替試験の代わりにはしない。

### 実ブラウザ

成功：DB出題、ゲストの不正解→正解と未保存表示、本人の正解保存（保存中ボタン無効）、ログアウト時の回答クリア、再ログイン後のDB復元、一般の管理画面拒否、管理者の問題作成・編集。390px学習画面に横スクロールなし。docs/screenshotsに学習ゲスト/保存/復元/スマホ/管理の実画面を保存し、画像原本を保持した。

中断：管理画面の削除確認ダイアログでCDP操作がタイムアウト。ネイティブ状態取得でMacロックを確認し、ユーザーに手動解除を依頼した。APIの削除成功は確認済みだが、この画面での削除通知・FK拒否通知・0件更新/削除表示・書込通信遮断の再試行は未確認。機能失敗と断定せず、未完了として残す。

### 旧7ポリシーからの切替試験（別試験・未完了）

scripts/prepare-staging-rls-rehearsal.mjs cutoverは、現在の安全な4件から1トランザクション内で以下を行う要求を生成する。

1. 排他ロック取得、既存データの比較用一時スナップショット、APIのテーブル/列書込権限の停止。
2. 本番旧7件を再現。第8ポリシーが混入した状態で本番用SQLのレビューガードが拒否するか確認。
3. 第8件を外し、docs/sql/questions-admin-rls.sqlの処理本体をそのまま実行（外側BEGIN/COMMITだけ統合）。4件への置換とデータ不変を確認し、安全状態だけCOMMIT。

広い旧許可をコミットしたり、外部クライアントへ一時公開したりしない。元SQLのSHA-256は8cb9b9303631fbaa0b3b7ff69eb2be01562da9b81dcf254a4fac0d733defeec4。生成コードの4回帰テスト（単一TX/ロック/原本本体一致/安全な復旧要求）に成功。

実行要求は2回ともInvalid or expired requestStateとなった。各状態照合でquestionsポリシー4件・広い書込0件・リハーサル履歴0件を確認。結果不明を成功にせず、再試行を止めた。初期構築が成功していても、本番切替SQLの実行成功とは説明しない。今回の停止/限定復旧は別に実行成功している。

### 検査・終了時の状態

- npm test47件と追加rehearsal4件、lint/typecheck、ダミー接続Webpackビルド成功。buildは開発サーバーを終了してから実行。
- 架空Auth4件、問題3件、プロフィール2件、進捗3件、ペア重複0件。UIの使い捨て問題はui-cleanupで固定名だけ削除した。
- 架空管理者は最後にfalseへ解除済み。古いJWTが即失効するとは扱わない。本番/Auth/TodoApp/課金/push/デプロイ/外部設計シート変更なし。
- 開発サーバー停止済み。Macロック中のChrome確認ダイアログと検証タブは未整理。ロックを回避せず、解除後に状態確認する。
- 検証タブはmarkHandoffで再開用に保持し、ブラウザ操作の資格情報変数を破棄した。資料リンク/変更ソースの秘密値パターン検査とgit diff --checkも問題なし。

### 次回の最短再開

1. Mac解除後に既存Chromeタブ/確認ダイアログの状態を確認し、必要ならキャンセルしてから再読込。bootstrapを再適用しない。
2. stagingのID・Free・安全な4ポリシー・リハーサル履歴を確認する。/tmpの0600資格情報を表示せず利用。既存の成功41項目・Auth9項目は理由なく再実施しない。
3. admin-onで架空管理者を有効化して検証サーバーを起動。画面の削除/FK/0件/通信遮断とモバイル管理画面を残りだけ確認する。0件試験は「ブラウザ0件検証」を作成・編集表示後にui-removeでその1件を別クライアントから削除し、UIの更新・削除が成功扱いにならないことを確認する。
4. cutover要求は新しく生成してstagingだけで再開。ツール期限切れが解消していなければ状態確認後に保留し、他経路で回避しない。成功後に必要最小限の権限差テストを再確認する。
5. 終了時はui-cleanup、admin-off、ログアウト、サーバー/タブ終了。変更のあった範囲だけ再検査・資料更新。本番管理者/RLS/制約/push/デプロイは別途承認まで進めない。
# 最新の切替試験承認待ち（2026-10-15）

破壊的SQL警告の対象/安全性はrls-runbook.md末尾参照。生成器の開始/終了に安全なポリシー定義の指紋チェックを追加し、関連ローカル回帰5件成功。SQL実行なし、旧7→4実DB切替は未実施のまま。承認後、同じ生成queryのSHA-256照合とstagingの直前読取監査を行ってからapply_migrationを使用する。結果不明時の盲目的な再実行は禁止。

## 最新：明示承認後の切替要求と状態照合（2026-10-15）

- get_projectでcodestep-staging/ezjzgebehancbxqpgany/ACTIVE_HEALTHYを直前確認。本番/TodoAppには接続・変更していない。
- 原本を読み込む生成器から要求を再生成。query全文は前回レビュー済み本文と完全一致、SHA-256は186e456a5f5851c52ca8fcf87d11384bf6dffe1fc29f22fe9aa6894315a0abf4。本番用SQL原本ハッシュ8cb9b9303631fbaa0b3b7ff69eb2be01562da9b81dcf254a4fac0d733defeec4も一致。単一TX/ロック/旧許可非コミット/全行不変ガードを再確認した。
- 直前のBEGIN READ ONLYで管理者限定4ポリシー全文/指紋、テーブル・列ACL、RLS、APIロール属性/所属、3テーブルの件数・全行ハッシュ、切替履歴0を確認。
- apply_migrationはこの承認後に1回だけ呼出し、Invalid or expired requestStateでエラー。再試行・execute_sql等の別経路変更はしない。SQL処理の成功/ROLLBACK成功とは判定しない。
- 直後に同じ読取専用監査を実施。全取得項目が直前と一致。questions3/profile2/progress3、各全行ハッシュ・テーブル列ACL不変、RLS有効/安全な4ポリシー/切替履歴0。旧広域許可の残存なし。これにより現在の安全状態は確認できたが、旧7→4の切替試験は未完了。
- 独立したローカル検証：npm test全52件成功。lint/typecheck/ダミービルドはアプリ未変更のため既存成功結果を再利用。画面の削除等は引き続き未検証。追加DB/Auth変更・課金・push・デプロイなし。
- 次回：適用ツールの状態エラーが解消し、再開指示があるまで再送しない。承認済みSQLを変更する場合は再レビュー/再承認が必要。再開時も生成器による全文ハッシュ照合と最新の読取監査を行い、一致しなければ中止する。成功応答後も履歴・RLS/ACL・データ不変を確認する。

## 最新方針：切替リハーサルの省略と代替検証（2026-10-15）

**判断：今回の開発工程では旧7件再現リハーサルを省略し、実DB未検証として残す。** 同試験は移行固有の信頼性を高めるために有用だが、アプリの権限/保存機能の確認と同じ試験ではなく、常に必須の技術要件ではない。管理者限定RLS/CRUD/禁止列/進捗と、緊急停止・限定復旧は実DB成功済み。ローカル実装や残りの画面検証を、このツールエラーの解消まで止める必要はない。以前の「再開指示後に切替試験から再開」という順序はこの判断で置き換える。

| 確認対象 | 根拠/代替検証 | 残る未検証リスク |
| --- | --- | --- |
| 最終RLSとCRUD | 既存実API/DB41項目、初期構築の安全な4定義を確認済み | 本番での環境差、最初の管理者/JWT準備は別 |
| 旧6書込ポリシーの除去 | 原本のDROP対象6件と公開SELECT維持を静的検査。双方向EXCEPTによる旧7定義の不一致ガードもレビュー | 原本移行の一括実行、DO構文・不一致ガードの実DB動作は未検証 |
| staging試験SQLの範囲 | DROP対象10件の名前と対象テーブルを検査、承認済み生成queryハッシュ一致。永続データ削除/テーブル削除/TRUNCATEなし | 実際のDDL/ACL切替順の実行結果は未検証 |
| データ保護と復旧 | 単一TX/排他ロック/前後全行比較を静的確認。独立の停止/限定復旧は実DB成功済み | 一括移行の途中失敗/タイムアウト時の複合ロールバック、ロック競合は未検証 |

代替検証の結果：SQL原本と生成queryは変更なし。tests/staging-rehearsal.test.mjsを補強して6件成功、npm test全53件成功。これは文字列/構造の回帰検査でありSQLパーサーや実DBの代替証明ではない。今回はDB/適用ツールを呼び出していない。前回の安全状態の読取記録を再利用し、今回の最新観測とは扱わない。

本番適用前には、最新読取監査・バックアップ/復旧の準備とともに上記リスクを承認資料へ載せる。必要なら隔離DBで移行固有の試験を追加するか、人間が未検証範囲を理解したうえで本番適用の可否を判断する。今回の省略判断や既存staging承認は、本番変更の許可ではない。今は追加の承認質問をしない。

警告/エラーの診断と同じ状態で再送しない条件はrls-runbook.md末尾参照。独立した残作業は画面削除/FK/0件/通信遮断の検証、提出資料の確認。本番作業は別途承認まで停止する。

## 最新：公開判断資料と独立した検証の完了（2026-10-15）

### 本番は読み取りのみ

本番ID/名前をget_projectで照合し、BEGIN READ ONLYでprofiles/progressのポリシー・ACL・制約と件数だけを追加調査。本人S/I/UのPermissive6件、両テーブルRLS有効、APIロールのbypass/super/所属なし。anon/authenticatedに広いテーブルACL（TRUNCATE等含む）が残り、列ACLなし。profiles1・progress0・重複ペア0・Authに対応しないprofile0を集計確認。ユーザー行/ID/メール/キーを出力せず、本番Auth/データ/設定変更なし。

### ローカル実ブラウザ＋全APIモック

scripts/browser-local-check.mjsを追加。既存Chromeの画面やロックを操作せず、別のheadlessプロセス/使い捨てプロファイルとローカルNextを使用。APIは全件メモリ内応答、外部ホストへのブラウザ要求は遮断。架空の保存セッションでUI状態を用意しており、JWTの署名検証/RLSや実DBを検証したものではない。資格情報ファイルを読まない。

| ID | 操作 | 結果 |
| --- | --- | --- |
| UI-M01 | guestの管理フォーム非表示 | 成功、変更要求0 |
| UI-M02 | 管理者の削除確認ダイアログ→成功表示 | 成功、削除要求1 |
| UI-M03 | 参照FKの削除拒否 | 成功、エラー案内・一覧保持 |
| UI-M04 | 0件削除 | 成功、成功表示なし・一覧保持 |
| UI-M05 | 変更時503 | 成功、成功表示/自動再送/内部情報露出なし |
| UI-M06 | 権限拒否42501 | 成功、権限案内・一覧保持 |
| UI-M07 | 0件更新 | 成功、成功表示なし・元データ保持 |
| UI-M08 | 進捗読取拒否中に正解回答 | 成功、判定のみ・保存要求0 |
| UI-M09 | 保存後に503応答→明示再試行 | 成功、結果不明表示後に再読取/PATCH、保存先1件 |

初回はテスト側のボタン名が実際のaria-labelと異なりタイムアウト。アプリ側の不具合ではなく、対象名を修正して再実施し上記9件成功。以前のMacロックとは別の手段でローカル画面を検証した。staging実画面＋実APIを組み合わせた未完了項目は成功へ読み替えない。終了時サーバー/ブラウザを停止し3117の待受なしを確認。

再現例（既存PlaywrightモジュールとChromeが必要。今回はバンドルを利用し依存追加なし）：

```sh
CODESTEP_LOCAL_UI_TESTS=1 CODESTEP_PLAYWRIGHT_MODULE=/path/to/playwright node scripts/browser-local-check.mjs
```

### クリーンインストールと静的検査

npm/package-lock.jsonに統一、Node24/npm11を明示しpnpmロックを除去。依存の更新なし。.env/資格情報/Gitを含まない一時コピーでnpm ci --ignore-scripts --no-audit --no-fundが成功（371パッケージ）。そこで全56テスト・lint・型チェック・ダミー接続Webpack本番ビルドが成功。通常インストールスクリプトとVercelのLinux実行は別途未検証。既存node_modulesは置換していない。

追加3テストは本番用進捗SQL案の静的検査（データ/ポリシー削除なし、双方向ガード/重複時停止、列権限の限定、ACLとUNIQUEのTX分離）。SQL構文の実DB成功を意味しない。既存stagingの実API41件/実Auth9件は再実行せず再利用した。lintは未使用変数も含むtscで、ESLintではない。

README/docsのローカルリンク最終44件は欠落なし。既存の復元/管理/390px学習画像を目視照合し原本を保持。コミット対象になり得るテキスト52ファイルの限定パターン検査で実キー/JWT/秘密鍵らしき一致0（完全な秘密検査の保証ではない）。.gitignoreに.env系と既存codestep_key_files.txtを追加し、除外を確認。クリーンビルドのブラウザJSはダミーURLあり・本番/staging参照IDなし。git diff --check成功。

### 残課題と再開

release-readiness.mdを公開判断の入口とする。新しい本番SQLは最小ACLとUNIQUEを別TXに分離し、後者失敗時も前者の安全化を保持する。両原本の実DB実行/本番7→4移行/本番保存/登録メール到達/Previewと本番公開は未実施。RLS適用ツールの再送・課金・TodoApp変更・push・デプロイなし。PCでは管理者本人・未検証リスク/SQL・公開順序をまとめて判断する。

## 2026-10-16 承認済み3110162のVercel Preview検証

前節以前の「Preview未実施」は当時の記録。本節を最新とする。対象はbonbabo108/codestepのcodex/admin-rls-portfolioのみ。SHAは3110162b60028dbbd7479523de854d6cadc4dea9。Vercel dpl_E83MoaEsvrKoAhfnQaemsVuVCbTFのREADY/ref/SHA一致と非productionをAPI照合。本番ドメインは旧mainの35c13e3のまま。

Preview URL：https://codestep-inza0dwfi-touya1896-7818s-projects.vercel.app

| 確認項目 | 結果・根拠 |
| --- | --- |
| 接続設定 | 成功。事前にPreview限定のURL/有効なstaging公開キーを完全照合済み。URLはルート、/rest/v1/なし。今回Previewからの実保存もstaging側で更新1件・重複追加なしを照合 |
| ビルド/対象 | 成功。指定コミットと作業ブランチの自動PreviewがREADY。API targetはnullでproductionではない。対象とaliasも整合 |
| 匿名のDB出題 | 成功。架空問題3件が表示される |
| 匿名の正誤判定/未保存 | 成功。不正解、正解、未ログインのため保存しない案内を確認 |
| 匿名/一般の管理拒否 | 成功。/questionに専用案内、管理フォームなし |
| 一般ログイン/保存 | 成功。保存成功の実画面とstaging進捗の更新1件を照合。既存2件の本人進捗が2件のまま |
| ログアウト/再ログイン復元 | 成功。ログアウトで回答を消去し、再ログイン後に保存済み正解コードを復元 |
| 管理者ログイン/作成/編集 | 成功。staging架空管理者と固定名の使い捨て問題だけを使用。作成・更新成功表示と一覧への反映を確認 |
| 管理者解除/JWT更新 | 成功。stagingフラグfalse後に権限情報更新で管理フォーム消去・管理拒否。旧JWT即失効の証明ではない |
| 管理者の削除UI | 未完了（操作エラー）。click後にconfirmを観測したがCDP入力タイムアウト、accept後の状態取得もタイムアウト。再クリックせずDBを読み取り、使い捨て問題が残っていると確認。その後ダイアログなし・再読込可能を確認。ブラウザ操作の原因は未特定、アプリ不具合とは断定しない |
| FK/0件/通信失敗の実Preview画面 | 未実施。既存の実API試験とローカル実ブラウザ＋APIモック9件を代替根拠に維持し、Preview成功とはしない |
| 最終表示/ログ | 成功。ログアウト済み匿名学習画面、取得できたconsole error 0件。ログ検出範囲外の不具合まで否定しない |
| 後片付け | 成功。固定名の使い捨て1件だけAPI削除（削除UIの成功ではない）。問題3・進捗3・重複0・架空管理者falseをAPI確認 |

通常HTTPはVercel認証へ302転送、公式保護URLツールは403/read_protection_bypassで利用不可。保護を変更/回避せず、既存Vercelログイン済みChromeで正規閲覧した。秘密はブラウザ変数にのみ読み込み、画面/ログへ出さず最後に破棄。試験後はPreviewのアプリセッションをログアウト済み。

証跡：screenshots/preview-learning.png、screenshots/preview-admin-update.pngを保存・目視確認。後者は更新時の使い捨て問題を含む。製品コード/SQL変更なしのため既存56件・型・lint・クリーンビルドは再実施せず再利用。本番SQL3原本・旧7→4・複合ロールバック・本番保存・メール送達の未検証は変わらない。今回の記録/画像はローカル差分で未commit/未push。

## 2026-10-16 UI復元・機能維持の回帰検証

基準/意図的差分/比較画像は[ui-restoration.md](./ui-restoration.md)。HEADは3110162のまま。学習/管理/ヘッダー3ファイルの表示と専用reload処理を変更し、共通DB/Auth/CRUD/保存処理8ファイルとSQLがHEADと同一であることを確認した。以前の実DB41項目/実Auth9項目は繰り返さず根拠を再利用する。

| 検証 | 結果 |
| --- | --- |
| npm test | 成功56件。既存のDB取得/保存/競合/認可判定/CRUD/SQLガードを維持 |
| lint / typecheck | 最終版で両方成功 |
| 本番ビルド | ダミー127.0.0.1接続のWebpackビルド成功。実キー/本番接続は使わない |
| 既存ブラウザ異常系 | 成功9件。削除確認/FK/0件更新・削除/503/42501/進捗読込失敗/保存応答不明からの明示再試行。全APIモックであり実RLSの検証ではない |
| 復元UIのブラウザ回帰 | 追加8件成功。元の文言/不要UI除去、匿名正誤/未保存、管理導線と作成編集キャンセル、本人保存/再読込/ログアウト/再ログイン復元、登録切替とメール確認待ち、専用拒否画面からのJWT更新、遅いログアウト中の管理非表示、PC/スマホの4画面 |
| 全ブラウザ回帰 | 最終版はNext startによるローカル本番ビルド＋全APIモックで17成功/0失敗。各ケースで未処理pageerrorなし |
| 旧UIとの配置比較 | 1440pxのheader/見出し/学習カード/入力欄の位置・幅・高さは差1px未満。390pxもカード/入力欄の幅・高さが差1px未満。復元版横溢れなし。全画素一致ではない |
| PC/390px表示 | 学習/管理/ログイン/登録の8画像を取得。主要画像を目視確認し、各画面の横溢れなしを実ブラウザ検査 |
| 実stagingの復元UI | 成功。架空問題3件の出題、匿名の不正解/正解、一般ログイン、本人保存、ログアウト時の復元表示破棄、再ログイン復元、一般の管理リンク非表示/直接URL拒否 |
| 実DB照合 | 成功。上記UI保存の開始時刻以降に本人進捗1件だけupdated_at更新。本人2/全体3件を維持、重複0、問題3件。読み取りAPIで確認 |

### 途中の失敗と判断

- サンドボックス内ではローカルサーバーを起動できず、実行環境の許可を得て既存ランナーを実行した。本番や警告対象SQLの許可を迂回していない。
- 追加の作成→編集試験で、テストモックのPATCHがIDで絞らず複数行を返し失敗。実装を戻さず、モックをIDで絞るよう修正。DELETEのモックも対象IDだけを除くようにした。
- 開発サーバーの連続画面試験でログイン画面待ち失敗と、別回で初期表示のSyntaxError/空画面を観測。原因を特定できていない。表示2件だけの診断再実行は成功。本番ビルドによる全16件、その後のログアウト補強を含む全17件は成功した。開発配信の断続的失敗を黙って成功に変更したり、製品不具合と断定したりしない。
- 実ブラウザ終了時、ログアウトAPI完了前に遷移/閉じると保存済みセッションを読み直し得ることを観測。従来のAuthProviderはそのまま、Headerがpending中にログインリンクを先に出さないよう既存Loading...表示を再利用した。新しい常設UIは追加していない。遅延logout応答の回帰1件を追加し、応答前の管理フォーム/ログインリンク非表示と完了後の復帰を確認。
- 実stagingの画像は保存済みの復元画面であり、初めのguestという保存名は誤りだったためlearning-staging-restored.pngへ訂正した。画像を匿名表示の証拠にはしない。

### 今回成功扱いにしないもの

新UIの実staging管理者CRUD・実RLS/APIの全ケース再試験は行っていない。既存の実DB/API成功と今回のモックUI成功を区別する。実メール送達、本番移行SQL/旧7→4/複合ロールバック、本番書込み、復元UIのVercel Previewは未実施。開発サーバーの断続的な初期配信失敗の原因は未特定。Previewは3110162のままで、追加pushには新しい明示承認が必要。

終了確認：修正後の実stagingセッションでログアウト完了を待ち、ページ再読み込み後もログインリンク表示・復元バナーなし・管理リンクなし・ログアウトエラーなしを確認。learning-staging-guest.pngを改めて取得した。今回作成した検証タブを閉じ、staging用検証サーバーを停止。既存ユーザータブやPreviewは変更していない。

## 2026-10-17 UI復元Preview 54f3b66

- 必要21ファイルだけを選択コミット。READMEは概要1段落だけを部分ステージし、既存Preview調査の未コミット文書/画像は除外・保持。ステージ内容の機密パターン0・リンク欠落0。プロダクト3ファイル/検証スクリプト/設計注記/自己完結したUI復元記録/新画像14枚を含む。
- commit：54f3b66df40afd91596780cb7e46fe5835e5656b。bonbabo108/codestep、codex/admin-rls-portfolioだけをpush。Vercel dpl_HBNjPsN2UvTheNJpSgQtPkJzQ8Jzは同repo/ref/SHAのREADY・非production。
- Preview：https://codestep-k229a99br-touya1896-7818s-projects.vercel.app 。Vercelログイン済みChromeの正規アクセスを使用。保護変更/同じ403ツールの再送なし。
- 共通Preview限定2変数を再照合。URLは正規stagingルート、rest/v1等なし。キーは同じstagingの有効なキーとメモリ内で完全一致、ブランチ固有上書きなし。値は表示/記録しない。
- 実Previewで成功：1440/390pxの学習/管理の横溢れなし・不要説明/再読込なし、匿名出題/正誤、匿名・一般の管理リンク非表示/直接URL拒否、本人保存/ログアウト/再ログイン復元、実管理者JWTで右上リンク表示/正常遷移/問題作成/編集。
- 保存先をstagingの読取APIと照合し、本人進捗1件の更新、全3件維持を確認。使い捨て問題だけを対象に匿名・一般の直接API I/U/Dを試験し全拒否・データ不変も確認。
- 削除UIはネイティブconfirmを観測。ブラウザ入力がEmulation.setFocusEmulationEnabledで停止する既知の制御問題が再現したため同じaccept操作を繰り返さず、通常のネイティブ入力を試した。OS操作権限は未完了という応答で利用不能。使い捨て問題のOKだけ人間の操作を依頼中で、現段階では削除UI成功とはしない。
- 本番ドメインはdpl_GoE7Mo9W49q2BEcYfJh1iQXujSuq / main / 35c13e3のまま。コードの追加修正なし。既存56件・ブラウザモック17件・型/lint/ビルド成功を再利用し、無駄な全再実行なし。後片付け/最終結果はこの節の追記を優先する。

最終追記：削除ダイアログは閉じたが、削除成功表示なし・使い捨て問題の一覧残存を確認。UI削除は未完了。手動OK依頼は不要になった旨を伝え、再送せず保留した。匿名へログアウト後、学習→ログインを3周すべて正常表示。390px登録表示も横溢れなし。取得console error0/SyntaxErrorなし。開発サーバーの断続的読み込み失敗はこのPreview試験では再現せず、開発環境側の既知課題として記録し追加調査はしない。

後片付けはCODESTEP_STAGING_TESTS=1 node /tmp/codestep-preview-state.mjs restoreを1回要求したが、exec_commandのCreateProcessがRejected (rejected by user)で拒否され、コマンドは起動していない。拒否主体/理由は応答以上に推測しない。同じ変更の再試行・別ツール迂回なし。stagingへのBEGIN READ ONLY集計でquestions4（今回の固定名試験問題1）/progress3/admin true1を確認した。試験問題削除、本人進捗1件の開始値への復元、管理者メタデータ復元は**未完了**。開始スナップショットは0600の/tmp/codestep-ui-preview-state.jsonに保持。実行許可の解決後に終了処理し、全データ一致で確認するまで後片付け成功としない。

今回の製品コード修正はなし。検証画像はscreenshots/preview-ui-54f3b66/、記録はローカルのみ。選択コミット21件の外にあった旧未コミット記録/画像を保持している。本番公開判断は削除UI確認・staging後片付けの未完了と、従来の本番SQL/Auth/公開承認が残るため保留。

### 2026-10-17 復元前の読み取り判定

codestep-stagingのプロジェクトIDを照合し、変更前にBEGIN READ ONLYで取得：questions4、削除対象1、user_progress3、管理者true1。削除対象がDBに残存しているため、管理画面の削除はDBに反映されていない。表示更新だけの問題とは判定しない。内部原因は未特定。今回は再クリックやUI変更・再テストをせず、確認結果の記録後に承認された試験変更だけを復元する。後片付けAPIでの削除と管理画面の削除試験結果を混同しない。

復元結果：実行許可後の対象限定処理1回が終了コード0。使い捨て問題1件の削除、本人進捗1件の開始値（内容・更新日時）、管理者app_metadata全体の復元を実施。保存済み3テーブル全行と管理者メタデータが開始時と完全一致し、管理者フラグfalseも確認。別のBEGIN READ ONLY集計はquestions3/profiles2/user_progress3/対象問題0/管理者true0。**後片付け成功、管理画面の削除成功は未確認**。追加のUI操作・コード変更・既存機能の再テスト・本番アクセス/変更は行っていない。上の「後片付け未完了」は復元前の履歴として残す。

## 2026-10-17 管理者専用ログインの入口（ローカルのみ）

最新仕様は匿名/一般にも右上の管理リンクを表示する。管理者→/admin、その他→/admin/login。以前の「管理リンク非表示」の期待だけを更新し、管理フォーム/APIの認可を弱めない。新しい実DB/RLS試験ではなく、ローカルNext本番ビルド＋実Chrome＋全APIモックである。外部ホストへのブラウザ要求は遮断し、実資格情報は使わない。

| 検証 | 最終結果 |
| --- | --- |
| npm test / lint / typecheck / Webpackビルド | 56成功 / 成功 / 成功 / ダミー接続で成功。新2ルート生成 |
| 既存UI17項目 | 成功。学習/正誤/本人保存/復元/ログアウト/再ログイン/登録/管理作成編集削除/0件/FK/拒否/通信異常とPC・390px |
| UI-A01 / A02 | 成功。匿名管理リンク→専用ログイン→/adminで既存削除、認証済み管理者は直行し再読込でも維持。専用入口の新規登録なし |
| UI-A03 / A04 | 成功。一般は権限不足案内、セッションを自動破棄しない。本人操作でログアウト→管理者切替。一般が専用入口からログインしても/admin・/questionのCRUDフォームなし/変更要求なし |
| UI-A05（2件） / A06 / A07 | 成功。誤資格情報・通信失敗で安全なエラー、パスワード消去、二重送信はtoken要求1回。切替のログアウト失敗では新ログインフォームを出さず再試行案内 |
| UI-A08（2件） | 成功。PC1440px/スマホ390pxの匿名学習・専用ログイン・一般拒否で横溢れなし。画像は/tmp/codestep-admin-entry-ui、旧画像原本は保持 |
| 実staging・Previewの新入口 | 未実施。今回既存Authへの管理者付与/変更は未承認で実施せず。現Preview54f3b66には今回のコード未反映。実メール送達・複数端末実機も未検証 |

ブラウザ初回は25成功/2失敗。誤資格情報はモックのAPIバージョンヘッダーがなくSDKにcodeが渡らず、安全な汎用エラーになった。ヘッダー追加後も別オリジンのCORS公開設定不足が残り、インストール済みSDKのparseResponseAPIVersion/handleErrorと照合してaccess-control-expose-headersを追加し、当該1件のみ再試験して成功。ログアウト失敗はSDKが403をログアウト済みとして扱うため、モックを500へ訂正して限定再試験成功。製品の認証/エラー変換処理は変更していない。最終結果は個別の再実行を含む27項目の成功であり、一括27件の最終再実行とは記載しない。全ケースで未処理pageerrorなし。

実行は既存ランナーのCODESTEP_LOCAL_UI_TESTS=1とCODESTEP_UI_USE_BUILD=1、既存Playwrightモジュールを指定。CODESTEP_UI_TEST_FILTERは「|」区切りで再試験対象を限定できる。既存RLS/実API/実Authの過去結果を再利用し、今回のモックで新しい実DB成功や旧7→4移行成功を主張しない。

## 2026-10-17 ac4692bの実Preview・専用管理者

Preview：https://codestep-jvkfz5ng1-touya1896-7818s-projects.vercel.app 。同repo/ref/SHA・READY・target=nullをVercelのデプロイ取得、GitHub status successと照合。既存ChromeのVercel認証を使い、保護設定は変更しない。Preview限定URL/有効公開キーはstagingと完全一致、ブランチ上書きなし。環境値・認証情報は非表示。

| 実環境確認 | 結果 |
| --- | --- |
| 匿名の管理リンク→専用入口 | 成功。/admin/login、管理者ログイン見出し、管理者の登録切替なし |
| 専用adminログイン→/admin | 成功。承認された学習者とは別アカウントでログイン。学習画面の管理リンクも/adminを指す |
| 管理者の作成・編集 | 成功。固定名の使い捨て1件だけを操作し、成功表示/一覧を確認 |
| 学習者/login・DB出題・回答保存 | 成功。新しい試験問題は不正解でスキップし進捗を作らず、既存架空問題への正解を保存。別の読み取りで既存進捗の変更1件を照合 |
| 学習者の再ログイン復元 | 成功。コードと復元表示を実画面で確認 |
| 一般ユーザーの管理拒否 | 成功。/admin/loginで案内・フォーム0・セッション維持。/admin直接入力でもフォーム0 |
| 削除・後片付け | APIによる削除成功、既存進捗の内容/更新日時を復元。3テーブル全行が試験開始時と完全一致。管理者メタデータもtrueを保ち完全一致。UI削除は既知の操作障害を再試行せず未検証 |
| 終了時 | 取得console error0。試験セッションはログアウトし、本人確認用の専用ログイン画面を残した。デモ権限は保持 |

同じローカル56件/27項目/型/lint/ビルドや無関係なRLS試験は再実行せず、直前成功と同じ製品コードをpushして検証。新規Auth/パスワード変更/本番/TodoApp/RLS/スキーマ/課金/Production/main変更なし。実管理者権限の付与だけは対象を読み取り確認し、ユーザーの新しい明示承認後に実施した。PCのログイン情報ファイルの内容は資料・ログ・Gitへ記録しない。

## 2026-10-17 履歴あり削除の仕様変更

対象SQL/設計と承認範囲は[question-deletion.md](./question-deletion.md)。旧「履歴ありはFKで拒否」は過去の仕様・結果であり、今回の期待値ではない。stagingの新RPCだけを承認後に追加、FK/RLS/既存テーブルACLは維持した。Previewへのpushは未承認・未実施。

| 完成条件 | 実施と結果 |
| --- | --- |
| 履歴なしの削除 | 成功。実API、実staging接続のローカル本番ビルドUIで問題の消滅をDB照合 |
| 履歴ありの削除 | 成功。架空の2ユーザー分の試験進捗を持つ問題で、警告→「はい、削除する」後に問題/関連進捗とも0。無関係な行は維持 |
| キャンセル | 成功。アプリ内「いいえ」後に問題1/関連進捗2が残存。確認モードRPCも非変更。ネイティブ確認は0件 |
| 途中失敗の原子性 | 成功。単一ROLLBACK試験内の試験ID限定トリガーで問題DELETEを故意に失敗させ、先の進捗DELETEも巻き戻り、両方残存。終了後の試験トリガー0 |
| 一般/匿名の拒否 | 成功。実署名付き一般セッション/匿名からRPCが42501で拒否され、問題/進捗は不変。非管理者のフォーム非表示もローカル回帰成功 |
| 確認後の履歴追加 | 成功。事前確認は履歴なし、その後に試験進捗を追加。旧確認のままでは両方残り、関連削除の再確認後だけ消滅。API/モックUIで確認 |
| 異常系/二重送信/表示 | 関連単体16件成功、モックUI13項目成功（限定再試験を含む）。取得失敗/0件/通信/権限/FK不整合、連打防止と作成編集の維持。PC/390px実stagingダイアログも表示・取消・削除成功 |
| 型/lint/ビルド | 成功。ダミー接続の本体ビルドと、秘密ファイルを含まない隔離コピーのstaging接続本番ビルド。クライアント29JSに秘密キー/パスワード/本番参照IDなし |
| 後片付け | 成功。新しい開始値4問題/3profile/4進捗の全行完全一致、既存FK/RLS/ACLとデモ管理者trueも保持。使い捨て0。現Previewの旧削除経路は未変更 |

途中の失敗：RPC応答の型をunknownとして検査する修正、モック取消試験のダイアログunmount待ち追加、試験進捗INSERTから禁止列updated_atを除去（読み取りで試験進捗0を確認後に残作業だけ再開）。いずれも権限/RLS緩和で解消していない。関連成功以外の全テストは再実行していない。

実DBハーネスはscripts/question-deletion-staging-check.mjs（明示opt-in、staging固定、0600設定、IDマニフェスト限定）。今回のマニフェストは/tmp/codestep-question-deletion-test-state.jsonで片付け済み。古いmanifest/setupやフラグ解除付き復元処理を再実行しない。新しい試験には新規スナップショットを用意する。実UI画像はGit外の/tmp/codestep-delete-real-warning-pc.png / mobile.png。認証情報を画像・資料・ログへ転記しない。

## 2026-10-17 削除修正のPreview最終確認（cb34946）

ユーザーの追加承認で削除修正9ファイルだけを選択コミットし、codex/admin-rls-portfolio限定でpush。以前からのREADME/公開判断資料/画像と、判断/テスト記録の過去の未コミット部分は除外・保持。コミットはcb34946ecbad71c3b10446fdefb3a53fd0c7fb17、remote一致。

新Preview：https://codestep-bywtked27-touya1896-7818s-projects.vercel.app 。dpl_2nBqeFzXfoceasoEfy3dYBW8hxXbは同repo/ref/SHA・READY・target=null。Preview限定のURLはstagingルート、公開キーは同stagingの有効キーと一致、ブランチ上書きなし。Production環境値は復号していない。

実Chromeで専用管理者ログイン→/admin→アプリ内ダイアログを確認。履歴ありの不可逆警告と「いいえ」/「はい、削除する」が表示された。「いいえ」後は試験問題1/進捗2をDB読取で確認。「はい」後は成功表示/一覧から消滅し、問題0/関連進捗0をDB照合。履歴なし問題もUI削除成功。取得console error0。過去の単体16件/関連モックUI13項目/型/lint/ビルド/途中失敗の実DB原子性試験は再利用し、無関係な再試験は行わない。

今回だけの新規0600スナップショットを使用し、試験問題2/試験進捗2は全て除去済み。既存3テーブル全行と管理者app_metadataは開始時と完全一致、デモ管理者trueを保持。Auth設定・SQL/RLS/FK・本番/TodoApp/main/Production/課金変更なし。認証情報を出力せず、本人向け0600ファイルのPreview URLだけ更新。画像はGit外/tmp/codestep-deletion-preview-warning.png / success.png。この結果追記はローカル記録のみで追加pushなし。

削除修正のPreview公開を妨げる問題は今回の確認範囲で見つからない。本番にはRPCが未適用であり、main反映/本番SQL/Auth/Productionは引き続き未承認。旧ポリシー移行など過去の未検証事項は今回の成功で解消扱いにしない。

## 2026-10-17 Week12正式課題：GitHub ActionsでESLint（ローカル完了・push承認待ち）

WorX AIの指定に合わせ、.github/workflows/lint.ymlと.eslintrc.jsonを追加。ESLint10.13.0/@typescript-eslint/parser8.71.2を固定開発依存へ追加し、eslint.config.mjsが指定JSONのno-debugger:errorを直接読み込む。ESLint10のflat config用の橋渡しであり、.eslintrc.jsonは飾りではない。npm run lintは実ESLint、旧lintのTypeScript/未使用検査はnpm run typecheckへ維持。アプリ/UI/SQL/DB/Auth/環境値を変更しない。

成功：npm run lint（警告/エラー0）、npm run typecheck、既存npm test58件。インメモリのTSXでdebuggerだけを検出し、同じコードからdebuggerを除くと成功することを確認。YAMLはjs-yamlで構文とtrigger/Node24/最小contents:read/実npm lintステップを検査。既存lock424パッケージのversion/integrityは全て不変、新規72件は追加した開発依存のため。Nodeの既存MODULE_TYPELESS_PACKAGE_JSON警告は今回のアプリ変更で解消しない。ビルド/実画面/DB試験はアプリと既存依存の版が不変のため再実行せず、前回結果を再利用する。

未実施：コミット/push、GitHub Actions実行/履歴、課題提出用スクリーンショット。push対象はbonbabo108/codestepのcodex/admin-rls-portfolioのみ、main/Productionは対象外。pushでこのESLintワークフローと既存Vercel Preview自動ビルドが起動する見込み。workflowはDBキー不要、DB試験/デプロイ/課金設定変更を含まない。承認後は課題用5ファイルと必要なら本節だけを部分ステージし、以前からのREADME等・画像を混ぜない。GitHub上で指定2ファイルの存在とActionsのESLint成功が確認できるまで課題完了としない。

## 2026-10-17 Week12 Actions実行成功（承認後）

課題用5ファイルだけをd950f3fbb613fd97901cda4b903124a5d834a950へコミットし、codex/admin-rls-portfolioだけへpush成功、remote一致。既存6文書/画像の未コミット作業は除外・保持。GitHubの指定2ファイルと、push起動のESLint #1（run39031564825・同SHA/ref・Success・28秒）を実画面で確認。APIでもlintジョブ117392884673のInstall dependencies/Run ESLintを含む全ステップsuccessを確認。https://github.com/bonbabo108/codestep/actions/runs/39031564825 。再実行・再pushなし。提出画像はlint.yml画面で左ファイルツリーの.github/workflows/lint.ymlとルート.eslintrc.jsonを同時表示した画面、Actions実行詳細のSuccess/コミット/ブランチが見える画面。両タブを撮影用に保持。今回は画像ファイルを新規作成していない。main/Production/DB/Auth/Vercel設定/READMEの追加変更なし。本追記はローカル記録のみで追加commit/pushなし。課題の実装・push・実ESLint実行履歴確認は完了、本人による画像撮影とWorX AIへの提出は未実施。


## 2026-10-18 既存の型チェック・58テストをActionsへ追加（ローカル検証済み）

.github/workflows/lint.ymlの既存Run ESLintの後ろにCheck TypeScript types（npm run typecheck）、Run tests（npm test）の2ステップだけを追加。Node24、npm ci、発火条件、contents:read、10分上限、既存のESLintを維持。continue-on-error等で検査を緩めず、前段の失敗時は後段検査を実行しない既定の挙動を使う。アプリ/画面/依存/型設定/58テスト/DB/Auth/環境値は変更しない。

2026-10-18ローカルでワークフローと同じ順のnpm run lint→npm run typecheck→npm testが終了コード0、58成功/0失敗/0省略。YAML構文と実行順/Node24/権限/失敗を無視しない設定の静的確認も成功。既存のNode MODULE_TYPELESS_PACKAGE_JSON警告は残るがテスト失敗ではなく、今回変更しない。ビルド/画面/実DB試験は変更対象外のため再実行しない。

既存run39031564825のESLint単独成功を読取APIで確認したが、新しい3検査のActions成功とは扱わない。現HEADはd950f3f、変更は未コミット/未pushで、新設定のGitHub Actions実行は未実施。pushはAGENTS.mdにより別途明示承認が必要。対象はcodex/admin-rls-portfolioのみで、既存連携によるVercel Preview自動更新を伴う。本番/main/DB/設定変更や、Actions成功を待つデプロイ制御は今回追加しない。既存の未コミット資料/画像は保持する。


## 2026-10-18 3検査のActions成功（承認後）

想定外の差分0・秘密情報パターン0を確認し、lint.ymlの4行と今回の2検証記録の節だけを部分ステージ。3ファイルをe2a772feb40c81f308b29678fd55ec15f9006babへコミットし、codex/admin-rls-portfolio限定でpush成功、remote一致。既存6文書と画像の未コミット作業は除外・保持。

https://github.com/bonbabo108/codestep/actions/runs/39106514680 （ESLint #2）は同SHA/ref・push起動でSuccess。GitHub実画面とジョブAPI117613416165でRun ESLint／Check TypeScript types／Run testsを含む全ステップsuccessを確認。取得ログの集計はtests58/pass58/fail0/cancelled0/skipped0/todo0。ローカル成功からの推測ではなく、GitHub上の実行結果。既存のNodeモジュール種別警告を理由に検査を緩めず、再push/再実行なし。本番/main/マージ/DB/Auth/Vercel設定変更なし。今回のワークフローにデプロイや実DB試験は追加していない。完了結果の本追記だけローカル記録で、追加commit/pushは行わない。


## 2026-10-18 ESLint第1段階：基本3ルール追加（未コミット）

.eslintrc.jsonへno-constant-binary-expression/no-unsafe-finally/prefer-constをerrorで追加し、既存no-debuggerを維持。eslint.config.mjsのJSON読込形式/検査対象/除外、依存、アプリ/UI/DB/SQL/既存58テスト/Actionsを変更しない。AI生成コードの意味のない条件式・finallyによる例外/戻り値の上書き・不必要なletを早期検出するため。

成功：npm run lint（警告/エラー0）→npm run typecheck→npm test（58成功/失敗0/取消0/省略0）。4ルールの意図的な違反をインメモリで検出し、正常例の成功も確認。例示のコードはファイル化せず自動修正なし。既存のNodeモジュール種別警告は残るが、ルールを緩めたりアプリを変更したりしていない。

本番/検証用の.envを複製せず、既存依存を参照するGit外の隔離コピーで、ダミー127.0.0.1接続と架空公開キーによるnpm run build -- --webpackが終了コード0、全7静的ページ生成成功。元のnext-env.d.tsを含む追跡ファイル全て（意図した.eslintrc.jsonを除く）が開始時のSHA-256と一致した後、判断/テスト記録へ本節だけ追記。実ブラウザ/実DB試験と新ルールのGitHub Actions実行は未実施。既存未コミット資料/画像は保持。コミット/push/デプロイ/本番・staging変更なし。

次のReact Hooks段階は未着手。プラグインのESLint10互換性確認が必要。依存配列やEffect修正は認証・再取得・保存復元へ影響するため、警告回避だけの機械的変更はせず関連回帰で確認する。現lintのmax-warnings0ではwarnもCI失敗になる。


## 2026-10-18 ESLint第1段階のpush・Actions成功（承認後）

AGENTS.md/指定ブランチ/remote/差分を直前確認し、想定外変更0・限定機密パターン0。設定と今回の判断/検証記録だけの3ファイルをfaed87bc9d0a1a325905428f87a7b0dc32f63cc7へ選択コミットし、codex/admin-rls-portfolio限定push成功・remote一致。過去の未コミット6文書/画像は除外・保持。

https://github.com/bonbabo108/codestep/actions/runs/39109478783 （ESLint #3）は今回のSHA/ref・push起動でSuccess。実画面とジョブ117622300638のAPIでESLint/型チェック/Run testsの成功を確認し、ログでtests58/pass58/fail0/cancelled0/skipped0/todo0を照合。ルール緩和・テスト変更・再実行・追加pushなし。main/マージ/Production/本番・staging Supabase/Vercel設定変更なし。本追記はローカル記録だけで追加commit/pushしない。


## 2026-10-18 ESLint第2段階：React Hooks正式導入の検証

対象：開発依存eslint-plugin-react-hooks 7.1.1固定、既存JSON/flat config連携へrules-of-hooks / exhaustive-depsをerrorで追加。既存4ルール、files/ignores、アプリ/テスト/Actionsを維持。

| 検証 | 結果 |
| --- | --- |
| npm run lint | 成功。既存と同じ32ファイル、エラー0・警告0 |
| npm run typecheck | 成功。終了コード0 |
| npm test | 成功。既存58件、失敗0・取消0・省略0 |
| 正式設定＋インメモリの条件分岐内useState | 成功。react-hooks/rules-of-hooksがerrorを検出 |
| 正式設定＋インメモリのuseEffect依存不足 | 成功。react-hooks/exhaustive-depsがerrorを検出 |
| 正常なHooks例＋既存4ルールの有効性 | 成功。正常例指摘0件、既存4ルールはerrorのまま |
| 隔離コピーでnpm run build -- --webpack | 成功。終了コード0、7静的ページ生成。環境ファイルなし・ダミー接続のみ |
| lockfileの既存version/integrity照合 | 成功。変更0。新規はプラグインと必要な間接開発依存3件 |
| 開始時105ファイルの照合（記録追記前） | 成功。変化は.eslintrc.json/eslint.config.mjs/package.json/package-lock.jsonのみ。既存未コミット作業も保持 |

既存のNodeモジュール種別警告、隔離ビルドでの複数lockfileによるNextルート推定警告は観測したが検査は成功。ルール緩和・自動修正・useEffect依存配列の変更なし。記録は既存2文書へ追記のみ。

未実施：Turbopack経路、実ブラウザ/実DB試験、今回設定のGitHub Actions実行。静的検査と既存モック等の58テストは、実DB/Auth/RLSや通信競合の動作保証ではない。アプリ未変更のため無関係な実環境試験は繰り返さない。コミット/push/デプロイは依頼により実施しない。


## 2026-10-18 ESLint第2段階のpush・Actions成功（承認後）

AGENTS.md/指定ブランチ/remote/差分を直前確認。React Hooks導入の設定/依存4ファイルと今回の判断/検証記録2節だけを選択し、6ファイルをd82ad0e303fe6ca2d8f91f438ecb40179e14db91へコミット。codex/admin-rls-portfolio限定push成功、GitHubのrefも同SHAと一致。機密パターン一致0、既存lockのversion/integrity不変、作業ツリー105ファイルはcommit/push後も開始時ハッシュと一致し、以前からの未コミット資料/画像を保持した。

https://github.com/bonbabo108/codestep/actions/runs/39113394619 （ESLint #4）は同SHA/ref・push起動・attempt1でcompleted/success。ジョブ117634093113のInstall dependencies/Run ESLint/Check TypeScript types/Run testsを含む全ステップsuccessをAPIで確認。ログでも実eslint/tsc/node --testの起動、tests58/pass58/fail0/cancelled0/skipped0/todo0を照合した。コミット内の既存4＋Hooks2ルールは全てerror、検査対象/除外不変。今回はESLintが6ルールをまとめて検査し成功した結果で、ルールごとの別ジョブではない。

アプリ/UI/認証/依存配列/Supabase/DB/Actions設定への追加変更・ルール緩和・再実行・追加pushなし。main/マージ/Production操作なし。既存Preview自動更新はユーザー了承済みだが、今回そのREADY/実画面/実DBを確認したとは扱わない。今回のActionsはビルドを実行せず、Turbopack/実画面/実DB/Auth/RLSの再検証は未実施。前回ローカルのダミー接続Webpackビルドと意図的なHooks違反検出は成功済み。本節はローカル記録だけで追加commit/pushしない。


## 2026-10-18 staging緊急停止・復旧試験：直前照合成功・資格情報待ち

今回の明示承認後、対象codestep-staging（ezjzgebehancbxqpgany）を照合し、まとめたREAD ONLYの1要求で19:36 JSTの通常ACL/ポリシー/削除関数定義/所有者/RLS/ロール状態が記録と一致。Supabaseツール計2回（プロジェクト識別1・SQL読取1）。旧0600一時資格情報ファイルが消失しており実JWTを準備できないため、停止前で保留した。Auth変更・service_roleでの代用・古い試験スクリプトの再実行なし。停止/復旧SQL原本は不変・両方未実行、試験問題/進捗の作成/削除/残存は各0。停止中/復旧後/旧JWT/実ロールバックは未検証。判定は一部成功・追加確認必要（直前照合のみ）。詳細はdocs/emergency-drill-20261018/review.md冒頭とexecution-results.json。アプリ変更・無関係な再テスト・commit/push/デプロイ・本番アクセスなし。既存staging試験アカウント情報の安全なファイルが利用可能になれば、今回の同じ承認範囲で続行する。


## 2026-10-18 認証情報なしでの確認範囲と停止試験の保留

ユーザーは旧資格情報の所在不明と回答。今回はSupabaseアクセス/追加承認要求0、停止/復旧/テストデータ/Auth変更なし。SQL原本2本のSHAとMarkdown全文一致のローカル4照合は成功。DBの最新根拠は前回19:36:25 JSTの読み取りであり再取得していない。実ログイン/実JWT/停止中の拒否・本人保存/復旧後の実動作は未実施。匿名APIはアカウント不要だがstaging公開キー等が必要で今回は未実行。所有者/service_role/手作りJWTで一般利用者の試験を代用せず、試験手段が揃うまで停止/復旧を開始しない。所在質問や探索も繰り返さない。新規架空Auth2件・新規管理者1件・必要なprofile最大1件と専用IDの片付けをまとめた別承認案をreview.md冒頭に記載（未承認/未作成）。認証情報はGit外0700/0600で扱う案とし、今回生成/保存なし。既存成功試験の再実行、commit/push/デプロイなし。


## 2026-10-19 staging緊急停止・復旧の実施：一部成功・片付け未完了

明示承認後、新規Auth2件の通常ログイン、専用2問題/1進捗/1profileの作成成功。原本stop/resumeを変更せず適用し、最終04:14 JSTのACLは開始前の安全な状態と完全一致、RLS/ポリシー/関数定義不変。停止観測時の他トランザクション0件。Auth/profile/progressに試験作成分を超える件数増加を検知して通常検査を中断し復旧を優先した。停止中の実API閲覧/拒否・旧JWT拒否・本人保存、復旧後CRUD/一般拒否、実ロールバックは未実施。新規分だけの片付け要求がMCPのInvalid or expired requestStateとなり再送/迂回なし。読み取りで今回分2問題/1進捗/1profile/Auth2が残存、権限は安全な復旧状態と確認。新規試験管理者も保持されており片付け未完了。根本原因未特定のツール許可状態エラーで、DB構文エラーと断定しない。Supabaseツール10回、試験API10要求＋接続確認1＋ネットワーク失敗1。詳細・今回ID・全観測はdocs/emergency-drill-20261018/live-run-results.jsonとreview.md冒頭。既存アプリ/依存/58テスト不変、無関係な再検査・本番アクセス・commit/push/デプロイなし。


## 2026-10-19 04:21 JST 片付けSQLの再承認前安全確認（未実行）

プロジェクト識別/権限確認を再利用し、不足していた3表の連鎖経路と対象件数だけREAD ONLYの1要求で確認。記録済み2問題/1進捗/1profileとラベル/紐付けが一致、対象外関連進捗0。FK2件はNO ACTION、独自トリガー/ルール/子表なし、内部8トリガーはFK検査のみ。元cleanup SQLは保持し、削除前全件数/メタデータ検査と処理中ロックを追加したlive-cleanup-data-reviewed.sql（SHA cb183dcda4a43c5ca113034560cf1d72d726418e989425486ba777c32ecf84f1）を別原本として準備。全DELETEは記録IDのWHERE限定、単一TX・削除後件数照合も維持。新原本のDB実行/実ロールバックは未実施。削除ツール再送、Auth/本番/設定変更なし。旧requestStateエラー解消は未確認で、新たな明示承認と正常なツール許可が揃うまで実行しない。詳しくはreview.md冒頭/cleanup-final-review.json。

## 2026-10-19 10:56 JST 承認済み4行の片付け成功

明示承認された改訂原本cb183dcda4a43c5ca113034560cf1d72d726418e989425486ba777c32ecf84f1だけをstagingに1回・単一TXで実行。問題2/進捗1/profile1を削除し、別READ ONLYで対象0、対象外3表の件数/全行照合値不変、Auth10件とメタデータ不変、安全なACL34359cdf23e85be0c1309b1280d24020・RLS/ポリシー/関数不変を確認。試験Auth2件・試験管理者trueは今回の承認条件で残す。想定外件数増加の原因は未特定のままで不明行は維持。停止/復旧の権限検査は成功、停止中実API/旧JWT/本人保存と復旧後CRUD/一般拒否・意図的ロールバックは未実施。試験全体は一部成功。Supabase4回（識別1/読取2/削除1）、追加業務承認0、再送0。許可画面回数は取得不能。詳細はreview.md冒頭/approved-cleanup-result.json。原本・アプリ・既存未コミット作業を保持し、本番/Auth/権限の変更・無関係な再テスト・commit/push/デプロイなし。


## 2026-10-19 最終仕上げ：認証URL・安全なデモ・評価証拠

- 作業場所 /Users/taimatsutouya/codestep、ブランチcodex/admin-rls-portfolio、worktree1件、開始HEAD d82ad0e。引継ぎ資料は実際には変更6ファイルと未追跡記録・画像で、30ファイルを/private/tmpの0600アーカイブへ保全。reset/clean/変更破棄なし。codestep_key_files.txtは未操作。
- 提供されたスマートフォン画像のlocalhost誤遷移を受け、Supabaseダッシュボードを読み取り。staging ezjzgebehancbxqpganyと本番 xdnmlfoblqdygsnhkxxpの両方でSite URL=http://localhost:3000、Redirect URLsなしを確認。DBの行/権限やAuthユーザーの再調査はしていない。設定の保存なし。必要な変更案はauth-release-checklist.mdへ。
- 登録/再送のemailRedirectToを現在originの/loginへ指定。確認後のセッション検出→学習画面、確認待ちとログイン成功の区別、期限切れ案内、固定エラー文、60秒再送間隔を実装。メール確認を無効化しない。実配信・公開URLへ戻る実メール確認は未実施。
- /demoにメモリ内の架空3問・回答/解説/クリア・問題作成/編集/削除取消/確定・初期化を追加。実Authフラグ・共通パスワード・DB書込は使用しない。通常画面のAuth表示枠を動的に分離し、デモから通常画面への先読みを無効化。同じ判定/入力検証を再利用。共通フッターとデモ導線も追加。
- 外部Week9資料をGoogle Driveで本文/メタデータ読取。更新日時は前回と同じ2026-10-15T01:34:41.267Z。外部編集なし。final-design.mdに課題/解決策/全16列ER/画面遷移/機能一覧、evaluation-evidence.mdに評価項目と証拠・限界を作成。READMEの重複・旧状態説明を整理しUTF-8で保存。旧PNG原本は不変。
- CIにmain pushとダミー接続Webpackビルドを追加。既存push/PRのESLint・型検査・テストを維持。
- 成功：npm test 62件（従来58+認証4）、npm run lint、npm run typecheck、ダミー接続npm run build -- --webpack。最終ソースに対する確認結果は後続の追記も参照。
- 実Chrome＋ダミー接続ビルド：デモ正解/不正解/CRUD/削除取消/確定/初期化、390pxで横幅390=scrollWidth390。架空ローカルAuth APIで登録確認待ち/再送/期限切れURLエラー除去/ログイン遷移/ログイン済みloginから学習画面/一般管理拒否・セッション維持/ログアウトを確認。架空APIは実Auth/RLSの証明ではない。未認証ログインの専用エラー文は初期fixtureのAPIバージョン応答差で汎用文になり、SDKモック条件の修正が必要。
- 既存staging実CRUD・本人保存・RLS拒否の成功は再利用。緊急停止・復旧/旧7→4/片付けを再実施していない。既存試験記録はそのまま保持。
- 初回ローカル起動はsandboxのlisten EPERMで失敗。ツール実行許可後に127.0.0.1:3100で成功。Vercel MCPの指定scope読取は403。ローカルVercel CLIなし。正常にログイン済みのダッシュボードで公開先を読み取り確認する。権限設定は変更しない。
- 本番DB・Auth設定/ユーザー・RLS・環境変数・Productionは変更なし。mainマージは本番前提が揃うまで保留。今回のPR作成要求を作業ブランチcommit/push/Previewの承認として扱い、他ブランチへはpushしない。


2026-10-19追記：リモートmainは274eb79（PR #2で提出用READMEをcodestep-portfolioへ集約）へ進んでいた。fetchで差分がREADME削除のみと確認。ユーザーも提出用だけへの集約を選択。改訂したローカルREADMEはdocs/implementation-guide.mdへ移動して保全し、アプリ本体READMEはmainと同じ削除状態にする。提出用READMEはcodestep-portfolioの別ブランチ/PRで修正する。VercelダッシュボードではProduction=274eb79/Readyを確認。以前の35c13e3は現在のProduction SHAではないが、今回の新機能は依然未反映。

認証SDKの旧形式error_codeとAPIバージョン付きcodeの両応答で、未確認メールの専用案内へ変換されることを追加検証し成功（同じテスト内、全62件の件数は不変）。初期ブラウザfixtureにはこの応答条件がなく、当該1画面の専用文言は実ブラウザ未検証のまま区別する。最終ソースでlint/typecheck/ダミーWebpackビルドを再実行し成功。画像原本は保持。今回の画像と新資料のUTF-8・ローカルリンク検査も成功。


## 2026-10-19 最終公開・承認済みstaging URL設定の結果

- アプリPR：https://github.com/bonbabo108/codestep/pull/3 （draft、main/本番移行待ち）。実装コミットf6154af、最新main274eb79を取り込んだ53a5d43を作業ブランチだけへpush。
- 53a5d43のpush CI：https://github.com/bonbabo108/codestep/actions/runs/39192624505 、PR CI：https://github.com/bonbabo108/codestep/actions/runs/39193029033 。両方でnpm ci/lint/typecheck/62テスト/ダミーWebpackビルド成功。PRの合成merge refも検査されている。実行ログで各段階を確認。通常のNodeモジュール形式警告とビルドキャッシュ未設定の注記あり、失敗なし。
- Vercel Preview：dpl_3jA9YzKeaPPwUY2jTp52QddSVTcQ、53a5d43/codex/admin-rls-portfolio/Preview/Readyをダッシュボードで照合。個別URL https://codestep-4e6rzv5s4-touya1896-7818s-projects.vercel.app 、固定URL https://codestep-git-codex-admin-rls-portfolio-touya1896-7818s-projects.vercel.app 。実Previewのデモ正解と通常画面の匿名DB出題3問を確認。認証・書込試験はしていない。
- Vercel env-varsスキルでPreview用の公開URL変数だけを読み取り、https://ezjzgebehancbxqpgany.supabase.co と完全一致、Preview区分であることを確認。キー/秘密値は開かず、環境変数は未変更。
- ユーザーの明示承認後、staging ezjzgebehancbxqpgany のSite URLだけを上記のブランチ固定HTTPS originへ変更し、Redirect URLsへ同じURLの/loginを完全一致で1件追加。成功通知後にページを再読込し、Site URLとTotal URLs=1、対象/loginを照合した。個別デプロイURLやワイルドカードは追加しない。変更後画面はGit外/private/tmpに保存。
- stagingのConfirm sign upは既定テンプレートで、リンクが .ConfirmationURL を参照すると読み取り確認。アプリの登録/再送が指定する固定origin/login、許可URL、ブラウザSDKのURLセッション取得が整合。本番URL設定はlocalhostのまま、今回変更していない。
- 実メール受信・PC/実スマートフォンの確認はユーザーが自分で行うと回答したため、未実施・本人確認待ち。メール送信・新規Auth作成/削除・パスワード/確認要否/SMTP変更なし。レスポンシブ確認を実スマホのログイン成功と扱わない。
- 提出用README PR：https://github.com/bonbabo108/codestep-portfolio/pull/2 。本文の読み戻し全文一致/UTF-8置換文字なし、GitHubのReady to merge/競合なし/Checks 0/レビュー必須表示なしを確認し、d3c6f83を指定してマージ成功（94b38bbc）。mainのREADMEも全文一致を確認。新しいstaging設定の状況は後続の資料更新で反映する。アプリmain/Productionは未変更。
- ローカル3100番のダミー接続アプリと54321番の架空APIは今回のPIDだけを指定して停止。起動・終了にはsandboxの制限がありツール許可を取得。前チャットのバックアップ・原本・画像は保持。静的git差分検査の末尾空行警告は既存approved-cleanup-verify.sqlの1件で、承認ハッシュ維持のため変更せずに記録した。


## 2026-10-19 stagingのVercelアクセス制限調査（公開承認待ち）

本人報告：Gmailの+エイリアス宛てにSupabaseの登録確認メールを受信できた。実メール送信/受信は本人報告による成功。スマホはVercelログインへ転送され、CodeStepのメール確認完了・ログイン・再読込維持は未確認。Pro登録やプラン変更は不要と判断し、実施しない。

ダッシュボード読取でcodestep（Hobby）のRequire Log In=ON/Standard Protection、Deployment Protection Exceptionsに既存ドメインなしを確認。Vercelへ未ログインの別IABで固定staging/loginを開くとVercel Loginへ転送されることを再現。これはCodeStep/Supabaseの認証エラーとは区別する。

提案はcodestep-git-codex-admin-rls-portfolio-touya1896-7818s-projects.vercel.appの1ドメインだけを公開例外に追加するもの。全パスと将来の同ブランチデプロイが公開され、問題閲覧・登録画面・デモ・管理者ログイン入口にVercelアカウントなしで到達できる。アプリ自身の認証・管理者判定・RLS・列権限は変更しない。公開により通信/メール送信枠の消費や登録試行が増える可能性あり。例外削除で保護へ戻せる。プロジェクト全体のRequire Log In解除、共有秘密トークンの配布、新規Vercelプロジェクト/課金、本番/他Preview変更は採用しない。

公開例外のAdd Domain→Continueまでで対象を入力・確認画面を準備し、Remove Protectionは未実行。ユーザーに公開範囲とリスクを説明して承認待ち。確認画面は/private/tmp/codestep-staging-public-exception-review.jpgに保存。Supabase stagingのURL設定を再読取し、Site URLは上記HTTPS origin、Redirect URLsは同じorigin/loginの1件で既存アプリの登録/再送コールバックに一致。Supabase設定の追加変更は不要。

[2026-09-09公式変更履歴](https://vercel.com/changelog/protect-production-deployments-for-free-on-every-plan)と最新ドキュメントで、ドメイン限定の例外は全プラン無料と確認。古い検索キャッシュのPro/有料add-on必須という記載は現在の判断に使わない。UIのAdd Domainも利用可能で、有料アップグレードを促す画面なし。共有リンクはアカウント不要の別案だが、URLパラメータ/Cookieとメールから別ブラウザに戻る経路の管理が増えるため、端末間認証テストは固定ドメイン1件の公開を推奨。

今回の製品コード変更なし。npm test/lint/typecheck/buildは既存成功結果を再利用し再実行しない。公開後の未ログインPC/モバイル幅の画面到達は別途確認予定で、実スマホのメール確認成功とは区別する。新規PR/本番変更/mainマージ/DBデータ・RLS・管理者変更なし。既存の未コミット変更を保持し、この記録は同じ資料へまとめる。


## 2026-10-19 固定stagingドメインのみ公開：承認条件照合・反映成功

ユーザーは固定ドメイン1件の公開例外を明示承認し、検証DB接続・個人情報/本番データ非公開・管理者/RLS維持・対象限定・本番設定不変を条件とした。公開前に以下を確認し、Remove Protectionを1回だけ確定した。新たな同じ承認要求なし。

- Vercel：Preview用NEXT_PUBLIC_SUPABASE_URLは検証DB ezjzgebehancbxqpgany のルートURLと完全一致。公開キー/秘密値は開かず、Production値も変更しない。固定ドメインはdpl_3jA9YzKeaPPwUY2jTp52QddSVTcQ/53a5d43/codex/admin-rls-portfolio/Preview/Readyへ割当。
- Supabase：get_projectでcodestep-staging/ezjzgebehancbxqpgany/ACTIVE_HEALTHYを確認。公開前のREAD ONLYでpublicの通常表はquestions/profiles/user_progressの3表のみ、全てRLS有効。匿名のSELECTはquestionsのみ、profiles/progressの全列参照・書込は不可。本人6ポリシーと管理者I/U/D3ポリシー・公開SELECTが維持され、管理者条件はapp_metadataのboolean true。公開対象questionsは3行で、既知の架空データの全行照合値と一致。実ユーザーのプロフィール/進捗/メール本文は取得しない。Authに本人の新しい登録があっても匿名公開しない。
- 削除RPC：公開/内部両関数のSHA-256が既存レビュー済み定義と一致し、匿名EXECUTEは両方不可。内部スキーマの匿名USAGEも不可。ACL/RLS/Auth/データの変更は実行せず、緊急停止・復旧試験も追加しない。
- UI：app_metadata.codestep_admin === trueの有効セッションだけに管理フォームを表示するコードを確認。公開後、Vercel未ログイン/CodeStep未ログインの別IABから/adminを開くと「問題管理は管理者専用です」と表示され、管理フォームなし。これは匿名UIの確認で、一般/管理者の追加書込試験ではない。
- 公開設定：codestep-git-codex-admin-rls-portfolio-touya1896-7818s-projects.vercel.appの1件だけをDeployment Protection Exceptionsへ追加。保存後の再読込でUnprotected Domainsは同じ1件、Require Log In=ON/Standard Protectionを維持。個別Preview codestep-4e6rzv5s4-touya1896-7818s-projects.vercel.app/loginは別IABでVercelログインへ転送され、他ドメインの保護維持を確認。本番設定は未操作。
- 公開到達成功：Vercel未ログインの別IABで固定/loginがCodeStepのログイン画面へ直接到達。PC幅と390px（clientWidth=scrollWidth=390）を確認。画像はscreenshots/final-20261019/public-login-desktop.jpg・public-login-mobile.jpg。実スマートフォンの結果ではなく、実メールからの復帰/ログイン/再ログイン/セッション維持は本人確認待ち。Gmail+エイリアスへの確認メール受信は前回の本人報告による成功。
- SupabaseのSite URL=固定HTTPS origin、Redirect URLs=同/loginの1件と再照合済み。アプリの登録/再送emailRedirectToも同じorigin/login。今回はSupabase URL設定の追加変更なし。
- 次の本人操作：スマホで固定/loginを新しく開き、すでに登録した+エイリアスとパスワードで通常ログインを先に試す。以前のクリックでメール確認だけ済んでいればそのままログイン可能。未確認の案内なら確認メールを再送し、60秒以上間隔を空け、最新のメールだけを開く。スマホとPCで再読込/再ログインを確認。パスワード/リンク全文/トークンは報告しない。

製品コード変更がないためnpm test/lint/typecheck/buildは今回再実行せず、既存62件・CIの成功を再利用。安全性の現状確認はSupabase計3要求（識別1、READ ONLY2）で、通常表の生データやAuthユーザー一覧を取得せず必要な照合に限定した。新規PR・新規リソース・課金・push・mainマージなし。既存の未コミット資料/画像は保持し、結果は同じ資料にまとめてローカル保存。


## 2026-10-19 Android新規登録・メール確認の修正（実端末再確認待ち）

本人の最新報告は「入力文字が見えない」「確認リンクが期限切れ/使用済み」「未確認メールのためログイン不可」。別の既存アカウントのログイン成功と、今回の新規登録成功は区別する。修正後の実端末成功はまだ確認されていない。

原因・調査範囲：

- 認証カードは明るい背景だが、入力文字色を指定しておらず、OSのdark配色でbodyの明るいforegroundを継承し得た。認証領域をlight配色、入力・caret・placeholder・自動入力の文字色を明示。16pxの入力、autocomplete/emailの補正抑制、パスワード表示切替を追加した。送信時はFormData、再送時はinputの実値を取得し、自動入力でchangeが出ないケースに備える。
- `getSession()`だけではSDKのURL初期化エラーが返らないことを、実SDKとメモリ内ブラウザfixtureで確認した。`initialize()`→`getSession()`の順で確認し、INITIAL_SESSIONが失敗判定を上書きしないようにした。確認失敗は専用案内を表示し、URLの機密パラメータを消す。通常のSIGNED_IN/TOKEN_REFRESHED/ログアウトと管理者判定は維持する。
- staging ezjzgebehancbxqpgany の直近24時間ログを読み取り、/verifyでtoken/not foundに該当する失敗5件、/tokenでemail_not_confirmed拒否3件を集計。/signupの200は7件（確認要求4・繰返し登録3）、/verifyでuser_signedupを伴う成功2件もあるが、個別アカウントへ紐付けていないため本人の今回の成功とは扱わない。メール・ID・IP・トークン・生のエラーは取得していない。失効、旧メール、リンク先読みのどれかは未特定。時刻超過や先読みを断定しない。
- 確認URLは単回利用で、メール先読みでも消費され得ることは[公式仕様](https://supabase.com/docs/guides/auth/auth-email-templates#email-prefetching)。今回それが原因かは不明。最新リンクでも失敗が再現した場合は、本人の試行時刻を基に絞り込み、OTP/クリック確認方式のメールテンプレート変更を別途検討する。SMTP/テンプレート/確認要否/有効期限は変更していない。
- 再読込で状態が消えても「確認メールが届かない・リンクを開けない方」から再送へ進める。再送は登録したアドレスだけで実行し、パスワード不要、60秒間隔、最新メールだけを1回開く案内を追加。未確認なら再登録は不要。既存アカウントの有無を開示する文言は使わない。

成功した自動・ローカル検証：npm test 65件、lint、typecheck、ループバックのダミーURL/キーでWebpackビルド。新規3件は実SDKによる新しいブラウザのcallback/URLからのトークン除去/保存セッションの復元、期限切れ拒否、callbackユーザー検証拒否。既存の登録/再送先一致、送信制限、未確認メールの旧/新API応答形式も成功。

実ブラウザ（架空APIのみ）：390pxで入力・パスワード表示、登録後の確認待ち、期限切れの専用案内とURL除去、パスワード未入力で再送、未確認ログインの専用案内、callback→学習画面のURLとログイン済みヘッダ、再読込、ログアウト→通常ログインを確認。入力色rgb(15,23,42)・明るい背景・caret rgb(29,78,216)をDOMで照合。検証ブラウザはlight設定で、Androidのdark/自動入力・実メール配信を検証したものではない。写真はauth-input-mobile-fixture.jpg/auth-expired-mobile-fixture.jpgで、全て架空データ。初回の架空APIはCORSでAPIバージョンを公開しておらず、未確認エラーが汎用文言になった。fixtureのヘッダを是正した再試行では専用文言を確認。これはstagingの失敗原因とは扱わない。

本番・DB・RLS・管理者権限・既存ユーザーは未変更。緊急停止/復旧SQLの追加実行なし。自動テストに含むSQLの静的検査は実DB試験ではない。既存PR #3/同じブランチへ集約し、mainへマージしない。


## 2026-10-19 中断からの復元・管理画面デモ完成

再開時にcwd/単一worktree/branch/status/diff/既存PRを実確認。HEAD126a152、アプリPR #3=open/draft/未マージ。途中デモ8パスを保持し、AGENTSだけ既存・AI_WORKFLOW/HANDOFF未作成と確認した。恒久ルール/判断改善/現在地を3ファイルへ整え、8399cdfで先に同じブランチへ保存・pushした。旧「通常pushも毎回業務承認」を最新の包括承認へ更新したが、ツール許可と高リスクの承認は維持する。

管理デモ：/demo/adminを新設し、公開ヘッダー/フッターから1クリック。既存/demoを共通DemoExperienceへ分離し、問題の追加/一覧/編集/削除、入力検証・判定を再利用。サンプルは訪問ごとに複製しメモリだけで管理。未存在/重複ID/デモ外IDの保存と削除を拒否し、全件削除から復帰可能。入力のlight配色と44pxの操作領域を追加。本物の管理画面/AuthProvider/管理者判定/SQL/RLS/DB/本番の差分なし。

成功：中断前の同一ソースでnpm test70件（追加デモ5）、lint/typecheck/ダミーWebpackビルド。再開後はビルド/サーバーを再利用し、PCで空白エラー時の入力保持、追加のダブルクリックで1件だけ増加、編集、削除取消/確定を確認。390pxで追加/編集、学習側でその問題へ正解、全件削除の空表示、初期化、再読込で3問へ復帰を確認。clientWidth=scrollWidth=390。公開ページのリンク1クリックで管理状態へ遷移し、既存/demoの学習開始も維持。画像はadmin-demo-desktop.jpg/admin-demo-mobile.jpg。

通信の範囲：直接/demo/admin訪問からCRUD・初期化・再読込終了まで、ループバックの記録APIへの要求は[]。その後通常の/へ移動すると、過去の架空セッションの更新がダミー/auth/v1/tokenへ1件送られ拒否された。通常ページのAuth通信とデモの0件を混同しない。サーバーはパス/メソッドだけを記録し、実Auth/DBへ接続しない。実メール/本人Android・PC認証は未確認のまま。ブラウザ操作で1回locatorの反映待ちが期限超過したが、最新DOMで編集状態と値を確認して続行し、編集は成功した。製品不具合と断定しない。

未実施：Supabaseの追加問い合わせ/書込、緊急停止・復旧試験、本番変更、mainマージ。既存の実CRUD/RLS証拠を再利用。公開stagingの最新デモ/CIはpush後に確認する。メールの日本語化・差出人ブランド化は低優先。READMEは既存保存場所と既存PRを維持する。


2026-10-19最終保存：恒久資料8399cdf、管理デモbe683afを同じアプリPR #3へpush。be683afのPR CI（39214651348）は成功。固定staging/demo/adminの390pxでサンプル追加/編集/削除/初期化を実ブラウザ確認、横幅390=scrollWidth390。提出用READMEは元の場所・既存PR #3で3fc3544へ更新し読み戻し全文一致。mainは未マージ。検証用3100/54321は今回のプロセスだけ停止しLISTENなしを確認。HANDOFFを未commit途中状態から完了時の再開点へ更新。本人の実メール/Android・PC認証は未確認のまま保持する。
