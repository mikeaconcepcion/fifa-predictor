@AGENTS.md

# FIFA World Cup 2026 Predictor — Project Guide

## What This Is
A mobile-first web app where users predict World Cup 2026 match outcomes, earn points, and compete in private friend groups. Built for young football fans.

## Live URLs
- **App:** https://fifa-predictor-kappa.vercel.app
- **Vercel project:** mikeaconcepcion-3155s-projects/fifa-predictor
- **Supabase ref:** bjwwxnlmquzpxajbhyar (org: WorkoutWithMike)

## CRITICAL: Next.js 16 Breaking Changes
- Middleware is **`proxy.ts`** at the project root, NOT `middleware.ts`
- The exported function is `proxy()`, NOT `middleware()`
- Never create `middleware.ts` — it conflicts with `proxy.ts` and breaks the build
- Read `node_modules/next/dist/docs/` before using any Next.js API

## Tech Stack
- Next.js 16.2.7 — App Router, Turbopack
- React 19.2.4
- Tailwind v4 — `@theme inline` in `globals.css`, no `tailwind.config.js`
- Supabase — auth (email + Google OAuth), Postgres, RLS
- Vercel — hosting + daily cron (hobby plan = daily only)
- football-data.org API v4 — free tier, WC 2026 fixtures + live scores

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=https://fifa-predictor-kappa.vercel.app
FOOTBALL_DATA_KEY          # football-data.org API key
CRON_SECRET                # Shared secret for sync/grade endpoints
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

## Database Schema
```
profiles      id, display_name, avatar_url, total_points, correct_picks, exact_scores
matches       id, api_id, home_team, away_team, home_logo, kickoff_at, stage,
              group_name, home_score, away_score, status (NS/LIVE/FT/PST)
picks         id, user_id, match_id, prediction (home/draw/away),
              pred_home_score, pred_away_score, points_earned
groups        id, name, invite_code, admin_id
group_members id, group_id, user_id
```

## Scoring
- Correct outcome: **3 pts**
- Correct outcome + exact scoreline (Final only): **5 pts**
- Wrong prediction: **0 pts**
- Picks lock at kickoff — `isLocked()` in `lib/utils.ts`
- Grade endpoint only touches picks where `points_earned IS NULL` (safe to re-run)

## Match Data Flow
1. `GET|POST /api/matches/sync` — fetches from football-data.org, upserts all matches with confirmed teams
2. `GET|POST /api/matches/grade` — grades ungraded picks on FT matches, updates profile totals
3. Both require `Authorization: Bearer {CRON_SECRET}` header
4. Vercel cron: daily at 2am/3am UTC. Use cron-job.org for every-5-min during tournament

## Auth Flow
- Email signup → confirm email → log in
- Google OAuth: app → Supabase → Google → `/api/auth/callback` (exchanges code, sets cookies on NextResponse) → `/`
- `proxy.ts` refreshes session every request; redirects unauthenticated users to `/login`
- Profile created by `on_auth_user_created` DB trigger; fallback in `app/(app)/page.tsx` via service role

## RLS Rules
- `matches`: anyone reads; service role writes
- `picks`: authenticated reads all; writes own only
- `groups`/`group_members`: use `is_group_member()` security-definer function (avoids infinite recursion)
- Trigger `handle_new_user()` must be owned by `postgres` to bypass RLS

## Hard Rules
1. **Never create `middleware.ts`** — proxy.ts only
2. **Never read/analyse images via API** — drop in `public/`, reference as `/filename.ext`
3. **Images must be git-committed** before deploying — Vercel only serves tracked files
4. **OAuth callback** sets cookies on `NextResponse`, not via `cookies()` from `next/headers`
5. Use **service role** for any write bypassing RLS
6. Run `npm run build` before deploying



7. **Scoring system**: Correct outcome = 3 pts. Exact scoreline on the Final only = 5 pts. This is intentional — do not change it without explicit instruction.
8. **Never use API-Football** — use football-data.org only. Header is `X-Auth-Token`.
9. **Prompts folder**: Full feature prompts are stored in `/prompts/`. Read them before building new features.
10. **One feature at a time**: Build and confirm each feature works before starting the next one.


