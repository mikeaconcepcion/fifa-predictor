import { createSupabaseServerClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import TeamPicker from '@/components/TeamPicker';

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get all unique teams from matches
  const { data: matches } = await supabase
    .from('matches')
    .select('home_team, home_logo, away_team, away_logo');

  const teamMap = new Map<string, string>();
  for (const m of (matches ?? [])) {
    if (m.home_team && m.home_logo) teamMap.set(m.home_team, m.home_logo);
    if (m.away_team && m.away_logo) teamMap.set(m.away_team, m.away_logo);
  }
  const teams = Array.from(teamMap.entries())
    .map(([name, logo]) => ({ name, logo }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const { data: profile } = await supabase
    .from('profiles')
    .select('favorite_team')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col">
      <div className="px-4 pt-12 pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b]">One last thing</p>
        <h1 className="font-[family-name:var(--font-bebas)] text-4xl text-[#f1f5f9] tracking-wide mt-0.5">
          Who are you rooting for?
        </h1>
        <p className="text-sm text-[#475569] mt-1">Pick your team — shown on your profile</p>
      </div>

      <TeamPicker
        teams={teams}
        currentTeam={profile?.favorite_team}
        redirectTo={from === 'profile' ? '/profile' : '/'}
      />
    </div>
  );
}
