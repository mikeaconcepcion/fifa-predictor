import { createSupabaseServerClient, createServiceClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import SpoilerScore from '@/components/SpoilerScore';

const STAGE_ORDER = ['Group Stage', 'Round of 32', 'Round of 16', 'Quarter-Final', 'Semi-Final', '3rd Place', 'Final'];

export default async function PlayerPicksPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const service = createServiceClient();

  const [{ data: profile }, { data: picks }] = await Promise.all([
    service.from('profiles').select('*').eq('id', userId).single(),
    service.from('picks')
      .select('*, match:match_id(*)')
      .eq('user_id', userId)
      .not('points_earned', 'is', null),
  ]);

  if (!profile) notFound();

  const isOwnProfile = user.id === userId;

  // Group picks by stage, only FT matches
  const byStage: Record<string, any[]> = {};
  for (const p of (picks ?? [])) {
    if (!p.match || p.match.status !== 'FT') continue;
    const stage = p.match.stage ?? 'Other';
    if (!byStage[stage]) byStage[stage] = [];
    byStage[stage].push(p);
  }

  // Sort each stage by kickoff
  for (const stage of Object.keys(byStage)) {
    byStage[stage].sort((a, b) => new Date(a.match.kickoff_at).getTime() - new Date(b.match.kickoff_at).getTime());
  }

  const stages = STAGE_ORDER.filter(s => byStage[s]);
  const totalPicks = (picks ?? []).filter((p: any) => p.match?.status === 'FT').length;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-[#0f1923] border-b border-white/8 px-4 pt-14 pb-6">
        <Link href="/leaderboard" className="flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-[#f1f5f9] transition-colors mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Standings
        </Link>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b] mb-1">
          {isOwnProfile ? 'Your picks' : 'Player picks'}
        </p>
        <h1 className="font-[family-name:var(--font-bebas)] text-3xl text-[#f1f5f9] tracking-wide">
          {profile.display_name}
        </h1>

        {/* Summary stats */}
        <div className="flex gap-4 mt-4">
          {[
            { label: 'Points', value: profile.total_points ?? 0, gold: true },
            { label: 'Correct', value: profile.correct_picks ?? 0 },
            { label: 'Played', value: totalPicks },
          ].map(s => (
            <div key={s.label} className="flex flex-col">
              <span className={`font-[family-name:var(--font-bebas)] text-2xl leading-none ${s.gold ? 'text-[#f59e0b]' : 'text-[#f1f5f9]'}`}>
                {s.value}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#475569]">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Picks by stage */}
      <div className="flex flex-col gap-6 px-4 py-6">
        {stages.length === 0 && (
          <p className="text-[#94a3b8] text-sm text-center py-10">No graded picks yet.</p>
        )}

        {stages.map(stage => {
          const stagePicks = byStage[stage];
          const correct = stagePicks.filter((p: any) => (p.points_earned ?? 0) > 0).length;
          const pts = stagePicks.reduce((sum: number, p: any) => sum + (p.points_earned ?? 0) + (p.score_points_earned ?? 0), 0);

          return (
            <div key={stage}>
              {/* Stage header */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-[#f59e0b]">{stage}</p>
                <p className="text-xs text-[#94a3b8]">
                  {correct}/{stagePicks.length} correct · <span className="text-[#f59e0b] font-semibold">{pts}pts</span>
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {stagePicks.map((p: any) => {
                  const m = p.match;
                  const earned = (p.points_earned ?? 0) + (p.score_points_earned ?? 0);
                  const won = earned > 0;
                  const actual = m.home_score > m.away_score ? 'home' : m.away_score > m.home_score ? 'away' : 'draw';
                  const correct = p.prediction === actual;

                  return (
                    <div key={p.id} className={`bg-[#0f1923] border rounded-xl p-3 ${won ? 'border-[#22c55e]/30' : 'border-white/8'}`}>
                      <div className="flex items-center justify-between gap-2">
                        {/* Teams + score */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            {m.home_logo && <img src={m.home_logo} alt={m.home_team} className="size-4 object-contain flex-shrink-0" />}
                            <span className="text-xs text-[#94a3b8] truncate">{m.home_team}</span>
                            <SpoilerScore className="text-xs font-bold text-[#f1f5f9] mx-1 flex-shrink-0">
                              {m.home_score}–{m.away_score}
                            </SpoilerScore>
                            <span className="text-xs text-[#94a3b8] truncate">{m.away_team}</span>
                            {m.away_logo && <img src={m.away_logo} alt={m.away_team} className="size-4 object-contain flex-shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                              correct ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#ef4444]/20 text-[#ef4444]'
                            }`}>
                              {p.prediction === 'home' ? m.home_team : p.prediction === 'away' ? m.away_team : 'Draw'}
                            </span>
                            {p.pred_home_score !== null && p.pred_away_score !== null && (
                              <span className="text-[10px] text-[#f59e0b]">
                                ⚡ {p.pred_home_score}–{p.pred_away_score}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Points */}
                        <div className={`flex-shrink-0 font-[family-name:var(--font-bebas)] text-xl ${won ? 'text-[#22c55e]' : 'text-[#475569]'}`}>
                          {won ? `+${earned}` : '0'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
