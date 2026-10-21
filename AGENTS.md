# CodeStepの作業ルール

- 講座最終課題・ポートフォリオの完成と説明可能性を優先する。商用拡張や得点目的だけの機能を増やさない。
- **必読：[`docs/course-completion-policy.md`](./docs/course-completion-policy.md)** は本人が何度も指定した「講座課題を最小工数で完成させる」方針と再共有された評価表の出典別基準。最初に本書を読む。必要性を評価項目・安全性・不具合で説明できない作業は始めない。独自SMTP/ドメイン/OAuth/新機能・新ツール・追加インフラを課題完成の既定条件にしない。既存成果で評価できるならそれを優先し、加点・工数・リスクを比較する。
- **最優先の完成条件：講座で扱ったと確認できる範囲で、メンターに本人が自分の言葉で説明できる転職用課題にする。** AI実装の成功と本人理解を混同しない。既存資料の短い説明と質疑練習を新規機能より優先。NotebookLMの講座資料を直接読めないときは照合済みと偽らない。
- **重要：** 本番のデータ/権限保護・本人承認・マージ承認は従来通り厳守する。機能未確認を成功と報告せず、レビュー用の「最高点仕様」を自動的な実装必須条件へ置き換えない。最新の本人指示を最優先する。
- 開始時に `docs/project-context.md` と `docs/decisions.md` の最新節、`HANDOFF.md`、`AI_WORKFLOW.md` を読む。履歴のDB観測を現在値と断定しない。最新のユーザー指示を優先する。
- 安全で可逆的なコード/UI/資料編集、リファクタ、仮データ・モックAPI、ローカル起動/停止/後片付け、テスト、必要な依存導入、作業ブランチのcommit/push、既存PR更新、通常のstagingコードデプロイは承認済み。実装方法や小さな検証ごとに質問しない。
- **バッチ優先**：外部操作の承認・本人操作・API制限で一工程が止まっても、依存しない読取監査・資料修正・試験照合・提出準備を先に完了させる。複数の承認・本人操作は最後に影響・復旧・手順をまとめて提示。許可が必要な本番操作だけは先行しない。
- 事前確認を維持する：本番環境/DB/実データ/Authの変更、セキュリティ低下、秘密公開、新たなアクセス制限解除・公開、重要データ/未コミット変更の損失、mainマージ/本番デプロイ、課金・契約、主要仕様/設計の大幅変更。確認は「変更・危険性・復旧可能性」の3点に絞る。
- 業務上の承認とツール実行許可は別。既に承認された同じ対象/影響を質問し直さず、必要なツール許可だけ正規の手順で扱う。制限・拒否を別経路や設定緩和で迂回しない。
- 開始時にcwd/worktree/branch/status/diffと対象PRを実確認する。`reset`/`clean`/無断破棄は禁止。`codestep_key_files.txt` は保持し、削除・上書き・commitしない。`git add .` は使わない。
- 既存作業ブランチとアプリPR #3を優先し、小さな資料更新ごとにPRを作らない。mainは最終承認までマージしない。提出用READMEは既存のcodestep-portfolioに維持し、移動・削除・重複作成をしない。
- 個人情報、APIキー、JWT、秘密鍵、確認メールのリンク/コードをログ・資料・テスト・commitに含めない。公開画像は必要な架空データの証跡だけ。既存画像の原本を保持する。
- stagingは `ezjzgebehancbxqpgany`、本番は `xdnmlfoblqdygsnhkxxp`。DB変更/書込試験は対象がstagingと一致し承認範囲内か確認してから行う。本番コピーや新規クラウド資源・課金・外部シート編集は別途承認。`.env.local` は本番接続のため検証に流用しない。
- 管理者は `app_metadata.codestep_admin === true` の有効セッションのみ。`user_metadata` は認可に使わず、最終保証はRLS。デモはサンプルのメモリ操作だけで本物の管理者権限・DB接続を渡さない。
- 緊急停止・復旧試験、旧7→4のリハーサルは再開しない。既存結果と未確認事項を再利用し、未実施を成功扱いしない。SQL原本/承認ハッシュは変更・再利用せず、必要時は `AI_WORKFLOW.md` のSQL条件に従う。
- 検証は `npm test`、`npm run lint`、`npm run typecheck`、ダミー接続の `npm run build -- --webpack`。buildとtypecheckは並列にしない。必要な変更後に一度実施し、失敗や新しい懸念がない限り同じ試験を反復しない。
- 成功/失敗/未実施と、自動・モック・実DB・実端末の証拠を分ける。本人へ依頼する前にAIで検証可能な範囲を終え、結果を `docs/test-plan.md` と `docs/decisions.md` へ簡潔に残す。
- 重複質問・手戻りが繰り返されたら原因を分析し、再利用できる改善だけ `AI_WORKFLOW.md` に統合する。単発ログで肥大化させない。
- 中断前/作業の区切りに `HANDOFF.md` の状態・未commit・証拠・次の一手・承認範囲を更新する。突然の中断後はGit/PR/既存プロセスを照合し、完了済みの調査を最初からやり直さない。
- 外部設計資料は `docs/design-review.md` のリンク。読めなければ未確認と記録し、編集案はローカル資料に残す。報告は完了・テスト・残件・次・本人操作/承認を簡潔にまとめる。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
