import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { resolvePublicTenantContext, resolvePublicTenantContextById } from '@/lib/site/runtime';
import { getPublicApiCorsHeadersWithPost } from '@/lib/security/cors';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { isTurnstileVerificationEnabled, verifyTurnstileToken } from '@/lib/security/turnstile';
import { normalizeNewsletterConfig } from '@/lib/site/newsletter';

const _processIpSalt = process.env.IP_HASH_SALT || crypto.randomBytes(32).toString('hex');

function hashValue(value: string) {
  return crypto.createHmac('sha256', _processIpSalt).update(value).digest('hex');
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function supportsNewsletterSubscribersTables(tenantId: string) {
  const context = await resolvePublicTenantContextById(tenantId);
  if (!context) return false;
  const { error } = await context.runtimeClient.from('newsletter_subscribers').select('id').limit(1);
  return !error;
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: getPublicApiCorsHeadersWithPost(request) });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const tenantSlug = typeof body?.tenant === 'string' ? body.tenant : '';
  const payload = body?.payload && typeof body.payload === 'object' ? (body.payload as Record<string, unknown>) : {};
  const sourcePage = typeof body?.source_page === 'string' ? body.source_page : '';
  const honeypot = typeof body?.website === 'string' ? body.website : '';

  if (!tenantSlug) {
    return NextResponse.json({ error: 'tenant required' }, { status: 400, headers: getPublicApiCorsHeadersWithPost(request) });
  }

  const context = await resolvePublicTenantContext(tenantSlug);
  if (!context) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404, headers: getPublicApiCorsHeadersWithPost(request) });
  }

  if (!(await supportsNewsletterSubscribersTables(context.tenant.id))) {
    return NextResponse.json({ error: 'Newsletter subscribers module not initialized' }, { status: 503, headers: getPublicApiCorsHeadersWithPost(request) });
  }

  if (honeypot) {
    return NextResponse.json({ success: true }, { headers: getPublicApiCorsHeadersWithPost(request) });
  }

  const clientIp = getClientIp(request);
  const limiter = await checkRateLimit(`newsletter:${tenantSlug}:${clientIp}`, 6, 10 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: 'Too many subscription attempts, please try again later.' },
      { status: 429, headers: { ...getPublicApiCorsHeadersWithPost(request), 'Retry-After': String(Math.ceil(limiter.retryAfterMs / 1000)) } },
    );
  }

  const requiresTurnstile = isTurnstileVerificationEnabled();
  const isHuman = requiresTurnstile
    ? await verifyTurnstileToken(String(body?.turnstile_token || ''), clientIp)
    : true;
  if (!isHuman) {
    return NextResponse.json({ error: 'Bot protection check failed' }, { status: 400, headers: getPublicApiCorsHeadersWithPost(request) });
  }

  const { runtimeClient, tenant } = context;

  const { data: siteConfig } = await runtimeClient
    .from('site_config')
    .select('footer')
    .eq('tenant_id', tenant.id)
    .maybeSingle();

  const newsletterConfig = normalizeNewsletterConfig(siteConfig?.footer || {});
  if (!newsletterConfig.enabled || newsletterConfig.mode !== 'form') {
    return NextResponse.json({ error: 'Newsletter signup is not enabled' }, { status: 400, headers: getPublicApiCorsHeadersWithPost(request) });
  }

  const normalizedPayload = Object.fromEntries(
    newsletterConfig.subscriptionFields.map((field) => {
      const rawValue = payload[field.name];
      const value = field.type === 'checkbox'
        ? Boolean(rawValue)
        : typeof rawValue === 'string'
          ? rawValue.trim()
          : rawValue == null
            ? ''
            : String(rawValue).trim();
      return [field.name, value];
    }),
  );

  const missing = newsletterConfig.subscriptionFields
    .filter((field) => field.required)
    .filter((field) => {
      const value = normalizedPayload[field.name];
      return field.type === 'checkbox' ? value !== true : !String(value || '').trim();
    })
    .map((field) => field.label || field.name);

  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Campi obbligatori mancanti: ${missing.join(', ')}` },
      { status: 400, headers: getPublicApiCorsHeadersWithPost(request) },
    );
  }

  const emailField = newsletterConfig.subscriptionFields.find((field) => field.name === 'email' && field.type === 'email');
  const email = emailField ? String(normalizedPayload[emailField.name] || '').trim().toLowerCase() : '';
  if (!email || !isEmail(email)) {
    return NextResponse.json({ error: 'Email non valida' }, { status: 400, headers: getPublicApiCorsHeadersWithPost(request) });
  }

  const consents = Object.fromEntries(
    newsletterConfig.subscriptionFields
      .filter((field) => field.type === 'checkbox')
      .map((field) => [field.name, Boolean(normalizedPayload[field.name])]),
  );

  const fullName = ['full_name', 'name', 'nome']
    .map((fieldName) => normalizedPayload[fieldName])
    .find((value) => typeof value === 'string' && value.trim()) as string | undefined;

  const now = new Date().toISOString();
  const status = newsletterConfig.provider.doubleOptIn ? 'pending' : 'active';

  const { error } = await runtimeClient
    .from('newsletter_subscribers')
    .upsert({
      tenant_id: tenant.id,
      email,
      full_name: fullName || null,
      status,
      source: 'website',
      source_page: sourcePage || null,
      payload: normalizedPayload,
      consents,
      ip_hash: hashValue(clientIp),
      provider: newsletterConfig.provider.provider === 'custom' ? null : newsletterConfig.provider.provider,
      subscribed_at: now,
      last_submission_at: now,
      unsubscribed_at: null,
      confirmed_at: newsletterConfig.provider.doubleOptIn ? null : now,
    }, {
      onConflict: 'tenant_id,email',
    });

  if (error) {
    console.error('newsletter_subscribers.upsert failed:', error.message);
    return NextResponse.json({ error: 'Unable to save subscription' }, { status: 500, headers: getPublicApiCorsHeadersWithPost(request) });
  }

  return NextResponse.json(
    {
      success: true,
      message: newsletterConfig.successMessage || 'Iscrizione completata. Controlla la tua casella email.',
      status,
    },
    { headers: getPublicApiCorsHeadersWithPost(request) },
  );
}
