
## Goal
Enhance the public song page to match the user's uploaded reference: transposition, key selection, split-view, and Nashville Numbers. Ensure admin changes sync in real-time.

## User-Facing Changes
- **Transposer UI**: A sleek key selector (A, Bb, C...) with "Higher/Lower" buttons.
- **Toggle Controls**: "Show Chords", "Show Lyrics", and "Number Notation" (Nashville Numbers).
- **Split-View Layout**: Improved musician view that supports a two-column or clean vertical flow like the reference.
- **Real-Time Admin Sync**: Ensure any updates made in the dashboard are reflected instantly.

## Technical Details
- **Frontend**: 
  - Update `src/routes/_public/songs/$id.tsx` to implement the new layout.
  - Implement Nashville Numbers utility in `src/utils/transposition.ts`.
  - Add state for `numberNotation`, `showChords`, and `showLyrics`.
- **Backend/Admin**:
  - Update `src/routes/_authenticated/dashboard/songs/$id.tsx` to allow setting song flow/order more intuitively.
  - Ensure `is_public` and status flags are correctly toggled and reactive.
- **Styling**: Tailwind-based layout mimicking the white/clean look of the provided image while keeping the project's premium aesthetic.

## Implementation Steps
1. **Utility Update**: Add Roman Numeral/Nashville Number logic to `src/utils/transposition.ts`.
2. **Public UI**: Overhaul `src/routes/_public/songs/$id.tsx` layout.
3. **Admin Sync**: Verify and fix any race conditions in mutations for real-time consistency.
