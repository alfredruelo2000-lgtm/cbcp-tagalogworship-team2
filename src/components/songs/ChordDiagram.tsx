import { useMemo } from 'react';
import { getFretShape, tuningFor, type FretShape, type ShapeTuning } from '@/lib/chord-shapes';
import { chordNoteNames, chordPianoVoicing, parseChord, pcToNote } from '@/lib/chords';

export type DiagramInstrument = 'guitar' | 'ukulele' | 'piano';

interface Props {
  chord: string;
  instrument: DiagramInstrument;
  /** Draw mirrored for left-handed players. */
  leftHanded?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Use this exact voicing instead of the recommended one. */
  shape?: FretShape | null;
  tuning?: ShapeTuning;
  inversion?: 0 | 1 | 2;
  useFlats?: boolean;
  /** Show finger numbers inside the dots (off for the tiny strip diagrams). */
  showFingers?: boolean;
}

/** Compact, dependency-free chord diagram for guitar, ukulele and piano. */
export function ChordDiagram({
  chord, instrument, leftHanded = false, size = 'md', shape, tuning = 'standard',
  inversion = 0, useFlats = false, showFingers = true,
}: Props) {
  if (instrument === 'piano') {
    return <PianoDiagram chord={chord} size={size} inversion={inversion} useFlats={useFlats} />;
  }
  return (
    <FretDiagram
      chord={chord}
      instrument={instrument}
      leftHanded={leftHanded}
      size={size}
      shape={shape}
      tuning={tuning}
      useFlats={useFlats}
      showFingers={showFingers}
    />
  );
}

function Unavailable({ compact }: { compact: boolean }) {
  return (
    <div className="grid h-full min-h-16 place-items-center px-2 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
      {compact ? 'No shape' : 'Chord diagram unavailable'}
    </div>
  );
}

function FretDiagram({
  chord, instrument, leftHanded, size, shape: given, tuning, useFlats, showFingers,
}: {
  chord: string;
  instrument: 'guitar' | 'ukulele';
  leftHanded: boolean;
  size: 'sm' | 'md' | 'lg';
  shape?: FretShape | null | undefined;
  tuning: ShapeTuning;
  useFlats: boolean;
  showFingers: boolean;
}) {
  const shape = useMemo(
    () => given ?? getFretShape(chord, instrument, tuning),
    [given, chord, instrument, tuning],
  );
  const strings = tuningFor(instrument, tuning);
  const stringCount = strings.length;
  const frets = 4;
  const scale = size === 'sm' ? 0.72 : size === 'lg' ? 1.7 : 1;
  const gapX = 15 * scale;
  const gapY = 17 * scale;
  const padX = 12 * scale;
  const padY = 16 * scale;
  const labelRow = size === 'sm' ? 0 : 11 * scale;
  const width = padX * 2 + gapX * (stringCount - 1);
  const height = padY + gapY * frets + 8 * scale + labelRow;

  if (!shape) return <Unavailable compact={size === 'sm'} />;

  // Open strings anchor the diagram at the nut; otherwise show the position number.
  const maxFret = Math.max(...shape.frets.map((f) => f ?? 0));
  const hasOpen = shape.frets.some((f) => f === 0);
  const start = hasOpen || maxFret <= 4 ? 1 : shape.baseFret;
  const x = (index: number) => padX + gapX * (leftHanded ? stringCount - 1 - index : index);
  const y = (fret: number) => padY + gapY * (fret - 0.5);
  const dot = 4.4 * scale;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={`${chord} ${instrument} chord diagram, ${shape.label} voicing`}
      className="text-primary"
    >
      {/* Nut or fret position marker */}
      {start === 1 ? (
        <rect x={padX - 1} y={padY - 3 * scale} width={gapX * (stringCount - 1) + 2} height={3 * scale} fill="currentColor" />
      ) : (
        <text x={1} y={padY + gapY * 0.8} fontSize={9 * scale} fill="currentColor" className="font-bold">
          {start}
        </text>
      )}

      {Array.from({ length: frets + 1 }).map((_, i) => (
        <line
          key={`f${i}`}
          x1={padX}
          y1={padY + gapY * i}
          x2={padX + gapX * (stringCount - 1)}
          y2={padY + gapY * i}
          stroke="currentColor"
          strokeOpacity={0.25}
        />
      ))}
      {Array.from({ length: stringCount }).map((_, i) => (
        <line
          key={`s${i}`}
          x1={padX + gapX * i}
          y1={padY}
          x2={padX + gapX * i}
          y2={padY + gapY * frets}
          stroke="currentColor"
          strokeOpacity={0.25}
        />
      ))}

      {/* Barre */}
      {shape.barre && (() => {
        const at = shape.frets
          .map((f, i) => ({ f, i }))
          .filter((entry) => entry.f === shape.baseFret)
          .map((entry) => entry.i);
        if (at.length < 3) return null;
        const xs = at.map((i) => x(i));
        return (
          <rect
            x={Math.min(...xs) - dot * 0.7}
            y={y(shape.baseFret - start + 1) - dot * 0.8}
            width={Math.abs(Math.max(...xs) - Math.min(...xs)) + dot * 1.4}
            height={dot * 1.6}
            rx={dot * 0.8}
            fill="currentColor"
          />
        );
      })()}

      {shape.frets.map((fret, index) => {
        if (fret === null) {
          return (
            <text
              key={index}
              x={x(index)}
              y={padY - 5 * scale}
              fontSize={9 * scale}
              textAnchor="middle"
              fill="currentColor"
              fillOpacity={0.6}
            >
              ×
            </text>
          );
        }
        if (fret === 0) {
          return (
            <circle
              key={index}
              cx={x(index)}
              cy={padY - 8 * scale}
              r={3 * scale}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.7}
            />
          );
        }
        const finger = shape.fingers[index];
        return (
          <g key={index}>
            <circle cx={x(index)} cy={y(fret - start + 1)} r={dot} fill="currentColor" />
            {showFingers && finger && size !== 'sm' && (
              <text
                x={x(index)}
                y={y(fret - start + 1) + dot * 0.55}
                fontSize={dot * 1.25}
                textAnchor="middle"
                className="font-bold"
                fill="var(--card, #fff)"
              >
                {finger}
              </text>
            )}
          </g>
        );
      })}

      {/* Sounding note names under each string */}
      {labelRow > 0 && shape.frets.map((fret, index) => (
        <text
          key={`n${index}`}
          x={x(index)}
          y={height - 2 * scale}
          fontSize={8 * scale}
          textAnchor="middle"
          fill="currentColor"
          fillOpacity={0.65}
        >
          {fret === null ? '' : pcToNote(strings[index]! + fret, useFlats)}
        </text>
      ))}
    </svg>
  );
}

const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11];
const BLACK_OFFSETS: Record<number, number> = { 1: 0, 3: 1, 6: 3, 8: 4, 10: 5 };

function PianoDiagram({
  chord, size, inversion, useFlats,
}: { chord: string; size: 'sm' | 'md' | 'lg'; inversion: 0 | 1 | 2; useFlats: boolean }) {
  const parsed = useMemo(() => parseChord(chord), [chord]);
  const voicing = useMemo(
    () => (parsed ? chordPianoVoicing(parsed, inversion, 4) : []),
    [parsed, inversion],
  );
  const active = useMemo(() => new Set(voicing.map((m) => ((m % 12) + 12) % 12)), [voicing]);
  const bassPc = useMemo(
    () => (voicing.length ? ((voicing[0]! % 12) + 12) % 12 : null),
    [voicing],
  );

  if (!parsed) return <Unavailable compact={size === 'sm'} />;

  const keyW = size === 'sm' ? 9 : size === 'lg' ? 19 : 12;
  const keyH = size === 'sm' ? 40 : size === 'lg' ? 84 : 54;
  const whites = 14; // two octaves
  const width = keyW * whites;
  const labelRow = size === 'sm' ? 0 : 12;

  return (
    <svg
      viewBox={`0 0 ${width} ${keyH + labelRow}`}
      width={width}
      height={keyH + labelRow}
      role="img"
      aria-label={`${chord} piano chord diagram: ${chordNoteNames(parsed, useFlats).join(' ')}`}
      className="text-primary"
    >
      {Array.from({ length: whites }).map((_, i) => {
        const pc = WHITE_PCS[i % 7]!;
        const on = active.has(pc);
        const isBass = bassPc === pc && i < 7;
        return (
          <g key={`w${i}`}>
            <rect
              x={i * keyW}
              y={0}
              width={keyW}
              height={keyH}
              fill={on ? 'currentColor' : 'white'}
              fillOpacity={on ? (isBass ? 1 : 0.8) : 1}
              stroke="currentColor"
              strokeOpacity={0.35}
            />
            {labelRow > 0 && on && (
              <text
                x={i * keyW + keyW / 2}
                y={keyH + labelRow - 2}
                fontSize={8}
                textAnchor="middle"
                fill="currentColor"
                className="font-bold"
              >
                {pcToNote(pc, useFlats)}
              </text>
            )}
          </g>
        );
      })}
      {Array.from({ length: 2 }).map((_, octave) =>
        Object.entries(BLACK_OFFSETS).map(([pcText, offset]) => {
          const pc = Number(pcText);
          const on = active.has(pc);
          const left = (octave * 7 + offset + 1) * keyW - keyW * 0.3;
          return (
            <g key={`b${octave}-${pc}`}>
              <rect
                x={left}
                y={0}
                width={keyW * 0.6}
                height={keyH * 0.62}
                fill={on ? 'currentColor' : '#1c2334'}
                stroke="currentColor"
                strokeOpacity={0.4}
              />
              {labelRow > 0 && on && octave === 0 && (
                <text
                  x={left + keyW * 0.3}
                  y={keyH + labelRow - 2}
                  fontSize={8}
                  textAnchor="middle"
                  fill="currentColor"
                  className="font-bold"
                >
                  {pcToNote(pc, useFlats)}
                </text>
              )}
            </g>
          );
        }),
      )}
    </svg>
  );
}
