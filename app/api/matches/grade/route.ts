import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

async function grade() {
  const db = createServiceClient();

  // All ungraded picks for finished matches
  const { data: picks, error } = await db
    .from('picks')
    .select('id, user_id, prediction, pred_home_score, pred_away_score, match_id, matches!inner(home_score, away_score, status, stage)')
    .is('points_earned', null)
    .eq('matches.status', 'FT');

  if (error) return { error: error.message };
  if (!picks || picks.length === 0) return { graded: 0 };

  // Tally points per user
  const userDeltas: Record<string, { points: number; correct: number; exact: number }> = {};

  const pickUpdates = picks
    .filter((p: any) => p.matches.home_score !== null && p.matches.away_score !== null)
    .map((p: any) => {
      const { home_score, away_score, stage } = p.matches;
      const actual = home_score > away_score ? 'home' : away_score > home_score ? 'away' : 'draw';

      const stagePoints: Record<string, number> = {
        'Group Stage': 1, 'Round of 32': 2, 'Round of 16': 3,
        'Quarter-Final': 4, 'Semi-Final': 5, '3rd Place': 5, 'Final': 10,
      };

      let points = 0;
      let correct = 0;
      let exact = 0;

      if (p.prediction === actual) {
        correct = 1;
        points = stagePoints[stage] ?? 1;
        if (stage === 'Final' && p.pred_home_score === home_score && p.pred_away_score === away_score) {
          points += 5; // exact score tiebreaker
          exact = 1;
        }
      }

      if (!userDeltas[p.user_id]) userDeltas[p.user_id] = { points: 0, correct: 0, exact: 0 };
      userDeltas[p.user_id].points += points;
      userDeltas[p.user_id].correct += correct;
      userDeltas[p.user_id].exact += exact;

      return { id: p.id, points_earned: points };
    });

  if (pickUpdates.length === 0) return { graded: 0 };

  // Write pick results
  await Promise.all(
    pickUpdates.map(({ id, points_earned }) =>
      db.from('picks').update({ points_earned }).eq('id', id)
    )
  );

  // Update profile totals
  await Promise.all(
    Object.entries(userDeltas).map(async ([userId, delta]) => {
      const { data: profile } = await db
        .from('profiles')
        .select('total_points, correct_picks, exact_scores')
        .eq('id', userId)
        .single();
      if (!profile) return;
      return db.from('profiles').update({
        total_points: (profile.total_points ?? 0) + delta.points,
        correct_picks: (profile.correct_picks ?? 0) + delta.correct,
        exact_scores: (profile.exact_scores ?? 0) + delta.exact,
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
