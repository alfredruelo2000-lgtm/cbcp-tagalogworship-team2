# Plan - Admin Navigation & Functional Routes Implementation

This plan focuses on making the existing Radiant Worship admin interface fully functional. We will fix the sidebar navigation, ensure all dashboard routes exist and render correctly, connect dashboard cards to real routes, and implement proper mobile navigation.

## 1. Sidebar Navigation & Active State
- Update `src/components/layout/AdminSidebar.tsx` to:
    - Ensure all links point to the correct `/dashboard/*` routes.
    - Implement `active` state logic using `useLocation` from TanStack Router.
    - Add missing Administration links: Users, Activity Log, Settings.
    - Add missing Account links: My Profile, Sign Out.
    - Ensure mobile responsiveness (already partially there, but needs verification and polish).

## 2. Admin Dashboard Enhancements (`src/routes/_authenticated/dashboard.tsx`)
- Connect summary cards to routes:
    - Upcoming Services → `/dashboard/services`
    - Active Songs → `/dashboard/songs`
    - Team Members → `/dashboard/team`
- Refine Quick Actions:
    - Update buttons to use `Link` to navigate to the respective creation pages (or management pages for now).
    - Ensure permissions are respected using `useAuth`.
- Remove or replace demo content:
    - Connect "Recent Activity" to real data if available, otherwise show a truthful empty state.
    - Connect stats to real mock data lengths.
    - Simplify "System Health" to legitimate system info or a placeholder that isn't misleading.

## 3. Management Page Foundations
- Inspect each `/dashboard/*` page to ensure they follow the editorial ministry aesthetic:
    - `services.tsx`
    - `setlists.tsx`
    - `songs.tsx`
    - `team.tsx`
    - `schedule.tsx`
    - `resources.tsx`
    - `media.tsx`
    - `users.tsx`
    - `activity.tsx`
    - `settings.tsx`
    - `profile.tsx`
- Ensure each has a title, search, filters, and an "Add/Create" button.

## 4. Mobile Navigation Polish
- Verify the `AdminSidebar` toggle works correctly on mobile in `src/routes/_authenticated.tsx`.
- Ensure no horizontal overflow on small screens.

## 5. Authentication & Sign Out
- Verify `signOut` in `use-auth.tsx` correctly clears the Supabase session and redirects to `/login`.
- Ensure the sidebar `Sign Out` button calls this function.

## Technical Details
- Use TanStack Router's `Link` for all internal navigation to maintain SPA state.
- Leverage the existing `useAuth` hook for role-based navigation item visibility.
- Maintain the Navy/Ivory/Gold color palette using existing Tailwind classes and variables.
