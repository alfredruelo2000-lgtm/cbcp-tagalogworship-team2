### Worship Team Assignments Implementation Plan

1.  **Data Infrastructure Extension (Done)**
    *   Update `TeamMember` type with `availability`.
    *   Update `WorshipSetlist` type with `assignments`, `rehearsalInfo`, and `callTimes`.
    *   Update mock data for testing.

2.  **Service Planner Integration (`src/routes/_public/setlists.$id.tsx`)**
    *   Add "Team" tab to the service detail page.
    *   Implement role slot definition UI.
    *   Create assignment interface with member picker.
    *   Implement role matching (skills) and conflict detection (availability/overlap).
    *   Group roster by category (Worship Leaders, Vocals, Musicians, Technical).

3.  **Availability & Scheduling Views**
    *   Create `/dashboard/availability` (Team Member view).
    *   Create `/team/schedule` (Leader view - Calendar/List).
    *   Implement "My Schedule" on member profiles and dashboard.

4.  **Rehearsal & Print Tools**
    *   Add rehearsal metadata fields to service settings.
    *   Implement clean print stylesheet for the roster.

5.  **Mobile Optimization**
    *   Ensure all new assignment and schedule views are responsive.
