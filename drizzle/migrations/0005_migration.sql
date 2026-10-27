-- Payments: company admins record/update payments; others read-only
create policy "Company admins can record payments"
  on public.payments for insert to authenticated
  with check (
    (company_id = public.get_user_company_id() and public.has_role(auth.uid(), 'company_admin'))
    or public.is_super_admin(auth.uid())
  );

create policy "Company admins can update payment status"
  on public.payments for update to authenticated
  using (
    (company_id = public.get_user_company_id() and public.has_role(auth.uid(), 'company_admin'))
    or public.is_super_admin(auth.uid())
  )
  with check (
    (company_id = public.get_user_company_id() and public.has_role(auth.uid(), 'company_admin'))
    or public.is_super_admin(auth.uid())
  );

-- Audit every payment write (payments are immutable for non-admins)
create or replace function public.audit_payment_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (company_id, user_id, action, entity_type, entity_id, old_values, new_values)
  values (
    coalesce(new.company_id, old.company_id), auth.uid(),
    case when tg_op = 'INSERT' then 'CREATE' else 'UPDATE' end,
    'payment', coalesce(new.id, old.id),
    case when tg_op <> 'INSERT' then to_jsonb(old) else null end,
    case when tg_op <> 'DELETE' then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_payments
  after insert or update on public.payments
  for each row execute function public.audit_payment_changes();