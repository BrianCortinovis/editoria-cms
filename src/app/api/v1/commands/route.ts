import { NextRequest, NextResponse } from 'next/server';
import { executeCommands, getCommandDiscovery, type CommandEnvelope } from '@/lib/commands/command-center';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { assertTrustedMutationRequest } from '@/lib/security/request';
import { writeActivityLog } from '@/lib/security/audit';

const BASE_CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const EDITOR_ROLES = new Set(['admin', 'chief_editor', 'editor']);

interface CommandsPayload {
  tenant_id?: string;
  tenant?: string;
  dryRun?: boolean;
  commands?: CommandEnvelope[];
}

function buildCorsHeaders(request: NextRequest) {
  const origin = request.headers.get('origin');
  const requestOrigin = request.nextUrl.origin;
  const allowlist = (process.env.PUBLIC_API_ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const allowOrigin = origin && (origin === requestOrigin || allowlist.includes(origin))
    ? origin
    : requestOrigin;

  return {
    ...BASE_CORS_HEADERS,
    'Access-Control-Allow-Origin': allowOrigin,
    'Vary': 'Origin',
  };
}

async function resolveTenantId(
  supabase: Awaited<ReturnType<typeof createServiceRoleClient>>,
  input: { tenantId?: string; tenantSlug?: string; userId?: string }
) {
  if (input.tenantId) {
    return input.tenantId;
  }

  if (input.tenantSlug) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', input.tenantSlug)
      .single();
    return tenant?.id || null;
  }

  if (input.userId) {
    const { data: membership } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', input.userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    return membership?.tenant_id || null;
  }

  return null;
}

async function resolveActorId(request: NextRequest) {
  const sessionClient = await createServerSupabaseClient();
  const {
    data: { user: sessionUser },
  } = await sessionClient.auth.getUser();

  if (sessionUser) {
    return sessionUser.id;
  }

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return null;
  }

  const serviceRole = await createServiceRoleClient();
  const {
    data: { user: tokenUser },
  } = await serviceRole.auth.getUser(token);

  return tokenUser?.id || null;
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(request) });
}

export async function GET(request: NextRequest) {
  const corsHeaders = buildCorsHeaders(request);
  const actorId = await resolveActorId(request);
  if (!actorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  const supabase = await createServiceRoleClient();
  const tenantId = await resolveTenantId(supabase, {
    tenantId: request.nextUrl.searchParams.get('tenant_id') || undefined,
    tenantSlug: request.nextUrl.searchParams.get('tenant') || undefined,
    userId: actorId,
  });

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404, headers: corsHeaders });
  }

  const { data: membership } = await supabase
    .from('user_tenants')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', actorId)
    .maybeSingle();

  if (!membership || !EDITOR_ROLES.has(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders });
  }

  return NextResponse.json(getCommandDiscovery(), {
    headers: {
      ...corsHeaders,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const trustedOriginError = assertTrustedMutationRequest(request);
    if (trustedOriginError) {
      return trustedOriginError;
    }

    const corsHeaders = buildCorsHeaders(request);
    const body = (await request.json()) as CommandsPayload;
    const commands = Array.isArray(body.commands) ? body.commands : [];

    if (commands.length === 0) {
      return NextResponse.json({ error: 'commands required' }, { status: 400, headers: corsHeaders });
    }

    const actorId = await resolveActorId(request);
    if (!actorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const supabase = await createServiceRoleClient();
    const tenantId = await resolveTenantId(supabase, {
      tenantId: body.tenant_id,
      tenantSlug: body.tenant,
      userId: actorId,
    });

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404, headers: corsHeaders });
    }

    const { data: membership } = await supabase
      .from('user_tenants')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', actorId)
      .maybeSingle();

    if (!membership || !EDITOR_ROLES.has(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders });
    }

    const results = await executeCommands(
      {
        tenantId,
        userId: actorId,
        dryRun: Boolean(body.dryRun),
        supabase,
      },
      commands
    );

    await writeActivityLog({
      tenantId,
      userId: actorId,
      action: 'commands.execute',
      entityType: 'command_batch',
      details: {
        dryRun: Boolean(body.dryRun),
        count: commands.length,
        commandTypes: commands.map((command) => command.command),
      },
    });

    return NextResponse.json(
      {
        tenant_id: tenantId,
        actor_id: actorId,
        dryRun: Boolean(body.dryRun),
        results,
      },
      {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Commands API error:', error);
    const corsHeaders = request instanceof NextRequest ? buildCorsHeaders(request) : BASE_CORS_HEADERS;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Command execution failed' },
      { status: 500, headers: corsHeaders }
    );
  }
}
