# Plan: Google Login & Super Admin Bootstrap

Implement secure Google authentication and a robust first-admin bootstrap system for the Praise & Worship website.

## Database & Security (Supabase)
- **Enum Updates**: Add `Pending` and `Suspended` to `member_status`. Add `worship_director` to `app_role`.
- **Initial Admin Config**: Create `initial_super_admin_setup` table to store the authorized owner email.
- **Auth Trigger**: Implement a PostgreSQL trigger on `auth.users` to automatically:
    - Create a profile in `public.profiles` using Google metadata (name, email, avatar).
    - If the user's email matches the authorized owner, grant `super_admin` role.
    - Default all other new users to `viewer` role and `Pending` status.
- **RLS & Grants**: Ensure proper permissions for the new `initial_super_admin_setup` table (internal only).

## Authentication & Frontend Logic
- **Login UI**: Add a prominent "Continue with Google" button above the email form in `src/routes/_public/login.tsx`.
- **Auth Hook**: Update `useAuth` to track user `status` and `isPending` state.
- **Route Guard**: Modify the `_authenticated` layout to redirect users with `Pending` status to a dedicated "Awaiting Approval" notice.
- **Awaiting Approval UI**: Create `src/routes/_authenticated/awaiting-approval.tsx` with a clean, reverent message for new sign-ups.

## Admin Dashboard (User Management)
- **User Directory**: Enhance `src/routes/_authenticated/dashboard/users.tsx` to:
    - Display authentication provider (Google vs. Email).
    - Allow Super Admins to toggle statuses (Active, Suspended, Pending).
    - Manage role assignments using the expanded `app_role` system.
- **Audit Logs**: Ensure role/status changes are recorded in `audit_logs`.

## Technical Details
- **OAuth Flow**: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/auth/callback' } })`.
- **Redirects**: Users will land on `/dashboard` if approved, or `/awaiting-approval` if new/pending.
- **Security**: The Super Admin email is stored in a database table, not hardcoded in the frontend.

## User Configuration Steps (Post-Implementation)
- Provide instructions for enabling Google Provider in Supabase dashboard.
- Provide the Redirect URL to be added to Google Cloud Console.
- Instruction on how to insert the first owner email into the setup table.
