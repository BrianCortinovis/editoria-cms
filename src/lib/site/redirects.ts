import { createServiceRoleClientForTenant } from '@/lib/supabase/server';

function normalizePath(path: string) {
  const trimmed = `/${path || ''}`.replace(/\/+/g, '/');
  return trimmed === '/' ? '/' : trimmed.replace(/\/+$/g, '');
}

export async function resolveRedirect(tenantId: string, path: string) {
  const supabase = await createServiceRoleClientForTenant(tenantId);
  const normalizedPath = normalizePath(path);

  try {
    const { data, error } = await supabase
      .from('redirects')
      .select('target_path, status_code')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .eq('source_path', normalizedPath)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      targetPath: normalizePath(data.target_path),
      statusCode: data.status_code || 301,
    };
  } catch {
    return null;
  }
}

export function buildTenantRedirectUrl(tenantSlug: string, targetPath: string) {
  const normalizedPath = normalizePath(targetPath);
  if (normalizedPath.startsWith('/site/')) {
    return normalizedPath;
  }

  return normalizedPath === '/'
    ? `/site/${tenantSlug}`
    : `/site/${tenantSlug}${normalizedPath}`;
}
