
# Trip Architect — AI Chat UI

A pixel-faithful static build of the reference screenshot. Frontend/presentation only, no backend or real AI wiring in this pass.

## Scope

- Single route `/` replacing the placeholder in `src/routes/index.tsx`.
- Full-viewport three-column layout, light theme, blue accent `#2563EB`, Inter font.
- All content hardcoded from the mock (trips, deals, itinerary, tasks, chat message).
- No chat backend, no Cloud, no state persistence — input is a static-looking pill; icons don't need to be functional beyond hover states.

## Layout

```text
┌──────┬──────────────┬────────────────────────┬──────────────┐
│ rail │ trip list    │   center chat panel    │ right panel  │
│ ~72px│ ~330px       │   flex-1               │ ~340px       │
└──────┴──────────────┴────────────────────────┴──────────────┘
```

Root: `h-screen w-screen flex bg-[#f7f8fa] overflow-hidden`. Each column scrolls independently.

## Files

- `src/routes/index.tsx` — assembles the three columns, sets page `head()` (title "Trip Architect — AI Travel Planning", matching description + og tags).
- `src/components/trip-architect/IconRail.tsx` — 72px left rail: paper-plane logo, nav icons (Compass, Star, MapPin, Bookmark, FileText), settings gear + avatar at bottom. Compass active (blue filled square).
- `src/components/trip-architect/TripListPanel.tsx` — search input with filter icon + 4 trip cards.
- `src/components/trip-architect/TripCard.tsx` — avatar/name/time header, title with emoji, date range, thumbnail with weather badge (top-left) and status badge (top-right).
- `src/components/trip-architect/CenterChat.tsx` — top bar, centered intro block, action pills row, assistant greeting, Top Pick card, 3 stat cards, chat input bar.
- `src/components/trip-architect/TopPickCard.tsx` — image with best-match badge, meta row, price, "View Full Plan" button.
- `src/components/trip-architect/StatCard.tsx` — icon + label + value + sublabel.
- `src/components/trip-architect/RightPanel.tsx` — top icon row + New Trip button, then Hot Deals, Itinerary, Price Watcher, Travel Tasks sections.
- `src/components/trip-architect/SectionCard.tsx` — shared rounded-2xl white card wrapper with header (title + optional right slot) used by all right-panel sections.

Existing shadcn primitives reused: `Button`, `Input`, `Avatar`, `Checkbox`, `Badge`, `Separator`. No new shadcn installs required.

## Design tokens

Update `src/styles.css`:
- Load Inter via `<link>` in `src/routes/__root.tsx` head (per Tailwind v4 rule; no `@import` URL in CSS).
- Add `--font-sans: "Inter", ui-sans-serif, system-ui...` in `@theme`.
- Introduce semantic tokens for this page in `:root` (keep light-only for now):
  - `--brand: oklch(0.55 0.22 259)` (≈ #2563EB), `--brand-foreground: oklch(1 0 0)`
  - `--surface: oklch(0.985 0.005 260)` (page bg), `--surface-card: oklch(1 0 0)`
  - `--badge-success`, `--badge-success-foreground` (green), `--badge-warn` (amber), `--badge-danger` (red), `--badge-info` (blue), `--badge-violet` (purple).
- Map them under `@theme inline` (`--color-brand`, etc.) so `bg-brand`, `text-brand`, `bg-badge-success` work.
- Components use these tokens — no hardcoded hex in JSX.

## Content (hardcoded)

Trip cards (in order):
1. Gowtham Choudhary · 09:45 AM · "Spiti Valley Escape 🏔️" · 20 May – 25 May 2025 · 14°C Cloudy · green "Best Weather Match 94%".
2. Kerala Backwaters 🌴 · 12:20 PM · 18 Jun – 22 Jun 2025 · 26°C Light Rain · green "Great Deal ₹12,500 off".
3. Japan Cherry Blossom 🌸 · 08:15 AM · 25 Mar – 02 Apr 2026 · 12°C Clear · violet "Price Watching -₹3,200".
4. Weekend in Goa 🏖️ · Yesterday · 29°C Sunny · blue "Plan Now · 3 deals found".

Center Top Pick: Darjeeling, West Bengal · 3 Days · Mountains · Cool & Cloudy · From ₹10,450 / person including stays & flights · green "Best Weather Match 92%".

Stat cards: Avg Temperature 15°C – 18°C "Perfect for your vibe"; Budget Fit ₹38,250 "Within your budget"; Price Trend "Dropping" "Book in next 2 days".

Right panel:
- Hot Deals: The Orchid Manali (4.6 · 812 reviews · ₹3,450/night · 15% OFF · View on Agoda); Delhi (DEL) → Bagdogra (IXB) IndiGo · Non-stop · 1h 50m · ₹4,120 · Good Price · View on MakeMyTrip.
- Itinerary "3 Days Trip": Day 1 · 20 May Arrive in Darjeeling; Day 2 · 21 May Darjeeling Local Sightseeing; Day 3 · 22 May Trek to Tiger Hill & Departure.
- Price Watcher: Bangalore → Bagdogra (20 May · 1 Adult · Current ₹4,120 · ↓ ₹320 Watching); The Orchid Manali (20 May – 22 May · 2 Nights · ₹6,900/night · ↓ ₹800 Watching).
- Travel Tasks: "Book flights to Bagdogra" By 18 May · Urgent (red); "Pack warm clothes" By 19 May · To-do (blue).

Images: use Unsplash source URLs (stable `images.unsplash.com/photo-...` links) for the trip thumbnails, top-pick hero, and deal thumbnails. Avatars via `i.pravatar.cc` seeds. No file uploads needed.

## Interactions

- Icon-only affordances; no routing. Hover states on all buttons/pills.
- Chat input is a controlled `Input` with local state, but the send button is a no-op (visual only).
- No dark mode this pass.

## Technical notes

- Icons via `lucide-react` (already in the project).
- All colors go through the semantic tokens above — no `text-white`/`bg-[#...]` in components.
- Cards: `rounded-2xl bg-card border border-border/60 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]` via a shared class or inline.
- The page is client-rendered but SSR-safe: no browser globals at module scope, no `useEffect` needed for the static content.
- Verify with the build + a quick preview screenshot before finishing.
