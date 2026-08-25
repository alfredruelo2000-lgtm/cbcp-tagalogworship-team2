# Plan - Team Personnel Enhancements

Add profile image uploads, search/filters on the public team page, and drag-and-drop ordering in the admin dashboard.

## User Review Required

> [!IMPORTANT]
> Drag-and-drop ordering requires a new `display_order` column in the database. I have already prepared the schema change.

## Proposed Changes

### Database
- Add `display_order` (integer) to `profiles` table to persist custom sorting.

### Personnel Profile Management (Admin)
- **Image Upload**: Add image upload capability to `dashboard/team/new.tsx` and a new `dashboard/team/edit.tsx` using Lovable Cloud storage.
- **Ordering**: Implement a drag-and-drop interface in the Team Management list (`dashboard/team.tsx`) to set public display order.

### Public Team Page
- **Search & Filters**: Enhance the directory with real-time search by name/role and category filters.
- **Visuals**: Ensure profile images are displayed prominently.
- **Sorting**: Update `getTeamPublic` to respect the `display_order` set in admin.

## Technical Details

- **Storage**: Use `supabase.storage.from('personnel-avatars')` for photo uploads.
- **Drag & Drop**: Use `@dnd-kit/core` or similar lightweight utility if not already present, or implement a simple "Move Up/Down" flow for stability if preferred.
- **Real-time Sync**: Use TanStack Query invalidation to ensure admin changes reflect immediately on the public site.
