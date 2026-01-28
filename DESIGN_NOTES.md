# Design Notes

## Stack
- Next.js 15 (App Router) + React 19
- Tailwind CSS 3 with CSS variables in `hub-frontend/app/globals.css`
- Next/font (Manrope for body, Space Grotesk for display)
- Framer Motion used in the roadmap timeline

## Design System (Final)
### Colors
- Backgrounds: `--bg`, `--surface`, `--surface2`
- Text: `--text`, `--muted`
- Accents: `--gold`, `--gold2`, `--gold3`, metallic `--silver` tones
- Plan tones: `--tone-bronze`, `--tone-platinum`, `--tone-gold` (plus variants)
- Status: `--success`, `--danger`, `--warning`

### Typography
- Display: Space Grotesk (`.font-display`)
- Body: Manrope (`.font-sans`)
- Scale: `text-hero`, `text-hero-sub`, `text-h2`, `text-h3`, `text-title-lg`, `text-body`, `text-small`, `text-eyebrow`

### Spacing
- Section rhythm uses 4/8-based spacing with consistent `gap` and `p` values

### Radius + Shadows
- Radius: `rounded-card` (20px), `rounded-control` (14px), `rounded-pill`
- Shadows: `shadow-soft` for base surfaces, `shadow-glow` for hover/accent

### Components
- `Card`, `CardBody`, `Button`, `Badge`, `Pill`, `SectionHeading`

## Key Improvements
- Unified hero, features, sample alerts, performance, and roadmap typography to the new scale
- Standardized card and pill styles and moved repeated glow styles into global utility classes
- Simplified pricing header and plan cards, with a consistent "Best Value" highlight
- Mobile nav tightened with responsive visibility and a clear CTA
- Removed unused UI components and inline style blocks to reduce clutter

## TODO / Next Steps
- Run linting/formatting if a script is added
- Visual QA on dashboard and billing pages at mobile/tablet/desktop widths
