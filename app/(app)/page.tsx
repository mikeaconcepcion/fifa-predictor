import { createSupabaseServerClient } from '@/lib/supabase';
import { createServiceClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Match } from '@/lib/types';
import { formatKickoffShort } from '@/lib/utils';
import CountdownTimer from '@/components/CountdownTimer';
import StatsStrip from '@/components/StatsStrip';
import ScrollReveal from '@/components/ScrollReveal';

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

  // Next upcoming match
  const { data: upcoming } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'NS')
    .order('kickoff_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  // Live matches
  const { data: liveMatches } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'LIVE')
    .order('kickoff_at', { ascending: true });

  // Recent results (last 5 finished)
  const { data: recentMatches } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'FT')
    .order('kickoff_at', { ascending: false })
    .limit(5);

  // User's pick for upcoming match
  const { data: upcomingPick } = upcoming ? await supabase
    .from('picks')
    .select('*')
    .eq('user_id', user.id)
    .eq('match_id', upcoming.id)
    .maybeSingle() : { data: null };

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
            <p className="text-xs font-semibold uppercase tracking-widest text-[#475569]">Welcome back</p>
            <h1 className="font-[family-name:var(--font-bebas)] text-3xl text-[#f1f5f9] tracking-wide mt-0.5">
              {profile?.display_name ?? 'Predictor'}
            </h1>
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
            <p className="text-[10px] text-[#475569] uppercase tracking-widest">Points</p>
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
          <span className="text-[#475569] text-[10px] ml-auto">Jun 11 – Jul 19</span>
        </div>
      </div>

      {/* Tournament stats strip */}
      <ScrollReveal delay={0}>
        <StatsStrip />
      </ScrollReveal>

      {/* Live matches banner */}
      {liveMatches && liveMatches.length > 0 && (
        <ScrollReveal delay={50}>
          <div className="mx-4 mb-4">
            {liveMatches.map((m: Match) => (
              <div key={m.id} className="bg-[#0f1923] border border-[#ef4444]/30 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#ef4444] pulse-dot" />
                  <span className="text-xs font-bold text-[#ef4444] uppercase tracking-widest">Live</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-semibold">
                  <span className="text-[#f1f5f9]">{m.home_team}</span>
                  <span className="font-[family-name:var(--font-bebas)] text-2xl text-[#f59e0b]">
                    {m.home_score ?? 0} – {m.away_score ?? 0}
                  </span>
                  <span className="text-[#f1f5f9]">{m.away_team}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      )}

      {/* Hero: next match */}
      <ScrollReveal delay={100}>
        {upcoming ? (
          <div className="mx-4 mb-6 bg-[#0f1923] border border-white/8 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#f59e0b]/30 hover:shadow-lg hover:shadow-[#f59e0b]/5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#475569] mb-4">Next Match</p>
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 text-center">
                {upcoming.home_logo && (
                  <img src={upcoming.home_logo} alt={upcoming.home_team} className="size-14 mx-auto mb-2 object-contain" />
                )}
                <p className="text-sm font-semibold text-[#f1f5f9] leading-tight">{upcoming.home_team}</p>
              </div>
              <div className="text-center px-4">
                <p className="font-[family-name:var(--font-bebas)] text-4xl text-[#f59e0b]">VS</p>
                <p className="text-xs text-[#475569] mt-1">{upcoming.stage}</p>
              </div>
              <div className="flex-1 text-center">
                {upcoming.away_logo && (
                  <img src={upcoming.away_logo} alt={upcoming.away_team} className="size-14 mx-auto mb-2 object-contain" />
                )}
                <p className="text-sm font-semibold text-[#f1f5f9] leading-tight">{upcoming.away_team}</p>
              </div>
            </div>

            <CountdownTimer kickoff_at={upcoming.kickoff_at} />

            <p className="text-xs text-[#475569] text-center mt-2">{upcoming.venue}</p>

            {upcomingPick ? (
              <div className="mt-4 bg-[#1a2535] rounded-xl p-3 text-center">
                <p className="text-xs text-[#475569] uppercase tracking-widest mb-1">Your pick</p>
                <p className="text-sm font-bold text-[#22c55e]">
                  {upcomingPick.prediction === 'home' ? upcoming.home_team :
                   upcomingPick.prediction === 'away' ? upcoming.away_team : 'Draw'}
                </p>
              </div>
            ) : (
              <Link
                href="/matches"
                className="mt-4 block w-full bg-[#f59e0b] text-[#080c14] font-bold rounded-xl py-3 text-sm text-center uppercase tracking-widest"
              >
                Make Your Pick →
              </Link>
            )}
          </div>
        ) : (
          <div className="mx-4 mb-6 bg-[#0f1923] border border-white/8 rounded-2xl p-8 text-center">
            <p className="text-[#475569] text-sm">No upcoming matches scheduled yet.</p>
          </div>
        )}
      </ScrollReveal>

      {/* Recent results */}
      {recentMatches && recentMatches.length > 0 && (
        <ScrollReveal delay={150}>
          <div className="px-4 mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#475569] mb-3">Recent Results</p>
            <div className="flex flex-col gap-2">
              {recentMatches.map((m: Match) => (
                <div key={m.id} className="bg-[#0f1923] border border-white/8 rounded-xl px-4 py-3 flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 hover:border-[#f59e0b]/30 hover:shadow-lg hover:shadow-[#f59e0b]/5">
                  <span className="text-sm text-[#f1f5f9] flex-1 truncate">{m.home_team}</span>
                  <span className="font-[family-name:var(--font-bebas)] text-xl text-[#f1f5f9] px-3">
                    {m.home_score} – {m.away_score}
                  </span>
                  <span className="text-sm text-[#f1f5f9] flex-1 text-right truncate">{m.away_team}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Quick stats */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Points', value: profile?.total_points ?? 0 },
            { label: 'Correct', value: profile?.correct_picks ?? 0 },
            { label: 'Exact', value: profile?.exact_scores ?? 0 },
          ].map(s => (
            <div key={s.label} className="bg-[#0f1923] border border-white/8 rounded-xl p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-[#f59e0b]/30 hover:shadow-lg hover:shadow-[#f59e0b]/5">
              <p className="font-[family-name:var(--font-bebas)] text-3xl text-[#f59e0b]">{s.value}</p>
              <p className="text-xs text-[#475569] uppercase tracking-widest mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
