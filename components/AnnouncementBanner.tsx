'use client';

import { useState, useEffect } from 'react';

const ANNOUNCEMENT_KEY = 'announcement_score_predictor_v2';

export default function AnnouncementBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(ANNOUNCEMENT_KEY)) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(ANNOUNCEMENT_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative bg-[#0f1923] rounded-t-3xl border-t border-white/10 p-6 pb-10">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">⚡</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b]">New Feature</p>
            <h2 className="font-[family-name:var(--font-bebas)] text-2xl text-[#f1f5f9] tracking-wide leading-tight">
              Score Predictor
            </h2>
          </div>
        </div>

        <p className="text-sm text-[#94a3b8] mb-4 leading-relaxed">
          Group admins can now enable <span className="text-[#f1f5f9] font-semibold">Score Predictor</span> for their group. Predict the exact final score and earn bonus points on top of your regular pick — scaling with the round.
        </p>

        {/* Bonus points table */}
        <div className="bg-[#080c14] rounded-xl p-4 mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#f59e0b] mb-3">Exact score bonus</p>
          <div className="flex flex-col gap-1.5">
            {[
              { stage: 'Group Stage', bonus: '+0.5 pt' },
              { stage: 'Round of 32', bonus: '+1 pt' },
              { stage: 'Round of 16', bonus: '+1.5 pts' },
              { stage: 'Quarter-Final', bonus: '+2 pts' },
              { stage: 'Semi-Final', bonus: '+2.5 pts' },
              { stage: 'Final', bonus: '+5 pts' },
            ].map(row => (
              <div key={row.stage} className="flex items-center justify-between">
                <span className="text-xs text-[#94a3b8]">{row.stage}</span>
                <span className="font-[family-name:var(--font-bebas)] text-lg text-[#f59e0b]">{row.bonus}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-6">
          {[
            'Available to groups with Score Predictor enabled',
            'Winner is auto-detected from your score',
            'Group admin turns it on in Profile → My Groups',
          ].map(item => (
            <div key={item} className="flex items-start gap-2">
              <span className="text-[#f59e0b] text-sm mt-0.5">·</span>
              <p className="text-sm text-[#94a3b8]">{item}</p>
            </div>
          ))}
        </div>

        <button
          onClick={dismiss}
          className="w-full bg-[#f59e0b] text-[#080c14] font-bold rounded-xl py-4 text-sm uppercase tracking-widest"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
