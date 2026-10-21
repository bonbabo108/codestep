-- 本番xdnmlfoblqdygsnhkxxp向け提案。未承認・未適用。バックアップ検証後、新しい本番承認でのみ適用。
-- staging原本は保持。以下の実行SQLは検証済み原本と同一。既存データを適用時に削除しない。
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $guard$
BEGIN
  IF current_user <> 'postgres'
    OR EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'codestep_private')
    OR EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.proname='delete_question_with_progress') THEN
    RAISE EXCEPTION 'Unexpected deployment state; review before applying';
  END IF;
END
$guard$;

CREATE SCHEMA codestep_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA codestep_private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA codestep_private TO authenticated;

-- 他人の進捗を読む/削除する権限はこの固定処理内だけに閉じ込める。
-- UI用の有無確認も、削除も同じJWTの厳密な管理者判定を通る。
CREATE FUNCTION codestep_private.delete_question_with_progress(
  p_question_id uuid,
  p_confirm boolean DEFAULT false,
  p_delete_progress boolean DEFAULT false
)
RETURNS TABLE(question_id uuid, has_progress boolean, deleted boolean)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = ''
SET lock_timeout = '5s'
AS $function$
DECLARE
  v_id uuid;
  v_has_progress boolean;
BEGIN
  IF auth.uid() IS NULL
    OR (auth.jwt()->>'role') IS DISTINCT FROM 'authenticated'
    OR (auth.jwt()->'app_metadata'->'codestep_admin') IS DISTINCT FROM 'true'::jsonb THEN
    RAISE EXCEPTION 'Administrator required' USING ERRCODE='42501';
  END IF;
  IF p_question_id IS NULL OR p_confirm IS NULL OR p_delete_progress IS NULL THEN
    RAISE EXCEPTION 'Invalid deletion arguments' USING ERRCODE='22023';
  END IF;

  IF p_confirm THEN
    -- FKの参照側INSERTが取るKEY SHAREと競合し、削除中の新規進捗を防ぐ。
    SELECT q.id INTO v_id FROM public.questions q WHERE q.id=p_question_id FOR UPDATE;
  ELSE
    SELECT q.id INTO v_id FROM public.questions q WHERE q.id=p_question_id;
  END IF;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question not found' USING ERRCODE='P0002';
  END IF;
  SELECT EXISTS(SELECT 1 FROM public.user_progress p WHERE p.question_id=v_id)
    INTO v_has_progress;

  -- 確認後に履歴が増えた場合は書き込まず、新しい警告への再確認を要求する。
  IF NOT p_confirm OR (v_has_progress AND NOT p_delete_progress) THEN
    RETURN QUERY SELECT v_id, v_has_progress, false;
    RETURN;
  END IF;

  DELETE FROM public.user_progress p WHERE p.question_id=v_id;
  DELETE FROM public.questions q WHERE q.id=v_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question deletion not confirmed' USING ERRCODE='P0002';
  END IF;
  -- 例外は握りつぶさない。2つのDELETEはRPCの1トランザクションで巻き戻る。
  RETURN QUERY SELECT v_id, v_has_progress, true;
END
$function$;

CREATE FUNCTION public.delete_question_with_progress(
  p_question_id uuid,
  p_confirm boolean DEFAULT false,
  p_delete_progress boolean DEFAULT false
)
RETURNS TABLE(question_id uuid, has_progress boolean, deleted boolean)
LANGUAGE sql VOLATILE SECURITY INVOKER
SET search_path = ''
AS $wrapper$
  SELECT * FROM codestep_private.delete_question_with_progress(
    p_question_id, p_confirm, p_delete_progress
  );
$wrapper$;

-- Supabaseのデフォルト関数権限も含め、暗黙の公開EXECUTEを取り除く。
REVOKE ALL ON FUNCTION codestep_private.delete_question_with_progress(uuid,boolean,boolean)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.delete_question_with_progress(uuid,boolean,boolean)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION codestep_private.delete_question_with_progress(uuid,boolean,boolean)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_question_with_progress(uuid,boolean,boolean)
  TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
