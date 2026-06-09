'use client';

import { useState } from 'react';
import type { Match } from '@/lib/types';
import SpoilerScore from './SpoilerScore';

const STAGES = ['Round of 32', 'Round of 16', 'Quarter-Final', 'Semi-Final', 'Final'] as const;
const STAGE_SHORT: Record<string, string> = {
  'Round of 32': 'R32',
  'Round of 16': 'R16',
  'Quarter-Final': 'QF',
  'Semi-Final': 'SF',
  'Final': 'Final',
};

interface Props {
  matches: Match[];
}

function MatchCard({ match }: { match: Match }) {
  const isFinished = match.status === 'FT';
  const isLive = match.status === 'LIVE';
  const homeWon = isFinished && match.home_score! > match.away_score!;
  const awayWon = isFinished && match.away_score! > match.home_score!;

  return (
    <div className="bg-[#0f1923] border border-white/8 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#f59e0b]/30 hover:shadow-lg hover:shadow-[#f59e0b]/5">
      {/* Status */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-[#94a3b8]">
          {new Date(match.kickoff_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
        {isLive && (
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[#ef4444] pulse-dot" />
            <span className="text-[10px] font-bold text-[#ef4444] uppercase tracking-widest">Live</span>
          </div>
        )}
        {isFinished && <span className="text-[10px] text-[#94a3b8] uppercase tracking-widest">FT</span>}
      </div>

      {/* Teams */}
      <div className="flex flex-col gap-2">
        {/* Home */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {match.home_logo && <img src={match.home_logo} alt={match.home_team} className="size-6 object-contain flex-shrink-0" />}
            <span className={`text-sm font-semibold truncate ${homeWon ? 'text-[#f59e0b]' : 'text-[#f1f5f9]'}`}>
              {match.home_team}
            </span>
          </div>
          {(isFinished || isLive) && (
            <SpoilerScore className={`font-[family-name:var(--font-bebas)] text-xl ml-3 ${homeWon ? 'text-[#f59e0b]' : 'text-[#f1f5f9]'}`}>
              {match.home_score}
            </SpoilerScore>
          )}
        </div>

        <div className="h-px bg-white/5" />

        {/* Away */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {match.away_logo && <img src={match.away_logo} alt={match.away_team} className="size-6 object-contain flex-shrink-0" />}
            <span className={`text-sm font-semibold truncate ${awayWon ? 'text-[#f59e0b]' : 'text-[#f1f5f9]'}`}>
              {match.away_team}
            </span>
          </div>
          {(isFinished || isLive) && (
            <SpoilerScore className={`font-[family-name:var(--font-bebas)] text-xl ml-3 ${awayWon ? 'text-[#f59e0b]' : 'text-[#f1f5f9]'}`}>
              {match.away_score}
            </SpoilerScore>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BracketView({ matches }: Props) {
  const knockoutMatches = matches.filter(m => m.stage !== 'Group Stage' && m.stage !== '3rd Place');
  const thirdPlace = matches.find(m => m.stage === '3rd Place');

  const availableStages = STAGES.filter(s => knockoutMatches.some(m => m.stage === s));
  const [activeStage, setActiveStage] = useState<string>(availableStages[0] ?? 'Round of 32');

  const finalMatch = knockoutMatches.find(m => m.stage === 'Final' && m.status === 'FT');
  const champion = finalMatch
    ? (finalMatch.home_score! > finalMatch.away_score! ? finalMatch.home_team : finalMatch.away_team)
    : null;

  if (knockoutMatches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <span className="text-5xl mb-4">🏆</span>
        <p className="text-[#f1f5f9] font-semibold text-lg">Knockout Stage</p>
        <p className="text-[#94a3b8] text-sm mt-2">
          Available after the Group Stage ends — around June 27
        </p>
      </div>
    );
  }

  const stageMatches = knockoutMatches.filter(m => m.stage === activeStage);

  return (
    <div className="flex flex-col">
      {/* Champion banner */}
      {champion && (
        <div className="mx-4 mb-4 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-2xl p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b] mb-1">World Champion</p>
          <p className="font-[family-name:var(--font-bebas)] text-3xl text-[#f1f5f9]">🏆 {champion}</p>
        </div>
      )}

      {/* Stage tabs */}
      <div className="px-4 mb-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {STAGES.map(stage => {
            const hasMatches = knockoutMatches.some(m => m.stage === stage);
            return (
              <button
                key={stage}
                disabled={!hasMatches}
                onClick={() => setActiveStage(stage)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
                  activeStage === stage
                    ? 'bg-[#f59e0b] text-[#080c14]'
                    : hasMatches
                    ? 'bg-[#0f1923] text-[#94a3b8] border border-white/8 hover:border-[#f59e0b]/30'
                    : 'bg-[#0f1923]/50 text-[#1a2535] border border-white/5 cursor-not-allowed'
                }`}
              >
                {STAGE_SHORT[stage]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Match cards */}
      <div className="px-4 flex flex-col gap-3 pb-4">
        {stageMatches.map(m => <MatchCard key={m.id} match={m} />)}
        {activeStage === 'Final' && thirdPlace && (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b] mt-2">3rd Place</p>
            <MatchCard match={thirdPlace} />
          </>
        )}
      </div>
    </div>
  );
}
