import { createSupabaseServerClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import MatchesList from '@/components/MatchesList';

export default async function MatchesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('kickoff_at', { ascending: true });

  const { data: picks } = await supabase
    .from('picks')
    .select('*')
    .eq('user_id', user.id);

  const pickMap = new Map((picks ?? []).map(p => [p.match_id, p]));

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-12 pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#475569]">FIFA World Cup 2026</p>
        <h1 className="font-[family-name:var(--font-bebas)] text-3xl text-[#f1f5f9] tracking-wide mt-0.5">Matches</h1>
      </div>
      <MatchesList matches={matches ?? []} pickMap={pickMap} userId={user.id} />
    </div>
  );
}
