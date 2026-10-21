-- codestep-staging / ezjzgebehancbxqpgany only.
-- Reviewed proposal: only the recorded 2 questions, 1 progress and 1 trial profile.
-- Not executed. Requires explicit approval for this exact file and hash.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
SET LOCAL search_path=pg_catalog;
-- Prevent schema/trigger changes while ordinary unrelated DML remains allowed.
LOCK TABLE public.questions, public.user_progress, public.profiles
  IN SHARE UPDATE EXCLUSIVE MODE;
DO $cleanup$
DECLARE changed integer;
BEGIN
  IF current_user <> 'postgres' THEN RAISE EXCEPTION 'Unexpected executor'; END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE oid IN (
      'public.questions'::regclass,'public.user_progress'::regclass,'public.profiles'::regclass)
      AND (relkind <> 'r' OR relispartition))
    OR EXISTS (SELECT 1 FROM pg_inherits WHERE inhparent IN (
      'public.questions'::regclass,'public.user_progress'::regclass,'public.profiles'::regclass)
      OR inhrelid IN (
      'public.questions'::regclass,'public.user_progress'::regclass,'public.profiles'::regclass)) THEN
    RAISE EXCEPTION 'Unexpected table inheritance/partition; no DELETE executed';
  END IF;
  IF (SELECT count(*) FROM pg_constraint WHERE contype='f'
      AND (conrelid IN ('public.questions'::regclass,'public.user_progress'::regclass,
        'public.profiles'::regclass) OR confrelid IN ('public.questions'::regclass,
        'public.user_progress'::regclass,'public.profiles'::regclass))) <> 2
    OR (SELECT count(*) FROM pg_constraint WHERE contype='f'
      AND conrelid='public.user_progress'::regclass
      AND confrelid IN ('public.questions'::regclass,'public.profiles'::regclass)
      AND confdeltype='a' AND confupdtype='a') <> 2 THEN
    RAISE EXCEPTION 'Foreign keys differ; no DELETE executed';
  END IF;
  IF (SELECT count(*) FROM pg_trigger WHERE tgrelid IN (
      'public.questions'::regclass,'public.user_progress'::regclass,'public.profiles'::regclass)) <> 8
    OR EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_proc p ON p.oid=t.tgfoid
      JOIN pg_namespace n ON n.oid=p.pronamespace
      LEFT JOIN pg_constraint c ON c.oid=t.tgconstraint
      WHERE t.tgrelid IN ('public.questions'::regclass,'public.user_progress'::regclass,
        'public.profiles'::regclass)
        AND (NOT t.tgisinternal OR t.tgenabled <> 'O'
          OR n.nspname <> 'pg_catalog' OR c.contype IS DISTINCT FROM 'f'
          OR p.proname NOT IN ('RI_FKey_noaction_del','RI_FKey_noaction_upd',
            'RI_FKey_check_ins','RI_FKey_check_upd')))
    OR EXISTS (SELECT 1 FROM pg_rewrite WHERE ev_class IN (
      'public.questions'::regclass,'public.user_progress'::regclass,'public.profiles'::regclass)
      AND rulename <> '_RETURN') THEN
    RAISE EXCEPTION 'Triggers/rules differ; no DELETE executed';
  END IF;
  PERFORM id FROM public.questions
    WHERE id IN ('2f1569c5-8375-4c95-a431-761dff17bbdd'::uuid,'9757b1d9-47ae-4a15-9812-1484c248de6f'::uuid) FOR UPDATE;
  PERFORM id FROM public.profiles WHERE id='a4bbe847-4a60-4574-b00e-dce8f4e10adc'::uuid FOR UPDATE;
  PERFORM id FROM public.user_progress WHERE id='4f62451b-8d24-43b2-8e89-92f55d3d4111'::uuid FOR UPDATE;
  IF (SELECT count(*) FROM public.questions WHERE
      (id='2f1569c5-8375-4c95-a431-761dff17bbdd'::uuid AND title='CodeStep-stop-c5684a334046-history') OR
      (id='9757b1d9-47ae-4a15-9812-1484c248de6f'::uuid AND title='CodeStep-stop-c5684a334046-save')) <> 2
    OR (SELECT count(*) FROM public.user_progress WHERE id='4f62451b-8d24-43b2-8e89-92f55d3d4111'::uuid
      AND user_id='a4bbe847-4a60-4574-b00e-dce8f4e10adc'::uuid AND question_id='2f1569c5-8375-4c95-a431-761dff17bbdd'::uuid) <> 1
    OR (SELECT count(*) FROM public.profiles WHERE id='a4bbe847-4a60-4574-b00e-dce8f4e10adc'::uuid
      AND name='学習者') <> 1
    OR EXISTS (SELECT 1 FROM public.user_progress
      WHERE question_id IN ('2f1569c5-8375-4c95-a431-761dff17bbdd'::uuid,'9757b1d9-47ae-4a15-9812-1484c248de6f'::uuid)
        AND (id <> '4f62451b-8d24-43b2-8e89-92f55d3d4111'::uuid OR user_id <> 'a4bbe847-4a60-4574-b00e-dce8f4e10adc'::uuid))
    OR EXISTS (SELECT 1 FROM public.user_progress
      WHERE user_id='a4bbe847-4a60-4574-b00e-dce8f4e10adc'::uuid
        AND question_id NOT IN ('2f1569c5-8375-4c95-a431-761dff17bbdd'::uuid,'9757b1d9-47ae-4a15-9812-1484c248de6f'::uuid)) THEN
    RAISE EXCEPTION 'Trial ID/count/reference mismatch; no DELETE executed';
  END IF;
  DELETE FROM ONLY public.user_progress WHERE id='4f62451b-8d24-43b2-8e89-92f55d3d4111'::uuid
    AND user_id='a4bbe847-4a60-4574-b00e-dce8f4e10adc'::uuid AND question_id='2f1569c5-8375-4c95-a431-761dff17bbdd'::uuid;
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed <> 1 THEN RAISE EXCEPTION 'Progress cleanup not exact'; END IF;
  DELETE FROM ONLY public.questions WHERE id IN ('2f1569c5-8375-4c95-a431-761dff17bbdd'::uuid,'9757b1d9-47ae-4a15-9812-1484c248de6f'::uuid);
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed <> 2 THEN RAISE EXCEPTION 'Question cleanup not exact'; END IF;
  DELETE FROM ONLY public.profiles WHERE id='a4bbe847-4a60-4574-b00e-dce8f4e10adc'::uuid AND name='学習者';
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed <> 1 THEN RAISE EXCEPTION 'Profile cleanup not exact'; END IF;
END
$cleanup$;
COMMIT;
