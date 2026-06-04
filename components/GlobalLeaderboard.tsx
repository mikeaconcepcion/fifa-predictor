'use client';

import { useState } from 'react';
import type { Profile } from '@/lib/types';

interface Props {
  profiles: Profile[];
  currentUserId: string;
  groups: { id: string; name: string }[];
}

export default function GlobalLeaderboard({ profiles, currentUserId, groups }: Props) {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const ranked = profiles.map((p, i) => ({ ...p, rank: i + 1 }));
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
              !activeGroup ? 'bg-[#f59e0b] text-[#080c14]' : 'bg-[#0f1923] text-[#475569] border border-white/8'
            }`}
          >
            Global
          </button>
          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => setActiveGroup(g.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
                activeGroup === g.id ? 'bg-[#f59e0b] text-[#080c14]' : 'bg-[#0f1923] text-[#475569] border border-white/8'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* Top 3 podium */}
      {ranked.length >= 3 && (
        <div className="flex items-end justify-center gap-3 pt-4 pb-2">
          {[1, 0, 2].map(i => {
            const p = ranked[i];
            if (!p) return null;
            const isMe = p.id === currentUserId;
            const heights = ['h-20', 'h-28', 'h-16'];
            const sizes = ['size-12', 'size-16', 'size-10'];
            return (
              <div key={p.id} className="flex flex-col items-center gap-2">
                <div className={`${sizes[i]} rounded-full bg-[#1a2535] border-2 ${isMe ? 'border-[#f59e0b]' : i === 0 ? 'border-[#f59e0b]/60' : 'border-white/10'} flex items-center justify-center`}>
                  <span className="font-bold text-[#f1f5f9] text-sm">{p.display_name.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-[10px] text-[#94a3b8] font-semibold max-w-16 text-center leading-tight truncate">{p.display_name}</span>
                <div className={`${heights[i]} w-16 rounded-t-xl flex flex-col items-center justify-start pt-2 ${
                  i === 0 ? 'bg-[#f59e0b]/20 border border-[#f59e0b]/30' :
                  i === 1 ? 'bg-[#94a3b8]/10 border border-white/10' :
                  'bg-[#92600a]/20 border border-[#92600a]/30'
                }`}>
                  <span className="text-lg">{medals[i]}</span>
                  <span className="font-[family-name:var(--font-bebas)] text-xl text-[#f59e0b]">{p.total_points}</span>
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
            <span className="font-bold text-[#f59e0b] text-sm">{currentUserRank.display_name.charAt(0).toUpperCase()}</span>
          </div>
          <span className="flex-1 text-sm font-semibold text-[#f1f5f9]">{currentUserRank.display_name} (you)</span>
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                isMe ? 'bg-[#f59e0b]/10 border-[#f59e0b]/30' : 'bg-[#0f1923] border-white/8'
              }`}
            >
              <span className={`font-[family-name:var(--font-bebas)] text-2xl w-8 ${p.rank <= 3 ? 'text-[#f59e0b]' : 'text-[#475569]'}`}>
                {p.rank}
              </span>
              <div className={`size-9 rounded-full flex items-center justify-center flex-shrink-0 ${isMe ? 'bg-[#f59e0b]/20 border border-[#f59e0b]/40' : 'bg-[#1a2535] border border-white/10'}`}>
                <span className={`font-bold text-sm ${isMe ? 'text-[#f59e0b]' : 'text-[#94a3b8]'}`}>
                  {p.display_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isMe ? 'text-[#f59e0b]' : 'text-[#f1f5f9]'}`}>
                  {p.display_name}{isMe ? ' (you)' : ''}
                </p>
                <p className="text-xs text-[#475569]">{p.correct_picks} correct</p>
              </div>
              <span className={`font-[family-name:var(--font-bebas)] text-2xl ${isMe ? 'text-[#f59e0b]' : 'text-[#f1f5f9]'}`}>
                {p.total_points}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
