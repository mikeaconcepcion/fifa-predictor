'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface SpoilerModeContextType {
  spoilerMode: boolean;
  toggle: () => void;
}

const SpoilerModeContext = createContext<SpoilerModeContextType>({
  spoilerMode: false,
  toggle: () => {},
});

export function SpoilerModeProvider({ children }: { children: React.ReactNode }) {
  const [spoilerMode, setSpoilerMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSpoilerMode(localStorage.getItem('spoiler-mode') === 'true');
  }, []);

  const toggle = () => {
    setSpoilerMode(prev => {
      const next = !prev;
      localStorage.setItem('spoiler-mode', String(next));
      return next;
    });
  };

  if (!mounted) return <>{children}</>;

  return (
    <SpoilerModeContext.Provider value={{ spoilerMode, toggle }}>
      {children}
    </SpoilerModeContext.Provider>
  );
}

export const useSpoilerMode = () => useContext(SpoilerModeContext);
