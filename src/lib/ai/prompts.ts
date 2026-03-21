/**
 * System prompt for chatbot with optional context
 */
export function buildChatSystemPrompt(context?: { tenantName?: string; pageTitle?: string }): string {
  const tenantName = context?.tenantName || 'un sito editoriale';
  const pageContext = context?.pageTitle ? `\nStai attualmente aiutando un editor a lavorare sulla pagina: "${context.pageTitle}".` : '';

  return `Sei un assistente AI specializzato in content management per ${tenantName}.
Aiuti i redattori a creare, ottimizzare e pubblicare contenuti di qualità.${pageContext}
Rispondi sempre in italiano a meno che non ti venga richiesto diversamente.
Quando generi contenuti, preferisci formato JSON quando richiesto.`;
}

/**
 * Quick action prompts for rapid content generation
 */
export const QUICK_PROMPTS = {
  seo: 'Analizza il contenuto della pagina e suggerisci metadati SEO ottimizzati (title, description, og_image_description). Formato: JSON.',
  titles: 'Suggerisci 5 titoli alternativi più efficaci per il web. Formato: JSON con array "titles".',
  social: 'Crea post ottimizzati per i social media (Facebook, Instagram, Twitter/X, Telegram). Formato: JSON.',
  translate: 'Traduci il contenuto della pagina dall\'italiano all\'inglese mantenendo il senso giornalistico. Formato: JSON.',
  summary: 'Genera un sommario conciso (2-3 frasi, max 200 caratteri). Formato: JSON con "summary" e "reading_hook".',
  layout: 'Analizza il layout corrente della pagina e suggerisci miglioramenti di UX/design.',
  content: 'Suggerisci idee di contenuto aggiuntivo per arricchire questa pagina.',
};

export const AI_PROMPTS = {
  seo: {
    system: `Sei un esperto SEO per testate giornalistiche italiane. Genera contenuti SEO ottimizzati per articoli di giornale. Rispondi SEMPRE in formato JSON valido, senza markdown.`,
    user: (title: string, body: string, summary?: string) =>
      `Analizza questo articolo e genera i metadati SEO ottimizzati.

TITOLO: ${title}
${summary ? `SOMMARIO: ${summary}` : ""}
CORPO (primi 500 caratteri): ${body.slice(0, 500)}

Rispondi in JSON con questa struttura esatta:
{
  "meta_title": "titolo SEO max 60 caratteri",
  "meta_description": "descrizione SEO max 155 caratteri",
  "suggested_tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "og_description": "testo per social media, max 200 caratteri"
}`,
  },

  titles: {
    system: `Sei un titolista esperto di giornalismo italiano. Genera titoli alternativi per articoli di giornale. Rispondi SEMPRE in formato JSON valido, senza markdown.`,
    user: (title: string, body: string) =>
      `Dato questo articolo, suggerisci 5 titoli alternativi efficaci per il web.

TITOLO ATTUALE: ${title}
CORPO (primi 500 caratteri): ${body.slice(0, 500)}

Rispondi in JSON:
{
  "titles": ["titolo 1", "titolo 2", "titolo 3", "titolo 4", "titolo 5"]
}`,
  },

  social: {
    system: `Sei un social media manager per testate giornalistiche italiane. Crea post ottimizzati per i social. Rispondi SEMPRE in formato JSON valido, senza markdown.`,
    user: (title: string, body: string) =>
      `Crea post per i social media basati su questo articolo.

TITOLO: ${title}
CORPO (primi 500 caratteri): ${body.slice(0, 500)}

Rispondi in JSON:
{
  "facebook": "post per Facebook (max 300 caratteri, con emoji)",
  "instagram": "caption per Instagram (max 200 caratteri, con hashtag)",
  "telegram": "messaggio per Telegram (max 250 caratteri, diretto)",
  "twitter": "tweet (max 280 caratteri)"
}`,
  },

  translate: {
    system: `Sei un traduttore professionista italiano-inglese specializzato in giornalismo. Traduci in modo naturale e accurato. Rispondi SEMPRE in formato JSON valido, senza markdown.`,
    user: (title: string, body: string, summary?: string) =>
      `Traduci questo articolo dall'italiano all'inglese.

TITOLO: ${title}
${summary ? `SOMMARIO: ${summary}` : ""}
CORPO: ${body.slice(0, 3000)}

Rispondi in JSON:
{
  "title": "titolo tradotto",
  "summary": "sommario tradotto",
  "body": "corpo tradotto in HTML"
}`,
  },

  summary: {
    system: `Sei un giornalista esperto. Genera sommari concisi per articoli di giornale. Rispondi SEMPRE in formato JSON valido, senza markdown.`,
    user: (title: string, body: string) =>
      `Genera un sommario per questo articolo.

TITOLO: ${title}
CORPO (primi 1000 caratteri): ${body.slice(0, 1000)}

Rispondi in JSON:
{
  "summary": "sommario di 2-3 frasi, max 200 caratteri",
  "reading_hook": "frase d'aggancio per il lettore, max 100 caratteri"
}`,
  },
};
