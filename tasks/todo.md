# TODO

## Before June 11 (Tournament Start) — PRIORITY
- [ ] **Confirm Google OAuth end-to-end** — tested from deployed site, not localhost
- [ ] **Set up cron-job.org** — call `/api/matches/sync` and `/api/matches/grade` every 5 min with `Authorization: Bearer {CRON_SECRET}` header during match days (Vercel hobby only allows daily)
- [ ] **Verify CRON_SECRET is set in Vercel** — check Environment Variables in Vercel dashboard

## Auth / Users
- [ ] Disable email confirmation requirement in Supabase (Auth → Providers → Email → uncheck "Confirm email") so users can sign up without waiting for email — or keep and make UX clear
- [ ] Handle case where Google user's email already exists as email/password account (Supabase merges them but worth testing)

## Picks & Scoring
- [ ] Add exact score input to PickSheet UI (currently only home/draw/away — exact score fields exist in DB but no UI)
- [ ] Show points breakdown on "My Picks" page (earned vs possible)
- [ ] Grade trigger: after grading, re-sort leaderboard (currently just updates profile totals — leaderboard query already orders by total_points)

## Groups
- [ ] Group leaderboard page — show members ranked within the group
- [ ] Show who made which pick after match is locked (social/fun feature)

## Matches
- [ ] Knockout stage: once Round of 32 teams are confirmed (after group stage), sync will auto-populate — no manual work needed
- [ ] Add match venue display (currently null — football-data.org doesn't provide it on free tier)
- [ ] Push notifications when a match is about to kick off (reminder to make pick) — requires web push setup

## UX / Polish
- [ ] Loading skeletons on match list (currently blank while fetching)
- [ ] Empty state on "My Picks" page when user has no picks yet
- [ ] Profile page: show group invite code more prominently — users need to share it with friends
- [ ] Add a "How to play" / rules page explaining the scoring system
- [ ] SEO / og:image for sharing the app link

## Infrastructure
- [ ] Set up Supabase database backups (free tier has point-in-time recovery disabled)
- [ ] Monitor football-data.org rate limits (free tier = 10 req/min) — sync route is fine but don't hammer it

## Done ✓
- [x] Email/password auth + email confirmation
- [x] Google OAuth setup (Supabase + Google Cloud Console)
- [x] DB trigger for profile auto-creation + fallback in page.tsx
- [x] 72 Group Stage fixtures synced from football-data.org
- [x] Pick locking at kickoff
- [x] Scoring/grading route (`/api/matches/grade`)
- [x] Vercel daily cron for sync + grade
- [x] Groups: create, join by invite code, RLS infinite recursion fix
- [x] Global leaderboard
- [x] Full-page stadium background UI on auth pages
- [x] Transparent trophy PNG (background removed with PIL)
- [x] Bottom nav pick sheet z-index fix (Lock In Pick button visible above nav)
- [x] Root boilerplate page.tsx removed (was overriding dashboard)
