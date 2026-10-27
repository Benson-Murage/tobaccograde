CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.ledger_append_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid;
  v_entity uuid;
  v_batch uuid;
  v_actor uuid;
  v_event text;
  v_payload jsonb;
  v_last_block bigint;
  v_last_hash text;
  v_hash text;
BEGIN
  v_company := COALESCE((CASE TG_TABLE_NAME
    WHEN 'farmers' THEN NEW.company_id
    WHEN 'bales' THEN NEW.company_id
    WHEN 'gradings' THEN NEW.company_id
    WHEN 'payments' THEN NEW.company_id
    WHEN 'disputes' THEN NEW.company_id
    WHEN 'export_batches' THEN NEW.company_id
  END), NULL);
  IF v_company IS NULL THEN RETURN NULL; END IF;

  PERFORM pg_advisory_xact_lock(hashtext(v_company::text));

  SELECT block_number, record_hash INTO v_last_block, v_last_hash
  FROM public.traceability_ledger
  WHERE company_id = v_company
  ORDER BY block_number DESC
  LIMIT 1;
  v_last_block := COALESCE(v_last_block, 0);

  v_actor := CASE TG_TABLE_NAME
    WHEN 'gradings' THEN NEW.grader_id
    WHEN 'disputes' THEN COALESCE(NEW.resolved_by, NEW.raised_by)
    WHEN 'export_batches' THEN COALESCE(NEW.certified_by, NEW.inspected_by, NEW.created_by)
    ELSE NULL
  END;

  IF TG_TABLE_NAME = 'farmers' THEN
    v_entity := NEW.id;
    v_batch := NULL;
    v_event := CASE TG_OP WHEN 'INSERT' THEN 'FARMER_REGISTERED' ELSE 'FARMER_UPDATED' END;
    v_payload := jsonb_build_object('entity','farmer','farmer_code',NEW.farmer_code,'name',NEW.full_name,'contract',NEW.contract_number);
  ELSIF TG_TABLE_NAME = 'bales' THEN
    v_entity := NEW.id;
    v_batch := NEW.id;
    v_event := 'BALE_REGISTERED';
    v_payload := jsonb_build_object('entity','bale','bale_code',NEW.bale_code,'farmer_id',NEW.farmer_id,'warehouse_id',NEW.warehouse_id,'season_id',NEW.season_id,'weight_kg',NEW.weight_kg,'status',NEW.status);
  ELSIF TG_TABLE_NAME = 'gradings' THEN
    v_entity := NEW.id;
    v_batch := NEW.bale_id;
    v_event := 'GRADE_SUBMITTED';
    v_payload := jsonb_build_object('entity','grading','grade_code',NEW.grade_code,'grade_class',NEW.grade_class,'moisture_percent',NEW.moisture_percent,'defect_percent',NEW.defect_percent,'leaf_position',NEW.leaf_position,'color',NEW.color,'texture',NEW.texture,'maturity',NEW.maturity);
  ELSIF TG_TABLE_NAME = 'payments' THEN
    v_entity := NEW.id;
    v_batch := NULL;
    v_event := 'PAYMENT_RECORDED';
    v_payload := jsonb_build_object('entity','payment','reference',NEW.payment_reference,'farmer_id',NEW.farmer_id,'total_value',NEW.total_value,'currency',NEW.currency,'status',NEW.status);
  ELSIF TG_TABLE_NAME = 'disputes' THEN
    v_entity := NEW.id;
    v_batch := NULL;
    IF TG_OP = 'INSERT' THEN
      v_event := 'DISPUTE_OPENED';
      v_payload := jsonb_build_object('entity','dispute','reason',NEW.reason,'priority',NEW.priority,'status',NEW.status);
    ELSE
      v_event := 'DISPUTE_STATUS_CHANGED';
      v_payload := jsonb_build_object('entity','dispute','old_status',OLD.status,'new_status',NEW.status,'new_grade_code',NEW.new_grade_code,'resolution_notes',NEW.resolution_notes);
    END IF;
  ELSIF TG_TABLE_NAME = 'export_batches' THEN
    v_entity := NEW.id;
    v_batch := NULL;
    IF TG_OP = 'INSERT' THEN
      v_event := 'EXPORT_BATCH_CREATED';
      v_payload := jsonb_build_object('entity','export_batch','batch_code',NEW.batch_code,'total_bales',NEW.total_bales,'total_weight_kg',NEW.total_weight_kg);
    ELSIF NEW.certificate_number IS NOT NULL AND OLD.certificate_number IS NULL THEN
      v_event := 'EXPORT_CERTIFIED';
      v_payload := jsonb_build_object('entity','export_batch','batch_code',NEW.batch_code,'certificate_number',NEW.certificate_number,'destination_country',NEW.destination_country);
    ELSIF NEW.inspection_status IS DISTINCT FROM OLD.inspection_status THEN
      v_event := 'EXPORT_INSPECTION';
      v_payload := jsonb_build_object('entity','export_batch','batch_code',NEW.batch_code,'inspection_status',NEW.inspection_status);
    ELSE
      RETURN NULL;
    END IF;
  ELSE
    RETURN NULL;
  END IF;

  v_hash := encode(digest(concat_ws('|',
    v_company::text,
    (v_last_block + 1)::text,
    COALESCE(v_last_hash, ''),
    v_event,
    v_entity::text,
    v_payload::text,
    COALESCE(v_actor::text, ''),
    to_char(clock_timestamp(), 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
  ), 'sha256'), 'hex');

  INSERT INTO public.traceability_ledger
    (company_id, batch_id, event_type, event_data, actor_id, previous_hash, record_hash, block_number)
  VALUES
    (v_company, v_batch, v_event, v_payload, v_actor, v_last_hash, v_hash, v_last_block + 1);

  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ledger_append_event() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER ledger_farmers AFTER INSERT ON public.farmers
  FOR EACH ROW EXECUTE FUNCTION public.ledger_append_event();
CREATE TRIGGER ledger_bales AFTER INSERT ON public.bales
  FOR EACH ROW EXECUTE FUNCTION public.ledger_append_event();
CREATE TRIGGER ledger_gradings AFTER INSERT ON public.gradings
  FOR EACH ROW EXECUTE FUNCTION public.ledger_append_event();
CREATE TRIGGER ledger_payments AFTER INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.ledger_append_event();
CREATE TRIGGER ledger_disputes AFTER INSERT OR UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.ledger_append_event();
CREATE TRIGGER ledger_export_batches AFTER INSERT OR UPDATE ON public.export_batches
  FOR EACH ROW EXECUTE FUNCTION public.ledger_append_event();

WITH RECURSIVE src AS (
  SELECT company_id, id AS entity_id, NULL::uuid AS batch_id, created_at, 1 AS ord,
         'FARMER_REGISTERED'::text AS et,
         jsonb_build_object('entity','farmer','farmer_code',farmer_code,'name',full_name,'contract',contract_number) AS ed,
         NULL::uuid AS actor_id
  FROM public.farmers
  UNION ALL
  SELECT company_id, id, id, created_at, 2,
         'BALE_REGISTERED',
         jsonb_build_object('entity','bale','bale_code',bale_code,'farmer_id',farmer_id,'warehouse_id',warehouse_id,'season_id',season_id,'weight_kg',weight_kg,'status',status),
         registered_by
  FROM public.bales
  UNION ALL
  SELECT company_id, id, bale_id, created_at, 3,
         'GRADE_SUBMITTED',
         jsonb_build_object('entity','grading','grade_code',grade_code,'grade_class',grade_class,'moisture_percent',moisture_percent,'defect_percent',defect_percent,'leaf_position',leaf_position,'color',color,'texture',texture,'maturity',maturity),
         grader_id
  FROM public.gradings
  UNION ALL
  SELECT company_id, id, NULL, created_at, 4,
         'PAYMENT_RECORDED',
         jsonb_build_object('entity','payment','reference',payment_reference,'farmer_id',farmer_id,'total_value',total_value,'currency',currency,'status',status),
         NULL::uuid
  FROM public.payments
  UNION ALL
  SELECT company_id, id, NULL, created_at, 5,
         'DISPUTE_OPENED',
         jsonb_build_object('entity','dispute','reason',reason,'priority',priority,'status',status),
         raised_by
  FROM public.disputes
  UNION ALL
  SELECT company_id, id, NULL, created_at, 6,
         'EXPORT_BATCH_CREATED',
         jsonb_build_object('entity','export_batch','batch_code',batch_code,'total_bales',total_bales,'total_weight_kg',total_weight_kg),
         created_by
  FROM public.export_batches
),
e AS (
  SELECT *, row_number() OVER (PARTITION BY company_id ORDER BY created_at, ord, entity_id) AS rn
  FROM src
),
chain(rn, company_id, entity_id, batch_id, et, ed, created_at, actor_id, block, prev_hash, rec_hash) AS (
  SELECT rn, company_id, entity_id, batch_id, et, ed, created_at, actor_id, 1::bigint, NULL::text,
         encode(digest(concat_ws('|', company_id::text, '1', '', et, entity_id::text, ed::text,
           COALESCE(actor_id::text,''), to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')), 'sha256'), 'hex')
  FROM e WHERE rn = 1
  UNION ALL
  SELECT e.rn, e.company_id, e.entity_id, e.batch_id, e.et, e.ed, e.created_at, e.actor_id, c.block + 1, c.rec_hash,
         encode(digest(concat_ws('|', e.company_id::text, (c.block + 1)::text, c.rec_hash, e.et, e.entity_id::text, e.ed::text,
           COALESCE(e.actor_id::text,''), to_char(e.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')), 'sha256'), 'hex')
  FROM e JOIN chain c ON e.company_id = c.company_id AND e.rn = c.rn + 1
)
INSERT INTO public.traceability_ledger
  (company_id, batch_id, event_type, event_data, actor_id, device_id, previous_hash, record_hash, block_number, created_at)
SELECT company_id, batch_id, et, ed, actor_id, NULL, prev_hash, rec_hash, block, created_at
FROM chain;

COMMENT ON TABLE public.traceability_ledger IS 'Internal append-only hash-chain ledger of bale lifecycle events (sha256-chained per company). Not a public blockchain.';