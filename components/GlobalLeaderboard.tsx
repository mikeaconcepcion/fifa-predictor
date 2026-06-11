'use client';

import { useState } from 'react';
import type { Profile } from '@/lib/types';

interface Props {
  profiles: Profile[];
  currentUserId: string;
  groups: { id: string; name: string; score_predictor?: boolean }[];
  groupMemberMap: Record<string, string[]>;
  groupNicknameMap: Record<string, Record<string, string>>;
}

export default function GlobalLeaderboard({ profiles, currentUserId, groups, groupMemberMap, groupNicknameMap }: Props) {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const displayProfiles = activeGroup && groupMemberMap[activeGroup]
    ? profiles.filter(p => groupMemberMap[activeGroup].includes(p.id))
    : profiles;

  const nicknameFor = (userId: string) =>
    activeGroup ? (groupNicknameMap[activeGroup]?.[userId] ?? null) : null;

  const activeGroupData = groups.find(g => g.id === activeGroup);
  const isScorePredictorGroup = activeGroupData?.score_predictor === true;

  const enriched = displayProfiles.map(p => ({
    ...p,
    displayAs: nicknameFor(p.id) ?? p.display_name,
    displayPoints: isScorePredictorGroup
      ? (p.total_points ?? 0) + (p.score_points ?? 0)
      : (p.total_points ?? 0),
  }));
  enriched.sort((a, b) => b.displayPoints - a.displayPoints);
  const ranked = enriched.map((p, i) => ({ ...p, rank: i + 1 }));
  const currentUserRank = ranked.find(p => p.id === currentUserId);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="flex flex-col gap-4 px-4">
      {/* Group filter pills */}
      {groups.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveGroup(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
              !activeGroup ? 'bg-[#f59e0b] text-[#080c14]' : 'bg-[#0f1923] text-[#94a3b8] border border-white/8'
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

      {/* Top 3 podium */}
      {ranked.length >= 3 && (
        <div className="flex items-end justify-center gap-4 pt-6 pb-2">
          {[1, 0, 2].map(i => {
            const p = ranked[i];
            if (!p) return null;
            const isMe = p.id === currentUserId;
            const heights  = ['h-28', 'h-20', 'h-16'];
            const sizes    = ['size-16', 'size-12', 'size-10'];
            const podiumBg = [
              'bg-[#f59e0b]/20 border-[#f59e0b]/40',
              'bg-[#94a3b8]/10 border-[#94a3b8]/30',
              'bg-[#92600a]/20 border-[#92600a]/30',
            ];
            const avatarBg    = ['bg-[#f59e0b]/25', 'bg-[#94a3b8]/15', 'bg-[#92600a]/25'];
            const avatarBorder = ['border-[#f59e0b]', 'border-[#94a3b8]/60', 'border-[#92600a]'];
            const avatarText  = ['text-[#f59e0b]', 'text-[#94a3b8]', 'text-[#cd7f32]'];
            const pointsColor = ['text-[#f59e0b]', 'text-[#94a3b8]', 'text-[#cd7f32]'];
            return (
              <div key={p.id} className="flex flex-col items-center gap-1.5">
                <div className={`${sizes[i]} rounded-full ${avatarBg[i]} border-2 ${isMe ? 'border-[#f59e0b] ring-2 ring-[#f59e0b]/30' : avatarBorder[i]} flex items-center justify-center`}>
                  <span className={`font-bold ${i === 0 ? 'text-base' : 'text-sm'} ${avatarText[i]}`}>{p.displayAs.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-[10px] text-[#94a3b8] font-semibold max-w-[72px] text-center leading-tight truncate">{p.displayAs}{isMe ? ' ★' : ''}</span>
                <div className={`${heights[i]} w-[72px] rounded-t-xl border flex flex-col items-center justify-start pt-2 gap-0.5 ${podiumBg[i]}`}>
                  <span className="text-base">{medals[i]}</span>
                  <span className={`font-[family-name:var(--font-bebas)] text-xl leading-none ${pointsColor[i]}`}>{p.displayPoints}</span>
                  <span className="text-[9px] text-[#94a3b8] uppercase tracking-wider">pts</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky current user row if outside top 10 */}
      {currentUserRank && currentUserRank.rank > 10 && (
        <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="font-[family-name:var(--font-bebas)] text-2xl text-[#f59e0b] w-8">{currentUserRank.rank}</span>
          <div className="size-9 rounded-full bg-[#f59e0b]/20 border border-[#f59e0b]/40 flex items-center justify-center flex-shrink-0">
            <span className="font-bold text-[#f59e0b] text-sm">{currentUserRank.displayAs.charAt(0).toUpperCase()}</span>
          </div>
          <span className="flex-1 text-sm font-semibold text-[#f1f5f9]">{currentUserRank.displayAs} (you)</span>
          <span className="font-[family-name:var(--font-bebas)] text-2xl text-[#f59e0b]">{currentUserRank.total_points}</span>
        </div>
      )}

      {/* Full list */}
      <div className="flex flex-col gap-2 pb-4">
        {ranked.map(p => {
          const isMe = p.id === currentUserId;
          return (
            <div
              key={p.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#f59e0b]/5 ${
                isMe ? 'bg-[#f59e0b]/10 border-[#f59e0b]/30' : 'bg-[#0f1923] border-white/8 hover:border-[#f59e0b]/30'
              }`}
            >
              <span className={`font-[family-name:var(--font-bebas)] text-2xl w-8 ${p.rank <= 3 ? 'text-[#f59e0b]' : 'text-[#94a3b8]'}`}>
                {p.rank}
              </span>
              <div className={`size-9 rounded-full flex items-center justify-center flex-shrink-0 ${isMe ? 'bg-[#f59e0b]/20 border border-[#f59e0b]/40' : 'bg-[#1a2535] border border-white/10'}`}>
                <span className={`font-bold text-sm ${isMe ? 'text-[#f59e0b]' : 'text-[#94a3b8]'}`}>
                  {p.displayAs.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isMe ? 'text-[#f59e0b]' : 'text-[#f1f5f9]'}`}>
                  {p.displayAs}{isMe ? ' (you)' : ''}
                </p>
                <p className="text-xs text-[#94a3b8]">{p.correct_picks} correct</p>
              </div>
              <span className={`font-[family-name:var(--font-bebas)] text-2xl ${isMe ? 'text-[#f59e0b]' : 'text-[#f1f5f9]'}`}>
                {p.displayPoints}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
