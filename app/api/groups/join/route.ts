import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { invite_code } = await req.json();

  // Use service client so RLS doesn't block the lookup for non-members
  const service = createServiceClient();
  const { data: group } = await service
    .from('groups')
    .select('id, name')
    .eq('invite_code', invite_code.trim().toUpperCase())
    .single();

  if (!group) return NextResponse.json({ error: 'Invalid invite code.' }, { status: 404 });

  const { error } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id });

  if (error?.code === '23505') return NextResponse.json({ error: 'Already a member.' }, { status: 409 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(group);
}
