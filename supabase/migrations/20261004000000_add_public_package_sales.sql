CREATE OR REPLACE FUNCTION public.get_package_sales(p_event_slug text)
RETURNS TABLE(package_name text, sold_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.responses ->> 'package' AS package_name,
    COUNT(*)::bigint AS sold_count
  FROM public.registrations AS r
  JOIN public.events AS e ON e.id = r.event_id
  WHERE e.slug = p_event_slug
    AND r.status IN ('pending', 'confirmed')
    AND NULLIF(r.responses ->> 'package', '') IS NOT NULL
  GROUP BY r.responses ->> 'package';
$$;

REVOKE ALL ON FUNCTION public.get_package_sales(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_package_sales(text) TO anon, authenticated;
