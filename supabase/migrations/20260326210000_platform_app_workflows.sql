-- ============================================
-- PLATFORM APP WORKFLOWS
-- Transactional bootstrap for site creation.
-- ============================================

CREATE OR REPLACE FUNCTION create_platform_site(
  p_name TEXT,
  p_slug TEXT,
  p_language_code TEXT DEFAULT 'it',
  p_template_key TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_platform_domain_suffix TEXT DEFAULT 'localhost'
)
RETURNS TABLE (
  site_id UUID,
  tenant_id UUID,
  default_hostname TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_site_id UUID;
  v_tenant_id UUID;
  v_hostname TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_name IS NULL OR btrim(p_name) = '' THEN
    RAISE EXCEPTION 'Site name is required';
  END IF;

  IF p_slug IS NULL OR p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Invalid site slug';
  END IF;

  v_hostname := lower(p_slug) || '.' || lower(p_platform_domain_suffix);

  INSERT INTO tenants (
    name,
    slug,
    domain,
    settings
  )
  VALUES (
    p_name,
    p_slug,
    v_hostname,
    jsonb_build_object('platform_bootstrapped', true, 'active_modules', jsonb_build_array())
  )
  RETURNING id INTO v_tenant_id;

  INSERT INTO sites (
    tenant_id,
    owner_user_id,
    name,
    slug,
    default_subdomain,
    status,
    template_key,
    language_code,
    category,
    metadata
  )
  VALUES (
    v_tenant_id,
    v_user_id,
    p_name,
    p_slug,
    p_slug,
    'active',
    p_template_key,
    COALESCE(NULLIF(p_language_code, ''), 'it'),
    NULLIF(p_category, ''),
    jsonb_build_object('created_via', 'platform_app')
  )
  RETURNING id INTO v_site_id;

  INSERT INTO tenant_memberships (
    tenant_id,
    site_id,
    user_id,
    role,
    joined_at,
    last_accessed_at
  )
  VALUES (
    v_tenant_id,
    v_site_id,
    v_user_id,
    'owner',
    now(),
    now()
  );

  INSERT INTO user_tenants (
    user_id,
    tenant_id,
    role
  )
  VALUES (
    v_user_id,
    v_tenant_id,
    'admin'
  )
  ON CONFLICT (user_id, tenant_id) DO NOTHING;

  INSERT INTO site_settings_platform (
    site_id,
    tenant_id,
    default_locale,
    timezone,
    onboarding_checklist,
    feature_flags,
    notification_settings,
    billing_state
  )
  VALUES (
    v_site_id,
    v_tenant_id,
    COALESCE(NULLIF(p_language_code, ''), 'it'),
    'Europe/Rome',
    jsonb_build_object(
      'site_created', true,
      'domain_ready', true,
      'cms_connected', true
    ),
    '{}'::jsonb,
    '{}'::jsonb,
    jsonb_build_object('plan', 'free')
  );

  INSERT INTO site_domains (
    site_id,
    tenant_id,
    hostname,
    kind,
    is_primary,
    status,
    verification_method,
    verification_instructions,
    dns_records,
    ssl_status,
    redirect_www,
    attached_at,
    last_verified_at,
    metadata
  )
  VALUES (
    v_site_id,
    v_tenant_id,
    v_hostname,
    'platform_subdomain',
    true,
    'active',
    'manual',
    '[]'::jsonb,
    '[]'::jsonb,
    'active',
    false,
    now(),
    now(),
    jsonb_build_object('source', 'platform_default')
  );

  INSERT INTO site_config (
    tenant_id,
    navigation,
    footer,
    og_defaults
  )
  VALUES (
    v_tenant_id,
    '[]'::jsonb,
    jsonb_build_object('columns', jsonb_build_array(), 'copyright', p_name, 'links', jsonb_build_array()),
    jsonb_build_object('site_name', p_name)
  )
  ON CONFLICT (tenant_id) DO NOTHING;

  INSERT INTO site_pages (
    tenant_id,
    title,
    slug,
    page_type,
    meta,
    blocks,
    is_published,
    sort_order,
    created_by
  )
  VALUES (
    v_tenant_id,
    'Home',
    '',
    'homepage',
    jsonb_build_object('title', p_name, 'description', 'Homepage'),
    '[]'::jsonb,
    true,
    0,
    v_user_id
  )
  ON CONFLICT (tenant_id, slug) DO NOTHING;

  INSERT INTO subscriptions (
    site_id,
    tenant_id,
    provider,
    plan_code,
    status,
    limits,
    metadata
  )
  VALUES (
    v_site_id,
    v_tenant_id,
    'manual',
    'free',
    'trialing',
    jsonb_build_object(
      'sites', 1,
      'storage_gb', 1,
      'team_members', 3
    ),
    '{}'::jsonb
  )
  ON CONFLICT (site_id) DO NOTHING;

  INSERT INTO notifications (
    user_id,
    tenant_id,
    site_id,
    type,
    severity,
    title,
    body,
    data
  )
  VALUES (
    v_user_id,
    v_tenant_id,
    v_site_id,
    'site_created',
    'info',
    'Sito creato',
    'Il nuovo sito e'' pronto e puoi entrare subito nel CMS.',
    jsonb_build_object('hostname', v_hostname)
  );

  INSERT INTO audit_logs (
    actor_user_id,
    tenant_id,
    site_id,
    action,
    resource_type,
    resource_id,
    metadata
  )
  VALUES (
    v_user_id,
    v_tenant_id,
    v_site_id,
    'site.created',
    'site',
    v_site_id,
    jsonb_build_object('default_hostname', v_hostname)
  );

  RETURN QUERY
  SELECT v_site_id, v_tenant_id, v_hostname;
END;
$$;

GRANT EXECUTE ON FUNCTION create_platform_site(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
