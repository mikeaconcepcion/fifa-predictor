import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

function isAuthorized(req: NextRequest) {
  return req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return sync(req);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return sync(req);
}

async function sync(req: NextRequest) {

  const apiKey = process.env.FOOTBALL_DATA_KEY;
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 });

  const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
    headers: { 'X-Auth-Token': apiKey },
  });

  if (!res.ok) return NextResponse.json({ error: 'football-data.org error' }, { status: 502 });

  const data = await res.json();
  const fixtures = data.matches ?? [];

  const db = createServiceClient();

  const confirmed = fixtures.filter((f: any) => f.homeTeam.name && f.awayTeam.name);

  // Upsert metadata without scores first — avoids overwriting valid scores with null
  const metaRows = confirmed.map((f: any) => ({
    api_id: f.id,
    home_team: f.homeTeam.name,
    away_team: f.awayTeam.name,
    home_flag: f.homeTeam.crest,
    away_flag: f.awayTeam.crest,
    home_logo: f.homeTeam.crest,
    away_logo: f.awayTeam.crest,
    kickoff_at: f.utcDate,
    venue: null,
    stage: mapStage(f.stage),
    group_name: extractGroup(f.group),
    status: mapStatus(f.status),
  }));

  const { error } = await db.from('matches').upsert(metaRows, { onConflict: 'api_id' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update scores separately — only when non-null, so we never overwrite a known score with null
  const scoreRows = confirmed.flatMap((f: any) => {
    const home = f.score?.fullTime?.home ?? f.score?.halfTime?.home ?? null;
    const away = f.score?.fullTime?.away ?? f.score?.halfTime?.away ?? null;
    if (home === null || away === null) return [];
    return [{ api_id: f.id, home_score: home, away_score: away }];
  });

  // Use update (not upsert) for passes 2 & 3 — UPDATE is a no-op on missing rows, never an INSERT
  if (scoreRows.length > 0) {
    await Promise.all(
      scoreRows.map((r: any) =>
        db.from('matches').update({ home_score: r.home_score, away_score: r.away_score }).eq('api_id', r.api_id)
      )
    );
  }

  // Force FT only for matches the API reports as FINISHED — fullTime scores can be non-null during live play
  const ftApiIds = confirmed
    .filter((f: any) => f.status === 'FINISHED' && f.score?.fullTime?.home != null && f.score?.fullTime?.away != null)
    .map((f: any) => f.id);
  if (ftApiIds.length > 0) {
    await db.from('matches').update({ status: 'FT' }).in('api_id', ftApiIds);
  }

  const rows = metaRows; // for synced count

  // Temporary debug: return live match data so we can inspect the API response
  const liveRaw = fixtures.filter((f: any) => ['IN_PLAY', 'PAUSED'].includes(f.status));
  return NextResponse.json({ synced: rows.length, liveMatches: liveRaw.map((f: any) => ({ id: f.id, status: f.status, score: f.score })) });
}

function mapStatus(s: string): string {
  if (['IN_PLAY', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT'].includes(s)) return 'LIVE';
  if (s === 'FINISHED') return 'FT';
  if (s === 'POSTPONED') return 'PST';
  return 'NS';
}

function mapStage(stage: string): string {
  if (stage === 'GROUP_STAGE') return 'Group Stage';
  if (stage === 'LAST_32') return 'Round of 32';
  if (stage === 'LAST_16') return 'Round of 16';
  if (stage === 'QUARTER_FINALS') return 'Quarter-Final';
  if (stage === 'SEMI_FINALS') return 'Semi-Final';
  if (stage === 'THIRD_PLACE') return '3rd Place';
  if (stage === 'FINAL') return 'Final';
  return stage;
}

function extractGroup(group: string | null): string | null {
  if (!group) return null;
  const match = group.match(/GROUP_([A-Z])/);
  return match ? match[1] : null;
}
