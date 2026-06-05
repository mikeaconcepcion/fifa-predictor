# Project Memory Index

## Infrastructure
- [Deployment](../CLAUDE.md) — Vercel + Supabase refs, env vars, cron setup
- [Design system](design.md) — colours, fonts, image rules, component patterns
- [Lessons learned](lessons.md) — bugs fixed, gotchas, decisions made

## Key decisions
- football-data.org over API-Football (free WC 2026 data; API-Football free tier doesn't cover 2026)
- Invite-code only groups (no search) — keeps groups private and simple
- Picks lock per-match at kickoff, not per-stage
- Exact score bonus only on the Final (see `calcPoints` in `lib/utils.ts`)
- Profile fallback creation in `app/(app)/page.tsx` using service role if trigger silently fails

## Current state (as of June 2026)
- Auth: email/password working; Google OAuth built but not confirmed working end-to-end
- 72 Group Stage fixtures synced from football-data.org
- Scoring/grading built; cron running daily (use cron-job.org for match-day frequency)
- Groups: create + join by invite code working; RLS infinite recursion fixed
- UI: full-page stadium background on auth pages, frosted glass form card
