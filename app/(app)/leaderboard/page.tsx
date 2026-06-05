import { createSupabaseServerClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import GlobalLeaderboard from '@/components/GlobalLeaderboard';
import ScrollReveal from '@/components/ScrollReveal';

export default async function LeaderboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('total_points', { ascending: false });

  const { data: memberRows } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id);

  const groupIds = (memberRows ?? []).map(r => r.group_id);

  const { data: groups } = groupIds.length > 0
    ? await supabase.from('groups').select('id, name').in('id', groupIds)
    : { data: [] };

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-12 pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#475569]">Rankings</p>
        <h1 className="font-[family-name:var(--font-bebas)] text-3xl text-[#f1f5f9] tracking-wide mt-0.5">Leaderboard</h1>
      </div>
      <ScrollReveal delay={100}>
        <GlobalLeaderboard profiles={profiles ?? []} currentUserId={user.id} groups={groups ?? []} />
      </ScrollReveal>
    </div>
  );
}
