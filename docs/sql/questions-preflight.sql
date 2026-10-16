-- 読み取り専用。人間が管理画面の本番/検証プロジェクト識別子を照合してから使用。
-- current_database() はプロジェクト識別子の代わりにならない。
BEGIN TRANSACTION READ ONLY;
SELECT current_setting('transaction_read_only') AS read_only;
SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity, pg_get_userbyid(c.relowner) AS owner
FROM pg_class c WHERE c.oid='public.questions'::regclass;
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname='public' AND tablename='questions' ORDER BY policyname;
SELECT r.role, p.privilege, has_table_privilege(r.role,'public.questions',p.privilege) AS allowed
FROM (VALUES ('anon'),('authenticated')) r(role)
CROSS JOIN (VALUES ('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER'),('MAINTAIN')) p(privilege);
SELECT r.role, a.attname,
  has_column_privilege(r.role,a.attrelid,a.attnum,'INSERT') AS can_insert,
  has_column_privilege(r.role,a.attrelid,a.attnum,'UPDATE') AS can_update
FROM pg_attribute a CROSS JOIN (VALUES ('anon'),('authenticated')) r(role)
WHERE a.attrelid='public.questions'::regclass AND a.attnum>0 AND NOT a.attisdropped;
COMMIT;
