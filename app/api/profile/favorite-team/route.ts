import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { teams, logos } = await req.json();

  const db = createServiceClient();
  await db.from('profiles').update({
    favorite_teams: teams ?? [],
    favorite_team_logos: logos ?? [],
    // keep legacy single columns in sync with first selection
    favorite_team: teams?.[0] ?? null,
    favorite_team_logo: logos?.[0] ?? null,
  }).eq('id', user.id);

  return NextResponse.json({ ok: true });
}
