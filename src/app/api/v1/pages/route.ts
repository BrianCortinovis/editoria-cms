import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { assertTrustedMutationRequest } from '@/lib/security/request';
import { NextRequest, NextResponse } from 'next/server';
import { buildDefaultPageMeta, slugifyPageTitle } from '@/lib/pages/page-seo';
import { readPublishedJson } from '@/lib/publish/storage';
import type { PublishedManifest, PublishedPageDocument } from '@/lib/publish/types';
import { z } from 'zod';

const pageCreateUpdateSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, 'title obbligatorio'),
  slug: z.string().regex(/^[a-z0-9-]*$/, 'slug non valido (solo a-z, 0-9, -)').optional().default(''),
  tenant_id: z.string().uuid('tenant_id deve essere un UUID valido'),
  blocks: z.array(z.any()).optional(),
  meta: z.record(z.unknown()).optional(),
  is_published: z.boolean().optional(),
}).passthrough();

const PAGE_EDITOR_ROLES = new Set(['admin', 'chief_editor', 'editor']);

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient();
    const tenant = request.nextUrl.searchParams.get('tenant');

    if (!tenant) {
      return NextResponse.json({ error: 'tenant parameter required' }, { status: 400 });
    }

    const manifest = await readPublishedJson<PublishedManifest>(`sites/${encodeURIComponent(tenant)}/manifest.json`);
    if (manifest) {
      const pagePaths = [
        ...(manifest.documents.homepage ? [manifest.documents.homepage] : []),
        ...Object.values(manifest.pages || {}),
      ];
      const pageDocuments = await Promise.all(
        pagePaths.map((path) => readPublishedJson<PublishedPageDocument>(path))
      );

      return NextResponse.json({
        pages: pageDocuments
          .filter((entry): entry is PublishedPageDocument => Boolean(entry?.page))
          .map((entry) => ({
            id: entry.page.id,
            title: entry.page.title,
            slug: entry.page.slug,
            is_published: true,
            created_at: entry.generatedAt,
            updated_at: entry.page.updatedAt,
            blocks: entry.page.blocks,
            meta: entry.page.meta,
          })),
      }, {
        headers: { 'Cache-Control': 'public, max-age=300' }
      });
    }

    const { data: tenantData } = await supabase
      .from('tenants').select('id').eq('slug', tenant).single();

    if (!tenantData) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const { data: pages, error } = await supabase
      .from('site_pages')
      .select('id, title, slug, is_published, created_at, updated_at, blocks, meta')
      .eq('tenant_id', tenantData.id)
      .eq('is_published', true)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ pages }, {
      headers: { 'Cache-Control': 'public, max-age=300' }
    });
  } catch (error) {
    console.error('GET /api/v1/pages error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const trustedOriginError = assertTrustedMutationRequest(request);
    if (trustedOriginError) {
      return trustedOriginError;
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = pageCreateUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { id, title, slug, blocks, meta, tenant_id, is_published } = parsed.data;
    const normalizedSlug = typeof slug === 'string' && slug.trim() ? slug.trim() : slugifyPageTitle(String(title || ''));

    // Verify user has access to this tenant
    const { data: access } = await supabase
      .from('user_tenants')
      .select('id, role')
      .eq('user_id', user.id)
      .eq('tenant_id', tenant_id)
      .single();

    if (!access) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!PAGE_EDITOR_ROLES.has(access.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (id) {
      const { data: page, error } = await supabase
        .from('site_pages')
        .update({
          title,
          slug: normalizedSlug,
          blocks: blocks || [],
          meta: buildDefaultPageMeta({
            title,
            slug: normalizedSlug,
            blocks: Array.isArray(blocks) ? blocks : [],
            currentMeta: meta || {},
          }),
          is_published: Boolean(is_published),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('tenant_id', tenant_id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(page);
    } else {
      const { data: page, error } = await supabase
        .from('site_pages')
        .insert([{
          tenant_id,
          title,
          slug: normalizedSlug,
          blocks: blocks || [],
          meta: buildDefaultPageMeta({
            title,
            slug: normalizedSlug,
            blocks: Array.isArray(blocks) ? blocks : [],
            currentMeta: meta || {},
          }),
          is_published: Boolean(is_published),
        }])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(page, { status: 201 });
    }
  } catch (error) {
    console.error('POST /api/v1/pages error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
