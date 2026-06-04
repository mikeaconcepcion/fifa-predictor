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

  const rows = fixtures
    .filter((f: any) => f.homeTeam.name && f.awayTeam.name)
    .map((f: any) => ({
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
    home_score: f.score.fullTime.home,
    away_score: f.score.fullTime.away,
    status: mapStatus(f.status),
  }));

  const { error } = await db.from('matches').upsert(rows, { onConflict: 'api_id' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ synced: rows.length });
}

function mapStatus(s: string): string {
  if (['IN_PLAY', 'PAUSED'].includes(s)) return 'LIVE';
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
