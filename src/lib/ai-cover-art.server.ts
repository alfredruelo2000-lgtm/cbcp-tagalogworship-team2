import { z } from 'zod';

const requestSchema = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().max(200).optional(),
  songwriter: z.string().max(200).optional(),
  language: z.string().max(80).optional(),
  themes: z.array(z.string().max(80)).max(20).optional(),
  scripture: z.string().max(300).optional(),
  mood: z.string().max(80),
  style: z.string().max(100),
  direction: z.string().max(500).optional(),
});

export async function generateCoverArt(input: z.infer<typeof requestSchema>) {
  const data = requestSchema.parse(input);
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new Error('AI cover generation is not configured.');

  const prompt = [
    'Create an original 1:1 square worship song cover artwork.',
    'Do not include text, logos, album artwork, commercial graphics, artist photographs, or recognizable likenesses.',
    'Interpret the song message and biblical context with a reverent, ministry-appropriate visual language.',
    `Song title: ${data.title}`,
    data.artist ? `Artist: ${data.artist}` : '',
    data.songwriter ? `Songwriter: ${data.songwriter}` : '',
    data.language ? `Language: ${data.language}` : '',
    data.themes?.length ? `Themes: ${data.themes.join(', ')}` : '',
    data.scripture ? `Scripture: ${data.scripture}` : '',
    `Mood: ${data.mood}`,
    `Visual approach: ${data.style}`,
    data.direction ? `Direction: ${data.direction}` : '',
  ].filter(Boolean).join('\n');

  const response = await fetch('https://ai.gateway.lovable.dev/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'google/gemini-2.5-flash-image-preview', prompt, n: 1, size: '1024x1024' }),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `AI generation failed (${response.status}).`);
  }
  const result = await response.json() as { data?: Array<{ url?: string; b64_json?: string }> };
  const image = result.data?.[0];
  if (!image?.url && !image?.b64_json) throw new Error('AI returned no artwork preview.');
  return { url: image.url, base64: image.b64_json };
}
