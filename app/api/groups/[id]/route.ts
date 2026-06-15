import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: group } = await supabase.from('groups').select('admin_id').eq('id', groupId).single();
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (group.admin_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const update: Record<string, unknown> = {};
  if ('score_predictor' in body) update.score_predictor = body.score_predictor;
  if ('name' in body && typeof body.name === 'string' && body.name.trim()) update.name = body.name.trim();
  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  const { error } = await supabase
    .from('groups')
    .update(update)
    .eq('id', groupId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
