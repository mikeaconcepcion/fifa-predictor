'use client';

import { useSpoilerMode } from '@/lib/spoiler-mode';

interface Props {
  children: React.ReactNode;
  className?: string;
}

export default function SpoilerScore({ children, className = '' }: Props) {
  const { spoilerMode } = useSpoilerMode();
  return (
    <span className={`${className} ${spoilerMode ? 'blur-sm select-none' : ''} transition-all duration-200`}>
      {children}
    </span>
  );
}
