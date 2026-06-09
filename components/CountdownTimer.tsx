'use client';

import { useState, useEffect } from 'react';
import { getCountdown } from '@/lib/utils';

export default function CountdownTimer({ kickoff_at }: { kickoff_at: string }) {
  const [countdown, setCountdown] = useState(getCountdown(kickoff_at));

  useEffect(() => {
    const t = setInterval(() => setCountdown(getCountdown(kickoff_at)), 1000);
    return () => clearInterval(t);
  }, [kickoff_at]);

  if (countdown.expired) {
    return (
      <div className="flex justify-center">
        <span className="text-xs font-bold text-[#ef4444] uppercase tracking-widest">Kicked off</span>
      </div>
    );
  }

  const pads = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex justify-center gap-3">
      {[
        { v: countdown.days, l: 'D' },
        { v: countdown.hours, l: 'H' },
        { v: countdown.mins, l: 'M' },
        { v: countdown.secs, l: 'S' },
      ].map(({ v, l }) => (
        <div key={l} className="flex flex-col items-center">
          <span className="font-[family-name:var(--font-bebas)] text-3xl text-[#f59e0b] leading-none">
            {pads(v)}
          </span>
          <span className="text-[9px] text-[#94a3b8] uppercase tracking-widest mt-0.5">{l}</span>
        </div>
      ))}
    </div>
  );
}
