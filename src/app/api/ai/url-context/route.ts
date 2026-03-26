import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { assertSafeOutboundHttpUrl } from '@/lib/security/network';
import { assertTrustedMutationRequest } from '@/lib/security/request';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

function cleanText(input: string) {
  return input.replace(/\s+/g, ' ').trim();
}

function truncate(input: string, max: number) {
  if (input.length <= max) return input;
  return `${input.slice(0, max).trim()}...`;
}

export async function POST(request: NextRequest) {
  try {
    const trustedOriginError = assertTrustedMutationRequest(request);
    if (trustedOriginError) {
      return NextResponse.json({ error: 'Untrusted origin' }, { status: 403 });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientIp = getClientIp(request);
    const limiter = await checkRateLimit(`ai-url-context:${user.id}:${clientIp}`, 12, 10 * 60 * 1000);
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { url } = await request.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    const parsed = await assertSafeOutboundHttpUrl(url);

    const response = await fetch(parsed.toString(), {
      headers: {
        'User-Agent': 'EditoriaCMS/1.0 (+AI Build Wizard URL Context)',
        Accept: 'text/html,application/xhtml+xml',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Fetch failed with status ${response.status}` }, { status: 400 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    $('script, style, noscript, iframe, svg').remove();

    const title = cleanText($('title').first().text() || $('h1').first().text() || parsed.hostname);
    const headings = $('h1, h2')
      .slice(0, 8)
      .map((_, el) => cleanText($(el).text()))
      .get()
      .filter(Boolean);

    const paragraphs = $('article p, main p, .content p, p')
      .slice(0, 12)
      .map((_, el) => cleanText($(el).text()))
      .get()
      .filter((text) => text.length > 30);

    const summary = truncate(paragraphs.slice(0, 6).join('\n'), 4000);
    const excerpt = truncate(paragraphs[0] || cleanText($('body').text()), 500);

    return NextResponse.json({
      url: parsed.toString(),
      title,
      headings,
      excerpt,
      summary,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to extract URL context' },
      { status: 500 }
    );
  }
}
