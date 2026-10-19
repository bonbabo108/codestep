# CodeStep ポートフォリオ

**最終仕上げの状態（2026-10-19）：** [アプリのPR #3](https://github.com/bonbabo108/codestep/pull/3)に認証修正・安全な体験デモ・管理CRUDと本人進捗・最終設計・CIをまとめています。Productionには未反映です。

[登録不要の体験デモ（非本番Preview）](https://codestep-git-codex-admin-rls-portfolio-touya1896-7818s-projects.vercel.app/demo) · [評価項目と証拠](https://github.com/bonbabo108/codestep/blob/codex/admin-rls-portfolio/docs/evaluation-evidence.md) · [最終設計・ER図](https://github.com/bonbabo108/codestep/blob/codex/admin-rls-portfolio/docs/final-design.md)

上記の固定stagingドメイン1件はVercelアカウント不要です。他のPreviewは保護を維持しています。体験デモは架空データのみを使い、画面を閉じると変更が消えます。実Auth・DB保存・RLSの証明とは区別しています。

## アプリ概要

CodeStepは、プログラミング初学者が短いコーディング問題に回答し、正誤判定と解説を通して学べるWebアプリです。学習者の正解・進捗を保存・復元する仕組みや、管理者による問題管理機能を備えています。

**公開状況について：** 下記のProduction URLは旧版（`main`）です。作業ブランチで実装・staging検証した最新の管理者権限制御、本人の進捗保存・復元、学習履歴に関連する問題削除などは、Productionにはまだ反映していません。最新機能の完成・公開実績と混同しないでください。

## サイトイメージ

![登録不要の体験デモ（2026-10-19ローカル実画面）](https://raw.githubusercontent.com/bonbabo108/codestep/53a5d4360e7c7c22a98997a9fc6d083818b7397c/docs/screenshots/final-20261019/demo-desktop.jpg)

[スマートフォン幅の画面](https://raw.githubusercontent.com/bonbabo108/codestep/53a5d4360e7c7c22a98997a9fc6d083818b7397c/docs/screenshots/final-20261019/demo-mobile.jpg) / [以前の学習画面原本](./docs/app-learning.png)。画像は実メール認証や本番CRUDの成功証跡ではありません。

## サイトURL

- [公開アプリ（Production・旧版）](https://codestep-two.vercel.app)
- [最新実装の作業ブランチ](https://github.com/bonbabo108/codestep/tree/codex/admin-rls-portfolio)（最新の非本番版。一般公開用URLではありません）

## 使用技術

- フロントエンド：Next.js（App Router）、React、TypeScript、Tailwind CSS
- 認証・データベース：Supabase Auth、PostgreSQL、RLS
- デプロイ：Vercel
- バージョン管理：Git、GitHub
- テスト・デバッグ：Chrome DevTools（Consoleの確認）、単体・モック・staging実DB/APIでの検証

- CI：GitHub ActionsでESLint・TypeScript・62件のテスト・ダミー接続ビルドを自動実行。[成功したpushワークフロー](https://github.com/bonbabo108/codestep/actions/runs/39192624505)（コミット `53a5d43`）。PRの最新CIは[PR #3](https://github.com/bonbabo108/codestep/pull/3)を参照。
- CD：作業ブランチのpushでVercel Previewを自動更新。main更新でProductionへ連携するため、本番条件が揃うまでアプリのマージを保留しています。

## 設計ドキュメント

- [Week9 要件定義・設計スプレッドシート](https://docs.google.com/spreadsheets/d/1l6_wH24I4Cq1jhvHi1VtDjarj5fr8KK6jS0g7HTAtds/edit)
- [ワイヤーフレーム](./docs/wireframe.png)
- [ER図](./docs/er-diagram.png)

- [最終設計：目的・構成・機能一覧・画面遷移・全16列のER図](https://github.com/bonbabo108/codestep/blob/codex/admin-rls-portfolio/docs/final-design.md)
- [評価基準と証拠の対応表](https://github.com/bonbabo108/codestep/blob/codex/admin-rls-portfolio/docs/evaluation-evidence.md)

設計画像の原本は保持しています。NULL可否、FKのNO ACTION、stagingだけの進捗一意制約、管理者認可、関連進捗を含む削除など、現実装との差分は最終設計を優先してください。外部シートは未編集です。

設計画像は [docsフォルダ](./docs) に格納しています。

## 機能一覧

**最新作業ブランチ・stagingで検証した主な機能（Productionへの反映前）**

- ユーザー登録・ログイン・ログアウト（Supabase Auth）
- データベースからの学習問題表示、解答入力、正誤判定、解説表示
- ログインした本人の正解・学習進捗の保存と復元
- 管理者専用ログイン入口・管理画面、一般ユーザーの管理操作制限
- 管理者による問題作成・一覧表示・編集・削除（関連する進捗がある問題の削除を含む）

※各機能の検証範囲と未検証項目は、[アプリ本体のテスト記録](https://github.com/bonbabo108/codestep/blob/codex/admin-rls-portfolio/docs/test-plan.md)を参照してください。

## 体験・使い方

1. 上の体験デモを開き、回答を入力して「回答する」→解説と正解を確認します。
2. 「問題管理を体験」で問題作成・編集・削除を試します。削除前に取消も選べます。「最初に戻す」で初期化できます。
3. 通常の学習画面では、ゲストは回答のみ、ログイン後は本人の正解進捗を保存・復元します。管理者は専用入口から問題を管理します。

判定は前後空白を除いた大小文字を区別する文字列一致です。入力コードは実行しません。共通管理者パスワードは公開しません。

## 改善と検証

| 改善 | 理由と確認 |
| --- | --- |
| メール確認の戻り先指定・期限切れ案内・再送 | スマートフォンでlocalhostへ戻る不具合を調査。両SupabaseのURL設定不備を読取で確認し、コード側を修正。実メール確認は設定承認後に実施 |
| 0件を成功扱いしない・二重操作を防ぐ | CRUD/本人保存で返却ID・行数を確認。通信不明時の無条件再送を避ける |
| 本人進捗・競合処理・管理者RLS | 他人の進捗参照/更新と一般ユーザーの問題変更を防ぐ。stagingの実検証結果を再利用 |
| 架空データの体験デモ | メンターが登録や実管理権限なしで学習・問題管理を確認できる。実Chromeで正誤/CRUD/取消/確定/初期化、390pxの横溢れなしを確認 |
| 共通フォーム・ロジック・表示枠の整理 | ログインを共通化し、通常画面のAuthとデモを分離。判定・入力検証は再利用 |

今回のローカル検証は `npm test` 65件、`npm run lint`、`npm run typecheck`、ダミーSupabase接続のWebpackビルドが成功。架空APIのブラウザ試験と既存staging実DB試験を区別しています。

[実装と起動・検証手順](https://github.com/bonbabo108/codestep/blob/codex/admin-rls-portfolio/docs/implementation-guide.md) / [改善の判断履歴](https://github.com/bonbabo108/codestep/blob/codex/admin-rls-portfolio/docs/decisions.md)

## テスト・修正の設計及び実施書

- [Week11 テスト設計＆実施書](https://docs.google.com/spreadsheets/d/1E865kqwo83lWGgH0s1bbIIAs0FKfpGfzHbQTKxKiDqQ/edit)
- [最新作業ブランチのテスト記録](https://github.com/bonbabo108/codestep/blob/codex/admin-rls-portfolio/docs/test-plan.md)

Week11シートにはv0プレビュー段階の確認結果と「未検証」の項目が残っています。別途実施したstaging実DB/API・認証・画面の検証結果を、同じ条件で実施したものと誤認しないよう区別しています。

## アプリの改善案

- [提出済みのWeek12改善案シート](https://docs.google.com/spreadsheets/d/1flOiRudAh9wCJgjQoD1CQQVqrHq9n_bBH-agpPvHmLQ/edit)

今後の改善構想として、AI利用時の情報漏洩・危険操作を学ぶ問題、段階的なヒント、問題・カテゴリ選択、達成率表示、AI作業前の簡易リスク確認チェックリストを挙げています。**これら5件は提案段階で、まだ実装していません。**

## プログラム格納場所

アプリ本体は別リポジトリで管理しています。

- [CodeStep：プログラム格納場所](./CodeStep/プログラム格納場所.md)
- [CodeStepアプリ本体のソースコード](https://github.com/bonbabo108/codestep)

## 残る公開条件・制約

- 読取時は両SupabaseのSite URLがlocalhost:3000、Redirect URLsは未登録でした。stagingだけは承認後に有効なブランチ固定Previewとその `/login` へ変更し、保存後の再読込と既定メールリンク・アプリ側戻り先の整合を確認しました。本番は未変更です。[対象と具体的な設定結果](https://github.com/bonbabo108/codestep/blob/codex/admin-rls-portfolio/docs/auth-release-checklist.md)を参照してください。PCと実スマートフォンでの新しい確認メール受信・ログインは、ユーザー本人の確認待ちです。
- 本番は問題書込停止中。管理者RLS・削除RPC・進捗ACL/一意制約・管理者指定の本番反映は未実施です。承認と公開前確認が揃うまでアプリPRのmainマージは保留します。
- OAuth、独立した外部サービス/生成AI API、画像・音声入力は未実装です。評価表の最高点の全条件を達成したとは説明しません。
- 緊急停止・復旧試験は一部未検証のまま終了し、今回は追加実施していません。

## 備考

### 活用した生成AIとその用途

- ChatGPT：要件・提出条件の整理、仕様の検討、READMEや課題資料の作成補助
- v0：初期プロトタイプと画面構成の作成・確認
- Codex：実装・SQLレビュー、修正案の作成、テスト・安全性検証、既存設計との照合
- Cline、GitHub Copilot等：過去の開発・ドキュメント作業での補助（実際の使用範囲に基づき必要に応じて見直す）

生成AIの出力をそのまま動作保証とはみなさず、検証内容と未検証項目を分けて記録しています。

### 検証・提出・公開の状況

- Week12の「DevToolsの確認」は、アプリとDevToolsの画面を含むスクリーンショットをWorX AIへ提出済みです。
- GitHub Actions（ESLint）は作業ブランチで実行・成功を確認済みです：[実行履歴](https://github.com/bonbabo108/codestep/actions/runs/39031564825)。WorX AIへの課題は、初回の証拠画像不足を修正して再提出済みです（再採点結果は未確認）。
- Productionへの最新機能反映、本番DB/Auth移行は未実施です。本番DBの権限変更・データ保全には個別の確認が必要です。
- このリポジトリはポートフォリオ提出用です。アプリ本体のコードは上記の別リポジトリで管理しています。

- [最新検証・公開準備記録](https://github.com/bonbabo108/codestep/blob/codex/admin-rls-portfolio/docs/release-readiness.md)
- アプリの説明と提出資料への入口は、このリポジトリのREADMEに集約しています。



2026-10-19：Androidの入力/新規メール確認の不具合を修正中。修正後の本人確認は未完了。URL設定・限定公開はstagingのみ反映済み。実メール確認の状態は[認証チェックリスト](https://github.com/bonbabo108/codestep/blob/codex/admin-rls-portfolio/docs/auth-release-checklist.md)を優先する。
