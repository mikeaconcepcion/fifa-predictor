import { createSupabaseServerClient, createServiceClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import MatchesList from '@/components/MatchesList';
import { isLocked } from '@/lib/utils';

export default async function MatchesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: rawMatches, error } = await supabase
    .from('matches')
    .select('*')
    .order('kickoff_at', { ascending: true });

  const statusPriority = (s: string) => s === 'LIVE' ? 0 : (s === 'NS' || s === 'PST') ? 1 : 2;
  const matches = [...(rawMatches ?? [])].sort((a, b) => {
    const pa = statusPriority(a.status), pb = statusPriority(b.status);
    if (pa !== pb) return pa - pb;
    const ta = new Date(a.kickoff_at).getTime(), tb = new Date(b.kickoff_at).getTime();
    return a.status === 'FT' ? tb - ta : ta - tb;
  });

  const { data: picks } = await supabase
    .from('picks')
    .select('*')
    .eq('user_id', user.id);

  const pickMapObj: Record<number, any> = {};
  for (const p of (picks ?? [])) pickMapObj[p.match_id] = p;

  const service = createServiceClient();

  // Community pick distribution for locked/finished matches
  const lockedMatchIds = (matches ?? [])
    .filter(m => isLocked(m.kickoff_at))
    .map(m => m.id);

  const { data: allPicks } = lockedMatchIds.length > 0
    ? await service.from('picks').select('match_id, prediction').in('match_id', lockedMatchIds)
    : { data: [] };

  type Dist = { home: number; draw: number; away: number; total: number };
  const distObj: Record<number, Dist> = {};
  for (const p of (allPicks ?? [])) {
    const d = distObj[p.match_id] ?? { home: 0, draw: 0, away: 0, total: 0 };
    d[p.prediction as 'home' | 'draw' | 'away']++;
    d.total++;
    distObj[p.match_id] = d;
  }

  // Get user's groups
  const { data: userGroups } = await service
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id);
  const userGroupIds = (userGroups ?? []).map((r: any) => r.group_id);

  // Check if user is in any score-predictor group
  const { data: spGroups } = userGroupIds.length > 0
    ? await service.from('groups').select('id').eq('score_predictor', true).in('id', userGroupIds)
    : { data: [] };
  const scorePredictor = (spGroups ?? []).length > 0;

  // Fetch group members' picks for locked matches (to show who picked what within groups)
  type GroupPickEntry = { userId: string; displayName: string; prediction: string; predHome: number | null; predAway: number | null };
  const groupPicksMap: Record<number, GroupPickEntry[]> = {};

  if (userGroupIds.length > 0 && lockedMatchIds.length > 0) {
    const { data: groupMembers } = await service
      .from('group_members')
      .select('user_id')
      .in('group_id', userGroupIds);

    const memberIds = [...new Set((groupMembers ?? []).map((m: any) => m.user_id))];

    if (memberIds.length > 0) {
      const { data: memberPicks } = await service
        .from('picks')
        .select('match_id, user_id, prediction, pred_home_score, pred_away_score')
        .in('match_id', lockedMatchIds)
        .in('user_id', memberIds);

      const { data: memberProfiles } = await service
        .from('profiles')
        .select('id, display_name')
        .in('id', memberIds);

      const profileMap = Object.fromEntries((memberProfiles ?? []).map((p: any) => [p.id, p.display_name]));

      for (const p of (memberPicks ?? [])) {
        if (!groupPicksMap[p.match_id]) groupPicksMap[p.match_id] = [];
        groupPicksMap[p.match_id].push({
          userId: p.user_id,
          displayName: profileMap[p.user_id] ?? 'Unknown',
          prediction: p.prediction,
          predHome: p.pred_home_score,
          predAway: p.pred_away_score,
        });
      }
    }
  }

  return (
    <div className="flex flex-col">
      <div className="relative overflow-hidden min-h-[320px] flex items-end pt-14 pb-6 px-4">
        <img src="/stadiumnight2.jpg" alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#080c14]/50" />
        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #080c14)' }} />
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
        <Link href="/group-draw"
          className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-[#0f1923] text-[#94a3b8] border border-white/8 hover:border-[#f59e0b]/30 transition-colors">
          Groups
        </Link>
        <Link href="/bracket"
          className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-[#0f1923] text-[#94a3b8] border border-white/8 hover:border-[#f59e0b]/30 transition-colors">
          Bracket
        </Link>
      </div>

      {error && <p className="px-4 text-[#ef4444] text-sm">Error loading matches: {error.message}</p>}
      {!error && (matches ?? []).length === 0 && <p className="px-4 text-[#94a3b8] text-sm">No matches found.</p>}

      <MatchesList matches={matches ?? []} pickMap={pickMapObj} userId={user.id} distMap={distObj} scorePredictor={scorePredictor} groupPicksMap={groupPicksMap} />
    </div>
  );
}
