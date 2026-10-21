# 公開判断とPreview準備（2026-10-16更新）

## 2026-10-21 12:55 JST：本人の最新決定／10月22日20:00提出を優先

- **今回の必須条件**：メールアドレス・パスワードで登録でき、ログインした利用者の正解済み問題・学習進捗がSupabaseに保存され、**同じアカウントならPC/スマホなど別端末から再ログインして復元できること**。ゲストの回答は保存しない。未回答・誤答の途中状態を保存済みとは言わない。
- **確認メールの位置づけを本人が変更**：確認メールの受信・リンクでの本人確認は、提出時の必須条件から**提出後の改善候補**へ変更する。Brevoなど外部SMTP・独自ドメイン・課金・新規アカウント導入は今回はしない。過去の「確認メール必須」判断は当時の記録として残し、この最新節を優先する。
- **認証と安全の区別**：本番のSignup ON / Confirm email OFF / custom SMTP OFFは変更せず利用する方針。これはメールアドレスの所有者本人であることを検証しないため、他人のアドレスを入力した登録や通知・パスワード復旧の問題が残る。**評価者に説明する改善点**として記録し、メール確認済みと表示しない。本番の新規登録とクロスデバイス復元は公開後に実機確認が必要。
- **提出の優先順位**：①管理者本人への正規Auth Admin APIによる限定権限付与と既存管理RLS/削除RPCの安全な本番適用（各々の明示承認後）、②PR #3の本番公開（明示承認後）、③メール/パスワード登録・本人進捗の保存→ログアウト→別端末ログインでの復元、使い捨て架空問題だけの管理CRUDの実機確認、④既存`codestep-portfolio` READMEを実態に合わせ一度だけ更新・提出、⑤短い本人説明。メールサービス追加・追加機能・既存77件の無意味な再試験を先行させない。
- **実行分担**：コード/資料/既存証拠照合はAIが先行。本人は本番Auth/DB/公開の重要承認、自分のアカウントへのログインや端末操作のみ。単独GUIの1クリックなら本人、複数画面横断の安全なGUI確認ならWorkが候補。ただしChat接続ブラウザは読取専用、WorkによるAuth Admin API実行は保証しない。秘密鍵・認証情報をチャット/公開コード/クラウドWorkへ転送しない。
- **期限**：2026-10-22（木）20:00 JST。残件が発生したら安全に動作する公開・進捗保存と提出物を優先し、達成できなかった機能を完成済みと表記しない。本番の危険操作に対する承認省略には使わない。


## 2026-10-21 既存メール実績・本番未検証の区別（最新版）

**実測で確認したこと**：Gmailに2026-10-17に届いた「Confirm your email address」の確認メールは、本文の認証サーバー参照からstaging Supabase（`ezjzgebehancbxqpgany`）のものと特定。メールは本当に届いていたが、本番（`xdnmlfoblqdygsnhkxxp`）からの送信やメンターの任意宛先への配信実績はない。本番Auth1件（10/17〜18 UTC新規0）、staging Auth13件（同期間新規6件）の集計も読み取りで確認。メールの生本文・アドレス・トークンは記録しない。

**変更しないこと**：外部メールサービスBrevoは**当面登録保留**。以前メールが届いた実績を否定したり、即アカウント開設を要求したりしない。一般の任意のメール宛先に送る場合だけ、[Supabase標準メールの宛先制限](https://supabase.com/docs/guides/auth/auth-smtp)を満たす追加SMTPが必要になる。組織メンバー追加による配信許可は権限拡大のため不採用。現在の本番Confirm emailのGUI設定は今回未読取で、過去OFF記録を最新確認済みと混同しない。Supabase本番Auth URLの再読取では公開originと`/login`完全一致を確認。

**次の確認**：本番とstagingのメール/パスワード認証・Confirm email/SignupおよびSMTP有効状態を正規GUIで照合してから、既存の送信手段でメンターの任意アドレスに送れるか判断する。メンターによる登録→実受信→確認リンク→ログインの完成条件はそのまま。メール送信・Auth設定変更・公開マージは直前承認までは未実施。NotebookLM「講座内容」はログイン済みBrowserで認証/Supabase教材の**ソース一覧**まで閲覧可能、全講義内容の確認は未実施。

## 2026-10-21 本人の公開完成条件の更新（旧・新規登録OFF案に優先）

本人の最新指示：**採点者が受信可能な任意のメールアドレスで新規登録→確認メール受信→リンクで本人確認→ログインし、問題を解けること。管理者の実CRUDも評価で実演できるようにする。** そのため、直下に残す「新規登録OFF、実管理者操作はデモのみ」の**以前のAI提案は撤回・非採用**。講座課題以上の商用品質を要求するわけではないが、実際に評価者が操作できる機能を縮小しない。承認境界・記録・本番データ保護は維持。

- **メール**：Supabase標準SMTPは組織の承認宛先だけ/2通毎時。一般宛先への送信には本人がSMTP送信サービスを用意し、Supabaseの本番Custom SMTP設定へ安全に入力する必要がある。低コスト候補として無料Brevo SMTP（公表300通/日）を調査。ただし送信元検証、差出人置換、配信事業者の審査/制限、Gmail等の受信先での到達率を未検証。**無料＝確実な配信ではない**。本人専用テスト宛先で実送信・到着・リンク確認を先に検証。実メール確認のため本番Confirm email ON/Allow new users to sign up ONを要し、適用は本番設定の個別承認後のみ。受信リンク・鍵・パスワードを公開しない。
- **管理者**：一般登録者が管理者にならないよう、正規Auth Admin APIで本人所有の既存アカウントだけに`app_metadata.codestep_admin=true`を設定、新JWTを確認。次いでレビュー済みquestions admin RLS→削除RPC SQLを対象/順序限定で適用。本番SQLは未承認・未実行。通常アカウントの拒否、本人管理者の作成/編集/削除を使い捨てテスト問題のみで実証。危険な旧RLS・ACLへ戻さない。
- **動作確認の順番**：メール送信サービスの契約/設定準備 → stagingで実認証フロー → 本番Auth/権限の承認済み安全変更 → 本番の登録・受信・認証・再ログインと管理者CRUDの限定確認 → README更新（唯一の提出先`bonbabo108/codestep-portfolio`） → **PR Draft解除・mainマージ・Production自動公開の個別承認** → 公開URLで最終確認。現時点でVercelコネクタはチームscope 403、ログイン済みBrowserの読取画面とGitHub PR/CIは参照可能。Vercel権限の迂回をしない。
- **原則**：既存backup/移行SQL/テストを再利用、受講者本人の講座範囲・説明可能性を維持、課金やドメイン購入は無断でしない。SMTP取得が不能なら事実を報告し、未確認メールで登録成功と虚偽表示しない。

参照：[Supabase Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)、[Password-based Auth](https://supabase.com/docs/guides/auth/passwords)、[Brevo SMTP](https://help.brevo.com/hc/en-us/articles/7924908994450-Send-transactional-emails-using-Brevo-SMTP)、[Brevo無料プラン](https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans)。


## 2026-10-21 講座課題限定の最短公開案（AIの提案・本番未実行）

**位置づけ：** [本人の完成基準](./course-completion-policy.md)と[評価証拠](./evaluation-evidence.md)に沿った、低工数・低リスクの**提案**。本人による本番変更・mainマージの承認ではない。この節を、下に残した「一般利用者向けメール認証/実管理CRUDまで公開する」従来の広い公開条件より先に判断する。後段の本番適用履歴・バックアップ・禁止事項は引き続き有効。課題の採点最低条件は未確認であり、メンターの最終判断を推測しない。

### 採用候補：提出用に機能を限定してProductionへ反映

- **本番で利用する：** 公開学習問題の閲覧・正誤判定、既存の本人所有アカウントによるメール/パスワードログインと本人進捗の保存・復元（本番実機確認は未実施）、登録不要の `/demo`・`/demo/admin`。デモのCRUDはメモリ内の架空データで実DBに書かない。
- **今回は本番提供しない：** 新規一般ユーザーのメール所有確認・確認メールフロー、実管理者による問題の作成/編集/削除。questionsは現行の**書込停止（APIロールSELECTのみ）を維持**し、管理者フラグ、questions RLS切替、削除RPCの未適用をそのまま区別する。既存stagingのCRUD/RLS証拠と本番実動作を混同しない。
- **新規登録の安全対策案：** 本番でConfirm email OFFのまま新規登録ONなら、未確認のメールアドレスでアカウントが作成できる。課題用に限定するなら**Supabase Authの「Allow new users to sign up」をOFFにして既存アカウントのみサインイン可**とする案が最小。これは本番Authの変更であり**操作直前に本人の明示承認が必要**。OFFの間は新規登録が動かず、UI上の登録入口にも制約が残る。採点に影響し得るため、READMEに説明する。OFFを戻せるが、確認OFFのまま再び公開登録を可能にする危険を伴うため自動復元しない。
- **省略：** 独自SMTP/独自ドメイン/OAuth/生成AI API/新ツール/管理者用新API/大規模UI改修/同じバックアップの再取得/緊急停止・復旧試験。SMTPは**不特定多数への確認メールが必要な構成なら必要**だが、今回はその構成を採らない。Confirm email OFFのまま「メール本人確認まで成功」とは表示しない。

### 公開までの最短ゲート（本番設定・公開は未承認）

1. **事前の読み取り照合**：最新ブランチSHAと成功CI、PR状態、VercelのProduction接続先・公開キー・Preview、DBのquestions書込停止、profiles/progressの本人RLS/限定ACL/UNIQUE、既存Auth所有者を確認。2026-10-21実施済みの暗号化バックアップ/復元照合は再利用し、ユーザー所有の1アカウント確認を繰り返さない。変化があれば停止。
2. **制限案を選ぶ場合だけ**：本番Authの新規登録OFFを個別承認後にGUIで反映・再読込。既存ユーザーのログインを維持し、管理者フラグやRLS、メール確認の有効/無効、パスワードやトークンは変更しない。
3. **提出用README整合**：既存の`codestep-portfolio/README.md`のみを更新する。現行の古い「62テスト」「両Auth URL localhost/未反映」「進捗ACL/UNIQUE未反映」を最新の根拠に合わせて直し、Productionで提供する機能と**Preview/stagingまたはデモのみ**を明記。今回のレビュー段階では他repoのmain/公開READMEをまだ編集しない。
4. **マージ直前の承認**：残る制限と評価上の減点可能性、成功CI/Preview、rollbackの境界を提示し、PR #3のready化/mainマージおよびProduction自動公開の**個別承認**を受ける。承認前にdraftを外さない。
5. **公開直後の限定確認**：本番URL、匿名問題表示・判定、デモのCRUD/初期化、一般ユーザーが管理操作できないことを確認。本人既存アカウントでのログイン/再読込/本人進捗は、本人が通常画面で確認するか実データへの書込対象と復旧方法の承認後に実施。モック成功だけを本番成功としない。

**採点との交換条件：** 説明可能性、README、設計、学習UI、登録不要の管理デモ、staging CRUD/RLS、CIは既存証拠で示せる。一方、本番の新規登録/メール所有確認、本番管理者CRUDは示せない。評価表の認証・CRUD項目が本番実操作を必須と判断されたら、この最小案は再検討する。得点の満額を保証しない。

**復旧と停止：** マージ前ならDraftのまま旧Productionを維持。登録OFFはGUIから再設定できるが、自動でONへ戻さない。マージ後の旧Productionへの復帰は別承認で判断し、DB/Auth設定がアプリの巻き戻しだけでは戻らない点に注意。DBの既存ACL/RLS/制約を危険な状態へ戻さず、本番書込テストや新規Auth作成・既存データ削除を無断実施しない。

**根拠**：[本人完成基準](./course-completion-policy.md)、[最新HANDOFF](../HANDOFF.md)、[採点証拠](./evaluation-evidence.md)。Supabase公式[Auth基本設定](https://supabase.com/docs/guides/auth/general-configuration)（登録OFF=既存のみサインイン、確認OFF=メール未検証でもサインイン）、[標準SMTPの制限](https://supabase.com/docs/guides/auth/auth-smtp)（事前承認宛先・低い送信上限）。NotebookLMの原文は未照合。



## 2026-10-21 本番公開計画（DB/Auth条件付き承認・2 SQLとURL反映済み）

**最新の本人判断：** DB/Auth変更は「本人所有の対象アカウント照合」と「非公開バックアップの取得・整合性・復元可能性の検証」完了が条件。既存1アカウントは本人所有との回答済みで、対象IDを暗号化backupと本番の間で非公開照合した。main/Productionは現時点では未承認で、条件成立後のマージ直前に再確認する。SMTPはない/不明、新規契約・課金は禁止。

**最新のバックアップ結果（条件成立）：** HomebrewのmacOS27未対応を迂回せず、公式OpenPGP.js6.3.2とPostgreSQL17.5のPGlite0.4.6をアプリ外へ導入。本番内READ ONLYで暗号化した3表全行・列/制約/RLS/ACL/所有者・対象Auth app_metadata/IDを、Git外の非公開0700/0600へ保存した。復号→隔離PostgreSQL復元で全行とカタログ一致、Authメタデータの復元一致を確認。本番との再照合もdata/catalog/target_auth全true。既存trigger/追加index/public独自関数0。本番17.6と同メジャーの復元であり、Supabase/PITRやAuth資格情報全体の復旧実証ではない。今回変更しないパスワード/セッションは取得していない。以下のpg_dump案は代替方式採用前の案で、実際の手順は`scripts/production-backup.mjs`のinit→query（本番READ ONLYで暗号化）→receive→verify。SMTPとmain承認は未達のまま。

**段階適用結果：** 本番でACL縮小→進捗ペアUNIQUEの2 migrationは成功。本人限定6ポリシー/RLSを保持し、匿名の表/列権限を除去、一般ログインは必要SELECT/列I/Uのみ。適用後も3表の全行と対象Authはbackupと一致（1/2/0件、重複0）。Site URLを公開origin、許可戻り先を同/loginの完全一致1件へ変更し、再読込確認した。questionsのRLS/RPC・管理者指定は未適用。正規Auth Admin APIの実行手段がなく、GUIもメタデータ閲覧のみのため、Auth直接SQL/秘密探索で代用しない。管理者の新JWT確認まではquestions書込停止を保持する。security advisorの既存WARNは漏洩パスワード保護OFFの1件。実DB CRUD/実メールは未試験。

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
| バックアップ | Supabase Free、自動backupなし。今回の非公開暗号化export/隔離PG17復元検証は成功 | 上の検証結果を再利用し、変更後に同名で取得し直さない |

Vercel照会の最初のteam指定は実チームと異なったため、既存の正規ログイン画面で実IDを確認して訂正した。訂正後も403。再試行/保護解除/トークン探索は中止し、既存ログイン済み画面で閲覧可能な項目だけを確認した。環境変数は照合後再マスク、値の記録なし。GUIで見えることをMCP権限復旧と説明しない。

本番Authの独自SMTP未設定は公開時の新しい必須残件。Supabaseの[標準メール仕様](https://supabase.com/docs/guides/auth/auth-smtp)では宛先が組織の事前承認済みアドレスへ制限され、一般利用者向けに独自SMTPが必要。従来の「メール日本語化・ブランド化は低優先」とは区別する。サービス/送信元・費用・認証情報は未指定なので勝手に契約/設定しない。確認OFFのままでメール認証完成とはしない。

### データ保全・バックアップ（取得・復元検証済み）

- 実手順は `scripts/production-backup.mjs` のinit→query→receive→verify。queryは固定本番向けREAD ONLYの暗号化SQL生成だけ、verifyはローカル専用メモリへの復元だけ。本番へ復元/書込する機能はない。暗号化の整合性と本番現況の一致、全行とDDL/ACL等の一致を確認した。
- 非公開保存先は `~/.codestep-private-backups/2026-10-21/`（0700/0600）。秘密鍵/暗号化backup/schema-restore.sql/verification.jsonを保持し、公開・commit・一括削除しない。復元には暗号化backupと秘密鍵の両方が必要。同一端末の非公開ローカル保全であり、端末喪失対策やPITRの保証ではない。
- 一時依存が消えた場合はアプリ外 `/private/tmp/codestep-backup-tools` へ `openpgp@6.3.2` と `@electric-sql/pglite@0.4.6` を固定導入してverifyだけ再開する。新しい鍵/backupの生成・既存上書きをしない。
- Authは対象ID/app_metadataと変更前URL設定だけを保全。パスワード/セッション/鍵は変更対象でなく取得しない。全Authシステムの復元実証とは説明しない。
- 復元SQLは旧過大ACLも含む比較検証資料。本番へそのまま適用禁止。必要な実復元は新規更新とbackupを比較し、対象行/メタデータだけを別レビュー・明示承認で復元する。安全化した権限を広い旧設定へ戻さない。

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

### 残る本人の判断・操作

- DB/Authの既存条件付き承認は受領済み。本人所有とbackup条件も成立済みで、再承認を繰り返さない。残る管理者指定は正規Auth Admin APIの実行手段、新JWT取得の本人操作が必要。秘密値をチャットへ出さない。
- SMTPは未契約/不明のまま。公開条件は本人が使えるサービス/送信元（必要なドメイン認証含む）と正規の秘密設定、一般宛先への配信確認、その後のConfirm email ONと実PC/スマホ認証確認。[標準SMTPの制約](https://supabase.com/docs/guides/auth/auth-smtp)：事前承認された宛先のみ、現在2通/時。契約や課金は今回実行しない。
- 上の公開条件・必要DB設定・検証・最新CI/レビューが揃った**マージ直前**にmain/Production承認を求める。今はマージ/Production更新をしない。

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
