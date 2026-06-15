import { createSupabaseServerClient, createServiceClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import LocalTime from '@/components/LocalTime';
import type { Match } from '@/lib/types';
import Link from 'next/link';
import SpoilerScore from '@/components/SpoilerScore';
import PendingPicksList from '@/components/PendingPicksList';

export default async function PicksPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: picks }, { data: userGroups }] = await Promise.all([
    supabase.from('picks').select('*, match:match_id(*)').eq('user_id', user.id).order('match_id', { ascending: true }),
    createServiceClient().from('group_members').select('groups(score_predictor)').eq('user_id', user.id),
  ]);

  const scorePredictor = (userGroups ?? []).some((r: any) => r.groups?.score_predictor === true);

  const allPicks = picks ?? [];
  const byKickoff = (a: any, b: any) => new Date(a.match?.kickoff_at).getTime() - new Date(b.match?.kickoff_at).getTime();

  const live = allPicks.filter((p: any) => p.match?.status === 'LIVE').sort(byKickoff);
  const pending = allPicks.filter((p: any) => p.match?.status === 'NS').sort(byKickoff);
  const finished = allPicks.filter((p: any) => p.match?.status === 'FT').sort((a: any, b: any) => -byKickoff(a, b));

  // Group pending/finished by stage (same order as Matches page)
  const stageOrder = ['Group Stage', 'Round of 32', 'Round of 16', 'Quarter-Final', 'Semi-Final', '3rd Place', 'Final'];
  const groupByStage = (list: any[]) => {
    const map: Record<string, any[]> = {};
    for (const p of list) {
      const stage = p.match?.stage ?? 'Other';
      if (!map[stage]) map[stage] = [];
      map[stage].push(p);
    }
    return stageOrder.filter(s => map[s]).map(s => ({ stage: s, picks: map[s] }));
  };

  const PickRow = ({ p }: { p: any }) => {
    const m: Match = p.match;
    const isFinished = m.status === 'FT';
    const isLive = m.status === 'LIVE';
    const won = p.points_earned && p.points_earned > 0;

    return (
      <div className="bg-[#0f1923] border border-white/8 rounded-2xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-[#94a3b8]"><LocalTime iso={m.kickoff_at} /> · {m.stage}</p>
          {isFinished && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${won ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#ef4444]/20 text-[#ef4444]'}`}>
              {won ? `+${p.points_earned}pts` : '0pts'}
            </span>
          )}
          {isLive && (
            <span className="text-xs font-bold text-[#ef4444] uppercase tracking-widest flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-[#ef4444] pulse-dot" /> Live
            </span>
          )}
        </div>

        {/* Score row for finished/live */}
        {(isFinished || isLive) && (
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="text-sm font-semibold text-[#f1f5f9]">{m.home_team}</span>
            <SpoilerScore className="font-[family-name:var(--font-bebas)] text-xl text-[#f1f5f9] px-2">
              {m.home_score} – {m.away_score}
            </SpoilerScore>
            <span className="text-sm font-semibold text-[#f1f5f9]">{m.away_team}</span>
          </div>
        )}

        {/* Predicted score if set */}
        {p.pred_home_score !== null && p.pred_away_score !== null && (
          <div className="flex items-center justify-center gap-4 mb-3 bg-[#1a2535] rounded-xl px-4 py-3">
            <div className="flex flex-col items-center gap-1">
              {m.home_logo && <img src={m.home_logo} alt={m.home_team} className="size-8 object-contain" />}
              <p className="font-[family-name:var(--font-bebas)] text-4xl text-[#f59e0b] leading-none">{p.pred_home_score}</p>
              <p className="text-[10px] text-[#94a3b8] text-center truncate max-w-[70px]">{m.home_team}</p>
            </div>
            <span className="text-[#f59e0b] text-xl font-bold mb-4">⚡</span>
            <div className="flex flex-col items-center gap-1">
              {m.away_logo && <img src={m.away_logo} alt={m.away_team} className="size-8 object-contain" />}
              <p className="font-[family-name:var(--font-bebas)] text-4xl text-[#f59e0b] leading-none">{p.pred_away_score}</p>
              <p className="text-[10px] text-[#94a3b8] text-center truncate max-w-[70px]">{m.away_team}</p>
            </div>
          </div>
        )}

        {/* Three-zone pick display */}
        <div className="flex items-center gap-1.5">
          {/* Home */}
          <div className={`flex-1 flex items-center gap-2 rounded-xl py-2 px-2 ${
            p.prediction === 'home' ? 'bg-[#22c55e]/15 ring-1 ring-[#22c55e]/50' : ''
          }`}>
            {m.home_logo && <img src={m.home_logo} alt={m.home_team} className="size-7 object-contain shrink-0" />}
            <span className={`text-sm font-semibold leading-tight ${p.prediction === 'home' ? 'text-[#22c55e]' : 'text-[#94a3b8]'}`}>
              {m.home_team}
            </span>
          </div>

          {/* Draw */}
          <div className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold uppercase tracking-widest ${
            p.prediction === 'draw'
              ? 'bg-[#22c55e] text-[#080c14]'
              : 'bg-[#1a2535] text-[#94a3b8] border border-white/8'
          }`}>
            Draw
          </div>

          {/* Away */}
          <div className={`flex-1 flex items-center gap-2 justify-end rounded-xl py-2 px-2 ${
            p.prediction === 'away' ? 'bg-[#22c55e]/15 ring-1 ring-[#22c55e]/50' : ''
          }`}>
            <span className={`text-sm font-semibold leading-tight text-right ${p.prediction === 'away' ? 'text-[#22c55e]' : 'text-[#94a3b8]'}`}>
              {m.away_team}
            </span>
            {m.away_logo && <img src={m.away_logo} alt={m.away_team} className="size-7 object-contain shrink-0" />}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      <div className="relative overflow-hidden min-h-[320px] flex items-end pt-14 pb-6 px-4">
        <img src="/Stadiumnight.jpg" alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#080c14]/50" />
        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #080c14)' }} />
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b]">Your predictions</p>
          <h1 className="font-[family-name:var(--font-bebas)] text-3xl text-[#f1f5f9] tracking-wide mt-0.5">My Picks</h1>
        </div>
      </div>

      {picks?.length === 0 && (
        <div className="mx-4 bg-[#0f1923] border border-white/8 rounded-2xl p-10 text-center">
          <p className="text-[#94a3b8] text-sm mb-4">No picks yet.</p>
          <Link href="/matches" className="text-[#f59e0b] font-bold text-sm uppercase tracking-widest">View Matches →</Link>
        </div>
      )}

      <div className="flex flex-col gap-6 px-4 pb-4">
        {live.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#ef4444] mb-3 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#ef4444] pulse-dot" /> Live Now
            </p>
            <div className="flex flex-col gap-3">{live.map((p: any) => <PickRow key={p.id} p={p} />)}</div>
          </div>
        )}
        {pending.length > 0 && groupByStage(pending).map(({ stage, picks: stagePicks }) => (
          <div key={stage}>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b] mb-3">{stage}</p>
            <PendingPicksList picks={stagePicks} scorePredictor={scorePredictor} />
          </div>
        ))}
        {finished.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b] mb-3">Results</p>
            <div className="flex flex-col gap-3">{finished.map((p: any) => <PickRow key={p.id} p={p} />)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
