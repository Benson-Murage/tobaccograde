-- 1. SECURITY DEFINER helper functions: RLS evaluators, callable by authenticated only
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.audit_grading_changes() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.audit_price_changes() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_company_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_access_company(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.audit_grading_changes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.audit_price_changes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_company(uuid, uuid) TO authenticated;

-- 2. Audit log inserts: a user may only create audit rows attributed to themselves
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Users can insert own audit logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 3. Traceability ledger is append-only system data: no direct client inserts
DROP POLICY IF EXISTS "Authenticated can insert ledger entries" ON public.traceability_ledger;

-- 4. Storage: scope grading-images access to the uploader's company folder
DROP POLICY IF EXISTS "Graders can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Graders can update their uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can view company grading images" ON storage.objects;
CREATE POLICY "Company members can upload grading images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'grading-images'
    AND (storage.foldername(name))[1] = get_user_company_id()::text
  );
CREATE POLICY "Company members can update grading images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'grading-images'
    AND (storage.foldername(name))[1] = get_user_company_id()::text
  )
  WITH CHECK (
    bucket_id = 'grading-images'
    AND (storage.foldername(name))[1] = get_user_company_id()::text
  );
CREATE POLICY "Company members can view grading images"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'grading-images'
    AND (
      (storage.foldername(name))[1] = get_user_company_id()::text
      OR is_super_admin(auth.uid())
    )
  );