# questions RLS 適用・停止・復旧手順

状態：本番は緊急停止SQLだけ適用済み（production-emergency-stop.md）。本番管理者RLS・Auth/制約変更は未承認。stagingは初期構築・実API41項目・停止/限定復旧が成功。本番旧7件からの切替試験は別途未完了。docs/sqlは自動マイグレーションではない。

公開全体の依存関係・進捗ACL/UNIQUE案・PCでの判断は[release-readiness.md](./release-readiness.md)へ集約。questions以外の本番変更も未承認・未適用。

## 調査結果と対象

2026-10-15の緊急停止前の観測（現在の権限はSELECTのみ）：pg_class/pg_policiesでRLS有効・7件のPermissiveを確認。SELECTはAnyone can read questions、書き込みはDemo publicとAuthenticated users canのINSERT/UPDATE/DELETE計6件。全条件true。Restrictiveなし。

has_table_privilege/aclexplodeでanon/authenticatedのSELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER/MAINTAINを確認。PUBLIC直接のテーブル付与と列単位付与はなし。publicスキーマUSAGEあり、CREATEなし。APIロールにBYPASSRLS・所有権・他ロール所属はない。service_roleはRLSを迂回するため、フロントへ配置しない。

## 変更案のレビュー

- questions-admin-rls.sqlは既存7件の名前・ロール・操作・条件をロック取得後に照合。不一致なら全体を中断する。
- PUBLIC向けだけでなくauthenticated向けの広い許可も削除し、既存SELECTを維持する。PermissiveのORで抜け道が残らないようにする。
- ロール権限はSELECT、authenticatedの5列INSERT/UPDATE、DELETEだけに絞る。id・created_atの変更権限やTRUNCATE等を付けない。
- admin条件はauth.uidがあり、JWTのapp_metadata.codestep_adminがJSON boolean trueであること。UPDATEはUSING/WITH CHECKの両方を確認する。
- user_metadata・profilesの編集値では認可しない。認可用関数・新しいテーブルは作らない。
- UUIDデフォルトを使うので連番シーケンスの権限追加は不要。publicスキーマの権限や他テーブルは今回変更しない。
- タイムアウト、名前不一致、権限不足はトランザクション全体を失敗させる。再実行用の冪等スクリプトではない。適用済みならその状態を再監査する。
- これは静的レビュー。PostgreSQLでの構文・実動作の成功とは区別する。

## 実行前の必須条件

1. 本番と検証のプロジェクト識別子・接続先を人間と照合する。DB名postgresや別Vercel URLだけでは分離の証明にならない。
2. 現在のローカル.env.localは本番を指す。開発ブラウザ/書き込み試験でそのまま使わない。新しい外部リソースは承認後に作る。
3. 本番データを無断で検証へ複製しない。検証は架空アカウント・架空問題を使う。
4. questions CSVの鮮度・ID・復元可能性、およびポリシー/権限/制約の復旧記録を確認する。CSVだけでは設定を戻せない。
5. 最初の管理者の本人確認とユーザーID指定を人間が行う。profilesの1件を管理者と推測しない。
6. 信頼できる管理環境からAuth Admin API updateUserByIdで既存app_metadataを保持しつつcodestep_admin:trueを付ける。user_metadataやJWTトップレベルroleを書き換えない。秘密キーをコードへ追加しない。
7. 管理者本人の再ログイン等でJWTを更新する。JWTは表示・保存しない。欠落/false/文字列trueは拒否する。
8. test-plan.mdの実DB試験、緊急停止・復旧の結果を確認し、未検証範囲を本番承認資料へ載せる。旧7件再現試験の今回省略については末尾の最新方針を優先する。

## 本番適用（すべて別途承認後）

検証済み画面修正の反映 → 本番管理者のフラグ付与とJWT更新 → 最新の読取監査とバックアップ確認 → questions-admin-rls.sqlを所有者相当の接続で一括適用 → ポリシー/実効権限と公開閲覧を確認 → 承認された架空データだけで管理CRUDを確認。

UIだけ先に反映しても、本番RLSを直すまでは直接API経由の書き込みを防げない。準備が長引く場合は、承認を得て先に緊急停止する（管理者の編集も一時停止）。未公開の学習画面はDB出題へ移行済み。停止SQLはquestionsのSELECTを維持するため、公開時も出題を継続する設計。画面確認は必要。

適用後の期待：SELECTポリシー1件＋管理者I/U/Dの3件。anonはSELECTのみ。authenticatedはSELECT/DELETEと5列のINSERT/UPDATEを保有し、RLSで管理者だけ変更可能。テーブル単位のINSERT/UPDATEがfalseでも、5列の権限がtrueなら想定どおり。禁止列・TRUNCATE等はfalse。

## 緊急停止

管理者が操作不可、一般ユーザーが変更可能、または権限状態が不明なら、承認済みquestions-emergency-stop.sqlを適用し、通常のブラウザ用ロールをSELECTだけにする。管理用service_role・所有者の権限は止めない。

本体の適用が失敗すると旧設定が残り得る。ロールバック成功を安全化成功と混同せず、停止処理のCOMMITと実効権限を確認する。停止自体がタイムアウトした場合も停止済みと扱わない。

## 安全な復旧

1. 書き込み停止を維持し、原因を調べる。読み取りまで止まった場合は必要なSELECTだけ復旧する。
2. 旧6ポリシーが残っている場合は、再監査して本体の置き換えを完了する。
3. 管理者限定3ポリシーの定義・対象ロールと、既存SELECTのみであることを確認する。管理者フラグとJWTも確認する。
4. 別途承認後、次の限定権限だけを戻す。本体SQLを適用済みのDBへ、そのまま再実行しない。

```sql
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
GRANT INSERT (title, question_text, answer_code, explanation, category)
  ON TABLE public.questions TO authenticated;
GRANT UPDATE (title, question_text, answer_code, explanation, category)
  ON TABLE public.questions TO authenticated;
GRANT DELETE ON TABLE public.questions TO authenticated;
COMMIT;
```

5. 権限・拒否・CRUD・件数を再確認して停止解除とする。危険な許可への差し戻し、RLS無効化はしない。

## 管理者解除とJWT

通常解除は信頼できる管理環境でフラグをfalseにし、新JWTで拒否を確認する。古いアクセストークンは更新/有効期限まで管理者情報を持ち得る。UIのログアウトや手動更新だけで他端末の旧JWTを失効させたと断定しない。緊急時は先にquestionsの全ブラウザ書き込みを止める。JWT有効期間と既存Authフックの設定は未確認。

## 緊急停止後からの切り替え確認

現在は既存7ポリシーのままACLで書き込みを止めている。questions-admin-rls.sqlの7件照合は引き続き一致する構成。新規ポリシー/権限差異があれば停止する。管理者JWT準備と検証を終えてから、危険な6件の削除と限定GRANTを同じトランザクションで行う。復旧も停止状態を起点とし、以前の全員許可を復活させない。

学習者の進捗保存はuser_progressへの本人限定操作であり、questionsの変更権限を戻す理由にはしない。現状のprofiles/user_progressに残る不要権限と一意制約の不足は、追加本番変更として別途レビュー・承認する。

## stagingの最新状態

専用ezjzgebehancbxqpganyに修正版staging-bootstrap.sqlを適用成功。3テーブル/16列、profiles.created_at、既存FK2件NO ACTIONと進捗ペアUNIQUEを確認。初期構築は管理者限定4ポリシーを直接作り、広い旧ポリシーを再現しない。bootstrapを再適用しない。

実JWT/Data APIで匿名/一般の拒否、管理者CRUD、本人進捗保存/復元/同時保存、禁止列/0件/FKを検証。原本の緊急停止SQLをstagingに適用しSELECT継続と全員I/U/D拒否を確認。安全な4ポリシーの指紋不変を確認して限定GRANTだけ復旧し、匿名/一般拒否・管理者CRUD再開が成功した。

別試験として本番旧7→4を再現するprepare-staging-rls-rehearsal.mjsを用意。1TX内で排他ロック/テーブル・列の書込停止→旧7件再現→本番用SQL本体/第8件拒否ガード→データ不変と4件確認→安全状態だけCOMMITする。元SQLの処理をコピー改変せず読み込む。2回の実行要求はInvalid or expired requestStateとなり、履歴0・4ポリシー/広域許可0を読取確認した。成功扱いせず計画を維持。本番切替SQLの実行条件はまだ満たしていない。別経路で回避しない。

適用済み初期SQLは原本から直前生成しreview.jsonと照合した。ハッシュは471571d743080915ecda2b0dae50f6c88754c62262d02eaaa4a82ea159ceb7b1。過去のSQLストアや古い承認カードは再利用しない。停止/復旧要求も対象staging IDに固定し、復旧は検証済みポリシー指紋を必須にする。残る画面試験はMacの手動解除後に再開。test-plan.md末尾参照。

## 2026-10-15 破壊的SQL警告のレビュー（適用承認待ち）

対象は初期化SQLではなく、`node scripts/prepare-staging-rls-rehearsal.mjs cutover`で生成する旧7件→管理者限定4件の切替試験。get_projectでezjzgebehancbxqpganyの名前codestep-staging/ACTIVE_HEALTHYを再確認した。今回はSELECTを含むSQLを一切実行していない。DBの4ポリシー・問題3件・進捗3件等は直前作業の読取結果であり、今回再取得した値ではない。

- DROP POLICYは全てpublic.questions上の計10件：現在の管理者3件、拒否ガード試験専用1件、試験中に再現した旧書込6件。現在の管理者3件は同じTX内で再作成する。既存SELECTポリシーは削除しない。
- DELETE FROM、TRUNCATE実行、通常テーブル/スキーマ/列のDROP、既存行のINSERT/UPDATEは含まない。FOR DELETEやGRANT DELETEはポリシー/権限の指定であり行削除ではない。
- cutover_beforeはstagingのquestionsだけを比較用に読む一時テーブル。ON COMMIT DROPでこの一時コピーだけを自動削除する。本番データのコピーや既存テーブルの削除はしない。
- 権限のREVOKE/限定GRANT、ポリシーのDROP/CREATEは実際の設定変更。1トランザクションと排他ロック内でだけ旧ポリシーを再現し、安全な最終状態だけCOMMITする。RLSを無効化しない。ロック中はstagingの閲覧も一時的に待機し得る。
- 件数だけの確認を強化し、開始/終了双方で安全な4件の定義指紋1da0740667b5fb3f57013e5ff673d898との一致を必須にした。終了時には全questions行の前後一致も検査。不一致/タイムアウト等はCOMMIT前に中断して開始状態へロールバックする（意図した第8件拒否だけは例外を捕捉して検証）。
- 呼出先project_idは生成器でstagingに固定。ただしSQL自身がSupabaseプロジェクトIDを照合するわけではない。承認後も直前に対象ID・SQLハッシュ・現在のRLS/ACL/件数を読取確認し、不一致なら実行しない。本番/TodoAppへの送信は禁止。
- 通常エラーならROLLBACKを確認。通信断/COMMIT結果不明は成功・失敗のどちらとも断定せず、同じstagingの履歴/RLS/ACL/行の不変を読取確認する。盲目的な再実行や追加変更をしない。COMMIT済みの変更を自動で巻き戻せるとは扱わない。旧広域許可の復元は復旧策にしない。

今回生成した適用queryのSHA-256：186e456a5f5851c52ca8fcf87d11384bf6dffe1fc29f22fe9aa6894315a0abf4。本番用原本SQLのSHA-256とは別。承認後は再生成したqueryがこの値と一致することを確認する。生成/静的回帰5件成功、実DBでの切替試験は引き続き未実施。承認対象はこのstaging切替試験だけで、本番変更・テスト行の削除等を含まない。

### 最新：承認後の1回の要求結果

2026-10-15、人間の明示承認後に対象ID/名前・全文ハッシュと現在の安全なRLS/ACLを直前照合してapply_migrationを1回呼出したが、Invalid or expired requestState。再送/別経路変更なし。直後のREAD ONLY監査で、直前と全項目一致（4ポリシー全文/指紋、RLS有効、テーブル列ACL、API属性/所属、3テーブルの件数・全行ハッシュ、切替履歴0）。問題3/profile2/progress3を保持している。処理が実行された/ロールバックしたとは断定せず、現在状態が不変であることだけを記録する。ツール経路の問題解消と再開指示までは適用要求を再送しない。詳細はtest-plan.md末尾。

## 最新方針：警告の原因・必要性を確認して代替検証へ移る

2026-10-15、旧7件再現リハーサルは今回の開発工程から省略（実DB未検証のまま）。最終RLS・CRUD・独立の停止/復旧は検証済みであり、この試験の再送を他の作業の必須条件にしない。移行固有のDO処理・途中失敗時の複合ロールバック/ロック競合は未検証として本番承認時に提示する。静的検査53件のうち関連6件を含めて成功しても、本番移行SQLを実行済み/実DB検証済みとは表現しない。test-plan.md末尾の対応表を参照。

### 診断の根拠と限界

- [Supabase公式の確認ダイアログ説明](https://supabase.com/docs/guides/troubleshooting/sql-confirmations-do-not-appear-in-your-mcp-client-sQf7Kp)は、破壊的SQLの検知時にMCPが確認を求めること、警告の有無だけで安全性を判断しないことを説明している。
- [公式リポジトリの検知実装](https://github.com/supabase/mcp/blob/main/packages/mcp-server-supabase/src/tools/destructive-sql.ts)を参照。公開main時点では文頭のDROPを広く検知するため、このSQLのDROP POLICYも該当する。データ削除があるという意味ではない。ただし接続サービスの実配備バージョンは未確認であり、今回の警告発生元をこのコードと断定しない。
- [確認状態の実装](https://github.com/supabase/mcp/blob/main/packages/mcp-server-supabase/src/tools/confirmation.ts)では署名付きrequestStateにtool/project_id/name/queryHashを結び付ける設計が確認できる。Invalid or expired requestStateは確認状態の検証周辺の問題と推定するが、期限切れ・署名・仲介/クライアントのどこが原因かはこの応答だけでは特定できない。チャットの再承認やSQLの書き換えで直るという根拠はない。SQLの危険性判定、人間の拒否、DBの構文エラーと混同しない。
- 今回は公式資料とローカル原本だけを確認し、SQL送信/設定変更/接続再作成はしていない。警告を出さないためのSQL隠蔽・分割、skip_elicitations等の変更、別ツール経由の適用はしない。

### 次に変更を必要とする場合

まず必要性と未検証リスクを再評価する。必要なら対象ID・全文ハッシュ・削除対象・データ保護・停止/復旧・前後確認を一括照合する。同じ対象/本文/影響に既存承認がある場合はチャット承認を重複要求しない。ツール自体の許可が必要な場合に限り、影響を明示して1回求める。同じ警告/拒否/状態エラーの再発後は追加変更せず読取確認と代替検証へ移る。再送には原因解消の根拠が必要であり、承認の繰り返しだけを根拠にしない。
