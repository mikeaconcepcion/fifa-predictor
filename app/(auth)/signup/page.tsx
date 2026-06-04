'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function SignUpPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: displayName } },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push('/');
    router.refresh();
  };

  const signInWithGoogle = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/api/auth/callback` },
    });
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col">

      {/* ── Hero ── */}
      <div className="relative flex flex-col items-center justify-center pt-14 pb-8 px-6 overflow-hidden min-h-[55vh]">
        <img src="/stadiumnight2.jpg" alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#080c14]/70" />
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #080c14)' }} />

        <img src="/WorldCupTrophy.png" alt="FIFA World Cup Trophy"
          className="relative w-36 h-auto mb-4 drop-shadow-2xl" />

        <h1 className="relative font-[family-name:var(--font-bebas)] text-5xl text-[#f59e0b] tracking-widest text-center leading-none drop-shadow-lg">
          World Cup 2026
        </h1>
        <p className="relative text-white/80 text-xs tracking-[0.2em] uppercase mt-2 drop-shadow">USA · Canada · Mexico</p>
        <div className="relative z-10 flex items-center gap-3 mt-5">
          {[['us','USA'],['ca','CAN'],['mx','MEX']].map(([code, label]) => (
            <div key={code} className="flex flex-col items-center gap-1">
              <img src={`https://flagcdn.com/w40/${code}.png`} alt={label}
                className="w-10 h-6 rounded object-cover shadow-lg ring-1 ring-white/10" />
              <span className="text-[10px] text-[#475569] tracking-widest">{label}</span>
            </div>
          ))}
        </div>
        <p className="relative z-10 text-[#475569] text-xs mt-4">June 11 – July 19, 2026</p>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-[#f59e0b]/20 to-transparent mx-4" />

      <div className="flex-1 flex flex-col justify-center px-6 py-8 w-full max-w-sm mx-auto">
        <p className="text-center text-sm text-[#94a3b8] mb-6">Create your account to start predicting</p>
        <div className="w-full max-w-sm">

        <form onSubmit={signUp} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-[#475569] mb-1.5 block">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
              className="w-full bg-[#0f1923] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-[#f1f5f9] placeholder-[#475569] focus:outline-none focus:border-[#f59e0b]/50"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-[#475569] mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-[#0f1923] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-[#f1f5f9] placeholder-[#475569] focus:outline-none focus:border-[#f59e0b]/50"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-[#475569] mb-1.5 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-[#0f1923] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-[#f1f5f9] placeholder-[#475569] focus:outline-none focus:border-[#f59e0b]/50"
              placeholder="Min 6 characters"
            />
          </div>

          {error && <p className="text-[#ef4444] text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#f59e0b] text-[#080c14] font-bold rounded-xl py-3.5 text-sm uppercase tracking-widest disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-[#475569]">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full bg-[#0f1923] border border-white/10 rounded-xl py-3.5 text-sm font-semibold text-[#f1f5f9] flex items-center justify-center gap-3"
        >
          <svg className="size-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-sm text-[#475569] mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-[#f59e0b] font-semibold">Sign in</a>
        </p>
      </div>
      </div>
    </div>
  );
}
