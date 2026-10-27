-- company_admin and super_admin can grade (matches app routes); graders keep access
DROP POLICY IF EXISTS "Graders can create gradings" ON public.gradings;
CREATE POLICY "Graders can create gradings"
  ON public.gradings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = get_user_company_id()
    AND (
      has_role(auth.uid(), 'grader'::app_role)
      OR has_role(auth.uid(), 'company_admin'::app_role)
      OR has_role(auth.uid(), 'super_admin'::app_role)
    )
  );

-- grading_prices had no INSERT policy: graders/admins may price a grading in their company
DROP POLICY IF EXISTS "Graders can insert grading prices" ON public.grading_prices;
CREATE POLICY "Graders can insert grading prices"
  ON public.grading_prices
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gradings g
      WHERE g.id = grading_prices.grading_id
        AND g.company_id = get_user_company_id()
        AND (
          has_role(auth.uid(), 'grader'::app_role)
          OR has_role(auth.uid(), 'company_admin'::app_role)
          OR has_role(auth.uid(), 'super_admin'::app_role)
        )
    )
  );

-- audit_logs: only authenticated users writing their own rows (no anon writes)
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());