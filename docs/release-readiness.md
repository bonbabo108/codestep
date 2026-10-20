# 公開判断とPreview準備（2026-10-16更新）


## 2026-10-21 本番公開計画（DB/Auth条件付き承認・未適用）

**最新の本人判断：** DB/Auth変更は「本人所有の対象アカウント照合」と「非公開バックアップの取得・整合性・復元可能性の検証」完了が条件。既存1アカウントが本人所有との回答は受領したが、対象IDの非公開照合はまだ実施していない。main/Productionは現時点では未承認で、条件成立後のマージ直前に再確認する。SMTPはない/不明、新規契約・課金は禁止。

**現在の停止理由：** 自動バックアップなし。pg_dump/psql/GnuPG/ローカルPostgreSQL/Dockerは利用できず、Homebrewによるgnupg/postgresql@17導入はmacOS27未対応で終了（exit1）。OS判定の偽装や互換性チェックの解除はしていない。実データを取得・ファイル化する前に停止したため、非公開バックアップも復元可能性の検証も未完了。本番DB/Auth/URL/権限変更は一切していない。再開には、対応した正規のバックアップ/復元検証環境と読取接続、または本人が取得した同等の検証可能な非公開バックアップが必要。確認できるまでSQLやAuth設定を先行変更しない。

最新依頼を優先し、Productionで動く状態を完成条件とする。以下は今回の読取結果と実行前レビュー（承認の有無だけでバックアップ条件を省略しない）。[本番レビュー一覧と全文ハッシュ](./production-release.review.json)は新規の提案で、過去のstaging承認・ツール要求は流用しない。以下より古い節の現在地は履歴として扱う。

### 実際との差分

| 対象 | 2026-10-21の読取結果 | 最小変更 |
| --- | --- | --- |
| Git/PR | ローカル6d7eaf1から資料のみ3コミットをfast-forwardし6836a44。PR #3=open/draft、base/main=274eb79。コード差分なし、未レビュー、競合なし、4 checks成功 | 同じPRを利用。条件成立と明示承認後だけready化・mainマージ |
| Production配信 | Vercel codestep、team_ElBqxblU9glF6Lgu1Ekw0jzo、prj_5yGFbE2rPl1XdsEje93egTHl01do。公開codestep-two.vercel.appはReady、main/274eb79、dpl_7y4n5KfqLz8jHYn9KRh2SmTyDpjF | mainのGit連携でProduction設定を使って再ビルド。Preview成果物の直接昇格なし |
| Production変数 | URLは本番xdnmlfoblqdygsnhkxxpのルート。公開キーは同ref/anon/有効期限内、service_roleではない。Previewと登録範囲が分離 | 変更不要。値・JWT・ハッシュは保存しない。キーの署名そのものを検証したという意味ではない |
| 本番データ/構造 | Healthy、PG17.6。questions=2/profiles=1/progress=0/Auth=1（メール確認済み1、管理者0）、重複/孤児0。3表RLS/16列、FK2本NO ACTION。Storage objects=0、public view等なし | 既存行・型・NULL/default・FK・Auth資格情報を維持。データコピー先は非公開バックアップのみ |
| questions | 旧7ポリシーだがanon/authenticatedともSELECTのみ。テーブル/列書込停止中 | 旧書込6ポリシーだけを管理者I/U/Dへ置換し限定ACLを戻す。公開SELECT維持 |
| profiles/progress | 本人限定6ポリシー。ただしanon/authenticatedにテーブル/列の過大ACLとTRUNCATEが残る | 必要SELECT/列INSERT/列UPDATEだけへ縮小。RLSでは防げないTRUNCATE等を除去 |
| UNIQUE/削除RPC | progressペアUNIQUEなし。codestep_private/削除RPCなし | UNIQUE追加、検証済みと同じ限定削除RPCを本番用に別レビュー。適用時の行削除なし |
| Auth URL | Site URL=http://localhost:3000、Redirect URLs=0件 | Site URL=https://codestep-two.vercel.app、許可先は同/loginの完全一致1件 |
| メールAuth | Email/新規登録ON、匿名登録OFF、Confirm email OFF、独自SMTP未設定 | SMTP準備・配信確認の後にConfirm email ON。既存の確認済みアカウントを維持。他provider/パスワード/トークン寿命は変更しない |
| 保護/レビュー | GitHubのclassic保護ルール一覧とrulesets一覧は空。PRはdraftがマージを妨げ、レビュー0件。Vercelコネクタは実チームでも403、CLIなし | 保護ルールを緩和しない。実行直前に最新checks/レビュー条件を再確認。コネクタの復旧・権限拡大を自動実行しない |
| バックアップ | Supabase Free、No backups（自動バックアップ対象外）、ローカルdump/復元検証も未取得 | 取得・整合確認を本番変更の絶対条件とする。課金で代用しない |

Vercel照会の最初のteam指定は実チームと異なったため、既存の正規ログイン画面で実IDを確認して訂正した。訂正後も403。再試行/保護解除/トークン探索は中止し、既存ログイン済み画面で閲覧可能な項目だけを確認した。環境変数は照合後再マスク、値の記録なし。GUIで見えることをMCP権限復旧と説明しない。

本番Authの独自SMTP未設定は公開時の新しい必須残件。Supabaseの[標準メール仕様](https://supabase.com/docs/guides/auth/auth-smtp)では宛先が組織の事前承認済みアドレスへ制限され、一般利用者向けに独自SMTPが必要。従来の「メール日本語化・ブランド化は低優先」とは区別する。サービス/送信元・費用・認証情報は未指定なので勝手に契約/設定しない。確認OFFのままでメール認証完成とはしない。

### データ保全・バックアップ（取得前）

- 本人承認後、Git/クラウド同期外の`~/.codestep-private-backups/2026-10-21/`へ保存。ディレクトリ0700、ファイル0600。公開資料には内容・個人情報・資格情報を置かず、保存成否/件数だけ記録。保存先へのツール権限は別途正規に取得する。
- 正規のPostgres読取接続で`pg_dump`のpublicスキーマcustom archiveを1つ作り、3表の全行とDDL/列/制約/ポリシー/ACL/関数を同一スナップショットで保存する。必要なら公式libpq17をローカル導入。DBパスワードは本人が端末の非表示入力へ入力し、チャット/コマンド引数/履歴へ渡さない。接続先は本番refで固定検査する。
- 管理者候補1件の変更前app_metadataと対象ID、Auth URL/Confirm email/SMTP有無、Vercelの変更前デプロイ/設定メタデータも同じ非公開領域へ保存。Authユーザー全dump・パスワードハッシュ・セッション・鍵の収集は不要。認証情報は変更しない。
- `pg_restore --list`でarchive内の3表/データ/設定対象が揃うこと、ファイルが読めること、チェックサム・観測件数・接続先・時刻を確認する。復元SQLは非公開ファイルへ生成してレビューし、保存だけで復元試験成功とはしない。本番データをstaging/新クラウドへ複製しない。
- **バックアップ取得/検証に失敗、接続資格情報が未準備、観測後にデータ/定義差が発生した場合は本番書込へ進まない。** 自動バックアップがあるはずと仮定しない。[公式バックアップ案内](https://supabase.com/docs/guides/platform/backups)。

### 明示承認後の段階適用

1. バックアップ/対象/全SQLハッシュと最新メタデータを照合。過去のrequestState/保存済みSQL要求は使わず、今回の原本から新しい本番要求を作る。
2. `progress-release-proposal.sql`を1TX適用、本人6ポリシー保持・不要ACL除去・データ不変を確認。
3. `progress-unique-proposal.sql`を別TX適用。重複があれば修復/削除せず停止。FK/データ不変を確認。
4. 本人がAuth Usersの既存1件を自分の管理者アカウントと確認した場合だけ、Admin API/既存の正規管理UIで他app_metadataを保持しcodestep_adminをboolean trueにする。対象IDは非公開保存。本人が再ログインして新JWTを得る。既存資格情報やuser_metadataは変更しない。
5. `questions-admin-rls.sql`を1TX適用（旧6ポリシー削除だけ）。停止中のACLと置換を同TXで安全に更新。SELECT/厳密な管理者条件/禁止列/TRUNCATEなしを確認。
6. `questions-delete-production-proposal.sql`を1TX適用。staging原本と実行SQLは一致し、対象のコメントだけ本番向けにした新提案。private DEFINER＋public INVOKER、空search_path、postgres所有、匿名EXECUTEなし、管理者の厳密検査を確認。適用で問題/進捗を削除しない。元のstaging用原本・承認ハッシュを変更しない。
7. Auth Site URL/Redirect URLsを上表の2値へ変更。独自SMTPは送信元/サービス/費用の本人確認と正規の設定準備後のみ。SMTP配信が準備できてからメール確認を有効化。手動メール確認済み化や認証確認の省略で代用しない。
8. 権限/定義/制約/既存全行の不変と匿名Readを確認。本番CRUD書込や新規Auth作成・メール送信は、実データへ触れない対象と復旧/後片付けを別途限定承認した場合だけ実施する。本人の実メール/PC・スマホ確認は未実施のまま扱う。
9. 独自SMTP/新規メール確認・管理者本人JWTを含む公開条件、最新CI・レビュー条件、main/Productionの明示承認が揃った時点でPR #3をready化・mainへマージ。Production変数で自動ビルドし、source SHA/本番接続/公開到達/管理ガード/デモと本人ログイン・進捗保存を確認。未承認の試験データ作成や既存行の削除は含まない。

### リスクと復旧方法

- SQLは各段階で排他ロック最大待ち5秒/各文30秒。短い閲覧待機や権限不足が起こり得る。3本とRPCは別TXなので後段失敗でも先に安全化したACL/制約は保持する。結果不明時は再送せず読取確認。
- 既存の旧7→4移行SQL原本/進捗の本番DOガードは静的検証だけ。stagingの最終状態/API成功を本番一括適用・途中失敗の実証と扱わない。追加の緊急停止/復旧試験はしない。この限界は本番承認に含める。
- 失敗時は安全なDB設定を保持し、mainマージ前なら停止して現Productionを維持する。公開後のアプリ不具合は旧Production（dpl_7y4n5KfqLz8jHYn9KRh2SmTyDpjF/274eb79）への戻しを別途承認範囲で判断。DB・Authの変更はアプリrollbackだけでは戻らない。
- 変更前の危険なACL/全員書込ポリシーへは戻さない。必要な停止は公開/内部削除関数のauthenticated EXECUTE撤回とテーブル・列書込停止をセットでレビューする。既存questions-emergency-stop.sqlだけでRPC停止済みと扱わない。停止操作自体も今回未承認・未実施で、試験を再開しない。
- 管理者解除は保存した変更前app_metadataの対象キーへ戻す。旧JWTは残り得るため、それだけで即時停止を保証しない。Auth URLは保存値へ復元可能だがlocalhostへ戻すとメール復帰は壊れるため、自動的に差し戻さない。メール確認を再びOFFにして成功させない。
- 適用SQLは行を削除しない。将来の管理者削除はCOMMIT後ROLLBACKできない。実データ破損時はバックアップと新規更新を比較して対象行だけの復元を別レビュー/明示承認する。全DB/全表の上書き復元・全削除・CASCADEは禁止。

### 今回求める本人の判断

- **DB/Auth準備の承認**：非公開バックアップ取得・検証後に上の4 SQLとAuth URL/メール確認を段階適用してよいか。既存Auth1件が本人の管理者用かは本人が画面で確認する。SMTPが未準備ならメール確認ON/一般登録完成判定を保留する。
- **main/Productionの承認**：上の全公開条件を満たした場合だけ既存PR #3をマージしProductionを更新してよいか。新たな保護解除・課金は含まない。
- **メール配信の準備**：使用できるSMTPサービスと送信元ドメイン/アドレスがあるか。なければ未契約のまま、最小のサービス案を提示して契約/費用/設定範囲の承認を別途得る。秘密値はチャットへ送らない。


**2026-10-19の現在地：** 管理画面デモbe683afのローカルPC/390px操作、70テスト/CI、固定stagingの390px CRUDと初期化が成功。新規メール認証の本人Android/PC確認は保留のまま、stagingコード反映を先に進める。最新状態/再開順は[HANDOFF](../HANDOFF.md)。本番変更/mainマージは最終承認待ち。過去の「承認未取得」「必須の緊急停止再試験」等を現方針へ読み替えない。


**2026-10-19 公開アクセス最新結果：** 承認条件を読み取り照合し、固定stagingドメイン1件だけをVercel公開例外へ追加済み。検証DB接続、架空の公開問題3行一致、本人データの匿名拒否、全3表RLS/管理者条件/削除RPC定義維持を確認。Require Log In/Standard Protectionは維持、個別Previewは引き続き保護。本番・DB・権限・mainは未変更。Vercel未ログインのPC/390pxで固定/loginへ到達成功。確認メール受信は本人報告で成功、実PC/実スマホの認証完了・再ログインは本人確認待ち。

**2026-10-19 最新結果：stagingのみURL設定を承認・反映済み。** Site URLは有効なブランチ固定Preview、Redirect URLsは同じoriginの/loginを完全一致で1件。保存後の再読込と既定メールテンプレート .ConfirmationURL の整合を確認。本番は変更なし。実メール受信・PC/実スマートフォンでの確認はユーザー本人が行うため未実施。アプリPR #3はdraft、本番移行待ち。53a5d43のpush/PR CIは62テスト・lint・型・ダミービルド成功、Previewは同SHA/Ready。提出用README PR #2はマージ済み。以下の未適用記載は当時の履歴。

## 2026-10-19 最終仕上げの公開判断（最新）

認証URLのコード修正、登録不要の安全な/demo、最終設計/評価証拠、README、CIダミービルドを追加。ローカル62テスト・lint・型・Webpackビルド成功。最新PR/Previewの結果は本節へ追記する。

Supabaseの両環境でSite URLがlocalhost:3000、Redirect URLsは0件とダッシュボード読取で確認。コードだけでメール誤遷移は解決せず、[限定したURL設定変更案](./auth-release-checklist.md)の承認・反映と実メール確認が残る。設定/Authユーザー/本番データは変更していない。

本番questionsは書込停止中で、管理者RLS・削除RPC・進捗制約等は未適用。本番移行の承認がないためmainマージとProduction反映は保留。CI成功だけで公開条件を満たしたとは扱わない。今回の依頼に基づく作業ブランチpush/PR/Previewまでを進める。緊急停止・復旧試験の追加実施は不要。

以下の「評価表未提供」「追加試験が必須」「過去SHAが現HEAD」等は当時の履歴。今回提供された評価画像は[evaluation-evidence.md](./evaluation-evidence.md)で照合する。OAuth・独立外部APIは未実装で、最高点の全条件達成とは主張しない。

## 2026-10-17 提出・公開に必要な残作業（最新判断）

以下の過去の「削除未検証」「SQL3本」「Preview未反映」より本節を優先する。現ローカルHEADは作業ブランチのcb34946、mainは35c13e3。直前の記録で[最新Preview](https://codestep-bywtked27-touya1896-7818s-projects.vercel.app)はcb34946/READY/staging接続を確認済み。削除警告→取消→関連進捗と問題の削除も実Preview/DB照合成功。今回は外部再照会・再テスト・DB変更を行っていない。

**提出を先に判断する：** curriculum.mdに正式な講座要項・採点表は未提供とあるため、Production必須ともPreview提出可とも断定できない。Week11テスト実施書・Week12改善案の原本/指定様式も未確認。GitHubの作業ブランチ、最新Preview、既存のテスト結果・画面画像・設計照合は提出候補として利用できる。Preview保護でメンターが閲覧できるかを含め確認し、許可されれば本番移行より提出を先にする。指定様式が必要な場合だけ既存結果/残課題を転記し、新規試験や機能開発を提出条件に追加しない。

READMEの最新状態追記・本節・最新Preview結果の一部はローカル未コミット。GitHubのmain READMEを完成版の説明として案内しない。提出時は作業ブランチを指定し、採用するMarkdown差分と必要な画像だけをレビュー後、別承認のコミット/push対象とする。既存画像/資料の全件整理は不要。

**本番へ進む場合の順序（全て別途承認後）：**

1. 本番IDと最新の3表スキーマ/列名・FK/RLS/ACL/旧7ポリシー・既存関数/スキーマを読み取り照合。行数だけでなく重複ペア、参照整合性、必要列/既定値を確認する。2026-10-15の2問題/1profile/0進捗を現在値とみなさない。3表のデータとポリシー/権限/制約/関数定義、管理者の変更前メタデータを承認された非公開の保存先へバックアップし、復元手順を確認する。questions CSVだけでは不十分。重複/想定外差分は削除や自動補正せず停止。
2. `progress-release-proposal.sql`でprofiles/user_progressのACLを必要列だけへ縮小し、本人6ポリシー・既存データ維持を確認。別TXの`progress-unique-proposal.sql`でUNIQUE(user_id,question_id)を追加し、定義/重複0/データ不変を確認。列名created_at・既存NO ACTION FK・NULL可否は変更しない。
3. 本番の管理者本人とUUIDを人間が確認し、既存app_metadataを保ってcodestep_adminをboolean trueにする。新JWT取得を確認し、questionsの停止はここでは維持。
4. `questions-admin-rls.sql`を現状と一致する場合だけ1TXで適用。旧書込6ポリシーを除き公開SELECT＋管理者I/U/D、最小列権限を確認。広い旧許可を残してGRANTだけ戻さない。
5. `questions-delete-with-progress.sql`を**本番対象として別レビュー・承認**し、削除RPCを追加する（現在の原本はstaging承認用）。既存FK/RLS/テーブルACLは変えない。適用自体にデータ削除なし。内部DEFINERの管理者検査・空search_path・所有者・非公開スキーマ、公開INVOKER、EXECUTEの限定、Data API反映を確認。stagingでのRPC削除途中の巻き戻し成功と、本番旧7→4移行/進捗SQL原本の未検証は別扱い。
6. 各段階でRLS/列を含む実効権限/制約/関数/データ不変・匿名HTTP閲覧を確認。ProductionのURL/有効公開キーが本番用であることは**現資料では値の照合未確認**なので、Preview用staging値と区別して直前確認する。Authの本番URL/リダイレクト設定も確認し、不足の変更は別承認。main反映前に全条件を満たす。本番への書込試験は別承認の対象限定試験がない限り実施せず、本番CRUD成功を断定しない。
7. mainへのマージ/pushをProduction自動デプロイと一組で明示承認し、Production環境値でビルドする。staging値を焼き込んだPreview成果物をそのまま昇格しない。公開後はSHA/接続先/匿名表示を読み取り確認。旧mainへ先にpushしてから確認する順序は禁止。

**停止・復旧の補正：** 各SQLは独立TXで、後段失敗でも成功済みの最小ACL/UNIQUEを保持する。結果不明なら再実行せず読取確認。旧7→4移行と進捗SQL2本の原本実行・複合ロールバック/ロック競合は未検証のままで、実行前にこの残存リスクの受容または追加隔離検証を判断する。今回は検証を追加しない。ロック中は閲覧待機もあり得る。

**重要：削除RPC追加後は`questions-emergency-stop.sql`だけでは全書込を止められない。** 内部SECURITY DEFINERは所有者権限で動くため、緊急停止にはテーブル/列ACL停止に加え公開/内部削除関数双方のauthenticated EXECUTE撤回が必要。PUBLIC/anon等の呼出権限もないことを照合する。この停止・安全な再開の本番操作は別レビュー/承認対象で、今回SQL原本は変更しない。旧JWTが残るためフラグfalseだけに頼らない。危険な旧ACL/ポリシーへ戻さず、デプロイ失敗は安全なDB設定を保持してアプリだけを承認範囲で戻す。COMMIT後の削除データはROLLBACKできず、必要ならバックアップからの対象限定復元を別途判断する。Auth/Vercel変更もSQLのROLLBACKでは戻らない。

## 2026-10-17 最新・公開判断は保留

**最新追記：** 管理者入口はac4692bで承認された作業ブランチだけへpush済み。[本人確認用の管理者ログイン](https://codestep-jvkfz5ng1-touya1896-7818s-projects.vercel.app/admin/login)はREADYの新Preview。匿名導線、専用管理者ログイン、一般拒否、学習者保存/再ログイン復元、管理者作成/編集を実確認した。今回の試験データは全行開始値へ復元し、承認済みの専用デモ管理者trueだけを保持。新規ユーザー・パスワード変更なし。ログイン情報はMac内の専用0600ファイルのみで、Git/チャットに転記しない。本人確認前に解除しない。削除APIは成功、確認ダイアログ経由のUI削除は未検証。以下の「新入口ローカルのみ」「付与承認待ち」はこの承認・実施前の履歴。今後の追加push/本番SQL/Auth/main/Production反映は別承認。

今回追加した管理者入口/admin/loginと/adminは**ローカルのみ**。単体56件・型/lint/ビルド・ブラウザ27項目（限定再試験を含む）成功、実staging/新Preview未検証。右上の管理リンクは最新指示で全員へ表示するが、管理操作は既存ガード/RLSのまま。Preview反映には差分レビュー・コミット・作業ブランチ限定pushの新しい承認が必要。本人がstagingで管理者を利用するには、対象アカウントを安全に確認し、そのUUIDへのapp_metadata.codestep_admin=true付与（既存メタデータ保持）を別途承認する。既存ユーザーへの付与/変更や継続用管理者作成を今回の許可から推定しない。権限変更後は再ログイン/JWT更新が必要。下記Preview54f3b66は今回の入口を含まない。

UI復元54f3b66を指定作業ブランチだけへpushし、[新Preview](https://codestep-k229a99br-touya1896-7818s-projects.vercel.app)は同SHAのREADY。PC/スマホ/不要UI除去/管理導線/権限拒否/本人保存復元/管理作成編集は実確認。開発時の読み込み失敗はPreviewで再現しなかった。

削除UIの成功は未確認。後片付け前のREAD ONLYで削除対象1件のDB残存を確認したため、削除はDB未反映であり、単なる一覧更新の問題ではない。内部原因は未特定。新しいユーザー指示と実行許可後にstagingの試験変更だけを復元し、3テーブル全行と管理者メタデータの開始時完全一致を確認した。独立したREAD ONLYでも問題3/プロフィール2/進捗3/使い捨て0/管理者true0。後片付けAPIの成功をUI削除の成功とは扱わない。本番SQL/Authとmain反映の承認は依然別途必要。下の16日の「ローカルのみ」等は当時の記録。

実装は作業ブランチのPreviewへ反映済み。本番は公開承認前で、追加DB/Auth変更・main反映・本番デプロイはしていない。旧7ポリシー再現試験の再送は前提にしない。最新テスト結果はtest-plan.md末尾。

## 最新：UI復元版はローカルのみ（2026-10-16）

元の35c13e3のUIと現在のDB/Auth/保存/CRUDを統合した。詳細は[UI復元記録](./ui-restoration.md)。下記Previewは復元前の3110162であり、新UIを反映したとは扱わない。まずローカル差分と比較画像を確認し、新しいコミットの作業ブランチ限定push/Preview作成を改めて承認する。3110162限定の過去承認を追加pushへ拡張しない。そのPreview確認後に、従来の順序で本番SQL/Authとmain反映を別途判断する。

## 最新：承認済みpushとPreview実画面確認（2026-10-16）

- 対象`bonbabo108/codestep`、`refs/heads/codex/admin-rls-portfolio`にコミット`3110162b60028dbbd7479523de854d6cadc4dea9`だけをpush成功。upstreamは同じorigin作業ブランチに設定済み。force/main/全ブランチpushなし。
- [Preview](https://codestep-inza0dwfi-touya1896-7818s-projects.vercel.app)は`dpl_E83MoaEsvrKoAhfnQaemsVuVCbTF`、READY、source=git。同じrepo/ref/SHAをget_deploymentで確認。APIのtargetはnull（productionではない）、Preview一覧と作業ブランチ用aliasに整合。本番ドメインの割当なし。targetが文字列previewだったと捏造しない。
- URL/公開キーは下記の事前照合を再利用。Preview実画面から保存した正解がstagingの架空ユーザー進捗1件のupdated_at更新として反映され、追加重複0を読取照合した。設定値だけでなく実保存先の根拠にもなる。本番の資格情報でテストしていない。
- 匿名のDB出題/正誤/未保存、匿名・一般の管理拒否、一般ログイン/正解保存/ログアウト時消去/再ログイン復元、管理者の作成/編集、フラグ解除後JWT更新で管理拒否を実ブラウザ確認。取得できたコンソールerrorは0件。削除UIは確認ダイアログ操作がタイムアウトし未完了。読み取りで未削除を確認し、固定名の使い捨て1件だけAPIで後片付けした。試験管理者false・Previewログアウト、問題3/進捗3/重複0を確認。
- 通常HTTPは302でVercel認証へ転送。公式保護URL取得ツールはread_protection_bypass段階で403。設定変更・再送・迂回はせず、ユーザーの既存ログイン済みChromeから正規アクセスして上記を検証した。閲覧者にもVercel認証が必要。
- 本番ドメインを再照合し`dpl_GoE7Mo9W49q2BEcYfJh1iQXujSuq`、target=production、main、`35c13e3a9d02cd96d65f6bd8aec0daae5657f36a`のままを確認。本番/TodoApp/課金/外部設計資料の変更なし。アプリ/SQLは修正していないため既存56テスト・型・クリーンビルドを再利用した。
- 今回の記録と画像2枚はローカル更新のみ。3110162へ変更を混ぜず、追加コミット/push/別Preview作成はしていない。

## push前の環境照合・承認記録（2026-10-16、以下は過去の準備）

- ユーザーがPCで確認：Production Branchはmain、他の未割当ブランチはPreview対象。Preview専用のSupabase変数2件を登録済みでProduction設定は未変更との報告。この情報はユーザー確認を根拠とし、前日の403で未取得だった設定を取得済みと偽らない。
- Vercel APIの読み取りで、対象codestepプロジェクトのNEXT_PUBLIC_SUPABASE_URLとNEXT_PUBLIC_SUPABASE_ANON_KEYがtarget=previewだけで登録され、今回の作業ブランチ固有の上書きがないことを確認。URLはstagingのルートと完全一致（末尾スラッシュのみ許容）、/rest/v1/・追加パス・クエリ等なし。キーはSupabaseが返す同じstagingの有効な公開キーとメモリ内で完全照合した。値/ハッシュ/ユーザー情報を出力・保存していない。
- ブランチ別検索だけでは共通Preview変数が0件だったため、非復号のメタデータから共通Preview2件を選び、その2件だけを復号して照合した。Productionの値は復号していない。ツール実行環境にURL APIがなかったため、途中のパース不可判定は撤回し、正規のstagingルート文字列との完全照合で再検証した。実値の不備ではなかった。
- アプリ/テスト/ビルド設定31ファイルは前日のクリーン検証コピーとハッシュ一致、変更0。56件・型検査・クリーンビルド・既存実DB試験の結果を再利用し、無駄な再テストをしない。レビューした必要ファイルだけをローカルコミット対象とし、秘密・資格情報・既存codestep_key_files.txtを除外する。
- **次の承認対象は、originのrefs/heads/codex/admin-rls-portfolioへのpushと、それに伴うcodestepのPreview自動ビルド/作成だけ。** 未割当ブランチというユーザー確認を前提に、main反映/本番昇格を含めない。承認後もブランチ・コミットSHA・push先を直前照合し、作成後のtarget=preview/ref/SHA/staging接続を確認する。コミット成否とSHAは今回の実行報告・git logを参照する。

Preview作成により非本番のビルドが起動し、Preview URLが発行される想定。SQLはdocs内の案なのでpushやビルドだけで適用されない。stagingのデータ変更も、Previewを作成するだけでは発生させない。Production設定の編集・課金・mainへのpush/マージ・本番DB/Auth変更は今回も禁止。

## PCで確認・承認すること（優先順）

1. **画面と管理者本人の確認**：READMEのstaging画像とアプリの権限/保存動作を確認する。本番の最初の管理者をAuthユーザー詳細で本人確認し、対象IDを指定する。推測しない。ID・メール・鍵を公開資料へ書かない。
2. **Previewの目視確認**：作業ブランチpush/Previewは承認・実施済み。上記URLをVercel認証済みPCで確認する。削除UI/FK/0件/通信遮断の実staging画面は未完了で、実API成功・モック画面成功と区別して判断する。既存のstaging試験承認は継続し、同じ承認を再要求しない。
3. **DB/Auth反映と本番公開の判断**：Preview成功後、下記SQL3本と対象、管理者フラグ付与、未検証リスクを確認する。進捗ACL→一意制約→管理者指定/JWT更新→questions管理者RLSの順に、段階ごとに検証する。全て揃ってからmainへの反映/本番自動デプロイを明示承認する。結果不明なら次へ進めない。本番書込試験を暗黙で含めず、必要なら架空データの対象/操作/後片付けを別途明示する。

本番変更は承認まで実行しない。安全な作業の承認を重ねて求めず、この単位で判断できるようにする。メンター提出には制作者本人がmentor-notes.mdの5問を説明できることも確認する。

## GitHub/Vercel照合結果（2026-10-15、読み取りのみ）

| 項目 | 確認結果・参照元 |
| --- | --- |
| Git origin | `https://github.com/bonbabo108/codestep.git`。`git config --get remote.origin.url`で確認。専用pushurlなし |
| 現在の作業ブランチ | `codex/admin-rls-portfolio`。upstream未設定。push先の省略はしない |
| mainの追跡設定 | `branch.main.remote=origin`、`branch.main.merge=refs/heads/main`。これはローカルの追跡設定で、自動公開を止める設定ではない |
| HEADと未公開作業 | HEADは`35c13e3a9d02cd96d65f6bd8aec0daae5657f36a`。今回までの機能・資料はまだローカル差分なので、push前に選択した差分をコミットし、そのSHAをPreviewと照合する |
| Vercel対象 | `get_project`：codestep、`prj_5yGFbE2rPl1XdsEje93egTHl01do`、Next.js、Node24。ローカル.vercel/project.jsonは存在しないため、フォルダ名やローカルリンクから対象を推測しない |
| 公開URLの実デプロイ | `get_deployment(codestep-two.vercel.app)`：`dpl_GoE7Mo9W49q2BEcYfJh1iQXujSuq`、READY、target=production、source=git、repo=`bonbabo108/codestep`、ref=`main`、SHAは上記HEADと一致。ローカルoriginと公開実績のリポジトリが一致 |
| 15日時点で未確認だった設定 | get_projectの応答にProduction Branch・自動ドメイン割当・自動デプロイ分岐・Preview変数の詳細がなく、チーム範囲の追加照会は403。16日にProduction Branch/Preview対象はユーザーがPC確認し、Preview変数2件は別の専用読取APIで照合した。自動ドメイン割当等、今回確認していない項目まで確認済みとはしない |
| ローカルの上書き設定 | vercel.json/GitHub Actionsワークフローをローカルで検出せず。GitHub/Vercel側の保護設定や現在のリモートmain先端、作業ブランチのリモート有無は未確認 |

**mainからGit経由で本番公開された実績があり、16日にProduction Branch=mainとユーザーが確認したため、mainへのpush/マージは本番更新のトリガーとして扱う。** APIだけで自動公開スイッチを取得できたという意味ではない。今回の承認対象は未割当の作業ブランチだけとし、作成後も実際のtarget/domain/ref/SHAを照合する。機密値を資料やチャットへ転記しない。

この安全策は、production branchへのpush/マージが本番、他ブランチがPreviewとなる[VercelのGit連携仕様](https://vercel.com/docs/git)に沿う。Preview確認前のmain反映は禁止し、Production Branchがmain以外なら、そのブランチも同様に保留して計画を修正する。

## 本番前に残るリスク

| 項目 | 現在の根拠 | 本番前の扱い |
| --- | --- | --- |
| 最終RLS・管理CRUD・本人保存/競合・停止/復旧 | staging実DB/API41項目、実Auth9項目成功 | 本番との接続先/設定差を直前確認 |
| 旧7→4移行そのもの | 原本・対象6件・SELECT維持・承認全文ハッシュの静的検査のみ | DO一括実行・不一致ガード・途中失敗の複合ロールバック・ロック競合は実DB未検証と明示。追加隔離検証か、リスクを理解した本番可否判断が必要 |
| 進捗用の本番SQL2本 | stagingと同じ権限/UNIQUEの意図。新しい本番メタデータガードは静的検査のみ | staging初期化の成功を、このSQL原本の実行成功としない |
| 画面の異常系 | ローカルの実ブラウザ＋APIモック9件成功 | staging実APIの拒否と組み合わせて評価する。staging実画面の削除/FK/0件/通信遮断は未完了 |
| メール登録・本番動作 | Authの確認待ち分岐は実装/モック済み | 実メール到達・本番の新規保存/CRUDは未検証。勝手にメール/本番書込試験をしない |

本番PostgreSQLは17.6、stagingは17.11（2026-10-15のget_project）。同じメジャーでも環境差は残る。モック・静的検査・実API・画面の証拠を分ける。

## SQLと管理者準備の実行順序（全て今後の承認後）

前提：上記の設定確認と作業ブランチPreviewのstaging検証を先に終える。Previewを作るためにmainへ反映したり、本番DBを変更したりしない。以下はPreview成功後の本番準備であり、完了・検証まではmainを更新しない。

0. 本番ID `xdnmlfoblqdygsnhkxxp` とstaging `ezjzgebehancbxqpgany` を照合。本番3テーブルのバックアップ・既存ポリシー/ACL/制約と復旧記録を確保し、件数・全行比較用の値を秘密の管理領域へ記録。既存questions CSVだけで全設定/進捗が復元できるとは扱わない。進捗重複が増えていたら自動削除せず中止。
1. [進捗ACL案](./sql/progress-release-proposal.sql)：profiles/progressの本人限定6ポリシーが観測どおりか照合。ポリシーを削除せず、PUBLIC/anon/authenticatedのテーブル・列権限を一旦除いてauthenticatedの必要なSELECT/列INSERT/列UPDATEだけ戻す。service_roleは変更しない。適用後にRLS/6ポリシー/テーブル列実効権限・データ不変を確認する。
2. [進捗一意制約案](./sql/progress-unique-proposal.sql)：安全なACLを確定した後、別TXでUNIQUE(user_id,question_id)を追加。重複があればデータを保持して中断する。FK/列名/NULL可否を変えない。制約定義・重複0・データ不変を確認する。
3. 管理者を本人確認し、信頼できる管理接続から既存app_metadataを取得・保持したままcodestep_adminをJSON boolean trueへ変更する。user_metadataやトップレベルroleは使わない。対象ユーザー本人が再ログイン/更新し新JWTを得る。フラグだけで旧JWTを失効させたと説明しない。ここでもquestionsのACL停止は維持する。
4. [questions管理者RLS案](./sql/questions-admin-rls.sql)：最新の旧7ポリシー全文・ロール属性と照合して1TXで旧書込6件を管理者用3件へ置換し、公開SELECTと最小列権限を維持する。広いポリシーを残したまま権限だけ戻さない。本番ではstaging用の旧ポリシー再現/初期化スクリプトを使わない。
5. 4ポリシー/管理者条件の全文、RLS有効、anon SELECTのみ、authenticatedの5列I/U・DELETEと禁止列/TRUNCATE等なし、各データ不変・匿名HTTP閲覧を確認する。管理接続でのSELECT成功だけで利用者の権限を証明しない。本番書込試験なしでは本番CRUD成功を断定しない。

各SQLはBEGIN/COMMIT、ロック取得待ち5秒・各文30秒。**全体が30秒以内という保証ではない。** 排他ロック中は閲覧も短時間待機し得る。人間の確認待ちやAuth API呼出しをトランザクション内で行わない。SQLの実行先は呼出側で確認し、DB名postgresで判別しない。

進捗ACLと一意制約を別TXにした理由：一意制約の追加に失敗しても、先に成功した最小権限化を巻き戻さないため。いずれもデータ削除はしない。RLSは維持する。現在の本人6ポリシーが変わっていたら推測で置換しない。

### 既存データとの整合性とロールバックの限界

- 既存観測ではquestions2件、profiles1件、progress0件。進捗の重複ペア0・Authに対応しないprofile0を2026-10-15の前段READ ONLY集計で確認済み。**今回DBへ再照会した値ではないため適用直前に再確認する。** 対象IDや個人情報は公開資料に記録しない。
- SQL3本の原本ハッシュは今回も以下の値と一致。既存の16列、profiles.created_at、progressからprofiles/questionsへのNO ACTIONのFKを保つ。既存プロフィール名や問題本文を更新せず、進捗を削除/初期化しない。UNIQUEは進捗の重複だけを拒否し、自動整理はしない。対応しないprofileや重複が見つかれば、今回のSQLで修復せず別途判断する。
- 本番の本人限定6ポリシーをそのまま使うACL案と、UNIQUE案の**原本一括実行**は実DB未検証。stagingの最終権限・FK/制約・CRUD検証は根拠として再利用するが、本番用DOガードが実行成功した証明ではない。
- 旧7→4移行のDO・不一致中断・途中失敗/ロック競合時の複合ロールバックも実DB未検証。警告/ツールエラーの再送は行わず、このリスクを本番承認時に明示する。
- 3本は別々のTXであり、全工程を一括で取り消す仕組みではない。成功したACL/制約は次段階の失敗後も保持する。AuthフラグやVercel公開もSQLのROLLBACKでは戻らない。COMMIT結果不明時に「戻ったはず」と考えて再実行しない。

レビュー対象の原本SHA-256（呼出直前にファイルから読み直して照合。新しい2案は未承認）：

| ファイル | SHA-256 |
| --- | --- |
| questions-admin-rls.sql | `8cb9b9303631fbaa0b3b7ff69eb2be01562da9b81dcf254a4fac0d733defeec4` |
| progress-release-proposal.sql | `dadb38ecbcb5e7183a82e8436724fbbbb2587acd0aba2478023f1b51a19818ad` |
| progress-unique-proposal.sql | `2cb9f8cc60ee870e5f153f638f4ee614244e048583156bbc4c85f81f15113bed` |

## GitHub/Vercelへの反映順序

1. **設定確認**：16日のユーザー確認とAPI照合結果を使う。作業ブランチがproduction対象外でPreviewの共通2変数がstagingであることは確認済み。承認待ちの間に設定/ブランチ別上書きが変わったら再照合する。Previewに本番接続が混入した場合はそのままテストしない。設定の修正も承認後に行う。
2. **レビュー対象を確定**：npmのpackage-lock.jsonを正としNode24/npm11。VercelのInstall Commandは`npm ci`、Build Commandは検証済みの`npm run build -- --webpack`を候補とする。差分の必要ファイルだけ選択してコミットしSHAを記録する。`.env*`・資格情報・codestep_key_files.txtは含めず、`git add .`は使わない。
3. **作業ブランチだけをpush（実施済み）**：16日に承認済み3110162を`refs/heads/codex/admin-rls-portfolio`へ明示してpush成功。upstreamも同じ作業ブランチ。追加pushでもmain宛て・全ブランチ一括・forceを禁止する。今回の記録差分は追加pushしていない。
4. **Preview確認（主要機能は実施済み）**：上記のrepo/ref/SHA・非production・ドメイン・staging実保存を照合済み。残る実画面異常系はtest-plan.md末尾。失敗時は作業ブランチ内で修正し、追加pushが承認された範囲なら新SHAのPreviewを確認する。管理者用サーバーキーをNEXT_PUBLIC変数へ入れない。Previewの代わりにmainをpushしない。
5. **本番DB/Auth準備**：Preview成功後に上記SQL順序と管理者準備を承認範囲で実施・検証。1段階でも失敗/不明ならmainへの反映を止める。SQL/RLS/データの確認と、本番未検証リスクの判断が完了したことを記録する。
6. **main反映＝本番公開として承認**：最後に、確認した変更だけをmainへマージする操作と本番自動デプロイをセットで明示承認する。mainへの更新後に改めて公開ボタンを押す必要があるとは仮定しない。マージ後のSHA・Productionビルド・本番用接続先と公開URLを確認する。main直pushでPreview工程を飛ばさない。
7. **公開後の読取確認**：URL/匿名問題取得/表示を確認する。本番保存/管理CRUDの書込確認は別途明示された範囲だけ。Previewはstaging環境・Productionは本番環境なので、同じソースでも同じ成果物/動作が保証されたとは扱わない。stagingに接続したPreview成果物をそのまま本番へ昇格しない。

15日の照合作業はこの資料だけを更新した。16日の準備は文書記録を更新して必要ファイルのローカルコミットまでを対象とし、アプリ/SQL/テストの変更・再実行はしない。既存56件・実DB/API41件・Auth9件・ローカル実ブラウザ＋APIモック9件・クリーンビルドを維持し、Vercel/GitHubの設定・保護ルールは変更していない。

## 失敗時の安全な対応

| 失敗した段階 | 対応 |
| --- | --- |
| 進捗ACLのTXが失敗 | 元の広いACLが残り得る。ロールバック＝安全化成功とはしない。公開を進めず状態を確認し、権限修正の原因を調べる |
| 一意制約のTXが失敗 | 成功済みの最小ACLを維持。重複やロックを調査し、削除で解決しない。重複防止を保証して公開しない |
| questions切替のTXが失敗 | 直前のSELECTのみの停止状態を確認。危険な旧許可へ権限を戻さない。安全なRLSが確認できるまで管理書込停止を維持 |
| COMMIT/ツール応答が不明 | 再実行せず、対象ID・履歴・RLS・実効権限・制約・データ比較を読み取り確認。成功/失敗/ROLLBACKのいずれとも推測で決めない |
| 切替後に権限異常を発見 | 承認された緊急対応範囲でquestions-emergency-stop.sqlを使い公開SELECTを維持。進捗書込も止める必要があれば、別途承認のうえテーブル/列ACLの両方を停止する。RLS無効化や全員許可への復元は禁止 |
| 新画面のデプロイが失敗 | 安全なDB設定は保持し、Vercelの直前正常版へ戻す操作を承認範囲で行う。アプリの差し戻しとDB設定の差し戻しは別。制約をDROPして戻さない |

管理者解除は通常app_metadata:false＋新JWTで拒否確認。緊急時は旧JWTの有効期限を待つ代わりに、上記の書込停止を先に行う。失敗・拒否の後はAGENTS.mdの共通ルールに従い、同じ要求の再送や確認回避をしない。

参照：PostgreSQL 17の[行セキュリティ](https://www.postgresql.org/docs/17/ddl-rowsecurity.html)、[トランザクション](https://www.postgresql.org/docs/17/tutorial-transactions.html)、[ALTER TABLE](https://www.postgresql.org/docs/17/sql-altertable.html)。TRUNCATE等はRLSの対象外なので、本人RLSだけを根拠に不要なテーブル権限を残さない。Data APIにTRUNCATE用エンドポイントが存在すると確認したわけではない。


2026-10-19認証修正：入力配色/フォーム実値/SDK初期化/再送案内を改善。実端末での新規アカウント認証は再確認待ち。65件のローカル試験成功を実メール成功としない。main/本番の変更は禁止継続。


低優先：Supabase確認メールの日本語化・差出人ブランド化。必要時にSMTP/テンプレート/費用を検討する。現在は必須の管理デモと実メール認証の確認を優先し、勝手にメール設定や契約を変更しない。
