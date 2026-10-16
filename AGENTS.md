# CodeStepの作業ルール

- 最初に docs/project-context.md、docs/decisions.md を確認する。過去のDB観測は日付付きの記録であり、最新状態と断定しない。
- 商用規模への拡張より、講座最終課題としての完成・説明可能性を優先する。
- 本番Supabaseのデータ・RLS・権限・Auth・環境変数、本番Vercel、GitHubへのpushは、明示的な別途承認なしに変更しない。
- 変更SQLと書き込みテストは、本番と異なるプロジェクト識別子の検証DBであることを確認してから実行する。未確認なら静的検証までに留める。
- 新規クラウドリソース・課金・外部スプレッドシート編集は事前承認を得る。本番データを無断で複製しない。
- APIキー・JWT・秘密鍵・個人情報をログ、資料、テスト、コミットに含めない。
- codestep_key_files.txt は既存の未追跡ファイル。削除・上書き・勝手なコミットをしない。git add . は使わない。
- 管理者の表示条件は app_metadata.codestep_admin === true。user_metadataを認可に使わない。認可の最終保証はRLS。
- 最新のユーザー指示でDB出題・本人の進捗保存/復元のローカル実装が許可された。本番変更は承認済みの緊急停止SQLだけ。それ以外のDBスキーマ/Auth変更は別途承認が必要。
- 最新の追加承認でcodestep-staging（ezjzgebehancbxqpgany）限定のスキーマ/RLS/制約・架空テストユーザー/Authフラグ変更・実DB試験が許可された。本番/TodoApp/課金は対象外。
- staging初期化の適用要求は、承認後に毎回 node scripts/prepare-staging-migration.mjs で生成したapply_migrationだけを使用する。原本SQLとreview.jsonのSHA-256一致が必須。過去のツール本文、functionsの旧SQLストア、/tmpの古い要求は再利用しない。SQL/承認ハッシュを変更した場合は再レビュー・再承認する。
- 設計資料の最新版は docs/design-review.md のGoogle Sheetsリンク。読めなければ未確認と記録する。外部資料の編集案はローカルに残す。
- 検証は npm test、npm run lint、npm run typecheck、ダミー接続先での npm run build。成功・失敗・未実施を分けて docs/decisions.md と docs/test-plan.md に残す。
- 既存画像の原本を保持する。差分はMarkdownの注記・図で補足する。

## SQL警告・実行失敗への対応

- 最初に試験の必要性を既存の成功結果と照合する。省略/保留できる試験は理由・代替検証・残るリスクを記録し、独立した作業を続ける。未実施を成功扱いしない。現在の旧7→4リハーサルは再送を保留し、test-plan.md末尾の代替検証を使う。
- 必要な変更は、SQL全文/原本ハッシュ、対象プロジェクトID、削除対象、影響データ、既存データ保護、トランザクション/ロック、停止・復旧・結果確認方法を一括レビューする。RLS切替で許可する削除は承認済みの必要なDROP POLICYのみ。DROP TABLE/DROP SCHEMA/TRUNCATE/データ削除を含む切替SQLは実行しない。広い書込許可を確定状態にせず、失敗時も安全な状態を維持する設計にする。
- 業務上の承認とツール自体の実行許可を区別する。対象・SQL・影響範囲が承認と同じなら同じ承認質問を繰り返さない。ツール許可が別途必要な場合だけ、確認済み内容と影響をまとめて1回求める。実質的なSQL/対象/影響変更は再レビュー・必要な再承認の対象。
- 同じ警告・拒否・requestStateエラーを根拠なく再試行しない。結果不明なら追加変更せず、RLS/実効権限/データ/履歴を読み取り確認する。原因と解消の根拠が得られるまでは代替検証へ移る。別ツール/CLI/UI経由、SQLの隠蔽・分割、確認機能の無効化で許可を迂回しない。
- 警告の検知条件、ツール/確認状態のエラー、DB側のSQLエラーを分けて記録する。根本原因が未特定なら推測で断定しない。静的検査は実DBの構文/権限/ロールバック成功の証明ではない。本番適用の判断には残るリスクと別途承認が必要。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
