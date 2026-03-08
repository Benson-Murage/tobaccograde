
-- Export batches table
CREATE TABLE public.export_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id),
  season_id uuid REFERENCES public.seasons(id),
  batch_code text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  total_bales integer NOT NULL DEFAULT 0,
  total_weight_kg numeric DEFAULT 0,
  inspection_status text DEFAULT 'pending',
  inspected_by uuid,
  inspected_at timestamptz,
  inspection_notes text,
  certified_by uuid,
  certified_at timestamptz,
  certificate_number text,
  destination_country text,
  buyer_name text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Junction table: bales in export batches
CREATE TABLE public.export_batch_bales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.export_batches(id) ON DELETE CASCADE,
  bale_id uuid NOT NULL REFERENCES public.bales(id),
  added_at timestamptz NOT NULL DEFAULT now(),
  added_by uuid,
  UNIQUE(batch_id, bale_id)
);

-- Enable RLS
ALTER TABLE public.export_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_batch_bales ENABLE ROW LEVEL SECURITY;

-- RLS for export_batches
CREATE POLICY "Company members can view batches" ON public.export_batches
  FOR SELECT USING (company_id = get_user_company_id() OR is_super_admin(auth.uid()));

CREATE POLICY "Admins can manage batches" ON public.export_batches
  FOR ALL USING (
    company_id = get_user_company_id() AND (
      has_role(auth.uid(), 'company_admin') OR
      has_role(auth.uid(), 'quality_supervisor')
    )
  );

-- RLS for export_batch_bales
CREATE POLICY "Company members can view batch bales" ON public.export_batch_bales
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.export_batches eb WHERE eb.id = batch_id AND (eb.company_id = get_user_company_id() OR is_super_admin(auth.uid())))
  );

CREATE POLICY "Admins can manage batch bales" ON public.export_batch_bales
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.export_batches eb WHERE eb.id = batch_id AND eb.company_id = get_user_company_id() AND (
      has_role(auth.uid(), 'company_admin') OR has_role(auth.uid(), 'quality_supervisor')
    ))
  );

-- Triggers for updated_at
CREATE TRIGGER set_export_batches_updated_at
  BEFORE UPDATE ON public.export_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_export_batches_company ON public.export_batches(company_id);
CREATE INDEX idx_export_batches_status ON public.export_batches(status);
CREATE INDEX idx_export_batch_bales_batch ON public.export_batch_bales(batch_id);
CREATE INDEX idx_export_batch_bales_bale ON public.export_batch_bales(bale_id);
