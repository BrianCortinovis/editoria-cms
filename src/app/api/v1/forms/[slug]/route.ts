import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function hashValue(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function supportsFormsTables() {
  const supabase = await createServiceRoleClient();
  const { error } = await supabase.from('site_forms').select('id').limit(1);
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

  if (!(await supportsFormsTables())) {
    return NextResponse.json({ formsEnabled: false }, { headers: CORS_HEADERS });
  }

  const supabase = await createServiceRoleClient();
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single();
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404, headers: CORS_HEADERS });
  }

  const { data: form } = await supabase
    .from('site_forms')
    .select('name, slug, description, fields, success_message')
    .eq('tenant_id', tenant.id)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (!form) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404, headers: CORS_HEADERS });
  }

  return NextResponse.json({ formsEnabled: true, form }, { headers: CORS_HEADERS });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!(await supportsFormsTables())) {
    return NextResponse.json({ error: 'Forms module not initialized' }, { status: 503, headers: CORS_HEADERS });
  }

  const body = await request.json();
  const tenantSlug = String(body.tenant || '');
  const payload = (body.payload || {}) as Record<string, unknown>;
  const sourcePage = String(body.source_page || '');
  const honeypot = String(body.website || '');

  if (!tenantSlug) {
    return NextResponse.json({ error: 'tenant required' }, { status: 400, headers: CORS_HEADERS });
  }

  if (honeypot) {
    return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
  }

  const supabase = await createServiceRoleClient();
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single();
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404, headers: CORS_HEADERS });
  }

  const { data: form } = await supabase
    .from('site_forms')
    .select('id, fields, success_message')
    .eq('tenant_id', tenant.id)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (!form) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404, headers: CORS_HEADERS });
  }

  const requiredFields = Array.isArray(form.fields)
    ? form.fields.filter((field: { required?: boolean; name?: string }) => field.required && field.name).map((field: { name: string }) => field.name)
    : [];

  const missing = requiredFields.filter((fieldName) => {
    const value = payload[fieldName];
    return value === undefined || value === null || String(value).trim() === '';
  });

  if (missing.length > 0) {
    return NextResponse.json({ error: `Campi obbligatori mancanti: ${missing.join(', ')}` }, { status: 400, headers: CORS_HEADERS });
  }

  const forwardedFor = request.headers.get('x-forwarded-for') || '';
  const clientIp = forwardedFor.split(',')[0]?.trim() || 'unknown';

  const { error } = await supabase.from('form_submissions').insert({
    tenant_id: tenant.id,
    form_id: form.id,
    submitter_name: typeof payload.name === 'string' ? payload.name : null,
    submitter_email: typeof payload.email === 'string' ? payload.email : null,
    payload,
    source_page: sourcePage || null,
    ip_hash: hashValue(clientIp),
    status: 'new',
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  }

  return NextResponse.json(
    { success: true, message: form.success_message || 'Invio ricevuto correttamente.' },
    { headers: CORS_HEADERS }
  );
}
