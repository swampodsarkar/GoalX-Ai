const BetModel = require('../models/Bet');
const UserModel = require('../models/User');
const { fetchMatchById } = require('./footballService');

async function placeBet(telegramId, matchId, prediction, stake, predictedScore) {
  const user = await UserModel.findOne(telegramId);
  if (!user) throw new Error('User not found');
  if (user.balance < stake) throw new Error('Insufficient balance');

  const existingBets = await BetModel.findPendingByTelegramId(telegramId);
  const hasExisting = existingBets.some(b => b.matchId === Number(matchId));
  if (hasExisting) throw new Error('You already have a pending bet on this match');

  const matchData = await fetchMatchById(matchId);
  if (!matchData) throw new Error('Match not found or API error');

  const { isMatchLive, canBetOnMatch } = require('./footballService');
  if (isMatchLive(matchData)) throw new Error('Match is LIVE — betting closed');
  if (!canBetOnMatch(matchData)) throw new Error('Betting closed (match starts in < 15 min or already started)');

  const homeTeam = matchData.homeTeam?.name || 'Home';
  const awayTeam = matchData.awayTeam?.name || 'Away';

  const bet = await BetModel.create({
    telegramId: Number(telegramId),
    matchId: Number(matchId),
    homeTeam, awayTeam,
    prediction,
    stake: Number(stake),
    predictedScore: predictedScore || null,
    status: 'PENDING'
  });

  await UserModel.update(telegramId, {
    balance: user.balance - stake,
    totalBets: (user.totalBets || 0) + 1
  });

  return bet;
}

async function settleBet(bet, matchData) {
  if (!matchData || matchData.status !== 'FINISHED') return false;

  const homeGoals = matchData.score?.fullTime?.home ?? matchData.score?.regularTime?.home ?? 0;
  const awayGoals = matchData.score?.fullTime?.away ?? matchData.score?.regularTime?.away ?? 0;

  let actualResult;
  if (homeGoals > awayGoals) actualResult = 'HOME';
  else if (awayGoals > homeGoals) actualResult = 'AWAY';
  else actualResult = 'DRAW';

  const user = await UserModel.findOne(bet.telegramId);
  if (!user) return false;

  let payout = 0;
  let newStatus = 'LOST';

    if (actualResult === bet.prediction) {
    const isExact = bet.predictedScore && bet.predictedScore === `${homeGoals}-${awayGoals}`;

    if (isExact) {
      payout = Math.round(bet.stake * 3.5);
      newStatus = 'EXACT';
    } else {
      payout = Math.round(bet.stake * 1.9);
      newStatus = 'WON';
    }

    await UserModel.update(bet.telegramId, {
      balance: user.balance + payout,
      totalWon: (user.totalWon || 0) + payout,
      totalWins: (user.totalWins || 0) + 1,
      weeklyProfit: (user.weeklyProfit || 0) + payout,
      weeklyWins: (user.weeklyWins || 0) + (payout > 0 ? 1 : 0)
    });
  }

  await BetModel.update(bet.id, {
    status: newStatus, actualResult, payout,
    settledAt: new Date().toISOString()
  });

  return true;
}

async function settlePendingBets() {
  const pendingBets = await BetModel.findPending();
  if (pendingBets.length === 0) return 0;

  const now = new Date();
  const lookback = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const finishedMatches = await require('./footballService').getFinishedMatchesSince(lookback);
  const matchMap = new Map(finishedMatches.map(m => [m.id, m]));

  let settledCount = 0;

  for (const bet of pendingBets) {
    const matchData = matchMap.get(Number(bet.matchId));
    if (matchData) {
      const settled = await settleBet(bet, matchData);
      if (settled) settledCount++;
    }
  }

  return settledCount;
}

async function getUserActiveBets(telegramId) {
  const bets = await BetModel.findPendingByTelegramId(telegramId);
  return bets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

module.exports = { placeBet, settlePendingBets, getUserActiveBets };
