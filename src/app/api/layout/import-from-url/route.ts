import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { assertSafeOutboundHttpUrl } from '@/lib/security/network';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { assertTrustedMutationRequest } from '@/lib/security/request';

interface BlockData {
  tag: string;
  classes: string;
  id: string;
  text?: string;
  innerHTML?: string;
  attributes: Record<string, string>;
  children: BlockData[];
  selector?: string;
}

/**
 * Extract blocks from HTML using cheerio
 */
function extractBlocks(html: string, rootSelector: string = 'body'): BlockData[] {
  const $ = cheerio.load(html);
  const blocks: BlockData[] = [];

  // Define what we consider important blocks
  const blockSelectors = [
    'header',
    'nav',
    '.navbar',
    '[role="navigation"]',
    'section',
    'article',
    '.container',
    '.content',
    '.hero',
    '.banner',
    '.grid',
    '.carousel',
    '.slider',
    '[data-cms-slot]',
    'main',
    'aside',
    'footer',
  ];

  const root = $(rootSelector);

  // Extract each block type
  blockSelectors.forEach((selector) => {
    root.find(selector).each((index, element) => {
      const $el = $(element);

      // Skip if already a parent's child
      if ($el.parent().is(blockSelectors.join(','))) {
        return;
      }

      const block: BlockData = {
        tag: element.name || 'div',
        classes: $el.attr('class') || '',
        id: $el.attr('id') || `block-${blocks.length}`,
        text: $el.text().substring(0, 100),
        attributes: {
          'data-block-type': detectBlockType($el, element),
          'data-original-selector': selector,
        },
        children: [],
        selector: selector,
      };

      // Extract direct children that are blocks
      $el.children().each((_, child) => {
        const $child = $(child);
        if (['div', 'section', 'article', 'header', 'footer', 'nav'].includes(child.name || '')) {
          block.children.push({
            tag: child.name || 'div',
            classes: $child.attr('class') || '',
            id: $child.attr('id') || `block-${blocks.length}-${block.children.length}`,
            text: $child.text().substring(0, 50),
            attributes: {},
            children: [],
          });
        }
      });

      blocks.push(block);
    });
  });

  return blocks;
}

/**
 * Detect block type from element
 */
function detectBlockType($el: any, element: any): string {
  const tag = element.name;
  const classes = ($el.attr('class') || '').toLowerCase();
  const id = ($el.attr('id') || '').toLowerCase();
  const text = $el.text().toLowerCase();

  // Header/Navigation
  if (tag === 'header' || classes.includes('header') || id.includes('header')) {
    return 'header';
  }
  if (tag === 'nav' || classes.includes('nav') || classes.includes('menu')) {
    return 'navigation';
  }

  // Hero
  if (classes.includes('hero') || classes.includes('banner') || classes.includes('jumbotron')) {
    return 'hero';
  }

  // Content areas
  if (tag === 'main' || classes.includes('main-content') || classes.includes('content')) {
    return 'content';
  }
  if (tag === 'article' || classes.includes('article') || classes.includes('post')) {
    return 'article';
  }

  // Grid/Layout
  if (classes.includes('grid') || classes.includes('cards')) {
    return 'grid';
  }
  if (classes.includes('carousel') || classes.includes('slider')) {
    return 'carousel';
  }

  // Sidebar
  if (tag === 'aside' || classes.includes('sidebar')) {
    return 'sidebar';
  }

  // Footer
  if (tag === 'footer' || classes.includes('footer')) {
    return 'footer';
  }

  // Section
  if (tag === 'section') {
    if (text.includes('about')) return 'about';
    if (text.includes('service')) return 'services';
    if (text.includes('product')) return 'products';
    if (text.includes('contact')) return 'contact';
    if (text.includes('testimonial') || text.includes('review')) return 'testimonials';
    return 'section';
  }

  return 'block';
}

/**
 * Convert blocks to CMS layout format
 */
function blocksToLayoutSlots(blocks: BlockData[]): any[] {
  return blocks.map((block, index) => ({
    slot_key: `slot_${block.id || index}`,
    label: generateLabel(block),
    description: `${block.tag.toUpperCase()} block - ${block.classes.split(' ')[0]}`,
    content_type: mapBlockTypeToContentType(block.attributes['data-block-type']),
    max_items: block.children.length > 0 ? block.children.length : 10,
    style_hint: block.classes || 'default',
    page: 'imported',
    layout: {
      tag: block.tag,
      display: detectDisplay(block.classes),
      width: '100%',
      height: 'auto',
      grid_cols: detectGridCols(block.classes),
      order: index,
      classes: block.classes,
    },
  }));
}

/**
 * Generate readable label from block
 */
function generateLabel(block: BlockData): string {
  const blockType = block.attributes['data-block-type'] || 'block';
  const classHint = block.classes.split(' ')[0] || '';
  const idHint = block.id.replace(/^block-/, '') || '';

  if (idHint) return idHint;
  if (classHint) return classHint;
  return `${blockType} ${block.tag}`;
}

/**
 * Map block type to CMS content type
 */
function mapBlockTypeToContentType(blockType: string): string {
  const map: Record<string, string> = {
    'header': 'header',
    'navigation': 'navigation',
    'hero': 'banner',
    'content': 'text',
    'article': 'articles',
    'grid': 'grid',
    'carousel': 'carousel',
    'sidebar': 'sidebar',
    'footer': 'footer',
    'section': 'section',
  };

  return map[blockType] || 'content';
}

/**
 * Detect CSS display from classes
 */
function detectDisplay(classes: string): string {
  if (classes.includes('flex')) return 'flex';
  if (classes.includes('grid')) return 'grid';
  if (classes.includes('inline')) return 'inline';
  return 'block';
}

/**
 * Detect grid columns from classes
 */
function detectGridCols(classes: string): number {
  const matches = classes.match(/col(?:umn)?s?-?(\d+)/i) || classes.match(/grid-?(\d+)/i);
  if (matches) {
    const cols = parseInt(matches[1]);
    if (cols > 0 && cols <= 12) return cols;
  }

  if (classes.includes('md:') || classes.includes('grid-cols')) {
    if (classes.includes('md:grid-cols-2') || classes.includes('md:col-2')) return 2;
    if (classes.includes('md:grid-cols-3') || classes.includes('md:col-3')) return 3;
    if (classes.includes('md:grid-cols-4') || classes.includes('md:col-4')) return 4;
  }

  return 1;
}

export async function POST(request: NextRequest) {
  try {
    const trustedOriginError = assertTrustedMutationRequest(request);
    if (trustedOriginError) {
      return trustedOriginError;
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientIp = getClientIp(request);
    const limiter = await checkRateLimit(`layout-import:${user.id}:${clientIp}`, 10, 10 * 60 * 1000);
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: 'Too many import requests' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(limiter.retryAfterMs / 1000)) } }
      );
    }

    const { url, selector = 'body' } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    const parsedUrl = await assertSafeOutboundHttpUrl(url);

    // Fetch HTML from URL with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      redirect: 'error',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; editoria-cms/1.0)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status} ${response.statusText}` },
        { status: 400 }
      );
    }

    const html = await response.text();

    // Extract blocks from HTML
    const blocks = extractBlocks(html, selector);

    if (blocks.length === 0) {
      return NextResponse.json(
        {
          blocks: [],
          slots: [],
          message: 'No blocks found. Try adjusting the selector parameter.',
          suggested_selectors: ['main', '.container', '.content', '#app'],
        },
        { status: 200 }
      );
    }

    // Convert to layout slots
    const slots = blocksToLayoutSlots(blocks);

    return NextResponse.json({
      source: parsedUrl.toString(),
      selector: selector,
      blocks: blocks,
      slots: slots,
      total_blocks: blocks.length,
      total_children: blocks.reduce((sum, b) => sum + b.children.length, 0),
    });
  } catch (error: any) {
    console.error('Error importing layout from URL:', error);

    if (error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout - URL took too long to respond' }, { status: 408 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to import layout from URL' },
      {
        status: /invalid url|not allowed|only http and https|private|loopback|credentials/i.test(error.message || '')
          ? 400
          : 500,
      }
    );
  }
}
