# Plan - Team Member Management Reliability & Sync

Fixing the team member creation flow to ensure UI stability, real-time public synchronization, and consistent profile image persistence.

## User Review Required

> [!IMPORTANT]
> I will be consolidating the team creation route into `/dashboard/team_new` to resolve a persistent routing conflict that was causing the form to fail to render.

- Does the administrative sidebar need to be updated to show "Personnel" instead of "Team"?
- Should I enable automatic resizing for uploaded profile images to save storage?

## Proposed Changes

### Database & Security
- Ensure `personnel-avatars` storage bucket exists and is public.
- Verify RLS policies on `profiles` and `storage.objects` for image uploads.

### Team CRUD Functions (`src/lib/db-team.functions.ts`)
- Refine error handling in `createMember` and `updateMember` to return descriptive database errors.
- Ensure strict mapping of `instrument` (text) and `skills` (text array) to maintain data integrity.

### Team Creation UI (`src/routes/_authenticated/dashboard/team_new.tsx`)
- Restore full administrative styling and icons.
- Add descriptive inline error messages under form fields.
- Implement clear loading states during image upload and member creation.
- Ensure TanStack Query invalidation triggers a full refresh of the public team roster.

### Team Management List (`src/routes/_authenticated/dashboard/team.tsx`)
- Update the "Add Team Member" button to link to `/dashboard/team_new`.

## Technical Details
- **Route Consolidation**: Using `team_new.tsx` avoids TanStack Router's path shadowing issue where nested `new.tsx` was failing to match.
- **Storage Integration**: `ImageUpload` will use the `personnel-avatars` bucket.
- **Query Invalidation**: `['team']`, `['team-public']`, and `['dashboard-stats']` will be invalidated on success.

## Verification Plan
- **Automated Check**: Use Playwright to verify form rendering at `/dashboard/team_new`.
- **Manual Verification**: Create a test member with an image and confirm it appears instantly on the public `/team` page.
- **Error Handling**: Attempt to save without required fields and verify inline error visibility.
