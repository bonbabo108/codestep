# CodeStep 共通コンテキスト

更新日：2026-10-16。ブランチcodex/admin-rls-portfolio。現在地だけをまとめ、過去の経緯はdecisions.mdを参照する。

## 目的と範囲

講座最終課題・転職用ポートフォリオ。要件/設計/実装/テスト/READMEを整合させ、本人が説明できること。CodeStepは問題・回答・本人進捗を対象にする。OneCodeの高度な構想は追加しない。

## 本番・安全境界

- 本番はxdnmlfoblqdygsnhkxxp。前フェーズの限定承認でquestions-emergency-stop.sqlだけ適用済み。APIロールはSELECTのみ、RLS/旧7ポリシー/既存2件を維持した。今回の追加本番変更はない。
- 本番の管理者フラグ、管理者RLS、制約、push、Vercel公開は未承認。旧Permissiveを残して権限だけ戻さない。
- 公開判断の入口はdocs/release-readiness.md。profiles/progressの本人6ポリシーを維持した最小ACL案と別TXのUNIQUE案をdocs/sqlへ準備済み（未適用・原本の実DB実行は未検証）。2026-10-15の追加本番READ ONLY観測ではprofile1/progress0/重複0、両表のAPIロールに不要なTRUNCATE等あり。通常のRLS対象外なので本番前の修正対象。
- .env.localは本番接続のまま。編集しない。検証起動はscripts/staging-runtime.mjsで公開用URL/キーをプロセス上書きする。サーバーキーは子プロセス/ブラウザへ渡さない。
- stagingはezjzgebehancbxqpgany（codestep-staging、東京、Free）。本番/TodoAppとは別プロジェクト。新規課金・本番データコピーなし。
- 16日にユーザーがPC確認：VercelのProduction Branchはmain、他の未割当ブランチはPreview対象。APIでPreview限定2変数を照合し、stagingのルートURL（/rest/v1/なし）・有効なstaging公開キーとの完全一致、ブランチ固有上書きなしを確認。秘密値は出力/保存していない。必要ファイルのローカルコミットは許可済み、作業ブランチpush/Preview作成は明示承認待ち。本番変更・main反映は引き続き禁止。release-readiness.md冒頭参照。

## stagingの現在地

- 初期化SQLを適用成功。SHA-256は471571d743080915ecda2b0dae50f6c88754c62262d02eaaa4a82ea159ceb7b1。既に3テーブルがあるのでbootstrapを再適用しない。
- profilesはid/name/created_at。全16列・既存FK2件は本番に一致し、FKは更新/削除ともNO ACTION。AuthへのFK/CASCADE/追加NOT NULL/DB時刻トリガーなし。構造上の追加はprogressのUNIQUE(user_id,question_id)だけ。
- 全3テーブルRLS有効。questionsは公開SELECT＋管理者I/U/Dの4ポリシー。profiles/progressは本人限定。anonは問題SELECTのみ、authenticatedは必要列だけ書込権限を持ちRLSで制限。TRUNCATE等と禁止列の権限なし。
- 架空Auth4件（フラグ欠落の一般ユーザーを追加）・架空問題3件を使用。本人進捗3件、profile2件、重複0件を確認。使い捨ての画面試験用問題は固定名で後片付けした。試験管理者は最後にfalseへ解除済み。
- 緊急停止→ポリシー指紋確認→管理者用限定GRANTで復旧し、匿名/一般拒否と管理者CRUD再開を実API確認。危険な旧許可に戻していない。
- 本番旧7件からの切替試験は実DB未検証のまま、今回の開発工程から省略して再送を保留する。管理者RLS/CRUD/停止・復旧は別に実DB成功済みで、旧7件を再現する試験をローカル作業の必須条件にしない。SQL原本/生成器と承認ハッシュは変更せず、静的検査を補強した。本番の移行SQL実行・複合ロールバック等の未検証リスクは本番承認資料へ明示する（test-plan.md末尾）。
- 過去3回の切替要求はInvalid or expired requestState。最後の直前直後読取では安全な4ポリシー/ACL/3テーブル全行ハッシュが一致し履歴0。今回の新しいDB観測ではない。公開MCP実装の検知条件にDROP POLICYも該当するが、エラーの発生層・原因解消は未確認。警告やチャット承認だけを根拠に再送しない。AGENTS.mdのSQL警告対応を適用する。

## ローカル実装（未公開）

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
- npm test計56件・lint/typecheck・ダミー接続Webpack本番ビルドがクリーンな一時コピーでも成功。Node24/npm11/package-lock.jsonへ統一し旧pnpmロックを除去、既存依存を更新せずnpm ci --ignore-scripts成功。Vercel上と通常インストールスクリプトは未検証。buildとtscは並列化しない。
- Week9全5シートの既存照合を再利用。外部シート未編集、画像原本保持。design-review.md/test-plan.md/mentor-notes.mdを更新。
- 一時資格情報は/tmp/codestep-staging-session.json（0600、Git外）。値を表示/コミットしない。消失時は安全に再準備し、架空ユーザーをむやみに再作成しない。

再開はtest-plan.mdの最新節。初期構築SQLは毎回ファイルとreview.jsonを照合する仕組みだが、現在は適用済み。旧ストアの本文や古い承認カードを再利用しない。
