Optimistic UI & Media Enhancements

This plan implements instantaneous UI feedback for data mutations, enhances song management with media attachments, and adds robust search/edit/delete flows.

Technical details:
- Optimistic UI: Uses TanStack Query's `onMutate`, `onError`, and `onSettled` callbacks to manually update the cache with provisional data.
- Media Storage: Integrates Supabase Storage buckets for audio and PDF uploads.
- Song CRUD: Creates new routes for editing and adds delete confirmation flows.
- Search/Filters: Implements client-side filtering logic for the admin song list.

## Implementation Steps

### 1. Enhanced Data Layer
- Update `src/lib/db-songs.functions.ts` to support `deleteSong` and file attachment metadata.
- Ensure all mutation functions return the newly created/updated object.

### 2. Admin Song Library Enhancements (`src/routes/_authenticated/dashboard/songs/index.tsx`)
- Add search state and filter logic (Artist, Key, Theme).
- Add "Delete" confirmation dialog.
- Ensure the list updates optimistically when a song is archived or deleted.

### 3. Song Edit Flow
- Create `src/routes/_authenticated/dashboard/songs/$id.tsx` as an edit form (reusing the logic from `new.tsx`).
- Wire up the "Edit" buttons in the song list to this new route.

### 4. Media & File Uploads
- Add a "Media Attachments" section to `new.tsx` and the new edit route.
- Implement a `FileUploader` component that handles uploads to a `song-resources` Supabase bucket.
- Store file URLs in the `songs` table (or a related `song_media` table if preferred).

### 5. Optimistic UI for All Modules
- Update `songs/new.tsx`, `services/new.tsx`, `schedule/new.tsx`, and `media/new.tsx` to use optimistic cache updates.
- Verify that navigations happen after the mutation is initiated but before it fully resolves, while the UI shows the new item.

### 6. Public Sync Verification
- Final end-to-end check: Add a song via the dashboard and immediately verify its presence on the public library page.
