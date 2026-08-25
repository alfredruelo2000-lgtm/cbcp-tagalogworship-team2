# Plan: LOAD 7B - Admin Content Management, Audit Logs & Ministry Settings

Complete the administration experience by building management screens, audit logs, and settings.

## 1. Database & Schema Foundation
- Add `audit_logs` table to Supabase via migration.
- Add `ministry_settings` table to Supabase via migration.
- Enable RLS and add GRANTs for new tables.
- Update `profiles` to support linkage with `worship_team` members if not already handled.

## 2. Admin Dashboard & Navigation
- Update `AdminSidebar.tsx` with missing links (Services, Setlists, Users, Settings, Activity Log).
- Enhance `dashboard.tsx` with an overview of ministry activity (Recent Activity, Summary Cards).
- Implement "Quick Actions" based on user roles.

## 3. Content Management Screens
- **Song Management**: List view with status/theme filtering, plus Add/Edit forms.
- **Service & Setlist Management**: Management interface for planning, statuses, and team assignments.
- **Team Management**: Admin view for members, role/skill updates, and availability review.
- **Resource Management**: Draft/Publish workflow for training content and devotionals.
- **Media Management**: Metadata editing, album assignment, and visibility controls.

## 4. Audit & Logging
- Implement a read-only `Activity Log` page for administrators.
- Create a utility for logging admin actions (e.g., `logAuditAction`).
- Ensure sensitive data (passwords, secrets) is never logged.

## 5. Ministry Settings
- Build a tabbed `Settings` page:
  - **Ministry Identity**: Name, logo, mission.
  - **Worship Settings**: Default service times, keys, rehearsal defaults.
  - **User Management**: Searchable directory, role editing, account statuses.

## 6. Technical Details
- **Archiving**: Implement soft-delete (archiving) for critical records.
- **Validation**: Use Zod for all admin form inputs.
- **Performance**: Use consistent loading states and optimistic updates where appropriate.
- **Security**: Strict RLS enforcement and role-based UI gating.

## 7. Verification Plan
- **Manual QA**: Test login/logout, route protection, and content CRUD flows.
- **Role Testing**: Verify that Team Members cannot access Super Admin settings.
- **Mobile Responsive**: Ensure the admin sidebar and tables adapt to mobile viewports.
