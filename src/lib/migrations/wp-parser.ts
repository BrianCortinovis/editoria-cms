/**
 * WordPress XML/JSON parser — runs entirely in the browser.
 * No server calls, no Vercel functions.
 */

import slugify from 'slugify';

export interface WpPost {
  title: string;
  content: string;
  excerpt: string;
  pubDate: string;
  creator: string;
  categories: string[];
  tags: string[];
  comments: WpComment[];
  images: string[];
  slug: string;
  status: string;
  postId: number | null;
  permalink: string;
}

export interface WpComment {
  author: string;
  authorEmail: string;
  authorUrl: string;
  pubDate: string;
  content: string;
  approved: boolean;
}

const cleanXml = (v: string) =>
  v.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();

function xText(content: string, tag: string): string {
  const m = new RegExp(`<${tag}(?:[^>]*?)>([\\s\\S]*?)</${tag}>`, 'i').exec(content);
  return m ? cleanXml(m[1]) : '';
}

function xTerms(content: string, domain: 'category' | 'post_tag'): string[] {
  const vals: string[] = [];
  const re = new RegExp(`<category[^>]*domain="${domain}"[^>]*>([\\s\\S]*?)</category>`, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const v = cleanXml(m[1]);
    if (v) vals.push(v);
  }
  return vals;
}

export function parseWpXml(xml: string): WpPost[] {
  const posts: WpPost[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRe.exec(xml)) !== null) {
    const c = match[1];
    const postType = xText(c, 'wp:post_type') || 'post';
    if (postType !== 'post') continue;

    const title = xText(c, 'title');
    const content = xText(c, 'content:encoded');
    const excerpt = xText(c, 'excerpt:encoded');
    if (!title || !content) continue;

    const comments: WpComment[] = [];
    const commentRe = /<wp:comment>([\s\S]*?)<\/wp:comment>/g;
    let cm: RegExpExecArray | null;
    while ((cm = commentRe.exec(c)) !== null) {
      const cc = cm[1];
      const author = xText(cc, 'wp:comment_author');
      const body = xText(cc, 'wp:comment_content');
      if (author && body) {
        comments.push({
          author,
          authorEmail: xText(cc, 'wp:comment_author_email'),
          authorUrl: xText(cc, 'wp:comment_author_url'),
          pubDate: xText(cc, 'wp:comment_date'),
          content: body,
          approved: xText(cc, 'wp:comment_approved') === '1',
        });
      }
    }

    const images: string[] = [];
    const imgRe = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let im: RegExpExecArray | null;
    while ((im = imgRe.exec(content)) !== null) images.push(im[1]);

    const postIdRaw = xText(c, 'wp:post_id');

    posts.push({
      title,
      content,
      excerpt,
      pubDate: xText(c, 'pubDate'),
      creator: xText(c, 'dc:creator'),
      categories: xTerms(c, 'category'),
      tags: xTerms(c, 'post_tag'),
      comments,
      images,
      slug: xText(c, 'wp:post_name') || slugify(title, { lower: true, strict: true, locale: 'it' }),
      status: xText(c, 'wp:status'),
      postId: postIdRaw ? Number(postIdRaw) : null,
      permalink: xText(c, 'link'),
    });
  }

  return posts;
}

export function parseWpJson(json: string): WpPost[] {
  try {
    const data = JSON.parse(json);
    const posts = Array.isArray(data) ? data : data.posts || [];
    return posts
      .filter((p: Record<string, unknown>) => p.title && p.content)
      .map((p: Record<string, unknown>) => ({
        title: String(p.title || ''),
        content: String(p.content || ''),
        excerpt: String(p.excerpt || ''),
        pubDate: String(p.pubDate || p.date || new Date().toISOString()),
        creator: String(p.creator || p.author || ''),
        categories: Array.isArray(p.category) ? p.category.map(String) : p.category ? [String(p.category)] : [],
        tags: Array.isArray(p.tags) ? p.tags.map(String) : p.tags ? [String(p.tags)] : [],
        comments: [],
        images: Array.isArray(p.images) ? p.images.map(String) : [],
        slug: String(p.slug || p.post_name || slugify(String(p.title), { lower: true, strict: true, locale: 'it' })),
        status: String(p.status || 'publish'),
        postId: p.postId || p.id ? Number(p.postId || p.id) : null,
        permalink: String(p.permalink || p.link || ''),
      }));
  } catch {
    return [];
  }
}

export function filterByYear(posts: WpPost[], yearFrom: number | null, yearTo: number | null): WpPost[] {
  if (!yearFrom && !yearTo) return posts;
  return posts.filter((p) => {
    const d = new Date(p.pubDate);
    const y = Number.isNaN(d.getTime()) ? null : d.getFullYear();
    if (!y) return true;
    if (yearFrom && y < yearFrom) return false;
    if (yearTo && y > yearTo) return false;
    return true;
  });
}

export function mapWpStatus(status: string): string {
  switch (status.toLowerCase()) {
    case 'publish': case 'published': return 'published';
    case 'pending': return 'in_review';
    case 'future': return 'approved';
    case 'private': case 'trash': return 'archived';
    default: return 'draft';
  }
}
