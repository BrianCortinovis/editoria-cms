import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;

    if (!pageId) {
      return NextResponse.json(
        { error: 'Page ID is required' },
        { status: 400 }
      );
    }

    // Get format from query params (html, json)
    const format = request.nextUrl.searchParams.get('format') || 'html';

    // Try to fetch page data from builder API
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

    let pageData = null;
    try {
      const pageResponse = await fetch(
        `${apiBase}/api/builder/pages/${pageId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (pageResponse.ok) {
        pageData = await pageResponse.json();
      }
    } catch (err) {
      console.warn('Could not fetch page data from API:', err);
    }

    const blocks = pageData?.blocks || [];
    const meta = pageData?.meta || { title: `Page ${pageId}` };

    if (format === 'json') {
      return NextResponse.json(
        { blocks, meta, exportedAt: new Date().toISOString() },
        {
          headers: {
            'Content-Disposition': `attachment; filename="page-${pageId}.json"`,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (format === 'html') {
      const html = generateHTML(meta, blocks);
      return new NextResponse(html, {
        headers: {
          'Content-Disposition': `attachment; filename="page-${pageId}.html"`,
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid format. Use "json" or "html".' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    );
  }
}

function generateHTML(meta: any, blocks: any[]): string {
  const title = meta?.title || 'Exported Page';
  const description = meta?.description || '';

  const blocksHTML = blocks
    .slice(0, 20)
    .map((block: any) => `
      <div class="block block-${block.type}" data-block-id="${block.id}">
        <h3>${escapeHTML(block.label || block.type)}</h3>
        <p class="block-type">Type: ${escapeHTML(block.type)}</p>
      </div>
    `)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHTML(title)}</title>
    <meta name="description" content="${escapeHTML(description)}">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .block { margin-bottom: 20px; padding: 15px; border-left: 4px solid #007bff; background: #f9f9f9; border-radius: 4px; }
        h1 { font-size: 2.5em; margin-bottom: 10px; color: #222; }
        h3 { font-size: 1.1em; color: #007bff; margin-bottom: 8px; }
        .block-type { font-size: 0.9em; color: #666; margin: 5px 0; }
        footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; color: #999; font-size: 0.9em; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${escapeHTML(title)}</h1>
        ${description ? `<p style="font-size: 1.1em; color: #666; margin-bottom: 20px;">${escapeHTML(description)}</p>` : ''}

        ${blocks.length > 0 ? `
          <div style="margin: 30px 0;">
            <h2 style="font-size: 1.5em; margin-bottom: 15px; color: #333;">Blocchi (${blocks.length})</h2>
            ${blocksHTML}
            ${blocks.length > 20 ? `<p style="color: #999; text-align: center; margin-top: 20px;">... e altri ${blocks.length - 20} blocchi</p>` : ''}
          </div>
        ` : '<p style="color: #999;">Nessun blocco in questa pagina</p>'}

        <footer>
            <p>📄 Exported from <strong>Editoria CMS</strong></p>
            <p>Generated on ${new Date().toLocaleString('it-IT')}</p>
        </footer>
    </div>
</body>
</html>`;
}

function escapeHTML(text: string | null | undefined): string {
  if (!text) return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  // POST and GET do the same thing for export
  return GET(request, { params });
}
