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

  // Fetch all members for the user's groups so we can filter the leaderboard
  const { data: allGroupMembers } = groupIds.length > 0
    ? await supabase.from('group_members').select('group_id, user_id').in('group_id', groupIds)
    : { data: [] };

  const groupMemberMap: Record<string, string[]> = {};
  for (const m of (allGroupMembers ?? [])) {
    if (!groupMemberMap[m.group_id]) groupMemberMap[m.group_id] = [];
    groupMemberMap[m.group_id].push(m.user_id);
  }

  return (
    <div className="flex flex-col">
      <div className="relative overflow-hidden pt-14 pb-10 px-4">
        <img src="/WorldCupTrophy.jpg" alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#080c14]/55" />
        <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #080c14)' }} />
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b]">Rankings</p>
          <h1 className="font-[family-name:var(--font-bebas)] text-3xl text-[#f1f5f9] tracking-wide mt-0.5">Leaderboard</h1>
        </div>
      </div>
      <ScrollReveal delay={100}>
        <GlobalLeaderboard profiles={profiles ?? []} currentUserId={user.id} groups={groups ?? []} groupMemberMap={groupMemberMap} />
      </ScrollReveal>
    </div>
  );
}
