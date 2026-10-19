# 設計ドキュメント

- [提出用ポートフォリオREADME](https://github.com/bonbabo108/codestep-portfolio)
- [開発手順・機能ガイド](./implementation-guide.md)

- [最終設計・機能一覧・全16列ER図](./final-design.md)
- [評価基準と実装・画面・テストの対応](./evaluation-evidence.md)
- [メール認証の確認と設定変更案](./auth-release-checklist.md)

以下は過去の設計・試験記録を含みます。最新の仕様は最終設計を優先します。

- [帰宅後の公開判断・承認と反映順序](./release-readiness.md)
- [ワイヤーフレーム](./wireframe.png)
- [ER図](./er-diagram.png)

画像は変更前の原本です。最新の権限・Auth・画面遷移との差分は以下を併読してください。

- [全5シート照合・変更案・ER/ワークフロー補足](./design-review.md)
- [プロジェクト共通コンテキスト](./project-context.md)
- [講座範囲と提出観点](./curriculum.md)
- [判断・変更履歴](./decisions.md)
- [テスト仕様と結果](./test-plan.md)
- [RLS適用・停止・復旧](./rls-runbook.md)
- [メンター説明・確認5問](./mentor-notes.md)

- [本番緊急停止の実施・検証記録](./production-emergency-stop.md)
- [staging初期化SQL（staging適用済み・本番実行禁止）](./sql/staging-bootstrap.sql)
- [本人保存用の最小ACL案（未適用）](./sql/progress-release-proposal.sql) / [一意制約案（未適用・別TX）](./sql/progress-unique-proposal.sql)
- [最新ログイン画面](./screenshots/login-staging.jpg) / [スマートフォン幅](./screenshots/login-mobile-staging.jpg)
- [実DB保存成功](./screenshots/learning-saved-staging.jpg) / [再ログイン復元](./screenshots/learning-restored-staging.jpg) / [スマホ学習](./screenshots/learning-mobile-staging.jpg) / [管理者の編集](./screenshots/admin-staging.jpg)

最新状態：stagingの初期管理者RLS構築・本人保存・停止/限定復旧は実DB成功。本番旧7ポリシーからの切替試験は別途未完了。SQL案の「未適用」は本番についての状態と、過去の準備記録を区別する。
