-- Lock down SECURITY DEFINER functions: only owners/triggers need EXECUTE
revoke execute on function public.audit_payment_changes() from public, anon, authenticated;
revoke execute on function public.audit_grading_changes() from public, anon, authenticated;
revoke execute on function public.audit_price_changes() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;