-- AI-Assisted Grading Schema
-- This schema supports computer vision analysis, human-in-the-loop workflows,
-- and comprehensive audit trails for regulatory compliance.

-- =====================================================
-- 1. AI MODEL VERSION CONTROL
-- =====================================================

CREATE TABLE public.ai_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT,
  model_type TEXT NOT NULL DEFAULT 'vision',
  provider TEXT NOT NULL DEFAULT 'lovable_ai',
  config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, name, version)
);

-- =====================================================
-- 2. GRADING IMAGE STORAGE
-- =====================================================

CREATE TABLE public.grading_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  bale_id UUID REFERENCES public.bales(id) ON DELETE SET NULL,
  grading_id UUID REFERENCES public.gradings(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  image_type TEXT NOT NULL DEFAULT 'primary',
  capture_metadata JSONB DEFAULT '{}'::jsonb,
  grader_id UUID REFERENCES auth.users(id),
  device_id TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 3. AI PREDICTIONS & SUGGESTIONS
-- =====================================================

CREATE TABLE public.ai_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  grading_id UUID REFERENCES public.gradings(id) ON DELETE CASCADE,
  grading_image_id UUID REFERENCES public.grading_images(id) ON DELETE CASCADE,
  ai_model_id UUID REFERENCES public.ai_models(id) ON DELETE SET NULL,
  
  suggested_color TEXT,
  suggested_color_confidence DECIMAL(5,2),
  suggested_leaf_position TEXT,
  suggested_leaf_position_confidence DECIMAL(5,2),
  suggested_maturity TEXT,
  suggested_maturity_confidence DECIMAL(5,2),
  suggested_texture TEXT,
  suggested_texture_confidence DECIMAL(5,2),
  
  defect_percentage DECIMAL(5,2),
  defect_confidence DECIMAL(5,2),
  detected_defects JSONB DEFAULT '[]'::jsonb,
  
  uniformity_score DECIMAL(5,2),
  size_variation_score DECIMAL(5,2),
  shape_consistency_score DECIMAL(5,2),
  
  suggested_grade TEXT,
  suggested_grade_class TEXT,
  overall_confidence DECIMAL(5,2),
  
  overlay_data JSONB DEFAULT '{}'::jsonb,
  explanation TEXT,
  key_factors JSONB DEFAULT '[]'::jsonb,
  
  processing_time_ms INTEGER,
  raw_response JSONB,
  error_message TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 4. HUMAN DECISIONS (HUMAN-IN-THE-LOOP AUDIT)
-- =====================================================

CREATE TABLE public.ai_grader_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ai_prediction_id UUID NOT NULL REFERENCES public.ai_predictions(id) ON DELETE CASCADE,
  grading_id UUID NOT NULL REFERENCES public.gradings(id) ON DELETE CASCADE,
  grader_id UUID NOT NULL REFERENCES auth.users(id),
  
  color_decision TEXT NOT NULL DEFAULT 'accept',
  color_ai_value TEXT,
  color_final_value TEXT,
  
  leaf_position_decision TEXT NOT NULL DEFAULT 'accept',
  leaf_position_ai_value TEXT,
  leaf_position_final_value TEXT,
  
  maturity_decision TEXT NOT NULL DEFAULT 'accept',
  maturity_ai_value TEXT,
  maturity_final_value TEXT,
  
  texture_decision TEXT NOT NULL DEFAULT 'accept',
  texture_ai_value TEXT,
  texture_final_value TEXT,
  
  defects_decision TEXT NOT NULL DEFAULT 'accept',
  defects_ai_value DECIMAL(5,2),
  defects_final_value DECIMAL(5,2),
  
  overall_decision TEXT NOT NULL DEFAULT 'accept',
  ai_suggested_grade TEXT,
  final_grade TEXT NOT NULL,
  
  modification_reason TEXT,
  notes TEXT,
  decision_time_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 5. GRADER ANALYTICS & BIAS DETECTION
-- =====================================================

CREATE TABLE public.grader_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  grader_id UUID NOT NULL REFERENCES auth.users(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  total_gradings INTEGER NOT NULL DEFAULT 0,
  total_with_ai_assist INTEGER NOT NULL DEFAULT 0,
  
  ai_accept_rate DECIMAL(5,2),
  ai_modify_rate DECIMAL(5,2),
  ai_reject_rate DECIMAL(5,2),
  
  grade_distribution JSONB DEFAULT '{}'::jsonb,
  
  avg_deviation_from_ai DECIMAL(5,2),
  deviation_trend TEXT,
  
  harshness_score DECIMAL(5,2),
  harshness_percentile DECIMAL(5,2),
  
  consistency_score DECIMAL(5,2),
  pattern_anomalies JSONB DEFAULT '[]'::jsonb,
  
  risk_score DECIMAL(5,2),
  risk_factors JSONB DEFAULT '[]'::jsonb,
  requires_review BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(company_id, grader_id, period_start, period_end)
);

-- =====================================================
-- 6. FRAUD ALERTS
-- =====================================================

CREATE TABLE public.fraud_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  grader_id UUID REFERENCES auth.users(id),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence JSONB DEFAULT '[]'::jsonb,
  
  affected_gradings JSONB DEFAULT '[]'::jsonb,
  affected_farmers JSONB DEFAULT '[]'::jsonb,
  
  status TEXT NOT NULL DEFAULT 'open',
  investigated_by UUID REFERENCES auth.users(id),
  investigated_at TIMESTAMPTZ,
  resolution TEXT,
  resolution_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 7. ENABLE RLS & CREATE POLICIES
-- =====================================================

ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_grader_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grader_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;

-- AI Models policies
CREATE POLICY "Users can view their company AI models"
  ON public.ai_models FOR SELECT
  USING (public.can_access_company(auth.uid(), company_id) OR company_id IS NULL);

CREATE POLICY "Admins can manage AI models"
  ON public.ai_models FOR ALL
  USING (public.has_role(auth.uid(), 'company_admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Grading Images policies
CREATE POLICY "Users can view their company images"
  ON public.grading_images FOR SELECT
  USING (public.can_access_company(auth.uid(), company_id));

CREATE POLICY "Graders can insert images"
  ON public.grading_images FOR INSERT
  WITH CHECK (
    public.can_access_company(auth.uid(), company_id) AND
    (public.has_role(auth.uid(), 'grader') OR public.has_role(auth.uid(), 'company_admin'))
  );

-- AI Predictions policies
CREATE POLICY "Users can view their company predictions"
  ON public.ai_predictions FOR SELECT
  USING (public.can_access_company(auth.uid(), company_id));

CREATE POLICY "System can insert predictions"
  ON public.ai_predictions FOR INSERT
  WITH CHECK (public.can_access_company(auth.uid(), company_id));

-- Grader Decisions policies
CREATE POLICY "Users can view their company decisions"
  ON public.ai_grader_decisions FOR SELECT
  USING (public.can_access_company(auth.uid(), company_id));

CREATE POLICY "Graders can insert their decisions"
  ON public.ai_grader_decisions FOR INSERT
  WITH CHECK (
    public.can_access_company(auth.uid(), company_id) AND
    auth.uid() = grader_id
  );

-- Grader Analytics policies
CREATE POLICY "Supervisors can view analytics"
  ON public.grader_analytics FOR SELECT
  USING (
    public.can_access_company(auth.uid(), company_id) AND
    (public.has_role(auth.uid(), 'quality_supervisor') OR public.has_role(auth.uid(), 'company_admin') OR public.has_role(auth.uid(), 'auditor'))
  );

CREATE POLICY "System can manage analytics"
  ON public.grader_analytics FOR ALL
  USING (public.has_role(auth.uid(), 'company_admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Fraud Alerts policies
CREATE POLICY "Supervisors can view alerts"
  ON public.fraud_alerts FOR SELECT
  USING (
    public.can_access_company(auth.uid(), company_id) AND
    (public.has_role(auth.uid(), 'quality_supervisor') OR public.has_role(auth.uid(), 'company_admin') OR public.has_role(auth.uid(), 'auditor'))
  );

CREATE POLICY "Supervisors can manage alerts"
  ON public.fraud_alerts FOR ALL
  USING (
    public.can_access_company(auth.uid(), company_id) AND
    (public.has_role(auth.uid(), 'quality_supervisor') OR public.has_role(auth.uid(), 'company_admin'))
  );

-- =====================================================
-- 8. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_ai_predictions_grading ON public.ai_predictions(grading_id);
CREATE INDEX idx_ai_predictions_image ON public.ai_predictions(grading_image_id);
CREATE INDEX idx_ai_predictions_created ON public.ai_predictions(created_at DESC);

CREATE INDEX idx_grader_decisions_grading ON public.ai_grader_decisions(grading_id);
CREATE INDEX idx_grader_decisions_grader ON public.ai_grader_decisions(grader_id);
CREATE INDEX idx_grader_decisions_created ON public.ai_grader_decisions(created_at DESC);

CREATE INDEX idx_grader_analytics_grader ON public.grader_analytics(grader_id);
CREATE INDEX idx_grader_analytics_period ON public.grader_analytics(period_start, period_end);

CREATE INDEX idx_fraud_alerts_status ON public.fraud_alerts(status, severity);
CREATE INDEX idx_fraud_alerts_grader ON public.fraud_alerts(grader_id);

CREATE INDEX idx_grading_images_bale ON public.grading_images(bale_id);
CREATE INDEX idx_grading_images_grading ON public.grading_images(grading_id);

-- =====================================================
-- 9. TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_ai_models_updated_at
  BEFORE UPDATE ON public.ai_models
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grader_analytics_updated_at
  BEFORE UPDATE ON public.grader_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fraud_alerts_updated_at
  BEFORE UPDATE ON public.fraud_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 10. CREATE STORAGE BUCKET FOR GRADING IMAGES
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'grading-images',
  'grading-images',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Storage policies
CREATE POLICY "Users can view company grading images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'grading-images' AND auth.role() = 'authenticated');

CREATE POLICY "Graders can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'grading-images' AND auth.role() = 'authenticated');

CREATE POLICY "Graders can update their uploads"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'grading-images' AND auth.role() = 'authenticated');