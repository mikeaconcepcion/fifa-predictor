export type MatchStatus = 'NS' | 'LIVE' | 'FT' | 'PST' | 'CANC';
export type Prediction = 'home' | 'draw' | 'away';
export type Stage =
  | 'Group Stage'
  | 'Round of 32'
  | 'Round of 16'
  | 'Quarter-Final'
  | 'Semi-Final'
  | '3rd Place'
  | 'Final';

export interface Match {
  id: number;
  api_id: number | null;
  home_team: string;
  away_team: string;
  home_flag: string | null;
  away_flag: string | null;
  home_logo: string | null;
  away_logo: string | null;
  kickoff_at: string;
  venue: string | null;
  stage: Stage;
  group_name: string | null;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus;
}

export interface Pick {
  id: string;
  user_id: string;
  match_id: number;
  prediction: Prediction;
  pred_home_score: number | null;
  pred_away_score: number | null;
  points_earned: number | null;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  total_points: number;
  correct_picks: number;
  exact_scores: number;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  admin_id: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  profile?: Profile;
}

export interface MatchWithPick extends Match {
  pick?: Pick;
}

export interface LeaderboardEntry {
  profile: Profile;
  rank: number;
}
