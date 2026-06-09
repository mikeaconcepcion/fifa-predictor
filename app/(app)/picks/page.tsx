import { createSupabaseServerClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { formatKickoffShort } from '@/lib/utils';
import type { Match } from '@/lib/types';
import Link from 'next/link';
import SpoilerScore from '@/components/SpoilerScore';

export default async function PicksPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: picks } = await supabase
    .from('picks')
    .select('*, match:match_id(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const pending = (picks ?? []).filter((p: any) => p.match?.status === 'NS');
  const finished = (picks ?? []).filter((p: any) => p.match?.status === 'FT');
  const live = (picks ?? []).filter((p: any) => p.match?.status === 'LIVE');

  const PickRow = ({ p }: { p: any }) => {
    const m: Match = p.match;
    const isFinished = m.status === 'FT';
    const isLive = m.status === 'LIVE';
    const won = p.points_earned && p.points_earned > 0;

    return (
      <div className="bg-[#0f1923] border border-white/8 rounded-2xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-[#94a3b8]">{formatKickoffShort(m.kickoff_at)} · {m.stage}</p>
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
      <div className="px-4 pt-12 pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b]">Your predictions</p>
        <h1 className="font-[family-name:var(--font-bebas)] text-3xl text-[#f1f5f9] tracking-wide mt-0.5">My Picks</h1>
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
        {pending.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b] mb-3">Upcoming</p>
            <div className="flex flex-col gap-3">{pending.map((p: any) => <PickRow key={p.id} p={p} />)}</div>
          </div>
        )}
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
