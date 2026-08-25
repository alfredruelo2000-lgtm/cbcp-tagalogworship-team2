# Plan: Advanced Musician Tools & Real-time Sharing

Implement advanced practice tools for the song library, including real-time parameter sharing, metronome count-in, latency calibration, A-B looping, and administrative defaults.

## User Review Required

> [!IMPORTANT]
> I am assuming `songs` table has enough flexibility to store metronome defaults in `external_resources` (JSON) to avoid schema changes, as I cannot run migrations directly. I will also use URL search parameters for the shareable practice link.

- **Practice Link**: Should it be a short URL or just the current URL with parameters? (I will implement URL parameters for now).
- **A-B Loop**: Should the loop state be shareable via the link as well? (I will include it).

## Proposed Changes

### Database & Types
- Update `WorshipSong` interface to include metronome defaults.
- Update `db-songs.functions.ts` to handle metronome defaults in the `external_resources` JSON field.

### Public Song View (`src/routes/_public/songs/$id.tsx`)
- **Shareable Practice Link**: 
    - Implement a "Copy Practice Link" button that encodes `tempo`, `sound`, `visibility` (chords/lyrics), and `isSplit` into the URL.
    - Add logic to hydrate state from URL parameters on mount.
- **Metronome Enhancements**:
    - Add a **Count-in** toggle (1-4 beats) before the main metronome starts.
    - Add **Latency Calibration** slider (0-200ms) to offset the auto-scroll start/interval.
- **A-B Looping**:
    - Add a "Loop Mode" toggle.
    - Allow users to select a start and end section (from the `sections` array or line markers).
    - Sync metronome reset to the start of the loop.
- **Persistence**:
    - Ensure metronome sound and volume are saved per song.

### Admin Dashboard (`src/routes/_authenticated/dashboard/songs/$id.tsx`)
- Add a new "Metronome Defaults" section in the Edit Song page.
- Allow setting default sound type and starting volume.
- Save these settings into the `external_resources` field of the song record.

### Public Sync
- Ensure `db-public.functions.ts` includes the `external_resources` field in its projection.

## Technical Details

- **URL State**: Use `URLSearchParams` to build the shareable link.
- **A-B Loop Logic**: Use line indices or section IDs to define the boundaries. The metronome will trigger a scroll-to-top of the start section when it wraps.
- **Count-in**: Implement as a separate `useEffect` or state transition before the main `metronomePlaying` loop.
- **Latency**: Adjust the `setInterval` delay for auto-scroll by the calibration value.

## Constraints & Considerations
- Use `AudioContext` for precise timing.
- Keep the premium worship aesthetic (Deep Navy, Gold, Ivory).
- Ensure mobile responsiveness for the new controls.
