import { z } from 'zod';

const GATEWAY = 'https://ai.gateway.lovable.dev/v1';

export const conceptSchema = z.object({
  name: z.string().min(1).max(160),
  tagline: z.string().max(160).optional(),
  style: z.string().max(80),
  symbols: z.string().max(300).optional(),
  colors: z.string().max(200).optional(),
  count: z.number().int().min(1).max(3).default(2),
});

export const analyzeSchema = z.object({
  imageBase64: z.string().min(32).max(6_000_000),
  mimeType: z.string().max(60).default('image/png'),
  name: z.string().max(160).optional(),
});

function apiKey() {
  const key = process.env['LOVABLE_API_KEY'];
  if (!key) throw new Error('AI brand studio is not configured.');
  return key;
}

export async function generateLogoConcepts(input: z.infer<typeof conceptSchema>) {
  const data = conceptSchema.parse(input);
  const prompt = [
    `Design a professional worship-ministry logo for "${data.name}".`,
    data.tagline ? `Tagline: ${data.tagline}` : '',
    `Style direction: ${data.style}.`,
    data.symbols ? `Preferred symbols/themes: ${data.symbols}.` : '',
    data.colors ? `Preferred colors: ${data.colors}.` : '',
    'Vector-like flat emblem, crisp clean edges, centered composition, generous padding,',
    'solid white background, high contrast, legible when scaled down to 32 pixels,',
    'no photographic textures, no drop shadows, no mockups, no watermarks.',
  ].filter(Boolean).join('\n');

  const results: Array<{ url?: string | undefined; base64?: string | undefined }> = [];
  for (let i = 0; i < data.count; i += 1) {
    const response = await fetch(`${GATEWAY}/images/generations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        prompt: i === 0 ? prompt : `${prompt}\nOffer a distinctly different composition than typical variants.`,
        n: 1,
        size: '1024x1024',
      }),
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `AI generation failed (${response.status}).`);
    }
    const body = (await response.json()) as { data?: Array<{ url?: string; b64_json?: string }> };
    const image = body.data?.[0];
    if (image?.url || image?.b64_json) results.push({ url: image.url, base64: image.b64_json });
  }
  if (!results.length) throw new Error('AI returned no logo concepts.');
  return { concepts: results };
}

export async function analyzeLogo(input: z.infer<typeof analyzeSchema>) {
  const data = analyzeSchema.parse(input);
  const response = await fetch(`${GATEWAY}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content:
            'You are a brand designer reviewing a worship ministry logo. Reply in short markdown sections: Assessment, Improvements, Small-size readability, Color harmony, Typography pairing. Be concrete and concise.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: `Review this logo${data.name ? ` for "${data.name}"` : ''}.` },
            { type: 'image_url', image_url: { url: `data:${data.mimeType};base64,${data.imageBase64}` } },
          ],
        },
      ],
    }),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `AI analysis failed (${response.status}).`);
  }
  const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const review = body.choices?.[0]?.message?.content?.trim();
  if (!review) throw new Error('AI returned no review.');
  return { review };
}
