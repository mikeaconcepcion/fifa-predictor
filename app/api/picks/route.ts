import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { isLocked } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { match_id, prediction, pred_home_score, pred_away_score } = await req.json();

  // Verify match exists and isn't locked
  const { data: match } = await supabase
    .from('matches')
    .select('id, kickoff_at, stage')
    .eq('id', match_id)
    .single();

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  if (isLocked(match.kickoff_at)) return NextResponse.json({ error: 'Match has started — picks are locked.' }, { status: 403 });

  const { data, error } = await supabase
    .from('picks')
    .upsert({
      user_id: user.id,
      match_id,
      prediction,
      pred_home_score: match.stage === 'Final' ? pred_home_score : null,
      pred_away_score: match.stage === 'Final' ? pred_away_score : null,
    }, { onConflict: 'user_id,match_id' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { match_id } = await req.json();

  // Check lock
  const { data: match } = await supabase
    .from('matches')
    .select('kickoff_at')
    .eq('id', match_id)
    .single();

  if (match && isLocked(match.kickoff_at)) {
    return NextResponse.json({ error: 'Match has started — picks are locked.' }, { status: 403 });
  }

  await supabase.from('picks').delete().eq('user_id', user.id).eq('match_id', match_id);
  return NextResponse.json({ ok: true });
}
