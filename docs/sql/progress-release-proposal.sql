-- 提案のみ・未適用。本番適用には別途承認が必要。staging-bootstrap.sqlを本番へ流用しない。
-- 本人限定RLSを保持しACLだけ最小化。UNIQUEは別のprogress-unique-proposal.sqlで適用する。
-- 2026-10-15の本番メタデータに対応。データ削除/既存FK変更/Auth変更なし。
-- 呼出先project_idを本番xdnmlfoblqdygsnhkxxpと人間が照合し、事前バックアップを取る。
-- 同じ処理の再実行用ではない。適用結果不明なら読取確認し再送しない。
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
LOCK TABLE public.profiles, public.user_progress IN ACCESS EXCLUSIVE MODE;

DO $review$
DECLARE mismatch boolean;
BEGIN
  IF (SELECT count(*) FROM pg_class
      WHERE oid IN ('public.profiles'::regclass,'public.user_progress'::regclass)
        AND relrowsecurity AND pg_get_userbyid(relowner)='postgres') <> 2 THEN
    RAISE EXCEPTION 'owner/RLS differs; stop and re-audit';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname IN ('anon','authenticated') AND (rolsuper OR rolbypassrls))
    OR EXISTS (SELECT 1 FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.member
               WHERE r.rolname IN ('anon','authenticated')) THEN
    RAISE EXCEPTION 'API role attributes differ; stop and re-audit';
  END IF;
  WITH expected(tablename,policyname,permissive,roles,cmd,qual,with_check) AS (
    VALUES
      ('profiles','Users can insert own profile','PERMISSIVE',ARRAY['authenticated']::name[],'INSERT',NULL,'(auth.uid() = id)'),
      ('profiles','Users can read own profile','PERMISSIVE',ARRAY['authenticated']::name[],'SELECT','(auth.uid() = id)',NULL),
      ('profiles','Users can update own profile','PERMISSIVE',ARRAY['authenticated']::name[],'UPDATE','(auth.uid() = id)','(auth.uid() = id)'),
      ('user_progress','Users can insert own progress','PERMISSIVE',ARRAY['authenticated']::name[],'INSERT',NULL,'(auth.uid() = user_id)'),
      ('user_progress','Users can read own progress','PERMISSIVE',ARRAY['authenticated']::name[],'SELECT','(auth.uid() = user_id)',NULL),
      ('user_progress','Users can update own progress','PERMISSIVE',ARRAY['authenticated']::name[],'UPDATE','(auth.uid() = user_id)','(auth.uid() = user_id)')
  ), actual AS (
    SELECT tablename::text,policyname::text,permissive::text,roles,cmd::text,qual,with_check
    FROM pg_policies WHERE schemaname='public' AND tablename IN ('profiles','user_progress')
  ) SELECT EXISTS (
    (SELECT * FROM actual EXCEPT SELECT * FROM expected)
    UNION ALL (SELECT * FROM expected EXCEPT SELECT * FROM actual)
  ) INTO mismatch;
  IF mismatch THEN RAISE EXCEPTION 'profile/progress policies differ; stop and re-audit'; END IF;
END;
$review$;

-- 既存の本人限定6ポリシーは変更しない。列権限も取り除いてから必要分だけ戻す。
REVOKE ALL PRIVILEGES ON TABLE public.profiles, public.user_progress FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES (id,name,created_at) ON public.profiles FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES (id,user_id,question_id,submitted_code,is_completed,updated_at)
  ON public.user_progress FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.profiles, public.user_progress TO authenticated;
GRANT INSERT (id,name) ON public.profiles TO authenticated;
GRANT UPDATE (name) ON public.profiles TO authenticated;
GRANT INSERT (user_id,question_id,submitted_code,is_completed) ON public.user_progress TO authenticated;
GRANT UPDATE (submitted_code,is_completed,updated_at) ON public.user_progress TO authenticated;
COMMIT;
