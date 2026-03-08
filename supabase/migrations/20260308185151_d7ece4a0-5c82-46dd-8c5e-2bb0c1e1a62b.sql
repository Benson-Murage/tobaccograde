
-- Disease detections table
CREATE TABLE public.disease_detections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  bale_id UUID REFERENCES public.bales(id),
  grading_id UUID REFERENCES public.gradings(id),
  grading_image_id UUID REFERENCES public.grading_images(id),
  grader_id UUID,
  disease_name TEXT NOT NULL,
  confidence NUMERIC NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'low',
  recommended_action TEXT,
  affected_area_percent NUMERIC,
  grader_decision TEXT DEFAULT 'pending',
  grader_override_reason TEXT,
  ai_raw_response JSONB,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.disease_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view disease detections"
  ON public.disease_detections FOR SELECT
  USING (company_id = get_user_company_id() OR is_super_admin(auth.uid()));

CREATE POLICY "Graders can insert disease detections"
  ON public.disease_detections FOR INSERT
  WITH CHECK (can_access_company(auth.uid(), company_id));

CREATE POLICY "Graders can update own detections"
  ON public.disease_detections FOR UPDATE
  USING (company_id = get_user_company_id() AND (grader_id = auth.uid() OR has_role(auth.uid(), 'quality_supervisor'::app_role) OR has_role(auth.uid(), 'company_admin'::app_role)));

CREATE INDEX idx_disease_detections_company ON public.disease_detections(company_id);
CREATE INDEX idx_disease_detections_bale ON public.disease_detections(bale_id);
CREATE INDEX idx_disease_detections_disease ON public.disease_detections(disease_name);

-- Traceability ledger (hash-chain for tamper-proof records)
CREATE TABLE public.traceability_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  batch_id UUID REFERENCES public.bales(id),
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  actor_id UUID,
  device_id TEXT,
  previous_hash TEXT,
  record_hash TEXT NOT NULL,
  block_number BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.traceability_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view ledger"
  ON public.traceability_ledger FOR SELECT
  USING (company_id = get_user_company_id() OR is_super_admin(auth.uid()) OR has_role(auth.uid(), 'auditor'::app_role));

CREATE POLICY "Authenticated can insert ledger entries"
  ON public.traceability_ledger FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX idx_traceability_ledger_batch ON public.traceability_ledger(batch_id);
CREATE INDEX idx_traceability_ledger_event ON public.traceability_ledger(event_type);
CREATE INDEX idx_traceability_ledger_block ON public.traceability_ledger(block_number);

-- Farm verifications table
CREATE TABLE public.farm_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  farmer_id UUID NOT NULL REFERENCES public.farmers(id),
  verified_by UUID,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  declared_area_hectares NUMERIC,
  verified_area_hectares NUMERIC,
  crop_health_score NUMERIC,
  satellite_image_url TEXT,
  discrepancy_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.farm_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view verifications"
  ON public.farm_verifications FOR SELECT
  USING (company_id = get_user_company_id() OR is_super_admin(auth.uid()));

CREATE POLICY "Admins can manage verifications"
  ON public.farm_verifications FOR ALL
  USING (company_id = get_user_company_id() AND (has_role(auth.uid(), 'company_admin'::app_role) OR has_role(auth.uid(), 'quality_supervisor'::app_role)));

CREATE INDEX idx_farm_verifications_farmer ON public.farm_verifications(farmer_id);

-- Pre-harvest predictions table
CREATE TABLE public.harvest_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  farmer_id UUID NOT NULL REFERENCES public.farmers(id),
  predicted_grade TEXT,
  predicted_grade_class TEXT,
  confidence NUMERIC,
  predicted_yield_kg NUMERIC,
  predicted_value NUMERIC,
  currency TEXT DEFAULT 'USD',
  field_image_url TEXT,
  ai_analysis JSONB,
  override_grade TEXT,
  override_by UUID,
  override_reason TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.harvest_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view predictions"
  ON public.harvest_predictions FOR SELECT
  USING (company_id = get_user_company_id() OR is_super_admin(auth.uid()));

CREATE POLICY "Graders can insert predictions"
  ON public.harvest_predictions FOR INSERT
  WITH CHECK (can_access_company(auth.uid(), company_id));

CREATE POLICY "Users can update own predictions"
  ON public.harvest_predictions FOR UPDATE
  USING (company_id = get_user_company_id());

CREATE INDEX idx_harvest_predictions_farmer ON public.harvest_predictions(farmer_id);

-- Enable realtime for disease detections
ALTER PUBLICATION supabase_realtime ADD TABLE public.disease_detections;
