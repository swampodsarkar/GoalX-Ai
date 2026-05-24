import { Match } from '../types';

export const TEAMS = [
  { name: 'Real Madrid', short: 'RMA', color: '#FFFFFF', bg: '#00529F' },
  { name: 'FC Barcelona', short: 'FCB', color: '#EDBB00', bg: '#004D98' },
  { name: 'Manchester City', short: 'MCI', color: '#6CABDD', bg: '#FFFFFF' },
  { name: 'Manchester United', short: 'MUN', color: '#DA291C', bg: '#000000' },
  { name: 'Liverpool FC', short: 'LIV', color: '#C8102E', bg: '#F6EB61' },
  { name: 'Arsenal FC', short: 'ARS', color: '#EF0107', bg: '#FFFFFF' },
  { name: 'Chelsea FC', short: 'CHE', color: '#034694', bg: '#FFFFFF' },
  { name: 'Bayern Munich', short: 'FCB', color: '#DC052D', bg: '#0066B2' },
  { name: 'Paris Saint-Germain', short: 'PSG', color: '#004170', bg: '#E30613' },
  { name: 'Juventus FC', short: 'JUV', color: '#000000', bg: '#FFFFFF' },
  { name: 'Borussia Dortmund', short: 'BVB', color: '#FDE100', bg: '#000000' },
  { name: 'AC Milan', short: 'ACM', color: '#E30613', bg: '#000000' }
];

export function generateStaticMatches(): Match[] {
  const matches: Match[] = [];
  const baseTime = new Date().getTime();

  // We seed 6 matches spanning LIVE, UPCOMING, and FINISHED
  const fixtureConfigs = [
    {
      id: 'match_1',
      home: TEAMS[0], // Real Madrid
      away: TEAMS[1], // FC Barcelona
      status: 'LIVE' as const,
      timeOffset: -30 * 60 * 1000, // started 30 mins ago
      odds: { home: 2.15, draw: 3.40, away: 3.10 },
      scores: { home: 1, away: 0 }
    },
    {
      id: 'match_2',
      home: TEAMS[2], // Man City
      away: TEAMS[3], // Man United
      status: 'LIVE' as const,
      timeOffset: -75 * 60 * 1000, // started 75 mins ago
      odds: { home: 1.45, draw: 4.50, away: 6.50 },
      scores: { home: 2, away: 2 }
    },
    {
      id: 'match_3',
      home: TEAMS[4], // Liverpool
      away: TEAMS[5], // Arsenal
      status: 'UPCOMING' as const,
      timeOffset: 2 * 60 * 60 * 1000, // starts in 2 hours
      odds: { home: 2.30, draw: 3.25, away: 2.85 },
      scores: { home: 0, away: 0 }
    },
    {
      id: 'match_4',
      home: TEAMS[6], // Chelsea
      away: TEAMS[8], // PSG
      status: 'UPCOMING' as const,
      timeOffset: 6 * 60 * 60 * 1000, // starts in 6 hours
      odds: { home: 2.70, draw: 3.35, away: 2.40 },
      scores: { home: 0, away: 0 }
    },
    {
      id: 'match_5',
      home: TEAMS[7], // Bayern Munich
      away: TEAMS[10], // Dortmund
      status: 'UPCOMING' as const,
      timeOffset: 24 * 60 * 60 * 1000, // starts tomorrow
      odds: { home: 1.65, draw: 4.20, away: 4.60 },
      scores: { home: 0, away: 0 }
    },
    {
      id: 'match_6',
      home: TEAMS[9], // Juventus
      away: TEAMS[11], // AC Milan
      status: 'FINISHED' as const,
      timeOffset: -3 * 2 * 60 * 60 * 1000, // ended earlier
      odds: { home: 2.20, draw: 3.10, away: 3.30 },
      scores: { home: 1, away: 0 }
    }
  ];

  for (const config of fixtureConfigs) {
    const totalProb = 100;
    // Calculate simulated win prospects based on odds inversely
    const homeInv = 1 / config.odds.home;
    const drawInv = 1 / config.odds.draw;
    const awayInv = 1 / config.odds.away;
    const sumInv = homeInv + drawInv + awayInv;

    const predictionHomeWinProb = Math.round((homeInv / sumInv) * 100);
    const predictionAwayWinProb = Math.round((awayInv / sumInv) * 100);
    const predictionDrawProb = totalProb - predictionHomeWinProb - predictionAwayWinProb;

    matches.push({
      id: config.id,
      homeTeam: config.home.name,
      awayTeam: config.away.name,
      startTime: new Date(baseTime + config.timeOffset).toISOString(),
      status: config.status,
      homeScore: config.scores.home,
      awayScore: config.scores.away,
      oddsHome: config.odds.home,
      oddsAway: config.odds.away,
      oddsDraw: config.odds.draw,
      predictionHomeWinProb,
      predictionAwayWinProb,
      predictionDrawProb,
      aiAnalysis: generateAITacticAnalysis(config.home.name, config.away.name, config.status)
    });
  }

  return matches;
}

function generateAITacticAnalysis(home: string, away: string, status: string): string {
  return `### 📊 AI Sports Analyst Match Preview
  
  Analyzing **${home}** vs **${away}** based on expected tactical line-ups, team form, and simulated statistical projections.
  
  #### 🗝️ Tactical Match-Up
  - **${home}** is projected to execute their standard defensive high-press shape, relying on rapid wing progressions. They will look to dominate central channel turnovers.
  - **${away}** is expected to drop into a mid-block posture, employing deep possession counters to expose gaps behind advanced central fullbacks.
  
  #### 📈 Key Stats & Form Dynamics
  - **${home}** last 5 matchups: \`W-W-D-L-W\` (Average 2.1 goals scored/game).
  - **${away}** last 5 matchups: \`W-D-W-W-L\` (Average 1.8 goals conceded/game).
  - Head-To-Head record indicates highly competitive margins, averaging **2.7 total match goals** over their last six encounters in all championships.
  
  #### 🔮 AI Predictor Pick & Strategy
  - **Main Selection:** **${home} Draw No Bet** (Safe Option).
  - **Alternative Market:** **Both Teams To Score (YES)**. The high offensive index of both teams indicates a high probability that both goals sides convert at least once. 
  - **Correct Score Prediction:** ${status === 'FINISHED' ? 'Completed 1-0.' : 'Projected 2-1 or 1-1.'}
  
  *Risk Factor rating: 3.5/5. Stake responsibly using your available virtual currency bankrolls.*`;
}
