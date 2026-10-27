-- /disputes and /supervisor routes allow company_admin and super_admin; the update policy must match
DROP POLICY IF EXISTS "Supervisors can manage disputes" ON public.disputes;
CREATE POLICY "Supervisors can manage disputes"
  ON public.disputes
  FOR UPDATE
  TO authenticated
  USING (
    company_id = get_user_company_id()
    AND (
      has_role(auth.uid(), 'quality_supervisor'::app_role)
      OR has_role(auth.uid(), 'company_admin'::app_role)
      OR has_role(auth.uid(), 'super_admin'::app_role)
    )
  )
  WITH CHECK (
    company_id = get_user_company_id()
    AND (
      has_role(auth.uid(), 'quality_supervisor'::app_role)
      OR has_role(auth.uid(), 'company_admin'::app_role)
      OR has_role(auth.uid(), 'super_admin'::app_role)
    )
  );