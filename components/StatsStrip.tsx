'use client';

import { useEffect, useRef, useState } from 'react';

const STATS = [
  { value: 48,  label: 'Nations'  },
  { value: 104, label: 'Matches'  },
  { value: 16,  label: 'Stadiums' },
  { value: 3,   label: 'Hosts'    },
  { value: 39,  label: 'Days'     },
];

function useCountUp(target: number, duration = 1200, triggered: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!triggered) return;
    let start: number | null = null;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [triggered, target, duration]);

  return count;
}

function StatItem({ value, label, triggered }: { value: number; label: string; triggered: boolean }) {
  const count = useCountUp(value, 1000 + value * 4, triggered);
  return (
    <div className="flex flex-col items-center justify-center min-w-[80px] px-4">
      <span className="font-[family-name:var(--font-bebas)] text-4xl leading-none text-[#f59e0b]">
        {triggered ? count : 0}
      </span>
      <span className="text-[10px] uppercase tracking-widest text-[#475569] mt-1">{label}</span>
    </div>
  );
}

export default function StatsStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setTriggered(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="mx-4 mb-6">
      <div className="bg-[#0f1923] border border-white/8 rounded-2xl py-5 overflow-x-auto">
        <div className="flex items-center divide-x divide-white/8 min-w-max mx-auto px-2">
          {STATS.map((s) => (
            <StatItem key={s.label} value={s.value} label={s.label} triggered={triggered} />
          ))}
        </div>
      </div>
    </div>
  );
}
