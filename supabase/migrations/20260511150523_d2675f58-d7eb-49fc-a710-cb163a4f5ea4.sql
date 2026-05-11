
-- Fix function search path
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Lock down has_role execution to server contexts
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- Tighten order INSERT policy
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders
  FOR INSERT WITH CHECK (
    length(coalesce(customer_name,'')) BETWEEN 1 AND 200
    AND length(coalesce(customer_phone,'')) BETWEEN 5 AND 30
    AND jsonb_typeof(items) = 'array'
  );

DROP POLICY IF EXISTS "Anyone log visit" ON public.visits;
CREATE POLICY "Anyone log visit" ON public.visits
  FOR INSERT WITH CHECK (length(coalesce(path,'')) <= 200);
