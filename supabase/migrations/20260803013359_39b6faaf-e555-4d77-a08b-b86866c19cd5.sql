CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT private.has_role(auth.uid(), 'admin') $$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated, service_role;

-- Recréation des politiques administrateur avec la fonction privée
DROP POLICY IF EXISTS "admin gère la configuration système" ON public.system_settings;
CREATE POLICY "admin gère la configuration système" ON public.system_settings FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS "admin full access profiles" ON public.profiles;
CREATE POLICY "admin full access profiles" ON public.profiles FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS "admin full access user_roles" ON public.user_roles;
CREATE POLICY "admin full access user_roles" ON public.user_roles FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS "admin full access vehicles" ON public.vehicles;
CREATE POLICY "admin full access vehicles" ON public.vehicles FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS "admin full access positions" ON public.positions;
CREATE POLICY "admin full access positions" ON public.positions FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS "admin full access trips" ON public.trips;
CREATE POLICY "admin full access trips" ON public.trips FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS "admin full access geofences" ON public.geofences;
CREATE POLICY "admin full access geofences" ON public.geofences FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS "admin full access alerts" ON public.alerts;
CREATE POLICY "admin full access alerts" ON public.alerts FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS "admin full access subscriptions" ON public.subscriptions;
CREATE POLICY "admin full access subscriptions" ON public.subscriptions FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS "admin full access invoices" ON public.invoices;
CREATE POLICY "admin full access invoices" ON public.invoices FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS "admin full access integration_settings" ON public.integration_settings;
CREATE POLICY "admin full access integration_settings" ON public.integration_settings FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS "admin full access ai_insights" ON public.ai_insights;
CREATE POLICY "admin full access ai_insights" ON public.ai_insights FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

-- Suppression des fonctions SECURITY DEFINER exposées via l'API
DROP FUNCTION IF EXISTS public.admin_list_users();
DROP FUNCTION IF EXISTS public.admin_set_role(uuid, public.app_role, boolean);
DROP FUNCTION IF EXISTS public.admin_rotate_cron_secret();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- Versions SECURITY INVOKER (les droits RLS de l'appelant s'appliquent)
CREATE FUNCTION public.admin_set_role(_user_id uuid, _role public.app_role, _grant boolean)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'Accès refusé : réservé aux administrateurs';
  END IF;
  IF _grant THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role) ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = _role;
  END IF;
END; $$;

CREATE FUNCTION public.admin_rotate_cron_secret()
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'Accès refusé : réservé aux administrateurs';
  END IF;
  UPDATE public.system_settings SET cron_secret = encode(gen_random_bytes(24), 'hex') WHERE id = true;
END; $$;

REVOKE ALL ON FUNCTION public.admin_set_role(uuid, public.app_role, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_rotate_cron_secret() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_role(uuid, public.app_role, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_rotate_cron_secret() TO authenticated, service_role;

-- Le trigger de création d'utilisateur utilisait has_role indirectement : inchangé.
-- La synchronisation planifiée reste SECURITY DEFINER mais non exécutable par les rôles API.
GRANT INSERT, DELETE, SELECT ON public.user_roles TO authenticated;