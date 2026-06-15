import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

async function grade() {
  const db = createServiceClient();

  const { data: ftMatches, error: matchErr } = await db
    .from('matches')
    .select('id, home_score, away_score, stage')
    .eq('status', 'FT')
    .not('home_score', 'is', null)
    .not('away_score', 'is', null);

  if (matchErr) return { error: matchErr.message };
  if (!ftMatches || ftMatches.length === 0) return { graded: 0 };

  const matchMap: Record<number, { home_score: number; away_score: number; stage: string }> = {};
  for (const m of ftMatches) matchMap[m.id] = m;
  const ftMatchIds = ftMatches.map(m => m.id);

  // Grade ALL picks for FT matches — not just NULL ones — so grade is always idempotent
  const { data: picks, error } = await db
    .from('picks')
    .select('id, user_id, prediction, pred_home_score, pred_away_score, match_id')
    .in('match_id', ftMatchIds);

  if (error) return { error: error.message };
  if (!picks || picks.length === 0) return { graded: 0 };

  // Find users in score-predictor groups
  const userIds = [...new Set((picks as any[]).map(p => p.user_id))];
  let scorePredictorUserIds = new Set<string>();
  if (userIds.length > 0) {
    const { data: spGroupRows } = await db
      .from('groups')
      .select('id')
      .eq('score_predictor', true);
    const spGroupIds = (spGroupRows ?? []).map((g: any) => g.id);
    if (spGroupIds.length > 0) {
      const { data: spMembers } = await db
        .from('group_members')
        .select('user_id')
        .in('group_id', spGroupIds)
        .in('user_id', userIds);
      scorePredictorUserIds = new Set((spMembers ?? []).map((m: any) => m.user_id));
    }
  }

  const stagePoints: Record<string, number> = {
    'Group Stage': 1, 'Round of 32': 2, 'Round of 16': 3,
    'Quarter-Final': 4, 'Semi-Final': 5, '3rd Place': 5, 'Final': 10,
  };
  const scoreBonusPoints: Record<string, number> = {
    'Group Stage': 0.5, 'Round of 32': 1, 'Round of 16': 1.5,
    'Quarter-Final': 2, 'Semi-Final': 2.5, '3rd Place': 2.5,
  };

  const pickUpdates = picks
    .filter((p: any) => matchMap[p.match_id])
    .map((p: any) => {
      const { home_score, away_score, stage } = matchMap[p.match_id];
      const actual = home_score > away_score ? 'home' : away_score > home_score ? 'away' : 'draw';

      let points = 0;
      let scorePoints = 0;
      let exact = false;

      if (p.prediction === actual) {
        points = stagePoints[stage] ?? 1;
        if (stage === 'Final' && p.pred_home_score === home_score && p.pred_away_score === away_score) {
          points += 5;
          exact = true;
        } else if (
          stage !== 'Final' &&
          p.pred_home_score === home_score &&
          p.pred_away_score === away_score &&
          scorePredictorUserIds.has(p.user_id)
        ) {
          scorePoints = scoreBonusPoints[stage] ?? 0.5;
          exact = true;
        }
      }

      return { id: p.id, user_id: p.user_id, points_earned: points, score_points_earned: scorePoints, exact };
    });

  if (pickUpdates.length === 0) return { graded: 0 };

  // Write pick results
  await Promise.all(
    pickUpdates.map(({ id, points_earned, score_points_earned }) =>
      db.from('picks').update({ points_earned, score_points_earned }).eq('id', id)
    )
  );

  // Recalculate profile totals from the full pick history (not delta-based)
  // This ensures grade is safe to re-run and self-correcting
  const affectedUserIds = [...new Set(pickUpdates.map(p => p.user_id))];
  await Promise.all(
    affectedUserIds.map(async (userId) => {
      const { data: allPicks } = await db
        .from('picks')
        .select('points_earned, score_points_earned')
        .eq('user_id', userId)
        .not('points_earned', 'is', null);

      if (!allPicks) return;

      const total_points = allPicks.reduce((sum: number, p: any) => sum + (p.points_earned ?? 0), 0);
      const score_points = allPicks.reduce((sum: number, p: any) => sum + (p.score_points_earned ?? 0), 0);
      const correct_picks = allPicks.filter((p: any) => (p.points_earned ?? 0) > 0).length;

      // Recalculate exact_scores from the current grade run's results for this user
      const exact_scores = pickUpdates.filter(p => p.user_id === userId && p.exact).length;

      return db.from('profiles').update({
        total_points,
        correct_picks,
        exact_scores,
        score_points,
      }).eq('id', userId);
    })
  );

  return { graded: pickUpdates.length };
}

function isAuthorized(req: NextRequest) {
  return req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await grade());
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await grade());
}
