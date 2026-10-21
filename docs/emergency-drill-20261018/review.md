# CodeStep staging 緊急停止・復旧試験の承認用資料

## 2026-10-19 10:56 JST 承認済み4行の片付け完了・試験最終判定

**片付け成功。停止・復旧試験全体は一部成功。** codestep-staging（ezjzgebehancbxqpgany）をget_projectで直前確認。承認されたlive-cleanup-data-reviewed.sqlのSHA-256 cb183dcda4a43c5ca113034560cf1d72d726418e989425486ba777c32ecf84f1を原本から照合し、その本文だけを単一トランザクションで1回実行。SQL原本/stop/resumeは変更なし。通常のツール応答が成功し、別のREAD ONLY確認でも対象IDの残存0を確認した。以前の失敗SQLは再送していない。今回の成功は旧requestStateエラーの原因解明を意味しない。

- 削除：questions 2行、user_progress 1行、profiles 1行。記録済みID/試験ラベル/紐付け/件数は実行前に全一致、未記録の関連進捗0。SQL内でもFK・内部トリガー・ルール・継承・対象件数をDELETE前に再検査し、各DELETE後の件数を照合して確定した。
- 対象外の3表の全行は直前/直後の件数と照合値が完全一致。終了時はquestions3/profiles4/user_progress4。Authは10件のまま、ID/app_metadata照合値も一致。今回の試験用Auth2件と新規試験管理者のtrueフラグは承認条件どおり保持し、既存デモ管理者も変更しない。profiles→Authの削除連鎖はなく、試験プロフィール削除はAuth削除を意味しない。
- 権限ACLは安全な再開状態34359cdf23e85be0c1309b1280d24020を維持。RLS/ポリシー/公開・内部関数定義/所有者/列構成/ブラウザロール状態も直前直後で一致。本番アクセス、Auth・権限変更、アプリ変更、commit/push/デプロイなし。
- 以前の想定外増加（期待Auth8/profile4/progress4に対し実測10/5/5）の原因・作成主体は未確認。今回の片付けとは別の未解明事項であり、不明分は保持。元の試験開始時から全データが不変とは報告しない。
- 実測成功：新規2アカウントの通常ログイン、停止前の管理者INSERT/本人保存、原本stopによる権限撤回、原本resumeによる安全なACL復旧。停止観測時の他トランザクション0。権限検査はAPI動作の証明とは区別する。
- 未実施：停止中の実API閲覧・I/U/D拒否・RPC拒否・停止前JWT拒否・本人保存/復元、復旧後の管理者CRUD/一般拒否、意図的失敗時のロールバック。これらは想定外件数で中断したままで、今回再試験しない。停止前から動く処理を意図的に競合させる試験も未実施。
- 今回のSupabaseツール4回（対象識別1、READ ONLY2、削除1）。追加の業務承認要求0、削除要求1回・再試行0。プラットフォームの許可画面回数はツール結果から取得できず、推測しない。
- 根拠：approved-cleanup-result.json、事前/事後共通のapproved-cleanup-verify.sql（SHA-256 9b2c53088b27fe8c1731be5c1bf1303c6971a30552cd02ce458f5092d83a9a64）。以前のlive-run-results.json/cleanup-final-review.jsonは当時の記録として保持する。旧節の「片付け未完了/削除未実行」は履歴であり、本節を優先する。

メンター説明例：「問題テーブルだけの書込停止では、所有者権限で動く削除RPCが残るため、両経路の実行権限も撤回しました。権限の停止と復旧は実DBで確認できましたが、APIの拒否試験は未完了です。片付けは記録済み4行だけを一括削除し、対象外データと権限の不変を前後比較しました。」

同じ静的調査や片付けの再実行は不要。実API試験の再開・残存Authの削除/権限解除・本番適用は今回の作業から自動で進めない。


## 片付けの最終安全確認（2026-10-19 04:21 JST・削除未実行）

今回は削除の再承認前の確認のみ。既存のプロジェクト識別・権限/RLS確認は再利用し、Supabaseの読取は不足していた3表の連鎖経路と対象件数をまとめた1回だけ。対象引数はezjzgebehancbxqpganyに限定。本番アクセス、Auth変更、削除ツールの呼出し、以前の失敗要求の再送なし。

| 削除対象 | 記録済みID | 04:21 JSTの実測 |
| --- | --- | --- |
| public.questions | 2f1569c5-8375-4c95-a431-761dff17bbdd / 9757b1d9-47ae-4a15-9812-1484c248de6f | 2件、試験用タイトルも一致 |
| public.user_progress | 4f62451b-8d24-43b2-8e89-92f55d3d4111 | 1件、記録した本人/問題との紐付け一致 |
| public.profiles | a4bbe847-4a60-4574-b00e-dce8f4e10adc | 1件、試験用の名前も一致 |

未記録の関連進捗0、試験プロフィールに紐づく別問題の進捗0。3表は通常テーブルで子テーブル/パーティションなし。関係するFKはuser_progress→questionsとuser_progress→profilesの2件だけで、ON DELETE/UPDATEはどちらもNO ACTION（自動の連鎖削除・SET NULL等なし）。独自トリガー0、ルール0、内部トリガー8件はpg_catalogのFK検査/NO ACTION用だけ。Authアカウントの削除を誘発する参照経路もこの3表の関係にはない。取得原文/結果はcleanup-safety-check.sql / cleanup-final-review.json。

元のlive-cleanup-data.sql（SHA-256 92c9d2421f7f44eff79b505e28c78a1a6f86141cc2e3bb51a8bdc789c124ae92）は保持する。元SQLは削除後の件数不一致でTXを中断するが、最新依頼の『件数相違なら削除前に停止』を明確に満たすため、別原本live-cleanup-data-reviewed.sqlへ以下を追加した。これは許可エラーの回避・SQL隠蔽の変更ではない。

- 全3表の継承/FK/内部トリガー/ルールと、削除前の全対象件数を検査。不一致なら最初のDELETE前に例外。
- テーブルのSHARE UPDATE EXCLUSIVEロックで処理中の構造/トリガー変更を防ぎ、記録済みの問題・プロフィール・進捗行をFOR UPDATEで固定。通常の無関係な行の読み書きを一律停止するモードではないが、ロック待ち等の遅延はあり得る。[PostgreSQL 17のロック仕様](https://www.postgresql.org/docs/17/explicit-locking.html)。
- DELETE FROM ONLY + 明示したIDのWHERE条件。削除順は進捗1→問題2→profile1。各DELETE後も実件数を検査し、いずれか違えば例外で全体を確定させない。単一BEGIN/COMMIT、lock_timeout5秒/statement_timeout30秒（各文）を維持。
- DROP/TRUNCATE/UPDATE、権限/RLS/関数/Auth変更やRPC呼出しなし。新規試験Auth2件は今回の削除対象外。

**再承認対象の唯一の原本：live-cleanup-data-reviewed.sql**

SHA-256（UTF-8/LF/末尾改行込み）：`cb183dcda4a43c5ca113034560cf1d72d726418e989425486ba777c32ecf84f1`

静的確認は記録済み4IDだけ、3つのDELETE全てにID限定WHERE、削除前の検査、削除後3件の件数検査、単一TX等で一致。改訂案のDB構文解析/実行・実ロールバックは未実施。実行時に対象ID/原本SHAを照合し、DB内でも前提を再検査する。原本全文はこのファイルとSQLファイルで確認でき、チャット再掲は求められた場合のみ。

前回のInvalid or expired requestStateの根本原因は未確認。今回削除ツールを呼び出しておらず、エラーが解消したとは扱わない。ユーザーの新たな明示承認と正常な個別ツール許可が成立しなければ実行せず、再送や別経路への迂回をしない。結果不明なら対象IDの残存を読取確認する。

## 最新の実施結果（2026-10-19 04:14 JST最終観測）

**判定：一部成功。停止・限定復旧は実DBで確認済み。実APIによる停止中/復旧後の機能検査と後片付けは未完了。** 原本stop.sql/resume.sqlは変更せず、両方とも承認されたstagingだけに別トランザクションで適用した。以前の「未承認/未実行/認証情報待ち」は履歴として扱う。

- 今回承認された新規Auth2件（試験管理者1/一般1）のみを正規Auth管理APIで作成。既存stagingキーをログイン済み管理画面から非表示で取得し、Git外0700ディレクトリ/0600ファイルへ保存。管理用キーは新規アカウント作成だけに使用し、問題作成・本人保存はそれぞれの実ログインJWTで行った。メール確認済みとして新規作成し、メール送信・通常Auth設定変更・既存アカウント変更はなし。
- 新規2アカウントの通常ログイン、管理者による2問題INSERT、一般ユーザーによる本人プロフィール1件/進捗1件の保存は成功。試験IDはlive-run-results.jsonに記録。パスワード/JWT/APIキー/メールは記録資料に出力しない。
- 初回のAuth作成通信は実行環境のネットワーク制限で結果取得不能。読取専用接続確認で通信可能な実行環境を確認し、Auth件数6とメタデータ指紋が開始値のままであることをSQLで照合してから新規作成した。未知の結果のまま二重作成していない。失敗要求記録も私有ディレクトリに保持。
- stop.sql適用後、2026-10-18 22:54 JSTの読取で停止ACL指紋f79cd8a1d16d34bcf047510223162d1a、公開/内部関数ともauthenticated EXECUTE=false、RLS/ポリシー/関数定義不変を確認。他の実行中トランザクション0件は当該観測時点の確認。意図的にRPCを実行中にして取消しを確認した試験ではない。
- 同じ観測で、Auth/プロフィール/進捗の総件数が予定を超えていた。開始時はAuth6/profile3/progress3/questions3、今回分を加えた想定は8/4/4/5、実際は10/5/5/5。今回の成功API記録はAuth作成2回だけであり、不明分の作成主体や原因は断定しない。不正利用と推測しない。通常の機能検査を中断し、条件が一致する承認済み復旧を優先した。
- resume.sql適用後、2026-10-19 04:04 JSTと04:14 JSTの読取で正常ACL指紋34359cdf23e85be0c1309b1280d24020へ復帰。ポリシー指紋/列構造/所有者/RLS/関数定義/ロール状態も開始時と一致。停止後から最終観測まで3表データとAuthメタデータの照合値は同じ。開始前からの全行不変は、不明な追加分があるため証明していない。
- 今回の2問題に結び付く進捗は記録済み1件のみ、他人の未記録進捗なしと読取確認。続いて新規2問題/1進捗/1profileだけをロック・件数検査付きの単一TXで片付けるlive-cleanup-data.sqlを1回要求したが、MCPの許可状態エラー`Invalid or expired requestState`となった。DBのSQL構文/制約エラーとは確認されていない。原因未特定なので再送・別ツール/CLI/UIによる迂回なし。
- 成否不明後のlive-final-check.sql（READ ONLY）で、今回分の問題2/進捗1/profile1/Auth2が全て残存し、権限は安全な正常状態のままと確認。削除は反映されていない。試験アカウントの削除や管理者フラグ解除も行わず、専用記録と0600認証ファイルを保全した。試験管理者の権限は残っている。保管した発行済みアクセストークン2件は記録時に有効期限経過を確認したが、アカウント自体の無効化を意味しない。

| 検査 | 実際の結果 |
| --- | --- |
| 新規2アカウントの通常ログイン/正しい管理フラグ | 成功 |
| 停止前の管理者問題作成・本人プロフィール/進捗保存 | 成功 |
| 原本の停止・限定復旧、ACL/RLS/関数のカタログ照合 | 成功 |
| 停止後の残存トランザクション | 観測時0件 |
| 停止中の匿名/一般/管理者API閲覧、書込/RPC拒否 | 未実施 |
| 停止前の有効な管理者JWTでの削除拒否 | 未実施 |
| 停止中の本人保存/復元、復旧後の管理者CRUD/一般拒否 | 未実施 |
| 意図的な途中失敗・実ロールバック | 未実施 |
| 専用データ/アカウント片付け | 未完了。今回分2問題/1進捗/1profile/2Auth残存 |

Supabaseツール10回（プロジェクト識別1、SQL9。うちcleanup要求1回がツールエラー）。記録済みの試験APIは10要求、別に接続確認1要求・ネットワーク失敗1要求。管理画面内部の通信数は網羅していない。明示的なコマンド実行許可要求2回。Supabase側の許可画面表示回数は結果に含まれず推測しない。

再開時は今回の既知の試験IDと認証ファイルだけを利用し、新規アカウントを追加作成しない。私有保存先は`/private/tmp/codestep-emergency-live-021ba5fa-1570-4d30-9748-fda92b69f467/`（credentials.json/state.json等、値は出力しない）。まずMCP許可状態エラーの原因/解消根拠を確認し、同じ拒否要求を再送しない。不明な追加データを開始件数へ戻す目的で削除しない。未完了の実API試験は、許可手段が正常で実施中の競合操作を避けられる条件で計画を引き継ぐ。

詳細な観測・試験ID・呼出履歴はlive-run-results.json。stop.sql/resume.sql/baseline.jsonと既存アプリ/58テスト/依存は不変。本番アクセス、commit/push/デプロイ、課金なし。

## 最新方針：認証情報なしでの確認範囲（2026-10-18）

ユーザーは既存資格情報ファイルの所在を把握していない。所在の質問や一時ディレクトリの探索を繰り返さない。**試験手段が揃うまで停止・復旧を開始しない。** 今回はローカル確認と記録のみで、Supabaseアクセス/追加許可要求は0回。19:36 JSTのDB観測を再利用し、現在の実DB状態と断定しない。直前照合成功を停止・復旧成功やログイン成功と扱わない。

| 確認項目 | アプリのログイン情報 | 今回の扱いと限界 |
| --- | --- | --- |
| SQL原本SHA、Markdown全文との一致 | 不要 | 今回も一致をローカル確認。原本変更なし |
| 停止対象、限定復旧、閲覧/本人保存の権限を残す設計 | 不要 | 前回の静的照合結果を再利用。実動作を保証しない |
| 実DBのACL/RLS/関数/ロールのメタデータ | 不要（接続ツールの認証は別） | 2026-10-18 19:36:25 JSTの読取成功を再利用。再照会なし |
| 匿名の実API閲覧・拒否 | アカウント不要。ただしstagingの公開用キーとAPI接続が必要 | 今回は実行しない。管理接続のSELECTを匿名API成功に読み替えない |
| SQL全体のDB実行、停止/復旧、タイムアウト/ロールバック | アプリのログイン自体は不要だが、変更操作の承認と検査手段が必要 | 一連の試験手段がないため開始しない。完全な構文解析/実行成功は未確認 |
| 一般/管理者のログインと正しい権限のJWT取得 | 必要 | 未実施。所有者/SET ROLE/手作りJWTで代用しない |
| 停止中の実API書込/RPC拒否、本人保存・復元 | 必要 | 未実施。service_roleを一般ユーザーの代役にしない |
| 停止前の有効な管理者JWTの再使用 | 必要 | 未実施。管理者解除後のJWT失効試験とは別 |
| 復旧後の管理者CRUDと一般ユーザー拒否 | 必要 | 未実施。設定の一致だけで成功としない |
| 実行中処理の確認 | アプリのログインは不要 | 確認方法は設計済みだが停止後の確認は未実施。過去の0件から完全停止を主張しない |

### 必要になった場合の使い捨てアカウント案（未承認・未作成）

1. 対象はezjzgebehancbxqpganyだけ。新しい架空の管理者/一般ユーザー各1件、計2件をSupabaseの正規のAuth管理機能で作成する案とする。既存ユーザーの再設定、本番アカウント流用、既存デモ管理者の変更はしない。
2. 新規管理者1件だけにapp_metadata.codestep_admin=trueを設定し、新規一般ユーザーには管理権限を付けない。既存メタデータ・RLS・JWT全体設定を変更しない。メール送信を不要にできる試験専用の確認方式は、作成時に利用可能な正規機能で確認する。未確認のAPI命令を実行しない。
3. 作成数/対象ID、管理者フラグ、本人保存で必要になる新規profile最大1件、後片付け方法を一度の承認範囲にまとめる。既存の最大3問題/2進捗の試験上限は増やさない。profileに本人DELETE権限がないため、新規profileだけの片付けに管理操作が必要ならその必要最小限の操作も事前明示する。既存行のDELETE権限を新たに付与しない。
4. ランダムなパスワードは作成時に安全に生成し、値を出力せずGit外の専用ディレクトリ0700/ファイル0600へ直接保存する。一時的な/tmpだけに依存しない。JWTは原則メモリ内だけに保持する。保存先・作成/削除対象は承認時に確定し、今回はファイルも認証情報も作成しない。
5. 準備の管理操作と検査を分離する。管理権限は承認されたアカウント準備/片付けに限り、検査にはstagingの公開用キーと各ユーザーの実ログインJWTを使用する。service_role/所有者権限で一般ユーザーの成功・拒否を代用しない。
6. ログインとロールを確認できてから停止試験へ進む。後片付けは今回新規の試験データ/profile/AuthのIDだけに限定し、既存6アカウントやデモデータを触らない（6件は19:36時点の観測）。新規管理者権限の解除・セッション終了・新規Auth削除も承認対象として明示する。アカウント削除等だけで既発行JWTが即時失効したとは扱わず、有効期限までの残存リスクを記録する。

この案は今すぐ作成する承認要求ではない。実施を選ぶ場合だけ対象・操作・片付けをまとめて別途承認を得る。既存の停止/復旧承認を新規Auth作成へ拡大解釈しない。

SQL表示は従来どおり原本パス/SHAと簡潔な目的説明を先に提示し、チャット全文は求められた場合だけ。実行内容と原本の一致が確認できなければ保留し、長文UIを理由に常時許可や別経路で迂回しない。

## 実施依頼後の状況（2026-10-18 19:36 JST観測）

今回のユーザー承認はstagingの停止・復旧・最大3問題/2進捗の試験と片付けを含む。ただし現在は**一部成功・追加確認必要（直前照合のみ成功、停止・復旧試験は未着手）**。下記の「未承認」は前回準備時の履歴であり、今回の承認を否定するものではない。

- get_projectでezjzgebehancbxqpgany/codestep-staging/専用DBホストを照合。execution-preflight.sqlを事前にパス/SHAと読み取り専用であることを提示して1回だけ実行。2026-10-18 19:36:25 JST、READ ONLY=on、通常ACL指紋/ポリシー指紋/両関数SHA/所有者/RLS/ブラウザロールの非昇格/列構造が既存記録と一致。既存件数はquestions3/profiles3/progress3/Auth6、実行中の他トランザクション0（その時点だけの観測）。行本文・メール・JWT・パスワードは出力しない。
- 阻害要因：前回の/tmp/codestep-staging-session.jsonおよびデモログイン用0600一時ファイルが現在存在しない。代替のstaging専用設定も所定一時パス/関連環境変数にはなかった。アカウント作成・パスワードリセット・管理者フラグ変更はしない。既存の安全な資格情報ファイルの所在をユーザーに質問した。秘密をチャットへ書かない。
- 実APIの一般/管理者と停止前JWTを準備できないまま権限を止めても目的の検査ができないため、停止前で保留。所有者によるロール偽装やservice_roleで代用してJWT試験の成功と扱わない。
- stop.sql/resume.sqlは承認ハッシュと一致し変更なし。停止/復旧とも未実行、試験問題/進捗は作成0・削除0・残存0。権限・RLS・関数・Authの変更なし。SQLエラーや復旧失敗が起きたわけではない。データ保全用の件数/照合値をexecution-results.jsonに保存したが、変更後の最終比較を行ったという意味ではない。
- Supabaseツール2回（get_project1、execute_sql読取1）。こちらから追加の業務承認要求0、資格情報所在の質問1。プラットフォームが表示した個別許可画面の回数はツール結果に含まれず、推測しない。
- 再開には既存staging専用の管理者/一般ユーザーのログイン情報と公開用キーを安全な0600ファイルで利用できることが必要。service_role/サーバー秘密キーは試験に不要。既存ファイルのパスのみ伝え、秘密値はチャット/Gitに出さない。再開時は同じ承認対象・同じSQLであれば業務承認を繰り返さず、経過時間に応じ必要最小限の直前照合後に続行する。Auth変更が必要なら今回の承認外として保留する。

実行記録：execution-preflight.sql / execution-results.json。停止中・復旧後の動作、古いJWT拒否、停止完了、実ロールバックはいずれも未検証。今回アプリ変更なし、58テスト等の無関係な再実行・commit/push/デプロイ・本番アクセスなし。

作成：2026-10-18。段階：**実行準備のみ。stop.sql / resume.sqlは未実行・未承認。**

このフォルダは今回だけの新規資料。既存runbook/SQL/判断記録を上書きしない。今回の新しいSQLを旧来の本番承認に含めない。

## 最終準備レビュー（2026-10-18・追加依頼分）

**判定：条件付きで実行準備完了。今回はSupabaseアクセス0回・ツール実行許可要求0回。停止・復旧・試験データ作成は未実行。** 以下の旧調査記載は前回準備時の観測であり、今回再取得した情報ではない。

- 根拠はbaseline.jsonのR1（2026-10-18 18:53:08 JST）〜R5（18:54:47 JST）、同じ前回準備時のR6。R6単独の取得時刻は結果に含まれないため分単位の時刻を補わない。本番比較は同日18:25、別経路確認は同日18:40の過去記録。今回はこれらを再照会しない。
- 対象はcodestep-staging / ezjzgebehancbxqpgany。実行時のツール引数もこのIDに固定し、表示名やcurrent_database()だけでは識別しない。既存のプロジェクト照合記録を再利用するが、実行時点の状態は未確認と区別する。
- stop.sql / resume.sqlのSHA-256は第3・4節の値と一致し、原本変更なし。Markdownの各SQLブロックを連結すると原本と完全一致する。baseline内R1〜R6のSHA・ポリシー指紋・正常/停止予測ACL指紋もローカル再計算で一致した。
- 字句・構造検査：単一BEGIN/COMMIT、DO区切り、同一の前提検査、停止前後の指紋の向き、対象権限、データ/構造変更命令がないことを確認。記録したACLに撤回・限定再付与を模擬すると安全な停止前ACLへ戻る。PostgreSQL/PLpgSQLの完全な構文解析器やDB実行は使っていないため、構文・実API拒否・実ロールバックの成功証明ではない。追加パッケージを導入しない。
- ローカルの指紋再計算で、初回はOIDを数値へ変換したため2項目が不一致となった。記録と同じ文字列表現を保持して再計算し、正常/停止予測とも一致。SQL側の不一致やDBエラーではなく、原本修正は不要。
- stagingデータは主に本人/Codexの試験で作成したという最新の利用者説明を採用する。第三者利用の不存在の技術的証明は行わず、それだけを理由に調査や承認を繰り返さない。既存行・既存アカウントは保護し、試験中は本人も管理操作を控えるという実施条件で扱う。
- 停止対象はquestionsのブラウザロールの表/列書込と削除関数2件のEXECUTE。SELECT、profiles、通常のuser_progress保存、RLS、管理者判定、関数定義は維持。service_role/所有者の直接テーブル操作の全面停止ではない。
- 古いJWT試験は、停止前に取得した有効な管理者JWTをメモリ内に保持して停止中に再使用する。Authのフラグ解除・変更は不要。復旧時の旧JWT残存リスクは第7節のとおり別途判断し、ログへトークンを出さない。

### 次回の操作単位と承認のまとめ方

業務上の明示承認は、以下の対象・上限・SQL2本・失敗時対応を**一度にまとめて**確認できる。停止と復旧は別トランザクション/別実行単位のままとし、停止のみの承認を復旧までの承認と解釈しない。プラットフォームの個別ツール許可は必要な場合だけ求め、回数や省略を保証しない。

1. **開始前の照合**：SQL原本SHA/対象IDをローカル照合。追加の最新情報が必要なら、必要なメタデータと実行中件数をREAD ONLYの1要求にまとめる。停止SQLが照合するACL/RLS/関数を理由なく別々に再照会しない。対象プロジェクトのAPI情報が必要な場合はSQLとは別の識別用読取とし、識別不能なら開始しない。
2. **専用データ準備**：安全な既存staging試験管理者・一般ユーザーを再利用し、Auth/既存profile/デモ管理者フラグは変更しない。新規の最大3問題（履歴なし・履歴あり・本人保存継続用）、最大2進捗（履歴あり用1・保存継続用1）のIDを新たに記録する。既存データをコピーしない。再利用できるアカウントがなければ準備のみ保留し、新規Auth作成を無断で行わない。
3. **停止**：承認済みstop.sqlの全文を1要求・1トランザクションで実行。断片実行や承認の迂回はしない。
4. **停止確認**：必要な権限/状態/実行中件数の読取は可能な範囲で1要求にまとめ、専用IDだけで匿名/一般/管理者/停止前JWTの拒否、閲覧、本人保存を確認。通常の管理者CRUDの成功済み試験全体は繰り返さない。
5. **復旧**：停止状態と再開条件を確認後、承認済みresume.sqlを1要求・1トランザクションで実行。構成が変わっていれば追加変更しない。
6. **復旧確認・片付け**：一般拒否と管理者CRUD再開を専用IDだけで確認。新規最大3問題/2進捗のうち実在する試験IDだけを片付け、既存行を復元名目で上書きしない。既存デモ管理者は保持する。

エラーで同じ接続に未確定/中断トランザクションが残ったと確認できた場合のROLLBACKと読み取り確認は、試験セットの承認範囲に明示して含められる。ただし別接続でのROLLBACKは元の処理を戻さない。COMMITの結果不明時はまず読み取り確認し、再実行しない。接続強制終了・Auth変更・試験ID外の変更は含めず、必要なら別途承認する。

実行中処理は第7節の件数/開始時刻による読み取り確認を基本とする。残存0を確認できなければ完全停止としない。ロックで意図的にRPCを待たせる同時実行試験は通常の停止/復旧試験から切り離し、具体的SQLが未準備のまま開始しない。これを主試験の開始条件にはしない。

この追加依頼ではreview.mdだけを更新する。stop.sql・resume.sql・baseline.jsonと、それ以前の未コミット資料/画像/アプリは保持する。新しいSupabase観測・58テスト等の再実行・コミット/push/デプロイはない。

## 1. 構成と本番との差

対象はcodestep-staging / ezjzgebehancbxqpgany / db.ezjzgebehancbxqpgany.supabase.co / PostgreSQL17.11。get_projectで照合した。今回は本番SQLを照会しない。本番の比較は同日18:25の読取結果（SELECTのみ、旧7ポリシー、削除RPCなし）を再利用し、変更直前の最新値とはしない。

R1〜R5は同日18:53〜18:54 JSTに全てread_only=onで成功。3表の所有者postgres/RLS有効/FORCE RLS無効、questionsは公開SELECT＋管理者I/U/Dの4ポリシー、profiles/progressは本人限定の各3ポリシー。anonはquestions SELECTのみ。authenticatedはquestions SELECT/DELETE＋必要5列I/U、関数2件EXECUTE。両関数の所有者postgres（BYPASSRLSあり）、内部だけDEFINER、空search_path、内部lock_timeout5s。関数定義SHAと本文SHAは記録原本と一致。anon/authenticatedの上位ロール付与なし。

R5の統計上の推定件数はAuth users6、questions3、profiles3、user_progress3。正確な件数・架空/実利用者の区別・現在の使用者は未確認。データ本文/氏名/メール/ID/JWT/接続元/実行SQL本文は取得しない。観測時の他の実行中接続0・トランザクション0は将来の空きを保証しない。

既存Preview https://codestep-bywtked27-touya1896-7818s-projects.vercel.app は今回get_deploymentでREADY・非Productionと確認。接続先は以前のstaging照合記録を参照し、今回は環境変数を取得しない。最新デプロイ全件や全連携アプリ、外部サービス、実利用者の有無は網羅していない。共有環境として扱い、管理画面操作の休止時間を人間が確認してから試験する。

R6は権限指紋のSELECTだけを実行し、ローカル計算値と実DBの正常ACL指紋34359cdf23e85be0c1309b1280d24020が一致。停止後指紋f79cd8a1d16d34bcf047510223162d1aは現在のACLから計算した**予測値**。停止/復旧の実行成功・ロールバック成功ではない。

## 2. 停止が必要な理由・対象範囲

テーブル/列の許可だけを止めても、所有者権限で動く削除RPCは残る。対象はquestionsの匿名/authenticated経由の管理書込と、公開/内部削除関数の実行。本人のprofiles作成・user_progress保存は継続。service_roleによる直接テーブル操作・所有者の管理操作は停止対象外（既存のサーバー専用キーを取得/使用しない）。関数のservice_role EXECUTEは元々なく、停止後もない。

問題の閲覧はSELECT権限と公開RLSを維持する。削除の事前確認モードもRPC権限の撤回で拒否されるため、停止中は管理画面の削除確認も使えない。実行中処理やロック待ちにより、一時的な遅延/エラーはあり得る。

## 3. 停止SQL全文（実行禁止・承認待ち）

唯一の実行予定本文：stop.sql。UTF-8・LF・末尾改行込みのSHA-256：`d2a00c818211768268534104ff5ee250d1c83624f938a16a39923b64b84a7a83`。

表示は3分割、実行は全体を一度だけ。同じファイルを読み込み同じSHAと照合してツールへ渡す。project_idは必ずezjzgebehancbxqpgany。SQL内のコメントやcurrent_database()を接続先照合の代わりにしない。現在の本番では関数/ポリシーが異なるためガードで中断する構成だが、これは接続先確認の代替ではない。

### SQL 1/3

```sql
-- PROPOSAL ONLY. Not executed or approved for execution.
-- Only codestep-staging: ezjzgebehancbxqpgany.
-- Caller must verify the project ID; current_database() is not an identity check.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SET LOCAL search_path = pg_catalog;
DO $context$
BEGIN
  IF current_user <> 'postgres'
    OR (SELECT count(*) FROM pg_class
        WHERE oid IN ('public.questions'::regclass,
          'public.profiles'::regclass,'public.user_progress'::regclass)
          AND relowner='postgres'::regrole
          AND relrowsecurity AND NOT relforcerowsecurity) <> 3
    OR EXISTS (SELECT 1 FROM pg_roles
        WHERE rolname IN ('anon','authenticated') AND (rolsuper OR rolbypassrls))
    OR EXISTS (SELECT 1 FROM pg_auth_members
        WHERE member IN ('anon'::regrole,'authenticated'::regrole)) THEN
    RAISE EXCEPTION 'Owner, RLS or API role differs; stop';
  END IF;
  IF (WITH policies AS (
      SELECT tablename,policyname,permissive,roles,cmd,qual,with_check
      FROM pg_policies WHERE schemaname='public'
        AND tablename IN ('questions','profiles','user_progress')
    ) SELECT md5(jsonb_agg(to_jsonb(p) ORDER BY tablename,policyname)::text)
      FROM policies p) IS DISTINCT FROM 'c65a21b9b4319768ec1cd689eaac0cc7' THEN
    RAISE EXCEPTION 'Policies differ; keep current state and inspect';
  END IF;
  IF (SELECT count(*) FROM pg_proc p
      JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname IN ('public','codestep_private')
        AND p.proname='delete_question_with_progress') <> 2
    OR (SELECT count(*) FROM pg_proc p
      JOIN pg_namespace n ON n.oid=p.pronamespace
      JOIN (VALUES
        ('public',
         'd0351e1eddb7bbc60beb5cdc43999fba58c71475c0906f11acb66d9f15f733bd'),
        ('codestep_private',
         '87f2aab0c5ce1e704cb3f2b415ab32025407b2247c3e806012480a5747ef5b06')
      ) expected(schema_name,definition_hash) ON expected.schema_name=n.nspname
      WHERE p.proname='delete_question_with_progress'
        AND oidvectortypes(p.proargtypes)='uuid, boolean, boolean'
        AND p.proowner='postgres'::regrole
        AND encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')
          =expected.definition_hash) <> 2
```

### SQL 2/3

```sql
    OR NOT has_schema_privilege('authenticated','codestep_private','USAGE') THEN
    RAISE EXCEPTION 'Deletion functions differ; stop and inspect';
  END IF;
END
$context$;
DO $before$
DECLARE actual text;
BEGIN
WITH acl AS (
  SELECT 'table' AS scope, c.relname::text AS object_name, ''::text AS column_name,
    a.grantor, a.grantee, a.privilege_type, a.is_grantable
  FROM pg_class c CROSS JOIN LATERAL
    aclexplode(COALESCE(c.relacl, acldefault('r', c.relowner))) a
  WHERE c.oid IN ('public.questions'::regclass,
    'public.profiles'::regclass, 'public.user_progress'::regclass)
  UNION ALL
  SELECT 'column', c.relname::text, x.attname::text,
    a.grantor, a.grantee, a.privilege_type, a.is_grantable
  FROM pg_class c JOIN pg_attribute x ON x.attrelid=c.oid
  CROSS JOIN LATERAL aclexplode(x.attacl) a
  WHERE c.oid IN ('public.questions'::regclass,
    'public.profiles'::regclass, 'public.user_progress'::regclass)
    AND x.attnum>0 AND NOT x.attisdropped
  UNION ALL
  SELECT 'function', n.nspname||'.'||p.proname, '',
    a.grantor, a.grantee, a.privilege_type, a.is_grantable
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  CROSS JOIN LATERAL
    aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a
  WHERE n.nspname IN ('public','codestep_private')
    AND p.proname='delete_question_with_progress'
)
  SELECT md5(jsonb_agg(to_jsonb(acl)
    ORDER BY scope COLLATE "C",object_name COLLATE "C",
      column_name COLLATE "C",grantor,grantee,
      privilege_type COLLATE "C",is_grantable)::text)
  INTO actual FROM acl;
  IF actual IS DISTINCT FROM '34359cdf23e85be0c1309b1280d24020' THEN
    RAISE EXCEPTION 'ACL state differs; stop and inspect without retry';
  END IF;
END
$before$;
REVOKE EXECUTE ON FUNCTION
  public.delete_question_with_progress(uuid,boolean,boolean),
  codestep_private.delete_question_with_progress(uuid,boolean,boolean)
  FROM PUBLIC, anon, authenticated, service_role;
```

### SQL 3/3

```sql
REVOKE ALL PRIVILEGES ON TABLE public.questions
  FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES
  (id,title,question_text,answer_code,explanation,category,created_at)
  ON TABLE public.questions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.questions TO anon, authenticated;
DO $after$
DECLARE actual text;
BEGIN
WITH acl AS (
  SELECT 'table' AS scope, c.relname::text AS object_name, ''::text AS column_name,
    a.grantor, a.grantee, a.privilege_type, a.is_grantable
  FROM pg_class c CROSS JOIN LATERAL
    aclexplode(COALESCE(c.relacl, acldefault('r', c.relowner))) a
  WHERE c.oid IN ('public.questions'::regclass,
    'public.profiles'::regclass, 'public.user_progress'::regclass)
  UNION ALL
  SELECT 'column', c.relname::text, x.attname::text,
    a.grantor, a.grantee, a.privilege_type, a.is_grantable
  FROM pg_class c JOIN pg_attribute x ON x.attrelid=c.oid
  CROSS JOIN LATERAL aclexplode(x.attacl) a
  WHERE c.oid IN ('public.questions'::regclass,
    'public.profiles'::regclass, 'public.user_progress'::regclass)
    AND x.attnum>0 AND NOT x.attisdropped
  UNION ALL
  SELECT 'function', n.nspname||'.'||p.proname, '',
    a.grantor, a.grantee, a.privilege_type, a.is_grantable
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  CROSS JOIN LATERAL
    aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a
  WHERE n.nspname IN ('public','codestep_private')
    AND p.proname='delete_question_with_progress'
)
  SELECT md5(jsonb_agg(to_jsonb(acl)
    ORDER BY scope COLLATE "C",object_name COLLATE "C",
      column_name COLLATE "C",grantor,grantee,
      privilege_type COLLATE "C",is_grantable)::text)
  INTO actual FROM acl;
  IF actual IS DISTINCT FROM 'f79cd8a1d16d34bcf047510223162d1a' THEN
    RAISE EXCEPTION 'ACL state differs; stop and inspect without retry';
  END IF;
END
$after$;
COMMIT;
```

## 4. 復旧SQL全文（実行禁止・承認待ち）

唯一の実行予定本文：resume.sql。UTF-8・LF・末尾改行込みのSHA-256：`3f555329200cb3ea8778abe98b5587496bb7bdd40eb19c563641f9089947a9e4`。

停止後の想定ACL指紋からだけ復旧し、元の安全な必要権限に戻ることをCOMMIT前に再照合する。正常なまま/途中状態/想定外差分なら中断。旧7ポリシーからの本番移行用ではない。

### SQL 1/3

```sql
-- PROPOSAL ONLY. Not executed or approved for execution.
-- Only codestep-staging: ezjzgebehancbxqpgany.
-- Caller must verify the project ID; current_database() is not an identity check.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SET LOCAL search_path = pg_catalog;
DO $context$
BEGIN
  IF current_user <> 'postgres'
    OR (SELECT count(*) FROM pg_class
        WHERE oid IN ('public.questions'::regclass,
          'public.profiles'::regclass,'public.user_progress'::regclass)
          AND relowner='postgres'::regrole
          AND relrowsecurity AND NOT relforcerowsecurity) <> 3
    OR EXISTS (SELECT 1 FROM pg_roles
        WHERE rolname IN ('anon','authenticated') AND (rolsuper OR rolbypassrls))
    OR EXISTS (SELECT 1 FROM pg_auth_members
        WHERE member IN ('anon'::regrole,'authenticated'::regrole)) THEN
    RAISE EXCEPTION 'Owner, RLS or API role differs; stop';
  END IF;
  IF (WITH policies AS (
      SELECT tablename,policyname,permissive,roles,cmd,qual,with_check
      FROM pg_policies WHERE schemaname='public'
        AND tablename IN ('questions','profiles','user_progress')
    ) SELECT md5(jsonb_agg(to_jsonb(p) ORDER BY tablename,policyname)::text)
      FROM policies p) IS DISTINCT FROM 'c65a21b9b4319768ec1cd689eaac0cc7' THEN
    RAISE EXCEPTION 'Policies differ; keep current state and inspect';
  END IF;
  IF (SELECT count(*) FROM pg_proc p
      JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname IN ('public','codestep_private')
        AND p.proname='delete_question_with_progress') <> 2
    OR (SELECT count(*) FROM pg_proc p
      JOIN pg_namespace n ON n.oid=p.pronamespace
      JOIN (VALUES
        ('public',
         'd0351e1eddb7bbc60beb5cdc43999fba58c71475c0906f11acb66d9f15f733bd'),
        ('codestep_private',
         '87f2aab0c5ce1e704cb3f2b415ab32025407b2247c3e806012480a5747ef5b06')
      ) expected(schema_name,definition_hash) ON expected.schema_name=n.nspname
      WHERE p.proname='delete_question_with_progress'
        AND oidvectortypes(p.proargtypes)='uuid, boolean, boolean'
        AND p.proowner='postgres'::regrole
        AND encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')
          =expected.definition_hash) <> 2
```

### SQL 2/3

```sql
    OR NOT has_schema_privilege('authenticated','codestep_private','USAGE') THEN
    RAISE EXCEPTION 'Deletion functions differ; stop and inspect';
  END IF;
END
$context$;
DO $before$
DECLARE actual text;
BEGIN
WITH acl AS (
  SELECT 'table' AS scope, c.relname::text AS object_name, ''::text AS column_name,
    a.grantor, a.grantee, a.privilege_type, a.is_grantable
  FROM pg_class c CROSS JOIN LATERAL
    aclexplode(COALESCE(c.relacl, acldefault('r', c.relowner))) a
  WHERE c.oid IN ('public.questions'::regclass,
    'public.profiles'::regclass, 'public.user_progress'::regclass)
  UNION ALL
  SELECT 'column', c.relname::text, x.attname::text,
    a.grantor, a.grantee, a.privilege_type, a.is_grantable
  FROM pg_class c JOIN pg_attribute x ON x.attrelid=c.oid
  CROSS JOIN LATERAL aclexplode(x.attacl) a
  WHERE c.oid IN ('public.questions'::regclass,
    'public.profiles'::regclass, 'public.user_progress'::regclass)
    AND x.attnum>0 AND NOT x.attisdropped
  UNION ALL
  SELECT 'function', n.nspname||'.'||p.proname, '',
    a.grantor, a.grantee, a.privilege_type, a.is_grantable
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  CROSS JOIN LATERAL
    aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a
  WHERE n.nspname IN ('public','codestep_private')
    AND p.proname='delete_question_with_progress'
)
  SELECT md5(jsonb_agg(to_jsonb(acl)
    ORDER BY scope COLLATE "C",object_name COLLATE "C",
      column_name COLLATE "C",grantor,grantee,
      privilege_type COLLATE "C",is_grantable)::text)
  INTO actual FROM acl;
  IF actual IS DISTINCT FROM 'f79cd8a1d16d34bcf047510223162d1a' THEN
    RAISE EXCEPTION 'ACL state differs; stop and inspect without retry';
  END IF;
END
$before$;
GRANT SELECT ON TABLE public.questions TO anon, authenticated;
GRANT INSERT (title,question_text,answer_code,explanation,category)
  ON TABLE public.questions TO authenticated;
GRANT UPDATE (title,question_text,answer_code,explanation,category)
```

### SQL 3/3

```sql
  ON TABLE public.questions TO authenticated;
GRANT DELETE ON TABLE public.questions TO authenticated;
GRANT EXECUTE ON FUNCTION
  public.delete_question_with_progress(uuid,boolean,boolean),
  codestep_private.delete_question_with_progress(uuid,boolean,boolean)
  TO authenticated;
DO $after$
DECLARE actual text;
BEGIN
WITH acl AS (
  SELECT 'table' AS scope, c.relname::text AS object_name, ''::text AS column_name,
    a.grantor, a.grantee, a.privilege_type, a.is_grantable
  FROM pg_class c CROSS JOIN LATERAL
    aclexplode(COALESCE(c.relacl, acldefault('r', c.relowner))) a
  WHERE c.oid IN ('public.questions'::regclass,
    'public.profiles'::regclass, 'public.user_progress'::regclass)
  UNION ALL
  SELECT 'column', c.relname::text, x.attname::text,
    a.grantor, a.grantee, a.privilege_type, a.is_grantable
  FROM pg_class c JOIN pg_attribute x ON x.attrelid=c.oid
  CROSS JOIN LATERAL aclexplode(x.attacl) a
  WHERE c.oid IN ('public.questions'::regclass,
    'public.profiles'::regclass, 'public.user_progress'::regclass)
    AND x.attnum>0 AND NOT x.attisdropped
  UNION ALL
  SELECT 'function', n.nspname||'.'||p.proname, '',
    a.grantor, a.grantee, a.privilege_type, a.is_grantable
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  CROSS JOIN LATERAL
    aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a
  WHERE n.nspname IN ('public','codestep_private')
    AND p.proname='delete_question_with_progress'
)
  SELECT md5(jsonb_agg(to_jsonb(acl)
    ORDER BY scope COLLATE "C",object_name COLLATE "C",
      column_name COLLATE "C",grantor,grantee,
      privilege_type COLLATE "C",is_grantable)::text)
  INTO actual FROM acl;
  IF actual IS DISTINCT FROM '34359cdf23e85be0c1309b1280d24020' THEN
    RAISE EXCEPTION 'ACL state differs; stop and inspect without retry';
  END IF;
END
$after$;
COMMIT;
```

## 5. SQLごとの影響・安全確認

共通：BEGIN/COMMITで権限変更を一体化。SET LOCALはこのトランザクションの待機時間/検索先だけを設定し、永続設定を変更しない。DO内のSELECT/IF/RAISE EXCEPTIONは前提と結果の照合で、データや関数を作成しない。pg_get_functiondefは定義を読むだけ。全文中のDELETE/INSERT/UPDATEはGRANT対象の権限名であり、データ操作命令ではない。EXECUTEもREVOKE/GRANT対象の権限名。DROP/ALTER/CREATE/TRUNCATEの実行命令・RPC呼出しなし。データ削除0、Auth変更0、RLS/ポリシー/関数定義変更0。

stop：REVOKEはquestionsの全表/全7列のPUBLIC/anon/authenticated権限を撤回し、両関数のPUBLIC/anon/authenticated/service_role EXECUTEを撤回。SELECTだけGRANTで戻す。復旧前提となる安全なACL状態を検査する。

resume：SELECT維持、authenticatedへ5列のINSERT/UPDATEとDELETE、両関数のEXECUTEだけをGRANT。本人限定RLSと管理者RLSはそのまま。GRANT ALLやPUBLIC/anonへのEXECUTEはない。

before/afterのACL指紋には3表の表・列ACLと両関数ACLを含む。停止/復旧でprofiles/user_progressや所有者/service_roleの既存権限まで変わればCOMMIT前に不一致となる。metadata指紋はMD5による比較、SQL全文の同一性はSHA-256で照合する。指紋は読み取った時点の構成の確認であり、悪意ある所有者操作を防ぐ仕組みではない。同時の管理DDL/権限変更を避け、直前再監査する。

成功判定はCOMMIT応答だけでなく、別の読み取りで権限/ポリシー/定義を再確認し、使い捨てデータへの実API拒否/復旧を確認する。管理接続でのSELECT成功を匿名APIの成功と扱わない。

## 6. stagingの具体的な試験順

1. 試験中は本人も管理操作を控える。stagingは主に本人/Codexの試験用という説明を採用し、第三者利用不存在の証明を繰り返すために停止しない。外部へ勝手に通知しない。
2. 安全な既存staging試験アカウントを再利用し、既存profile/デモ管理者フラグを変更しない。再利用できなければアカウント準備を保留し、新規Auth作成は別承認。秘密情報はチャット/Gitへ出さない。
3. 承認範囲内で最大3問題（履歴なし/履歴あり/本人保存継続用）・最大2進捗を新規作成して試験IDを記録。既存データをコピーしない。試験ID以外へのUPDATE/DELETE禁止。片付けの対象・上限もまとめた承認に含める。
4. 停止前の既存成功結果を再利用し、試験者が正しいロールであることと専用データの状態だけ確認。停止前に取得した有効な管理者JWTをメモリ内に保持し、停止中も同じJWTで拒否を確認する。Authの権限解除・変更は行わない。
5. stop.sqlの確認用ファイル/ハッシュ/IDを提示・照合し、停止を含む明示承認後に全体を1回実行。チャットへの全文再掲は求められた場合のみ。分割実行しない。
6. 権限と実APIを別確認。匿名/一般/管理者/古い管理者JWTのquestions I/U/D拒否、公開RPCの確認/削除両モード拒否、内部関数EXECUTEなし、SELECT継続、進捗の本人保存・復元成功。他人の進捗や禁止列の許可を増やさない。TRUNCATEは権限だけ確認し実行しない。
7. 第7節の実行中確認で停止完了を判定。未確認なら『新規受付は停止・完全停止は未確認』と記録し、安全な次工程の判断を人間へ返す。
8. 原因/定義/RLS/停止ACLが一致し、旧JWTに関する再開条件を確認してから、復旧を含む明示承認の範囲内でresume.sqlを実行する。新JWTを取得しただけでは他端末の旧JWT失効を証明できない。
9. 復旧後は一般/匿名拒否を維持し、正規管理者が専用問題の作成/編集/履歴あり・なし削除を行えることを確認。本人の保存/復元も確認。
10. 専用IDだけ片付ける。Auth/デモ管理者メタデータは今回変更しないため復元操作もしない。既存データの不変を承認された件数/非公開指紋等で確認。状態不明なら片付けを進めない。

## 7. 実行中処理・失敗時の対応

- 新規受付停止：権限撤回COMMIT後の新しい要求が拒否される状態。
- 完全停止：それに加え、停止前から実行していた対象トランザクションも終了している状態。REVOKEは実行中RPCを自動取消ししない。
- 停止COMMITの後にR5等の読み取りでDBの観測時刻と処理件数を確認。0ならその観測時点では残存なし。0でなければ、観測時刻より前に開始したトランザクションを件数/必要最小限のPIDと開始時刻で追跡する短い読み取りSQLを別途全文提示する。SQL本文・接続元・ユーザー行は取得しない。新しい本人保存のトランザクションと区別する。
- 同時実行試験は停止前に開始した専用RPCを試験IDだけのロックで待たせ、許可撤回後の扱いを観測する計画。既存行のロック/トリガー追加/無条件の接続終了はしない。この試験の具体的SQL・対象ID・解放手順は未作成/未承認で、今回のstop/resume承認には含めない。単にLOCKすれば取消せるとは考えない。
- 実行中処理を識別できない/終了を確認できないなら完全停止成功としない。キャンセル/接続終了は対象と影響を明示して別承認。
- SQLエラー/指紋不一致：TX全体が中断し、先行するREVOKE/GRANTも確定しない。停止失敗なら通常権限が残り得る。復旧失敗なら停止状態を維持する。セッションが中断TXを保持する場合は別途明示したROLLBACK/接続終了を承認された方法で行い、権限を再確認する。
- lock_timeout5s/statement_timeout30s：一時的な待機制限。このSQLの値はAPI/JWTの設定変更ではない。タイムアウト後は成功扱いせず、再送せず読み取り確認。
- 通信断/結果不明：COMMIT済みかもしれない。正常指紋/停止指紋/どちらでもない状態を読み取りで区別する。正常なら停止未完了、停止なら新規受付停止を確認、その他なら追加変更しない。
- 復旧失敗：停止維持。UIだけ戻す/GRANT ALL/旧7ポリシー/広い権限への復帰をしない。恒久的な原因修正は別承認。
- 古い管理者JWT：停止中はJWT内の管理者フラグにかかわらず、撤回したDB権限で新しい要求を拒否する。一方、復旧後は有効期限内の旧JWTが管理者条件を再び満たし得る。停止SQLはJWTを失効させない。権限解除・漏えいが関係する場合は、旧JWTの最長有効期限が過ぎ、更新後のトークンに管理者権限がないことを確認できるまで復旧を保留する。期限を確認できない場合も保留し、必要なら現時点の権限をDBで再判定する別設計を検討する。Auth変更やその別設計の適用は今回行わず、別承認とする。
- 停止/復旧SQLはデータを削除しない。後の使い捨て削除のCOMMIT済みデータはROLLBACKできない。試験ID外のデータに変化があれば片付けを止めて調査する。

## 8. 実施済みと未実施

実施済み：stagingのプロジェクト照合、事前に全文/SHAを表示したR1〜R6の読取、既存Previewメタデータの読取、新規4資料のローカル作成、指紋計算と復旧ACL一致の静的確認。R6正常指紋は実DB一致。

未実施：stop/resume、テストデータ・Auth変更、実API書込/拒否試験、実行中RPC試験、復旧/ロールバックの実DB試験。SQL全体の実DB構文/DOガード実行は未検証。アプリ変更がないため既存58テスト/lint/typecheck/buildは再実行せず前回成功を再利用。今回の未実施を成功にしない。本番アクセス/変更、push、デプロイ、課金なし。

## 9. 次の承認

冒頭の最終準備レビューに従い、staging対象ID・SQL2本のハッシュ・専用試験データ上限・片付け・失敗時対応を試験セットとしてまとめて明示承認できる。停止と復旧は別操作であり、双方が承認対象に明記されていることが必要。復旧手段を確認する前に停止を始めない。SQL本文変更なら新SHA/確認用ファイルを提示し、内容変更の承認を受ける。ツール自体の許可は必要なものだけ別途求める。本番は独立した第4段階であり、staging成功から自動反映しない。

## 10. 初心者向け説明とメンター回答

- ACL：表/列/関数を使うための許可一覧。RLS：許可された操作が触れる行を絞る条件。両方必要。
- RPC：DB内にまとめた処理。DEFINER：その関数の所有者権限で動く。INVOKER：呼び出した人の権限で動く。
- REVOKE/GRANT EXECUTE：関数を呼ぶ許可の撤回/再付与。関数の実行命令そのものではない。
- 指紋：内容の一致確認用の短い値。同一SQLの確認はSHA-256、権限/ポリシーの状態照合は記録済みMD5。
- 『なぜテーブルだけでは不足？』→所有者権限の削除RPCが別の入口なので、両関数の呼び出し許可も止めます。
- 『なぜ一般にもEXECUTEを戻す？』→通常構成では同じauthenticatedロールを使い、関数内で厳密な管理者判定をします。一般ユーザーへの管理許可ではありません。
- 『なぜ元を丸ごと戻さない？』→危険な権限を復活させないため、安全な記録と一致する必要分だけ戻します。
- 『進捗保存は止まる？』→対象3表を照合しますが、変更するのはquestionsと削除関数だけなので本人保存の権限は保持します。実動作は別試験で確認します。
- 『なぜ成功と言えない？』→今回は読取と静的確認だけ。権限変更・拒否・復旧・巻き戻しを実際に試していないからです。

## SQL承認画面の運用

最新の依頼に従い、長いSQLはまず原本/このMarkdownで確認できる状態にし、通常チャットでは目的・staging対象ID・主要処理・変更の有無・ファイルパス・SHAを簡潔に示す。全文のチャット分割表示は求められた場合のみ。長い承認UIの表示不具合を修正したとは主張しない。見切れ/スクロール不能等で確認済みファイルと実行内容の一致を確認できなければ実行を保留する。『常に許可』を求めない。許可を迂回するCLI/UI切替や隠蔽はしない。ツール呼出し直前にファイルのSHAと提示済みSHAを一致させる。SQLの断片を別実行しない。秘密が混ざったら全文公開せず、まず安全な確認方法へ変更する。

## 読み取りSQLの原文とSHA-256

R1〜R6はすべてstaging限定、データ本文を読まないメタデータ/統計取得。R5は推定統計であり人数の実測ではない。BEGIN TRANSACTION READ ONLY/SELECT/COMMITのみ。R3のEXECUTEは権限名の文字列。R6の指紋計算はRPCを呼ばない。拒否/エラー時は結果を未確認とし、理由なく再実行しない。

### R1

SHA-256：`a2b82869de95fe770cd24fdca4363879b56164b6bb7505663f8d42a3b0d62b81`

```sql
BEGIN TRANSACTION READ ONLY;
WITH acl AS (
  SELECT 'table' AS scope, c.relname::text AS object_name, ''::text AS column_name,
    a.grantor, a.grantee, a.privilege_type, a.is_grantable
  FROM pg_class c CROSS JOIN LATERAL
    aclexplode(COALESCE(c.relacl, acldefault('r', c.relowner))) a
  WHERE c.oid IN ('public.questions'::regclass,
    'public.profiles'::regclass, 'public.user_progress'::regclass)
  UNION ALL
  SELECT 'column', c.relname::text, x.attname::text,
    a.grantor, a.grantee, a.privilege_type, a.is_grantable
  FROM pg_class c JOIN pg_attribute x ON x.attrelid=c.oid
  CROSS JOIN LATERAL aclexplode(x.attacl) a
  WHERE c.oid IN ('public.questions'::regclass,
    'public.profiles'::regclass, 'public.user_progress'::regclass)
    AND x.attnum>0 AND NOT x.attisdropped
)
SELECT current_setting('transaction_read_only') AS read_only,
  CURRENT_TIMESTAMP AS observed_at, jsonb_agg(to_jsonb(acl)
    ORDER BY scope,object_name,column_name,grantor,grantee,privilege_type) AS acl
FROM acl;
COMMIT;
```

### R2

SHA-256：`eb79545fe0957185dcb1be21f84d58de8ff73ec548e7fa1e8a895dd0ee325312`

```sql
BEGIN TRANSACTION READ ONLY;
WITH policies AS (
  SELECT tablename,policyname,permissive,roles,cmd,qual,with_check
  FROM pg_policies WHERE schemaname='public'
    AND tablename IN ('questions','profiles','user_progress')
), tables AS (
  SELECT relname,pg_get_userbyid(relowner) AS owner,
    relrowsecurity AS rls,relforcerowsecurity AS force_rls
  FROM pg_class WHERE oid IN ('public.questions'::regclass,
    'public.profiles'::regclass,'public.user_progress'::regclass)
)
SELECT current_setting('transaction_read_only') AS read_only,
  (SELECT jsonb_agg(to_jsonb(t) ORDER BY relname) FROM tables t) AS tables,
  (SELECT jsonb_agg(to_jsonb(p) ORDER BY tablename,policyname)
    FROM policies p) AS policies,
  (SELECT md5(jsonb_agg(to_jsonb(p) ORDER BY tablename,policyname)::text)
    FROM policies p) AS policy_fingerprint;
COMMIT;
```

### R3

SHA-256：`67147b621fb4b5a96129fd933ccca73eba5c9263aba53346bca49c78b70c85f3`

```sql
BEGIN TRANSACTION READ ONLY;
SELECT current_setting('transaction_read_only') AS read_only,
  COALESCE(jsonb_agg(jsonb_build_object(
    'schema',n.nspname,'name',p.proname,'args',oidvectortypes(p.proargtypes),
    'owner',pg_get_userbyid(p.proowner),'definer',p.prosecdef,'config',p.proconfig,
    'body_sha256',encode(sha256(convert_to(p.prosrc,'UTF8')),'hex'),
    'definition_sha256',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex'),
    'acl',(SELECT jsonb_agg(to_jsonb(a) ORDER BY grantor,grantee,privilege_type)
      FROM aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a),
    'anon_execute',has_function_privilege('anon',p.oid,'EXECUTE'),
    'authenticated_execute',has_function_privilege('authenticated',p.oid,'EXECUTE'),
    'service_execute',has_function_privilege('service_role',p.oid,'EXECUTE')
  ) ORDER BY n.nspname,p.proname,p.oid),'[]'::jsonb) AS functions
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname IN ('public','codestep_private')
  AND p.proname='delete_question_with_progress';
COMMIT;
```

### R4

SHA-256：`a5a4d32791c67c8874c1ab84ab03e81c7c71e73d0b14d55c9cb8e42dae6ff2be`

```sql
BEGIN TRANSACTION READ ONLY;
WITH roles AS (
  SELECT oid,rolname,rolsuper,rolbypassrls FROM pg_roles
  WHERE rolname IN ('anon','authenticated','service_role','postgres')
)
SELECT current_setting('transaction_read_only') AS read_only,
  (SELECT jsonb_agg(to_jsonb(r) ORDER BY rolname) FROM roles r) AS roles,
  (SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'member',pg_get_userbyid(m.member),'role',pg_get_userbyid(m.roleid),
    'inherit',m.inherit_option,'set',m.set_option)),'[]'::jsonb)
    FROM pg_auth_members m WHERE m.member IN
      (SELECT oid FROM roles WHERE rolname IN ('anon','authenticated'))) AS memberships;
COMMIT;
```

### R5

SHA-256：`715064b32ede39458273db0ded17da67b24db294c41be7857214bfe78c7125b2`

```sql
BEGIN TRANSACTION READ ONLY;
SELECT current_setting('transaction_read_only') AS read_only,
  CURRENT_TIMESTAMP AS observed_at,
  (SELECT jsonb_agg(jsonb_build_object('schema',schemaname,'table',relname,
    'estimated_rows',n_live_tup,'last_analyze',last_analyze))
    FROM pg_stat_all_tables
    WHERE (schemaname='public' AND relname IN ('questions','profiles','user_progress'))
       OR (schemaname='auth' AND relname='users')) AS estimates,
  (SELECT count(*) FROM pg_stat_activity
    WHERE datname=current_database() AND backend_type='client backend'
      AND pid<>pg_backend_pid() AND state='active') AS other_active_connections,
  (SELECT count(*) FROM pg_stat_activity
    WHERE datname=current_database() AND backend_type='client backend'
      AND pid<>pg_backend_pid() AND xact_start IS NOT NULL) AS other_transactions;
COMMIT;
```

### R6

SHA-256：`2706dd49ba745e7789e6bb6c1f669466f88c4d517acd0506bd55feb2a86a7663`

```sql
BEGIN TRANSACTION READ ONLY;
WITH acl AS (
  SELECT 'table' AS scope, c.relname::text AS object_name, ''::text AS column_name,
    a.grantor, a.grantee, a.privilege_type, a.is_grantable
  FROM pg_class c CROSS JOIN LATERAL
    aclexplode(COALESCE(c.relacl, acldefault('r', c.relowner))) a
  WHERE c.oid IN ('public.questions'::regclass,
    'public.profiles'::regclass, 'public.user_progress'::regclass)
  UNION ALL
  SELECT 'column', c.relname::text, x.attname::text,
    a.grantor, a.grantee, a.privilege_type, a.is_grantable
  FROM pg_class c JOIN pg_attribute x ON x.attrelid=c.oid
  CROSS JOIN LATERAL aclexplode(x.attacl) a
  WHERE c.oid IN ('public.questions'::regclass,
    'public.profiles'::regclass, 'public.user_progress'::regclass)
    AND x.attnum>0 AND NOT x.attisdropped
  UNION ALL
  SELECT 'function', n.nspname||'.'||p.proname, '',
    a.grantor, a.grantee, a.privilege_type, a.is_grantable
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  CROSS JOIN LATERAL
    aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a
  WHERE n.nspname IN ('public','codestep_private')
    AND p.proname='delete_question_with_progress'
)
  SELECT md5(jsonb_agg(to_jsonb(acl)
    ORDER BY scope COLLATE "C",object_name COLLATE "C",
      column_name COLLATE "C",grantor,grantee,
      privilege_type COLLATE "C",is_grantable)::text)
  AS acl_fingerprint FROM acl;
COMMIT;
```
