'use client';

import { useState } from 'react';

interface Props {
  displayName: string;
  email: string;
}

export default function ProfileHeader({ displayName: initialName, email }: Props) {
  const [name, setName] = useState(initialName);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialName);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === name) { setEditing(false); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: trimmed }),
      });
      if (res.ok) setName(trimmed);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  return (
    <div className="relative overflow-hidden pt-14 pb-10 px-4">
      <img src="/Stadiumcrowd.jpg" alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover object-center" />
      <div className="absolute inset-0 bg-[#080c14]/55" />
      <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #080c14)' }} />
      <div className="relative z-10 flex items-center gap-4">
        <div className="size-16 rounded-full bg-[#f59e0b]/20 border-2 border-[#f59e0b]/50 flex items-center justify-center flex-shrink-0">
          <span className="font-[family-name:var(--font-bebas)] text-3xl text-[#f59e0b]">
            {name.charAt(0).toUpperCase() ?? '?'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
                maxLength={40}
                className="bg-[#1a2535] border border-[#f59e0b]/50 rounded-lg px-3 py-1.5 text-base font-bold text-[#f1f5f9] w-full max-w-[180px] focus:outline-none focus:border-[#f59e0b]"
              />
              <button onClick={save} disabled={saving} className="text-xs font-bold text-[#f59e0b] disabled:opacity-50">
                {saving ? '…' : 'Save'}
              </button>
              <button onClick={() => setEditing(false)} className="text-xs text-[#94a3b8]">Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="font-[family-name:var(--font-bebas)] text-3xl text-[#f1f5f9] tracking-wide leading-none truncate">
                {name}
              </h1>
              <button
                onClick={() => { setDraft(name); setEditing(true); }}
                className="text-[#94a3b8] hover:text-[#f59e0b] transition-colors flex-shrink-0"
                aria-label="Edit display name"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            </div>
          )}
          <p className="text-xs text-[#94a3b8] mt-1">{email}</p>
        </div>
      </div>
    </div>
  );
}
