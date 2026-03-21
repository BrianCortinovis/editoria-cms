import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fieldName, fieldType, currentValue, style, aiProvider = 'openai' } = body;

    const prompt = `Genera contenuto per il campo "${fieldName}" di tipo "${fieldType}":
${currentValue ? `Contenuto attuale: ${currentValue}` : ''}

${style === 'journalist' ? 'Scrivi nello stile di un giornalista professionista.' : ''}
${style === 'publication' ? 'Scrivi nello stile editoriale della rivista.' : ''}`;

    let result: string;

    // OpenAI (GPT)
    if (aiProvider === 'openai' || aiProvider === 'default') {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: 'OpenAI not configured' }, { status: 500 });
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return NextResponse.json({ error: error.error?.message || 'OpenAI error' }, { status: 500 });
      }

      const data = await response.json();
      result = data.choices[0].message.content;
    }
    // Google Gemini
    else if (aiProvider === 'gemini') {
      const apiKey = process.env.GOOGLE_AI_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: 'Google AI not configured' }, { status: 500 });
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return NextResponse.json({ error: 'Gemini error' }, { status: 500 });
      }

      const data = await response.json();
      result = data.candidates[0].content.parts[0].text;
    }
    // Anthropic Claude
    else if (aiProvider === 'anthropic') {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: 'Anthropic not configured' }, { status: 500 });
      }

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
        return NextResponse.json({ error: 'Anthropic error' }, { status: 500 });
      }

      const data = await response.json();
      result = data.content[0].text;
    } else {
      return NextResponse.json({ error: 'Unknown AI provider' }, { status: 400 });
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
