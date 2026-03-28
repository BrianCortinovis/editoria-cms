import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { verifyTurnstileToken } from '@/lib/security/turnstile';
import { sendEmailAsync } from '@/lib/email/service';
import { formSubmission } from '@/lib/email/templates';

import { getPublicApiCorsHeadersWithPost } from '@/lib/security/cors';

function hashValue(value: string) {
  const salt = process.env.IP_HASH_SALT || 'editoria-cms-default-salt';
  return crypto.createHmac('sha256', salt).update(value).digest('hex');
}

async function supportsFormsTables() {
  const supabase = await createServiceRoleClient();
  const { error } = await supabase.from('site_forms').select('id').limit(1);
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

  if (!(await supportsFormsTables())) {
    return NextResponse.json({ formsEnabled: false }, { headers: getPublicApiCorsHeadersWithPost(request) });
  }

  const supabase = await createServiceRoleClient();
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single();
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404, headers: getPublicApiCorsHeadersWithPost(request) });
  }

  const { data: form } = await supabase
    .from('site_forms')
    .select('name, slug, description, fields, success_message')
    .eq('tenant_id', tenant.id)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (!form) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404, headers: getPublicApiCorsHeadersWithPost(request) });
  }

  return NextResponse.json({ formsEnabled: true, form }, { headers: getPublicApiCorsHeadersWithPost(request) });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!(await supportsFormsTables())) {
    return NextResponse.json({ error: 'Forms module not initialized' }, { status: 503, headers: getPublicApiCorsHeadersWithPost(request) });
  }

  const body = await request.json();
  const tenantSlug = String(body.tenant || '');
  const payload = (body.payload || {}) as Record<string, unknown>;
  const sourcePage = String(body.source_page || '');
  const honeypot = String(body.website || '');

  if (!tenantSlug) {
    return NextResponse.json({ error: 'tenant required' }, { status: 400, headers: getPublicApiCorsHeadersWithPost(request) });
  }

  if (honeypot) {
    return NextResponse.json({ success: true }, { headers: getPublicApiCorsHeadersWithPost(request) });
  }

  const clientIp = getClientIp(request);
  const limiter = await checkRateLimit(`form:${tenantSlug}:${slug}:${clientIp}`, 8, 10 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: 'Too many submissions, please try again later.' },
      { status: 429, headers: { ...getPublicApiCorsHeadersWithPost(request), 'Retry-After': String(Math.ceil(limiter.retryAfterMs / 1000)) } }
    );
  }

  if (JSON.stringify(payload).length > 20_000) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413, headers: getPublicApiCorsHeadersWithPost(request) });
  }

  const isHuman = await verifyTurnstileToken(String(body.turnstile_token || ''), clientIp);
  if (!isHuman) {
    return NextResponse.json({ error: 'Bot protection check failed' }, { status: 400, headers: getPublicApiCorsHeadersWithPost(request) });
  }

  const supabase = await createServiceRoleClient();
  const { data: tenant } = await supabase.from('tenants').select('id, name').eq('slug', tenantSlug).single();
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404, headers: getPublicApiCorsHeadersWithPost(request) });
  }

  const { data: form } = await supabase
    .from('site_forms')
    .select('id, name, fields, recipient_emails, success_message')
    .eq('tenant_id', tenant.id)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (!form) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404, headers: getPublicApiCorsHeadersWithPost(request) });
  }

  const requiredFields = Array.isArray(form.fields)
    ? form.fields.filter((field: { required?: boolean; name?: string }) => field.required && field.name).map((field: { name: string }) => field.name)
    : [];

  const missing = requiredFields.filter((fieldName) => {
    const value = payload[fieldName];
    return value === undefined || value === null || String(value).trim() === '';
  });

  if (missing.length > 0) {
    return NextResponse.json({ error: `Campi obbligatori mancanti: ${missing.join(', ')}` }, { status: 400, headers: getPublicApiCorsHeadersWithPost(request) });
  }

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
    console.error("form_submission.insert failed:", error.message);
    return NextResponse.json({ error: 'Unable to save submission' }, { status: 500, headers: getPublicApiCorsHeadersWithPost(request) });
  }

  // Fire-and-forget: notify recipient emails
  const recipients = Array.isArray(form.recipient_emails) ? form.recipient_emails.filter(Boolean) : [];
  if (recipients.length > 0) {
    const emailData = formSubmission({
      formName: form.name || slug,
      siteName: tenant.name || tenantSlug,
      submitterName: typeof payload.name === 'string' ? payload.name : undefined,
      submitterEmail: typeof payload.email === 'string' ? payload.email : undefined,
      fields: payload,
      sourcePage: sourcePage || undefined,
    });
    sendEmailAsync({
      to: recipients,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      replyTo: typeof payload.email === 'string' ? payload.email : undefined,
    });
  }

  return NextResponse.json(
    { success: true, message: form.success_message || 'Invio ricevuto correttamente.' },
    { headers: getPublicApiCorsHeadersWithPost(request) }
  );
}
