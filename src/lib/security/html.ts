const STRIP_BLOCK_TAGS = [
  'script',
  'style',
  'iframe',
  'frame',
  'frameset',
  'object',
  'embed',
  'applet',
  'meta',
  'base',
  'link',
  'svg',
  'math',
];

function stripBlockTags(html: string) {
  return STRIP_BLOCK_TAGS.reduce((value, tag) => {
    const paired = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
    const selfClosing = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
    return value.replace(paired, '').replace(selfClosing, '');
  }, html);
}

function stripEventHandlers(html: string) {
  return html
    .replace(/\son[a-z0-9_-]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z0-9_-]+\s*=\s*'[^']*'/gi, '')
    .replace(/\son[a-z0-9_-]+\s*=\s*[^\s>]+/gi, '');
}

function stripDangerousAttributes(html: string) {
  return html
    .replace(/\s(?:srcdoc|formaction)\s*=\s*"[^"]*"/gi, '')
    .replace(/\s(?:srcdoc|formaction)\s*=\s*'[^']*'/gi, '')
    .replace(/\s(?:srcdoc|formaction)\s*=\s*[^\s>]+/gi, '');
}

function sanitizeAttributeUrls(html: string) {
  return html.replace(
    /\s(href|src|poster|action|xlink:href)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi,
    (full, attr: string, rawValue: string, doubleQuoted: string, singleQuoted: string, bare: string) => {
      const original = doubleQuoted ?? singleQuoted ?? bare ?? '';
      const sanitized = sanitizeUrlLikeValue(original);
      if (!sanitized) {
        return '';
      }

      const quote = rawValue.startsWith("'") ? "'" : '"';
      return ` ${attr}=${quote}${sanitized}${quote}`;
    }
  );
}

function sanitizeUrlLikeValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed
    .replace(/[\u0000-\u001F\u007F]+/g, '')
    .replace(/\s+/g, '');
  const lower = normalized.toLowerCase();

  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:text/html') ||
    lower.startsWith('data:application/javascript') ||
    lower.startsWith('file:') ||
    lower.startsWith('filesystem:')
  ) {
    return null;
  }

  return trimmed;
}

export function sanitizeHtml(input: string | null | undefined) {
  if (!input) {
    return '';
  }

  let sanitized = String(input);
  sanitized = sanitized.replace(/<!--([\s\S]*?)-->/g, '');
  sanitized = stripBlockTags(sanitized);
  sanitized = stripEventHandlers(sanitized);
  sanitized = stripDangerousAttributes(sanitized);
  sanitized = sanitizeAttributeUrls(sanitized);
  return sanitized;
}

export function sanitizeCss(input: string | null | undefined) {
  if (!input) {
    return '';
  }

  return String(input)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@import[\s\S]*?;/gi, '')
    .replace(/expression\s*\([^)]*\)/gi, '')
    .replace(/behavior\s*:[^;]+;?/gi, '')
    .replace(/-moz-binding\s*:[^;]+;?/gi, '')
    .replace(/url\s*\(\s*(['"]?)(?:javascript:|vbscript:|data:text\/html)[^)]*\1\s*\)/gi, 'none')
    .replace(/[<>]/g, '');
}

export function sanitizeExternalUrl(input: string | null | undefined, allowRelative = false) {
  if (!input) {
    return null;
  }

  const trimmed = String(input).trim();
  if (!trimmed) {
    return null;
  }

  if (allowRelative && trimmed.startsWith('/')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
