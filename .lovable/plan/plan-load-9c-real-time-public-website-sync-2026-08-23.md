# Plan: LOAD 9C — Real-Time Public Website Sync

This load connects approved admin content to the public website, ensuring a single source of truth through the database.

## Phase 1: Database & API Hardening
- **Visibility Control**: Update `songs`, `services`, `worship_resources`, `media_items`, and `profiles` to include clear visibility flags (`is_public`, `featured`).
- **Public Functions**: Create/update server functions in `src/lib/db-public.functions.ts` to strictly filter by `is_public=true` and `status='Active'`.
- **Security Audit**: Verify RLS policies ensure public users can only read marked content.

## Phase 2: Homepage Integration
- **Upcoming Gathering**: Connect `EventCard` on the homepage to the next `Published` service.
- **Featured Songs**: Update homepage songs preview to pull only `featured=true` and `status='Active'` songs.
- **Worship Setlist**: Update `WorshipSetlist` component to pull the setlist from the next published service.
- **Team Preview**: Connect to profiles marked for public display.
- **Resources/Media Preview**: Sync with featured public resources and media items.

## Phase 3: Public Page Synchronization
- **Songs Library**: Ensure `/songs` uses the same filtered source as the homepage but with full library access (respecting visibility).
- **Resources Library**: Update `/resources` to show only `Published` items.
- **Media Gallery**: Filter `/media` by `visibility='Public'`.
- **Team Directory**: Filter `/team` to show only public profiles, exposing only safe fields (name, photo, role, bio).

## Phase 4: Admin Dashboard Refinement
- **Publish Controls**: Add "View Public Page" buttons and visibility toggles to admin CRUD forms.
- **Sidebar & Navigation**: Add "Administration" (Users, Logs, Settings) and "Account" (Profile, Sign Out) sections to `AdminSidebar`.
- **Activity Log**: Connect "Recent Activity" to the real `audit_logs` table.
- **Quick Actions**: Ensure all dashboard buttons link to functional Create/Upload forms.

## Phase 5: Testing & Cleanup
- **Cross-Tab Verification**: Verify that admin updates reflect on the public site immediately (via invalidation/refetch).
- **Mock Data Audit**: Final sweep to remove any remaining placeholder arrays or hardcoded strings.
- **Security Check**: Confirm internal notes, emails, and private schedules are never exposed via public endpoints.

## Technical Details
- Use `useQuery` invalidation (`queryClient.invalidateQueries`) for immediate updates.
- Map snake_case database fields to camelCase props consistently across all public components.
- Implement robust null-checks and empty states for all synchronized sections.
