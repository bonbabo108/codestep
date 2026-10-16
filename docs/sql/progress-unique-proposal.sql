-- 提案のみ・未適用。本番は別途承認後。先にprogress-release-proposal.sqlでACLを最小化する。
-- 制約追加を別TXに分離。失敗しても、既に確定した最小ACLは巻き戻さない。
-- 重複を自動削除しない。適用済み/状態不明なら再送せず確認する。
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
LOCK TABLE public.user_progress IN ACCESS EXCLUSIVE MODE;
DO $review$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.user_progress'::regclass)
    OR has_table_privilege('anon','public.user_progress','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN')
    OR has_table_privilege('authenticated','public.user_progress','TRUNCATE,REFERENCES,TRIGGER,MAINTAIN,DELETE')
    OR has_any_column_privilege('anon','public.user_progress','SELECT,INSERT,UPDATE,REFERENCES') THEN
    RAISE EXCEPTION 'progress access not hardened; stop';
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_progress GROUP BY user_id,question_id HAVING count(*)>1) THEN
    RAISE EXCEPTION 'duplicate progress exists; preserve data and review separately';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.user_progress'::regclass AND contype='u') THEN
    RAISE EXCEPTION 'unique constraint already exists; inspect applied state';
  END IF;
END;
$review$;
ALTER TABLE public.user_progress ADD CONSTRAINT user_progress_user_question_key UNIQUE (user_id,question_id);
COMMIT;
