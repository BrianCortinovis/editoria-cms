import slugify from 'slugify';
import type { Block } from '@/lib/types';

export interface PageSeoMeta {
  title?: string;
  description?: string;
  canonicalPath?: string;
  focusKeyword?: string;
  ogTitle?: string;
  ogDescription?: string;
  schemaType?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

export function slugifyPageTitle(title: string) {
  return slugify(title || '', { lower: true, strict: true, locale: 'it' });
}

export function buildCanonicalPathFromSlug(slug: string) {
  const normalizedSlug = String(slug || '').trim().replace(/^\/+/, '');
  if (!normalizedSlug || normalizedSlug === 'homepage') {
    return '/';
  }
  return `/${normalizedSlug}`;
}

function stripHtml(input: string) {
  return input
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(input: string, max: number) {
  const normalized = input.trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trim()}…`;
}

function collectBlockText(blocks: Block[], bucket: string[] = []) {
  for (const block of blocks) {
    if (typeof block.label === 'string' && block.label.trim()) {
      bucket.push(block.label.trim());
    }

    const content = block.props?.content;
    if (typeof content === 'string' && content.trim()) {
      bucket.push(stripHtml(content));
    }

    const title = block.props?.title;
    if (typeof title === 'string' && title.trim()) {
      bucket.push(title.trim());
    }

    const subtitle = block.props?.subtitle;
    if (typeof subtitle === 'string' && subtitle.trim()) {
      bucket.push(subtitle.trim());
    }

    if (Array.isArray(block.children) && block.children.length > 0) {
      collectBlockText(block.children, bucket);
    }
  }

  return bucket;
}

export function derivePageDescription(title: string, blocks: Block[] = []) {
  const extracted = collectBlockText(blocks)
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (extracted) {
    return truncate(extracted, 155);
  }

  if (!title.trim()) {
    return '';
  }

  return truncate(`${title.trim()} - pagina del sito pubblicata e gestita dal CMS editoriale.`, 155);
}

export function buildDefaultPageMeta(input: {
  title: string;
  slug?: string;
  blocks?: Block[];
  currentMeta?: Record<string, unknown>;
}): Record<string, unknown> {
  const title = String(input.title || '').trim();
  const slug = String(input.slug || slugifyPageTitle(title));
  const blocks = input.blocks || [];
  const currentMeta = input.currentMeta || {};
  const defaultDescription = derivePageDescription(title, blocks);

  return {
    ...currentMeta,
    title: typeof currentMeta.title === 'string' && currentMeta.title.trim() ? currentMeta.title : title,
    description: typeof currentMeta.description === 'string' && currentMeta.description.trim() ? currentMeta.description : defaultDescription,
    canonicalPath:
      typeof currentMeta.canonicalPath === 'string' && currentMeta.canonicalPath.trim()
        ? currentMeta.canonicalPath
        : buildCanonicalPathFromSlug(slug),
    focusKeyword:
      typeof currentMeta.focusKeyword === 'string' && currentMeta.focusKeyword.trim()
        ? currentMeta.focusKeyword
        : title,
    ogTitle:
      typeof currentMeta.ogTitle === 'string' && currentMeta.ogTitle.trim()
        ? currentMeta.ogTitle
        : title,
    ogDescription:
      typeof currentMeta.ogDescription === 'string' && currentMeta.ogDescription.trim()
        ? currentMeta.ogDescription
        : defaultDescription,
    schemaType:
      typeof currentMeta.schemaType === 'string' && currentMeta.schemaType.trim()
        ? currentMeta.schemaType
        : 'WebPage',
    noindex: Boolean(currentMeta.noindex),
    nofollow: Boolean(currentMeta.nofollow),
  };
}
