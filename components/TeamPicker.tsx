'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Team {
  name: string;
  logo: string;
}

interface Props {
  teams: Team[];
  currentTeams?: string[];
  redirectTo?: string;
}

export default function TeamPicker({ teams, currentTeams = [], redirectTo = '/' }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Team[]>(
    currentTeams
      .map(name => teams.find(t => t.name === name))
      .filter(Boolean) as Team[]
  );
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = teams.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (team: Team) => {
    setSelected(prev => {
      const exists = prev.some(t => t.name === team.name);
      if (exists) return prev.filter(t => t.name !== team.name);
      if (prev.length >= 5) return prev; // max 5
      return [...prev, team];
    });
  };

  const save = async () => {
    setSaving(true);
    await fetch('/api/profile/favorite-team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teams: selected.map(t => t.name),
        logos: selected.map(t => t.logo),
      }),
    });
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <div className="flex flex-col flex-1">

      {/* Selected strip */}
      {selected.length > 0 && (
        <div className="px-4 mb-3">
          <div className="flex items-center gap-2 bg-[#0f1923] border border-[#f59e0b]/30 rounded-xl px-3 py-2 overflow-x-auto">
            <span className="text-[10px] text-[#f59e0b] uppercase tracking-widest font-semibold flex-shrink-0">Rooting for:</span>
            {selected.map(t => (
              <button key={t.name} onClick={() => toggle(t)}
                className="flex items-center gap-1.5 bg-[#f59e0b]/10 rounded-lg px-2 py-1 flex-shrink-0">
                <img src={t.logo} alt={t.name} className="size-5 object-contain" />
                <span className="text-[10px] text-[#f59e0b] font-semibold">{t.name.split(' ')[0]}</span>
                <span className="text-[#f59e0b] text-xs">×</span>
              </button>
            ))}
            {selected.length < 5 && (
              <span className="text-[10px] text-[#94a3b8] flex-shrink-0">{5 - selected.length} more</span>
            )}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="px-4 mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search teams..."
          className="w-full bg-[#0f1923] border border-white/10 rounded-xl px-4 py-3 text-sm text-[#f1f5f9] placeholder-[#475569] focus:outline-none focus:border-[#f59e0b]/50"
        />
      </div>

      {/* Team grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-40">
        <div className="grid grid-cols-3 gap-3">
          {filtered.map(team => {
            const isSelected = selected.some(t => t.name === team.name);
            return (
              <button
                key={team.name}
                onClick={() => toggle(team)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#f59e0b]/15 border-[#f59e0b] scale-105 shadow-lg shadow-[#f59e0b]/20'
                    : 'bg-[#0f1923] border-white/8 hover:border-[#f59e0b]/30 hover:-translate-y-0.5'
                }`}
              >
                <img src={team.logo} alt={team.name} className="size-12 object-contain" />
                <span className={`text-[10px] font-semibold text-center leading-tight ${
                  isSelected ? 'text-[#f59e0b]' : 'text-[#94a3b8]'
                }`}>
                  {team.name}
                </span>
                {isSelected && <span className="text-sm leading-none">⭐</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-[#080c14] via-[#080c14] to-transparent pt-8">
        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-[#f59e0b] text-[#080c14] font-bold rounded-xl py-4 text-sm uppercase tracking-widest disabled:opacity-50"
        >
          {saving ? 'Saving…' : selected.length > 0
            ? `Save ${selected.length} team${selected.length > 1 ? 's' : ''} →`
            : 'Skip for now →'}
        </button>
      </div>
    </div>
  );
}
