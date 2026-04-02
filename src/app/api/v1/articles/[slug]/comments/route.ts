import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createServiceRoleClientForTenant } from '@/lib/supabase/server';
import { sanitizeExternalUrl } from '@/lib/security/html';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { verifyTurnstileToken } from '@/lib/security/turnstile';
import { resolvePublicTenantContext } from '@/lib/site/runtime';

import { getPublicApiCorsHeadersWithPost } from '@/lib/security/cors';

function hashValue(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function supportsCommentsTable(tenantId: string) {
  const supabase = await createServiceRoleClientForTenant(tenantId);
  const { error } = await supabase.from('article_comments').select('id').limit(1);
  return !error;
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: getPublicApiCorsHeadersWithPost(request) });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const tenantSlug = new URL(request.url).searchParams.get('tenant');

  if (!tenantSlug) {
    return NextResponse.json({ error: 'tenant parameter required' }, { status: 400, headers: getPublicApiCorsHeadersWithPost(request) });
  }

  const context = await resolvePublicTenantContext(tenantSlug);
  if (!context) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404, headers: getPublicApiCorsHeadersWithPost(request) });
  }

  if (!(await supportsCommentsTable(context.tenant.id))) {
    return NextResponse.json({ commentsEnabled: false, comments: [] }, { headers: getPublicApiCorsHeadersWithPost(request) });
  }

  const { tenant, runtimeClient } = context;

  const { data: article } = await runtimeClient
    .from('articles')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404, headers: getPublicApiCorsHeadersWithPost(request) });
  }

  const { data: comments } = await runtimeClient
    .from('article_comments')
    .select('id, parent_id, author_name, author_url, body, created_at')
    .eq('tenant_id', tenant.id)
    .eq('article_id', article.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });

  return NextResponse.json({ commentsEnabled: true, comments: comments || [] }, { headers: getPublicApiCorsHeadersWithPost(request) });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();
  const tenantSlug = String(body.tenant || '');
  const authorName = String(body.author_name || '').trim();
  const authorEmail = String(body.author_email || '').trim();
  const authorUrl = String(body.author_url || '').trim();
  const commentBody = String(body.body || '').trim();
  const parentId = body.parent_id ? String(body.parent_id) : null;
  const honeypot = String(body.website || '');

  if (!tenantSlug || !authorName || !authorEmail || !commentBody) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: getPublicApiCorsHeadersWithPost(request) });
  }

  const context = await resolvePublicTenantContext(tenantSlug);
  if (!context) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404, headers: getPublicApiCorsHeadersWithPost(request) });
  }

  if (!(await supportsCommentsTable(context.tenant.id))) {
    return NextResponse.json({ error: 'Comments module not initialized' }, { status: 503, headers: getPublicApiCorsHeadersWithPost(request) });
  }

  if (honeypot) {
    return NextResponse.json({ success: true, pending: true }, { headers: getPublicApiCorsHeadersWithPost(request) });
  }

  const clientIp = getClientIp(request);
  const limiter = await checkRateLimit(`comment:${tenantSlug}:${slug}:${clientIp}`, 5, 10 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: 'Too many comments, please try again later.' },
      { status: 429, headers: { ...getPublicApiCorsHeadersWithPost(request), 'Retry-After': String(Math.ceil(limiter.retryAfterMs / 1000)) } }
    );
  }

  if (
    authorName.length > 120 ||
    authorEmail.length > 254 ||
    authorUrl.length > 500 ||
    commentBody.length > 5_000
  ) {
    return NextResponse.json({ error: 'Input too long' }, { status: 400, headers: getPublicApiCorsHeadersWithPost(request) });
  }

  const isHuman = await verifyTurnstileToken(String(body.turnstile_token || ''), clientIp);
  if (!isHuman) {
    return NextResponse.json({ error: 'Bot protection check failed' }, { status: 400, headers: getPublicApiCorsHeadersWithPost(request) });
  }

  const { tenant, runtimeClient } = context;

  const { data: article } = await runtimeClient
    .from('articles')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404, headers: getPublicApiCorsHeadersWithPost(request) });
  }

  const { error } = await runtimeClient.from('article_comments').insert({
    tenant_id: tenant.id,
    article_id: article.id,
    parent_id: parentId,
    author_name: authorName,
    author_email: authorEmail,
    author_url: sanitizeExternalUrl(authorUrl) || null,
    body: commentBody,
    status: 'pending',
    source: 'website',
    ip_hash: hashValue(clientIp),
    user_agent: request.headers.get('user-agent') || null,
    published_at: null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: getPublicApiCorsHeadersWithPost(request) });
  }

  return NextResponse.json(
    { success: true, pending: true, message: 'Commento inviato e in attesa di moderazione.' },
    { headers: getPublicApiCorsHeadersWithPost(request) }
  );
}
