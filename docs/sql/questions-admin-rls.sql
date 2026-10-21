-- 本番は未適用。stagingの切替リハーサル以外は別途承認が必要。
-- 2026-10-15の読取結果に対応。実行者はテーブル所有者相当を想定する。
-- 先に docs/rls-runbook.md の接続先・管理者JWT・バックアップを確認する。
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
LOCK TABLE public.questions IN ACCESS EXCLUSIVE MODE;

-- 調査後に別ポリシーが追加・変更されていたら、許可を残さず処理を中断する。
DO $review$
DECLARE
  mismatch boolean;
BEGIN
  WITH expected(policyname, permissive, roles, cmd, qual, with_check) AS (
    VALUES
      ('Anyone can read questions','PERMISSIVE',ARRAY['public']::name[],'SELECT','true',NULL),
      ('Demo public insert questions','PERMISSIVE',ARRAY['public']::name[],'INSERT',NULL,'true'),
      ('Demo public update questions','PERMISSIVE',ARRAY['public']::name[],'UPDATE','true','true'),
      ('Demo public delete questions','PERMISSIVE',ARRAY['public']::name[],'DELETE','true',NULL),
      ('Authenticated users can insert questions','PERMISSIVE',ARRAY['authenticated']::name[],'INSERT',NULL,'true'),
      ('Authenticated users can update questions','PERMISSIVE',ARRAY['authenticated']::name[],'UPDATE','true','true'),
      ('Authenticated users can delete questions','PERMISSIVE',ARRAY['authenticated']::name[],'DELETE','true',NULL)
  ), actual AS (
    SELECT policyname::text, permissive::text, roles, cmd::text, qual, with_check
    FROM pg_policies WHERE schemaname='public' AND tablename='questions'
  )
  SELECT EXISTS (
    (SELECT * FROM actual EXCEPT SELECT * FROM expected)
    UNION ALL
    (SELECT * FROM expected EXCEPT SELECT * FROM actual)
  ) INTO mismatch;
  IF mismatch THEN
    RAISE EXCEPTION 'questions policies differ from reviewed snapshot; stop and re-audit';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname IN ('anon','authenticated') AND (rolsuper OR rolbypassrls)
  ) OR EXISTS (
    SELECT 1 FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.member
    WHERE r.rolname IN ('anon','authenticated')
  ) THEN
    RAISE EXCEPTION 'API role attributes/membership differ; stop and re-audit';
  END IF;
END;
$review$;

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.questions FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES (id, title, question_text, answer_code, explanation, category, created_at)
  ON TABLE public.questions FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.questions TO anon, authenticated;
GRANT INSERT (title, question_text, answer_code, explanation, category)
  ON TABLE public.questions TO authenticated;
GRANT UPDATE (title, question_text, answer_code, explanation, category)
  ON TABLE public.questions TO authenticated;
GRANT DELETE ON TABLE public.questions TO authenticated;

DROP POLICY "Demo public insert questions" ON public.questions;
DROP POLICY "Demo public update questions" ON public.questions;
DROP POLICY "Demo public delete questions" ON public.questions;
DROP POLICY "Authenticated users can insert questions" ON public.questions;
DROP POLICY "Authenticated users can update questions" ON public.questions;
DROP POLICY "Authenticated users can delete questions" ON public.questions;

-- Anyone can read questions はそのまま残す。
CREATE POLICY "CodeStep admins insert questions"
ON public.questions AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL
  AND COALESCE((SELECT auth.jwt()) @> '{"app_metadata":{"codestep_admin":true}}'::jsonb, false)
);
CREATE POLICY "CodeStep admins update questions"
ON public.questions AS PERMISSIVE FOR UPDATE TO authenticated
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND COALESCE((SELECT auth.jwt()) @> '{"app_metadata":{"codestep_admin":true}}'::jsonb, false)
)
WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL
  AND COALESCE((SELECT auth.jwt()) @> '{"app_metadata":{"codestep_admin":true}}'::jsonb, false)
);
CREATE POLICY "CodeStep admins delete questions"
ON public.questions AS PERMISSIVE FOR DELETE TO authenticated
USING (
  (SELECT auth.uid()) IS NOT NULL
  AND COALESCE((SELECT auth.jwt()) @> '{"app_metadata":{"codestep_admin":true}}'::jsonb, false)
);
COMMIT;
