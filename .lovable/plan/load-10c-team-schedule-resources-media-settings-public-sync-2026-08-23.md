# LOAD 10C — Team, Schedule, Resources, Media, Settings & Public Sync

Complete the remaining Admin management modules and synchronize them with the public website using the existing Supabase backend.

## 1. Worship Team Management
- **Routes**: `/dashboard/team` (List), `/dashboard/team/new` (Add), `/dashboard/team/$id` (View/Edit).
- **Functionality**: Functional CRUD for `profiles`.
- **Fields**: Full Name, Photo, Primary/Secondary Roles, Instrument, Vocal Part, Skills, Status, Date Joined, Bio, Internal Notes, Public Visibility.
- **Privacy**: Protect email, phone, and internal notes from public visibility.

## 2. Schedule Team
- **Routes**: `/dashboard/schedule` (Calendar/List), `/dashboard/schedule/new` (Assign).
- **Functionality**: Connect `service_assignments` to real services and team members.
- **Features**: 
    - Upcoming services list/selection.
    - Role assignment (Worship Leader, Vocals, Instruments, Tech).
    - Status management (Pending, Confirmed, Declined).
    - Conflict warnings (if member is already assigned to a conflicting service).

## 3. Resources Management
- **Routes**: `/dashboard/resources` (List), `/dashboard/resources/new` (Create/Edit).
- **Functionality**: Functional CRUD for `worship_resources`.
- **Fields**: Title, Category, Type, Description, Content, Scripture, Tags, Roles, Cover Image, Featured, Status (Draft, Published, Archived), Visibility.
- **Publishing Rules**: Drafts stay hidden; Published+Public appear on the public site.

## 4. Media Library
- **Routes**: `/dashboard/media` (List), `/dashboard/media/new` (Upload/Metadata).
- **Functionality**: Functional CRUD for `media_items` and `media_albums`.
- **Features**:
    - Tabbed filtering (All, Photos, Videos, Audio, Documents).
    - Multi-file upload UI with progress.
    - Metadata association (Album, Event Date, Related Service/Song/Resource).
    - Visibility settings (Public, Team Only, Leaders Only, Private).

## 5. Ministry Settings
- **Route**: `/dashboard/settings`.
- **Functionality**: Functional CRUD for `ministry_settings` (key-value store).
- **Tabs**: 
    - **Identity**: Ministry Name, Vision, Contact, Church Affiliation.
    - **Worship**: Default service types, times, and rehearsal settings.
    - **Branding**: Logo, social links.
    - **Public Site**: Featured songs/resources/media selectors for the homepage.

## 6. Public Website Synchronization
- **Logic**: Ensure all public components use the strict public fetchers in `src/lib/db-public.functions.ts`.
- **Visibility Filters**:
    - **Homepage**: Next Public Service, Featured Songs/Resources/Media.
    - **Team**: Only members with `is_public = true` and `status = 'Active'`.
    - **Media/Resources**: Only items with `visibility = 'Public'` or `is_public = true` and status `Published`.
- **Real-time**: Ensure `queryClient.invalidateQueries` is called on all admin actions to reflect changes immediately on the public site.

## Technical Details
- **Data Layer**: Extend `src/lib/db-resources.functions.ts` and create `src/lib/db-team.functions.ts` and `src/lib/db-settings.functions.ts`.
- **State Management**: TanStack Query (`useQuery`, `useMutation`) for all data operations.
- **Components**: Reuse existing UI patterns for forms, tables, and dashboards.
- **Security**: Maintain RLS policies; ensure internal notes and private contact info are never returned by public fetchers.
