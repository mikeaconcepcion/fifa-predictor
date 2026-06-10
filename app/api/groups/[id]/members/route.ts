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

  const { data: memberRows } = await service
    .from('group_members')
    .select('user_id, joined_at, nickname')
    .eq('group_id', groupId)
    .order('joined_at');

  if (!memberRows?.length) return NextResponse.json([]);

  const { data: profiles } = await service
    .from('profiles')
    .select('id, display_name')
    .in('id', memberRows.map((m: any) => m.user_id));

  const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p.display_name]));

  return NextResponse.json(
    memberRows.map((m: any) => ({
      user_id: m.user_id,
      joined_at: m.joined_at,
      nickname: m.nickname ?? null,
      profile: { display_name: profileMap[m.user_id] ?? 'Unknown' },
    }))
  );
}
