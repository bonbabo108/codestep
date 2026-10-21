BEGIN TRANSACTION READ ONLY;
SELECT CURRENT_TIMESTAMP AS observed_at,
  (SELECT count(*) FROM public.questions WHERE id IN ('2f1569c5-8375-4c95-a431-761dff17bbdd'::uuid,'9757b1d9-47ae-4a15-9812-1484c248de6f'::uuid)) AS trial_questions,
  (SELECT count(*) FROM public.user_progress WHERE question_id IN ('2f1569c5-8375-4c95-a431-761dff17bbdd'::uuid,'9757b1d9-47ae-4a15-9812-1484c248de6f'::uuid)) AS attached_progress,
  (SELECT count(*) FROM public.user_progress
    WHERE question_id IN ('2f1569c5-8375-4c95-a431-761dff17bbdd'::uuid,'9757b1d9-47ae-4a15-9812-1484c248de6f'::uuid) AND id NOT IN ('4f62451b-8d24-43b2-8e89-92f55d3d4111'::uuid)) AS unrecorded_attached_progress,
  (SELECT count(*) FROM public.user_progress WHERE user_id='a4bbe847-4a60-4574-b00e-dce8f4e10adc'::uuid
    AND question_id NOT IN ('2f1569c5-8375-4c95-a431-761dff17bbdd'::uuid,'9757b1d9-47ae-4a15-9812-1484c248de6f'::uuid)) AS other_progress_for_trial_user,
  (SELECT count(*) FROM public.profiles WHERE id='a4bbe847-4a60-4574-b00e-dce8f4e10adc'::uuid
    AND name='学習者') AS exact_trial_profile,
  (SELECT count(*) FROM auth.users WHERE id IN ('d2c1b05b-f104-48d3-b01c-0f348074d53a'::uuid,'a4bbe847-4a60-4574-b00e-dce8f4e10adc'::uuid)) AS trial_auth_users;
COMMIT;
