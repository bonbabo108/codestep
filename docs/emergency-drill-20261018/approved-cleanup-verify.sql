-- Read only; codestep-staging ezjzgebehancbxqpgany. Data states EXCLUDE the four approved target rows.
BEGIN TRANSACTION READ ONLY;
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
),
policies AS (
  SELECT tablename,policyname,permissive,roles,cmd,qual,with_check
  FROM pg_policies WHERE schemaname='public'
    AND tablename IN ('questions','profiles','user_progress')
),
functions AS (
  SELECT n.nspname AS schema_name,p.proname,
    oidvectortypes(p.proargtypes) AS args,
    pg_get_userbyid(p.proowner) AS owner,p.prosecdef,p.proconfig,
    encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex') AS definition_sha256,
    has_function_privilege('anon',p.oid,'EXECUTE') AS anon_execute,
    has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_execute
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname IN ('public','codestep_private')
    AND p.proname='delete_question_with_progress'
)
SELECT
  (SELECT count(*) FROM public.questions WHERE id IN ('2f1569c5-8375-4c95-a431-761dff17bbdd'::uuid,'9757b1d9-47ae-4a15-9812-1484c248de6f'::uuid)) AS questions,
  (SELECT count(*) FROM public.questions WHERE
    (id='2f1569c5-8375-4c95-a431-761dff17bbdd'::uuid AND title='CodeStep-stop-c5684a334046-history') OR
    (id='9757b1d9-47ae-4a15-9812-1484c248de6f'::uuid AND title='CodeStep-stop-c5684a334046-save')) AS exact_questions,
  (SELECT count(*) FROM public.user_progress WHERE id='4f62451b-8d24-43b2-8e89-92f55d3d4111'::uuid) AS progress,
  (SELECT count(*) FROM public.user_progress WHERE id='4f62451b-8d24-43b2-8e89-92f55d3d4111'::uuid
    AND user_id='a4bbe847-4a60-4574-b00e-dce8f4e10adc'::uuid AND question_id='2f1569c5-8375-4c95-a431-761dff17bbdd'::uuid) AS exact_progress,
  (SELECT count(*) FROM public.profiles WHERE id='a4bbe847-4a60-4574-b00e-dce8f4e10adc'::uuid) AS profiles,
  (SELECT count(*) FROM public.profiles WHERE id='a4bbe847-4a60-4574-b00e-dce8f4e10adc'::uuid AND name='学習者') AS exact_profiles,
  (SELECT count(*) FROM public.user_progress WHERE question_id IN ('2f1569c5-8375-4c95-a431-761dff17bbdd'::uuid,'9757b1d9-47ae-4a15-9812-1484c248de6f'::uuid)
    AND (id <> '4f62451b-8d24-43b2-8e89-92f55d3d4111'::uuid OR user_id <> 'a4bbe847-4a60-4574-b00e-dce8f4e10adc'::uuid)) AS unrecorded_attached_progress,
  (SELECT count(*) FROM public.user_progress WHERE user_id='a4bbe847-4a60-4574-b00e-dce8f4e10adc'::uuid
    AND question_id NOT IN ('2f1569c5-8375-4c95-a431-761dff17bbdd'::uuid,'9757b1d9-47ae-4a15-9812-1484c248de6f'::uuid)) AS other_progress_for_trial_profile,
  (SELECT count(*) FROM auth.users WHERE id IN ('d2c1b05b-f104-48d3-b01c-0f348074d53a'::uuid,'a4bbe847-4a60-4574-b00e-dce8f4e10adc'::uuid)) AS trial_accounts,
  (SELECT count(*) FROM auth.users WHERE id='d2c1b05b-f104-48d3-b01c-0f348074d53a'::uuid AND raw_app_meta_data->'codestep_admin'='true'::jsonb) AS trial_admin_flags,
  CURRENT_TIMESTAMP AS observed_at,current_user,
  current_setting('transaction_read_only') AS read_only,
  (SELECT md5(jsonb_agg(to_jsonb(acl)
    ORDER BY scope COLLATE "C",object_name COLLATE "C",
      column_name COLLATE "C",grantor,grantee,
      privilege_type COLLATE "C",is_grantable)::text) FROM acl) AS acl_fingerprint,
  (SELECT md5(jsonb_agg(to_jsonb(p) ORDER BY tablename,policyname)::text)
    FROM policies p) AS policy_fingerprint,
  (SELECT jsonb_agg(to_jsonb(f) ORDER BY schema_name,proname)
    FROM functions f) AS functions,
  (SELECT jsonb_agg(jsonb_build_object('table',relname,
    'owner',pg_get_userbyid(relowner),'rls',relrowsecurity,
    'force_rls',relforcerowsecurity) ORDER BY relname)
    FROM pg_class WHERE oid IN ('public.questions'::regclass,
      'public.profiles'::regclass,'public.user_progress'::regclass)) AS tables,
  (SELECT jsonb_agg(jsonb_build_object('table',c.relname,'column',a.attname,
    'type',format_type(a.atttypid,a.atttypmod),'not_null',a.attnotnull)
    ORDER BY c.relname,a.attnum)
    FROM pg_class c JOIN pg_attribute a ON a.attrelid=c.oid
    WHERE c.oid IN ('public.questions'::regclass,
      'public.profiles'::regclass,'public.user_progress'::regclass)
      AND a.attnum>0 AND NOT a.attisdropped) AS columns,
  (SELECT count(*) FROM pg_auth_members WHERE member IN
    ('anon'::regrole,'authenticated'::regrole)) AS browser_role_memberships,
  (SELECT count(*) FROM pg_roles WHERE rolname IN ('anon','authenticated')
    AND (rolsuper OR rolbypassrls)) AS browser_elevated_roles,
  has_schema_privilege('authenticated','codestep_private','USAGE') AS private_usage,
  (SELECT jsonb_build_object('count',count(*),
    'fingerprint',md5(COALESCE(jsonb_agg(to_jsonb(q) ORDER BY q.id)::text,'[]')))
    FROM public.questions q WHERE q.id NOT IN ('2f1569c5-8375-4c95-a431-761dff17bbdd'::uuid,'9757b1d9-47ae-4a15-9812-1484c248de6f'::uuid)) AS questions_state,
  (SELECT jsonb_build_object('count',count(*),
    'fingerprint',md5(COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.id)::text,'[]')))
    FROM public.profiles p WHERE p.id<>'a4bbe847-4a60-4574-b00e-dce8f4e10adc'::uuid) AS profiles_state,
  (SELECT jsonb_build_object('count',count(*),
    'fingerprint',md5(COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.id)::text,'[]')))
    FROM public.user_progress p WHERE p.id<>'4f62451b-8d24-43b2-8e89-92f55d3d4111'::uuid) AS progress_state,
  (SELECT jsonb_build_object('count',count(*),
    'metadata_fingerprint',md5(COALESCE(jsonb_agg(
      jsonb_build_object('id',u.id,'app_metadata',u.raw_app_meta_data)
      ORDER BY u.id)::text,'[]'))) FROM auth.users u) AS auth_state,
  (SELECT count(*) FROM pg_stat_activity
    WHERE datname=current_database() AND backend_type='client backend'
      AND pid<>pg_backend_pid() AND state='active') AS other_active_connections,
  (SELECT count(*) FROM pg_stat_activity
    WHERE datname=current_database() AND backend_type='client backend'
      AND pid<>pg_backend_pid() AND xact_start IS NOT NULL) AS other_transactions;
COMMIT;

