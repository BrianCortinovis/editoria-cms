import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fieldName, fieldType, currentValue, style } = body;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
    }

    const prompt = `Genera contenuto per il campo "${fieldName}" di tipo "${fieldType}":
${currentValue ? `Contenuto attuale: ${currentValue}` : ''}

${style === 'journalist' ? 'Scrivi nello stile di un giornalista professionista.' : ''}
${style === 'publication' ? 'Scrivi nello stile editoriale della rivista.' : ''}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.error?.message || 'API error' }, { status: 500 });
    }

    const data = await response.json();
    const result = data.content[0].text;

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
