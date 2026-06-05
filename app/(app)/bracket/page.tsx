import { createSupabaseServerClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import BracketView from '@/components/BracketView';

export default async function BracketPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('kickoff_at', { ascending: true });

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-12 pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b]">FIFA World Cup 2026</p>
        <h1 className="font-[family-name:var(--font-bebas)] text-3xl text-[#f1f5f9] tracking-wide mt-0.5">Bracket</h1>
      </div>

      {/* Tab switcher */}
      <div className="px-4 mb-4 flex gap-2">
        <Link href="/matches"
          className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-[#0f1923] text-[#475569] border border-white/8">
          Matches
        </Link>
        <span className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-[#f59e0b] text-[#080c14]">
          Bracket
        </span>
      </div>

      <BracketView matches={matches ?? []} />
    </div>
  );
}
