// staging限定のSQL要求生成。ネットワーク機能なし。
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const ref = 'ezjzgebehancbxqpgany'
// stagingで読取検証済みの安全な4ポリシー。件数だけでは定義の変更を検出できない。
const safePolicyFingerprint = '1da0740667b5fb3f57013e5ff673d898'
const policyFingerprint = `(SELECT md5(jsonb_agg(jsonb_build_object('name',policyname,'roles',roles,'cmd',cmd,'permissive',permissive,'using',qual,'check',with_check) ORDER BY policyname)::text) FROM pg_policies WHERE schemaname='public' AND tablename='questions')`
const read = name => readFileSync(new URL(`../docs/sql/${name}`, import.meta.url), 'utf8')
const body = sql => sql.replace(/^BEGIN;\s*$/m, '').replace(/COMMIT;\s*$/, '')
const mode = process.argv[2]
let query, name
if (mode === 'cutover') {
  const migration = read('questions-admin-rls.sql')
  const stop = read('questions-emergency-stop.sql')
  const reviewGuard = migration.match(/DO \$review\$[\s\S]*?\$review\$;/)?.[0]
  if (!reviewGuard) throw Error('review guard not found')
  name = 'codestep_staging_old_seven_policy_rehearsal'
  query = `-- staging only: never commit the old broad policies. One transaction + exclusive lock.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
LOCK TABLE public.questions IN ACCESS EXCLUSIVE MODE;
CREATE TEMP TABLE cutover_before ON COMMIT DROP AS SELECT jsonb_agg(to_jsonb(q) ORDER BY id) AS rows_before FROM public.questions q;
DO $$ BEGIN
 IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='questions') <> 4
 OR ${policyFingerprint} IS DISTINCT FROM '${safePolicyFingerprint}'
 OR NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.questions'::regclass) THEN
 RAISE EXCEPTION 'unexpected starting state'; END IF;
END $$;
${body(stop)}
DROP POLICY "CodeStep admins insert questions" ON public.questions;
DROP POLICY "CodeStep admins update questions" ON public.questions;
DROP POLICY "CodeStep admins delete questions" ON public.questions;
CREATE POLICY "Demo public insert questions" ON public.questions FOR INSERT TO PUBLIC WITH CHECK (true);
CREATE POLICY "Demo public update questions" ON public.questions FOR UPDATE TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY "Demo public delete questions" ON public.questions FOR DELETE TO PUBLIC USING (true);
CREATE POLICY "Authenticated users can insert questions" ON public.questions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update questions" ON public.questions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete questions" ON public.questions FOR DELETE TO authenticated USING (true);
-- Test that the original review guard refuses an unexpected eighth policy.
CREATE POLICY "CodeStep rehearsal unexpected policy" ON public.questions FOR SELECT TO anon USING (false);
DO $$ DECLARE refused boolean := false; BEGIN
 BEGIN
  EXECUTE $guard$${reviewGuard}$guard$;
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM = 'questions policies differ from reviewed snapshot; stop and re-audit' THEN refused := true; ELSE RAISE; END IF;
 END;
 IF NOT refused THEN RAISE EXCEPTION 'review guard did not reject unexpected policy'; END IF;
END $$;
DROP POLICY "CodeStep rehearsal unexpected policy" ON public.questions;
-- Exact reviewed production-migration body; only its outer BEGIN/COMMIT are replaced.
${body(migration)}
DO $$ BEGIN
 IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='questions') <> 4
 OR ${policyFingerprint} IS DISTINCT FROM '${safePolicyFingerprint}'
 OR EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='questions' AND policyname LIKE 'Demo public%')
 OR (SELECT rows_before FROM cutover_before) IS DISTINCT FROM (SELECT jsonb_agg(to_jsonb(q) ORDER BY id) FROM public.questions q) THEN
 RAISE EXCEPTION 'cutover result mismatch'; END IF;
END $$;
COMMIT;`
  console.log(JSON.stringify({ source_sha256: createHash('sha256').update(migration).digest('hex'), apply_migration: { project_id: ref, name, query } }))
} else if (mode === 'stop') {
  console.log(JSON.stringify({ apply_migration: { project_id: ref, name: 'codestep_staging_emergency_stop_drill', query: read('questions-emergency-stop.sql') } }))
} else if (mode === 'resume') {
  const expected = process.argv[3]
  if (!/^[a-f0-9]{32}$/.test(expected || '')) throw Error('verified policy fingerprint required')
  query = `BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
LOCK TABLE public.questions IN ACCESS EXCLUSIVE MODE;
DO $$ BEGIN
 IF (SELECT md5(jsonb_agg(jsonb_build_object('name',policyname,'roles',roles,'cmd',cmd,'permissive',permissive,'using',qual,'check',with_check) ORDER BY policyname)::text) FROM pg_policies WHERE schemaname='public' AND tablename='questions') <> '${expected}' THEN
 RAISE EXCEPTION 'RLS changed; keep writes stopped'; END IF;
END $$;
GRANT INSERT(title,question_text,answer_code,explanation,category) ON public.questions TO authenticated;
GRANT UPDATE(title,question_text,answer_code,explanation,category) ON public.questions TO authenticated;
GRANT DELETE ON public.questions TO authenticated;
COMMIT;`
  console.log(JSON.stringify({ apply_migration: { project_id: ref, name: 'codestep_staging_limited_resume_drill', query } }))
} else throw Error('expected cutover, stop or resume')
