import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/ai/settings
 * Fetch AI models, journalist profiles, and publication style
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's tenant
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get AI settings
    const { data: aiSettings } = await supabase
      .from('ai_settings')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .single();

    // Get journalist profiles
    const { data: journalists } = await supabase
      .from('journalist_profiles')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('name');

    // Get publication style
    const { data: publicationStyle } = await supabase
      .from('publication_styles')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .single();

    return NextResponse.json({
      models: aiSettings?.models || [],
      journalists: journalists || [],
      publicationStyle: publicationStyle?.style_data || null,
    });
  } catch (error) {
    console.error('Error fetching AI settings:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/ai/settings
 * Update AI settings
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { models } = body;

    // Get user's tenant
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    // Update AI settings
    const { error } = await supabase
      .from('ai_settings')
      .upsert({
        tenant_id: profile.tenant_id,
        models,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating AI settings:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
