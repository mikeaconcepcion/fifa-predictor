import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Match, Prediction } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export function formatKickoffShort(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function isLocked(kickoff_at: string): boolean {
  return new Date(kickoff_at) <= new Date();
}

export function getMatchResult(match: Match): Prediction | null {
  if (match.home_score === null || match.away_score === null) return null;
  if (match.home_score > match.away_score) return 'home';
  if (match.away_score > match.home_score) return 'away';
  return 'draw';
}

const STAGE_POINTS: Record<string, number> = {
  'Group Stage': 1,
  'Round of 32': 2,
  'Round of 16': 3,
  'Quarter-Final': 4,
  'Semi-Final': 5,
  '3rd Place': 5,
  'Final': 10,
};

export function calcPoints(match: Match, prediction: Prediction, predHome?: number | null, predAway?: number | null): number {
  const result = getMatchResult(match);
  if (!result || prediction !== result) return 0;

  const base = STAGE_POINTS[match.stage] ?? 1;

  // Exact score tiebreaker for the Final (+5 pts)
  if (match.stage === 'Final' && predHome !== null && predAway !== null &&
      predHome === match.home_score && predAway === match.away_score) {
    return base + 5;
  }

  return base;
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function getCountdown(kickoff_at: string): { days: number; hours: number; mins: number; secs: number; expired: boolean } {
  const diff = new Date(kickoff_at).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0, expired: true };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs, expired: false };
}
