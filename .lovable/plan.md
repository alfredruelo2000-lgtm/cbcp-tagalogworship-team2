# Admin ↔ Public Song Synchronization

## Goal
Use `public.songs` as the only song source and make create, edit, publish, archive, and delete changes appear immediately and reliably in both Admin and the public Song Library while preserving offline charts, setlists, and setlist-specific keys.

## Confirmed root causes
- The database contains 31 songs, and all 31 are currently `Active` and `is_public = true`.
- The public list shows zero because its `select *` request times out. Embedded base64 artwork makes the 31 song rows about 54 MB, including individual artwork values over 2 MB.
- Admin and public list/detail screens use overlapping but inconsistent broad queries and cache keys.
- Mutations invalidate the Admin list but do not consistently reconcile the public list, per-song detail cache, and IndexedDB chart copy.
- Edit has separate `isSaving` and mutation state, navigates before all affected caches are reconciled, and lacks complete optimistic rollback.
- Offline hydration and service-worker REST caching need an explicit online-authoritative reconnect path.

## Implementation

### 1. Canonical song data access
- Refactor the existing song data module so every screen reads/writes `public.songs` through shared row mapping and field projections.
- Add a lightweight list projection for Admin/public browsing rather than `select *`; exclude full chart bodies and oversized embedded artwork from bulk list payloads while retaining normal storage URLs.
- Add a canonical by-ID query for the full song/chord sheet so lyrics, chords, metadata, and the newest saved values load only when a song is opened or edited.
- Keep public visibility defined in one place as `status = Active AND is_public = true`; Admin remains unfiltered.
- Preserve every existing row and ID; no song-data deletion or replacement.

### 2. Query keys and realtime synchronization
- Centralize song query keys for Admin list, public list, and by-ID detail.
- Keep one root realtime channel and update/invalidate only affected song caches from INSERT/UPDATE/DELETE payloads.
- Immediately remove unpublished/deleted rows from the public cache, add newly public rows, and refresh changed detail/list data without page reloads or polling.
- Add reconnect/tab-resume reconciliation so the database replaces stale online data.

### 3. Reliable create/edit/delete flows
- Use mutation state as the single submit lock to prevent double-submit.
- Create once and replace the temporary optimistic row with the returned canonical database row.
- Edit the existing ID only, optimistically patch Admin/public/detail caches, then replace them with the returned row; rollback all touched caches on failure.
- Show clear Saving, Saved, and error feedback; keep the editor open on failure.
- For archive/unpublish/delete, optimistically update both Admin and public visibility and rollback if the database rejects the write.
- Invalidate/refetch only the affected song queries after settlement as a correctness check.

### 4. Offline/PWA cache correctness
- Update the IndexedDB chart copy whenever a successful create/edit affects an available public song.
- Remove or mark cached list/detail entries when a song is unpublished or deleted without destroying charts intentionally saved for offline setlists.
- Ensure cached charts are fallback-only while offline; when online, database data and realtime events always win.
- On reconnect, flush pending setlist writes first, then reconcile active song queries and persist the newest successful results.
- Keep service-worker fallback for offline reads but prevent a timed-out bulk query from being the normal online path by using lightweight list/by-ID requests.

### 5. Database performance and integrity
- Add focused indexes for the public visibility/sort query if missing.
- Verify explicit Data API grants and existing RLS policies without widening public write access.
- Keep realtime enabled for `public.songs` with stable row identity.

## Verification
- Confirm database/Admin total is 31 and public-visible total is 31 before test changes.
- In an authenticated Admin tab and public tab: create a published test song; verify immediate appearance and correct count.
- Edit title, artist, key, BPM, lyrics, chords, category, and image; verify list and open chart update immediately and retain the same ID.
- Repeat edits several times; verify no duplicate row and no failed save.
- Unpublish and republish; verify immediate public removal/reappearance while Admin retains the row.
- Refresh both tabs and confirm persisted counts/data.
- Delete the test row and verify both sides update.
- Test realtime across two browser contexts.
- Save a setlist offline, disconnect, open cached charts, reconnect, and verify newer database data supersedes stale cached data without breaking transpose or setlist keys.
