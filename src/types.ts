export interface User {
  id: string; // Telegram ID
  uid: string; // Firebase Auth Uid
  username: string;
  balance: number;
  vipLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  totalBetsCount: number;
  totalBetsAmount: number;
  totalWinnings: number;
  dailyStreak: number;
  lastDailyRewardTimestamp: string | null;
  lastSpinTimestamp: string | null;
  referredBy: string | null;
  referralEarnings: number;
  createdAt: string;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  startTime: string;
  status: 'UPCOMING' | 'LIVE' | 'FINISHED';
  homeScore: number;
  awayScore: number;
  oddsHome: number;
  oddsAway: number;
  oddsDraw: number;
  predictionHomeWinProb: number;
  predictionAwayWinProb: number;
  predictionDrawProb: number;
  aiAnalysis: string;
}

export interface Bet {
  id: string;
  userId: string; // User ID
  matchId: string;
  homeTeam: string; // denormalized for easy rendering
  awayTeam: string; // denormalized for easy rendering
  selection: '1' | 'X' | '2' | 'OVER_2_5' | 'UNDER_2_5' | 'BTTS_YES' | 'BTTS_NO' | 'DC_1X' | 'DC_12' | 'DC_X2'; // Betting markets
  odds: number;
  stake: number;
  potentialWin: number;
  status: 'PENDING' | 'WON' | 'LOST';
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'DAILY_REWARD' | 'SPIN_REWARD' | 'REFERRAL_BONUS';
  amount: number;
  timestamp: string;
}

export interface SpinHistory {
  id: string;
  userId: string;
  reward: string;
  timestamp: string;
}
