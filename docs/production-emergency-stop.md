# 本番questions 緊急停止の実施記録

実施日：2026-10-15（日本時間）。ユーザーから docs/sql/questions-emergency-stop.sql のみ本番実行を明示承認。

## 実施

- Vercel本番用接続先と、前回照合したSupabase codestepプロジェクトを実行直前に再照合。一致を確認。値やキーは表示していない。
- ファイルを再読取し、承認対象のSQL内容と完全一致を確認。
- 実行直前はRLS有効、既存7ポリシー、APIロールにBYPASSRLS/継承なし、所有者postgres。2件の内容をハッシュで控えた（本文は出力しない）。
- 承認されたSQLだけを1回、BEGIN/COMMIT内で実行。エラーなし。その後に別の読み取り専用トランザクションで確認。

## 確認結果

| 項目 | 結果 |
| --- | --- |
| anon/authenticatedのSELECT | 両方true |
| INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER/MAINTAIN | 両方すべてfalse |
| 列単位INSERT/UPDATE/REFERENCES | 全列false |
| publicスキーマUSAGE | 維持 |
| RLS | 有効のまま |
| ポリシー | 7件とも実行前と同一 |
| 既存データ | 2件。全列を含む内容ハッシュも実行前後一致 |
| anonロールによる実際のSELECT | 読み取り専用トランザクション内で2件取得を確認 |
| 匿名HTTPのHEAD要求 | Node標準HTTPSクライアントでHTTP 200、Content-Range 0-1/2。本文は取得・出力しない |

本番書き込みテストは行っていない。所有者/service_roleの管理操作は停止対象外。管理者を含む通常ブラウザからの問題作成・編集・削除は現在停止中。

危険なPermissiveポリシー自体は残っている。再開前に管理者限定RLSへの置き換えと検証が必要。単にauthenticatedへ権限を戻してはいけない。今回、管理者RLS、Auth、他テーブル、Vercel、環境変数、GitHubは変更していない。
