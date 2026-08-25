# Plan: Fix Team Member Creation and Image Upload

Fix the team member creation flow and image upload functionality to ensure a seamless experience in the admin dashboard and instant sync with the public team page.

## User Review Required

> [!IMPORTANT]
> I will be updating the storage permissions to allow for profile image uploads. If you have specific security requirements for who can upload, please let me know. Currently, I'm granting access to authenticated users for the `personnel-avatars` bucket.

## Proposed Changes

### Database & Storage
- Ensure the `personnel-avatars` storage bucket exists and is set to public.
- Apply RLS policies to the `storage.objects` table to allow authenticated users to `INSERT`, `UPDATE`, and `DELETE` objects in the `personnel-avatars` bucket.
- Allow public `SELECT` access to the `personnel-avatars` bucket for team page visibility.

### Backend Functions
- Update `createMember` in `src/lib/db-team.functions.ts` to include `avatar_url` in the initial insert payload.
- Ensure the `skills` array is correctly derived from the comma-separated `instruments` input.

### UI Enhancements
- Refine `ImageUpload.tsx` to handle potential errors more gracefully and provide clearer feedback if an upload fails.
- Update `team_new.tsx` to include an explicit "Creating..." state while the mutation is in progress.
- Standardize the TanStack Query cache invalidation to ensure the public team page updates immediately.

### Admin Navigation
- Ensure the "Add Team Member" button correctly points to the functional `team_new` route.

## Technical Details

### Storage RLS
```sql
-- Policies for personnel-avatars bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'personnel-avatars');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'personnel-avatars');
CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'personnel-avatars');
```

### Query Invalidation
Invalidate: `['team']`, `['team-members']`, `['team-public']`, and `['dashboard-stats']`.

## Verification Plan

### Automated Tests
- Run Playwright scripts to verify the "Add Team Member" form renders correctly.
- Simulate an image upload to check for errors.
- Verify that the form submission triggers the correct query invalidations.

### Manual Verification
- Manually create a new team member with an image.
- Confirm the new member appears instantly on the public team page.
- Verify the image displays correctly on both admin and public views.
