import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getWebPush } from '@/lib/webpush';

async function sendReminders() {
  const db = createServiceClient();

  // Matches kicking off in 55–65 min (1hr window) or 23–25hr (24hr window)
  const now = new Date();
  const windows = [
    { minMs: 55 * 60 * 1000,  maxMs: 65 * 60 * 1000,  label: '1hr'  },
    { minMs: 23 * 3600 * 1000, maxMs: 25 * 3600 * 1000, label: '24hr' },
  ];

  let totalSent = 0;

  for (const win of windows) {
    const from = new Date(now.getTime() + win.minMs).toISOString();
    const to   = new Date(now.getTime() + win.maxMs).toISOString();

    const { data: matches } = await db
      .from('matches')
      .select('id, home_team, away_team, kickoff_at')
      .eq('status', 'NS')
      .gte('kickoff_at', from)
      .lte('kickoff_at', to);

    if (!matches || matches.length === 0) continue;

    const { data: subs } = await db.from('push_subscriptions').select('*');
    if (!subs || subs.length === 0) continue;

    for (const match of matches) {
      const title = win.label === '1hr'
        ? `⏰ Kicks off in 1 hour!`
        : `📅 Match tomorrow — make your pick!`;
      const body = `${match.home_team} vs ${match.away_team}`;

      const wp = getWebPush();
      for (const sub of subs) {
        try {
          await wp.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ title, body, url: '/matches' })
          );
          totalSent++;
        } catch {
          // Subscription expired — remove it
          await db.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    }
  }

  return { sent: totalSent };
}

function isAuthorized(req: NextRequest) {
  return req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await sendReminders());
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await sendReminders());
}
