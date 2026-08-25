# Plan: Supabase CRUD & Real Database Integration

Implement full CRUD functionality for the Worship Ministry Administration platform by connecting the frontend modules to the backend database.

## 1. Database Schema Completion
Create missing tables and enums to support the ministry's features while preserving existing profiles and roles.

### Schema Details
- **Enums:** `song_status`, `song_type`, `language`, `service_type`, `setlist_status`, `assignment_status`, `resource_status`, `media_type`, `visibility_level`.
- **Tables:**
  - `songs`: Repertoire management (title, artist, chords, etc.).
  - `services`: Service planning (date, time, theme, leader).
  - `service_items`: Flow components (songs, prayers, sermon).
  - `service_assignments`: Team scheduling (member, role, status).
  - `worship_resources`: Training and devotionals.
  - `media_items`: Media library (photos, videos, audio).
  - `media_albums`: Collections of media.

## 2. CRUD Implementation
### Services & Setlists
- Connect `/dashboard/services` and `/dashboard/setlists` to real database queries.
- Implement "Create Service" and "Edit Setlist" with reordering and duration tracking.

### Song Library
- Connect `/dashboard/songs` to the `songs` table.
- Implement search, filters, and full song metadata management.

### Team & Schedule
- Connect `/dashboard/team` to `profiles` and `user_roles`.
- Implement scheduling and assignment confirmations with real-time status updates.

### Resources & Media
- Connect `/dashboard/resources` to `worship_resources`.
- Implement media uploads and metadata management using Supabase Storage.

## 3. Dashboard Real-Time Overview
- Replace all mock counters (Active Songs, Upcoming Services, etc.) with real-time aggregated counts.
- Connect "Recent Activity" to the existing `audit_logs` table.

## Technical Details
- **RLS Policies:** Grant permissions to `authenticated` roles (`ministry_admin`, `worship_leader`, etc.).
- **Data Integrity:** Use UUIDs and proper foreign key relationships (e.g., `Song -> ServiceItem`).
- **User Feedback:** Unified `sonner` notifications for loading, success, and error states.
- **Optimistic Updates:** Use TanStack Query for smooth UI transitions during CRUD operations.

## User Review Required
- **Existing Data:** I will migrate existing `profiles` and `user_roles` data seamlessly.
- **Storage:** I will use the default Supabase Storage bucket for media.
