import { createSupabaseServerClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import GroupStandings from '@/components/GroupStandings';

export default async function GroupDrawPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: matches } = await supabase
    .from('matches')
    .select('id, home_team, away_team, home_logo, away_logo, home_score, away_score, status, group_name, kickoff_at')
    .eq('stage', 'Group Stage')
    .order('kickoff_at', { ascending: true });

  const allMatches = matches ?? [];

  // Build team registry (name → logo) from all group stage matches
  const teamLogo: Record<string, string> = {};
  for (const m of allMatches) {
    if (m.home_team && m.home_logo) teamLogo[m.home_team] = m.home_logo;
    if (m.away_team && m.away_logo) teamLogo[m.away_team] = m.away_logo;
  }

  // Build groups: group_name → set of teams
  const groupTeams: Record<string, Set<string>> = {};
  for (const m of allMatches) {
    if (!m.group_name) continue;
    if (!groupTeams[m.group_name]) groupTeams[m.group_name] = new Set();
    groupTeams[m.group_name].add(m.home_team);
    groupTeams[m.group_name].add(m.away_team);
  }

  // Compute per-team stats from FT matches
  interface TeamStats {
    team: string; logo: string;
    mp: number; w: number; d: number; l: number;
    gf: number; ga: number; pts: number;
    results: ('W' | 'D' | 'L')[]; // newest first
  }

  const stats: Record<string, TeamStats> = {};
  const init = (team: string) => {
    if (!stats[team]) stats[team] = { team, logo: teamLogo[team] ?? '', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, results: [] };
  };

  // Sort FT matches by kickoff ascending so we can build results in order
  const ftMatches = allMatches.filter(m => m.status === 'FT' && m.home_score != null && m.away_score != null);

  for (const m of ftMatches) {
    init(m.home_team); init(m.away_team);
    const hs = m.home_score!, as = m.away_score!;

    const homeResult: 'W' | 'D' | 'L' = hs > as ? 'W' : hs === as ? 'D' : 'L';
    const awayResult: 'W' | 'D' | 'L' = as > hs ? 'W' : hs === as ? 'D' : 'L';

    stats[m.home_team].mp++; stats[m.away_team].mp++;
    stats[m.home_team].gf += hs; stats[m.home_team].ga += as;
    stats[m.away_team].gf += as; stats[m.away_team].ga += hs;

    if (homeResult === 'W') { stats[m.home_team].w++; stats[m.home_team].pts += 3; stats[m.away_team].l++; }
    else if (homeResult === 'D') { stats[m.home_team].d++; stats[m.home_team].pts += 1; stats[m.away_team].d++; stats[m.away_team].pts += 1; }
    else { stats[m.away_team].w++; stats[m.away_team].pts += 3; stats[m.home_team].l++; }

    stats[m.home_team].results.push(homeResult);
    stats[m.away_team].results.push(awayResult);
  }

  // Also init teams with no FT matches yet
  for (const [, teams] of Object.entries(groupTeams)) {
    for (const team of teams) init(team);
  }

  // Build sorted group standings
  const groupOrder = ['A','B','C','D','E','F','G','H','I','J','K','L'];

  const groups = groupOrder
    .filter(g => groupTeams[g])
    .map(g => {
      const teams = [...groupTeams[g]]
        .map(t => ({ ...stats[t], gd: (stats[t]?.gf ?? 0) - (stats[t]?.ga ?? 0) }))
        .sort((a, b) =>
          b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team)
        );
      return { group: g, teams };
    });

  return (
    <div className="flex flex-col">
      <div className="relative overflow-hidden min-h-[240px] flex items-end pt-14 pb-6 px-4">
        <img src="/stadiumnight2.jpg" alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#080c14]/55" />
        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #080c14)' }} />
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b]">FIFA World Cup 2026</p>
          <h1 className="font-[family-name:var(--font-bebas)] text-3xl text-[#f1f5f9] tracking-wide mt-0.5">Group Draw</h1>
        </div>
      </div>

      <div className="px-4 mb-4 flex gap-2">
        <Link href="/matches" className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-[#0f1923] text-[#94a3b8] border border-white/8 hover:border-[#f59e0b]/30 transition-colors">Matches</Link>
        <span className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-[#f59e0b] text-[#080c14]">Groups</span>
        <Link href="/bracket" className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-[#0f1923] text-[#94a3b8] border border-white/8 hover:border-[#f59e0b]/30 transition-colors">Bracket</Link>
      </div>

      <div className="px-4 pb-8">
        <GroupStandings groups={groups} />
      </div>
    </div>
  );
}
