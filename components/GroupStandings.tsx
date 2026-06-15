'use client';

interface TeamRow {
  team: string; logo: string;
  mp: number; w: number; d: number; l: number;
  gf: number; ga: number; gd: number; pts: number;
  results: ('W' | 'D' | 'L')[];
}

interface GroupData { group: string; teams: TeamRow[]; }

export default function GroupStandings({ groups }: { groups: GroupData[] }) {
  return (
    <div className="flex flex-col gap-6">
      {groups.map(({ group, teams }) => (
        <div key={group} className="bg-[#0f1923] border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8">
            <h2 className="font-[family-name:var(--font-bebas)] text-xl text-[#f1f5f9] tracking-wide">Group {group}</h2>
          </div>

          {/* Column headers */}
          <div className="grid items-center px-3 py-1.5 border-b border-white/5" style={{ gridTemplateColumns: '1fr 28px 28px 28px 28px 28px 28px 28px 32px 80px' }}>
            <span className="text-[10px] text-[#475569] uppercase tracking-wider">Team</span>
            {['MP','W','D','L','GF','GA','GD'].map(h => (
              <span key={h} className="text-[10px] text-[#475569] uppercase tracking-wider text-center">{h}</span>
            ))}
            <span className="text-[10px] text-[#f59e0b] font-bold uppercase tracking-wider text-center">Pts</span>
            <span className="text-[10px] text-[#475569] uppercase tracking-wider text-right pr-1">Form</span>
          </div>

          {/* Team rows */}
          {teams.map((t, i) => {
            const qualifies = i < 2; // top 2 advance
            const formSlots = Array.from({ length: 5 }, (_, j) => {
              // newest result on left
              const result = t.results[t.results.length - 1 - j];
              return result ?? null;
            });

            return (
              <div
                key={t.team}
                className={`grid items-center px-3 py-2.5 ${i < teams.length - 1 ? 'border-b border-white/5' : ''} ${qualifies && t.mp > 0 ? 'border-l-2 border-l-[#22c55e]' : 'border-l-2 border-l-transparent'}`}
                style={{ gridTemplateColumns: '1fr 28px 28px 28px 28px 28px 28px 28px 32px 80px' }}
              >
                {/* Rank + flag + name */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] text-[#475569] w-3 flex-shrink-0">{i + 1}</span>
                  {t.logo
                    ? <img src={t.logo} alt={t.team} className="size-5 object-contain flex-shrink-0" />
                    : <div className="size-5 rounded-sm bg-[#1a2535] flex-shrink-0" />
                  }
                  <span className="text-xs font-semibold text-[#f1f5f9] truncate">{t.team}</span>
                </div>

                {/* Stats */}
                {[t.mp, t.w, t.d, t.l, t.gf, t.ga].map((val, j) => (
                  <span key={j} className="text-xs text-[#94a3b8] text-center">{val}</span>
                ))}
                <span className={`text-xs text-center ${t.gd > 0 ? 'text-[#22c55e]' : t.gd < 0 ? 'text-[#ef4444]' : 'text-[#94a3b8]'}`}>
                  {t.gd > 0 ? `+${t.gd}` : t.gd}
                </span>
                <span className="font-[family-name:var(--font-bebas)] text-base text-[#f59e0b] text-center">{t.pts}</span>

                {/* Form dots */}
                <div className="flex items-center justify-end gap-0.5 pr-1">
                  {formSlots.map((result, j) => (
                    <FormDot key={j} result={result} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function FormDot({ result }: { result: 'W' | 'D' | 'L' | null }) {
  if (!result) {
    return <div className="size-3.5 rounded-full border border-white/15 bg-transparent" />;
  }
  if (result === 'W') {
    return (
      <div className="size-3.5 rounded-full bg-[#22c55e] flex items-center justify-center">
        <svg className="size-2" viewBox="0 0 8 8" fill="none">
          <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  if (result === 'L') {
    return (
      <div className="size-3.5 rounded-full bg-[#ef4444] flex items-center justify-center">
        <svg className="size-2" viewBox="0 0 8 8" fill="none">
          <path d="M2 2L6 6M6 2L2 6" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  // Draw
  return (
    <div className="size-3.5 rounded-full bg-[#475569] flex items-center justify-center">
      <div className="w-2 h-0.5 bg-white rounded-full" />
    </div>
  );
}
