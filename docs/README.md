# 開発用資料一覧

- [提出用ポートフォリオREADME](https://github.com/bonbabo108/codestep-portfolio)
- [開発手順・機能ガイド](./implementation-guide.md)

- [設計補足（開発用参考資料）](./final-design.md)
- [評価基準と実装・画面・テストの対応](./evaluation-evidence.md)
- [メール認証の確認と設定変更案](./auth-release-checklist.md)

このフォルダには、技術的な補足と開発中の判断・検証履歴を保管しています。提出用の要件定義・設計書は[Week 9のGoogleスプレッドシート](https://docs.google.com/spreadsheets/d/1l6_wH24I4Cq1jhvHi1VtDjarj5fr8KK6jS0g7HTAtds/edit)を参照してください。

- [帰宅後の公開判断・承認と反映順序](./release-readiness.md)

- [全5シート照合・変更案・ER/ワークフロー補足](./design-review.md)
- [プロジェクト共通コンテキスト](./project-context.md)
- [講座範囲と提出観点](./curriculum.md)
- [判断・変更履歴](./decisions.md)
- [テスト仕様と結果](./test-plan.md)
- [RLS適用・停止・復旧](./rls-runbook.md)
- [メンター説明・確認5問](./mentor-notes.md)

- [本番緊急停止の実施・検証記録](./production-emergency-stop.md)
- [staging初期化SQL（staging適用済み・本番実行禁止）](./sql/staging-bootstrap.sql)
- [本人保存用の最小ACL案（本番適用済み）](./sql/progress-release-proposal.sql) / [一意制約案（本番適用済み・別TX）](./sql/progress-unique-proposal.sql)
- [最新ログイン画面](./screenshots/login-staging.jpg) / [スマートフォン幅](./screenshots/login-mobile-staging.jpg)
- [実DB保存成功](./screenshots/learning-saved-staging.jpg) / [再ログイン復元](./screenshots/learning-restored-staging.jpg) / [スマホ学習](./screenshots/learning-mobile-staging.jpg) / [管理者の編集](./screenshots/admin-staging.jpg)

**公開状況：** アプリ本体のPR #3は`main`へマージ済みで、本番公開されています。本人進捗の権限制御・一意制約、管理者用RLS・削除RPCは適用済み。登録・ログイン、学習進捗の保存と端末間復元、管理者CRUDは本人が本番で動作確認済みです。メール所有確認は未実装（Confirm email OFF）です。公開状況は[提出用ポートフォリオ](https://github.com/bonbabo108/codestep-portfolio)にまとめています。開発時点の詳細な履歴は[HANDOFF](../HANDOFF.md)を参照。
