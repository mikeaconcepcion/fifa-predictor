import { createSupabaseServerClient, createServiceClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function PickChangesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const service = createServiceClient();

  // Get all pick history for this user, joined with match data
  const { data: history } = await service
    .from('pick_history')
    .select('*, match:match_id(id, home_team, away_team, home_logo, away_logo, home_score, away_score, status, kickoff_at, stage)')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: true });

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="bg-[#0f1923] border-b border-white/8 px-4 pt-14 pb-6">
          <Link href="/picks" className="flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-[#f1f5f9] transition-colors mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            My Picks
          </Link>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b] mb-1">Choice Log</p>
          <h1 className="font-[family-name:var(--font-bebas)] text-3xl text-[#f1f5f9] tracking-wide">Pick Changes</h1>
        </div>
        <p className="text-[#94a3b8] text-sm text-center py-16">No pick history yet — changes you make from now on will appear here.</p>
      </div>
    );
  }

  // Group history by match_id
  const byMatch: Record<number, typeof history> = {};
  for (const row of history) {
    if (!byMatch[row.match_id]) byMatch[row.match_id] = [];
    byMatch[row.match_id].push(row);
  }

  // Only show matches where the pick was changed at least once
  const changedMatches = Object.values(byMatch).filter(rows => {
    const predictions = rows.map(r => r.prediction);
    return predictions.some(p => p !== predictions[0]);
  });

  // Also collect unchanged picks for summary
  const unchangedCount = Object.values(byMatch).length - changedMatches.length;
  const totalMatches = Object.values(byMatch).length;

  // Sort changed matches: finished first, then by kickoff desc
  changedMatches.sort((a, b) => {
    const ma = a[0].match, mb = b[0].match;
    if (ma.status === 'FT' && mb.status !== 'FT') return -1;
    if (mb.status === 'FT' && ma.status !== 'FT') return 1;
    return new Date(mb.kickoff_at).getTime() - new Date(ma.kickoff_at).getTime();
  });

  // Tally impact on finished matches
  let gained = 0, lost = 0, noChange = 0;
  for (const rows of changedMatches) {
    const m = rows[0].match;
    if (m.status !== 'FT' || m.home_score == null) continue;
    const actual = m.home_score > m.away_score ? 'home' : m.away_score > m.home_score ? 'away' : 'draw';
    const first = rows[0].prediction;
    const final = rows[rows.length - 1].prediction;
    const firstCorrect = first === actual;
    const finalCorrect = final === actual;
    if (!firstCorrect && finalCorrect) gained++;
    else if (firstCorrect && !finalCorrect) lost++;
    else noChange++;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-[#0f1923] border-b border-white/8 px-4 pt-14 pb-6">
        <Link href="/picks" className="flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-[#f1f5f9] transition-colors mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          My Picks
        </Link>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b] mb-1">Choice Log</p>
        <h1 className="font-[family-name:var(--font-bebas)] text-3xl text-[#f1f5f9] tracking-wide">Pick Changes</h1>

        {/* Summary stats */}
        <div className="flex gap-4 mt-4">
          <div className="flex flex-col">
            <span className="font-[family-name:var(--font-bebas)] text-2xl leading-none text-[#f1f5f9]">{totalMatches}</span>
            <span className="text-[10px] uppercase tracking-widest text-[#475569]">Picks made</span>
          </div>
          <div className="flex flex-col">
            <span className="font-[family-name:var(--font-bebas)] text-2xl leading-none text-[#f59e0b]">{changedMatches.length}</span>
            <span className="text-[10px] uppercase tracking-widest text-[#475569]">Changed</span>
          </div>
          {gained > 0 && (
            <div className="flex flex-col">
              <span className="font-[family-name:var(--font-bebas)] text-2xl leading-none text-[#22c55e]">+{gained}</span>
              <span className="text-[10px] uppercase tracking-widest text-[#475569]">Gained pts</span>
            </div>
          )}
          {lost > 0 && (
            <div className="flex flex-col">
              <span className="font-[family-name:var(--font-bebas)] text-2xl leading-none text-[#ef4444]">-{lost}</span>
              <span className="text-[10px] uppercase tracking-widest text-[#475569]">Lost pts</span>
            </div>
          )}
        </div>
      </div>

      {changedMatches.length === 0 ? (
        <p className="text-[#94a3b8] text-sm text-center py-16">You haven't changed any picks yet.</p>
      ) : (
        <div className="flex flex-col gap-3 px-4 py-6">
          {changedMatches.map(rows => {
            const m = rows[0].match;
            const first = rows[0];
            const final = rows[rows.length - 1];
            const isFinished = m.status === 'FT' && m.home_score != null;
            const actual = isFinished
              ? (m.home_score > m.away_score ? 'home' : m.away_score > m.home_score ? 'away' : 'draw')
              : null;

            const firstCorrect = actual ? first.prediction === actual : null;
            const finalCorrect = actual ? final.prediction === actual : null;

            let impact: 'gained' | 'lost' | 'neutral' | null = null;
            if (actual !== null) {
              if (!firstCorrect && finalCorrect) impact = 'gained';
              else if (firstCorrect && !finalCorrect) impact = 'lost';
              else impact = 'neutral';
            }

            const borderColor = impact === 'gained'
              ? 'border-[#22c55e]/30'
              : impact === 'lost'
              ? 'border-[#ef4444]/30'
              : 'border-white/8';

            const labelFor = (pred: string) =>
              pred === 'home' ? m.home_team : pred === 'away' ? m.away_team : 'Draw';

            return (
              <div key={m.id} className={`bg-[#0f1923] border rounded-xl p-3 ${borderColor}`}>
                {/* Match */}
                <div className="flex items-center gap-1.5 mb-2">
                  {m.home_logo && <img src={m.home_logo} alt={m.home_team} className="size-4 object-contain flex-shrink-0" />}
                  <span className="text-xs text-[#94a3b8] truncate">{m.home_team}</span>
                  <span className="text-xs font-bold text-[#f1f5f9] mx-1 flex-shrink-0">
                    {isFinished ? `${m.home_score}–${m.away_score}` : 'vs'}
                  </span>
                  <span className="text-xs text-[#94a3b8] truncate">{m.away_team}</span>
                  {m.away_logo && <img src={m.away_logo} alt={m.away_team} className="size-4 object-contain flex-shrink-0" />}
                </div>

                {/* Pick progression */}
                <div className="flex items-center gap-2 flex-wrap">
                  {rows.map((row, i) => {
                    const isLast = i === rows.length - 1;
                    const correct = actual ? row.prediction === actual : null;
                    return (
                      <div key={row.id} className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          correct === true ? 'bg-[#22c55e]/20 text-[#22c55e]'
                          : correct === false ? 'bg-[#ef4444]/20 text-[#ef4444]'
                          : isLast ? 'bg-[#f59e0b]/20 text-[#f59e0b]'
                          : 'bg-white/5 text-[#94a3b8]'
                        }`}>
                          {labelFor(row.prediction)}
                        </span>
                        {!isLast && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="size-3 text-[#475569] flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    );
                  })}

                  {/* Impact badge */}
                  {impact && (
                    <span className={`ml-auto text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full flex-shrink-0 ${
                      impact === 'gained' ? 'bg-[#22c55e]/20 text-[#22c55e]'
                      : impact === 'lost' ? 'bg-[#ef4444]/20 text-[#ef4444]'
                      : 'bg-white/5 text-[#94a3b8]'
                    }`}>
                      {impact === 'gained' ? '✓ Good switch' : impact === 'lost' ? '✗ Bad switch' : '— No change'}
                    </span>
                  )}
                </div>

                {/* Change count */}
                <p className="text-[10px] text-[#475569] mt-2">
                  {rows.length - 1} change{rows.length - 1 !== 1 ? 's' : ''} · {m.stage}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
