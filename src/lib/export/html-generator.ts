import type { Block, DividerConfig } from '@/lib/types';
import { generateDividerSvg } from '@/lib/shapes/dividers';
import { buildAnimatedGradientKeyframes } from '@/lib/shapes/gradients';

export function generateFullHtml(
  blocks: Block[],
  options: {
    title?: string;
    description?: string;
    language?: string;
    customHead?: string;
    customCss?: string;
    customJs?: string;
  } = {}
): string {
  const css = generateCssFromBlocks(blocks);
  const animationKeyframes = generateAnimationKeyframes(blocks);
  const html = blocks.map((b) => blockToHtml(b)).join('\n');

  return `<!DOCTYPE html>
<html lang="${options.language || 'it'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title || 'Sito Generato'}</title>
  ${options.description ? `<meta name="description" content="${escapeHtml(options.description)}">` : ''}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, system-ui, -apple-system, sans-serif; line-height: 1.5; color: #333; }
    img { max-width: 100%; height: auto; display: block; }
    a { color: inherit; text-decoration: none; }

${css}

${animationKeyframes}

    /* Responsive */
    @media (max-width: 768px) {
      .sb-columns { flex-direction: column !important; }
      .sb-columns > * { width: 100% !important; }
      .sb-hero { min-height: 400px !important; padding: 60px 20px !important; }
      .sb-hero h1 { font-size: 2rem !important; }
      .sb-counter-grid { flex-direction: column !important; gap: 24px !important; }
      .sb-nav { flex-wrap: wrap; }
      .sb-nav-links { display: none; }
      .sb-gallery-grid { grid-template-columns: 1fr !important; }
      .sb-footer-grid { grid-template-columns: 1fr !important; }
    }

${options.customCss || ''}
  </style>
  ${options.customHead || ''}
</head>
<body>
${html}
<script>
// Animation Runtime
(function() {
  function initializeAnimations() {
    const entranceElements = document.querySelectorAll('[data-animate="entrance"]');
    entranceElements.forEach(el => {
      const effect = el.getAttribute('data-effect') || 'fade-in';
      const duration = parseInt(el.getAttribute('data-duration') || '600');
      const delay = parseInt(el.getAttribute('data-delay') || '0');
      const easing = el.getAttribute('data-easing') || 'ease-out';
      setTimeout(() => {
        el.style.animation = effect + ' ' + duration + 'ms ' + easing + ' forwards';
      }, delay);
    });

    const scrollElements = document.querySelectorAll('[data-animate="scroll"]');
    const observerOptions = { threshold: 0.5, rootMargin: '0px' };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const effect = entry.target.getAttribute('data-effect') || 'fade-in';
          const duration = parseInt(entry.target.getAttribute('data-duration') || '600');
          const delay = parseInt(entry.target.getAttribute('data-delay') || '0');
          const easing = entry.target.getAttribute('data-easing') || 'ease-out';
          setTimeout(() => {
            entry.target.style.animation = effect + ' ' + duration + 'ms ' + easing + ' forwards';
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
    scrollElements.forEach(el => observer.observe(el));

    const hoverElements = document.querySelectorAll('[data-animate="hover"]');
    hoverElements.forEach(el => {
      const effect = el.getAttribute('data-effect') || 'zoom-in';
      const duration = parseInt(el.getAttribute('data-duration') || '300');
      const easing = el.getAttribute('data-easing') || 'ease-out';
      el.addEventListener('mouseenter', () => {
        el.style.animation = effect + ' ' + duration + 'ms ' + easing + ' forwards';
      });
      el.addEventListener('mouseleave', () => {
        el.style.animation = 'none';
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAnimations);
  } else {
    initializeAnimations();
  }
})();
</script>
${options.customJs ? `<script>\n${options.customJs}\n</script>` : ''}
</body>
</html>`;
}

function generateAnimationKeyframes(blocks: Block[]): string {
  let keyframes = '';
  const processBlock = (block: Block) => {
    // Handle animated gradients
    if (block.style.background.advancedGradient?.animated) {
      keyframes += buildAnimatedGradientKeyframes(block.id, block.style.background.advancedGradient);
      keyframes += '\n\n';
    }
    // Recurse into children
    if (block.children.length > 0) {
      for (const child of block.children) {
        processBlock(child);
      }
    }
  };
  for (const block of blocks) {
    processBlock(block);
  }
  return keyframes ? `    /* Animation Keyframes */\n${keyframes}` : '';
}

function generateCssFromBlocks(blocks: Block[]): string {
  let css = '';
  for (const block of blocks) {
    css += blockToCss(block);
    if (block.children.length > 0) {
      css += generateCssFromBlocks(block.children);
    }
  }
  return css;
}

function blockToCss(block: Block): string {
  const s = block.style;
  const id = `sb-${block.id}`;
  let css = `    .${id} {\n`;

  // Layout
  if (s.layout.display) css += `      display: ${s.layout.display};\n`;
  if (s.layout.flexDirection) css += `      flex-direction: ${s.layout.flexDirection};\n`;
  if (s.layout.justifyContent) css += `      justify-content: ${s.layout.justifyContent};\n`;
  if (s.layout.alignItems) css += `      align-items: ${s.layout.alignItems};\n`;
  if (s.layout.gap) css += `      gap: ${s.layout.gap};\n`;
  css += `      padding: ${s.layout.padding.top} ${s.layout.padding.right} ${s.layout.padding.bottom} ${s.layout.padding.left};\n`;
  css += `      margin: ${s.layout.margin.top} ${s.layout.margin.right} ${s.layout.margin.bottom} ${s.layout.margin.left};\n`;
  if (s.layout.width) css += `      width: ${s.layout.width};\n`;
  if (s.layout.maxWidth) css += `      max-width: ${s.layout.maxWidth};\n`;
  if (s.layout.minHeight) css += `      min-height: ${s.layout.minHeight};\n`;
  if (s.layout.overflow) css += `      overflow: ${s.layout.overflow};\n`;
  if (s.layout.position) css += `      position: ${s.layout.position};\n`;
  if (s.layout.zIndex) css += `      z-index: ${s.layout.zIndex};\n`;

  // Background
  if (s.background.type === 'color' && s.background.value) {
    css += `      background-color: ${s.background.value};\n`;
  } else if (s.background.type === 'gradient' && s.background.value) {
    css += `      background: ${s.background.value};\n`;
  } else if (s.background.type === 'image' && s.background.value) {
    css += `      background-image: url(${s.background.value});\n`;
    css += `      background-size: ${s.background.size || 'cover'};\n`;
    css += `      background-position: ${s.background.position || 'center'};\n`;
    css += `      background-repeat: ${s.background.repeat || 'no-repeat'};\n`;
    if (s.background.parallax) css += `      background-attachment: fixed;\n`;
  }

  // Typography
  if (s.typography.fontFamily) css += `      font-family: ${s.typography.fontFamily};\n`;
  if (s.typography.fontSize) css += `      font-size: ${s.typography.fontSize};\n`;
  if (s.typography.fontWeight) css += `      font-weight: ${s.typography.fontWeight};\n`;
  if (s.typography.lineHeight) css += `      line-height: ${s.typography.lineHeight};\n`;
  if (s.typography.letterSpacing) css += `      letter-spacing: ${s.typography.letterSpacing};\n`;
  if (s.typography.color) css += `      color: ${s.typography.color};\n`;
  if (s.typography.textAlign) css += `      text-align: ${s.typography.textAlign};\n`;
  if (s.typography.textTransform) css += `      text-transform: ${s.typography.textTransform};\n`;

  // Border
  if (s.border.width) css += `      border-width: ${s.border.width};\n`;
  if (s.border.style) css += `      border-style: ${s.border.style};\n`;
  if (s.border.color) css += `      border-color: ${s.border.color};\n`;
  if (s.border.radius) css += `      border-radius: ${s.border.radius};\n`;

  // Effects
  if (s.shadow) css += `      box-shadow: ${s.shadow};\n`;
  if (s.opacity !== undefined && s.opacity !== 1) css += `      opacity: ${s.opacity};\n`;
  if (s.transform) css += `      transform: ${s.transform};\n`;
  if (s.transition) css += `      transition: ${s.transition};\n`;
  if (s.filter) css += `      filter: ${s.filter};\n`;
  if (s.backdropFilter) {
    css += `      backdrop-filter: ${s.backdropFilter};\n`;
    css += `      -webkit-backdrop-filter: ${s.backdropFilter};\n`;
  }
  if (s.mixBlendMode && s.mixBlendMode !== 'normal') css += `      mix-blend-mode: ${s.mixBlendMode};\n`;
  if (s.textShadow) css += `      text-shadow: ${s.textShadow};\n`;

  // Clip path
  if (block.shape?.type === 'clip-path' && block.shape.value && block.shape.value !== 'none') {
    css += `      clip-path: ${block.shape.value};\n`;
    css += `      -webkit-clip-path: ${block.shape.value};\n`;
    css += `      overflow: hidden;\n`;
  }

  // Custom CSS
  if (s.customCss) {
    const lines = s.customCss.split('\n').filter((l) => l.trim() && !l.trim().startsWith('/*'));
    for (const line of lines) {
      css += `      ${line.trim()}\n`;
    }
  }

  css += `    }\n\n`;
  return css;
}

function getAnimationDataAttributes(block: Block): string {
  if (!block.animation) return '';
  const anim = block.animation;
  return ` data-animate="${anim.trigger}" data-effect="${anim.effect}" data-duration="${anim.duration}" data-delay="${anim.delay}" data-easing="${anim.easing}"`;
}

function blockToHtml(block: Block): string {
  if (block.hidden) return '';

  const cls = `sb-${block.id}`;
  const animAttrs = getAnimationDataAttributes(block);
  let html = '';

  // Top divider
  if (block.shape?.topDivider) {
    html += dividerToHtml(block.shape.topDivider);
  }

  switch (block.type) {
    case 'hero':
      html += heroToHtml(block, cls);
      break;
    case 'text':
      html += textToHtml(block, cls);
      break;
    case 'navigation':
      html += navToHtml(block, cls);
      break;
    case 'footer':
      html += footerToHtml(block, cls);
      break;
    case 'divider':
      html += dividerBlockToHtml(block);
      break;
    case 'banner-ad':
      html += bannerToHtml(block, cls);
      break;
    case 'quote':
      html += quoteToHtml(block, cls);
      break;
    case 'newsletter':
      html += newsletterToHtml(block, cls);
      break;
    case 'counter':
      html += counterToHtml(block, cls);
      break;
    case 'image-gallery':
      html += galleryToHtml(block, cls);
      break;
    case 'video':
      html += videoToHtml(block, cls);
      break;
    case 'section':
    case 'container':
    case 'columns':
      html += containerToHtml(block, cls);
      break;
    case 'custom-html':
      html += customHtmlToHtml(block, cls);
      break;
    default:
      html += `  <div class="${cls}"${animAttrs}>${escapeHtml(block.label || block.type)}</div>\n`;
  }

  // Inject animation attributes into first opening tag if not already present
  if (animAttrs && html && !html.includes('data-animate=')) {
    const tagMatch = html.match(/(<[a-z]+[^>]*?>)/i);
    if (tagMatch) {
      html = html.replace(tagMatch[0], tagMatch[0].slice(0, -1) + animAttrs + '>');
    }
  }

  // Bottom divider
  if (block.shape?.bottomDivider) {
    html += dividerToHtml(block.shape.bottomDivider);
  }

  return html;
}

function heroToHtml(block: Block, cls: string): string {
  const p = block.props as Record<string, unknown>;
  const tag = (p.titleTag as string) || 'h1';
  let inner = '';
  if (p.overlayColor) {
    inner += `    <div style="position:absolute;inset:0;background-color:${p.overlayColor};opacity:${p.overlayOpacity || 0.5}"></div>\n`;
  }
  inner += `    <div style="position:relative;z-index:1">\n`;
  inner += `      <${tag}>${escapeHtml(String(p.title || ''))}</${tag}>\n`;
  if (p.subtitle) inner += `      <p>${escapeHtml(String(p.subtitle))}</p>\n`;
  if (p.ctaText) inner += `      <a href="${escapeHtml(String(p.ctaUrl || '#'))}" class="sb-cta">${escapeHtml(String(p.ctaText))}</a>\n`;
  inner += `    </div>\n`;
  return `  <section class="${cls} sb-hero" style="position:relative">\n${inner}  </section>\n`;
}

function textToHtml(block: Block, cls: string): string {
  const p = block.props as { content: string };
  return `  <div class="${cls}">\n    ${p.content || ''}\n  </div>\n`;
}

function navToHtml(block: Block, cls: string): string {
  const p = block.props as { logo: { value: string }; items: { label: string; url: string }[] };
  const links = (p.items || []).map((item) => `      <a href="${escapeHtml(item.url)}">${escapeHtml(item.label)}</a>`).join('\n');
  return `  <nav class="${cls} sb-nav">\n    <div class="sb-nav-logo">${escapeHtml(p.logo?.value || 'Logo')}</div>\n    <div class="sb-nav-links">\n${links}\n    </div>\n  </nav>\n`;
}

function footerToHtml(block: Block, cls: string): string {
  const p = block.props as { columns: { title: string }[]; copyright: string };
  const cols = (p.columns || []).map((col) => `      <div><h4>${escapeHtml(col.title)}</h4></div>`).join('\n');
  return `  <footer class="${cls}">\n    <div class="sb-footer-grid" style="display:grid;grid-template-columns:repeat(${p.columns?.length || 3},1fr);gap:32px">\n${cols}\n    </div>\n    <div style="text-align:center;margin-top:24px;opacity:0.5">${escapeHtml(p.copyright || '')}</div>\n  </footer>\n`;
}

function dividerBlockToHtml(block: Block): string {
  const p = block.props as { shape: string; height: number; color: string; flip: boolean; invert: boolean };
  return generateDividerSvg(p.shape as 'wave', 1440, p.height || 80, p.color || '#fff', p.flip, p.invert) + '\n';
}

function dividerToHtml(config: DividerConfig): string {
  return generateDividerSvg(config.shape, 1440, config.height, config.color, config.flip, config.invert) + '\n';
}

function bannerToHtml(block: Block, cls: string): string {
  const p = block.props as { format: string; width: number; height: number; adCode: string; label: string; showLabel: boolean };
  if (p.adCode) {
    return `  <div class="${cls}" style="text-align:center">\n    ${p.showLabel ? `<small>${escapeHtml(p.label || 'ADV')}</small>` : ''}\n    ${p.adCode}\n  </div>\n`;
  }
  return `  <div class="${cls}" style="text-align:center">\n    ${p.showLabel ? `<small>${escapeHtml(p.label || 'ADV')}</small>` : ''}\n    <div style="width:${p.width}px;height:${p.height}px;background:#eee;display:inline-flex;align-items:center;justify-content:center;max-width:100%">${p.format}</div>\n  </div>\n`;
}

function quoteToHtml(block: Block, cls: string): string {
  const p = block.props as { text: string; author: string; source: string };
  return `  <blockquote class="${cls}">\n    <p>&ldquo;${escapeHtml(p.text || '')}&rdquo;</p>\n    ${p.author ? `<cite>— ${escapeHtml(p.author)}${p.source ? `, ${escapeHtml(p.source)}` : ''}</cite>` : ''}\n  </blockquote>\n`;
}

function newsletterToHtml(block: Block, cls: string): string {
  const p = block.props as { title: string; description: string; placeholder: string; buttonText: string; formAction: string };
  return `  <section class="${cls}">\n    <h3>${escapeHtml(p.title || '')}</h3>\n    <p>${escapeHtml(p.description || '')}</p>\n    <form${p.formAction ? ` action="${escapeHtml(p.formAction)}"` : ''} style="display:flex;gap:8px;max-width:400px;margin:16px auto 0">\n      <input type="email" placeholder="${escapeHtml(p.placeholder || 'Email')}" required style="flex:1;padding:8px 16px;border-radius:8px;border:1px solid #ddd">\n      <button type="submit" style="padding:8px 24px;background:#3b82f6;color:#fff;border:none;border-radius:8px;cursor:pointer">${escapeHtml(p.buttonText || 'Iscriviti')}</button>\n    </form>\n  </section>\n`;
}

function counterToHtml(block: Block, cls: string): string {
  const p = block.props as { counters: { value: number; label: string; prefix: string; suffix: string }[] };
  const items = (p.counters || []).map((c) => `      <div style="text-align:center"><div style="font-size:2.5rem;font-weight:700">${c.prefix || ''}${c.value}${c.suffix || ''}</div><div style="opacity:0.7;margin-top:4px">${escapeHtml(c.label)}</div></div>`).join('\n');
  return `  <section class="${cls}">\n    <div class="sb-counter-grid" style="display:flex;justify-content:center;gap:48px;flex-wrap:wrap">\n${items}\n    </div>\n  </section>\n`;
}

function galleryToHtml(block: Block, cls: string): string {
  const p = block.props as { images: { src: string; alt: string; caption: string }[]; columns: number; gap: string };
  const items = (p.images || []).map((img) => {
    const src = img.src || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" fill="%23ddd"%3E%3Crect width="400" height="300"/%3E%3C/svg%3E';
    return `      <figure><img src="${src}" alt="${escapeHtml(img.alt || '')}" style="width:100%;border-radius:8px">${img.caption ? `<figcaption style="text-align:center;font-size:0.875rem;color:#666;margin-top:8px">${escapeHtml(img.caption)}</figcaption>` : ''}</figure>`;
  }).join('\n');
  return `  <div class="${cls}">\n    <div class="sb-gallery-grid" style="display:grid;grid-template-columns:repeat(${p.columns || 3},1fr);gap:${p.gap || '16px'}">\n${items}\n    </div>\n  </div>\n`;
}

function videoToHtml(block: Block, cls: string): string {
  const p = block.props as { url: string; source: string; videoId: string; autoplay: boolean; controls: boolean };
  if (p.source === 'youtube' && p.videoId) {
    return `  <div class="${cls}"><div style="position:relative;padding-bottom:56.25%;height:0"><iframe src="https://www.youtube.com/embed/${escapeHtml(p.videoId)}${p.autoplay ? '?autoplay=1' : ''}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allowfullscreen></iframe></div></div>\n`;
  }
  if (p.url) {
    return `  <div class="${cls}"><video src="${escapeHtml(p.url)}"${p.controls ? ' controls' : ''}${p.autoplay ? ' autoplay muted' : ''} style="width:100%;border-radius:8px"></video></div>\n`;
  }
  return `  <div class="${cls}"><div style="aspect-ratio:16/9;background:#111;display:flex;align-items:center;justify-content:center;color:#666;border-radius:8px">Video</div></div>\n`;
}

function containerToHtml(block: Block, cls: string): string {
  const tag = block.type === 'section' ? 'section' : 'div';
  const extraCls = block.type === 'columns' ? ` sb-columns` : '';
  const children = block.children.map((child) => blockToHtml(child)).join('');
  return `  <${tag} class="${cls}${extraCls}">\n${children}  </${tag}>\n`;
}

function customHtmlToHtml(block: Block, cls: string): string {
  const p = block.props as { html: string; css: string; js: string };
  let output = `  <div class="${cls}">\n    ${p.html || ''}\n  </div>\n`;
  if (p.css) output += `  <style>${p.css}</style>\n`;
  if (p.js) output += `  <script>${p.js}</script>\n`;
  return output;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
