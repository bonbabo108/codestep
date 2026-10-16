# 公開判断とPreview準備（2026-10-16更新）

ローカル機能は公開候補。本番はまだ公開承認前で、追加DB/Auth変更・push・デプロイはしていない。以下の順序で判断する。旧7ポリシー再現試験の再送は前提にしない。最新テスト結果はtest-plan.md末尾。

## 最新：Preview限定pushの承認準備（2026-10-16）

- ユーザーがPCで確認：Production Branchはmain、他の未割当ブランチはPreview対象。Preview専用のSupabase変数2件を登録済みでProduction設定は未変更との報告。この情報はユーザー確認を根拠とし、前日の403で未取得だった設定を取得済みと偽らない。
- Vercel APIの読み取りで、対象codestepプロジェクトのNEXT_PUBLIC_SUPABASE_URLとNEXT_PUBLIC_SUPABASE_ANON_KEYがtarget=previewだけで登録され、今回の作業ブランチ固有の上書きがないことを確認。URLはstagingのルートと完全一致（末尾スラッシュのみ許容）、/rest/v1/・追加パス・クエリ等なし。キーはSupabaseが返す同じstagingの有効な公開キーとメモリ内で完全照合した。値/ハッシュ/ユーザー情報を出力・保存していない。
- ブランチ別検索だけでは共通Preview変数が0件だったため、非復号のメタデータから共通Preview2件を選び、その2件だけを復号して照合した。Productionの値は復号していない。ツール実行環境にURL APIがなかったため、途中のパース不可判定は撤回し、正規のstagingルート文字列との完全照合で再検証した。実値の不備ではなかった。
- アプリ/テスト/ビルド設定31ファイルは前日のクリーン検証コピーとハッシュ一致、変更0。56件・型検査・クリーンビルド・既存実DB試験の結果を再利用し、無駄な再テストをしない。レビューした必要ファイルだけをローカルコミット対象とし、秘密・資格情報・既存codestep_key_files.txtを除外する。
- **次の承認対象は、originのrefs/heads/codex/admin-rls-portfolioへのpushと、それに伴うcodestepのPreview自動ビルド/作成だけ。** 未割当ブランチというユーザー確認を前提に、main反映/本番昇格を含めない。承認後もブランチ・コミットSHA・push先を直前照合し、作成後のtarget=preview/ref/SHA/staging接続を確認する。コミット成否とSHAは今回の実行報告・git logを参照する。

Preview作成により非本番のビルドが起動し、Preview URLが発行される想定。SQLはdocs内の案なのでpushやビルドだけで適用されない。stagingのデータ変更も、Previewを作成するだけでは発生させない。Production設定の編集・課金・mainへのpush/マージ・本番DB/Auth変更は今回も禁止。

## PCで確認・承認すること（優先順）

1. **画面と管理者本人の確認**：READMEのstaging画像とアプリの権限/保存動作を確認する。本番の最初の管理者をAuthユーザー詳細で本人確認し、対象IDを指定する。推測しない。ID・メール・鍵を公開資料へ書かない。
2. **作業ブランチのpush/Preview承認**：Production Branch/未割当ブランチの扱いはユーザー確認済み、Preview接続先2件はAPI照合済み（2026-10-16）。必要ファイルのローカルコミット後、今回報告するSHAを作業ブランチだけへpushする承認を判断する。mainへのpush/マージ/本番昇格は含まない。
3. **DB/Auth反映と本番公開の判断**：Preview成功後、下記SQL3本と対象、管理者フラグ付与、未検証リスクを確認する。進捗ACL→一意制約→管理者指定/JWT更新→questions管理者RLSの順に、段階ごとに検証する。全て揃ってからmainへの反映/本番自動デプロイを明示承認する。結果不明なら次へ進めない。本番書込試験を暗黙で含めず、必要なら架空データの対象/操作/後片付けを別途明示する。

現在の制約では上記を実行しない。安全な作業の承認を重ねて求めず、この単位で判断できるようにする。メンター提出には制作者本人がmentor-notes.mdの5問を説明できることも確認する。

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
3. **作業ブランチだけをpush**：承認後も現在ブランチを確認し、push先refを`refs/heads/codex/admin-rls-portfolio`と明示する。省略したpush、main宛て、全ブランチ一括、force pushは行わない。upstream未設定なので、既存の追跡先があるという前提で操作しない。現時点ではpushコマンドを実行していない。
4. **Preview確認**：必要なら未マージのPRでレビューし、Vercelのtarget=preview・対象repo/ref/SHA・公開先ドメイン・staging接続を照合。認証/DB出題/本人保存/復元/管理UIを検証する。失敗時は作業ブランチ内で修正し、更新したSHAのPreviewを確認する。管理者用サーバーキーをNEXT_PUBLIC変数へ入れない。Previewが作成されない場合も、mainをpushして代用しない。
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
