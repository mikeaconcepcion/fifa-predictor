import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { generateInviteCode } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const invite_code = generateInviteCode();

  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name: name.trim(), invite_code, admin_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-join creator
  await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id });

  return NextResponse.json(group, { status: 201 });
}
