'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Team {
  name: string;
  logo: string;
}

interface Props {
  teams: Team[];
  currentTeam?: string | null;
  redirectTo?: string;
}

export default function TeamPicker({ teams, currentTeam, redirectTo = '/' }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Team | null>(
    currentTeam ? (teams.find(t => t.name === currentTeam) ?? null) : null
  );
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = teams.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const save = async () => {
    if (!selected) { router.push(redirectTo); return; }
    setSaving(true);
    await fetch('/api/profile/favorite-team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team: selected.name, logo: selected.logo }),
    });
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <div className="flex flex-col flex-1">
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
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        <div className="grid grid-cols-3 gap-3">
          {filtered.map(team => {
            const isSelected = selected?.name === team.name;
            return (
              <button
                key={team.name}
                onClick={() => setSelected(isSelected ? null : team)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#f59e0b]/15 border-[#f59e0b] scale-105 shadow-lg shadow-[#f59e0b]/20'
                    : 'bg-[#0f1923] border-white/8 hover:border-[#f59e0b]/30 hover:-translate-y-0.5'
                }`}
              >
                <img
                  src={team.logo}
                  alt={team.name}
                  className="size-12 object-contain"
                />
                <span className={`text-[10px] font-semibold text-center leading-tight ${
                  isSelected ? 'text-[#f59e0b]' : 'text-[#94a3b8]'
                }`}>
                  {team.name}
                </span>
                {isSelected && (
                  <span className="text-base leading-none">⭐</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#080c14] via-[#080c14] to-transparent pt-8">
        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-[#f59e0b] text-[#080c14] font-bold rounded-xl py-4 text-sm uppercase tracking-widest disabled:opacity-50"
        >
          {saving ? 'Saving…' : selected ? `Let's go, ${selected.name}! →` : 'Skip for now →'}
        </button>
      </div>
    </div>
  );
}
