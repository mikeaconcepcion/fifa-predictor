'use client';

import { useState } from 'react';
import type { Match, Pick, Prediction } from '@/lib/types';
import { isLocked } from '@/lib/utils';
import LocalTime from './LocalTime';
import PickSheet from './PickSheet';
import ScrollReveal from './ScrollReveal';
import SpoilerScore from './SpoilerScore';

type Dist = { home: number; draw: number; away: number; total: number };

type PickEntry = { userId: string; displayName: string; prediction: string; predHome: number | null; predAway: number | null };

interface Props {
  matches: Match[];
  pickMap: Record<number, Pick>;
  userId: string;
  distMap?: Record<number, Dist>;
  scorePredictor?: boolean;
  allPicksMap?: Record<number, PickEntry[]>;
  groups?: { id: string; name: string }[];
  groupMemberMap?: Record<string, string[]>;
}

export default function MatchesList({ matches, pickMap, userId, distMap, scorePredictor = false, allPicksMap, groups = [], groupMemberMap = {} }: Props) {
  const [picks, setPicks] = useState<Record<number, Pick>>(pickMap);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);

  const updatePick = (pick: Pick) => {
    setPicks(prev => ({ ...prev, [pick.match_id]: pick }));
  };

  const makePick = async (match: Match, prediction: Prediction) => {
    const prev = picks[match.id];
    // Optimistic update
    setPicks(p => ({
      ...p,
      [match.id]: {
        id: prev?.id ?? '',
        user_id: '',
        match_id: match.id,
        prediction,
        pred_home_score: null,
        pred_away_score: null,
        points_earned: null,
        score_points_earned: 0,
        created_at: '',
      },
    }));
    setErrors(e => { const next = { ...e }; delete next[match.id]; return next; });

    try {
      const res = await fetch('/api/picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: match.id, prediction, pred_home_score: null, pred_away_score: null }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed.');
      const saved: Pick = await res.json();
      setPicks(p => ({ ...p, [match.id]: saved }));
    } catch {
      setPicks(p => {
        const next = { ...p };
        if (prev) next[match.id] = prev; else delete next[match.id];
        return next;
      });
      setErrors(e => ({ ...e, [match.id]: 'Failed to save pick.' }));
    }
  };

  const [view, setView] = useState<'upcoming' | 'results'>('upcoming');
  const [activeGroup, setActiveGroup] = useState<string | null>(null); // null = global

  const liveMatches = matches.filter(m => m.status === 'LIVE');
  const filteredMatches = [
    ...liveMatches,
    ...matches.filter(m => m.status !== 'LIVE' && (view === 'upcoming' ? m.status !== 'FT' : m.status === 'FT')),
  ];

  const stages = Array.from(new Set(filteredMatches.map(m => m.stage)));

  return (
    <div className="flex flex-col gap-6 px-4 pb-4">
      {/* Upcoming / Results toggle */}
      <div className="flex gap-1 bg-[#0f1923] border border-white/8 rounded-xl p-1">
        {(['upcoming', 'results'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setView(tab)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${
              view === tab ? 'bg-[#f59e0b] text-[#080c14]' : 'text-[#94a3b8]'
            }`}
          >
            {tab === 'upcoming' ? 'Upcoming' : 'Results'}
          </button>
        ))}
      </div>

      {/* Group filter pills */}
      {groups.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveGroup(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
              activeGroup === null ? 'bg-[#f59e0b] text-[#080c14]' : 'bg-[#0f1923] text-[#94a3b8] border border-white/8'
            }`}
          >
            Global
          </button>
          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => setActiveGroup(g.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
                activeGroup === g.id ? 'bg-[#f59e0b] text-[#080c14]' : 'bg-[#0f1923] text-[#94a3b8] border border-white/8'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {stages.map(stage => {
        const stageMatches = filteredMatches.filter(m => m.stage === stage);
        return (
          <ScrollReveal key={stage}>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b] mb-3">{stage}</p>
            <div className="flex flex-col gap-3">
              {stageMatches.map(match => {
                const pick = picks[match.id];
                const locked = isLocked(match.kickoff_at);
                const isFinished = match.status === 'FT';
                const isLive = match.status === 'LIVE';
                const isFinal = match.stage === 'Final';
                const useSheet = isFinal || scorePredictor;

                return (
                  <div
                    key={match.id}
                    className="bg-[#0f1923] border border-white/8 rounded-2xl p-4"
                  >
                    {/* Status bar */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-[#94a3b8]"><LocalTime iso={match.kickoff_at} /></span>
                      <div className="flex items-center gap-1.5">
                        {isLive && <span className="size-1.5 rounded-full bg-[#ef4444] pulse-dot" />}
                        <span className={`text-xs font-bold uppercase tracking-widest ${
                          isLive ? 'text-[#ef4444]' :
                          isFinished ? 'text-[#94a3b8]' :
                          locked ? 'text-[#94a3b8]' : 'text-[#22c55e]'
                        }`}>
                          {isLive ? 'Live' : isFinished ? 'FT' : locked ? 'Locked' : 'Open'}
                        </span>
                      </div>
                    </div>

                    {/* Teams row */}
                    {isFinished || isLive ? (
                      <div className="flex items-center justify-between">
                        <div className="flex-1 flex items-center gap-3">
                          {match.home_logo && <img src={match.home_logo} alt={match.home_team} className="size-8 object-contain" />}
                          <span className="text-sm font-semibold text-[#f1f5f9] leading-tight">{match.home_team}</span>
                        </div>
                        <div className="px-4 text-center">
                          <SpoilerScore className="font-[family-name:var(--font-bebas)] text-2xl text-[#f1f5f9]">
                            {match.home_score} – {match.away_score}
                          </SpoilerScore>
                        </div>
                        <div className="flex-1 flex items-center gap-3 justify-end">
                          <span className="text-sm font-semibold text-[#f1f5f9] leading-tight text-right">{match.away_team}</span>
                          {match.away_logo && <img src={match.away_logo} alt={match.away_team} className="size-8 object-contain" />}
                        </div>
                      </div>
                    ) : locked ? (
                      <div className="flex items-center justify-between">
                        <div className="flex-1 flex items-center gap-3">
                          {match.home_logo && <img src={match.home_logo} alt={match.home_team} className="size-8 object-contain" />}
                          <span className="text-sm font-semibold text-[#f1f5f9] leading-tight">{match.home_team}</span>
                        </div>
                        <span className="font-[family-name:var(--font-bebas)] text-2xl text-[#94a3b8] px-4">VS</span>
                        <div className="flex-1 flex items-center gap-3 justify-end">
                          <span className="text-sm font-semibold text-[#f1f5f9] leading-tight text-right">{match.away_team}</span>
                          {match.away_logo && <img src={match.away_logo} alt={match.away_team} className="size-8 object-contain" />}
                        </div>
                      </div>
                    ) : scorePredictor && pick != null && pick.pred_home_score !== null && pick.pred_away_score !== null ? (
                      /* Open — score pick display */
                      <button
                        onClick={() => setActiveMatch(match)}
                        className="w-full bg-[#1a2535] rounded-xl px-3 py-3 active:scale-95 transition-all"
                      >
                        <div className="flex items-center justify-center gap-4">
                          <div className="flex flex-col items-center gap-1">
                            {match.home_logo && <img src={match.home_logo} alt={match.home_team} className="size-8 object-contain" />}
                            <p className="font-[family-name:var(--font-bebas)] text-4xl text-[#f59e0b] leading-none">{pick.pred_home_score}</p>
                            <p className="text-[10px] text-[#94a3b8] truncate max-w-[70px] text-center">{match.home_team}</p>
                          </div>
                          <span className="text-[#f59e0b] text-xl font-bold mb-4">⚡</span>
                          <div className="flex flex-col items-center gap-1">
                            {match.away_logo && <img src={match.away_logo} alt={match.away_team} className="size-8 object-contain" />}
                            <p className="font-[family-name:var(--font-bebas)] text-4xl text-[#f59e0b] leading-none">{pick.pred_away_score}</p>
                            <p className="text-[10px] text-[#94a3b8] truncate max-w-[70px] text-center">{match.away_team}</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-[#475569] text-center mt-2">Edit →</p>
                      </button>
                    ) : (
                      /* Open — inline pick buttons */
                      <div className="flex items-center gap-1.5">
                        {/* Home */}
                        <button
                          onClick={() => useSheet ? setActiveMatch(match) : makePick(match, 'home')}
                          className={`flex-1 flex items-center gap-2 rounded-xl py-2 px-2 transition-all active:scale-95 ${
                            pick?.prediction === 'home'
                              ? 'bg-[#22c55e]/15 ring-1 ring-[#22c55e]/50'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          {match.home_logo && <img src={match.home_logo} alt={match.home_team} className="size-7 object-contain shrink-0" />}
                          <span className={`text-sm font-semibold leading-tight ${pick?.prediction === 'home' ? 'text-[#22c55e]' : 'text-[#f1f5f9]'}`}>
                            {match.home_team}
                          </span>
                        </button>

                        {/* Draw */}
                        <button
                          onClick={() => useSheet ? setActiveMatch(match) : makePick(match, 'draw')}
                          className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold uppercase tracking-widest transition-all active:scale-95 ${
                            pick?.prediction === 'draw'
                              ? 'bg-[#22c55e] text-[#080c14]'
                              : 'bg-[#1a2535] text-[#94a3b8] border border-white/8'
                          }`}
                        >
                          Draw
                        </button>

                        {/* Away */}
                        <button
                          onClick={() => useSheet ? setActiveMatch(match) : makePick(match, 'away')}
                          className={`flex-1 flex items-center gap-2 justify-end rounded-xl py-2 px-2 transition-all active:scale-95 ${
                            pick?.prediction === 'away'
                              ? 'bg-[#22c55e]/15 ring-1 ring-[#22c55e]/50'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          <span className={`text-sm font-semibold leading-tight text-right ${pick?.prediction === 'away' ? 'text-[#22c55e]' : 'text-[#f1f5f9]'}`}>
                            {match.away_team}
                          </span>
                          {match.away_logo && <img src={match.away_logo} alt={match.away_team} className="size-7 object-contain shrink-0" />}
                        </button>
                      </div>
                    )}

                    {errors[match.id] && (
                      <p className="text-xs text-[#ef4444] mt-2">{errors[match.id]}</p>
                    )}

                    {/* Pick badge — only shown when locked/finished */}
                    {pick && locked && (
                      <div className="mt-3 pt-3 border-t border-white/8">
                        {pick.pred_home_score !== null && pick.pred_away_score !== null ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {match.home_logo && <img src={match.home_logo} alt={match.home_team} className="size-5 object-contain" />}
                              <div>
                                <p className="font-[family-name:var(--font-bebas)] text-2xl text-[#f59e0b] leading-none">{pick.pred_home_score}</p>
                                <p className="text-[9px] text-[#94a3b8]">{match.home_team.split(' ')[0]}</p>
                              </div>
                              <span className="text-[#f59e0b] text-xs mx-1">⚡</span>
                              <div>
                                <p className="font-[family-name:var(--font-bebas)] text-2xl text-[#f59e0b] leading-none">{pick.pred_away_score}</p>
                                <p className="text-[9px] text-[#94a3b8]">{match.away_team.split(' ')[0]}</p>
                              </div>
                              {match.away_logo && <img src={match.away_logo} alt={match.away_team} className="size-5 object-contain" />}
                            </div>
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
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[#94a3b8]">Your pick</span>
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
                      </div>
                    )}

                    {/* Community pick distribution */}
                    {locked && distMap && (() => {
                      const dist = distMap[match.id];
                      if (!dist || dist.total === 0) return null;
                      const homePct = Math.round((dist.home / dist.total) * 100);
                      const drawPct = Math.round((dist.draw / dist.total) * 100);
                      const awayPct = 100 - homePct - drawPct;
                      return (
                        <div className="mt-3 pt-3 border-t border-white/8">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] text-[#94a3b8] uppercase tracking-widest">
                              {dist.total} {dist.total === 1 ? 'pick' : 'picks'} globally
                            </span>
                          </div>
                          <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
                            {homePct > 0 && <div className="bg-[#38bdf8] rounded-l-full" style={{ width: `${homePct}%` }} />}
                            {drawPct > 0 && <div className="bg-[#475569]" style={{ width: `${drawPct}%` }} />}
                            {awayPct > 0 && <div className="bg-[#f59e0b] rounded-r-full" style={{ width: `${awayPct}%` }} />}
                          </div>
                          <div className="flex items-center justify-between mt-1.5 text-[10px]">
                            <span className="text-[#38bdf8] font-semibold">{homePct}% {match.home_team.split(' ')[0]}</span>
                            <span className="text-[#94a3b8]">{drawPct}% Draw</span>
                            <span className="text-[#f59e0b] font-semibold">{awayPct}% {match.away_team.split(' ')[0]}</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Picks visibility — global or filtered by group */}
                    {locked && allPicksMap && (allPicksMap[match.id]?.length ?? 0) > 0 && (() => {
                      const allPicks = allPicksMap[match.id];
                      const visiblePicks = activeGroup && groupMemberMap[activeGroup]
                        ? allPicks.filter(p => groupMemberMap[activeGroup].includes(p.userId))
                        : allPicks;
                      if (visiblePicks.length === 0) return null;
                      const homePickrs = visiblePicks.filter(p => p.prediction === 'home');
                      const drawPickrs = visiblePicks.filter(p => p.prediction === 'draw');
                      const awayPickrs = visiblePicks.filter(p => p.prediction === 'away');
                      return (
                        <div className="mt-3 pt-3 border-t border-white/8">
                          <div className="flex flex-col gap-1.5">
                            {homePickrs.length > 0 && (
                              <div className="flex items-start gap-2">
                                <span className="text-[10px] font-semibold text-[#38bdf8] w-16 shrink-0 pt-0.5">{match.home_team.split(' ')[0]}</span>
                                <div className="flex flex-wrap gap-1">
                                  {homePickrs.map(p => (
                                    <span key={p.userId} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${p.userId === userId ? 'bg-[#38bdf8]/25 text-[#38bdf8]' : 'bg-[#38bdf8]/10 text-[#38bdf8]'}`}>
                                      {p.displayName}{p.predHome !== null && p.predAway !== null ? ` ${p.predHome}–${p.predAway}` : ''}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {drawPickrs.length > 0 && (
                              <div className="flex items-start gap-2">
                                <span className="text-[10px] font-semibold text-[#94a3b8] w-16 shrink-0 pt-0.5">Draw</span>
                                <div className="flex flex-wrap gap-1">
                                  {drawPickrs.map(p => (
                                    <span key={p.userId} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${p.userId === userId ? 'bg-white/15 text-[#f1f5f9]' : 'bg-white/8 text-[#94a3b8]'}`}>
                                      {p.displayName}{p.predHome !== null && p.predAway !== null ? ` ${p.predHome}–${p.predAway}` : ''}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {awayPickrs.length > 0 && (
                              <div className="flex items-start gap-2">
                                <span className="text-[10px] font-semibold text-[#f59e0b] w-16 shrink-0 pt-0.5">{match.away_team.split(' ')[0]}</span>
                                <div className="flex flex-wrap gap-1">
                                  {awayPickrs.map(p => (
                                    <span key={p.userId} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${p.userId === userId ? 'bg-[#f59e0b]/25 text-[#f59e0b]' : 'bg-[#f59e0b]/10 text-[#f59e0b]'}`}>
                                      {p.displayName}{p.predHome !== null && p.predAway !== null ? ` ${p.predHome}–${p.predAway}` : ''}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </ScrollReveal>
        );
      })}

      {activeMatch && (
        <PickSheet
          match={activeMatch}
          existingPick={picks[activeMatch.id]}
          onClose={() => setActiveMatch(null)}
          onSave={updatePick}
          scorePredictor={scorePredictor}
        />
      )}
    </div>
  );
}
