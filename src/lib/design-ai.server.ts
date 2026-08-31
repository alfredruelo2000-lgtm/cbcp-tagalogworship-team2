import { z } from 'zod';

const GATEWAY = 'https://ai.gateway.lovable.dev/v1';
const MODEL = 'google/gemini-2.5-flash';

function apiKey() {
  const key = process.env['LOVABLE_API_KEY'];
  if (!key) throw new Error('AI design studio is not configured.');
  return key;
}

export const designAnalyzeSchema = z.object({
  currentTheme: z.string().max(6000),
  notes: z.string().max(1200).optional(),
});

export const designConceptSchema = z.object({
  brief: z.string().max(1200).optional(),
  count: z.number().int().min(3).max(5).default(4),
  keepNavy: z.boolean().default(true),
  keepGold: z.boolean().default(true),
  currentTheme: z.string().max(6000),
});

export const designRefineSchema = z.object({
  concept: z.string().max(6000),
  instruction: z.string().min(2).max(800),
});

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const palette = z.object({
  background: hex, foreground: hex, card: hex, cardForeground: hex,
  primary: hex, primaryForeground: hex, accent: hex, accentForeground: hex,
  muted: hex, mutedForeground: hex, border: hex,
});
const conceptOut = z.object({
  name: z.string().max(60),
  direction: z.string().max(400),
  rationale: z.string().max(600).optional(),
  recommended: z.boolean().optional(),
  light: palette,
  dark: palette,
  fonts: z.object({ heading: z.string().max(120), body: z.string().max(120), chord: z.string().max(160) }),
  layout: z.object({
    radius: z.number().min(0).max(28),
    shadow: z.enum(['none', 'soft', 'medium', 'strong']),
    density: z.enum(['compact', 'comfortable', 'spacious']),
    nav: z.enum(['minimal', 'solid', 'glass', 'bordered']),
    button: z.enum(['square', 'rounded', 'pill', 'outline']),
    card: z.enum(['flat', 'bordered', 'elevated', 'editorial']),
    hero: z.enum(['compact', 'editorial', 'cinematic']),
    image: z.enum(['natural', 'soft', 'duotone']),
    motion: z.enum(['none', 'subtle', 'expressive']),
    mobile: z.enum(['compact', 'balanced', 'airy']),
  }),
  scores: z
    .object({
      professional: z.number().min(0).max(100),
      mobile: z.number().min(0).max(100),
      accessibility: z.number().min(0).max(100),
      readability: z.number().min(0).max(100),
      ministryFit: z.number().min(0).max(100),
      performance: z.number().min(0).max(100),
      consistency: z.number().min(0).max(100),
      scalability: z.number().min(0).max(100),
    })
    .optional(),
});

const FONT_RULE = `Fonts MUST be chosen only from these exact stacks:
- "'Playfair Display', ui-serif, Georgia, serif"
- "'Inter', ui-sans-serif, system-ui, sans-serif"
- "ui-sans-serif, system-ui, -apple-system, sans-serif"
- "Georgia, 'Times New Roman', ui-serif, serif"
- "ui-monospace, SFMono-Regular, 'JetBrains Mono', Menlo, monospace"
Chord font must always be the monospace stack.`;

async function chat(messages: unknown[], jsonOnly = false) {
  const response = await fetch(`${GATEWAY}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(jsonOnly ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  if (!response.ok) throw new Error((await response.text()) || `AI request failed (${response.status}).`);
  const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = body.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('AI returned an empty response.');
  return content;
}

function parseJson(content: string) {
  const cleaned = content.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  return JSON.parse(start >= 0 ? cleaned.slice(start, end + 1) : cleaned);
}

export async function analyzeAppDesign(input: z.infer<typeof designAnalyzeSchema>) {
  const data = designAnalyzeSchema.parse(input);
  const review = await chat([
    {
      role: 'system',
      content:
        'You are a senior product designer auditing a Filipino church worship-team web app (public site + admin dashboard + mobile chord viewer). ' +
        'Reply in concise markdown with these sections: Overall impression, Color & contrast, Typography, Spacing & density, ' +
        'Mobile experience, Consistency risks, Accessibility risks, Top 5 opportunities. Be specific and practical; never propose external font files or new dependencies.',
    },
    {
      role: 'user',
      content: `Current design tokens:\n${data.currentTheme}\n\nAdmin notes: ${data.notes || 'none'}`,
    },
  ]);
  return { review };
}

export async function generateAppDesignConcepts(input: z.infer<typeof designConceptSchema>) {
  const data = designConceptSchema.parse(input);
  const content = await chat(
    [
      {
        role: 'system',
        content:
          'You are a senior design systems architect for worship/ministry software. Produce complete, original, coordinated design systems as JSON only. ' +
          `${FONT_RULE}\n` +
          'Every concept must be premium, elegant, reverent, highly readable, mobile-first and WCAG AA compliant ' +
          '(body text >= 4.5:1 against its background in both light and dark mode). Concepts must be visually distinct from one another. ' +
          'Return JSON shaped as {"concepts":[{name,direction,rationale,recommended,light{...},dark{...},fonts{heading,body,chord},layout{radius,shadow,density,nav,button,card,hero,image,motion,mobile},scores{professional,mobile,accessibility,readability,ministryFit,performance,consistency,scalability}}]} ' +
          'where every palette has background, foreground, card, cardForeground, primary, primaryForeground, accent, accentForeground, muted, mutedForeground, border as #rrggbb hex.',
      },
      {
        role: 'user',
        content: [
          `Generate exactly ${data.count} distinct design concepts for the CBCP Tagalog Worship Team app.`,
          data.keepNavy ? 'Keep a deep navy primary (#071a4a family) as brand anchor.' : 'The primary color may change.',
          data.keepGold ? 'Keep a gold accent (#c9a227 family) as brand anchor.' : 'The accent color may change.',
          `Current tokens:\n${data.currentTheme}`,
          data.brief ? `Admin brief: ${data.brief}` : '',
          'Mark exactly one concept as recommended:true.',
        ].filter(Boolean).join('\n\n'),
      },
    ],
    true,
  );
  const parsed = parseJson(content) as { concepts?: unknown };
  const concepts = z.array(conceptOut).min(1).max(5).parse(parsed.concepts ?? []);
  return { concepts };
}

export async function refineAppDesignConcept(input: z.infer<typeof designRefineSchema>) {
  const data = designRefineSchema.parse(input);
  const content = await chat(
    [
      {
        role: 'system',
        content:
          'You refine an existing design system concept. Return the FULL updated concept as JSON only, same shape as the input. ' +
          `${FONT_RULE} Preserve WCAG AA contrast and mobile-first readability.`,
      },
      { role: 'user', content: `Concept JSON:\n${data.concept}\n\nRequested change: ${data.instruction}` },
    ],
    true,
  );
  const concept = conceptOut.parse(parseJson(content));
  return { concept };
}
