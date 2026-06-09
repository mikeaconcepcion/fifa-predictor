'use client';

import { useSpoilerMode } from '@/lib/spoiler-mode';

export default function SpoilerToggle() {
  const { spoilerMode, toggle } = useSpoilerMode();

  return (
    <div className="flex items-center justify-between bg-[#0f1923] border border-white/8 rounded-xl px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-[#f1f5f9]">Spoiler Mode</p>
        <p className="text-xs text-[#94a3b8] mt-0.5">Blur scores on finished matches</p>
      </div>
      <button
        onClick={toggle}
        className={`flex items-center w-12 h-6 rounded-full transition-colors duration-200 ${spoilerMode ? 'bg-[#f59e0b]' : 'bg-[#1a2535]'}`}
      >
        <span className={`size-4 shrink-0 rounded-full bg-white shadow transition-[margin-left] duration-200 ${spoilerMode ? 'ml-7' : 'ml-1'}`} />
      </button>
    </div>
  );
}
