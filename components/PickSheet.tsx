'use client';

import { useState } from 'react';
import type { Match, Pick, Prediction } from '@/lib/types';
import { formatKickoffShort } from '@/lib/utils';

interface Props {
  match: Match;
  existingPick?: Pick;
  onClose: () => void;
  onSave: (pick: Pick) => void;
}

export default function PickSheet({ match, existingPick, onClose, onSave }: Props) {
  const [prediction, setPrediction] = useState<Prediction | null>(existingPick?.prediction ?? null);
  const [predHome, setPredHome] = useState(existingPick?.pred_home_score ?? 0);
  const [predAway, setPredAway] = useState(existingPick?.pred_away_score ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isFinal = match.stage === 'Final';

  const save = async () => {
    if (!prediction) { setError('Select a result.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: match.id,
          prediction,
          pred_home_score: isFinal ? predHome : null,
          pred_away_score: isFinal ? predAway : null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to save pick.');
      const pick = await res.json();
      onSave(pick);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const options: { value: Prediction; label: string }[] = [
    { value: 'home', label: match.home_team },
    { value: 'draw', label: 'Draw' },
    { value: 'away', label: match.away_team },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-[#0f1923] rounded-t-3xl border-t border-white/10 p-6 pb-10">
        {/* Handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

        <p className="text-xs font-semibold uppercase tracking-widest text-[#475569] text-center mb-1">
          {match.stage} · {formatKickoffShort(match.kickoff_at)}
        </p>

        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="text-center">
            {match.home_logo && <img src={match.home_logo} alt={match.home_team} className="size-14 mx-auto mb-2 object-contain" />}
            <p className="text-sm font-semibold text-[#f1f5f9] max-w-20 leading-tight">{match.home_team}</p>
          </div>
          <span className="font-[family-name:var(--font-bebas)] text-3xl text-[#f59e0b]">VS</span>
          <div className="text-center">
            {match.away_logo && <img src={match.away_logo} alt={match.away_team} className="size-14 mx-auto mb-2 object-contain" />}
            <p className="text-sm font-semibold text-[#f1f5f9] max-w-20 leading-tight">{match.away_team}</p>
          </div>
        </div>

        {/* Pick buttons */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPrediction(opt.value)}
              className={`rounded-xl py-3 px-2 text-xs font-bold uppercase tracking-widest transition-all ${
                prediction === opt.value
                  ? 'bg-[#f59e0b] text-[#080c14] scale-105 shadow-lg shadow-[#f59e0b]/20'
                  : 'bg-[#1a2535] text-[#94a3b8] border border-white/8'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Score picker — Final only */}
        {isFinal && (
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b] text-center mb-3">
              Predict the score (Final tiebreaker)
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs text-[#475569]">{match.home_team}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPredHome(Math.max(0, predHome - 1))} className="size-8 rounded-lg bg-[#1a2535] text-[#f1f5f9] font-bold text-lg">−</button>
                  <span className="font-[family-name:var(--font-bebas)] text-4xl text-[#f1f5f9] w-10 text-center">{predHome}</span>
                  <button onClick={() => setPredHome(predHome + 1)} className="size-8 rounded-lg bg-[#1a2535] text-[#f1f5f9] font-bold text-lg">+</button>
                </div>
              </div>
              <span className="font-[family-name:var(--font-bebas)] text-4xl text-[#475569]">–</span>
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs text-[#475569]">{match.away_team}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPredAway(Math.max(0, predAway - 1))} className="size-8 rounded-lg bg-[#1a2535] text-[#f1f5f9] font-bold text-lg">−</button>
                  <span className="font-[family-name:var(--font-bebas)] text-4xl text-[#f1f5f9] w-10 text-center">{predAway}</span>
                  <button onClick={() => setPredAway(predAway + 1)} className="size-8 rounded-lg bg-[#1a2535] text-[#f1f5f9] font-bold text-lg">+</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-[#ef4444] text-sm text-center mb-3">{error}</p>}

        <button
          onClick={save}
          disabled={saving || !prediction}
          className="w-full bg-[#f59e0b] text-[#080c14] font-bold rounded-xl py-4 text-sm uppercase tracking-widest disabled:opacity-40"
        >
          {saving ? 'Saving…' : existingPick ? 'Update Pick' : 'Lock In Pick'}
        </button>
      </div>
    </div>
  );
}
