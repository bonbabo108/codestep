-- 提案・未適用。本番での使用には事前承認が必要。
-- 通常のブラウザ用ロールの書き込みを止め、SELECTだけ残す。
-- service_role・所有者の管理操作は停止対象ではない。
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
REVOKE ALL PRIVILEGES ON TABLE public.questions FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES (id, title, question_text, answer_code, explanation, category, created_at)
  ON TABLE public.questions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.questions TO anon, authenticated;
COMMIT;
