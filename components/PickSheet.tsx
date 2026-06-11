'use client';

import { useState } from 'react';
import type { Match, Pick, Prediction } from '@/lib/types';
import LocalTime from './LocalTime';

interface Props {
  match: Match;
  existingPick?: Pick;
  onClose: () => void;
  onSave: (pick: Pick) => void;
  scorePredictor?: boolean;
}

export default function PickSheet({ match, existingPick, onClose, onSave, scorePredictor = false }: Props) {
  const hasExistingScore = existingPick?.pred_home_score != null && existingPick?.pred_away_score != null;

  const [prediction, setPrediction] = useState<Prediction | null>(existingPick?.prediction ?? null);
  const [predHome, setPredHome] = useState(existingPick?.pred_home_score ?? 0);
  const [predAway, setPredAway] = useState(existingPick?.pred_away_score ?? 0);
  const [scoreMode, setScoreMode] = useState(hasExistingScore || scorePredictor);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isFinal = match.stage === 'Final';

  const scoreBonusLabel: Record<string, string> = {
    'Group Stage': '+0.5pt', 'Round of 32': '+1pt', 'Round of 16': '+1.5pts',
    'Quarter-Final': '+2pts', 'Semi-Final': '+2.5pts', '3rd Place': '+2.5pts',
  };
  const bonusLabel = scoreBonusLabel[match.stage] ?? '+0.5pt';
  const showScoreInput = scorePredictor || isFinal;

  // Derive prediction from scores
  const deriveFromScore = (home: number, away: number): Prediction =>
    home > away ? 'home' : away > home ? 'away' : 'draw';

  const adjustHome = (delta: number) => {
    const next = Math.max(0, predHome + delta);
    setPredHome(next);
    if (scoreMode) setPrediction(deriveFromScore(next, predAway));
  };

  const adjustAway = (delta: number) => {
    const next = Math.max(0, predAway + delta);
    setPredAway(next);
    if (scoreMode) setPrediction(deriveFromScore(predHome, next));
  };

  const enterScoreMode = () => {
    setScoreMode(true);
    setPrediction(deriveFromScore(predHome, predAway));
  };

  const selectPrediction = (p: Prediction) => {
    setPrediction(p);
    if (!isFinal) {
      setScoreMode(false);
      setPredHome(0);
      setPredAway(0);
    }
  };

  const save = async () => {
    if (!prediction) { setError('Select a result or enter a score.'); return; }
    setSaving(true);
    setError('');
    try {
      const sendScores = scoreMode || isFinal;
      const res = await fetch('/api/picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: match.id,
          prediction,
          pred_home_score: sendScores ? predHome : null,
          pred_away_score: sendScores ? predAway : null,
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
      <div className="relative bg-[#0f1923] rounded-t-3xl border-t border-white/10 p-6 pb-28">
        {/* Handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

        <p className="text-xs font-semibold uppercase tracking-widest text-[#94a3b8] text-center mb-1">
          {match.stage} · <LocalTime iso={match.kickoff_at} />
        </p>

        {/* Teams + score boxes */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {/* Home team */}
          <div className="flex-1 flex flex-col items-center gap-2">
            {match.home_logo && <img src={match.home_logo} alt={match.home_team} className="size-12 object-contain" />}
            <p className="text-xs font-semibold text-[#f1f5f9] text-center leading-tight">{match.home_team}</p>
          </div>

          {/* Score boxes or VS */}
          {showScoreInput && scoreMode ? (
            <div className="flex items-center gap-2">
              {/* Home score */}
              <div className="flex flex-col items-center gap-1">
                <button onClick={() => adjustHome(1)} className="size-7 rounded-lg bg-[#1a2535] text-[#f1f5f9] font-bold text-base leading-none flex items-center justify-center">+</button>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${
                  prediction === 'home' ? 'bg-[#f59e0b]/15 border-[#f59e0b]' :
                  prediction === 'draw' ? 'bg-white/5 border-white/20' :
                  'bg-white/5 border-white/10'
                }`}>
                  <span className="font-[family-name:var(--font-bebas)] text-3xl text-[#f1f5f9]">{predHome}</span>
                </div>
                <button onClick={() => adjustHome(-1)} className="size-7 rounded-lg bg-[#1a2535] text-[#f1f5f9] font-bold text-base leading-none flex items-center justify-center">−</button>
              </div>

              <span className="font-[family-name:var(--font-bebas)] text-2xl text-[#94a3b8]">–</span>

              {/* Away score */}
              <div className="flex flex-col items-center gap-1">
                <button onClick={() => adjustAway(1)} className="size-7 rounded-lg bg-[#1a2535] text-[#f1f5f9] font-bold text-base leading-none flex items-center justify-center">+</button>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${
                  prediction === 'away' ? 'bg-[#f59e0b]/15 border-[#f59e0b]' :
                  prediction === 'draw' ? 'bg-white/5 border-white/20' :
                  'bg-white/5 border-white/10'
                }`}>
                  <span className="font-[family-name:var(--font-bebas)] text-3xl text-[#f1f5f9]">{predAway}</span>
                </div>
                <button onClick={() => adjustAway(-1)} className="size-7 rounded-lg bg-[#1a2535] text-[#f1f5f9] font-bold text-base leading-none flex items-center justify-center">−</button>
              </div>
            </div>
          ) : (
            <span className="font-[family-name:var(--font-bebas)] text-3xl text-[#f59e0b] px-2">VS</span>
          )}

          {/* Away team */}
          <div className="flex-1 flex flex-col items-center gap-2">
            {match.away_logo && <img src={match.away_logo} alt={match.away_team} className="size-12 object-contain" />}
            <p className="text-xs font-semibold text-[#f1f5f9] text-center leading-tight">{match.away_team}</p>
          </div>
        </div>

        {/* Score predictor bonus banner */}
        {scorePredictor && !isFinal && (
          <div className="mb-4">
            {scoreMode ? (
              <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-xl px-4 py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#f59e0b]">{bonusLabel} bonus if exact ⚡</p>
                  <p className="text-[10px] text-[#94a3b8] mt-0.5">
                    {prediction ? `Predicting: ${prediction === 'home' ? match.home_team : prediction === 'away' ? match.away_team : 'Draw'}` : 'Adjust the score above'}
                  </p>
                </div>
                <button onClick={() => { setScoreMode(false); setPrediction(null); }} className="text-[10px] text-[#94a3b8] underline">
                  Skip score
                </button>
              </div>
            ) : (
              <button
                onClick={enterScoreMode}
                className="w-full bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-xl px-4 py-2.5 text-xs font-bold text-[#f59e0b] text-center"
              >
                ⚡ Predict exact score for +1 bonus
              </button>
            )}
          </div>
        )}

        {/* Pick buttons — always visible, auto-reflect score-derived pick */}
        {(!scoreMode || isFinal) && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => selectPrediction(opt.value)}
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
        )}

        {/* Score-derived pick label in score mode */}
        {scoreMode && !isFinal && prediction && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {options.map(opt => (
              <div
                key={opt.value}
                className={`rounded-xl py-3 px-2 text-xs font-bold uppercase tracking-widest text-center ${
                  prediction === opt.value
                    ? 'bg-[#f59e0b] text-[#080c14]'
                    : 'bg-[#1a2535] text-[#475569] border border-white/8'
                }`}
              >
                {opt.label}
              </div>
            ))}
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
