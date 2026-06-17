import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getWebPush } from '@/lib/webpush';

function isAuthorized(req: NextRequest) {
  return req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, body, url = '/' } = await req.json();
  if (!title || !body) return NextResponse.json({ error: 'title and body required' }, { status: 400 });

  const db = createServiceClient();
  const { data: subs } = await db.from('push_subscriptions').select('*');
  if (!subs || subs.length === 0) return NextResponse.json({ sent: 0 });

  const wp = getWebPush();
  let sent = 0;

  for (const sub of subs) {
    try {
      await wp.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body, url })
      );
      sent++;
    } catch {
      await db.from('push_subscriptions').delete().eq('id', sub.id);
    }
  }

  return NextResponse.json({ sent });
}
