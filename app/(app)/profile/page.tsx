import { createSupabaseServerClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import GroupsSection from '@/components/GroupsSection';
import SignOutButton from '@/components/SignOutButton';
import SpoilerToggle from '@/components/SpoilerToggle';
import PushToggle from '@/components/PushToggle';

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*, favorite_teams, favorite_team_logos').eq('id', user.id).single();

  const { data: memberRows } = await supabase
    .from('group_members')
    .select('group_id, groups(id, name, invite_code, admin_id)')
    .eq('user_id', user.id);

  const groups = (memberRows ?? []).map((r: any) => r.groups).filter(Boolean);

  const totalMatches = profile?.correct_picks ?? 0;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="relative overflow-hidden pt-12 pb-6 px-4">
        <img src="/Stadiumcrowd.jpg" alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#080c14]/75" />
        <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #080c14)' }} />
        <div className="relative z-10 flex items-center gap-4">
          <div className="size-16 rounded-full bg-[#f59e0b]/20 border-2 border-[#f59e0b]/50 flex items-center justify-center flex-shrink-0">
            <span className="font-[family-name:var(--font-bebas)] text-3xl text-[#f59e0b]">
              {profile?.display_name?.charAt(0)?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-bebas)] text-3xl text-[#f1f5f9] tracking-wide leading-none">
              {profile?.display_name}
            </h1>
            <p className="text-xs text-[#94a3b8] mt-1">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Points', value: profile?.total_points ?? 0, color: 'text-[#f59e0b]' },
            { label: 'Correct', value: profile?.correct_picks ?? 0, color: 'text-[#22c55e]' },
            { label: 'Exact', value: profile?.exact_scores ?? 0, color: 'text-[#38bdf8]' },
          ].map(s => (
            <div key={s.label} className="bg-[#0f1923] border border-white/8 rounded-xl p-4 text-center">
              <p className={`font-[family-name:var(--font-bebas)] text-3xl ${s.color}`}>{s.value}</p>
              <p className="text-xs text-[#94a3b8] uppercase tracking-widest mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Favorite team */}
      <div className="px-4 mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b] mb-3">Rooting For</p>
        <Link
          href="/onboarding?from=profile"
          className="flex items-center gap-4 bg-[#0f1923] border border-white/8 rounded-xl px-4 py-3 transition-all duration-200 hover:border-[#f59e0b]/30"
        >
          {profile?.favorite_teams?.length > 0 ? (
            <>
              <div className="flex items-center gap-2">
                {(profile.favorite_teams as string[]).map((team: string, i: number) => (
                  <img key={team} src={(profile.favorite_team_logos as string[])?.[i]}
                    alt={team} className="size-8 object-contain" title={team} />
                ))}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#f1f5f9]">
                  {(profile.favorite_teams as string[]).join(', ')}
                </p>
                <p className="text-xs text-[#94a3b8]">Tap to change</p>
              </div>
            </>
          ) : (
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#f1f5f9]">Pick your teams</p>
              <p className="text-xs text-[#94a3b8]">Who are you rooting for? (up to 5)</p>
            </div>
          )}
          <span className="text-[#94a3b8]">→</span>
        </Link>
      </div>

      {/* Groups */}
      <div className="px-4 mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b] mb-3">My Groups</p>
        <GroupsSection groups={groups} userId={user.id} />
      </div>

      {/* Settings */}
      <div className="px-4 mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b] mb-3">Settings</p>
        <div className="flex flex-col gap-2">
          <SpoilerToggle />
          <PushToggle />
          <Link
            href="/how-to-play"
            className="flex items-center justify-between bg-[#0f1923] border border-white/8 rounded-xl px-4 py-3 transition-all duration-200 hover:border-[#f59e0b]/30"
          >
            <div>
              <p className="text-sm font-semibold text-[#f1f5f9]">How to Play</p>
              <p className="text-xs text-[#94a3b8] mt-0.5">Rules, scoring and tips</p>
            </div>
            <span className="text-[#94a3b8]">→</span>
          </Link>
        </div>
      </div>

      {/* Sign out */}
      <div className="px-4 mb-6">
        <SignOutButton />
      </div>
    </div>
  );
}
