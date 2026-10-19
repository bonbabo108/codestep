# CodeStep 開発・機能ガイド

提出用の説明は[CodeStepポートフォリオREADME](https://github.com/bonbabo108/codestep-portfolio)へ集約しています。本書はアプリ本体の開発手順・実装仕様です。

**一問ずつ、理解を積み重ねる。** Web開発の初学者がコードを入力し、正誤判定と解説で理解を深める学習アプリです。仕事の合間でも準備や検索の負担を減らし、ログイン後は正解した進捗を保存して再開できます。

[体験デモ](https://codestep-two.vercel.app/demo) · [学習画面](https://codestep-two.vercel.app) · [評価基準と証拠](./evaluation-evidence.md) · [設計・ER図](./final-design.md)

> 2026-10-19：このブランチは最終仕上げ中です。新しいデモ・認証修正はmain/本番未反映で、上の本番 `/demo` は反映後に利用できます。本番の問題作成・編集・削除は停止中です。動作確認先・最新Preview・未完了事項は[公開状況](./release-readiness.md)冒頭を参照してください。

![学習画面（既存stagingでの保存・復元検証時）](./screenshots/learning-restored-staging.jpg)

## できること

- **登録不要の体験**：`/demo` で架空3問の回答・解説・問題管理を試せます。変更は画面を開いている間だけ有効です。
- **学習**：DBのHTML/CSS/JavaScript問題に回答し、その場で解説を確認。コードは実行せず、前後の空白を除いた文字列一致で判定します。
- **本人の進捗**：メールで登録・ログインした利用者の正解コードを保存し、再ログイン後に復元します。ゲストは回答のみ利用できます。
- **管理者CRUD**：`/admin/login` から管理画面へ進み、問題の作成・一覧・編集・削除。履歴のある問題の削除は関連進捗を含めて明示確認します。

デモは実Auth・DB保存・RLSの検証とは別です。stagingでの実CRUD・本人保存・一般利用者の拒否は[既存テスト記録](./test-plan.md)にまとめています。メール配信と実メールからの復帰は未確認で、URL設定の修正も必要です。

## 使い方

1. まず体験デモを開き、「解説と正解を見る」→回答入力→「回答する」。問題管理も自由に試せます。「最初に戻す」で初期化します。
2. 実際の学習は `/` から開始。進捗を残す場合は `/login` で登録し、確認メールのリンクを開きます。
3. 確認メールが期限切れなら `/login` でメールアドレスを入力し、再送します。別ブラウザで確認した場合、元の画面でメールとパスワードを使ってログインできます。
4. 問題管理は権限を付与された管理者のみ利用できます。公開の共通管理者パスワードはありません。

## 工夫した点

- 認証はSupabase Auth、認可はPostgreSQLのRLSと列権限。管理者判定は `app_metadata.codestep_admin === true`。利用者が編集できるuser_metadataは使いません。
- 保存・削除で返却行と対象IDを確認し、0件を成功扱いしません。連打を防ぎ、応答が不明な書込を自動再送しません。
- 本人・問題ペアの同時保存競合を処理します。ペア一意制約はstagingのみ適用済みで、本番の重複防止は未保証です。
- 体験デモに実管理者権限を渡さず、通常画面と独立したメモリ内の架空データで操作できます。

## 技術・構成

| 技術 | 役割 |
| --- | --- |
| Next.js 16 / React 19 / TypeScript | App Router、フォーム、セッション別表示、型検査 |
| Tailwind CSS / 共通UI | PC・スマートフォン対応、共通ボタン、ヘッダー・ナビ・フッター |
| Supabase Auth / PostgreSQL | メール認証、セッション、問題・進捗保存、FK・RLS・列権限 |
| GitHub Actions / ESLint | push・PRのlint、型検査、テスト、ダミー接続ビルド |
| Vercel | Git連携のPreview、main更新に連動するProductionデプロイ |

```text
app/                 学習・ログイン・管理・体験デモ
components/          共通フォーム・セッション・ヘッダー・表示枠
lib/                 認証分岐・問題CRUD・本人進捗
scripts/             staging接続ガード・検証補助（通常起動では自動実行しない）
tests/               単体・SDK通信モック・SQL原本の静的検査
docs/                設計、評価証拠、テスト結果、公開判断、履歴
```

ブラウザ → Supabase Auth/JWT付きData API → PostgreSQLの権限/RLSという構成です。独自のパスワード保存や生成AI APIはありません。ライブエディタ・音声・OAuthは未実装です。

## ローカル起動・検証

Node.js 24系、npm 11系を使用します。

```sh
npm ci --ignore-scripts --no-audit --no-fund
cp .env.example .env.local
# .env.localのURLと公開キーを、自分の検証用Supabaseの値へ変更する
npm run dev
```

メール確認にはSupabaseのURL Configurationも必要です。Site URLには公開するサイトのHTTPS URL、Redirect URLsにはその `/login` を登録します。[認証の確認結果と変更案](./auth-release-checklist.md)を参照してください。既存プロジェクトの `.env.local` は本番用なので、検証時にそのまま使わないでください。秘密キー・service_roleはブラウザへ渡しません。

DBの新規構築・SQL適用は通常起動の一部ではありません。`docs/sql` のSQLは対象や承認条件が異なるため、一括実行しないでください。

```sh
npm test
npm run lint
npm run typecheck
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=local-test-placeholder NEXT_TELEMETRY_DISABLED=1 npm run build -- --webpack
```

通常の `npm test` は実DBや外部ネットワークへ接続しません。CIもダミー接続でビルドします。実DB検証とモック、過去の成功と今回の確認は分けて記録します。

## 設計・改善・検証の証拠

- [最終設計・全16列のER図・機能一覧・画面遷移](./final-design.md)
- [評価基準ごとの実装・画面・テストと未完了項目](./evaluation-evidence.md)
- [テスト結果](./test-plan.md) / [改善と判断履歴](./decisions.md)
- [設計シートとの差分・修正提案](./design-review.md) / [資料一覧](./README.md)
- [メンターへの説明と想定質問](./mentor-notes.md) / [公開判断](./release-readiness.md)

既存ER・画面画像は原本を保持し、現仕様との差分はMarkdownで補足しています。READMEはUTF-8で保存します。

## 現在の制約

本番DBの管理者RLS・削除RPC・進捗一意制約等は未反映です。Productionへの反映は別途承認後に行います。緊急停止・復旧試験は一部未検証のまま終了し、今回追加実施しません。最新のローカル検証結果とCI/PRは公開状況・評価証拠を参照してください。

Codexを調査・実装・レビュー・テスト補助に使用しました。制作者が認証と認可、RLS、競合処理、未検証事項を説明できることを提出条件としています。
