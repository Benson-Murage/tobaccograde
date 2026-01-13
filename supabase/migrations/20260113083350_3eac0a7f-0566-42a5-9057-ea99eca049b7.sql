-- =====================================================
-- LEAFGRADE ENTERPRISE DATABASE SCHEMA
-- Multi-tenant, Audit-Compliant, Offline-Ready
-- =====================================================

-- 1. ROLE SYSTEM (Required for RBAC)
CREATE TYPE public.app_role AS ENUM (
  'super_admin',
  'company_admin', 
  'grader',
  'quality_supervisor',
  'farmer',
  'auditor'
);

CREATE TYPE public.bale_status AS ENUM (
  'registered',
  'pending_grading',
  'graded',
  'disputed',
  'approved',
  'paid'
);

CREATE TYPE public.dispute_status AS ENUM (
  'open',
  'under_review',
  'resolved',
  'escalated',
  'closed'
);

CREATE TYPE public.sync_status AS ENUM (
  'pending',
  'syncing',
  'synced',
  'conflict',
  'failed'
);

-- 2. COMPANIES (Multi-tenant root)
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  license_type TEXT DEFAULT 'trial',
  license_expires_at TIMESTAMPTZ,
  max_warehouses INTEGER DEFAULT 1,
  max_graders INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. WAREHOUSES
CREATE TABLE public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  location TEXT,
  gps_coordinates POINT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

-- 4. USER PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  device_id TEXT,
  device_fingerprint TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. USER ROLES (Separate table per security requirements)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role, company_id)
);

-- 6. FARMERS
CREATE TABLE public.farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  farmer_code TEXT NOT NULL,
  national_id TEXT,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  farm_location TEXT,
  gps_coordinates POINT,
  contract_number TEXT,
  contract_start_date DATE,
  contract_end_date DATE,
  bank_account TEXT,
  mobile_money_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, farmer_code)
);

-- 7. GRADING SEASONS
CREATE TABLE public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

-- 8. GRADING RULES (Version-controlled, configurable)
CREATE TABLE public.grading_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  season_id UUID REFERENCES public.seasons(id),
  version INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  description TEXT,
  rules JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 9. PRICE MATRICES
CREATE TABLE public.price_matrices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  season_id UUID REFERENCES public.seasons(id),
  version INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  currency TEXT DEFAULT 'USD',
  prices JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  effective_from DATE,
  effective_to DATE,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 10. BALES
CREATE TABLE public.bales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
  farmer_id UUID NOT NULL REFERENCES public.farmers(id),
  season_id UUID REFERENCES public.seasons(id),
  bale_code TEXT NOT NULL,
  qr_code TEXT,
  batch_number TEXT,
  lot_number TEXT,
  weight_kg DECIMAL(10,2) NOT NULL,
  registered_by UUID REFERENCES auth.users(id),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  device_id TEXT,
  status bale_status DEFAULT 'registered',
  sync_status sync_status DEFAULT 'pending',
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, bale_code)
);

-- 11. GRADINGS (Immutable after approval)
CREATE TABLE public.gradings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bale_id UUID NOT NULL REFERENCES public.bales(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  grading_rule_id UUID REFERENCES public.grading_rules(id),
  grader_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Grading parameters
  leaf_position TEXT NOT NULL,
  color TEXT NOT NULL,
  maturity TEXT NOT NULL,
  texture TEXT NOT NULL,
  moisture_percent DECIMAL(5,2),
  defect_percent DECIMAL(5,2),
  uniformity_score INTEGER,
  
  -- Calculated result
  grade_code TEXT NOT NULL,
  grade_class TEXT,
  confidence_score DECIMAL(5,2),
  
  -- Photos & evidence
  photo_urls TEXT[],
  notes TEXT,
  
  -- Workflow
  is_locked BOOLEAN DEFAULT false,
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES auth.users(id),
  
  -- Approval
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  -- Device & sync
  device_id TEXT,
  device_fingerprint TEXT,
  graded_offline BOOLEAN DEFAULT false,
  sync_status sync_status DEFAULT 'pending',
  synced_at TIMESTAMPTZ,
  
  -- Timestamps
  graded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. GRADING PRICES (Calculated values)
CREATE TABLE public.grading_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grading_id UUID NOT NULL REFERENCES public.gradings(id) ON DELETE CASCADE,
  price_matrix_id UUID REFERENCES public.price_matrices(id),
  unit_price DECIMAL(10,4) NOT NULL,
  total_value DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. DISPUTES
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grading_id UUID NOT NULL REFERENCES public.gradings(id),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  raised_by UUID NOT NULL REFERENCES auth.users(id),
  raised_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT NOT NULL,
  evidence_urls TEXT[],
  status dispute_status DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  
  -- Resolution
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  new_grade_code TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. AUDIT LOGS (Immutable, append-only)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  device_id TEXT,
  device_fingerprint TEXT,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. SYNC QUEUE (Offline-first)
CREATE TABLE public.sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  device_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  operation TEXT NOT NULL,
  payload JSONB NOT NULL,
  priority INTEGER DEFAULT 0,
  status sync_status DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- 16. DEVICE REGISTRATIONS
CREATE TABLE public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT,
  fingerprint TEXT,
  user_id UUID REFERENCES auth.users(id),
  is_trusted BOOLEAN DEFAULT false,
  trusted_by UUID REFERENCES auth.users(id),
  trusted_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, device_id)
);

-- 17. LICENSE USAGE TRACKING
CREATE TABLE public.license_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  season_id UUID REFERENCES public.seasons(id),
  metric_type TEXT NOT NULL,
  metric_value INTEGER NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. PAYMENTS (Integration-ready)
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  farmer_id UUID NOT NULL REFERENCES public.farmers(id),
  season_id UUID REFERENCES public.seasons(id),
  total_weight_kg DECIMAL(12,2),
  total_value DECIMAL(14,2),
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  payment_reference TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- SECURITY: Row Level Security Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_matrices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gradings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Helper function: Get user's company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Helper function: Check if user has role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper function: Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- Helper function: Check if user can access company
CREATE OR REPLACE FUNCTION public.can_access_company(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND company_id = _company_id
  ) OR public.is_super_admin(_user_id)
$$;

-- PROFILES policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Company admins can view company profiles"
  ON public.profiles FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- USER_ROLES policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage company roles"
  ON public.user_roles FOR ALL
  USING (
    public.has_role(auth.uid(), 'company_admin')
    AND company_id = public.get_user_company_id()
  );

CREATE POLICY "Super admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.is_super_admin(auth.uid()));

-- COMPANIES policies
CREATE POLICY "Company members can view their company"
  ON public.companies FOR SELECT
  USING (
    id = public.get_user_company_id()
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Super admins can manage companies"
  ON public.companies FOR ALL
  USING (public.is_super_admin(auth.uid()));

-- WAREHOUSES policies
CREATE POLICY "Company members can view warehouses"
  ON public.warehouses FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Company admins can manage warehouses"
  ON public.warehouses FOR ALL
  USING (
    company_id = public.get_user_company_id()
    AND public.has_role(auth.uid(), 'company_admin')
  );

-- FARMERS policies
CREATE POLICY "Company members can view farmers"
  ON public.farmers FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Company staff can manage farmers"
  ON public.farmers FOR ALL
  USING (
    company_id = public.get_user_company_id()
    AND (
      public.has_role(auth.uid(), 'company_admin')
      OR public.has_role(auth.uid(), 'grader')
    )
  );

-- SEASONS policies
CREATE POLICY "Company members can view seasons"
  ON public.seasons FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Company admins can manage seasons"
  ON public.seasons FOR ALL
  USING (
    company_id = public.get_user_company_id()
    AND public.has_role(auth.uid(), 'company_admin')
  );

-- GRADING_RULES policies
CREATE POLICY "Company members can view grading rules"
  ON public.grading_rules FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Company admins can manage grading rules"
  ON public.grading_rules FOR ALL
  USING (
    company_id = public.get_user_company_id()
    AND public.has_role(auth.uid(), 'company_admin')
  );

-- PRICE_MATRICES policies
CREATE POLICY "Company members can view prices"
  ON public.price_matrices FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Company admins can manage prices"
  ON public.price_matrices FOR ALL
  USING (
    company_id = public.get_user_company_id()
    AND public.has_role(auth.uid(), 'company_admin')
  );

-- BALES policies
CREATE POLICY "Company members can view bales"
  ON public.bales FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Graders can register bales"
  ON public.bales FOR INSERT
  WITH CHECK (
    company_id = public.get_user_company_id()
    AND (
      public.has_role(auth.uid(), 'grader')
      OR public.has_role(auth.uid(), 'company_admin')
    )
  );

CREATE POLICY "Graders can update bales"
  ON public.bales FOR UPDATE
  USING (
    company_id = public.get_user_company_id()
    AND (
      public.has_role(auth.uid(), 'grader')
      OR public.has_role(auth.uid(), 'company_admin')
    )
  );

-- GRADINGS policies
CREATE POLICY "Company members can view gradings"
  ON public.gradings FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Graders can create gradings"
  ON public.gradings FOR INSERT
  WITH CHECK (
    company_id = public.get_user_company_id()
    AND public.has_role(auth.uid(), 'grader')
  );

CREATE POLICY "Supervisors can update gradings"
  ON public.gradings FOR UPDATE
  USING (
    company_id = public.get_user_company_id()
    AND (
      public.has_role(auth.uid(), 'quality_supervisor')
      OR public.has_role(auth.uid(), 'company_admin')
    )
  );

-- GRADING_PRICES policies
CREATE POLICY "Company members can view grading prices"
  ON public.grading_prices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gradings g
      WHERE g.id = grading_id
      AND g.company_id = public.get_user_company_id()
    )
    OR public.is_super_admin(auth.uid())
  );

-- DISPUTES policies
CREATE POLICY "Company members can view disputes"
  ON public.disputes FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Users can raise disputes"
  ON public.disputes FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Supervisors can manage disputes"
  ON public.disputes FOR UPDATE
  USING (
    company_id = public.get_user_company_id()
    AND public.has_role(auth.uid(), 'quality_supervisor')
  );

-- AUDIT_LOGS policies (append-only, no updates/deletes)
CREATE POLICY "Company members can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    OR public.is_super_admin(auth.uid())
    OR public.has_role(auth.uid(), 'auditor')
  );

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- SYNC_QUEUE policies
CREATE POLICY "Users can manage own sync queue"
  ON public.sync_queue FOR ALL
  USING (company_id = public.get_user_company_id());

-- DEVICES policies
CREATE POLICY "Company members can view devices"
  ON public.devices FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Admins can manage devices"
  ON public.devices FOR ALL
  USING (
    company_id = public.get_user_company_id()
    AND public.has_role(auth.uid(), 'company_admin')
  );

-- LICENSE_USAGE policies
CREATE POLICY "Admins can view license usage"
  ON public.license_usage FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    OR public.is_super_admin(auth.uid())
  );

-- PAYMENTS policies
CREATE POLICY "Company members can view payments"
  ON public.payments FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    OR public.is_super_admin(auth.uid())
  );

-- =====================================================
-- TRIGGERS: Audit logging & timestamps
-- =====================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_warehouses_updated_at
  BEFORE UPDATE ON public.warehouses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_farmers_updated_at
  BEFORE UPDATE ON public.farmers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bales_updated_at
  BEFORE UPDATE ON public.bales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Audit log trigger for gradings
CREATE OR REPLACE FUNCTION public.audit_grading_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      company_id, user_id, action, entity_type, entity_id,
      old_values, new_values
    ) VALUES (
      NEW.company_id, auth.uid(), 'UPDATE', 'grading', NEW.id,
      to_jsonb(OLD), to_jsonb(NEW)
    );
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      company_id, user_id, action, entity_type, entity_id,
      new_values
    ) VALUES (
      NEW.company_id, auth.uid(), 'INSERT', 'grading', NEW.id,
      to_jsonb(NEW)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_gradings
  AFTER INSERT OR UPDATE ON public.gradings
  FOR EACH ROW EXECUTE FUNCTION public.audit_grading_changes();

-- Audit log trigger for price changes
CREATE OR REPLACE FUNCTION public.audit_price_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    company_id, user_id, action, entity_type, entity_id,
    old_values, new_values
  ) VALUES (
    COALESCE(NEW.company_id, OLD.company_id), 
    auth.uid(), 
    TG_OP, 
    'price_matrix', 
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_price_matrices
  AFTER INSERT OR UPDATE OR DELETE ON public.price_matrices
  FOR EACH ROW EXECUTE FUNCTION public.audit_price_changes();

-- Lock grading after approval
CREATE OR REPLACE FUNCTION public.lock_approved_grading()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_locked = true AND NEW.is_locked = false THEN
    RAISE EXCEPTION 'Cannot unlock an approved grading';
  END IF;
  
  IF NEW.approved_by IS NOT NULL AND OLD.approved_by IS NULL THEN
    NEW.is_locked = true;
    NEW.locked_at = now();
    NEW.locked_by = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lock_grading_on_approval
  BEFORE UPDATE ON public.gradings
  FOR EACH ROW EXECUTE FUNCTION public.lock_approved_grading();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- INDEXES for performance
-- =====================================================

CREATE INDEX idx_bales_company_id ON public.bales(company_id);
CREATE INDEX idx_bales_farmer_id ON public.bales(farmer_id);
CREATE INDEX idx_bales_warehouse_id ON public.bales(warehouse_id);
CREATE INDEX idx_bales_status ON public.bales(status);
CREATE INDEX idx_bales_sync_status ON public.bales(sync_status);

CREATE INDEX idx_gradings_bale_id ON public.gradings(bale_id);
CREATE INDEX idx_gradings_company_id ON public.gradings(company_id);
CREATE INDEX idx_gradings_grader_id ON public.gradings(grader_id);
CREATE INDEX idx_gradings_grade_code ON public.gradings(grade_code);
CREATE INDEX idx_gradings_graded_at ON public.gradings(graded_at);

CREATE INDEX idx_farmers_company_id ON public.farmers(company_id);
CREATE INDEX idx_farmers_farmer_code ON public.farmers(farmer_code);

CREATE INDEX idx_audit_logs_company_id ON public.audit_logs(company_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

CREATE INDEX idx_sync_queue_status ON public.sync_queue(status);
CREATE INDEX idx_sync_queue_company_device ON public.sync_queue(company_id, device_id);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_profiles_company_id ON public.profiles(company_id);