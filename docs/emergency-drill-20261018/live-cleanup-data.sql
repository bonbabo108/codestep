-- codestep-staging / ezjzgebehancbxqpgany only.
-- Cleanup only the recorded 2 questions, 1 progress and 1 trial profile.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $cleanup$
DECLARE changed integer;
BEGIN
  IF current_user <> 'postgres' THEN RAISE EXCEPTION 'Unexpected executor'; END IF;
  PERFORM id FROM public.questions
    WHERE id IN ('2f1569c5-8375-4c95-a431-761dff17bbdd'::uuid,'9757b1d9-47ae-4a15-9812-1484c248de6f'::uuid) FOR UPDATE;
  PERFORM id FROM public.profiles WHERE id='a4bbe847-4a60-4574-b00e-dce8f4e10adc'::uuid FOR UPDATE;
  IF (SELECT count(*) FROM public.questions WHERE
      (id='2f1569c5-8375-4c95-a431-761dff17bbdd'::uuid AND title='CodeStep-stop-c5684a334046-history') OR
      (id='9757b1d9-47ae-4a15-9812-1484c248de6f'::uuid AND title='CodeStep-stop-c5684a334046-save')) <> 2
    OR EXISTS (SELECT 1 FROM public.user_progress
      WHERE question_id IN ('2f1569c5-8375-4c95-a431-761dff17bbdd'::uuid,'9757b1d9-47ae-4a15-9812-1484c248de6f'::uuid)
        AND (id <> '4f62451b-8d24-43b2-8e89-92f55d3d4111'::uuid OR user_id <> 'a4bbe847-4a60-4574-b00e-dce8f4e10adc'::uuid))
    OR EXISTS (SELECT 1 FROM public.user_progress
      WHERE user_id='a4bbe847-4a60-4574-b00e-dce8f4e10adc'::uuid
        AND question_id NOT IN ('2f1569c5-8375-4c95-a431-761dff17bbdd'::uuid,'9757b1d9-47ae-4a15-9812-1484c248de6f'::uuid)) THEN
    RAISE EXCEPTION 'Trial scope changed; preserve all data';
  END IF;
  DELETE FROM public.user_progress WHERE id='4f62451b-8d24-43b2-8e89-92f55d3d4111'::uuid
    AND user_id='a4bbe847-4a60-4574-b00e-dce8f4e10adc'::uuid AND question_id='2f1569c5-8375-4c95-a431-761dff17bbdd'::uuid;
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed <> 1 THEN RAISE EXCEPTION 'Progress cleanup not exact'; END IF;
  DELETE FROM public.questions WHERE id IN ('2f1569c5-8375-4c95-a431-761dff17bbdd'::uuid,'9757b1d9-47ae-4a15-9812-1484c248de6f'::uuid);
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed <> 2 THEN RAISE EXCEPTION 'Question cleanup not exact'; END IF;
  DELETE FROM public.profiles WHERE id='a4bbe847-4a60-4574-b00e-dce8f4e10adc'::uuid AND name='学習者';
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed <> 1 THEN RAISE EXCEPTION 'Profile cleanup not exact'; END IF;
END
$cleanup$;
COMMIT;
