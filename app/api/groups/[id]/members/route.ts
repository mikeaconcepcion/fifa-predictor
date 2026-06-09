import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createServiceClient } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const service = createServiceClient();

  // Verify requester is admin of this group
  const { data: group } = await service
    .from('groups')
    .select('admin_id')
    .eq('id', groupId)
    .single();

  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (group.admin_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: members } = await service
    .from('group_members')
    .select('user_id, joined_at, profile:user_id(display_name)')
    .eq('group_id', groupId)
    .order('joined_at');

  return NextResponse.json(members ?? []);
}
