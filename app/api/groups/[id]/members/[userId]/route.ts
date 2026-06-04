import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id: groupId, userId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only admin can remove others; anyone can remove themselves
  const { data: group } = await supabase.from('groups').select('admin_id').eq('id', groupId).single();
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

  if (user.id !== group.admin_id && user.id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId);
  return NextResponse.json({ ok: true });
}
