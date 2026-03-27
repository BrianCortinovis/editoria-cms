import { NextResponse } from 'next/server';
import { assertTrustedMutationRequest } from '@/lib/security/request';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { triggerPublish, type PublishTask } from '@/lib/publish/runner';

const PUBLISH_ROLES = new Set(['super_admin', 'chief_editor', 'editor']);

function normalizeTasks(input: unknown): PublishTask[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const tasks: PublishTask[] = [];

  for (const entry of input) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const record = entry as Record<string, unknown>;
    const type = String(record.type || '').trim();

    switch (type) {
      case 'settings':
      case 'menu':
      case 'full_rebuild':
        tasks.push({ type });
        break;
      case 'homepage':
        tasks.push({ type: 'homepage', pageId: typeof record.pageId === 'string' ? record.pageId : null });
        break;
      case 'page':
        if (typeof record.pageId === 'string') {
          tasks.push({ type: 'page', pageId: record.pageId });
        }
        break;
      case 'article':
        if (typeof record.articleId === 'string') {
          tasks.push({ type: 'article', articleId: record.articleId });
        }
        break;
      case 'category':
        if (typeof record.categoryId === 'string') {
          tasks.push({ type: 'category', categoryId: record.categoryId });
        }
        break;
      default:
        break;
    }
  }

  return tasks;
}

export async function POST(request: Request) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const body = await request.json().catch(() => null);
  const tenantId = typeof body?.tenant_id === 'string' ? body.tenant_id : null;
  const tasks = normalizeTasks(body?.tasks);

  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership, error: membershipError } = await supabase
    .from('user_tenants')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (membershipError || !membership?.role || !PUBLISH_ROLES.has(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const manifest = await triggerPublish(tenantId, tasks, user.id);
    return NextResponse.json({
      ok: true,
      manifest,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Publish failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
