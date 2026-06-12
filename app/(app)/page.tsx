import { createSupabaseServerClient } from '@/lib/supabase';
import { createServiceClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Match } from '@/lib/types';
import LocalTime from '@/components/LocalTime';
import CountdownTimer from '@/components/CountdownTimer';
import StatsStrip from '@/components/StatsStrip';
import ScrollReveal from '@/components/ScrollReveal';
import SpoilerScore from '@/components/SpoilerScore';

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  // If trigger silently failed, create profile now using service role
  if (!profile) {
    const service = createServiceClient();
    const displayName =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email?.split('@')[0] ??
      'User';
    await service.from('profiles').insert({
      id: user.id,
      display_name: displayName,
      avatar_url: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
    }).single();
    const { data: newProfile } = await service.from('profiles').select('*').eq('id', user.id).single();
    profile = newProfile;
  }

  // All three statuses fetched in parallel
  const [
    { data: liveMatches },
    { data: nextMatch },
    { data: recentMatches },
  ] = await Promise.all([
    supabase.from('matches').select('*').eq('status', 'LIVE').order('kickoff_at', { ascending: true }),
    supabase.from('matches').select('*').eq('status', 'NS').order('kickoff_at', { ascending: true }).limit(1).maybeSingle(),
    supabase.from('matches').select('*').eq('status', 'FT').order('kickoff_at', { ascending: false }).limit(5),
  ]);

  // Featured match: prioritise live, fall back to next upcoming
  const featured = (liveMatches && liveMatches.length > 0) ? liveMatches[0] : nextMatch;
  const upcoming = nextMatch; // kept for the Next Match label logic

  // User's pick for featured match
  const { data: upcomingPick } = featured ? await supabase
    .from('picks')
    .select('*')
    .eq('user_id', user.id)
    .eq('match_id', featured.id)
    .maybeSingle() : { data: null };

  // Activity feed: recently graded picks
  const { data: gradedPicks } = await supabase
    .from('picks')
    .select('*, matches!inner(home_team, away_team, home_score, away_score, status)')
    .eq('user_id', user.id)
    .not('points_earned', 'is', null)
    .order('created_at', { ascending: false })
    .limit(3);

  // Matches kicking off within 24h with no pick
  const in24h = new Date(Date.now() + 86400000).toISOString();
  const { data: unpickedSoon } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'NS')
    .lte('kickoff_at', in24h)
    .order('kickoff_at', { ascending: true })
    .limit(5);

  // Fetch picks for the soon-kicking-off matches to show confirmed/missing status
  const unpickedSoonIds = (unpickedSoon ?? []).map((m: Match) => m.id);
  const { data: soonPicks } = unpickedSoonIds.length > 0
    ? await supabase.from('picks').select('match_id, prediction, pred_home_score, pred_away_score').eq('user_id', user.id).in('match_id', unpickedSoonIds)
    : { data: [] };

  const soonPickMap: Record<number, { prediction: string; predHome: number | null; predAway: number | null }> = {};
  for (const p of (soonPicks ?? [])) {
    soonPickMap[(p as any).match_id] = {
      prediction: (p as any).prediction,
      predHome: (p as any).pred_home_score,
      predAway: (p as any).pred_away_score,
    };
  }

  const pickedMatchIds = new Set([
    ...(soonPicks ?? []).map((p: any) => p.match_id),
    ...(gradedPicks ?? []).map((p: any) => p.match_id),
  ]);
  const unpickedSoonFiltered = (unpickedSoon ?? []).filter((m: Match) => !pickedMatchIds.has(m.id));

  // YouTube highlights — most recently finished matches
  type YTVideo = { id: string; title: string; thumbnail: string; channelTitle: string };
  let highlights: YTVideo[] = [];
  const youtubeKey = process.env.YOUTUBE_API_KEY;
  if (youtubeKey && recentMatches && recentMatches.length > 0) {
    try {
      const q = encodeURIComponent(`${recentMatches[0].home_team} ${recentMatches[0].away_team} World Cup 2026 highlights`);
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${q}&type=video&maxResults=6&order=relevance&key=${youtubeKey}`,
        { next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const data = await res.json();
        const trustedChannels = ['fifa', 'espn fc', 'espnfc', 'espn', 'dazn spain', 'dazn'];
        const all: YTVideo[] = (data.items ?? []).map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url,
          channelTitle: item.snippet.channelTitle,
        }));
        const trusted = all.filter(v =>
          trustedChannels.some(ch => v.channelTitle.toLowerCase().includes(ch))
        );
        highlights = trusted.length > 0 ? trusted : all;
      }
    } catch { /* non-critical */ }
  }

  // Guardian news — World Cup 2026 + user's favourite teams
  type NewsArticle = { id: string; webTitle: string; webUrl: string; thumbnail?: string; trailText?: string };
  let newsArticles: NewsArticle[] = [];
  const guardianKey = process.env.GUARDIAN_API_KEY;
  if (guardianKey) {
    try {
      const favTeams = profile?.favorite_teams as string[] | null;
      const teamQuery = favTeams?.length ? ` OR ${favTeams.slice(0, 3).join(' OR ')}` : '';
      const q = encodeURIComponent(`"World Cup 2026"${teamQuery}`);
      const res = await fetch(
        `https://content.guardianapis.com/search?q=${q}&section=football&show-fields=thumbnail,trailText&order-by=newest&page-size=8&api-key=${guardianKey}`,
        { next: { revalidate: 1800 } }
      );
      if (res.ok) {
        const data = await res.json();
        newsArticles = (data.response?.results ?? []).map((a: any) => ({
          id: a.id,
          webTitle: a.webTitle,
          webUrl: a.webUrl,
          thumbnail: a.fields?.thumbnail,
          trailText: a.fields?.trailText,
        }));
      }
    } catch { /* non-critical */ }
  }

  return (
    <div className="flex flex-col">

      {/* ── Tournament Hero Banner ── */}
      <div className="relative overflow-hidden pt-14 pb-6 px-4">
        {/* Stands background */}
        <img src="/Stadiumcrowd.jpg" alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#080c14]/75" />
        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #080c14)' }} />

        <div className="relative z-10 flex items-center justify-between">
          {/* Left: greeting */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b]">Welcome back</p>
            <h1 className="font-[family-name:var(--font-bebas)] text-3xl text-[#f1f5f9] tracking-wide mt-0.5">
              {profile?.display_name ?? 'Predictor'}
            </h1>
            {profile?.favorite_teams?.length > 0 && (
              <div className="flex items-center gap-1 mt-1">
                {(profile.favorite_teams as string[]).slice(0, 5).map((team: string, i: number) => (
                  profile.favorite_team_logos?.[i] && (
                    <img key={team} src={(profile.favorite_team_logos as string[])[i]}
                      alt={team} className="size-5 object-contain" title={team} />
                  )
                ))}
              </div>
            )}
          </div>
          {/* Right: trophy + points */}
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 80 96" className="w-12 h-14 mb-1" fill="none">
              <path d="M16 6h48v36c0 18-12 28-24 30-12-2-24-12-24-30V6z" fill="#f59e0b"/>
              <path d="M16 10c-6 0-10 4-10 14 0 8 4 14 10 16" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" fill="none"/>
              <path d="M64 10c6 0 10 4 10 14 0 8-4 14-10 16" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" fill="none"/>
              <rect x="34" y="72" width="12" height="12" fill="#f59e0b"/>
              <rect x="26" y="84" width="28" height="6" rx="3" fill="#f59e0b"/>
            </svg>
            <p className="font-[family-name:var(--font-bebas)] text-3xl text-[#f59e0b] leading-none">{profile?.total_points ?? 0}</p>
            <p className="text-[10px] text-[#94a3b8] uppercase tracking-widest">Points</p>
          </div>
        </div>

        {/* Host flags strip */}
        <div className="relative z-10 flex items-center gap-2 mt-4">
          {[['us','USA'],['ca','CAN'],['mx','MEX']].map(([code, label]) => (
            <div key={code} className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 py-1">
              <img src={`https://flagcdn.com/w40/${code}.png`} alt={label}
                className="w-6 h-4 rounded-sm object-cover" />
              <span className="text-[10px] text-[#94a3b8] font-semibold tracking-wider">{label}</span>
            </div>
          ))}
          <span className="text-[#94a3b8] text-[10px] ml-auto">Jun 11 – Jul 19</span>
        </div>
      </div>

      {/* Personal stats */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Points', value: profile?.total_points ?? 0 },
            { label: 'Correct', value: profile?.correct_picks ?? 0 },
            { label: 'Exact', value: profile?.exact_scores ?? 0 },
          ].map(s => (
            <div key={s.label} className="bg-[#0f1923] border border-white/8 rounded-xl p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-[#f59e0b]/30 hover:shadow-lg hover:shadow-[#f59e0b]/5">
              <p className="font-[family-name:var(--font-bebas)] text-3xl text-[#f59e0b]">{s.value}</p>
              <p className="text-xs text-[#94a3b8] uppercase tracking-widest mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Additional live matches beyond the featured one */}
      {liveMatches && liveMatches.length > 1 && (
        <div className="px-4 mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#ef4444] mb-3 flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[#ef4444] pulse-dot" /> Also Live
          </p>
          <div className="flex flex-col gap-3">
            {liveMatches.slice(1).map((m: Match) => (
              <div key={m.id} className="bg-[#0f1923] border border-[#ef4444]/40 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex items-center gap-2">
                    {m.home_logo && <img src={m.home_logo} alt={m.home_team} className="size-8 object-contain" />}
                    <span className="text-sm font-semibold text-[#f1f5f9]">{m.home_team}</span>
                  </div>
                  <span className="font-[family-name:var(--font-bebas)] text-3xl text-[#ef4444] px-4">
                    {m.home_score ?? 0} – {m.away_score ?? 0}
                  </span>
                  <div className="flex-1 flex items-center gap-2 justify-end">
                    <span className="text-sm font-semibold text-[#f1f5f9]">{m.away_team}</span>
                    {m.away_logo && <img src={m.away_logo} alt={m.away_team} className="size-8 object-contain" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming games */}
      {unpickedSoon && unpickedSoon.length > 0 ? (
        <ScrollReveal delay={50}>
          <div className="px-4 mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b] mb-3">Upcoming Games</p>
            <div className="flex flex-col gap-2">

              {/* Matches kicking off soon — exclude featured match */}
              {(unpickedSoon ?? []).filter((m: Match) => m.id !== featured?.id).map((m: Match) => {
                const pick = soonPickMap[m.id];
                const pickLabel = pick?.prediction === 'home' ? m.home_team : pick?.prediction === 'away' ? m.away_team : pick?.prediction === 'draw' ? 'Draw' : null;
                const hasScore = pick?.predHome !== null && pick?.predAway !== null && pick?.predHome !== undefined;
                if (pickLabel) {
                  return (
                    <Link key={m.id} href="/matches" className="flex items-center gap-3 bg-[#0f1923] border border-white/8 rounded-xl px-4 py-3">
                      <span className="text-lg">✅</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#f1f5f9] truncate">{m.home_team} vs {m.away_team}</p>
                        <p className="text-xs text-[#94a3b8]">
                          Kicks off <LocalTime iso={m.kickoff_at} /> —{' '}
                          {hasScore ? `${pick.predHome}–${pick.predAway} ⚡` : `picked ${pickLabel}`}
                        </p>
                      </div>
                      <span className="text-xs text-[#94a3b8]">Edit →</span>
                    </Link>
                  );
                }
                return (
                  <Link key={m.id} href="/matches"
                    className="flex items-center gap-3 bg-[#0f1923] border border-[#f59e0b]/20 rounded-xl px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#f59e0b]/40">
                    <span className="text-lg">⏰</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#f1f5f9] truncate">{m.home_team} vs {m.away_team}</p>
                      <p className="text-xs text-[#94a3b8]">Kicks off <LocalTime iso={m.kickoff_at} /> — no pick yet</p>
                    </div>
                    <span className="text-xs font-bold text-[#f59e0b] uppercase tracking-widest">Pick →</span>
                  </Link>
                );
              })}

            </div>
          </div>
        </ScrollReveal>
      ) : null}

      {/* Recently graded picks */}
      {gradedPicks && gradedPicks.length > 0 && (
        <ScrollReveal delay={60}>
          <div className="px-4 mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b] mb-3">My Results</p>
            <div className="flex flex-col gap-2">
              {(gradedPicks as any[]).map((p: any) => {
                const won = p.points_earned > 0;
                return (
                  <div key={p.id} className="flex items-center gap-3 bg-[#0f1923] border border-white/8 rounded-xl px-4 py-3">
                    <span className="text-lg">{won ? '✅' : '❌'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#f1f5f9] truncate">
                        {p.matches.home_team} {p.matches.home_score}–{p.matches.away_score} {p.matches.away_team}
                      </p>
                      <p className="text-xs text-[#94a3b8]">
                        {won ? `+${p.points_earned} pts earned` : 'No points this time'}
                      </p>
                    </div>
                    <span className={`font-[family-name:var(--font-bebas)] text-2xl ${won ? 'text-[#22c55e]' : 'text-[#94a3b8]'}`}>
                      {won ? `+${p.points_earned}` : '0'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollReveal>
      )}


      {/* Featured match: live if in progress, otherwise next upcoming */}
      <ScrollReveal delay={100}>
        {featured ? (() => {
          const isLive = featured.status === 'LIVE';
          const kickedOff = new Date(featured.kickoff_at) <= new Date();
          const showScore = isLive && featured.home_score !== null;
          const borderClass = isLive
            ? 'border-[#ef4444]/40'
            : 'border-white/8 hover:-translate-y-0.5 hover:border-[#f59e0b]/30 hover:shadow-lg hover:shadow-[#f59e0b]/5';
          return (
            <div className={`mx-4 mb-6 bg-[#0f1923] rounded-2xl p-5 border transition-all duration-200 ${borderClass}`}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b]">
                  {isLive ? 'Live Match' : kickedOff ? 'In Progress' : 'Next Match'}
                </p>
                {isLive && (
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-[#ef4444] pulse-dot" />
                    <span className="text-xs font-bold text-[#ef4444] uppercase tracking-widest">Live</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 text-center">
                  {featured.home_logo && <img src={featured.home_logo} alt={featured.home_team} className="size-14 mx-auto mb-2 object-contain" />}
                  <p className="text-sm font-semibold text-[#f1f5f9] leading-tight">{featured.home_team}</p>
                </div>
                <div className="text-center px-4">
                  {showScore ? (
                    <p className="font-[family-name:var(--font-bebas)] text-5xl text-[#ef4444]">
                      {featured.home_score} – {featured.away_score}
                    </p>
                  ) : (
                    <p className="font-[family-name:var(--font-bebas)] text-4xl text-[#f59e0b]">VS</p>
                  )}
                  <p className="text-xs text-[#94a3b8] mt-1">{featured.stage}</p>
                </div>
                <div className="flex-1 text-center">
                  {featured.away_logo && <img src={featured.away_logo} alt={featured.away_team} className="size-14 mx-auto mb-2 object-contain" />}
                  <p className="text-sm font-semibold text-[#f1f5f9] leading-tight">{featured.away_team}</p>
                </div>
              </div>

              {!kickedOff && <CountdownTimer kickoff_at={featured.kickoff_at} />}
              {!kickedOff && <p className="text-xs text-[#94a3b8] text-center mt-2">{featured.venue}</p>}

              {upcomingPick ? (
                <Link href="/matches" className="mt-4 block bg-[#1a2535] rounded-xl p-4 text-center">
                  <p className="text-xs text-[#94a3b8] uppercase tracking-widest mb-2">Your pick</p>
                  <p className="text-xl font-bold text-[#22c55e]">
                    {upcomingPick.prediction === 'home' ? featured.home_team :
                     upcomingPick.prediction === 'away' ? featured.away_team : 'Draw'}
                  </p>
                  {upcomingPick.pred_home_score !== null && upcomingPick.pred_away_score !== null && (
                    <p className="font-[family-name:var(--font-bebas)] text-3xl text-[#f59e0b] mt-1">
                      {upcomingPick.pred_home_score}–{upcomingPick.pred_away_score} ⚡
                    </p>
                  )}
                  {!kickedOff && <p className="text-[10px] text-[#475569] mt-2">Tap to edit →</p>}
                </Link>
              ) : !kickedOff ? (
                <Link href="/matches" className="mt-4 block w-full bg-[#f59e0b] text-[#080c14] font-bold rounded-xl py-3 text-sm text-center uppercase tracking-widest">
                  Make Your Pick →
                </Link>
              ) : null}
            </div>
          );
        })() : (
          <div className="mx-4 mb-6 bg-[#0f1923] border border-white/8 rounded-2xl p-8 text-center">
            <p className="text-[#94a3b8] text-sm">No upcoming matches scheduled yet.</p>
          </div>
        )}
      </ScrollReveal>

      {/* Next Match card — shown separately when a live match is in the featured slot */}
      {featured?.status === 'LIVE' && upcoming && (
        <ScrollReveal delay={120}>
          <div className="mx-4 mb-6 bg-[#0f1923] border border-white/8 rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b] mb-4">Next Match</p>
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 text-center">
                {upcoming.home_logo && <img src={upcoming.home_logo} alt={upcoming.home_team} className="size-12 mx-auto mb-2 object-contain" />}
                <p className="text-sm font-semibold text-[#f1f5f9]">{upcoming.home_team}</p>
              </div>
              <div className="text-center px-4">
                <p className="font-[family-name:var(--font-bebas)] text-3xl text-[#f59e0b]">VS</p>
                <p className="text-xs text-[#94a3b8]">{upcoming.stage}</p>
              </div>
              <div className="flex-1 text-center">
                {upcoming.away_logo && <img src={upcoming.away_logo} alt={upcoming.away_team} className="size-12 mx-auto mb-2 object-contain" />}
                <p className="text-sm font-semibold text-[#f1f5f9]">{upcoming.away_team}</p>
              </div>
            </div>
            <CountdownTimer kickoff_at={upcoming.kickoff_at} />
          </div>
        </ScrollReveal>
      )}

      {/* Recent results */}
      {recentMatches && recentMatches.length > 0 && (
        <ScrollReveal delay={150}>
          <div className="px-4 mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b] mb-3">Recent Results</p>
            <div className="flex flex-col gap-2">
              {recentMatches.map((m: Match) => (
                <div key={m.id} className="bg-[#0f1923] border border-white/8 rounded-xl px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#f59e0b]/30 hover:shadow-lg hover:shadow-[#f59e0b]/5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#f1f5f9] flex-1 truncate">{m.home_team}</span>
                    <SpoilerScore className="font-[family-name:var(--font-bebas)] text-xl text-[#f1f5f9] px-3">
                      {m.home_score} – {m.away_score}
                    </SpoilerScore>
                    <span className="text-sm text-[#f1f5f9] flex-1 text-right truncate">{m.away_team}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/8 flex justify-end">
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${m.home_team} vs ${m.away_team} World Cup 2026 highlights`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-semibold text-[#ef4444] hover:text-[#ff6b6b] transition-colors"
                    >
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      Highlights
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Highlights */}
      {highlights.length > 0 && (
        <ScrollReveal delay={175}>
          <div className="px-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b]">Highlights</p>
              <span className="text-[10px] text-[#475569] uppercase tracking-widest flex items-center gap-1">
                <svg className="size-3" viewBox="0 0 24 24" fill="#ef4444"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                YouTube
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
              {highlights.map(video => (
                <a
                  key={video.id}
                  href={`https://www.youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 w-56 bg-[#0f1923] border border-white/8 rounded-xl overflow-hidden hover:border-[#f59e0b]/30 transition-colors active:scale-95"
                >
                  <div className="relative">
                    <img src={video.thumbnail} alt="" className="w-full h-32 object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/60 rounded-full p-2">
                        <svg className="size-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-[#f1f5f9] leading-tight line-clamp-2 mb-1">{video.title}</p>
                    <p className="text-[10px] text-[#94a3b8] uppercase tracking-widest">{video.channelTitle}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* News */}
      {newsArticles.length > 0 && (
        <ScrollReveal delay={200}>
          <div className="px-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b]">Latest News</p>
              <span className="text-[10px] text-[#475569] uppercase tracking-widest">via The Guardian</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
              {newsArticles.map(article => (
                <a
                  key={article.id}
                  href={article.webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 w-56 bg-[#0f1923] border border-white/8 rounded-xl overflow-hidden hover:border-[#f59e0b]/30 transition-colors active:scale-95"
                >
                  {article.thumbnail ? (
                    <img src={article.thumbnail} alt="" className="w-full h-28 object-cover" />
                  ) : (
                    <div className="w-full h-28 bg-[#1a2535] flex items-center justify-center">
                      <span className="text-2xl">⚽</span>
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-sm font-semibold text-[#f1f5f9] leading-tight line-clamp-2 mb-1">
                      {article.webTitle}
                    </p>
                    {article.trailText && (
                      <p className="text-xs text-[#94a3b8] line-clamp-2">{article.trailText}</p>
                    )}
                    <p className="text-[10px] text-[#f59e0b] mt-2 font-semibold">Read →</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Tournament stats strip */}
      <ScrollReveal delay={0}>
        <StatsStrip />
      </ScrollReveal>
    </div>
  );
}
