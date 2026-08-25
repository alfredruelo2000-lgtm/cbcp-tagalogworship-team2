# LOAD 8B: Final UX, SEO & Premium Polish Plan

Refining the Radiant Worship website for visual consistency, usability, and professional finishing. This plan focuses on premium ministry identity, mobile/tablet optimization, SEO, and finalizing the remaining placeholder content.

## Design Refinement & Consistency
- Standardize UI tokens in `src/styles.css` (spacing scales, subtle animations, improved typography contrast).
- Ensure all buttons use the `premium` or `accent` variants consistently across public and dashboard views.
- Audit border-radii and shadows to match the "Reverent & Modern" aesthetic.

## Homepage & Navigation Polish
- Refine section rhythm (padding/margins) in `src/routes/index.tsx`.
- Improve active state visibility in `Navbar.tsx` and fix the mobile menu layout.
- Finalize `MinistryIntro.tsx` and `CoreValues.tsx` with optimized content.

## Specialized Views & Accessibility
- Enhance `Musician View`, `Vocalist View`, and `Presentation View` for tablet performance (chord chart layout, font scaling).
- Conduct an accessibility pass: ARIA labels, keyboard focus states, and color contrast checks.
- Add a custom 404 page in `src/routes/__root.tsx`.

## SEO & Identity
- Define unique `head()` metadata (titles, descriptions, OG tags) for all public routes: Worship, Songs, Resources, Media, About, Contact.
- Add a `robots.txt` to prevent indexing of `/dashboard` and `/login`.
- Ensure all placeholder content is replaced with high-quality demo text that reflects ministry values.

## Final UX Touches
- Implement subtle route transitions.
- Refine the `/contact` and `/about` pages from placeholders to complete, professional sections.
- Verify Largest Contentful Paint (LCP) and Cumulative Layout Shift (CLS) through image optimization.

## Technical Details
- **SEO**: Use TanStack Router's `head()` function for per-route metadata.
- **Accessibility**: Use Radix UI primitives' built-in accessibility features where possible; manual audit for custom components.
- **Responsive**: Targeted CSS media queries for common tablet sizes (768px - 1024px) specifically for chord sheets.
