import { createServiceRoleClientForTenant } from '@/lib/supabase/server';

export function normalizeRedirectPath(path: string) {
  const trimmed = `/${path || ''}`.replace(/\/+/g, '/');
  return trimmed === '/' ? '/' : trimmed.replace(/\/+$/g, '');
}

export async function resolveRedirect(tenantId: string, path: string) {
  const supabase = await createServiceRoleClientForTenant(tenantId);
  const normalizedPath = normalizeRedirectPath(path);

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
      targetPath: normalizeRedirectPath(data.target_path),
      statusCode: data.status_code || 301,
    };
  } catch {
    return null;
  }
}

export function buildTenantRedirectUrl(tenantSlug: string, targetPath: string) {
  const normalizedPath = normalizeRedirectPath(targetPath);
  if (normalizedPath.startsWith('/site/')) {
    return normalizedPath;
  }

  return normalizedPath === '/'
    ? `/site/${tenantSlug}`
    : `/site/${tenantSlug}${normalizedPath}`;
}

export async function upsertRedirectRule(input: {
  tenantId: string;
  sourcePath: string;
  targetPath: string;
  statusCode?: number;
}) {
  const supabase = await createServiceRoleClientForTenant(input.tenantId);
  const sourcePath = normalizeRedirectPath(input.sourcePath);
  const targetPath = normalizeRedirectPath(input.targetPath);

  if (!sourcePath || !targetPath || sourcePath === targetPath) {
    return { ok: false as const, skipped: true as const };
  }

  const { error } = await supabase.from('redirects').upsert(
    {
      tenant_id: input.tenantId,
      source_path: sourcePath,
      target_path: targetPath,
      status_code: input.statusCode || 301,
      is_active: true,
    },
    { onConflict: 'tenant_id,source_path' }
  );

  if (error) {
    throw error;
  }

  return { ok: true as const, skipped: false as const };
}
