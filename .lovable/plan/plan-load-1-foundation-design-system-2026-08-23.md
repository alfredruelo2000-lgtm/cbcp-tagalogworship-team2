# Plan - Load 1: Foundation & Design System

Establish the premium design system and architectural foundation for a professional Praise & Worship Ministry website.

## Design System & Global Styles

- **Color System**: Update `src/styles.css` with a sophisticated palette:
    - Deep Navy (`oklch(0.25 0.05 260)`) for headers/footers.
    - Warm Ivory (`oklch(0.98 0.02 85)`) for main backgrounds.
    - Muted Gold (`oklch(0.75 0.12 85)`) as a careful accent.
- **Typography**: Set up Playfair Display for headings and Inter for body text with clear hierarchical rules.
- **Button System**: Define semantic variants (Primary, Secondary, Outline, Text) in Tailwind.

## Navigation & Layout Structure

- **Responsive Header**:
    - Desktop: HOME, WORSHIP, SONGS, SETLISTS, TEAM, RESOURCES, MEDIA, ABOUT, CONTACT + "Team Login" CTA.
    - Mobile: Clean slide-out navigation.
- **Footer**: Sophisticated layout with ministry identity, quick links, contact info, and Psalm 150:6.
- **Root Layout**: Implement `<Navbar />` and `<Footer />` in `src/routes/__root.tsx`.

## Information Architecture (Routing)

- Create pathless layout for public routes (`_public`) to ensure consistency.
- Prepare placeholder routes for:
    - `/worship`, `/songs`, `/songs/:id`, `/setlists`, `/team`, `/resources`, `/media`, `/about`, `/contact`.
    - `/login` and `/dashboard` (future-proof placeholders).

## Reusable Component Library

- **Typography**: `ScriptureBlock`, `SectionHeading`.
- **Containers**: `HeroSection`, `ContentContainer`.
- **UI Atoms**: Refined `Button`, `Card` treatments matching the reverent aesthetic.

## Technical Details

- **Tailwind v4**: Use `@theme` for design tokens.
- **TanStack Start**: Leverage file-based routing and loaders.
- **Accessibility**: Semantic HTML, ARIA labels, and WCID contrast compliance.
- **Clean Architecture**: Modular components in `src/components/layout` and `src/components/ui`.
