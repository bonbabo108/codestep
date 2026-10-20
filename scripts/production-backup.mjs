// 本番への接続/書込は行わない。queryはREAD ONLYの暗号化export SQLを生成、verifyはメモリ内Postgresへだけ復元する。
// npm依存はアプリ外の一時環境。秘密鍵/実データ/SQLエラー本文をstdoutへ出さない。
// 対象は2026-10-21の変更前スナップショットに固定。init/query/receiveを変更後の再取得に使わない。
// 依存: /private/tmp/codestep-backup-tools に openpgp@6.3.2 / @electric-sql/pglite@0.4.6。
// schema-restore.sqlは変更前の広い権限も含む復元検証資料。本番へそのまま適用しない。
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
const require = createRequire('/private/tmp/codestep-backup-tools/package.json')
const pgp = await import(require.resolve('openpgp'))
const { PGlite } = require('@electric-sql/pglite')
const root = join(homedir(), '.codestep-private-backups', '2026-10-21')
const ref = 'xdnmlfoblqdygsnhkxxp'
let stage = 'start'
const tables = ['profiles', 'questions', 'user_progress']
const quote = value => '"' + value.replaceAll('"', '""') + '"'
const literal = value => "'" + value.replaceAll("'", "''") + "'"
const sha = value => createHash('sha256').update(value).digest('hex')
const canonical = value => JSON.stringify(value, (_, v) => v && !Array.isArray(v) && typeof v === 'object' ? Object.fromEntries(Object.entries(v).sort()) : v)
const privateWrite = (name, value) => writeFile(join(root, name), value, { mode: 0o600, flag: 'wx' })
const readPrivate = name => readFile(join(root, name), 'utf8')
const tableSnapshot = `SELECT jsonb_agg(jsonb_build_object('name',c.relname,'owner',pg_get_userbyid(c.relowner),'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity,
 'columns',(SELECT jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'notnull',a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid)) ORDER BY a.attnum) FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped),
 'constraints',COALESCE((SELECT jsonb_agg(jsonb_build_object('name',k.conname,'type',k.contype,'definition',pg_get_constraintdef(k.oid)) ORDER BY k.conname) FROM pg_constraint k WHERE k.conrelid=c.oid),'[]'::jsonb),
 'policies',COALESCE((SELECT jsonb_agg(jsonb_build_object('name',p.policyname,'permissive',p.permissive,'roles',p.roles,'cmd',p.cmd,'using',p.qual,'check',p.with_check) ORDER BY p.policyname) FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=c.relname),'[]'::jsonb),
 'acl',(SELECT jsonb_agg(jsonb_build_object('role',CASE WHEN x.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(x.grantee) END,'privilege',x.privilege_type,'grantable',x.is_grantable) ORDER BY x.grantee,x.privilege_type) FROM aclexplode(COALESCE(c.relacl,acldefault('r',c.relowner))) x),
 'column_acl',COALESCE((SELECT jsonb_agg(jsonb_build_object('column',a.attname,'role',CASE WHEN x.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(x.grantee) END,'privilege',x.privilege_type,'grantable',x.is_grantable) ORDER BY a.attname,x.grantee,x.privilege_type) FROM pg_attribute a CROSS JOIN LATERAL aclexplode(a.attacl) x WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped),'[]'::jsonb)
 ) ORDER BY c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('profiles','questions','user_progress')`;
const rolespec = name => name.toLowerCase() === 'public' ? 'PUBLIC' : quote(name)
function schemaSql(snapshot) {
  const lines = ["SET search_path=public,pg_catalog; SET TIME ZONE 'UTC'; SET standard_conforming_strings=on;"]
  for (const table of snapshot.tables) {
    assert.ok(tables.includes(table.name)); assert.equal(table.owner, 'postgres')
    for (const col of table.columns) {
      assert.ok(['uuid','text','boolean','timestamp with time zone'].includes(col.type))
      assert.ok([null,'now()','gen_random_uuid()','false'].includes(col.default))
    }
    lines.push(`CREATE TABLE public.${quote(table.name)} (${table.columns.map(col => `${quote(col.name)} ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.default ? ' DEFAULT ' + col.default : ''}`).join(',')});`)
    lines.push(`ALTER TABLE public.${quote(table.name)} OWNER TO postgres;`)
  }
  for (const kind of ['p','u','f','c']) for (const table of snapshot.tables) for (const constraint of table.constraints.filter(c => c.type === kind)) lines.push(`ALTER TABLE public.${quote(table.name)} ADD CONSTRAINT ${quote(constraint.name)} ${constraint.definition};`)
  for (const table of snapshot.tables) {
    if (table.rls) lines.push(`ALTER TABLE public.${quote(table.name)} ENABLE ROW LEVEL SECURITY;`)
    if (table.force_rls) lines.push(`ALTER TABLE public.${quote(table.name)} FORCE ROW LEVEL SECURITY;`)
    for (const policy of table.policies) {
      assert.ok(['SELECT','INSERT','UPDATE','DELETE','ALL'].includes(policy.cmd)); assert.ok(['PERMISSIVE','RESTRICTIVE'].includes(policy.permissive))
      lines.push(`CREATE POLICY ${quote(policy.name)} ON public.${quote(table.name)} AS ${policy.permissive} FOR ${policy.cmd} TO ${policy.roles.map(rolespec).join(',')}${policy.using ? ' USING ('+policy.using+')' : ''}${policy.check ? ' WITH CHECK ('+policy.check+')' : ''};`)
    }
    const roles = [...new Set(['PUBLIC',...table.acl.map(a=>a.role),...table.column_acl.map(a=>a.role)])]
    lines.push(`REVOKE ALL ON public.${quote(table.name)} FROM ${roles.map(rolespec).join(',')};`)
    for (const grant of [...table.acl,...table.column_acl]) {
      assert.ok(['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN'].includes(grant.privilege))
      lines.push(`GRANT ${grant.privilege}${grant.column ? ' ('+quote(grant.column)+')' : ''} ON public.${quote(table.name)} TO ${rolespec(grant.role)}${grant.grantable ? ' WITH GRANT OPTION' : ''};`)
    }
  }
  return lines.join('\n')
}
async function main() {
  const mode = process.argv[2]
  if (mode === 'probe') {
    const db = new PGlite()
    try { const version = (await db.query('SHOW server_version')).rows[0].server_version; assert.ok(version.startsWith('17.')); await db.exec('CREATE ROLE anon; CREATE TABLE fixture(id uuid PRIMARY KEY DEFAULT gen_random_uuid()); ALTER TABLE fixture ENABLE ROW LEVEL SECURITY; CREATE POLICY read_fixture ON fixture TO anon USING(true); GRANT SELECT ON fixture TO anon;'); console.log(JSON.stringify({version,isolatedSqlProbe:true})) } finally { await db.close() }
    return
  }
  if (mode === 'init') {
    await mkdir(root, { recursive: true, mode: 0o700 })
    assert.equal((await stat(root)).mode & 0o777, 0o700)
    const key = await pgp.generateKey({ type:'rsa', rsaBits:3072, userIDs:[{name:'CodeStep private backup'}], format:'armored', config:{v6Keys:false} })
    await privateWrite('private-key.asc',key.privateKey); await privateWrite('public-key.asc',key.publicKey)
    console.log(JSON.stringify({privateDirectoryReady:true,publicKeySha256:sha(key.publicKey)}));return
  }
  assert.equal((await stat(root)).mode & 0o777,0o700)
  if (mode === 'query') {
    const key = await readPrivate('public-key.asc')
    assert.ok(key.includes('BEGIN PGP PUBLIC KEY BLOCK'))
    const query = `BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
WITH snapshot AS (SELECT jsonb_build_object('format',1,'project',${literal(ref)},'taken_at',now(),'server_version',current_setting('server_version'),
 'tables',(${tableSnapshot}),
 'rows',jsonb_build_object('profiles',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY id),'[]'::jsonb) FROM public.profiles t),'questions',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY id),'[]'::jsonb) FROM public.questions t),'user_progress',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY id),'[]'::jsonb) FROM public.user_progress t)),
 'auth_app_metadata',(SELECT jsonb_agg(jsonb_build_object('id',id,'app_metadata',raw_app_meta_data) ORDER BY id) FROM auth.users),
 'auth_functions',jsonb_build_array(pg_get_functiondef('auth.uid()'::regprocedure),pg_get_functiondef('auth.jwt()'::regprocedure)),
 'unsupported_objects',jsonb_build_object('triggers',(SELECT count(*) FROM pg_trigger WHERE tgrelid IN ('public.profiles'::regclass,'public.questions'::regclass,'public.user_progress'::regclass) AND NOT tgisinternal),'extra_indexes',(SELECT count(*) FROM pg_index i WHERE i.indrelid IN ('public.profiles'::regclass,'public.questions'::regclass,'public.user_progress'::regclass) AND NOT EXISTS(SELECT 1 FROM pg_constraint k WHERE k.conindid=i.indexrelid)),'public_functions',(SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e'))),
 'private_schema_exists',EXISTS(SELECT 1 FROM pg_namespace WHERE nspname='codestep_private'),
 'auth_config_before',jsonb_build_object('site_url','http://localhost:3000','redirect_urls',jsonb_build_array(),'confirm_email',false,'custom_smtp',false),
 'previous_production',jsonb_build_object('sha','274eb794a6ad8ec90bb20e216a3b2ed68c237cac','deployment','dpl_7y4n5KfqLz8jHYn9KRh2SmTyDpjF')) AS value),
 encrypted AS (SELECT extensions.pgp_pub_encrypt(value::text,extensions.dearmor(${literal(key)}),'cipher-algo=aes256,compress-algo=1') AS bytes FROM snapshot)
SELECT encode(bytes,'base64') AS encrypted_backup,encode(extensions.digest(bytes,'sha256'),'hex') AS sha256 FROM encrypted;
COMMIT;`
    console.log(query);return
  }
  if (mode === 'receive') {
    const bytes = Buffer.from(process.argv[3], 'base64'); assert.equal(sha(bytes),process.argv[4]); await privateWrite('production-before.pgp',bytes); console.log(JSON.stringify({encryptedBackupSaved:true,bytes:bytes.length}));return
  }
  if (!['verify','current-check-query'].includes(mode)) throw new Error('Unknown mode')
  const bytes = await readFile(join(root,'production-before.pgp'))
  const key = await pgp.readPrivateKey({armoredKey:await readPrivate('private-key.asc')})
  stage='decrypt'; const decrypted = await pgp.decrypt({message:await pgp.readMessage({binaryMessage:bytes}),decryptionKeys:key})
  const snapshot = JSON.parse(decrypted.data)
  stage='validate-snapshot'; assert.ok(Object.values(snapshot.unsupported_objects).every(n=>n===0)); assert.equal(snapshot.project,ref); assert.equal(snapshot.format,1); assert.equal(snapshot.tables.length,3); assert.ok(snapshot.server_version.startsWith('17.')); assert.equal(snapshot.private_schema_exists,false)
  assert.equal(snapshot.auth_app_metadata.length,1)
  if(mode==='current-check-query') {
    const db = new PGlite()
    try {
      const digest = async value => (await db.query('SELECT md5($1::jsonb::text) AS hash',[JSON.stringify(value)])).rows[0].hash
      const checks = []
      for(const table of tables) checks.push(`(SELECT md5(COALESCE(jsonb_agg(to_jsonb(t) ORDER BY id),'[]'::jsonb)::text) FROM public.${quote(table)} t)=${literal(await digest(snapshot.rows[table]))}`)
      const authCheck=`(SELECT count(*)=1 AND md5(jsonb_agg(jsonb_build_object('id',id,'app_metadata',raw_app_meta_data) ORDER BY id)::text)=${literal(await digest(snapshot.auth_app_metadata))} FROM auth.users)`
      console.log(`BEGIN READ ONLY; SELECT jsonb_build_object('data_unchanged',${checks.join(' AND ')},'target_auth_unchanged',${authCheck},'catalog_unchanged',md5((${tableSnapshot})::text)=${literal(await digest(snapshot.tables))}) AS comparison; COMMIT;`)
    } finally {await db.close()}
    return
  }
  const ddl = schemaSql(snapshot)
  try { await privateWrite('schema-restore.sql',ddl) } catch (error) { if(error.code!=='EEXIST') throw error; assert.equal(await readPrivate('schema-restore.sql'),ddl) }
  const db = new PGlite()
  try {
    const version = (await db.query('SHOW server_version')).rows[0].server_version; assert.ok(version.startsWith('17.'))
    assert.equal((await db.query('SELECT current_user')).rows[0].current_user,'postgres')
    const roles = [...new Set(snapshot.tables.flatMap(t=>[...t.acl,...t.column_acl]).map(g=>g.role))].filter(r=>!['PUBLIC','postgres'].includes(r))
    stage='restore-roles-auth'; await db.exec(roles.map(r=>`CREATE ROLE ${quote(r)} NOLOGIN;`).join('\n')+'\nCREATE SCHEMA auth;\n'+snapshot.auth_functions.map(def=>def.trim().replace(/;$/,'')+';').join('\n'))
    stage='restore-schema'; await db.exec(ddl)
    // 本番では実行しない。PGliteの専用メモリにパラメータ付きで復元。
    stage='restore-rows'; for (const table of tables) await db.query(`INSERT INTO public.${quote(table)} SELECT * FROM jsonb_populate_recordset(NULL::public.${quote(table)},$1::jsonb)`,[JSON.stringify(snapshot.rows[table])])
    for (const table of tables) { stage='compare-rows-'+table; const rows=(await db.query(`SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY id),'[]'::jsonb) AS rows FROM public.${quote(table)} t`)).rows[0].rows; assert.equal(canonical(rows),canonical(snapshot.rows[table])) }
    stage='compare-catalog'; const restored=(await db.query(`SELECT (${tableSnapshot}) AS tables`)).rows[0].tables
    // ローカルのロールOIDは本番と異なるため、ACLの並び順だけを正規化して比較。
    const normalize = rows => rows.map(t=>({...t,acl:t.acl.toSorted((a,b)=>canonical(a).localeCompare(canonical(b))),column_acl:t.column_acl.toSorted((a,b)=>canonical(a).localeCompare(canonical(b)))}))
    assert.equal(canonical(normalize(restored)),canonical(normalize(snapshot.tables)))
    stage='restore-auth-metadata'; await db.exec('CREATE TABLE auth.metadata_restore_fixture(id uuid PRIMARY KEY, app_metadata jsonb);')
    await db.query('INSERT INTO auth.metadata_restore_fixture SELECT * FROM jsonb_populate_recordset(NULL::auth.metadata_restore_fixture,$1::jsonb)',[JSON.stringify(snapshot.auth_app_metadata)])
    assert.equal(canonical((await db.query('SELECT jsonb_agg(to_jsonb(t) ORDER BY id) AS rows FROM auth.metadata_restore_fixture t')).rows[0].rows),canonical(snapshot.auth_app_metadata))
    const report={verified_on:'2026-10-21',project:ref,encryptedBackupSha256:sha(bytes),sourceVersion:snapshot.server_version,restoreVersion:version,counts:Object.fromEntries(tables.map(t=>[t,snapshot.rows[t].length])),rowsEqual:true,columnsConstraintsPoliciesOwnersAndAclEqual:true,authAppMetadataRoundtrip:true,scope:'three public tables and target Auth app_metadata only; no credentials/sessions; local PostgreSQL WASM restore, not hosted Supabase/PITR test'}
    const reportText = JSON.stringify(report,null,2)+'\n'
    try { await privateWrite('verification.json',reportText) } catch (error) { if(error.code!=='EEXIST') throw error; assert.equal(await readPrivate('verification.json'),reportText) }
    console.log(JSON.stringify(report))
  } finally {await db.close()}
}
try {await main()} catch (error) {console.error(JSON.stringify({operationFailed:true,stage,code:typeof error.code==='string'?error.code:'unknown',productionWrites:false,privateErrorDetailsSuppressed:true}));process.exitCode=1}
