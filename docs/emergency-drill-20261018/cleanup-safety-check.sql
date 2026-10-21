BEGIN TRANSACTION READ ONLY;
WITH targets AS (
  SELECT oid,relname,relkind,relispartition
  FROM pg_class WHERE oid IN ('public.questions'::regclass,
    'public.user_progress'::regclass,'public.profiles'::regclass)
)
SELECT CURRENT_TIMESTAMP AS observed_at,
  current_setting('transaction_read_only') AS read_only,
  (SELECT jsonb_agg(jsonb_build_object('table',t.relname,'kind',t.relkind,
    'partition',t.relispartition,'children',(SELECT count(*) FROM pg_inherits i
      WHERE i.inhparent=t.oid)) ORDER BY t.relname) FROM targets t) AS tables,
  (SELECT COALESCE(jsonb_agg(jsonb_build_object('name',c.conname,
    'from_table',c.conrelid::regclass::text,'to_table',c.confrelid::regclass::text,
    'delete_action',c.confdeltype,'update_action',c.confupdtype,
    'definition',pg_get_constraintdef(c.oid)) ORDER BY c.conname),'[]'::jsonb)
    FROM pg_constraint c WHERE c.contype='f'
      AND (c.conrelid IN (SELECT oid FROM targets)
        OR c.confrelid IN (SELECT oid FROM targets))) AS foreign_keys,
  (SELECT COALESCE(jsonb_agg(jsonb_build_object('table',t.tgrelid::regclass::text,
    'name',t.tgname,'internal',t.tgisinternal,'enabled',t.tgenabled,
    'function_schema',n.nspname,'function_name',p.proname,
    'constraint_type',c.contype) ORDER BY t.tgrelid,t.tgname),'[]'::jsonb)
    FROM pg_trigger t JOIN pg_proc p ON p.oid=t.tgfoid
      JOIN pg_namespace n ON n.oid=p.pronamespace
      LEFT JOIN pg_constraint c ON c.oid=t.tgconstraint
    WHERE t.tgrelid IN (SELECT oid FROM targets)) AS triggers,
  (SELECT COALESCE(jsonb_agg(jsonb_build_object('table',r.ev_class::regclass::text,
    'name',r.rulename,'definition',pg_get_ruledef(r.oid)) ORDER BY r.rulename),'[]'::jsonb)
    FROM pg_rewrite r WHERE r.ev_class IN (SELECT oid FROM targets)
      AND r.rulename <> '_RETURN') AS rules,
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
    AND question_id NOT IN ('2f1569c5-8375-4c95-a431-761dff17bbdd'::uuid,'9757b1d9-47ae-4a15-9812-1484c248de6f'::uuid)) AS other_progress_for_trial_profile;
COMMIT;
