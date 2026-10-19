-- PROPOSAL ONLY. Not executed or approved for execution.
-- Only codestep-staging: ezjzgebehancbxqpgany.
-- Caller must verify the project ID; current_database() is not an identity check.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SET LOCAL search_path = pg_catalog;
DO $context$
BEGIN
  IF current_user <> 'postgres'
    OR (SELECT count(*) FROM pg_class
        WHERE oid IN ('public.questions'::regclass,
          'public.profiles'::regclass,'public.user_progress'::regclass)
          AND relowner='postgres'::regrole
          AND relrowsecurity AND NOT relforcerowsecurity) <> 3
    OR EXISTS (SELECT 1 FROM pg_roles
        WHERE rolname IN ('anon','authenticated') AND (rolsuper OR rolbypassrls))
    OR EXISTS (SELECT 1 FROM pg_auth_members
        WHERE member IN ('anon'::regrole,'authenticated'::regrole)) THEN
    RAISE EXCEPTION 'Owner, RLS or API role differs; stop';
  END IF;
  IF (WITH policies AS (
      SELECT tablename,policyname,permissive,roles,cmd,qual,with_check
      FROM pg_policies WHERE schemaname='public'
        AND tablename IN ('questions','profiles','user_progress')
    ) SELECT md5(jsonb_agg(to_jsonb(p) ORDER BY tablename,policyname)::text)
      FROM policies p) IS DISTINCT FROM 'c65a21b9b4319768ec1cd689eaac0cc7' THEN
    RAISE EXCEPTION 'Policies differ; keep current state and inspect';
  END IF;
  IF (SELECT count(*) FROM pg_proc p
      JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname IN ('public','codestep_private')
        AND p.proname='delete_question_with_progress') <> 2
    OR (SELECT count(*) FROM pg_proc p
      JOIN pg_namespace n ON n.oid=p.pronamespace
      JOIN (VALUES
        ('public',
         'd0351e1eddb7bbc60beb5cdc43999fba58c71475c0906f11acb66d9f15f733bd'),
        ('codestep_private',
         '87f2aab0c5ce1e704cb3f2b415ab32025407b2247c3e806012480a5747ef5b06')
      ) expected(schema_name,definition_hash) ON expected.schema_name=n.nspname
      WHERE p.proname='delete_question_with_progress'
        AND oidvectortypes(p.proargtypes)='uuid, boolean, boolean'
        AND p.proowner='postgres'::regrole
        AND encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')
          =expected.definition_hash) <> 2
    OR NOT has_schema_privilege('authenticated','codestep_private','USAGE') THEN
    RAISE EXCEPTION 'Deletion functions differ; stop and inspect';
  END IF;
END
$context$;
DO $before$
DECLARE actual text;
BEGIN
WITH acl AS (
  SELECT 'table' AS scope, c.relname::text AS object_name, ''::text AS column_name,
    a.grantor, a.grantee, a.privilege_type, a.is_grantable
  FROM pg_class c CROSS JOIN LATERAL
    aclexplode(COALESCE(c.relacl, acldefault('r', c.relowner))) a
  WHERE c.oid IN ('public.questions'::regclass,
    'public.profiles'::regclass, 'public.user_progress'::regclass)
  UNION ALL
  SELECT 'column', c.relname::text, x.attname::text,
    a.grantor, a.grantee, a.privilege_type, a.is_grantable
  FROM pg_class c JOIN pg_attribute x ON x.attrelid=c.oid
  CROSS JOIN LATERAL aclexplode(x.attacl) a
  WHERE c.oid IN ('public.questions'::regclass,
    'public.profiles'::regclass, 'public.user_progress'::regclass)
    AND x.attnum>0 AND NOT x.attisdropped
  UNION ALL
  SELECT 'function', n.nspname||'.'||p.proname, '',
    a.grantor, a.grantee, a.privilege_type, a.is_grantable
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  CROSS JOIN LATERAL
    aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a
  WHERE n.nspname IN ('public','codestep_private')
    AND p.proname='delete_question_with_progress'
)
  SELECT md5(jsonb_agg(to_jsonb(acl)
    ORDER BY scope COLLATE "C",object_name COLLATE "C",
      column_name COLLATE "C",grantor,grantee,
      privilege_type COLLATE "C",is_grantable)::text)
  INTO actual FROM acl;
  IF actual IS DISTINCT FROM '34359cdf23e85be0c1309b1280d24020' THEN
    RAISE EXCEPTION 'ACL state differs; stop and inspect without retry';
  END IF;
END
$before$;
REVOKE EXECUTE ON FUNCTION
  public.delete_question_with_progress(uuid,boolean,boolean),
  codestep_private.delete_question_with_progress(uuid,boolean,boolean)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL PRIVILEGES ON TABLE public.questions
  FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES
  (id,title,question_text,answer_code,explanation,category,created_at)
  ON TABLE public.questions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.questions TO anon, authenticated;
DO $after$
DECLARE actual text;
BEGIN
WITH acl AS (
  SELECT 'table' AS scope, c.relname::text AS object_name, ''::text AS column_name,
    a.grantor, a.grantee, a.privilege_type, a.is_grantable
  FROM pg_class c CROSS JOIN LATERAL
    aclexplode(COALESCE(c.relacl, acldefault('r', c.relowner))) a
  WHERE c.oid IN ('public.questions'::regclass,
    'public.profiles'::regclass, 'public.user_progress'::regclass)
  UNION ALL
  SELECT 'column', c.relname::text, x.attname::text,
    a.grantor, a.grantee, a.privilege_type, a.is_grantable
  FROM pg_class c JOIN pg_attribute x ON x.attrelid=c.oid
  CROSS JOIN LATERAL aclexplode(x.attacl) a
  WHERE c.oid IN ('public.questions'::regclass,
    'public.profiles'::regclass, 'public.user_progress'::regclass)
    AND x.attnum>0 AND NOT x.attisdropped
  UNION ALL
  SELECT 'function', n.nspname||'.'||p.proname, '',
    a.grantor, a.grantee, a.privilege_type, a.is_grantable
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  CROSS JOIN LATERAL
    aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a
  WHERE n.nspname IN ('public','codestep_private')
    AND p.proname='delete_question_with_progress'
)
  SELECT md5(jsonb_agg(to_jsonb(acl)
    ORDER BY scope COLLATE "C",object_name COLLATE "C",
      column_name COLLATE "C",grantor,grantee,
      privilege_type COLLATE "C",is_grantable)::text)
  INTO actual FROM acl;
  IF actual IS DISTINCT FROM 'f79cd8a1d16d34bcf047510223162d1a' THEN
    RAISE EXCEPTION 'ACL state differs; stop and inspect without retry';
  END IF;
END
$after$;
COMMIT;
