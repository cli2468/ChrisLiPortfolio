# Portfolio Progress

## What This Is
React + Vite portfolio site for Chris Li. Single-page architecture with route-based navigation on desktop, one-pager scroll on mobile. Deployed to GitHub Pages.

**Stack:** React 19, Vite 5, Tailwind CSS, Lenis (smooth scroll), React Router, custom CSS with OKLCH color system.

**Fonts:** Clash Display (headlines), Instrument Sans (body).

---

## Sections Built

### Hero
- Typing animation cycling through roles ("web designer", "developer", "early adopter", etc.)
- Interactive ASCII donut — 3D torus with drag rotation, auto-spin, velocity physics
- Wavy dot grid background — canvas-based, mouse-follow distortion, theme-aware

### Work
- 4 visible projects on site: Under Pressure, Mr. Miller's Detailing, Vision, Royal Tea
- Green Witch Cafe kept in code as a hidden mockup toggle for future use
- Desktop: sticky scroll layout with thumbnail cards + info panel, custom "VIEW" cursor on hover
- Mobile: horizontal carousel with swipe gestures, phone frame UI, bottom sheet for details

### About
- Two-column layout with sticky facts sidebar (hometown, school, major, socials)
- Bio, experience timeline (4 roles), categorized skills

### Contact
- CTA button with animated arrow
- Social links (LinkedIn, GitHub, Email)

### Navbar
- Floating glass pill, fixed to top
- Desktop: logo + page links + theme toggle + CTA
- Mobile: logo + theme toggle + CTA (links collapse)

### Footer
- Simple logo + copyright

---

## Key Features

- **Dark/Light mode** — toggle in navbar, persists via localStorage, anti-FOUC inline script, smooth 400ms transition on swap. Light mode uses warm off-white (hue 40) to stay in the same brand family as the dark mode's warm-red tints.
- **Scroll reveal animations** — IntersectionObserver-based, with staggered delays
- **Page transitions** — fade + blur between routes (desktop)
- **Noise overlay** — subtle SVG turbulence texture across the whole page
- **Smooth scroll** — Lenis library
- **Responsive** — 768px breakpoint, fully different layout for mobile vs desktop

---

## Design Identity
- OKLCH color system throughout — warm-tinted neutrals, red accent (`oklch(48% 0.2 24)`)
- All hardcoded dark colors extracted into CSS variables for theme support
- CTA buttons keep light text on red in both themes
- Noise overlay opacity adjusts per theme

---

## Audit & Hardening Pass

Ran a full audit across accessibility, performance, theming, and responsive design. Addressed 22 issues:

### Accessibility (Harden)
- **Skip-nav link + `<main>` landmark** — keyboard/screen reader users can now bypass nav and jump to content
- **`:focus-visible` styles** — added globally with accent-colored outlines on all interactive elements
- **About page heading fix** — bio was incorrectly wrapped in `<h1>`; now uses `<p>` with a proper visually-hidden `<h1>` for a11y
- **ASCII donut ARIA** — gesture area has `role="img"` + `aria-label`, `<pre>` is `aria-hidden`
- **Theme toggle touch target** — increased from 32px to 44px (WCAG 2.5.8)
- **Carousel keyboard navigation** — arrow keys now scroll between cards, ARIA roledescription added
- **Image lazy loading** — all below-fold images now use `loading="lazy"`
- **`prefers-reduced-motion`** — full coverage across page transitions, scroll reveals, cursor blink, canvas wave/spin, and Lenis smooth scroll
- **404 catch-all route** — unknown paths now show a "Page not found" page instead of blank

### Performance (Optimize)
- **Canvas animations pause off-screen** — WavyGrid and AsciiDonut stop their rAF loops via IntersectionObserver when scrolled away
- **Shared `useIsMobile` context** — replaced 4 duplicate resize listeners with a single `MobileProvider` context
- **MaskCounter timeout leak fixed** — nested setTimeout now properly cleaned up on unmount
- **~300 lines of dead code removed** — unused AboutBrief component, mobile-project-sheet CSS, scroll-hint CSS, motivation section CSS

### Theming (Normalize)
- **All colors now OKLCH** — eliminated every `rgba()` and hex value from the stylesheet; everything uses OKLCH or design tokens
- **New `--accent-gradient-start` token** — divider gradients use tokens instead of hard-coded red rgba
- **WavyGrid reads dot color from CSS custom properties** — responds to theme changes via `--grid-dot-rgb` / `--grid-dot-opacity-scale` tokens
- **All px font sizes converted to rem** — respects user browser font scaling preferences
- **Removed `!important` overrides** — fixed `.nav-cta` specificity by scoping `.nav-links a` selector properly

---

## Commit History
1. Initial build — hero, work, about, contact, sticky scroll, carousel
2. GitHub Pages deploy workflow + routing fix
3. Mobile site improvements
4. ASCII donut added to hero
5. Carousel fixes
6. Path updates
7. Light/dark mode system
8. Audit & hardening pass — a11y, performance, theming (most recent work)
