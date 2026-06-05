# Design System

## Target Audience
Young football fans (teens–30s). The UI should feel exciting, premium, and sport-focused — not like a generic app.

## Colours
```
Background:   #080c14  (near-black navy)
Card:         #0f1923
Elevated:     #1a2535
Gold:         #f59e0b  (FIFA gold — primary accent)
Gold dim:     #92600a
Green:        #22c55e  (correct pick / open)
Red:          #ef4444  (live / wrong)
Blue bright:  #38bdf8
Text primary: #f1f5f9
Text secondary: #94a3b8
Text muted:   #475569
Border:       rgba(255,255,255,0.08)
```

## Fonts
- **Bebas Neue** — all headings, scores, large numbers, "WORLD CUP 2026"
- **Inter** — all body text, labels, buttons
- Loaded via `next/font/google` in `app/layout.tsx`
- Use `font-[family-name:var(--font-bebas)]` in Tailwind for Bebas

## Auth Pages (Login / Signup)
- **Full-page stadium background** (`/stadiumnight2.jpg`) using `position: fixed`
- Semi-transparent dark overlay: `bg-[#080c14]/55`
- **No fade** on the stadium image — user explicitly prefers full image visible
- Trophy image (`/trophy.png`) centred at top — transparent PNG, no blend mode
- Form in a frosted glass card: `bg-[#080c14]/70 backdrop-blur-sm rounded-2xl border border-white/10`
- Host nation flags (flagcdn.com) shown below the trophy

## Dashboard (Home)
- Stadium crowd photo (`/Stadiumcrowd.jpg`) as hero banner with dark overlay
- Next match card with team logos, countdown timer, pick CTA
- Live match banner with red pulse dot when matches are in play
- Stats grid: Points / Correct / Exact in gold Bebas numerals

## Match Cards
- Grouped by stage
- Team crests from football-data.org (SVG crests)
- Status badge: Open (green) / Locked / Live (red) / FT

## Pick Sheet
- Bottom sheet slide-up with backdrop blur
- Three buttons: Home / Draw / Away
- Selected state: gold background `bg-[#f59e0b] text-[#080c14]`
- "Lock In Pick" button — needs `pb-28` on the sheet to clear the bottom nav bar

## Bottom Navigation
- Fixed at bottom with safe-area padding
- 5 tabs: Home / Matches / My Picks / Standings / Profile
- Active tab: gold icon + label
- Height: ~64px + safe-area

## Cards / Containers
- `bg-[#0f1923] border border-white/8 rounded-2xl` — standard card
- `bg-[#1a2535] rounded-xl` — elevated/nested card
- `rounded-2xl` everywhere — no sharp corners

## Image Rules
- **Never base64-encode or read images via API.** Drop in `public/`, use `/filename.ext` as `src`.
- **Must be git-committed** before deploying or Vercel won't serve them.
- Background images: `object-cover object-center` + dark overlay + all content `relative z-10`
- Transparent PNGs preferred for logos/trophies — use Python PIL to strip backgrounds if needed

## Tone
- Labels in UPPERCASE tracking-widest (`text-xs font-semibold uppercase tracking-widest`)
- Large numbers in Bebas (scores, points, countdown)
- Minimal text — let the UI speak
- Error states in `#ef4444`, success in `#22c55e`
