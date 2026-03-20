import { createServiceRoleClient } from '@/lib/supabase/server';
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = await createServiceRoleClient();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://valbremmbana.com';

    // Get all published articles
    const { data: articles } = await supabase
      .from('articles')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false });

    // Get all published pages
    const { data: pages } = await supabase
      .from('pages')
      .select('slug, updated_at, page_type')
      .eq('status', 'published')
      .order('updated_at', { ascending: false });

    // Get categories
    const { data: categories } = await supabase
      .from('categories')
      .select('slug, updated_at');

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      ...(articles?.map(article => ({
        url: `${baseUrl}/articoli/${article.slug}`,
        lastModified: article.updated_at,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })) || []),
      ...(pages?.map(page => ({
        url: `${baseUrl}/${page.slug}`,
        lastModified: page.updated_at,
        changeFrequency: 'weekly' as const,
        priority: page.page_type === 'homepage' ? 0.9 : 0.7,
      })) || []),
      ...(categories?.map(category => ({
        url: `${baseUrl}/categoria/${category.slug}`,
        lastModified: category.updated_at,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })) || []),
    ];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return [];
  }
}
