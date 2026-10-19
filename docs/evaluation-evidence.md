# メンター評価基準と提出証拠

2026-10-19。提供された評価表の画像5枚を根拠に項目を整理した。得点は採点者が判断するもので、未実装・未確認を満点扱いしない。画面原本は保持し、機密・個人情報を含む評価表原本はリポジトリへ複製しない。

| 評価項目 | 実装・資料の証拠 | 検証・残る条件 |
| --- | --- | --- |
| ペルソナ・課題・ソリューションの情報量 | [最終設計](./final-design.md)の10仮説・3課題・10解決案、[原設計の照合](./design-review.md) | 仮説と実測を区別。採用/見送り理由を明記 |
| 課題とアプリの論理的一貫性・独自性 | 検索準備負担→同一画面の解説、入力不足→即時判定、中断→本人進捗 | 初学者に用途を絞った設計を説明。OneCodeの未実装構想を混同しない |
| 基本設計・非技術者への説明 | [構成・画面遷移・機能一覧](./final-design.md)、[開発・機能ガイド](./implementation-guide.md)の使い方 | 認証と認可、ゲスト/本人/管理者/デモの違いを確認 |
| フロント詳細・ワイヤーフレーム | [画面とHTML/CSS/状態表](./final-design.md)、[原本](./wireframe.png)、app/page.tsx・components/LoginForm.tsx | 旧画像との差分はMarkdownで補足 |
| バックエンド機能一覧 | lib/auth-actions.ts・questions.ts・learning.ts、[機能と成功/異常条件](./final-design.md) | Auth/CRUD/進捗の対象・権限・返却条件を記載 |
| DB・ER図・型・リレーション | [全16列のER図](./final-design.md)、docs/sql/staging-bootstrap.sql、[旧ER原本](./er-diagram.png) | NULL/DEFAULT/FK NO ACTION/一意制約の環境差を明記。今回DB構造の再照会なし |
| アプリの操作性 | [PCデモ](./screenshots/final-20261019/demo-desktop.jpg)、[390pxデモ](./screenshots/final-20261019/demo-mobile.jpg)、README使い方 | 架空デモの回答・CRUD・取消・初期化を実Chromeで成功。固定stagingはアカウント不要で公開済み。実スマホ操作とは区別 |
| ヘッダー・フッター・メニュー | components/Header.tsx・AppShell.tsx | 共通導線とスマートフォンでの折返し |
| 共通コンポーネント | components/ui/button.tsx・LoginForm.tsx・AuthProvider.tsx・ApplicationShell.tsx | 通常画面とデモの表示枠を分離。フォーム検証・判定ロジックを再利用 |
| セッション維持 | components/AuthProvider.tsx、tests/admin.test.mjs、learning.test.mjs | 既存staging実画面の再ログイン復元成功を再利用。今回のログイン済み/login→/遷移と一般の管理拒否は架空APIで確認 |
| テキスト以外の入出力 | app/page.tsx等のLucideアイコン、[画面](./screenshots/final-20261019/demo-desktop.jpg) | 視覚的な状態表示あり。画像アップロード/音声入力なし。評価上の画像出力要件を満たすかはメンター判断 |
| CRUD4種 | app/question/page.tsx・lib/questions.ts・tests/questions.test.mjs、[削除仕様と実Preview結果](./question-deletion.md) | 2026-10-17のstaging実CRUD結果を再利用。今回DB/RLSコード変更なし。本番は書込停止中 |
| メール認証・ログイン | components/LoginForm.tsx・lib/auth-actions.ts・tests/auth-actions.test.mjs、[設定確認と変更案](./auth-release-checklist.md) | localhost誤遷移を設定読取で確認。コード経路はモックで成功。staging URL設定は承認・保存後再読込済み。実メール確認は本人確認待ち |
| OAuth認証 | 未実装 | 画像の認証最高評価にはOAuthも含まれる。今回の必須完成範囲はメール認証。追加実装を実施済みと説明しない |
| 外部API連携 | Supabase Auth/Data APIを利用 | 独立した外部サービス/生成AI APIなし。評価表の外部API項目に該当するかは要確認。得点目的だけの有料連携は追加しない |
| DBの体験への活用 | questions→回答、profiles/user_progress→本人保存/復元 | [既存保存画像](./screenshots/learning-saved-staging.jpg)、[復元画像](./screenshots/learning-restored-staging.jpg)、learning.test.mjs |
| RLSによる保護 | docs/sql/staging-bootstrap.sql・lib/admin.ts・[RLS説明](./rls-runbook.md) | staging実APIの管理者CRUD/匿名・一般拒否/本人制限の既存成功を再利用。本番移行は未適用 |
| テストと改善の妥当性 | [テスト記録](./test-plan.md)・[判断履歴](./decisions.md)、tests/*.test.mjs | 今回70件成功（認証65+デモ5）。localhost原因→戻り先指定/再送追加。0件成功防止・競合・削除取消の既存改善も説明 |
| ブランチ・PR・マージ | codex/admin-rls-portfolio、Git履歴、今回のPR（公開状況参照） | PR作成まで進める。mainへの反映は本番条件を満たすまで保留。回数を増やす目的の空PRは作らない |
| 構造整理・リファクタリング | 共通LoginForm/認証ロジック、AppShell/ApplicationShell分離、eslint.config.mjs | 判定と入力検証をデモでも再利用。Hooks・未使用・危険構文の検査 |
| CI | .github/workflows/lint.yml | push/PRでlint→型→テスト→ダミービルド。最新CIの結果は公開状況へ追記 |
| CD | GitHub→Vercel Preview、main→Productionの既存連携 | 最新SHA/Preview状態を照合。本番条件を満たさないmainマージ・強制公開は行わない |
| READMEの分かりやすさ | [提出用README](https://github.com/bonbabo108/codestep-portfolio) | 使い方・URL・画像・目的・技術・起動・制約・証拠をUTF-8で再整理。過去の重複状態説明を履歴資料へ集約 |
| 面接・想定質問 | [メンター説明](./mentor-notes.md)と本書 | 本人による説明/質疑は未実施。下記5分デモと質問で準備 |

## 5分の説明・デモ

1. 30秒：仕事の合間に学ぶ初学者の「検索・準備負担」「入力不足」「中断」を説明する。
2. 1分：`/demo`を開く→誤答→解説→正解。デモの変更が一時的であることを明示する。
3. 1分：問題管理を体験→作成→編集→削除取消→確定。共通管理者資格情報を公開しない理由を説明する。
4. 1分：通常画面ではAuth/JWTとRLSで本人保存・管理者CRUDを制限する。既存stagingの保存/復元画像とテストを示す。
5. 1分30秒：ER図、0件を成功にしない処理、競合対応、CIとPRを説明。本番未反映・メール設定待ちを明示する。

## 未完了・評価上の限界

- staging URL設定は反映済み。本番のURL設定、新しいメールでのPC/実スマホ確認、メンター本人の操作確認は未完了。
- 本番の管理者指定/RLS・ACL・一意制約・削除RPC反映、公開前確認。その承認なしではmainマージ不可。
- OAuth・独立した外部API/生成AI連携・画像/音声入力は未実装。最高得点の全条件達成とは断定しない。
- 緊急停止・復旧試験は一部未検証のまま終了。今回追加しない。過去記録の「未実施」を成功へ書き換えない。


2026-10-19追記：認証修正後のローカル自動テストは65件。Androidの新規登録・実メール確認は本人の失敗報告後に再修正しており、修正後の本人確認は未完了。[8項目の判定](./auth-release-checklist.md)を参照。


## 管理画面デモと中断対策（2026-10-19）

- `/demo/admin`へヘッダー/フッターから1クリック。登録・管理者権限不要。[共通デモ](../components/DemoExperience.tsx)、[サンプルCRUD](../lib/demo.ts)、[5件の試験](../tests/demo.test.mjs)。
- PC/390pxで入力保持・追加連打1件・一覧・編集・削除取消/確定・空状態・初期化・再読込を確認。[PC](./screenshots/final-20261019/admin-demo-desktop.jpg)、[390px](./screenshots/final-20261019/admin-demo-mobile.jpg)。直接訪問からCRUD終了までダミーAuth/DB向け要求0件。実DB/RLSの検証とは別。
- 本物の管理画面/SQL/認証認可のコード差分なし。管理者フラグや公開範囲を変更していない。
- [AGENTS](../AGENTS.md)：恒久ルール、[AI_WORKFLOW](../AI_WORKFLOW.md)：改善基準、[HANDOFF](../HANDOFF.md)：再開点。実Git/PRを確認し途中成果を保全した。
