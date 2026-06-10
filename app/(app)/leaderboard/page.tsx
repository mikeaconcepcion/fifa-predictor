import { createSupabaseServerClient, createServiceClient } from '@/lib/supabase';
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

  // Use service client to avoid self-referential RLS on group_members
  const service = createServiceClient();
  const { data: memberRows } = await service
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id);

  const groupIds = (memberRows ?? []).map((r: any) => r.group_id);

  const { data: groups } = groupIds.length > 0
    ? await service.from('groups').select('id, name').in('id', groupIds)
    : { data: [] };

  // Fetch all members for the user's groups so we can filter the leaderboard
  const { data: allGroupMembers } = groupIds.length > 0
    ? await service.from('group_members').select('group_id, user_id').in('group_id', groupIds)
    : { data: [] };

  const groupMemberMap: Record<string, string[]> = {};
  for (const m of (allGroupMembers ?? [])) {
    if (!groupMemberMap[m.group_id]) groupMemberMap[m.group_id] = [];
    groupMemberMap[m.group_id].push(m.user_id);
  }

  return (
    <div className="flex flex-col">
      <div className="relative overflow-hidden min-h-[280px] flex items-end pt-14 pb-6 px-4">
        <img src="/WorldCupTrophy.jpg" alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover object-center" />
        {/* Radial fade — blends all edges into the page background */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 25%, #080c14 75%)' }} />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #080c14)' }} />
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
