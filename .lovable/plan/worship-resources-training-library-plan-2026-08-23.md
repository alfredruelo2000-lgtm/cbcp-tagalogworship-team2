# Worship Resources & Training Library Plan

Build a comprehensive library of biblical teaching, devotionals, and training materials for the worship team and congregation.

## 1. Data Model (`src/types/resources.ts`)
- Define `WorshipResource` interface with fields for:
  - ID, slug, title, content (HTML/Markdown support)
  - Category (Devotional, Leadership, Musicianship, etc.)
  - Resource Type (Article, Video, PDF, Lesson)
  - Metadata: Author, date, reading time, scripture references, tags
  - Ministry Roles (Worship Leader, Vocalist, Tech, etc.)
  - Status (Draft, Published, Archived) and Featured flag

## 2. Mock Data & Content (`src/lib/mock-resources.ts`)
- Populate with diverse placeholder content:
  - Devotionals (e.g., "The Heart of a Worshipper")
  - Training Lessons (Vocal care, sound basics, lead transitions)
  - Leadership Articles (Biblical foundations)
- Include Scripture connections (Col 3:16, Psalm 95) and tags.

## 3. Library Views (`/resources`)
- **Main Gallery**: Responsive grid with search and category filtering.
- **Featured Section**: Prominent display for high-value resources.
- **Filtering System**: Multi-select filters by Category, Type, and Ministry Role.
- **Resource Cards**: Elegant cards showing metadata (time, type, category).

## 4. Resource Details (`/resources/$id`)
- **Long-form Reader**: Optimized typography for comfortable reading.
- **Scripture Integration**: Display biblical references prominently.
- **Related Content**: Section showing similar resources based on tags/categories.
- **Save/Favorite UI**: Interaction for authenticated members.

## 5. Technical Improvements
- Update `src/routes/_public/resources.tsx` to include the library logic.
- Create `src/routes/_public/resources.$id.tsx` for detail views.
- Add components in `src/components/resources/`:
  - `ResourceCard.tsx`
  - `ResourceFilters.tsx`
  - `ResourceSearch.tsx`
  - `DevotionalContent.tsx` (Specialized layout for devotionals)

## User Review Required
> [!IMPORTANT]
> This load focuses on the **Training & Devotional** content. The full Media Library (Photo/Video/Audio galleries) is reserved for the next phase.
