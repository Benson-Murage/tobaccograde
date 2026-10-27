-- remove test artifact duplicate (0 bales), then enforce uniqueness
delete from public.export_batches where batch_code='EXP-2026-A1' and total_bales=0;
create unique index uq_export_batches_company_code on public.export_batches (company_id, batch_code);