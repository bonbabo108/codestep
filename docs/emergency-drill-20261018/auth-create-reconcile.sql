BEGIN TRANSACTION READ ONLY;
SELECT CURRENT_TIMESTAMP AS observed_at,
  count(*) AS user_count,
  md5(COALESCE(jsonb_agg(
    jsonb_build_object('id',u.id,'app_metadata',u.raw_app_meta_data)
    ORDER BY u.id)::text,'[]')) AS metadata_fingerprint
FROM auth.users u;
COMMIT;
