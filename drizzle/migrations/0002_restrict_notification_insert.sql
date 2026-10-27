-- Notifications must not be spoofable: an authenticated user may only insert
-- notifications inside their own company (system events, not arbitrary targets).
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Company members can insert own-company notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = get_user_company_id()
    AND company_id IS NOT NULL
  );