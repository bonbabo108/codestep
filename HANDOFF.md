# CodeStep 再開用の現在地

## 2026-10-21 12:55 JST：本人の最新決定／10月22日20:00提出を優先

- **今回の必須条件**：メールアドレス・パスワードで登録でき、ログインした利用者の正解済み問題・学習進捗がSupabaseに保存され、**同じアカウントならPC/スマホなど別端末から再ログインして復元できること**。ゲストの回答は保存しない。未回答・誤答の途中状態を保存済みとは言わない。
- **確認メールの位置づけを本人が変更**：確認メールの受信・リンクでの本人確認は、提出時の必須条件から**提出後の改善候補**へ変更する。Brevoなど外部SMTP・独自ドメイン・課金・新規アカウント導入は今回はしない。過去の「確認メール必須」判断は当時の記録として残し、この最新節を優先する。
- **認証と安全の区別**：本番のSignup ON / Confirm email OFF / custom SMTP OFFは変更せず利用する方針。これはメールアドレスの所有者本人であることを検証しないため、他人のアドレスを入力した登録や通知・パスワード復旧の問題が残る。**評価者に説明する改善点**として記録し、メール確認済みと表示しない。本番の新規登録とクロスデバイス復元は公開後に実機確認が必要。
- **提出の優先順位**：①管理者本人への正規Auth Admin APIによる限定権限付与と既存管理RLS/削除RPCの安全な本番適用（各々の明示承認後）、②PR #3の本番公開（明示承認後）、③メール/パスワード登録・本人進捗の保存→ログアウト→別端末ログインでの復元、使い捨て架空問題だけの管理CRUDの実機確認、④既存`codestep-portfolio` READMEを実態に合わせ一度だけ更新・提出、⑤短い本人説明。メールサービス追加・追加機能・既存77件の無意味な再試験を先行させない。
- **実行分担**：コード/資料/既存証拠照合はAIが先行。本人は本番Auth/DB/公開の重要承認、自分のアカウントへのログインや端末操作のみ。単独GUIの1クリックなら本人、複数画面横断の安全なGUI確認ならWorkが候補。ただしChat接続ブラウザは読取専用、WorkによるAuth Admin API実行は保証しない。秘密鍵・認証情報をチャット/公開コード/クラウドWorkへ転送しない。
- **期限**：2026-10-22（木）20:00 JST。残件が発生したら安全に動作する公開・進捗保存と提出物を優先し、達成できなかった機能を完成済みと表記しない。本番の危険操作に対する承認省略には使わない。


## 2026-10-21 追加：提出直前の独立確認・Auth Admin実行経路（読取のみ）

- GitHub PR #3の直近HEAD `972bf517aad70424610830a0eecdb589dd3fc223` はopen/draft/未マージ。該当コミットのGitHub Actions `Quality checks` はcompleted/success、Vercelのcommit statusもsuccess。**本番公開成功や実メール認証の証拠ではない**。アプリコード・SQLは今回変更せず、成功済み77件のテストを重複実行しない。
- 公式 [Supabase Auth Admin API](https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid) で、既存ユーザーを対象にサーバー側の `auth.admin.updateUserById(userId, { app_metadata: { ...現在値, codestep_admin: true } })` が使える。既存の `app_metadata` を読み、認証関連キーを保持して対象1ユーザーのみ変更し、**戻り値と再読取で検証**、本人が再ログイン/トークン更新する。実行前に本番環境と対象本人を再照合する。これは**方法の確認のみ**で、今回呼び出し・権限付与はしていない。
- 接続SupabaseコネクタにはAuth Admin APIの直接変更操作がない。ChatモードのBrowserは読取専用。Workモードは複数のGUI確認・提出資料の最終照合に適するが、今回ユーザー詳細Raw JSONは編集不可であり、**GUI操作だけで管理者指定できると保証しない**。service_role/secret keyをWorkクラウド、チャット、公開コード、ブラウザJS、`NEXT_PUBLIC_` に渡す代替案は採らない。必要時は本人が管理する信頼済みのローカル・サーバー側実行環境から、明示承認後に1回限定のAuth Admin操作を行う。直接 `auth.users` SQL UPDATEは代替しない。
- [SupabaseのSMTP仕様](https://supabase.com/docs/guides/auth/auth-smtp)：既定SMTPは組織の許可済みアドレスのみ（現行公式記載の送信上限は2通/時）。Confirm email OFF／Custom SMTP OFFのままでは、メンターの任意メールでの確認リンク受信という本人の要件は満たさない。Brevo中止は継続。確認メール要件を撤回したとは解釈せず、送信手段の外部契約・Auth変更は未承認のまま。
- [codestep-portfolio README](https://github.com/bonbabo108/codestep-portfolio/blob/main/README.md) の「62件」「進捗ACL/UNIQUE未適用」「URL localhost」等は現状より古い。既存の公開READMEを重複作成・途中上書きせず、公開条件と実機検証結果が確定してから1回で修正する。講座評価資料・説明資料は既存 `docs/evaluation-evidence.md` と `docs/mentor-notes.md` を再利用する。
- **次の本人ゲート**：①安全な本番Auth Admin API実行経路の確保と管理者指定への明示承認、②既存ハッシュ照合済みquestions RLS/削除RPCの本番適用承認、③任意宛先メール送信手段の本人判断・設定承認、④全条件成立後のPR #3マージ/本番公開承認、⑤公開後の本人実端末・実メール確認。機能拡張やバックアップ・過去SQL・staging実験の再実行は不要。課金・秘密入力はチャットに求めない。


更新：2026-10-21。恒久ルールは[AGENTS.md](./AGENTS.md)、改善・承認基準は[AI_WORKFLOW.md](./AI_WORKFLOW.md)。最新状態を本書へ集約し、詳細は[判断記録](./docs/decisions.md)。

## 2026-10-21 本番管理者移行：実行直前Read-only事前条件の追加照合

- 最新本人指示「次」を受け、本番管理者指定および管理RLS/RPC移行の独立事前調査を継続。**本番Auth/DB変更の承認とは解釈せず、データ書込は未実施**。
- 本番プロジェクト `xdnmlfoblqdygsnhkxxp` へREAD ONLYの事前条件照合を実行。以下の10条件が**すべてtrue**：既存questions 7ポリシー全文セットが`docs/sql/questions-admin-rls.sql`の前提と一致、questions RLS ON、private schema未作成、削除RPC未作成、anon INSERT/UPDATE/DELETE停止、authenticated INSERT/UPDATE/DELETE停止、Authユーザー1件、管理者0件、既存questions 2件維持、user_progress 0件。移行SQL原本2本のSHA-256は前段でレビューmanifestと一致確認済み。
- GitHub [PR #3](https://github.com/bonbabo108/codestep/pull/3) は引き続きDraft/mergeable、ベースmainは従前commit。最新確認した既存コミット`7d647fec`の`Quality checks`は`success`。以降の資料コミット分CI成功はコミットごとに再確認する。
- Supabase公式[Auth Admin API](https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid)に従い、権限付与は既存ユーザーの`app_metadata.codestep_admin=true`を**サーバー側Auth Admin API**でセット、ログイン済みJWTを更新する方式。接続MCPにはAuth Admin API動作がなく、現在のチャットブラウザは読取専用。**本番auth.usersを直接UPDATEして代替する案は採用しない**。個人のサービスキーをChatGPT/公開GitHub/ブラウザJSへ貼り付けることも不可。公式docsで認証情報を用いるサーバー側操作が必要であることを再確認。
- Vercelブラウザの既存ログイン済みOverviewは読み取り可能、MCP直接Vercelは以前から403。権限迂回しない。正常に管理APIを実行できる経路の確認が本人操作側の最初のゲート。管理者指定後に本人セッション更新を行い、レビュー済みRLS/RPCの適用・本番公開へ段階移行する。
- 認証確認メールは現行本番ではConfirm email OFF、Custom SMTP OFF。Brevo登録を再開しない。メール確認の本人要件を無断で撤回しない。

## 2026-10-21 AI先行一括実行：公開直前の一括ゲート（最新）

**本人の最新進め方**：「AIにできる仕事をすべて先行し、本人の手作業・確認だけを優先順位順に最後にまとめる」。停止している一つの操作を理由に独立作業を止めない。恒久判断はAGENTS.mdとAI_WORKFLOW.mdに反映済み。

**今回AIが完了したこと（読み取り／PR作業のみ）**
- 本番：public 3表RLS有効、questions 2件・profiles 1件・progress 0件。profiles/progressの2026-10-21適用済み2 migration確認。questions既存7ポリシー、anon/authenticatedともINSERT/UPDATE/DELETEは実効権限false、一般書込は安全に停止中。本番Authユーザー1件・管理者フラグtrueは0件。確認済みAuth設定はSignup ON・Confirm email OFF・独自SMTP OFF。
- GitHub：[PR #3](https://github.com/bonbabo108/codestep/pull/3) はDraft/open、main基準よりahead、mergeable。既存アプリの77テストと品質CI成功の根拠を再使用。Vercelステータス成功はGitHub連携由来で、本番公開済みを意味しない。Vercelの直接読取コネクタは403で今回も失敗、別スコープ迂回・資格情報探索はしない。
- 本番管理RLS SQLと削除RPC SQLの**SHA-256が既存の承認前レビューmanifestと2本とも完全一致**（8cb9b930… と 9ac28607…）。原本改変なし。stagingはquestions管理4ポリシーで既存の実DB管理CRUD成功を再利用。実staging再試験は今回行わない。
- AGENTS.md/AI_WORKFLOW.mdのバッチ運用ルール、docs/README.mdの適用済み表示、評価資料、講座完成基準、メンター説明文を安全に更新。**提出用ポートフォリオmain README**は公開文書のため未変更。旧「テスト62件」「本番URL未反映」「進捗制約未適用」「Previewの保護要否」等を、公開仕様確定後に一括更新する。既存公開READMEを削除/複製しない。

**追加の差分チェック**： PR全体155変更ファイル（文章Markdown23・画像49を含む）の**追加テキスト行のみ**を簡易秘密文字列パターン照合。明らかなAPIキー/JWT値の追加は検出されず、パスワード形式の候補1件は`scripts/staging-check.mjs`の**失敗を検証するダミー文字列**で、秘密値ではない。これはテキスト差分の限定検査であり、画像49件や全リポジトリ・実行環境内の秘密の完全な監査ではない。今回公開画像の追加・変更は行っていない。


**本人へまとめて依頼する残りのゲート（依存順。前段の安全な準備は完了）**
1. **管理者指定：本番Auth変更の本人承認＋正規実行経路の確保**。唯一の本人所有Authユーザーは既にバックアップと照合済みで再確認不要。`auth.admin.updateUserById`で既存app_metadataを保持して`codestep_admin:true`を付与する必要がある。接続SupabaseツールにAuth Admin APIはなく、ブラウザは読取専用。管理者の本人ログイン・JWT再取得は必要。秘密・パスワードはチャットに送らせない。未承認のDB直UPDATEで代用しない。
2. **本番DB移行：2本の権限/関数設定SQLへの実行承認**。作用対象はquestions 7→管理者限定4ポリシー＋限定GRANT、進捗を含む削除RPCの追加。既存行は削除しないが、権限・関数・排他ロックに本番変更リスク。今回ハッシュ一致済み原本と以前検証済み暗号化backupを再利用し、実行直前は対象/定義の**差分のみ**監査。適用結果と匿名/一般拒否を読取確認。
3. **本番公開：PR #3→mainのマージとVercel Productionへの反映を個別承認**（承認前はDraft）。本番Auth/RLSの前提と直前CI・rollback範囲を照合。現行mainは旧アプリのため、**未公開の管理画面での本番E2E操作をマージ前の完了条件とはしない**。Preview/stagingでの既存CRUD試験と本番旧画面の実操作を混同しない。
4. **公開後の本番実DB・実端末試験＋提出README最終更新**：公開URLで本人管理者ログイン/JWT更新→**使い捨て架空問題だけ**作成・編集・削除、本人成績の保存・再ログイン復元、PC/Androidの表示・操作を確認。メンター一般ログインは別権限を確認。初期2問や本人履歴を無断削除しない。AIができる公開検証を先に行い、本人には認証・スマホ・実メール受信確認のみ依頼。結果確認後、**既存の公開ポートフォリオREADME**を実状に合わせ1回だけ更新（公開操作の承認範囲内）。実機未確認はREADMEでも未確認と記載。
5. **メールについての採点上の未解決差分**：本人はBrevo登録の負担を避けたい意向。ただし「メンターが任意メールで確認リンクを受け取る」完成条件を正式に撤回したかは未確定。本番Signup ON/Confirm email OFFでは通常のメール/パスワード新規登録は可能な構成だがメール所有確認は行われない。標準SMTPは組織承認宛先以外への確認メールを送れない。採点用に本人確認を省略する妥協を**無断で完成扱いしない**。

**停止条件**：本番Auth Adminの正規手段なし、個別の権限・公開承認なし、実データ/メールの安全な確認なし。途中のブロックがあっても、独立した資料修正・PR品質確認を完了してから本人に一括提示。これまでの承認済み進捗ACL/UNIQUE/URL、バックアップの再作成や古いSQL再適用はしない。

## 2026-10-21 管理者機能・本番リリース再開時の読取確認（最新）

- 本人が「はい」と回答したため、**既存管理者CRUDと本番公開準備の読取監査**を実施。今回の返信は「準備を進める」同意であって、本番権限・DB変更やmainマージの個別承認ではない。
- [PR #3](https://github.com/bonbabo108/codestep/pull/3) は open/draft/mergeable、今回の調査開始時HEAD `ad622198acc0221216ab6e8e45534eddfb68e5b2`。同コミットのGitHub Actions `Quality checks`=success、Vercel status=success。本番のmainマージは未実施。
- 本番SQL READ ONLY：Auth総数1、`raw_app_meta_data->>'codestep_admin'='true'` の人数は**0**。questions RLS有効、既存7ポリシー、APIロール anon/authenticatedのINSERT/UPDATE/DELETE実効テーブル権限は**すべてfalse**。つまり現時点では管理者でも書込不可だが、一般利用者にも書込不可。既存問題データ変更なし。profiles/progressの本人限定RLSと2026-10-21済み2 migrationは保持。
- 既存画面 `app/admin/page.tsx` は `app/question/page.tsx` と同じ管理UIを使用。ログイン済み `app_metadata.codestep_admin===true` で管理画面を表示、実書込は `lib/questions.ts` と `public.questions` RLS・削除RPCで保護。機能の新規作り直し不要。staging questions RLSは4ポリシー、本番提案SQL原本 `docs/sql/questions-admin-rls.sql` と `questions-delete-production-proposal.sql` を確認。本番は両方未適用。
- [Supabase公式のAuth Admin API](https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid)はサーバー側の `auth.admin.updateUserById` から `app_metadata` を変更可能。service_role keyはブラウザ/フロント/チャット/GitHubに載せない。**現接続のSupabase操作ツールにAuth Admin API専用操作は存在しない**ため、正規の信頼できる実行手段がないままAuth表へ直接UPDATEする代替策は採らない。
- 安全な今後の順序：①本人所有の既存1アカウントを**正規Auth Admin API**で管理者指定（実行手段・本番Auth変更の承認が揃ってから）→②本人JWT更新と管理画面ガードを検証→③レビュー済みquestions RLSと削除RPCの本番移行（適用前差分と既存backupの照合、本人の変更承認）→④本人限定の**架空問題**で実DB CRUDを確認→⑤GitHub PRマージ/Productionリリースは直前の個別承認。Brevoの登録は中止し、実メール確認は未完了のまま完成済みと表記しない。
- 最新security advisorはパスワード漏洩保護OFFの既存WARN1件のみ。新規修正/適用なし。既存資料の古い「進捗ACL/UNIQUE未反映」「本番URL localhost」は履歴として扱う。

## 2026-10-21 本番SMTP設定の読取結果（確定）

- 本人が[本番Authentication → Emails → SMTP Settings](https://supabase.com/dashboard/project/xdnmlfoblqdygsnhkxxp/auth/smtp)を開き、接続ブラウザで読み取り確認。**Enable custom SMTP = OFF（チェックなし）**。既存の外部SMTP送信サービスは有効化されていない。本番Sign In / ProvidersではSignup ON、Email Enabled、Confirm email OFF（既読取）。
- 現状維持なら、メール所有確認を要求せず任意のメールアドレスとパスワードでの新規登録・ログインが可能な構成。ただし実際のメンター環境でのE2Eテストは未実施。**メール確認完了は未達**。確認メールが届いた過去の証拠はstaging Supabaseのものであり、本番/一般宛先の成功ではない。
- 本人の「楽したい」を追加アカウント・外部SMTPの手間削減希望として尊重する。Brevo登録は停止、無断で確認メール要件を正式撤回したと決めつけない。任意の受信可能なメールアドレスへの確認メール配送が完成条件として維持されるなら、Supabase標準SMTPの承認宛先制限により外部SMTP等が必要。評価条件との相違点を明示し、未検証を成功扱いしない。
- **本番SMTP/認証設定は読み取りのみで変更なし**。送信・新規ユーザー作成・課金・PR mainマージ・Production公開も未実施。

## 2026-10-21 訂正：Brevo保留でも既存SMTP設定は確認する

- 本人は、以前「Supabase SMTP設定を読取確認する」と案内されたのに「Brevoを使わないなら確認不要」と覆された矛盾を指摘。**後の『確認不要』はAIの誤案内で撤回**。Brevo登録の見送りと、既存Supabaseメール送信設定の読取確認は別物。
- 本人の「楽したい」は**追加アカウントや面倒な手続を省きたい希望**と扱い、「メンターが任意の受信可能メールで登録→確認メール受信→リンク認証→ログイン」を正式に撤回したとの**本人意思を勝手に確定しない**。Confirmation OFFのまま新規登録で済ませる暫定案は、要件を満たさない妥協であり、本人の同意なしに完成基準へ採用しない。
- 確認済み：本番SupabaseのSign In / ProvidersでSignup ON、Email Enabled、Confirm Email OFF。検証用では以前に確認メールを実受信。本番SMTP設定そのものは未確認。Browserタブ一覧では現在は`/auth/providers`のみが開いており、`/auth/smtp`は未表示。
- **次の一手**：設定変更やBrevo契約はせず、既存の[本番SMTP設定](https://supabase.com/dashboard/project/xdnmlfoblqdygsnhkxxp/auth/smtp)を読取確認し、すでに利用できる送信手段があるか調査。ない場合は標準メールの組織承認宛先制限の事実と、任意アドレスでの実メール確認の条件を正直に説明し、手間最小の候補を比較する。本番設定変更・mainマージは引き続き未実施。

## 2026-10-21 最新判断：Brevo登録を中止し、最小手間を優先

- 本人の明確な最新発言：「いややっぱなし、楽したい」。**Brevoの新規登録・外部SMTP選定・有料プラン・独自ドメイン準備は中止／保留**。本人が再度希望するまでアカウント作成を勧めない。
- 本番Supabaseは現行で Signup ON／Confirm email OFF／メールパスワード認証ON。追加サービスなしの**最小手間案**はこの現状を活かした登録→ログイン。ただし、**確認メールを受信→リンク認証**という先に本人が求めた完成条件は達成しない。ユーザーが「楽したい」と述べたことだけから評価要件の正式撤回・「確認メール不要」と断定しない。未解決トレードオフとして本人に短く説明する。
- 公開までの優先作業は、メール以外の既存課題（本番の実管理者CRUD／RLS／安全な反映・PRマージ・公開後動作確認）。既存デモ成功と実DB成功は混同しない。**本番管理者権限変更・SQL・公開マージは個別承認前に実施しない**。
- 注意：メール未確認の任意アドレスでアカウント登録できる現状は、本人性検証と迷惑登録への対処が弱い。公開時の制約として説明し、実証できない確認メールを完了済みと記載しない。

## 2026-10-21 本番Auth管理画面の実確認（現行設定）

- 本人が本番Supabaseの[Sign In / Providers](https://supabase.com/dashboard/project/xdnmlfoblqdygsnhkxxp/auth/providers)を開き、接続済みブラウザの読み取り専用情報から実際の設定を確認。**Allow new users to sign up=ON／Confirm email=OFF／Email provider=Enabled／Allow anonymous sign-ins=OFF／manual linking=OFF**。前回のConfirm email OFF記録と一致した。**本番の新規登録画面は使えるが確認メールが必須ではない**ため、本人のメンター評価完成条件（任意の実メールアドレス→確認メール→確認完了→ログイン）には達していない。設定は一切変更していない。
- [Supabase公式SMTP仕様](https://supabase.com/docs/guides/auth/auth-smtp)で標準送信先は組織承認済みアドレスのみ、SMTP設定画面は[Authentication SMTP](https://supabase.com/dashboard/project/xdnmlfoblqdygsnhkxxp/auth/smtp)。**SMTP設定はまだ画面実読取できていない**。次に本人がこのページを開いたあと接続ブラウザの読取で有無を確定し、必要時だけ選択肢を説明する。外部SMTP Brevoアカウント登録は保留。本番でのConfirm ON/メール送信/新規登録/PR mergeは未実施。

## 2026-10-21 標準メール送信の実績確認・外部SMTPの判断保留（最新調査）

- 本人は以前Supabaseだけでメールを受信した実績から、Brevo等の外部アカウント追加の必要性を疑問視。**Brevo登録は保留**。外部SMTPサービスのブランド/契約を決める前に、既存環境での検証結果・送信先制限・本人の必要条件を区別して説明する。
- Gmailの該当メール1通を読み取り専用で照合。**2026-10-17 04:18 UTC（13:18 JST）**「Confirm your email address」、送信元ドメイン `mail.app.supabase.io`、メール内の認証先は**staging `ezjzgebehancbxqpgany.supabase.co`**。本文や個人アドレス、トークンは転載・保存しない。これは検証環境からの受信の証拠であり、本番任意宛先の到達やリンク成功の証拠ではない。
- Supabase SQLの読取（Authユーザー数のみ）：本番`xdnmlfoblqdygsnhkxxp`は総数1、10/17〜18 UTCの新規作成0。stagingは総数13、同期間新規作成6。個人メール・生ログ・秘密は照会しない。本番Site URL `https://codestep-two.vercel.app` と Redirect URL `/login` の完全一致1件はログイン済みBrowserタブで再読取。
- [Supabase公式Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)の現行仕様：標準メールは組織の**承認済み宛先のみ**、少ないレート制限、他の任意宛先に一般配信する用途ではカスタムSMTPが必要。**本人の受信成功と矛盾しない**。評価者をSupabase組織メンバーに追加してメール許可する案は不要な権限付与のため採用しない。メールサービスの契約は現時点ではなし。2026-10-21時点で現行本番`Confirm email`の管理画面は今回直接再取得できず、前回確認のOFF記録は履歴扱い。
- NotebookLM「講座内容」（本人共有URL）は、ログイン済みBrowser read-onlyタブから**ソース一覧と認証・Supabaseの講義ファイル名を確認可能**になった。動画原文・全設問の確認済みとは扱わない。追加の原本再アップロードは求めない。
- **次の一手**：本番/検証用Supabase Authentication → Sign In / Providers（メール確認要否）とSMTP設定を正規GUIで読み取り再確認。メンターが任意の受信可能アドレスを使用する要件は維持。既存デフォルトの制限を超える場合のみ、本人承認でカスタムSMTPの最小案を比較する。本番変更・PRマージ・新規登録/送信は未実施。

## 2026-10-21 本人の最新完成条件：一般新規登録・確認メール・本番管理CRUD優先（最優先）

- **本人が前の「新規登録OFFの限定公開案」を撤回・訂正**。採点者が任意の受信可能なメールアドレスでアカウント作成→確認メール受信→リンク確認→通常ログインを一連で試せることを**本番公開の完成条件**とする。新規登録OFF・Confirm email OFFの公開は採用しない。コードのconfirm-email待ち/再送/セッションフローは既存実装を再利用。
- **独立SMTPが必要になった**。Supabase標準メールは組織で承認された宛先以外へ送れず2通/時のため、本人指定の任意メール受信テストに不適。無料のBrevo SMTP等を候補に、送信元確認と配信実験を経て本番**Confirm email ON**とする。2026-10-21時点ではサービス未接続、実メール成功未確認。新規契約・本人メール送信元登録・SMTP鍵の発行やダッシュボードへの秘密入力は本人の明示操作/承認が必要。鍵をチャット/GitHubに出さない。無料プランを超える課金はしない。
- **本物の管理者CRUDも公開前に確認できるようにする方針**。専用学習者として登録したメンターに管理権限を自動付与せず、既存の本人所有管理者アカウントを正規Auth Admin APIでapp_metadata指定してから、承認・検証済みquestions用RLS/RPCを限定適用。作成→編集→削除の実DB確認は個別に許可されたテストデータのみ。登録不要のメモリ内管理デモは維持。
- **公開工程**：既存暗号化backup/進捗ACL・UNIQUE/URL設定/CIを再利用 → SMTP取得とstagingまたは制限されたメール送信実験 → 本番SMTP設定/Confirm ON/新規登録ON（承認）→ 実メールで登録・確認・ログイン・再ログイン成功 → 本番管理者権限とquestionsの安全切替/実CRUD確認（承認）→ 提出用README整合 → 個別承認後PR #3→mainマージ→Vercel Production/本番動作確認。元の本番DBを消さない。最小限定公開案は新しい完成条件と矛盾するため採用しない。
- NotebookLMは本人に講義内容をまとめたノートがあると発言。本文は**未取得**。共有URLをもらえれば権限範囲で参照し、読めない場合は個人Driveの非公開資料を参照。講座資料を外部公開することは要求しない。

## 2026-10-21 最短公開条件の絞り込み（提案・未承認）

- **提出最短案を整理済み**：[公開判断と最小公開案](./docs/release-readiness.md)冒頭。既存の学習画面・登録不要デモCRUD・本人既存アカウントのログイン/進捗に用途を限定し、**本番questionsは書込停止のまま**にする。実管理者CRUD・新規利用者のメール確認は今回の本番対象から外す**提案**で、メンター配点を満額取得できると保証しない。
- **残る判断**：Confirm email OFFの本番で新規登録ONを続けないよう、新規登録OFFのGUI切替を推奨。ただし**本番Auth変更は未承認・未実行**。既存1アカウント所有の本人確認・暗号化backup復元照合・本番進捗ACL/UNIQUE・Auth URL修正は済んでおり再実行しない。
- **資料の不整合**：`codestep-portfolio/README.md`の「62テスト」「Auth URL localhost」「進捗ACL/UNIQUE未反映」は古い。READMEは公開repoのmain上なので**このレビューでは未編集**。公開仕様が確定したとき、既存READMEだけを最小更新する。
- **次の一手**：公開範囲の採点上の妥協と新規登録OFF案を具体的に説明し、**本番Auth変更時とmainマージ直前だけ個別承認**を求める。承認前はPR #3をDraftで維持し、Production・Auth・DBを触らない。独自SMTP/独自ドメイン/OAuth/新機能/再バックアップへ直行しない。
- **学習**：本人が説明すべき範囲は、学習画面とデモの違い、Supabase AuthとRLS、DB保存先、GitHub PR/CIとProductionの違い。各1問ずつ実画面に沿って行い、暗記や一括長文教材を求めない。

## 2026-10-21 課題完成のスコープ修正（最優先・本人の再確認）

- 参照：[**講座課題の完成基準と採点表の確認済み部分**](./docs/course-completion-policy.md)。本人は「転職支援カリキュラムの最終課題であり、商用サービスを作るつもりはない。必要な部分だけ早く完成し、無駄な往復や追加機能を止めたい」と繰り返し表明。**以後の判断はこのルールを先に適用する。** 機能提案時に再確認を求めない。
- 以前の「一般公開には独自SMTP必須」等は**不特定多数へ確認メールを送る場合の技術条件**であって、**課題として本番URLへマージし、評価を受けるための必須条件と自動的に同一視しない**。実際の講座評価シートにはメール/パスワード認証、OAuth上位評価の差がある。独自SMTP・送信ドメイン・OAuthは本人承認も要件もない段階で新規導入しない。
- 本番認証/管理者/RLS等の未完了は事実として保持するが、**そのすべてを点数最大化のために実装することを前提とせず**、評価への影響・既存デモで代用できる範囲・現実の本番セキュリティを分けて最短経路を再評価する。無断のDB/RLS/Auth弱体化、未確認の成功宣言、本番データ改変は不可。
- 2026-10-18評価シート画像5枚は本人が再共有。表示される配点とスクショの限界は上記ファイルに転記。個人情報を含む可能性がある原本画像はGitHubへ公開しない。
- **次の一手を修正**：追加のAPI導入/SMTP契約へ直行せず、まず既存の評価証拠・実装・リリース条件を「必須／加点狙い／不要」で短く切り分けて、本人の手間が最も少ない本番完成策を選ぶ。主機能の正しさと本番安全は維持。マージ/本番公開は個別承認を保留。

## 2026-10-21 本番準備の最新結果（以下の過去状態より優先）

- 本人の条件付きDB/Auth承認を受領。唯一の既存Authアカウントは本人所有との回答済み。暗号化backup内のIDと現在の唯一のIDの一致を非公開で確認し、同じ所有確認を質問し直さない。
- 非公開backupはGit外の `~/.codestep-private-backups/2026-10-21/`（0700、各ファイル0600）。本番内READ ONLYで3表全行/列/制約/RLS/ACL/所有者・対象Auth app_metadata/IDを公開鍵暗号化し保存。復号→隔離PostgreSQL17.5で全行/カタログ/Authメタデータ一致、本番17.6との適用前再照合も全true。Auth資格情報/セッションやHosted Supabase/PITR全体の復元試験ではない。
- HomebrewはmacOS27未対応で停止し、OS判定を回避していない。公式OpenPGP.js6.3.2/PGlite0.4.6をアプリ外 `/private/tmp/codestep-backup-tools` へ固定導入。`scripts/production-backup.mjs verify` は既存ファイルを上書きせず同じbackupの検証を再開可能。init/query/receiveは再実行しない。schema-restore.sqlは旧危険ACLも含む検証用で、本番へ一括復元禁止。
- **本番適用済みSQLは2本だけ**：`progress-release-proposal.sql`（migration `codestep_production_progress_acl_20261021`）→ `progress-unique-proposal.sql`（`codestep_production_progress_unique_20261021`）。各原本の承認ハッシュを新規要求前に照合。profiles/progressの本人6ポリシー・RLSを維持、anonの表/列権限なし、authenticatedはSELECTと必要列I/Uのみ、DELETE/TRUNCATE等なし。UNIQUE(user_id,question_id)確認、重複0。
- 適用後も全3表の全行はbackupと一致（profiles1/questions2/progress0）、対象Authも変更なし。catalog比較falseは上の意図したACL/UNIQUE差分。security advisorは漏洩パスワード保護OFFの既存警告1件、DB/RLSの追加警告なし。これは実利用者APIの書込試験ではない。
- **Auth URL反映済み**：Site URL `https://codestep-two.vercel.app`、Redirect URLsは同 `/login` 完全一致1件。GUI保存→再読込で一致。私的証跡 `/private/tmp/codestep-production-auth-after-20261021.jpg`。Confirm email OFF/独自SMTPなしを維持、新規メール/ユーザー作成なし。
- **管理者指定・questions RLS/RPCは未適用**：正規Auth Admin APIを実行する接続手段がなく、既存GUIのUsers詳細/Raw JSONも閲覧のみ。Authテーブル直接UPDATEや資格情報探索へ切り替えない。唯一の本人アカウントを既存app_metadata保持で管理者指定し、新JWTを本人が取得/検証できる正規手段を準備するまで、計画のquestions書込停止と残り2 SQLを保留。秘密をチャットへ送らせない。
- **main/Productionは未承認・未実行**。必要DB/Auth/SMTP・検証・最新CI/レビューが揃ったマージ直前に再確認する。SMTPはない/不明、新規契約/課金禁止。標準SMTPの事前承認宛先のみ・2通/時では一般公開の認証メールを完成扱いしない。
- 保存対象は本書/AI_WORKFLOW/公開計画/review manifest/判断・テスト記録/backup補助スクリプトだけ。同じ作業ブランチ・PR #3へまとめる。最終HEAD/未commitは実Gitで解決。鍵/backup/実データ/私的画像はcommitしない。
- **次の一手**：正規Auth Admin APIの利用手段とSMTPサービス/送信元の本人判断を解決する。既存2 SQLの再適用・backup作り直し・緊急停止/復旧試験・追加機能へ進まない。

## 2026-10-21 本番準備の読取観測（上の承認・条件を優先）

- 開始HEAD6d7eaf1/単一worktree/未commitなし。PR head6836a44の差分はHANDOFF/評価資料だけ3コミットと照合し、fast-forward済み。本人Androidのデモ評価は引き継ぎ記録で確認済み。コードは既存77テスト/CIを再利用、最新headの[CI成功](https://github.com/bonbabo108/codestep/actions/runs/39454790710)。PR #3=draft/open、競合なし・4 checks成功・レビュー0。GitHubの保護一覧/rulesetsは空で、設定は変更していない。
- 本番xdnmlfoblqdygsnhkxxp：2問題/1profile/進捗0/Auth1（確認済み1/admin0）、重複/孤児0、3表RLS/16列/NO ACTION FK。questionsは旧7ポリシー＋SELECTのみ。profiles/progressの匿名・一般に過大ACL/TRUNCATEが残る。UNIQUE/RPC/privateスキーマなし。
- Vercel Productionは現在main274eb79、Ready/dpl_7y4n5KfqLz8jHYn9KRh2SmTyDpjF、公開codestep-two.vercel.app。Production URL/公開キーは本番ref/anon/期限内、secretではないと値非記録で照合済み。変数変更不要。実チームはteam_ElBqxblU9glF6Lgu1Ekw0jzo、project prj_5yGFbE2rPl1XdsEje93egTHl01do。
- コネクタは正しい実scopeでも403、CLIなし。保護解除/資格情報探索/迂回はしない。既存の正規ログイン済みGUIで閲覧できる設定だけ読んだ。最初の照会はscope指定違いで訂正済み、権限復旧とは説明しない。
- **新しい公開前提**：本番Site URLはlocalhost、許可戻り先0、Confirm email OFF、独自SMTPなし。標準SMTPは一般宛先へ制限があるため、SMTP本体はブランド化と異なりメール認証公開の必須項目。認証OFFのまま完成扱いしない。
- **バックアップ未取得**：Free/no backups。非公開ローカルbackup取得/検証と復元手順を本番書込の前提へ設定。既存DBパスワードの本人による非表示入力等が必要になり得る。チャットへ資格情報を求めない。
- [最新の最小変更・保全・復旧・承認計画](./docs/release-readiness.md)と[本番レビューmanifest](./docs/production-release.review.json)を準備。RPCの本番用提案はコメント2行以外staging原本と同一。原本と既存承認は保持し、新しい本番承認だけを求める。
- 本番DB/Auth/権限・メール送信・ユーザー作成/削除・Vercel設定・mainマージは未実施。今回の読取でmigration履歴表がなく1照会が失敗したが、変更なし。後続は存在確認へ修正し、成功と混同しない。
- 当初の承認質問は回答受領済み。以後は最上段の未達条件だけを解決し、同じ承認質問を繰り返さない。

## 2026-10-21 本人の最新決定：本番公開が完成条件

本人は最終評価（PR・マージ・CI/CD・公開URL・実演）を踏まえ、Preview提出を終点にせず、既存アプリPR #3を安全にmainへマージし、Productionでアプリを動作確認できる状態を最優先とした。ローカルAI構築・追加のトークン節約設計は本番完成後に延期する。追加機能や評価点目的の実験を増やさない。

読取専用の2026-10-21現在地：staging DBはquestions=3/profiles=4/user_progress=4、Productionは2/1/0、3表ともRLS有効。stagingのquestionsは公開SELECT＋管理者I/U/Dの4ポリシー、本番は旧7ポリシー（authenticated write3・Demo public write3・公開read1）。Productionにはuser_progress(user_id,question_id)のUNIQUEがなく、delete_question_with_progress RPCもない。実効ACL・ロール権限・Auth URL・Production Vercel接続先・バックアップと復旧計画は本番変更前に照合する。実データのコピー・全件上書き禁止。

Vercelコネクタは対象チームに403で現在読み取り不可。既存の接続済みGUIまたはCodexの正規認証済みローカル手段で読み取りを優先し、アクセス制限の回避は禁止。今回DB書込・マージ・Production操作は未実施。

次はAGENTS/AI_WORKFLOW・docs/release-readiness.md既存案の再利用で本番向け限定差分とバックアップ・段階適用・停止/復旧手順を一括レビューし、対象とリスクと復元方法が明確になった時点で本人に**本番変更・mainマージ/Production公開の個別実行承認**をまとめて求める。未承認の高リスク操作だけ止め、独立した安全な事前検証は自律実行する。最終説明は短く、未確認を成功へ昇格させない。

## 現在の目的と今回の訂正

講座最終課題を完成し、本人が説明できる状態にする。本人のスマホ評価により「旧デモはCRUDできるが、本物と操作感が違う」と判明。旧デモの完成判断を訂正し、本物UI再利用へ変更した。[比較と証拠](./docs/admin-demo-parity.md)。今後も簡易版を別制作せず共通UI＋データ処理分離を優先する。

## 実Git・PRと保存状態

- cwdはcodestepルート、worktreeは1件、branch `codex/admin-rls-portfolio`。開始HEAD `f77050e079f471c4d965441ae89350413bdb4896`、開始statusは空。想定外差分なし、破棄なし。
- [既存アプリPR #3](https://github.com/bonbabo108/codestep/pull/3)はopen/draft/未マージ。今回も同PRへ集約。最新HEAD/statusは再開時に実Gitで確認する。
- 共通UIのコード/比較資料は`b07a65f77b6a789a8315a6f4baa4b855c941f2d6`でcommit/push済み。公開確認を記録する後続資料も同PRへ保存。最新HEAD/statusは実Gitで確認し、想定外差分を保持する。新たなPRは作らない。
- 提出用READMEは[既存portfolio PR #3](https://github.com/bonbabo108/codestep-portfolio/pull/3)、branch `codex/staging-auth-status-20261019`、前回確認commit `3fc35442d37ddfc04729833b8c5f5cd11e2b2ba9`。今回は移動/削除/重複作成していない。
- `codestep_key_files.txt`と既存画像は保持、Git対象へ追加しない。`git add .`禁止。

## 実装済み

- `components/QuestionManager.tsx`：実管理画面から抽出した共通フォーム/一覧/編集/取消/通知/進捗確認付きAlertDialog/操作lock。通常`/admin`と`/demo/admin`が同じUIを利用。ダブルクリックの第2送信を抑制し、16px入力色・44px操作領域を双方へ適用。
- `SiteHeader.tsx`：共通メニュー/レイアウト。通常は既存Auth表示、デモは小さなデモ表示。デモ内リンクは学習/管理デモへ留める。
- `QuestionRepository`：通常は既存Supabase CRUD/RPCへ委譲。デモは訪問単位のメモリのみ、架空3問/進捗1件、CRUD/関連進捗確認/再確認/リセット。学習・管理の遷移で共有、再読込/デモ外離脱で初期化。実Auth/DBを受け取らず、通常側へのフォールバックなし。
- 制限表示：実ログイン/権限変更/他ユーザーとの同時更新/DB通信障害は再現しない。操作できるふりをしない。
- 実Authガード、app_metadata.codestep_admin===true、SQL/RLS/RPC/管理者権限/本番環境は未変更。

## 検証済みと限界

- 最終ソースのnpm test **77件成功**（既存70＋repository7）、lint・typecheck・ダミーWebpackビルド成功。追加テストはCRUD/進捗再確認/隔離/abort/実SDK接続境界/権限拒否/デモ依存分離。
- PC幅1280/スマホ幅390：通常UI＋架空Auth/APIとデモの画像/CRUD/編集・取消/通知を比較。PC列幅・フォーム種類一致。スマホ双方390=scrollWidth390、セクション350px、入力16px/同じ文字色。
- 通常UI＋モックで保存拒否時の入力保持、900ms保存中の操作禁止、履歴確認拒否時の削除禁止、匿名/一般の管理フォーム拒否。デモCRUD/進捗削除/リセット中のAuth/Data追加要求0。PCダブルクリックも作成1件/成功通知。
- 学習正解→デモ管理へ戻ると関連進捗の警告を表示。再読み込み/リセットで初期化。
- [画像と範囲](./docs/admin-demo-parity.md)、[テスト記録](./docs/test-plan.md)。旧2026-10-19画像/70件成功は履歴で、現在UIの比較証拠は2026-10-20を参照。
- **2026-10-21の本人Android確認：** 修正版の公開管理画面デモについて、前版から改善し操作感に問題ないとの本人報告を受領。本人報告の範囲は管理デモであり、実staging管理者ログイン・実DB CRUD・修正後の実メール認証まで成功した根拠ではない。
- **実staging管理者での最新画面/実DB CRUD再確認は未実施**。Chromeに有効セッションがなく、一時資格情報も残っていない。本人へ既存管理者でのログインを依頼済み。認証迂回/アカウント作成/パスワード変更はしていない。本人の返答がなければ同じ質問やDB調査を繰り返さない。
- 通常UIの最新証拠は架空API。2026-10-17の実staging CRUD/RLS結果を再利用するが、今回実DBを再検証したとは説明しない。

## 環境・残存プロセス

- 固定staging：[管理デモ](https://codestep-git-codex-admin-rls-portfolio-touya1896-7818s-projects.vercel.app/demo/admin)。公開例外はこの1hostnameだけ。今回公開範囲変更なし。
- staging Supabase `ezjzgebehancbxqpgany`、本番 `xdnmlfoblqdygsnhkxxp`。[本番](https://codestep-two.vercel.app)は旧main、今回触れない。
- `.env.local`は本番。ローカルは公開変数を127.0.0.1:54321/local-test-placeholderへ上書きしてbuild。
- 再利用用`npm run verify:admin-ui`：実接続ビルドを拒否し、ループバックだけで架空Auth/Data＋Next3100を起動。今回のランチャー停止後、3100/54321のLISTENなしを確認。再起動は[比較資料](./docs/admin-demo-parity.md)の手順。古い一時ファイルやトークンは再開の必須依存にしない。

## 未確認・承認と次の一手

1. コード[CI成功](https://github.com/bonbabo108/codestep/actions/runs/39364164572)、[Preview Ready](https://vercel.com/touya1896-7818s-projects/codestep/3KQPoc6DfR1NHA1Ks4HhRVFdsaqC)、固定stagingの新UI/PC追加・390px編集/削除/リセットを確認済み。本人Androidの管理デモ操作感は確認済み。次は実管理画面への既存管理者ログイン後の比較と認証確認。main/本番へ進めない。
2. 本人が既存管理者でログイン済みになれば、実画面比較を追加する。資格情報はチャット/公開資料へ保存しない。
3. [認証の8項目](./docs/auth-release-checklist.md)：修正後の新しいアカウントによるAndroid/PC実メール確認・ログイン・再読込維持・再送後確認・dark/autofillは本人結果が未確認。以前のメール受信/別アカウント成功と混同しない。
4. 本人の技術説明確認（Androidでの管理デモ操作感は本人確認済み）。OAuth・独立外部API・画像/音声入力は未実装、満点達成と説明しない。メール日本語化/差出人ブランド化は低優先。
5. 本番DB/Auth/RLS/ACL/RPC/制約への反映・mainマージ/Productionは上の最新計画の明示承認待ち。[公開前提](./docs/release-readiness.md)。緊急停止/復旧・旧7→4試験は再開禁止。

安全な通常編集・仮API/テスト・作業ブランチcommit/push・既存PR更新・通常stagingデプロイは包括承認済み。高リスクとツール自体の許可は正規に扱う。再開時はAGENTS→AI_WORKFLOW→本書と実Git/PR/プロセスを照合し、差分と未完了から継続する。
