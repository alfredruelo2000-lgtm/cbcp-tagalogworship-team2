# Plan: LOAD 10B — Functional Songs, Services & Setlists

Make the core admin modules (Songs, Services, Setlists) fully functional with real Supabase data, following LOAD 10B requirements.

## 1. Database & Types (DONE/Refinement)
- [x] Update `src/types/songs.ts` and `src/types/setlists.ts` with new statuses and visibility levels.
- [x] Fix `member_status` in `src/integrations/supabase/types.ts` to include `Archived`.
- [ ] Ensure `songs` and `services` tables in `types.ts` include new fields (`visibility`, `songwriter`, `is_public`, `featured`, etc.) via script or manual edit if needed.

## 2. Song Library CRUD
- [ ] **Library List (`/dashboard/songs`)**:
    - Update table to show real data (Active status, visibility).
    - Implement real search (Title, Artist, Theme).
    - Implement real "Archive" action.
- [ ] **Add Song Form (`/dashboard/songs/new`)**:
    - Add missing fields: Artist, Songwriter, Time Signature, Type, Themes, Scripture, Visibility (Public/Team/Private), Featured, Status.
    - Wire up `createSong` mutation.
    - Add validation, loading states, and success notifications.
- [ ] **Edit Song Form (`/dashboard/songs/$id/edit`)**:
    - Create new edit route.
    - Load existing song data.
    - Wire up `updateSong` mutation.

## 3. Services Management CRUD
- [ ] **Service List (`/dashboard/services`)**:
    - Show upcoming services from real data.
    - Implement real "Archive" and "Mark Completed".
- [ ] **Create Service Form (`/dashboard/services/new`)**:
    - Add fields: Service Type, Theme, Scripture, Worship Leader, Times (Rehearsal, Call), Visibility.
    - Wire up `createService` in `db-services.ts`.
    - Redirect to Setlist builder on success.
- [ ] **Edit Service Form (`/dashboard/services/$id/edit`)**:
    - Create new edit route.

## 4. Setlist Builder CRUD
- [ ] **Setlist Builder (`/dashboard/setlists/$id`)**:
    - Load service and existing items.
    - **Add Songs**: Search library and insert into `service_items`.
    - **Reorder**: Drag-and-drop or Move Up/Down using `sort_order`.
    - **Service-Specific Key**: Allow selecting a key that updates the `service_items.selected_key` without changing the main song library.
    - **Custom Items**: Allow adding non-song items (Reading, Prayer).
- [ ] **Dashboard Counters**:
    - Update `Upcoming Services` and `Active Songs` counts in `dashboard.tsx` to use live counts.

## 5. UI/UX Hardening
- [ ] Add `sonner` notifications for all CRUD operations.
- [ ] Implement "Saving..." states on all submit buttons.
- [ ] Audit `audit_logs` integration to ensure actions are recorded.

## Technical Details
- Use `useMutation` for all write operations.
- Invalidate `['songs']`, `['services']`, and `['recent-activity']` on success.
- Use `supabase.from('service_items').upsert()` for setlist ordering.
- Ensure RLS policies (already added in 9C) are sufficient for these admin operations.
