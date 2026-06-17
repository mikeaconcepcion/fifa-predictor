import { createSupabaseServerClient, createServiceClient } from '@/lib/supabase';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

const ADMIN_ID = '367df80f-d202-4958-84aa-9e4161bff3f7';

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (user.id !== ADMIN_ID) notFound();

  const service = createServiceClient();

  // Fetch all pick history with profile + match data
  const { data: history } = await service
    .from('pick_history')
    .select('*, profile:user_id(id, display_name), match:match_id(id, home_team, away_team, home_score, away_score, status, stage, kickoff_at)')
    .order('saved_at', { ascending: true });

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col min-h-screen px-4 pt-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b] mb-1">Admin</p>
        <h1 className="font-[family-name:var(--font-bebas)] text-3xl text-[#f1f5f9] tracking-wide mb-8">Choice Log</h1>
        <p className="text-[#94a3b8] text-sm text-center py-16">No pick history logged yet.</p>
      </div>
    );
  }

  // Group by user
  const byUser: Record<string, typeof history> = {};
  for (const row of history) {
    const uid = row.user_id;
    if (!byUser[uid]) byUser[uid] = [];
    byUser[uid].push(row);
  }

  // Group by match
  const byMatch: Record<number, typeof history> = {};
  for (const row of history) {
    if (!byMatch[row.match_id]) byMatch[row.match_id] = [];
    byMatch[row.match_id].push(row);
  }

  // Per-user stats
  const userStats = Object.entries(byUser).map(([uid, rows]) => {
    const name = rows[0].profile?.display_name ?? 'Unknown';

    // Group this user's rows by match
    const userByMatch: Record<number, typeof rows> = {};
    for (const r of rows) {
      if (!userByMatch[r.match_id]) userByMatch[r.match_id] = [];
      userByMatch[r.match_id].push(r);
    }

    let changed = 0, gained = 0, lost = 0, neutral = 0;
    for (const matchRows of Object.values(userByMatch)) {
      const predictions = matchRows.map(r => r.prediction);
      const didChange = predictions.some(p => p !== predictions[0]);
      if (!didChange) continue;
      changed++;

      const m = matchRows[0].match;
      if (m.status !== 'FT' || m.home_score == null) continue;
      const actual = m.home_score > m.away_score ? 'home' : m.away_score > m.home_score ? 'away' : 'draw';
      const firstCorrect = matchRows[0].prediction === actual;
      const finalCorrect = matchRows[matchRows.length - 1].prediction === actual;
      if (!firstCorrect && finalCorrect) gained++;
      else if (firstCorrect && !finalCorrect) lost++;
      else neutral++;
    }

    return { uid, name, totalPicks: Object.keys(userByMatch).length, changed, gained, lost, neutral };
  }).sort((a, b) => b.changed - a.changed);

  // Per-match stats — only matches with at least one change across any user
  const matchStats = Object.entries(byMatch).map(([mid, rows]) => {
    const m = rows[0].match;

    // Group by user within this match
    const matchByUser: Record<string, typeof rows> = {};
    for (const r of rows) {
      if (!matchByUser[r.user_id]) matchByUser[r.user_id] = [];
      matchByUser[r.user_id].push(r);
    }

    let changers = 0, gained = 0, lost = 0;
    for (const userRows of Object.values(matchByUser)) {
      const preds = userRows.map(r => r.prediction);
      if (!preds.some(p => p !== preds[0])) continue;
      changers++;

      if (m.status !== 'FT' || m.home_score == null) continue;
      const actual = m.home_score > m.away_score ? 'home' : m.away_score > m.home_score ? 'away' : 'draw';
      const firstCorrect = userRows[0].prediction === actual;
      const finalCorrect = userRows[userRows.length - 1].prediction === actual;
      if (!firstCorrect && finalCorrect) gained++;
      else if (firstCorrect && !finalCorrect) lost++;
    }

    return { mid: Number(mid), m, changers, gained, lost };
  }).filter(s => s.changers > 0).sort((a, b) => b.changers - a.changers);

  const totalChanges = userStats.reduce((s, u) => s + u.changed, 0);
  const totalGained = userStats.reduce((s, u) => s + u.gained, 0);
  const totalLost = userStats.reduce((s, u) => s + u.lost, 0);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-[#0f1923] border-b border-white/8 px-4 pt-14 pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b] mb-1">Admin</p>
        <h1 className="font-[family-name:var(--font-bebas)] text-3xl text-[#f1f5f9] tracking-wide">Choice Log</h1>

        <div className="flex gap-4 mt-4">
          {[
            { label: 'Total changes', value: totalChanges, color: 'text-[#f59e0b]' },
            { label: 'Good switches', value: totalGained, color: 'text-[#22c55e]' },
            { label: 'Bad switches', value: totalLost, color: 'text-[#ef4444]' },
          ].map(s => (
            <div key={s.label} className="flex flex-col">
              <span className={`font-[family-name:var(--font-bebas)] text-2xl leading-none ${s.color}`}>{s.value}</span>
              <span className="text-[10px] uppercase tracking-widest text-[#475569]">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6 px-4 py-6">

        {/* Most indecisive users */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#f59e0b] mb-3">Most indecisive</p>
          <div className="flex flex-col gap-2">
            {userStats.filter(u => u.changed > 0).map(u => (
              <Link key={u.uid} href={`/players/${u.uid}`} className="bg-[#0f1923] border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-[#f59e0b]/30 transition-colors">
                <div className="size-8 rounded-full bg-[#1a2535] border border-white/10 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-xs text-[#94a3b8]">{u.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#f1f5f9] truncate">{u.name}</p>
                  <p className="text-xs text-[#94a3b8]">{u.changed} change{u.changed !== 1 ? 's' : ''} across {u.totalPicks} picks</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {u.gained > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#22c55e]/20 text-[#22c55e]">+{u.gained}</span>}
                  {u.lost > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ef4444]/20 text-[#ef4444]">-{u.lost}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Matches that caused the most switches */}
        {matchStats.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#f59e0b] mb-3">Most switched matches</p>
            <div className="flex flex-col gap-2">
              {matchStats.map(s => (
                <div key={s.mid} className="bg-[#0f1923] border border-white/8 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#f1f5f9] truncate">{s.m.home_team} vs {s.m.away_team}</p>
                      <p className="text-xs text-[#94a3b8]">
                        {s.m.status === 'FT' ? `${s.m.home_score}–${s.m.away_score} · ` : ''}{s.m.stage}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f59e0b]/20 text-[#f59e0b]">{s.changers} switched</span>
                      {s.gained > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#22c55e]/20 text-[#22c55e]">✓ {s.gained}</span>}
                      {s.lost > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ef4444]/20 text-[#ef4444]">✗ {s.lost}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
