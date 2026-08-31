/**
 * Shared song text intelligence: section detection and chord detection/formatting.
 * Used by the admin song editor (Add / Edit) and the public chord viewer so that
 * highlighting, formatting and transposition all agree on the same rules.
 */

/** Canonical song divisions, with the aliases and common misspellings we accept. */
const SECTION_DEFINITIONS: { canonical: string; aliases: string[] }[] = [
  { canonical: 'Intro', aliases: ['intro', 'introduction', 'inro', 'itro'] },
  { canonical: 'Verse', aliases: ['verse', 'vers', 'verese', 'stanza'] },
  { canonical: 'Pre-Chorus', aliases: ['pre-chorus', 'prechorus', 'pre chorus', 'pre-choruss', 'prechorous'] },
  { canonical: 'Chorus', aliases: ['chorus', 'chorous', 'chrous', 'chorus:'] },
  { canonical: 'Post-Chorus', aliases: ['post-chorus', 'postchorus', 'post chorus'] },
  { canonical: 'Refrain', aliases: ['refrain', 'refrein', 'refran'] },
  { canonical: 'Bridge', aliases: ['bridge', 'gridge', 'brigde', 'bridg', 'bride'] },
  { canonical: 'Instrumental', aliases: ['instrumental', 'instru', 'instrumental break', 'music'] },
  { canonical: 'Interlude', aliases: ['interlude', 'interlde'] },
  { canonical: 'Solo', aliases: ['solo', 'guitar solo', 'keys solo', 'lead'] },
  { canonical: 'Breakdown', aliases: ['breakdown', 'break', 'break down'] },
  { canonical: 'Turnaround', aliases: ['turnaround', 'turn around'] },
  { canonical: 'Vamp', aliases: ['vamp'] },
  { canonical: 'Tag', aliases: ['tag', 'tag ending'] },
  { canonical: 'Hook', aliases: ['hook'] },
  { canonical: 'Channel', aliases: ['channel'] },
  { canonical: 'Spontaneous', aliases: ['spontaneous', 'spont', 'prophetic'] },
  { canonical: 'Coda', aliases: ['coda'] },
  { canonical: 'Outro', aliases: ['outro', 'ending', 'end', 'outr'] },
  { canonical: 'Postlude', aliases: ['postlude', 'post lude'] },
  { canonical: 'Prelude', aliases: ['prelude'] },
  { canonical: 'Ad Lib', aliases: ['ad lib', 'adlib', 'ad-lib'] },
];

const ALIAS_LOOKUP = new Map<string, string>();
for (const def of SECTION_DEFINITIONS) {
  for (const alias of def.aliases) ALIAS_LOOKUP.set(alias.replace(/[\s-]+/g, ''), def.canonical);
}

export interface SectionHeader {
  /** Canonical label, e.g. "Verse 2", "Pre-Chorus", "Bridge". */
  label: string;
  /** Repeat annotation if present, e.g. "2X". */
  repeat?: string;
  /** Extra qualifier kept from the source, e.g. "(vocal and piano only)". */
  note?: string;
}

/** Strip brackets, stray punctuation and repeat markers from a candidate header line. */
function cleanHeaderCandidate(raw: string) {
  let text = raw.trim();
  // Remove any bracket/paren characters used as delimiters, plus trailing colons.
  text = text.replace(/[[\]{}]/g, ' ').replace(/^[\s:.\-–—|*#]+|[\s:.\-–—|*#]+$/g, '').trim();
  let repeat: string | undefined;
  const repeatMatch = text.match(/(?:^|[\s(])(?:x\s*(\d{1,2})|(\d{1,2})\s*x)(?:\)|\b)/i);
  if (repeatMatch) {
    repeat = `${repeatMatch[1] ?? repeatMatch[2]}X`;
    text = text.replace(repeatMatch[0], ' ').trim();
  }
  let note: string | undefined;
  const noteMatch = text.match(/\(([^)]+)\)/);
  if (noteMatch) {
    note = noteMatch[1]?.trim();
    text = text.replace(noteMatch[0], ' ').trim();
  }
  text = text.replace(/[()]/g, ' ').replace(/\s{2,}/g, ' ').trim();
  return { text, repeat, note };
}

/**
 * Detect whether a single line is a song-division header ("Verse 2", "[Chorus]",
 * "INTRO 4X", "Gridge 2X", "Chorus] 2x [" …). Returns null when it is not.
 */
export function detectSectionHeader(line: string): SectionHeader | null {
  if (!line) return null;
  const rawTrimmed = line.trim();
  if (!rawTrimmed || rawTrimmed.length > 60) return null;

  const { text, repeat, note } = cleanHeaderCandidate(rawTrimmed);
  if (!text) return null;

  // Header shape: keyword + optional number/letter, nothing else.
  const match = text.match(/^([A-Za-z][A-Za-z\s-]*?)\s*([0-9]{1,2}|[A-D])?$/);
  if (!match || !match[1]) return null;

  const keyword = match[1].trim().toLowerCase().replace(/[\s-]+/g, '');
  const canonical = ALIAS_LOOKUP.get(keyword);
  if (!canonical) return null;

  const suffix = match[2] ? ` ${match[2].toUpperCase()}` : '';
  const header: SectionHeader = { label: `${canonical}${suffix}` };
  if (repeat) header.repeat = repeat;
  if (note) header.note = note;
  return header;
}

/** Render a detected header back into the canonical bracket form. */
export function formatSectionHeader(header: SectionHeader): string {
  const parts = [header.label];
  if (header.note) parts.push(`(${header.note})`);
  if (header.repeat) parts.push(header.repeat);
  return `[${parts.join(' ')}]`;
}

/** Short badge label used by the viewer's section strip. */
export function shortSectionLabel(name: string): string {
  const lower = name.toLowerCase();
  const digits = name.match(/\d+/)?.[0] ?? '';
  if (lower.startsWith('pre')) return `PC${digits}`;
  if (lower.startsWith('post-ch') || lower.startsWith('postch')) return `PoC${digits}`;
  if (lower.startsWith('chorus')) return `Ch${digits}`;
  if (lower.startsWith('verse')) return `V${digits}`;
  if (lower.startsWith('bridge')) return `Br${digits}`;
  if (lower.startsWith('refrain')) return `Ref${digits}`;
  if (lower.startsWith('instrumental')) return 'Instr';
  if (lower.startsWith('interlude')) return 'Inter';
  if (lower.startsWith('intro')) return 'Intro';
  if (lower.startsWith('outro') || lower.startsWith('ending')) return 'Outro';
  if (lower.startsWith('postlude')) return 'Post';
  if (name.length > 8) return `${name.slice(0, 7)}…`;
  return name;
}

/* ------------------------------------------------------------------ chords */

const NOTE = '[A-G](?:#{1,2}|b{1,2}|♯|♭)?';
const QUALITY = [
  '(?:maj|major|Maj|MAJ|M|Δ)',
  '(?:min|m(?!aj))',
  '(?:dim|°|ø)',
  '(?:aug|\\+)',
  '(?:sus)',
  '(?:add)',
  '(?:alt)',
  '(?:h(?:alf)?dim)',
].join('|');
// e.g. C, Am7, F#m7b5, Bbmaj9, Dsus4, G6/9, Cadd9, E7#9, Ab°7, Gmaj7/B, C2, F2
const EXT = `(?:(?:${QUALITY})|[0-9]|[#b♯♭]|\\(|\\)|\\+|-|Δ|°|ø|no|omit)`;
const CHORD_BODY = `${NOTE}${EXT}*(?:/${NOTE}${EXT}*)?`;
const CHORD_CORE = new RegExp(`^${CHORD_BODY}$`);
const NON_CHORD_TOKENS = /^(?:N\.?C\.?|NC|x\d+|\d+x|\||\|\||:\||\|:|%|\/|-|~|\*)$/i;

/** True when a bare token (no brackets) reads as a chord symbol. */
export function isChordToken(token: string): boolean {
  const core = token.replace(/^[([{"'.,]+/, '').replace(/[)\]}"'.,;:!?]+$/, '');
  if (!core) return false;
  if (NON_CHORD_TOKENS.test(core)) return false;
  if (core.length > 12) return false;
  // Reject plain English words that start with a note letter ("A", "Be", "Add").
  if (/^[A-G]$/.test(core)) return true;
  if (!CHORD_CORE.test(core)) return false;
  // "Am" is a chord, "Ad", "Ba" are not: everything after the root must be
  // valid chord vocabulary, which the regex already enforces.
  return true;
}

/**
 * Bracket every chord on a line while preserving spacing and punctuation.
 * Only applied to lines that read as chord lines (see formatSongText).
 */
function bracketChordsInLine(line: string): string {
  return line
    .split(/(\s+)/)
    .map((part) => {
      if (!part || /^\s+$/.test(part)) return part;
      if (part.includes('[') || part.includes(']')) return part;
      const prefix = part.match(/^[([{"'.,]+/)?.[0] ?? '';
      const suffix = part.match(/[)\]}"'.,;:!?]+$/)?.[0] ?? '';
      const core = part.slice(prefix.length, suffix.length ? -suffix.length : undefined);
      if (!core || !isChordToken(core)) return part;
      return `${prefix}[${core}]${suffix}`;
    })
    .join('');
}

/** Heuristic: does this line consist mostly of chord symbols? */
export function looksLikeChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (detectSectionHeader(trimmed)) return false;
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (!tokens.length) return false;
  const meaningful = tokens.filter((t) => !NON_CHORD_TOKENS.test(t));
  if (!meaningful.length) return false;
  const chordCount = meaningful.filter((t) => isChordToken(t)).length;
  const ratio = chordCount / meaningful.length;
  return ratio >= 0.6 || (meaningful.length <= 3 && chordCount === meaningful.length);
}

/**
 * One-click reformat: normalizes song divisions into highlighted `[Section]`
 * headers and brackets every detected chord (including slash and extended
 * chords) so the viewer can transpose reliably.
 */
export function formatSongText(input: string): string {
  if (!input) return '';
  const lines = input.replace(/\r\n?/g, '\n').split('\n');
  const out: string[] = [];
  const seen: Record<string, number> = {};

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/g, '');
    if (!line.trim()) {
      if (out.length && out[out.length - 1] !== '') out.push('');
      continue;
    }

    const header = detectSectionHeader(line);
    if (header) {
      // Auto-number repeated divisions that came in unnumbered (Verse, Verse…).
      if (!/\d/.test(header.label)) {
        const base = header.label;
        seen[base] = (seen[base] || 0) + 1;
        const repeatable = /^(Verse|Chorus|Bridge|Pre-Chorus|Refrain|Instrumental|Interlude)$/.test(base);
        if (repeatable && seen[base] > 1) header.label = `${base} ${seen[base]}`;
      }
      if (out.length && out[out.length - 1] !== '') out.push('');
      out.push(formatSectionHeader(header));
      continue;
    }

    if (line.includes('[') && line.includes(']')) {
      out.push(line);
      continue;
    }

    out.push(looksLikeChordLine(line) ? bracketChordsInLine(line) : line);
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Split formatted song text into sections, each with an optional detected header.
 * Robust to missing blank lines: a header always starts a new section.
 */
export function splitSongSections(text: string): { header: SectionHeader | null; lines: string[] }[] {
  const sections: { header: SectionHeader | null; lines: string[] }[] = [];
  let current: { header: SectionHeader | null; lines: string[] } | null = null;
  const push = () => {
    if (current && (current.header || current.lines.some((l) => l.trim()))) sections.push(current);
  };

  for (const raw of (text || '').replace(/\r\n?/g, '\n').split('\n')) {
    const header = detectSectionHeader(raw);
    if (header) {
      push();
      current = { header, lines: [] };
      continue;
    }
    if (!raw.trim()) {
      if (current && current.lines.length) {
        push();
        current = null;
      }
      continue;
    }
    if (!current) current = { header: null, lines: [] };
    current.lines.push(raw);
  }
  push();
  return sections;
}
