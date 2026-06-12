'use client';

import { useState } from 'react';
import type { Match, Pick } from '@/lib/types';
import { isLocked } from '@/lib/utils';
import LocalTime from './LocalTime';
import PickSheet from './PickSheet';

interface PendingPick {
  id: string;
  match: Match;
  prediction: string;
  pred_home_score: number | null;
  pred_away_score: number | null;
  points_earned: number | null;
  score_points_earned: number;
}

interface Props {
  picks: PendingPick[];
  scorePredictor: boolean;
}

export default function PendingPicksList({ picks: initialPicks, scorePredictor }: Props) {
  const [picks, setPicks] = useState(initialPicks);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);

  const activePick = activeMatch
    ? picks.find(p => p.match.id === activeMatch.id)
    : null;

  const handleSave = (saved: Pick) => {
    setPicks(prev => prev.map(p =>
      p.match.id === saved.match_id
        ? { ...p, prediction: saved.prediction, pred_home_score: saved.pred_home_score, pred_away_score: saved.pred_away_score }
        : p
    ));
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        {picks.map(p => {
          const m = p.match;
          const locked = isLocked(m.kickoff_at);
          const hasScore = p.pred_home_score !== null && p.pred_away_score !== null;
          return (
            <button
              key={p.id}
              onClick={() => !locked && setActiveMatch(m)}
              disabled={locked}
              className={`w-full text-left bg-[#0f1923] border border-white/8 rounded-2xl p-4 transition-all ${locked ? 'opacity-60 cursor-not-allowed' : 'active:scale-95 hover:border-[#f59e0b]/30'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[#94a3b8]"><LocalTime iso={m.kickoff_at} /> · {m.stage}</p>
                <span className="text-xs font-bold text-[#f59e0b] uppercase tracking-widest">{locked ? 'Locked' : 'Edit →'}</span>
              </div>

              {hasScore ? (
                <div className="flex items-center justify-center gap-4 py-1">
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
              ) : (
                <div className="flex items-center gap-1.5">
                  <div className={`flex-1 flex items-center gap-2 rounded-xl py-2 px-2 ${p.prediction === 'home' ? 'bg-[#22c55e]/15 ring-1 ring-[#22c55e]/50' : ''}`}>
                    {m.home_logo && <img src={m.home_logo} alt={m.home_team} className="size-7 object-contain shrink-0" />}
                    <span className={`text-sm font-semibold leading-tight ${p.prediction === 'home' ? 'text-[#22c55e]' : 'text-[#94a3b8]'}`}>{m.home_team}</span>
                  </div>
                  <div className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold uppercase tracking-widest ${p.prediction === 'draw' ? 'bg-[#22c55e] text-[#080c14]' : 'bg-[#1a2535] text-[#94a3b8] border border-white/8'}`}>
                    Draw
                  </div>
                  <div className={`flex-1 flex items-center gap-2 justify-end rounded-xl py-2 px-2 ${p.prediction === 'away' ? 'bg-[#22c55e]/15 ring-1 ring-[#22c55e]/50' : ''}`}>
                    <span className={`text-sm font-semibold leading-tight text-right ${p.prediction === 'away' ? 'text-[#22c55e]' : 'text-[#94a3b8]'}`}>{m.away_team}</span>
                    {m.away_logo && <img src={m.away_logo} alt={m.away_team} className="size-7 object-contain shrink-0" />}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {activeMatch && (
        <PickSheet
          match={activeMatch}
          existingPick={activePick as any}
          onClose={() => setActiveMatch(null)}
          onSave={handleSave}
          scorePredictor={scorePredictor}
        />
      )}
    </>
  );
}
