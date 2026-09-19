-- Restrict all SECURITY DEFINER functions: no direct execution by anon/authenticated.
-- Signup validation now goes through server functions using the service role.
REVOKE EXECUTE ON FUNCTION public.has_any_account() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.username_available(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_admin_code(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_referral_code(text) FROM PUBLIC, anon, authenticated;
-- Trigger functions are executed by triggers only; no role needs direct EXECUTE.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admins_guard() FROM PUBLIC, anon, authenticated;
-- Keep them callable by the service role for backend operations.
GRANT EXECUTE ON FUNCTION public.has_any_account() TO service_role;
GRANT EXECUTE ON FUNCTION public.username_available(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.validate_admin_code(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.validate_referral_code(text) TO service_role;