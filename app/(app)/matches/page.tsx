import { createSupabaseServerClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import MatchesList from '@/components/MatchesList';
import { isLocked } from '@/lib/utils';

export default async function MatchesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: matches, error } = await supabase
    .from('matches')
    .select('*')
    .order('kickoff_at', { ascending: true });

  const { data: picks } = await supabase
    .from('picks')
    .select('*')
    .eq('user_id', user.id);

  const pickMapObj: Record<number, any> = {};
  for (const p of (picks ?? [])) pickMapObj[p.match_id] = p;

  // Community pick distribution for locked/finished matches
  const lockedMatchIds = (matches ?? [])
    .filter(m => isLocked(m.kickoff_at))
    .map(m => m.id);

  const { data: allPicks } = lockedMatchIds.length > 0
    ? await supabase.from('picks').select('match_id, prediction').in('match_id', lockedMatchIds)
    : { data: [] };

  type Dist = { home: number; draw: number; away: number; total: number };
  const distObj: Record<number, Dist> = {};
  for (const p of (allPicks ?? [])) {
    const d = distObj[p.match_id] ?? { home: 0, draw: 0, away: 0, total: 0 };
    d[p.prediction as 'home' | 'draw' | 'away']++;
    d.total++;
    distObj[p.match_id] = d;
  }

  return (
    <div className="flex flex-col">
      <div className="relative overflow-hidden pt-14 pb-20 px-4">
        <img src="/stadiumnight2.jpg" alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#080c14]/55" />
        <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #080c14)' }} />
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b]">FIFA World Cup 2026</p>
          <h1 className="font-[family-name:var(--font-bebas)] text-3xl text-[#f1f5f9] tracking-wide mt-0.5">Matches</h1>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="px-4 mb-4 flex gap-2">
        <span className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-[#f59e0b] text-[#080c14]">
          Matches
        </span>
        <Link href="/bracket"
          className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-[#0f1923] text-[#94a3b8] border border-white/8 hover:border-[#f59e0b]/30 transition-colors">
          Bracket
        </Link>
      </div>

      {error && <p className="px-4 text-[#ef4444] text-sm">Error loading matches: {error.message}</p>}
      {!error && (matches ?? []).length === 0 && <p className="px-4 text-[#94a3b8] text-sm">No matches found.</p>}

      <MatchesList matches={matches ?? []} pickMap={pickMapObj} userId={user.id} distMap={distObj} />
    </div>
  );
}
