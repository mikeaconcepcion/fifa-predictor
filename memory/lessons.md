# Lessons Learned

## Next.js 16
- **Middleware is `proxy.ts`**, not `middleware.ts`. Creating `middleware.ts` causes a build error: "Both middleware file and proxy file are detected."
- Route groups like `(app)` and `(auth)` are transparent to routing. If `app/page.tsx` exists alongside `app/(app)/page.tsx`, the root one wins — delete the boilerplate `app/page.tsx`.
- Static prerendering can silently break auth-gated pages. Run `npm run build` and check that `/` shows as `ƒ` (dynamic), not `○` (static).

## Supabase Auth
- **OAuth callback must set cookies on `NextResponse`**, not via `cookies()` from `next/headers`. The pattern: create supabase client with `getAll: () => req.cookies.getAll()` and `setAll: (list) => list.forEach(({name,value,options}) => response.cookies.set(...))`, then return the response after `exchangeCodeForSession`.
- **"Database error saving new user"** = the `on_auth_user_created` trigger is failing. Wrap the INSERT in a nested `BEGIN...EXCEPTION WHEN OTHERS THEN NULL; END` block so a trigger failure never blocks user creation.
- The trigger must be owned by `postgres` (`ALTER FUNCTION handle_new_user() OWNER TO postgres`) to bypass RLS.
- Google OAuth metadata uses `name` not `full_name` — always COALESCE both.

## Supabase RLS
- **Infinite recursion in `group_members` policy**: a policy that SELECTs from the same table it's protecting will recurse infinitely. Fix: create a `SECURITY DEFINER` helper function that bypasses RLS, use that in the policy instead.
- `SECURITY DEFINER` functions bypass RLS only if owned by a role with `BYPASSRLS` (e.g. `postgres`).

## Vercel
- **Only git-tracked files are deployed.** Images dropped in `public/` must be `git add`-ed and committed before `vercel --prod`.
- **Hobby plan = daily cron only.** Any cron expression that fires more than once per day is rejected at deploy time. Use cron-job.org for higher frequency.
- Always `cd` into the correct project directory before `git` or `vercel` commands — the shell CWD resets between Bash tool calls.

## Images
- Do NOT base64-encode images or read them via API calls. Drop in `public/` and reference as `/filename.ext` in `src`.
- To remove a white background from a JPEG: use Python PIL — sample corner pixels, compute distance from white, set alpha=0 where distance < threshold, save as PNG.
- `mix-blend-mode: screen` removes dark backgrounds. `mix-blend-mode: multiply` removes white backgrounds. Both fail if background isn't close to pure black/white.
- `mix-blend-mode: multiply` on a gold trophy over a dark stadium makes the trophy invisible — don't use it that way.

## football-data.org
- Free tier covers WC 2026 (unlike API-Football free tier which does not).
- Knockout stage matches have null team names until teams are confirmed — filter with `.filter(f => f.homeTeam.name && f.awayTeam.name)` before upsert.
- Header: `X-Auth-Token`, not `Authorization: Bearer`.

## Tailwind v4
- No `tailwind.config.js` — tokens defined in `globals.css` under `@theme inline`.
- Use inline hex values (`bg-[#080c14]`) for one-offs rather than adding to the theme.

### Images (additional)
- PNG files renamed to `.jpg` are still detected as PNG by the API — always convert properly using Preview (File → Export → JPEG) or Python PIL
- Claude Code will try to read/analyze images via API if they're mentioned in conversation — always say "do NOT read or analyze this image, just reference it as a static asset"
- After converting images, always run `git add public/` and commit before deploying or Vercel won't serve them

### Claude Code Behavior
- If Claude Code gets stuck in a loop (same error repeating), press Ctrl+C and start a fresh session with `claude`
- In a new session, explicitly state what NOT to do upfront — e.g. "do not read images via API"
- Claude Code reads files by path — store prompts in `/prompts/` folder and reference them with "read ./prompts/filename.md"

### API-Football
- API-Football free tier does NOT cover World Cup 2026 — use football-data.org instead
- football-data.org auth header is `X-Auth-Token`, not `Authorization: Bearer`
