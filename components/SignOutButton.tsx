'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const router = useRouter();

  const signOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <button
      onClick={signOut}
      className="w-full bg-[#0f1923] border border-white/8 rounded-xl py-3.5 text-sm font-semibold text-[#ef4444]"
    >
      Sign Out
    </button>
  );
}
