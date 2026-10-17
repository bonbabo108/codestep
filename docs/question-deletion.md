# 問題と関連進捗の削除（2026-10-17）

原因は画面の禁止条件ではなく、user_progress.question_idのFK（NO ACTION）。画面は問題だけをDELETEし、DBの23503を「学習履歴がある問題は削除できません。」へ変換していた。stagingの読み取りでFK、問題の管理者DELETE RLS、進捗の本人SELECT/INSERT/UPDATEのみのRLS・DELETE権限なしを確認。ブラウザから他人の進捗を個別削除する変更は採用しない。

## 変更案と承認範囲

- 対象はcodestep-staging（ezjzgebehancbxqpgany）だけ。原本は[SQL](./sql/questions-delete-with-progress.sql)。本番・Auth・既存FK/RLS/テーブルACLを変更しない。
- 新規codestep_privateスキーマと削除関数、publicのSECURITY INVOKERラッパーのみを単一トランザクションで追加。未知の既存オブジェクトがあれば適用を中止する。適用自体にデータの削除はない。DROP/TRUNCATE/テーブル変更なし。
- 関連進捗は他人の行を含むため、削除専用の内部関数に限ってSECURITY DEFINERを採用する。検索パスを空、対象テーブル/条件を固定し、auth.uid・JWT role・app_metadataのboolean trueを毎回検査。PUBLIC/anon/service_roleのEXECUTEを明示的に除去し、authenticatedだけに呼出権限を付与。一般ユーザーは内部の管理者検査で拒否される。既存の本人RLSは緩和しない。サービスキーはブラウザへ渡さない。
- 同じRPCの確認モード（既定false）は行の有無だけ返し、削除しない。問題行をFOR UPDATEでロックした削除モードでは、対象問題の進捗→問題の順に削除。失敗は例外として伝え、途中の削除も巻き戻す。確認後に進捗が追加されたら削除せず警告の再確認へ戻す。
- UIは既存Base UIのアプリ内AlertDialogで「いいえ」「はい、削除する」。履歴ありの場合は「この問題に紐づく学習進捗も削除され、元に戻せません」と表示。取得中/取得失敗/処理中は削除不可。キャンセルは確認モードの読み取りだけで、DB変更なし。通信結果不明を自動再送しない。

## 検証・復旧

使い捨て問題と、既存の架空学習者2名の試験用進捗だけを新規作成。履歴なし/あり、一般・匿名拒否、キャンセル相当の確認モード、警告後に履歴が追加された場合を実APIで検証する。例外後の原子性は、単一BEGIN/ROLLBACK内だけの試験トリガー（pg_tempの関数、試験IDだけを拒否）で問題DELETEを故意に失敗させ、先に消した進捗も戻ることを確認。試験トリガー/関数はROLLBACKで残さない。これもstagingの承認対象として明示する。

試験後は今回の問題ID/進捗IDだけを片付け、既存3テーブル全行とデモ管理者メタデータの不変を照合する。デモ管理者の権限は解除しない。結果不明なら追加変更・再実行をせず、関数/ACL/データ/試験トリガーの残存を読み取り確認する。

機能停止が必要なら新しいpublic/内部関数のauthenticated EXECUTEを撤回する案を別途レビューする。既存RLSを緩めたり広い書込み許可へ戻したりしない。移行の途中失敗はBEGIN内全体をROLLBACK。本番への適用や、公開後に消したデータの復元は今回の承認対象外。不可逆削除の前には必ずUIで確認する。

SQLの実適用・実DB結果、UI検証、承認ハッシュは判断履歴/テスト記録へ追記する。現Previewの旧コードはこのRPCを使わない。staging適用・ローカル検証後に、別途承認されたpushで新しいPreviewへ反映する。

## 今回の実施結果

ユーザー承認後、原本SHA-256 `e3f74f44bf41e304c4315e5347b1104dde50fe7f4dd93ebb6b183330acf68cd8` を再照合しstagingへ1回適用、成功。既存FK/RLS/テーブルACL/データ/Authメタデータの不変を前後照合した。問題/関連進捗の削除、取消、一般/匿名拒否、履歴追加時の再確認、削除途中の例外による巻き戻し、PC/390pxのアプリ内確認を実API・実staging接続のローカル本番ビルドで検証済み。単体16件/関連モックUI13項目/型/lint/ビルド成功。詳しい結果は[test-plan.md](./test-plan.md)末尾。

試験データを除去し、開始時4問題/3プロフィール/4進捗の全行完全一致、試験トリガー0、デモ管理者メタデータ不変を確認した。デモ管理者trueは保持。本番/他プロジェクト/課金/commit/push/Preview変更はない。ローカルソースは未コミットで、現Previewは旧削除処理のまま。次は必要差分のコミットと、明示承認後の作業ブランチ限定push/新Preview確認。

DDL後のSecurity Advisorに新しい関数の指摘はなく、Authの[漏えいパスワード保護](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)にWARN1件。今回はAuth設定変更を行わない。

設計根拠：[Supabaseの関数](https://supabase.com/docs/guides/database/functions)、[PostgreSQLの関数権限](https://www.postgresql.org/docs/17/sql-createfunction.html)、[行ロック](https://www.postgresql.org/docs/17/explicit-locking.html)。
