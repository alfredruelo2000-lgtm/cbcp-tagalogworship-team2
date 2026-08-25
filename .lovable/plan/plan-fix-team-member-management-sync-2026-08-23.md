# Plan - Fix Team Member Management & Sync

Improve team member management in the admin dashboard by clarifying that "Team Members" are personnel profiles (vocalists, guitarists, etc.), not system accounts. Ensure real-time synchronization between admin changes and the public team page.

## User Review Required

> [!IMPORTANT]
> The current "Add Team Member" page asks for an email. I will keep this field but add a clear explanation that this email is for contact purposes and does not automatically create or grant access to a Gmail-based system account.

## Proposed Changes

### Database & Logic
#### [src/lib/db-team.functions.ts]
- Standardize mapping for team members to ensure all fields (bio, primary_role, status, instruments) are correctly handled.
- Ensure `is_public` and `featured` flags are respectably mapped for the public website.

### Admin Workspace
#### [src/routes/_authenticated/dashboard/team/new.tsx]
- Update the layout and text to clearly distinguish between a "Personnel Profile" and a "System Account".
- Add descriptive labels for roles (Vocalist, Guitarist, etc.) as requested.
- Improve the "Account Connection" information block to explain how to link a member to a system account later.

#### [src/routes/_authenticated/dashboard/team.tsx]
- Add a "Public Status" column to the table so admins can see at a glance who is visible on the home page.
- Fix any stale data issues by ensuring TanStack Query keys are consistently invalidated.

#### [src/components/layout/AdminSidebar.tsx]
- Ensure the "Members" link in the "Team" section is clearly labeled to avoid confusion with "User Accounts".

### Public Website Sync
#### [src/routes/_public/team.tsx]
- Ensure the public team directory correctly filters by `is_public: true` and `status: 'Active'`.
- Verify real-time updates when a member is added or modified in the admin dashboard.

## Technical Details
- Using TanStack Query `invalidateQueries` to trigger immediate re-fetches.
- Supabase `profiles` table is used as the primary storage for both system users and team members (linked via `id`).
- Roles will be mapped to the `primary_role` and `skills` (represented as `instruments` in some parts of the UI) columns.
