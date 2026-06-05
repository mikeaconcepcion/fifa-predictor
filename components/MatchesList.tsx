'use client';

import { useState } from 'react';
import type { Match, Pick } from '@/lib/types';
import { isLocked, formatKickoffShort } from '@/lib/utils';
import PickSheet from './PickSheet';
import ScrollReveal from './ScrollReveal';
import SpoilerScore from './SpoilerScore';

interface Props {
  matches: Match[];
  pickMap: Map<number, Pick>;
  userId: string;
}

export default function MatchesList({ matches, pickMap, userId }: Props) {
  const [picks, setPicks] = useState<Map<number, Pick>>(pickMap);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);

  // Group by stage then date
  const stages = Array.from(new Set(matches.map(m => m.stage)));

  const updatePick = (pick: Pick) => {
    setPicks(prev => new Map(prev).set(pick.match_id, pick));
  };

  return (
    <div className="flex flex-col gap-6 px-4 pb-4">
      {stages.map(stage => {
        const stageMatches = matches.filter(m => m.stage === stage);
        return (
          <ScrollReveal key={stage}>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b] mb-3">{stage}</p>
            <div className="flex flex-col gap-3">
              {stageMatches.map(match => {
                const pick = picks.get(match.id);
                const locked = isLocked(match.kickoff_at);
                const isFinished = match.status === 'FT';
                const isLive = match.status === 'LIVE';

                return (
                  <button
                    key={match.id}
                    onClick={() => !locked && setActiveMatch(match)}
                    disabled={locked}
                    className="bg-[#0f1923] border border-white/8 rounded-2xl p-4 text-left w-full active:scale-[0.98] transition-all duration-200 disabled:opacity-100 hover:enabled:-translate-y-0.5 hover:enabled:border-[#f59e0b]/30 hover:enabled:shadow-lg hover:enabled:shadow-[#f59e0b]/5"
                  >
                    {/* Status bar */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-[#475569]">{formatKickoffShort(match.kickoff_at)}</span>
                      <div className="flex items-center gap-1.5">
                        {isLive && <span className="size-1.5 rounded-full bg-[#ef4444] pulse-dot" />}
                        <span className={`text-xs font-bold uppercase tracking-widest ${
                          isLive ? 'text-[#ef4444]' :
                          isFinished ? 'text-[#475569]' :
                          locked ? 'text-[#475569]' : 'text-[#22c55e]'
                        }`}>
                          {isLive ? 'Live' : isFinished ? 'FT' : locked ? 'Locked' : 'Open'}
                        </span>
                      </div>
                    </div>

                    {/* Teams + score */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1 flex items-center gap-3">
                        {match.home_logo && (
                          <img src={match.home_logo} alt={match.home_team} className="size-8 object-contain" />
                        )}
                        <span className="text-sm font-semibold text-[#f1f5f9] leading-tight">{match.home_team}</span>
                      </div>

                      <div className="px-4 text-center">
                        {isFinished || isLive ? (
                          <SpoilerScore className="font-[family-name:var(--font-bebas)] text-2xl text-[#f1f5f9]">
                            {match.home_score} – {match.away_score}
                          </SpoilerScore>
                        ) : (
                          <span className="font-[family-name:var(--font-bebas)] text-2xl text-[#475569]">VS</span>
                        )}
                      </div>

                      <div className="flex-1 flex items-center gap-3 justify-end">
                        <span className="text-sm font-semibold text-[#f1f5f9] leading-tight text-right">{match.away_team}</span>
                        {match.away_logo && (
                          <img src={match.away_logo} alt={match.away_team} className="size-8 object-contain" />
                        )}
                      </div>
                    </div>

                    {/* Pick badge */}
                    {pick && (
                      <div className="mt-3 pt-3 border-t border-white/8 flex items-center justify-between">
                        <span className="text-xs text-[#475569]">Your pick</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isFinished
                            ? pick.points_earned && pick.points_earned > 0
                              ? 'bg-[#22c55e]/20 text-[#22c55e]'
                              : 'bg-[#ef4444]/20 text-[#ef4444]'
                            : 'bg-[#f59e0b]/20 text-[#f59e0b]'
                        }`}>
                          {pick.prediction === 'home' ? match.home_team :
                           pick.prediction === 'away' ? match.away_team : 'Draw'}
                          {isFinished && pick.points_earned !== null && ` · ${pick.points_earned}pts`}
                        </span>
                      </div>
                    )}
                    {!pick && !locked && (
                      <div className="mt-3 pt-3 border-t border-white/8">
                        <span className="text-xs font-bold text-[#f59e0b] uppercase tracking-widest">Tap to pick →</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollReveal>
        );
      })}

      {activeMatch && (
        <PickSheet
          match={activeMatch}
          existingPick={picks.get(activeMatch.id)}
          onClose={() => setActiveMatch(null)}
          onSave={updatePick}
        />
      )}
    </div>
  );
}
