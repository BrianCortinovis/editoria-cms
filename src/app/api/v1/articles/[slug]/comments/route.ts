import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createServiceRoleClient } from '@/lib/supabase/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function hashValue(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function supportsCommentsTable() {
  const supabase = await createServiceRoleClient();
  const { error } = await supabase.from('article_comments').select('id').limit(1);
  return !error;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const tenantSlug = new URL(request.url).searchParams.get('tenant');

  if (!tenantSlug) {
    return NextResponse.json({ error: 'tenant parameter required' }, { status: 400, headers: CORS_HEADERS });
  }

  if (!(await supportsCommentsTable())) {
    return NextResponse.json({ commentsEnabled: false, comments: [] }, { headers: CORS_HEADERS });
  }

  const supabase = await createServiceRoleClient();
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single();
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404, headers: CORS_HEADERS });
  }

  const { data: article } = await supabase
    .from('articles')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404, headers: CORS_HEADERS });
  }

  const { data: comments } = await supabase
    .from('article_comments')
    .select('id, parent_id, author_name, author_url, body, created_at')
    .eq('tenant_id', tenant.id)
    .eq('article_id', article.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });

  return NextResponse.json({ commentsEnabled: true, comments: comments || [] }, { headers: CORS_HEADERS });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!(await supportsCommentsTable())) {
    return NextResponse.json({ error: 'Comments module not initialized' }, { status: 503, headers: CORS_HEADERS });
  }

  const body = await request.json();
  const tenantSlug = String(body.tenant || '');
  const authorName = String(body.author_name || '').trim();
  const authorEmail = String(body.author_email || '').trim();
  const authorUrl = String(body.author_url || '').trim();
  const commentBody = String(body.body || '').trim();
  const parentId = body.parent_id ? String(body.parent_id) : null;
  const honeypot = String(body.website || '');

  if (!tenantSlug || !authorName || !authorEmail || !commentBody) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: CORS_HEADERS });
  }

  if (honeypot) {
    return NextResponse.json({ success: true, pending: true }, { headers: CORS_HEADERS });
  }

  const supabase = await createServiceRoleClient();
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single();
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404, headers: CORS_HEADERS });
  }

  const { data: article } = await supabase
    .from('articles')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404, headers: CORS_HEADERS });
  }

  const forwardedFor = request.headers.get('x-forwarded-for') || '';
  const clientIp = forwardedFor.split(',')[0]?.trim() || 'unknown';

  const { error } = await supabase.from('article_comments').insert({
    tenant_id: tenant.id,
    article_id: article.id,
    parent_id: parentId,
    author_name: authorName,
    author_email: authorEmail,
    author_url: authorUrl || null,
    body: commentBody,
    status: 'pending',
    source: 'website',
    ip_hash: hashValue(clientIp),
    user_agent: request.headers.get('user-agent') || null,
    published_at: null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  }

  return NextResponse.json(
    { success: true, pending: true, message: 'Commento inviato e in attesa di moderazione.' },
    { headers: CORS_HEADERS }
  );
}
