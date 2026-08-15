-- 1. Onboarding: new signup gets a company, profile, warehouse and admin role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_company_id uuid;
  v_name text;
  v_company_name text;
  v_code text;
BEGIN
  v_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), split_part(NEW.email, '@', 1));
  v_company_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'company_name'), ''), v_name || '''s Company');
  v_code := UPPER(REGEXP_REPLACE(LEFT(v_company_name, 6), '[^a-zA-Z0-9]', '', 'g'));
  IF v_code = '' THEN v_code := 'CO'; END IF;
  v_code := v_code || '-' || LEFT(REPLACE(NEW.id::text, '-', ''), 6);

  INSERT INTO public.companies (name, code, contact_email)
  VALUES (v_company_name, v_code, NEW.email)
  RETURNING id INTO v_company_id;

  INSERT INTO public.profiles (id, company_id, email, full_name)
  VALUES (NEW.id, v_company_id, NEW.email, v_name);

  INSERT INTO public.warehouses (company_id, name, code, location)
  VALUES (v_company_id, 'Main Warehouse', 'WH-MAIN', 'Not set')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_roles (user_id, role, company_id)
  VALUES (NEW.id, 'company_admin', v_company_id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;

-- 2. Repair existing accounts stuck without a company or role
DO $$
DECLARE
  r RECORD;
  v_company_id uuid;
BEGIN
  FOR r IN SELECT p.id, p.email, p.full_name FROM public.profiles p WHERE p.company_id IS NULL LOOP
    INSERT INTO public.companies (name, code, contact_email)
    VALUES (COALESCE(NULLIF(TRIM(r.full_name), ''), 'Company') || '''s Company',
            'CO-' || LEFT(REPLACE(r.id::text, '-', ''), 8),
            r.email)
    RETURNING id INTO v_company_id;

    UPDATE public.profiles SET company_id = v_company_id WHERE id = r.id;

    INSERT INTO public.warehouses (company_id, name, code, location)
    VALUES (v_company_id, 'Main Warehouse', 'WH-MAIN', 'Not set');

    INSERT INTO public.user_roles (user_id, role, company_id)
    VALUES (r.id, 'company_admin', v_company_id)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- 3. Company admins manage roles inside their own company only
DROP POLICY IF EXISTS "Company admins manage roles in their company" ON public.user_roles;
CREATE POLICY "Company admins manage roles in their company"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin')
  OR (public.has_role(auth.uid(), 'company_admin') AND company_id = public.get_user_company_id())
)
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin')
  OR (public.has_role(auth.uid(), 'company_admin') AND company_id = public.get_user_company_id())
);

-- 4. Members can read their own company
DROP POLICY IF EXISTS "Members can view their company" ON public.companies;
CREATE POLICY "Members can view their company"
ON public.companies
FOR SELECT
TO authenticated
USING (id = public.get_user_company_id() OR public.is_super_admin(auth.uid()));
