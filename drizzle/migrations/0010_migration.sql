CREATE OR REPLACE FUNCTION public.ledger_append_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $fn$
DECLARE
  v_company uuid; v_entity uuid; v_batch uuid; v_actor uuid;
  v_event text; v_payload jsonb; v_last_block bigint; v_last_hash text; v_hash text;
BEGIN
  v_company := NEW.company_id;
  IF v_company IS NULL THEN RETURN NULL; END IF;

  PERFORM pg_advisory_xact_lock(hashtext(v_company::text));

  SELECT block_number, record_hash INTO v_last_block, v_last_hash
  FROM public.traceability_ledger
  WHERE company_id = v_company
  ORDER BY block_number DESC
  LIMIT 1;
  v_last_block := COALESCE(v_last_block, 0);

  IF TG_TABLE_NAME = 'farmers' THEN
    v_entity := NEW.id; v_batch := NULL; v_actor := NULL;
    v_event := CASE TG_OP WHEN 'INSERT' THEN 'FARMER_REGISTERED' ELSE 'FARMER_UPDATED' END;
    v_payload := jsonb_build_object('entity','farmer','farmer_code',NEW.farmer_code,'name',NEW.full_name,'contract',NEW.contract_number);
  ELSIF TG_TABLE_NAME = 'bales' THEN
    v_entity := NEW.id; v_batch := NEW.id; v_actor := NEW.registered_by;
    v_event := 'BALE_REGISTERED';
    v_payload := jsonb_build_object('entity','bale','bale_code',NEW.bale_code,'farmer_id',NEW.farmer_id,'warehouse_id',NEW.warehouse_id,'season_id',NEW.season_id,'weight_kg',NEW.weight_kg,'status',NEW.status);
  ELSIF TG_TABLE_NAME = 'gradings' THEN
    v_entity := NEW.id; v_batch := NEW.bale_id; v_actor := NEW.grader_id;
    v_event := 'GRADE_SUBMITTED';
    v_payload := jsonb_build_object('entity','grading','grade_code',NEW.grade_code,'grade_class',NEW.grade_class,'moisture_percent',NEW.moisture_percent,'defect_percent',NEW.defect_percent,'leaf_position',NEW.leaf_position,'color',NEW.color,'texture',NEW.texture,'maturity',NEW.maturity);
  ELSIF TG_TABLE_NAME = 'payments' THEN
    v_entity := NEW.id; v_batch := NULL; v_actor := NULL;
    v_event := 'PAYMENT_RECORDED';
    v_payload := jsonb_build_object('entity','payment','reference',NEW.payment_reference,'farmer_id',NEW.farmer_id,'total_value',NEW.total_value,'currency',NEW.currency,'status',NEW.status);
  ELSIF TG_TABLE_NAME = 'disputes' THEN
    v_entity := NEW.id; v_batch := NULL;
    IF TG_OP = 'INSERT' THEN
      v_actor := NEW.raised_by;
      v_event := 'DISPUTE_OPENED';
      v_payload := jsonb_build_object('entity','dispute','reason',NEW.reason,'priority',NEW.priority,'status',NEW.status);
    ELSE
      v_actor := COALESCE(NEW.resolved_by, NEW.raised_by);
      v_event := 'DISPUTE_STATUS_CHANGED';
      v_payload := jsonb_build_object('entity','dispute','old_status',OLD.status,'new_status',NEW.status,'new_grade_code',NEW.new_grade_code,'resolution_notes',NEW.resolution_notes);
    END IF;
  ELSIF TG_TABLE_NAME = 'export_batches' THEN
    v_entity := NEW.id; v_batch := NULL;
    IF TG_OP = 'INSERT' THEN
      v_actor := NEW.created_by;
      v_event := 'EXPORT_BATCH_CREATED';
      v_payload := jsonb_build_object('entity','export_batch','batch_code',NEW.batch_code,'total_bales',NEW.total_bales,'total_weight_kg',NEW.total_weight_kg);
    ELSIF NEW.certificate_number IS NOT NULL AND OLD.certificate_number IS NULL THEN
      v_actor := COALESCE(NEW.certified_by, NEW.inspected_by, NEW.created_by);
      v_event := 'EXPORT_CERTIFIED';
      v_payload := jsonb_build_object('entity','export_batch','batch_code',NEW.batch_code,'certificate_number',NEW.certificate_number,'destination_country',NEW.destination_country);
    ELSIF NEW.inspection_status IS DISTINCT FROM OLD.inspection_status THEN
      v_actor := COALESCE(NEW.inspected_by, NEW.created_by);
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
$fn$;

COMMENT ON TABLE public.traceability_ledger IS 'Internal append-only hash-chain ledger of bale lifecycle events (sha256-chained per company). Not a public blockchain.';