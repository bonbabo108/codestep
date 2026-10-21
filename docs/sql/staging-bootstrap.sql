-- codestep-staging専用。空のpublicにだけ実行。本番では実行しない。
-- 適用本文の唯一の原本。prepare-staging-migration.mjsで読込・SHA-256照合し、旧キャッシュを使わない。
-- 実行先のproject_id = ezjzgebehancbxqpganyを呼出側で固定・照合する。
-- 初めから管理者限定RLSにする。旧Permissive書込ポリシーは再現しない。
-- 2026-10-15の本番16列・既存FKに整合。構造の追加は進捗ペアUNIQUEだけ。
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
             WHERE n.nspname='public' AND c.relkind IN ('r','p')) THEN
    RAISE EXCEPTION 'staging bootstrap requires an empty public schema';
  END IF;
END $$;

CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  question_text text NOT NULL,
  answer_code text NOT NULL,
  explanation text,
  category text,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE public.user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
  submitted_code text,
  is_completed boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  -- 同時初回保存を1件にするための意図的差分。本番には未適用。
  CONSTRAINT user_progress_user_question_key UNIQUE(user_id, question_id)
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.questions, public.profiles, public.user_progress FROM PUBLIC, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.questions TO anon, authenticated;
GRANT INSERT(title,question_text,answer_code,explanation,category) ON public.questions TO authenticated;
GRANT UPDATE(title,question_text,answer_code,explanation,category) ON public.questions TO authenticated;
GRANT DELETE ON public.questions TO authenticated;
GRANT SELECT ON public.profiles, public.user_progress TO authenticated;
GRANT INSERT(id,name) ON public.profiles TO authenticated;
GRANT UPDATE(name) ON public.profiles TO authenticated;
GRANT INSERT(user_id,question_id,submitted_code,is_completed) ON public.user_progress TO authenticated;
GRANT UPDATE(submitted_code,is_completed,updated_at) ON public.user_progress TO authenticated;
-- テストランナーの架空問題作成と結果読取だけ。ALL/TRUNCATE等は付与しない。
-- Auth Admin APIの権限とは別。サーバーキーをフロントエンドへ渡さない。
GRANT SELECT ON public.questions, public.profiles, public.user_progress TO service_role;
GRANT INSERT(title,question_text,answer_code,explanation,category) ON public.questions TO service_role;

CREATE POLICY "Anyone can read questions" ON public.questions FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "CodeStep admins insert questions" ON public.questions FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND COALESCE((SELECT auth.jwt()) @> '{"app_metadata":{"codestep_admin":true}}'::jsonb,false));
CREATE POLICY "CodeStep admins update questions" ON public.questions FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL AND COALESCE((SELECT auth.jwt()) @> '{"app_metadata":{"codestep_admin":true}}'::jsonb,false))
WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND COALESCE((SELECT auth.jwt()) @> '{"app_metadata":{"codestep_admin":true}}'::jsonb,false));
CREATE POLICY "CodeStep admins delete questions" ON public.questions FOR DELETE TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL AND COALESCE((SELECT auth.jwt()) @> '{"app_metadata":{"codestep_admin":true}}'::jsonb,false));

CREATE POLICY "Read own profile" ON public.profiles FOR SELECT TO authenticated USING ((SELECT auth.uid())=id);
CREATE POLICY "Insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid())=id);
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((SELECT auth.uid())=id) WITH CHECK ((SELECT auth.uid())=id);
CREATE POLICY "Read own progress" ON public.user_progress FOR SELECT TO authenticated USING ((SELECT auth.uid())=user_id);
CREATE POLICY "Insert own progress" ON public.user_progress FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid())=user_id);
CREATE POLICY "Update own progress" ON public.user_progress FOR UPDATE TO authenticated USING ((SELECT auth.uid())=user_id) WITH CHECK ((SELECT auth.uid())=user_id);
COMMIT;
