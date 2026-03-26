const GENERIC_EDITOR_ACTIONS = new Set([
  'add-block',
  'remove-block',
  'duplicate-block',
  'update-block-props',
  'update-block-style',
  'update-block-shape',
  'move-block',
  'rename-block',
  'toggle-visibility',
  'toggle-lock',
  'clear-all',
  'select-block',
  'set-theme',
  'set-device',
  'set-zoom',
  'toggle-grid',
  'toggle-outlines',
  'open-panel',
  'convert-block',
  'undo',
  'redo',
  'message',
]);

function parseAiResponse(content) {
  const normalizeCandidate = (raw) => raw
    .trim()
    .replace(/^```(?:json|javascript|js)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u00A0/g, ' ');

  const stripComments = (raw) => {
    let output = '';
    let inString = false;
    let stringQuote = '';
    let escaped = false;

    for (let index = 0; index < raw.length; index += 1) {
      const current = raw[index];
      const next = raw[index + 1];

      if (inString) {
        output += current;
        if (escaped) escaped = false;
        else if (current === '\\') escaped = true;
        else if (current === stringQuote) {
          inString = false;
          stringQuote = '';
        }
        continue;
      }

      if (current === '"' || current === "'") {
        inString = true;
        stringQuote = current;
        output += current;
        continue;
      }

      if (current === '/' && next === '/') {
        index += 2;
        while (index < raw.length) {
          const lookahead = raw.slice(index);
          if (
            raw[index] === '\n'
            || raw[index] === '\r'
            || /^(\s*,?\s*"[^"]+"\s*:)/.test(lookahead)
            || /^(\s*[}\]])/.test(lookahead)
          ) {
            index -= 1;
            break;
          }
          index += 1;
        }
        continue;
      }

      if (current === '/' && next === '*') {
        index += 2;
        while (index < raw.length && !(raw[index] === '*' && raw[index + 1] === '/')) {
          index += 1;
        }
        index += 1;
        continue;
      }

      output += current;
    }

    return output;
  };

  const stripTrailingCommas = (raw) => raw.replace(/,\s*([}\]])/g, '$1');

  const extractJsonCandidate = (raw) => {
    const start = raw.search(/[[{]/);
    if (start < 0) return null;

    const open = raw[start];
    const close = open === '[' ? ']' : '}';
    let depth = 0;
    let inString = false;
    let stringQuote = '';
    let escaped = false;

    for (let index = start; index < raw.length; index += 1) {
      const current = raw[index];

      if (inString) {
        if (escaped) escaped = false;
        else if (current === '\\') escaped = true;
        else if (current === stringQuote) {
          inString = false;
          stringQuote = '';
        }
        continue;
      }

      if (current === '"' || current === "'") {
        inString = true;
        stringQuote = current;
        continue;
      }

      if (current === open) depth += 1;
      if (current === close) depth -= 1;

      if (depth === 0) {
        return raw.slice(start, index + 1);
      }
    }

    return raw.slice(start);
  };

  const asActions = (parsed) => {
    if (Array.isArray(parsed)) {
      const filtered = parsed.filter((item) =>
        Boolean(item && typeof item === 'object' && 'action' in item && GENERIC_EDITOR_ACTIONS.has(String(item.action)))
      );
      return filtered.length > 0 ? filtered : null;
    }

    if (
      parsed
      && typeof parsed === 'object'
      && 'action' in parsed
      && GENERIC_EDITOR_ACTIONS.has(String(parsed.action))
    ) {
      return [parsed];
    }

    return null;
  };

  const tryParse = (raw) => {
    const normalized = stripTrailingCommas(stripComments(normalizeCandidate(raw)));
    try {
      return { actions: asActions(JSON.parse(normalized)), normalized };
    } catch (error) {
      return { error: error.message, normalized };
    }
  };

  const direct = tryParse(content);
  if (direct.actions) return { source: 'direct', ...direct };

  const candidate = extractJsonCandidate(normalizeCandidate(content));
  if (!candidate) return { source: 'none', actions: null, direct };

  const extracted = tryParse(candidate);
  if (extracted.actions) return { source: 'extracted', ...extracted };

  return {
    source: 'failed',
    actions: null,
    direct,
    extracted,
  };
}

const sample = `[ { "action": "add-block", "blockType": "navigation", "label": "Header testata", "props": { "ctaUrl": "/abbonati", "ctaText": "Abbonati", "itemGap": 18, "layout": "horizontal", "sticky": false }, "style": {} }, { "action": "add-block", "blockType": "section", "label": "Pacchetto principale", "props": { "fullWidth": true }, "style": {}, "children": [ { "action": "add-block", "blockType": "columns", "label": "Griglia homepage 24-52-24", "props": { "columnCount": 3, "gap": "28px", "stackOnMobile": true }, "children": [ { "action": "add-block", "blockType": "article-grid", "label": "Colonna sinistra", "props": { "columns": 1, "limit": 4 } }, { "action": "add-block", "blockType": "article-hero", "label": "Notizia centrale" }, { "action": "add-block", "blockType": "article-grid", "label": "Colonna destra", "props": { "columns": 1, "limit": 4 } } ] } ] }, { "action": "add-block", "blockType": "section", "label": "Fascia TG", "props": { "fullWidth": true }, "style": {}, "children": [ { "action": "add-block", "blockType": "text", "label": "Titolo TG", "props": { "columns": 1, "content": "<div><div style=\\"font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#64748b;margin-bottom:8px\\">Video redazione</div><h2 style=\\"font-size:42px;line-height:1.05;letter-spacing:-.03em;margin:0\\">TG ORE 20</h2></div>" }, "style": {} }, { "action": "add-block", "blockType": "video", "label": "TG ORE 20", "props": { "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "TG ORE 20", "source": "youtube", "caption": "Edizione serale della testata", "aspectRatio": "16/9" }, "style": {} } ] }, { "action": "add-block", "blockType": "section", "label": "Slideshow articoli", "props": { "fullWidth": true }, "style": {}, "children": [ { "action": "add-block", "blockType": "slideshow", "label": "Articoli in evidenza", "props": { "items": [] }, // Aggiungere qui gli articoli dello slideshow "style": {} } ] }, { "action": "add-block", "blockType": "section", "label": "Editoriali finali", "props": { "fullWidth": true }, "style": {}, "children": [ { "action": "add-block", "blockType": "columns", "label": "Editoriali finali", "props": { "columnCount": 2, "gap": "28px", "stackOnMobile": true }, "children": [ { "action": "add-block", "blockType": "text", "label": "Editoriale 1", "props": { "columns": 1, "content": "<div style=\\"border-top:1px solid #cbd5e1;padding-top:14px\\"><div style=\\"font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#64748b;margin-bottom:10px\\">Analisi</div><h3 style=\\"font-size:34px;line-height:1.08;margin:0 0 12px 0\\">Territorio e innovazione</h3><p style=\\"font-size:17px;line-height:1.6;color:#475569;margin:0\\">Una sezione editoriale costruita per testare la resa dei blocchi di testo su più colonne.</p></div>" }, "style": {} }, { "action": "add-block", "blockType": "text", "label": "Editoriale 2", "props": { "columns": 1, "content": "<div style=\\"border-top:1px solid #cbd5e1;padding-top:14px\\"><div style=\\"font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#64748b;margin-bottom:10px\\">Commento</div><h3 style=\\"font-size:34px;line-height:1.08;margin:0 0 12px 0\\">Redazione digitale</h3><p style=\\"font-size:17px;line-height:1.6;color:#475569;margin:0\\">L'obiettivo di questo test è verificare un homepage newspaper-like con blocchi veri del CMS.</p></div>" }, "style": {} } ] } ] } ]`;

const result = parseAiResponse(sample);

console.log(JSON.stringify({
  source: result.source,
  count: result.actions?.length || 0,
  labels: result.actions?.map((entry) => entry.label) || [],
  directError: result.direct?.error || null,
  extractedError: result.extracted?.error || null,
}, null, 2));
