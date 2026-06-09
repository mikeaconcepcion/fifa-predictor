import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { team, logo } = await req.json();

  const db = createServiceClient();
  await db.from('profiles').update({
    favorite_team: team ?? null,
    favorite_team_logo: logo ?? null,
  }).eq('id', user.id);

  return NextResponse.json({ ok: true });
}
