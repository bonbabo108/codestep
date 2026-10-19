# メール認証の修正と公開前設定

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

## 承認対象の設定案（未適用）

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
