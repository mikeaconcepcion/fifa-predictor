import { createSupabaseServerClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { formatKickoffShort } from '@/lib/utils';
import type { Match, Pick } from '@/lib/types';
import Link from 'next/link';

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
    const won = p.points_earned && p.points_earned > 0;
    return (
      <div className="bg-[#0f1923] border border-white/8 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-[#475569]">{formatKickoffShort(m.kickoff_at)} · {m.stage}</p>
          {isFinished && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${won ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#ef4444]/20 text-[#ef4444]'}`}>
              {won ? `+${p.points_earned}pts` : '0pts'}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[#f1f5f9]">{m.home_team}</span>
          {isFinished ? (
            <span className="font-[family-name:var(--font-bebas)] text-xl text-[#f1f5f9] px-3">{m.home_score} – {m.away_score}</span>
          ) : (
            <span className="font-[family-name:var(--font-bebas)] text-xl text-[#475569] px-3">VS</span>
          )}
          <span className="text-sm font-semibold text-[#f1f5f9]">{m.away_team}</span>
        </div>
        <div className="mt-2 pt-2 border-t border-white/8 flex items-center justify-between">
          <span className="text-xs text-[#475569]">Picked</span>
          <span className={`text-xs font-bold ${isFinished ? (won ? 'text-[#22c55e]' : 'text-[#ef4444]') : 'text-[#f59e0b]'}`}>
            {p.prediction === 'home' ? m.home_team : p.prediction === 'away' ? m.away_team : 'Draw'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-12 pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#475569]">Your predictions</p>
        <h1 className="font-[family-name:var(--font-bebas)] text-3xl text-[#f1f5f9] tracking-wide mt-0.5">My Picks</h1>
      </div>

      {picks?.length === 0 && (
        <div className="mx-4 bg-[#0f1923] border border-white/8 rounded-2xl p-10 text-center">
          <p className="text-[#475569] text-sm mb-4">No picks yet.</p>
          <Link href="/matches" className="text-[#f59e0b] font-bold text-sm uppercase tracking-widest">View Matches →</Link>
        </div>
      )}

      <div className="flex flex-col gap-6 px-4">
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
            <p className="text-xs font-semibold uppercase tracking-widest text-[#475569] mb-3">Upcoming</p>
            <div className="flex flex-col gap-3">{pending.map((p: any) => <PickRow key={p.id} p={p} />)}</div>
          </div>
        )}
        {finished.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#475569] mb-3">Results</p>
            <div className="flex flex-col gap-3">{finished.map((p: any) => <PickRow key={p.id} p={p} />)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
