# メール認証の修正と公開前設定

## 最新：Androidでの再テスト（修正後の本人確認待ち）

固定staging：[CodeStepログイン](https://codestep-git-codex-admin-rls-portfolio-touya1896-7818s-projects.vercel.app/login)。検証用Supabaseのメール確認を維持し、本番には反映しない。

1. AndroidのChromeで上のURLを開き、ページを再読み込みする。メール欄の文字とパスワードの●が見えるか確認する。「パスワードを表示する」で入力間違いも確認できる。端末の通常設定とダークモードの両方を試す。
2. 今回失敗したアカウントを復旧する場合：「確認メールが届かない・リンクを開けない方」→登録したメールアドレス（+部分も同じ）を入力→「確認メールを再送する」。パスワードは不要。送信制限の案内が出たら、その時間を待つ。連打や同じアドレスでの再登録はしない。
3. 新規登録の確認には、未使用の受信可能なメールアドレス/新しい+エイリアスを使う。「初めての方はこちら（新規登録）」→メールと6文字以上のパスワード→「登録して始める」。確認待ちの表示が出たら、メールを待つ。
4. Gmailの会話表示を展開し、いちばん新しく届いたメールの時刻を確認する。届いたばかりの確認リンクを1回だけ開く。Gmail内の画面になった場合は「Chromeで開く」などで通常のブラウザを使う。リンク全文は共有しない。
5. CodeStepの学習画面へ戻り、ログアウトの表示が出ればそのブラウザでセッションがある。別ブラウザで確認した場合は、元のChromeで固定/loginを開き、同じメールと登録時のパスワードで通常ログインする。
6. Androidでページを再読み込みし、ログイン維持を確認する。PCのChromeでも固定/loginから同じアドレス/パスワードでログインし、再読み込みする。PCでも確認メールを開き直す必要はない。
7. 期限切れの案内が出るアカウントは手順2で再送→最新メールで再確認する。最新メールをすぐ開いても失敗したら、再登録・再送を繰り返さず、送信/クリックのおおよその時刻、端末/ブラウザ、表示文言のみ報告する。パスワード・リンク全文・認証コードは報告しない。

| 完成条件 | 自動・ローカル検証 | 修正後の本人実端末 |
| --- | --- | --- |
| Android入力の可視性 | 390pxの入力・表示切替・実色を確認。Android/実autofillは対象外 | 未確認 |
| 新しいアドレスで登録 | SDK/API fixtureの確認待ち成功 | 未確認 |
| 確認メール受信 | 実配信は自動試験外。修正前は本人が受信済み | 新しい試行は未確認 |
| スマホでメール確認 | 新しいブラウザ相当のSDK callback成功 | 未確認（修正前は失敗） |
| CodeStepへ戻る | fixture callback→/ とログイン済みヘッダ成功 | 未確認 |
| スマホ/PCログイン | fixtureの通常ログイン成功 | 今回の新規アカウントは未確認 |
| 再読込で維持 | SDK保存復元・ブラウザ再読込成功 | 未確認 |
| 期限切れ再送・再確認 | エラー拒否・URL除去・再送・callbackを個別確認。実メールは対象外 | 未確認 |

詳しい根拠は[テスト記録末尾](./test-plan.md)と[判断記録末尾](./decisions.md)。以下は過去の調査・設定履歴である。


**2026-10-19 最新結果：stagingのみURL設定を承認・反映済み。** Site URLは有効なブランチ固定Preview、Redirect URLsは同じoriginの/loginを完全一致で1件。保存後の再読込と既定メールテンプレート .ConfirmationURL の整合を確認。本番は変更なし。実メール受信・PC/実スマートフォンでの確認はユーザー本人が行うため未実施。アプリPR #3はdraft、本番移行待ち。53a5d43のpush/PR CIは62テスト・lint・型・ダミービルド成功、Previewは同SHA/Ready。提出用README PR #2はマージ済み。以下の未適用記載は当時の履歴。

確認日：2026-10-19。画像で確認リンクの遷移先がlocalhost:3000、ERR_CONNECTION_REFUSEDであることを確認。スマートフォンのlocalhostはその端末自身であり、開発用PCや公開Vercelへは接続しない。

## 読み取りで確認した設定

SupabaseダッシュボードのAuthentication → URL Configurationを読み取り。保存・入力変更は行っていない。

| 対象 | プロジェクトID | Site URL | Redirect URLs |
| --- | --- | --- | --- |
| codestep-staging | ezjzgebehancbxqpgany | http://localhost:3000 | 0件 |
| codestep（本番） | xdnmlfoblqdygsnhkxxp | http://localhost:3000 | 0件 |

現在のコードには登録時のemailRedirectTo指定がないため、既定のlocalhostへ戻る経路と整合する。ただし提供画像だけでは、そのメールがどちらのプロジェクトから送られたかは特定しない。

## 今回のローカル修正

- 登録と確認メール再送の両方に、現在の画面のoriginから作った `/login` をemailRedirectToとして渡す。外部nextパラメータや入力値を戻り先として採用しない。
- Supabase JSのブラウザ標準フローを維持し、確認後に有効なセッションを検出した学習者は `/` へ移動する。管理者入口は従来の厳密な権限検査を維持する。
- 期限切れ・使用済みリンクの固定エラー案内、メール再送、60秒の再送間隔、送信上限・送信先制限・弱いパスワードの案内を追加。
- 生のURLエラーやトークンを画面・ログへ出さず、確認エラー用パラメータをURLから取り除く。
- メール確認の無効化、ユーザーの強制確認、秘密キー利用は行わない。

## 設定案と適用状況（staging反映済み・本番未適用）

| 対象 | Site URLの変更案 | Redirect URLsの追加案 |
| --- | --- | --- |
| staging | https://codestep-git-codex-admin-rls-portfolio-touya1896-7818s-projects.vercel.app | https://codestep-git-codex-admin-rls-portfolio-touya1896-7818s-projects.vercel.app/login（完全一致） |
| 本番 | https://codestep-two.vercel.app | https://codestep-two.vercel.app/login |

stagingのブランチ固定URLはVercelダッシュボードのActive Branchesから読み取った。適用前にrelease-readiness.md冒頭の最新デプロイと照合する。対象を限定し、広い `https://**` や他プロジェクトを含む許可は追加しない。既存URLが増えていた場合は削除せず差分を確認する。既存ユーザー/Authメタデータ/パスワード/確認要否/SMTP/RLS/権限は変更対象外。

URL設定だけの変更では、既に配信済みのメール内のリンクは修正されない。設定反映後に新しい確認メールで検証する。デフォルトのメール送信サービスの宛先制限・送信上限や、カスタムテンプレートがSiteURLを固定参照している場合は別原因が残る。今回SMTPやテンプレートの変更・メール送信は未実施。

## 設定後の必要最小限の確認（未実施）

1. 承認した対象のSite URL/Redirect URLsを読み戻す。
2. 承認されたテスト宛先に新しい確認メールを1通送信し、リンクが公開URLへ戻り、学習画面へ進むことを確認する。メール本文・確認リンク・トークンを資料やログへ保存しない。
3. 別端末で確認した場合の通常ログイン、再読込後のセッション維持を確認する。既存Authユーザーの削除はしない。

実メール配信・開封・確認成功はユーザーの受信確認も必要。ローカルの架空APIでの成功を実メール成功と説明しない。

公式仕様：[Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)、[Password-based Auth](https://supabase.com/docs/guides/auth/passwords)、[Resend](https://supabase.com/docs/reference/javascript/auth-resend)。登録のemailRedirectToは許可URLへの登録が必要で、不一致時はSite URLへ戻る。2026-10-19に公式changelog・関連ドキュメントとローカルSDKを確認した。


## 2026-10-19 stagingのVercelアクセス制限調査（公開承認待ち）

本人報告：Gmailの+エイリアス宛てにSupabaseの登録確認メールを受信できた。実メール送信/受信は本人報告による成功。スマホはVercelログインへ転送され、CodeStepのメール確認完了・ログイン・再読込維持は未確認。Pro登録やプラン変更は不要と判断し、実施しない。

ダッシュボード読取でcodestep（Hobby）のRequire Log In=ON/Standard Protection、Deployment Protection Exceptionsに既存ドメインなしを確認。Vercelへ未ログインの別IABで固定staging/loginを開くとVercel Loginへ転送されることを再現。これはCodeStep/Supabaseの認証エラーとは区別する。

提案はcodestep-git-codex-admin-rls-portfolio-touya1896-7818s-projects.vercel.appの1ドメインだけを公開例外に追加するもの。全パスと将来の同ブランチデプロイが公開され、問題閲覧・登録画面・デモ・管理者ログイン入口にVercelアカウントなしで到達できる。アプリ自身の認証・管理者判定・RLS・列権限は変更しない。公開により通信/メール送信枠の消費や登録試行が増える可能性あり。例外削除で保護へ戻せる。プロジェクト全体のRequire Log In解除、共有秘密トークンの配布、新規Vercelプロジェクト/課金、本番/他Preview変更は採用しない。

公開例外のAdd Domain→Continueまでで対象を入力・確認画面を準備し、Remove Protectionは未実行。ユーザーに公開範囲とリスクを説明して承認待ち。確認画面は/private/tmp/codestep-staging-public-exception-review.jpgに保存。Supabase stagingのURL設定を再読取し、Site URLは上記HTTPS origin、Redirect URLsは同じorigin/loginの1件で既存アプリの登録/再送コールバックに一致。Supabase設定の追加変更は不要。

[2026-09-09公式変更履歴](https://vercel.com/changelog/protect-production-deployments-for-free-on-every-plan)と最新ドキュメントで、ドメイン限定の例外は全プラン無料と確認。古い検索キャッシュのPro/有料add-on必須という記載は現在の判断に使わない。UIのAdd Domainも利用可能で、有料アップグレードを促す画面なし。共有リンクはアカウント不要の別案だが、URLパラメータ/Cookieとメールから別ブラウザに戻る経路の管理が増えるため、端末間認証テストは固定ドメイン1件の公開を推奨。

今回の製品コード変更なし。npm test/lint/typecheck/buildは既存成功結果を再利用し再実行しない。公開後の未ログインPC/モバイル幅の画面到達は別途確認予定で、実スマホのメール確認成功とは区別する。新規PR/本番変更/mainマージ/DBデータ・RLS・管理者変更なし。既存の未コミット変更を保持し、この記録は同じ資料へまとめる。


## 2026-10-19 固定stagingドメインのみ公開：承認条件照合・反映成功

ユーザーは固定ドメイン1件の公開例外を明示承認し、検証DB接続・個人情報/本番データ非公開・管理者/RLS維持・対象限定・本番設定不変を条件とした。公開前に以下を確認し、Remove Protectionを1回だけ確定した。新たな同じ承認要求なし。

- Vercel：Preview用NEXT_PUBLIC_SUPABASE_URLは検証DB ezjzgebehancbxqpgany のルートURLと完全一致。公開キー/秘密値は開かず、Production値も変更しない。固定ドメインはdpl_3jA9YzKeaPPwUY2jTp52QddSVTcQ/53a5d43/codex/admin-rls-portfolio/Preview/Readyへ割当。
- Supabase：get_projectでcodestep-staging/ezjzgebehancbxqpgany/ACTIVE_HEALTHYを確認。公開前のREAD ONLYでpublicの通常表はquestions/profiles/user_progressの3表のみ、全てRLS有効。匿名のSELECTはquestionsのみ、profiles/progressの全列参照・書込は不可。本人6ポリシーと管理者I/U/D3ポリシー・公開SELECTが維持され、管理者条件はapp_metadataのboolean true。公開対象questionsは3行で、既知の架空データの全行照合値と一致。実ユーザーのプロフィール/進捗/メール本文は取得しない。Authに本人の新しい登録があっても匿名公開しない。
- 削除RPC：公開/内部両関数のSHA-256が既存レビュー済み定義と一致し、匿名EXECUTEは両方不可。内部スキーマの匿名USAGEも不可。ACL/RLS/Auth/データの変更は実行せず、緊急停止・復旧試験も追加しない。
- UI：app_metadata.codestep_admin === trueの有効セッションだけに管理フォームを表示するコードを確認。公開後、Vercel未ログイン/CodeStep未ログインの別IABから/adminを開くと「問題管理は管理者専用です」と表示され、管理フォームなし。これは匿名UIの確認で、一般/管理者の追加書込試験ではない。
- 公開設定：codestep-git-codex-admin-rls-portfolio-touya1896-7818s-projects.vercel.appの1件だけをDeployment Protection Exceptionsへ追加。保存後の再読込でUnprotected Domainsは同じ1件、Require Log In=ON/Standard Protectionを維持。個別Preview codestep-4e6rzv5s4-touya1896-7818s-projects.vercel.app/loginは別IABでVercelログインへ転送され、他ドメインの保護維持を確認。本番設定は未操作。
- 公開到達成功：Vercel未ログインの別IABで固定/loginがCodeStepのログイン画面へ直接到達。PC幅と390px（clientWidth=scrollWidth=390）を確認。画像はscreenshots/final-20261019/public-login-desktop.jpg・public-login-mobile.jpg。実スマートフォンの結果ではなく、実メールからの復帰/ログイン/再ログイン/セッション維持は本人確認待ち。Gmail+エイリアスへの確認メール受信は前回の本人報告による成功。
- SupabaseのSite URL=固定HTTPS origin、Redirect URLs=同/loginの1件と再照合済み。アプリの登録/再送emailRedirectToも同じorigin/login。今回はSupabase URL設定の追加変更なし。
- 次の本人操作：スマホで固定/loginを新しく開き、すでに登録した+エイリアスとパスワードで通常ログインを先に試す。以前のクリックでメール確認だけ済んでいればそのままログイン可能。未確認の案内なら確認メールを再送し、60秒以上間隔を空け、最新のメールだけを開く。スマホとPCで再読込/再ログインを確認。パスワード/リンク全文/トークンは報告しない。

製品コード変更がないためnpm test/lint/typecheck/buildは今回再実行せず、既存62件・CIの成功を再利用。安全性の現状確認はSupabase計3要求（識別1、READ ONLY2）で、通常表の生データやAuthユーザー一覧を取得せず必要な照合に限定した。新規PR・新規リソース・課金・push・mainマージなし。既存の未コミット資料/画像は保持し、結果は同じ資料にまとめてローカル保存。
