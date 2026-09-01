import { useMemo } from 'react';
import { getFretShape, TUNINGS } from '@/lib/chord-shapes';
import { chordMidiNotes, parseChord } from '@/lib/chords';

export type DiagramInstrument = 'guitar' | 'ukulele' | 'piano';

interface Props {
  chord: string;
  instrument: DiagramInstrument;
  /** Draw mirrored for left-handed players. */
  leftHanded?: boolean;
  size?: 'sm' | 'md';
}

/** Compact, dependency-free chord diagram for guitar, ukulele and piano. */
export function ChordDiagram({ chord, instrument, leftHanded = false, size = 'md' }: Props) {
  if (instrument === 'piano') return <PianoDiagram chord={chord} size={size} />;
  return <FretDiagram chord={chord} instrument={instrument} leftHanded={leftHanded} size={size} />;
}

function FretDiagram({
  chord,
  instrument,
  leftHanded,
  size,
}: {
  chord: string;
  instrument: 'guitar' | 'ukulele';
  leftHanded: boolean;
  size: 'sm' | 'md';
}) {
  const shape = useMemo(() => getFretShape(chord, instrument), [chord, instrument]);
  const stringCount = TUNINGS[instrument].length;
  const frets = 4;
  const gapX = size === 'sm' ? 11 : 15;
  const gapY = size === 'sm' ? 13 : 17;
  const padX = 12;
  const padY = 16;
  const width = padX * 2 + gapX * (stringCount - 1);
  const height = padY + gapY * frets + 8;

  if (!shape) {
    return (
      <div className="grid h-full min-h-16 place-items-center text-[10px] uppercase tracking-widest text-muted-foreground">
        No shape
      </div>
    );
  }

  const start = shape.baseFret > 1 ? shape.baseFret : 1;
  const x = (index: number) => padX + gapX * (leftHanded ? stringCount - 1 - index : index);
  const y = (fret: number) => padY + gapY * (fret - 0.5);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={`${chord} ${instrument} chord diagram`}
      className="text-primary"
    >
      {/* Nut or fret position marker */}
      {start === 1 ? (
        <rect x={padX - 1} y={padY - 3} width={gapX * (stringCount - 1) + 2} height={3} fill="currentColor" />
      ) : (
        <text x={2} y={padY + gapY * 0.75} fontSize={8} fill="currentColor" className="font-bold">
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
            x={Math.min(...xs) - 3}
            y={y(shape.baseFret - start + 1) - 3.5}
            width={Math.abs(Math.max(...xs) - Math.min(...xs)) + 6}
            height={7}
            rx={3.5}
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
              y={padY - 6}
              fontSize={8}
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
              cy={padY - 8}
              r={3}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.7}
            />
          );
        }
        return (
          <circle key={index} cx={x(index)} cy={y(fret - start + 1)} r={4} fill="currentColor" />
        );
      })}
    </svg>
  );
}

const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11];
const BLACK_OFFSETS: Record<number, number> = { 1: 0, 3: 1, 6: 3, 8: 4, 10: 5 };

function PianoDiagram({ chord, size }: { chord: string; size: 'sm' | 'md' }) {
  const parsed = useMemo(() => parseChord(chord), [chord]);
  const active = useMemo(() => {
    if (!parsed) return new Set<number>();
    return new Set(chordMidiNotes(parsed).map((m) => ((m % 12) + 12) % 12));
  }, [parsed]);

  const keyW = size === 'sm' ? 9 : 12;
  const keyH = size === 'sm' ? 40 : 54;
  const whites = 14; // two octaves
  const width = keyW * whites;

  return (
    <svg
      viewBox={`0 0 ${width} ${keyH}`}
      width={width}
      height={keyH}
      role="img"
      aria-label={`${chord} piano chord diagram`}
      className="text-primary"
    >
      {Array.from({ length: whites }).map((_, i) => {
        const pc = WHITE_PCS[i % 7]!;
        const on = active.has(pc);
        return (
          <rect
            key={`w${i}`}
            x={i * keyW}
            y={0}
            width={keyW}
            height={keyH}
            fill={on ? 'currentColor' : 'white'}
            fillOpacity={on ? 0.85 : 1}
            stroke="currentColor"
            strokeOpacity={0.35}
          />
        );
      })}
      {Array.from({ length: 2 }).map((_, octave) =>
        Object.entries(BLACK_OFFSETS).map(([pcText, offset]) => {
          const pc = Number(pcText);
          const on = active.has(pc);
          const left = (octave * 7 + offset + 1) * keyW - keyW * 0.3;
          return (
            <rect
              key={`b${octave}-${pc}`}
              x={left}
              y={0}
              width={keyW * 0.6}
              height={keyH * 0.62}
              fill={on ? 'currentColor' : '#1c2334'}
              stroke="currentColor"
              strokeOpacity={0.4}
            />
          );
        }),
      )}
    </svg>
  );
}
