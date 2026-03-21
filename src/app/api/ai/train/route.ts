import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * POST /api/ai/train
 * Train AI on published articles to create journalist profiles and publication style
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient();
    const tenantSlug = request.nextUrl.searchParams.get('tenant') || 'demo';

    // Get tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Get all published articles with author info
    const { data: articles } = await supabase
      .from('articles')
      .select(`
        id,
        title,
        summary,
        content,
        author_id,
        published_at,
        profiles!articles_author_id_fkey(id, full_name, email)
      `)
      .eq('tenant_id', tenant.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (!articles || articles.length === 0) {
      return NextResponse.json({
        journalists: [],
        publicationStyle: null,
        message: 'No published articles found',
      });
    }

    // Group articles by journalist
    const journalistArticles = new Map<string, any[]>();

    articles.forEach((article: any) => {
      const author = article.profiles as any;
      if (!author?.id) return;

      if (!journalistArticles.has(author.id)) {
        journalistArticles.set(author.id, []);
      }
      journalistArticles.get(author.id)!.push(article);
    });

    // Analyze each journalist
    const journalists = Array.from(journalistArticles.entries()).map(([authorId, authArticles]) => {
      const author = (authArticles[0].profiles as any);
      const texts = authArticles.map(a => `${a.title} ${a.summary || ''}`).join(' ');

      return {
        id: authorId,
        name: author.full_name,
        email: author.email,
        style: analyzeWritingStyle(texts),
        tone: analyzeTone(texts),
        keywords: extractKeywords(texts),
        articleCount: authArticles.length,
        trainingStatus: 'complete',
      };
    });

    // Analyze publication overall style
    const allTexts = articles.map(a => `${a.title} ${a.summary || ''}`).join(' ');
    const publicationStyle = {
      tone: analyzeTone(allTexts),
      politicalOrientation: analyzePoliticalOrientation(allTexts),
      mainSectors: extractMainTopics(allTexts),
      characteristics: analyzeCharacteristics(allTexts),
    };

    // Save journalist profiles
    for (const journalist of journalists) {
      await supabase
        .from('journalist_profiles')
        .upsert({
          tenant_id: tenant.id,
          journalist_id: journalist.id,
          name: journalist.name,
          email: journalist.email,
          style_data: {
            style: journalist.style,
            tone: journalist.tone,
            keywords: journalist.keywords,
          },
          article_count: journalist.articleCount,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'tenant_id,journalist_id'
        });
    }

    // Save publication style
    await supabase
      .from('publication_styles')
      .upsert({
        tenant_id: tenant.id,
        style_data: publicationStyle,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'tenant_id'
      });

    return NextResponse.json({
      journalists,
      publicationStyle,
      articleCount: articles.length,
    });
  } catch (error) {
    console.error('Error training AI:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * Analyze writing style from text
 */
function analyzeWritingStyle(text: string): string {
  const sentences = text.split('.').filter(s => s.trim());
  const avgLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;

  if (avgLength > 20) return 'Descrittivo e dettagliato';
  if (avgLength > 12) return 'Equilibrato e professionale';
  return 'Conciso e diretto';
}

/**
 * Analyze tone
 */
function analyzeTone(text: string): string {
  const lowercaseText = text.toLowerCase();

  const positiveWords = ['eccellente', 'meraviglioso', 'incredibile', 'fantastico', 'splendido'];
  const criticalWords = ['critica', 'problema', 'difficoltà', 'sfida', 'controversia'];
  const technicalWords = ['analisi', 'dati', 'studio', 'ricerca', 'metodologia'];

  const positiveCount = positiveWords.filter(word => lowercaseText.includes(word)).length;
  const criticalCount = criticalWords.filter(word => lowercaseText.includes(word)).length;
  const technicalCount = technicalWords.filter(word => lowercaseText.includes(word)).length;

  if (technicalCount > criticalCount && technicalCount > positiveCount) return 'Analitico e tecnico';
  if (criticalCount > positiveCount) return 'Critico e investigativo';
  if (positiveCount > criticalCount) return 'Positivo e entusiasta';
  return 'Neutrale e informativo';
}

/**
 * Analyze political orientation
 */
function analyzePoliticalOrientation(text: string): string {
  const lowercaseText = text.toLowerCase();

  const leftWords = ['progressista', 'sociale', 'solidarietà', 'uguaglianza', 'diritti'];
  const rightWords = ['conservatore', 'tradizione', 'mercato', 'libertà economica', 'efficienza'];
  const centerWords = ['equilibrio', 'moderato', 'pragmatico'];

  const leftCount = leftWords.filter(word => lowercaseText.includes(word)).length;
  const rightCount = rightWords.filter(word => lowercaseText.includes(word)).length;
  const centerCount = centerWords.filter(word => lowercaseText.includes(word)).length;

  if (leftCount > rightCount) return 'Progressista';
  if (rightCount > leftCount) return 'Conservatore';
  if (centerCount > 0) return 'Centrista';
  return 'Neutrale';
}

/**
 * Extract main topics
 */
function extractMainTopics(text: string): string[] {
  const topics = new Map<string, number>();
  const sectors = ['politica', 'economia', 'tecnologia', 'sport', 'cultura', 'società', 'ambiente', 'sanità'];

  const lowercaseText = text.toLowerCase();

  sectors.forEach(sector => {
    const count = (lowercaseText.match(new RegExp(sector, 'g')) || []).length;
    if (count > 0) {
      topics.set(sector.charAt(0).toUpperCase() + sector.slice(1), count);
    }
  });

  return Array.from(topics.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic);
}

/**
 * Extract keywords
 */
function extractKeywords(text: string): string[] {
  const words = text.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 5 && !['articolo', 'titolo', 'scritto', 'sulla', 'sulla'].includes(word));

  const wordFreq = new Map<string, number>();

  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });

  return Array.from(wordFreq.entries())
    .filter(([, count]) => count > 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * Analyze writing characteristics
 */
function analyzeCharacteristics(text: string): string[] {
  const characteristics: string[] = [];
  const lowercaseText = text.toLowerCase();

  if (lowercaseText.includes('virgoletta') || lowercaseText.includes('intervista')) {
    characteristics.push('Usa citazioni dirette');
  }
  if ((lowercaseText.match(/\d+/g) || []).length > 10) {
    characteristics.push('Ricco di dati numerici');
  }
  if (lowercaseText.includes('tuttavia') || lowercaseText.includes('però') || lowercaseText.includes('d\'altro canto')) {
    characteristics.push('Stile bilanciato e sfumato');
  }
  if (lowercaseText.includes('analisi') || lowercaseText.includes('approfondimento')) {
    characteristics.push('Approccio approfondito');
  }

  return characteristics.length > 0 ? characteristics : ['Stile standard'];
}
