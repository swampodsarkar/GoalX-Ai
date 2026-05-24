const express = require('express');
const crypto = require('crypto');
const UserModel = require('../models/User');
const BetModel = require('../models/Bet');
const DepositModel = require('../models/Deposit');
const WithdrawModel = require('../models/Withdraw');
const { fetchUpcomingMatches, fetchMatchById, getMatchesByCompetition, isMatchLive, canBetOnMatch, LEAGUES } = require('../services/footballService');
const { placeBet, getUserActiveBets } = require('../services/bettingService');
const { getMatchAnalysis } = require('../services/aiService');
const fraudService = require('../services/fraudService');
const { getSpinReward, calculateDailyBonus, isVipActive, generateReferralLink, calcWinRate, getUserLevel, formatBalance } = require('../utils/helpers');

const router = express.Router();

function verifyTelegramWebApp(initData) {
  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) return null;
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    if (computedHash !== hash) return null;
    const userStr = params.get('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch { return null; }
}

router.post('/auth', async (req, res) => {
  try {
    const { initData } = req.body;
    if (!initData) return res.status(400).json({ error: 'initData required' });
    const tgUser = verifyTelegramWebApp(initData);
    if (!tgUser) return res.status(401).json({ error: 'Invalid Telegram data' });
    const { id, username, first_name, last_name } = tgUser;
    let user = await UserModel.findOne(id);
    if (!user) {
      const defaultCoins = parseInt(process.env.DEFAULT_STARTING_COINS) || 1000;
      await UserModel.create({
        telegramId: id, username: username || '', firstName: first_name || '',
        balance: defaultCoins, totalDeposited: 0, totalWon: 0, totalBets: 0, totalWins: 0
      });
      user = await UserModel.findOne(id);
    } else {
      await UserModel.update(id, { username: username || '', firstName: first_name || '' });
    }
    const levelInfo = getUserLevel(user);
    res.json({
      success: true,
      user: {
        telegramId: user.telegramId, username: user.username, firstName: user.firstName,
        balance: user.balance, totalBets: user.totalBets || 0, totalWins: user.totalWins || 0,
        totalDeposited: user.totalDeposited || 0, totalWon: user.totalWon || 0,
        vip: isVipActive(user), vipExpiry: user.vipExpiry || null,
        dailyStreak: user.dailyStreak || 0, lastDailyClaim: user.lastDailyClaim || 0,
        lastSpin: user.lastSpin || 0, referralEarnings: user.referralEarnings || 0,
        referralCount: user.referralCount || 0, level: levelInfo,
        banned: user.banned || false, flagged: user.flagged || false
      },
      referralLink: generateReferralLink(id)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/user/:telegramId', async (req, res) => {
  try {
    const user = await UserModel.findOne(Number(req.params.telegramId));
    if (!user) return res.status(404).json({ error: 'User not found' });
    const levelInfo = getUserLevel(user);
    res.json({ ...user, vip: isVipActive(user), level: levelInfo, referralLink: generateReferralLink(user.telegramId) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/matches', async (req, res) => {
  try {
    const matches = await fetchUpcomingMatches();
    const mapped = matches.map(m => ({
      id: m.id, homeTeam: m.homeTeam?.shortName || m.homeTeam?.name || 'Home',
      awayTeam: m.awayTeam?.shortName || m.awayTeam?.name || 'Away',
      homeCrest: m.homeTeam?.crest || null, awayCrest: m.awayTeam?.crest || null,
      competition: m.competition?.name || '', competitionCode: m.competition?.code || '',
      competitionEmoji: (LEAGUES.find(l => l.code === m.competition?.code) || {}).emoji || '⚽',
      utcDate: m.utcDate, status: m.status, live: isMatchLive(m), canBet: canBetOnMatch(m),
      score: m.score?.fullTime || m.score?.regularTime || null
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/matches/:competition', async (req, res) => {
  try {
    const matches = await getMatchesByCompetition(req.params.competition);
    const mapped = matches.map(m => ({
      id: m.id, homeTeam: m.homeTeam?.shortName || m.homeTeam?.name || 'Home',
      awayTeam: m.awayTeam?.shortName || m.awayTeam?.name || 'Away',
      homeCrest: m.homeTeam?.crest || null, awayCrest: m.awayTeam?.crest || null,
      competition: m.competition?.name || '', competitionCode: m.competition?.code || '',
      utcDate: m.utcDate, status: m.status, live: isMatchLive(m), canBet: canBetOnMatch(m),
      score: m.score?.fullTime || m.score?.regularTime || null
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/match/:id', async (req, res) => {
  try {
    const m = await fetchMatchById(Number(req.params.id));
    if (!m) return res.status(404).json({ error: 'Match not found' });
    res.json({
      id: m.id, homeTeam: m.homeTeam?.name || 'Home', awayTeam: m.awayTeam?.name || 'Away',
      homeCrest: m.homeTeam?.crest || null, awayCrest: m.awayTeam?.crest || null,
      competition: m.competition?.name || '', competitionCode: m.competition?.code || '',
      utcDate: m.utcDate, status: m.status, live: isMatchLive(m), canBet: canBetOnMatch(m),
      score: m.score?.fullTime || m.score?.regularTime || null, venue: m.venue || null, stage: m.stage || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/leagues', (req, res) => {
  res.json(LEAGUES);
});

router.post('/bet', async (req, res) => {
  try {
    const { telegramId, matchId, prediction, stake, predictedScore } = req.body;
    if (!telegramId || !matchId || !prediction || !stake) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const bet = await placeBet(telegramId, matchId, prediction, stake, predictedScore || null);
    res.json({ success: true, bet });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/bets/:telegramId', async (req, res) => {
  try {
    const active = await getUserActiveBets(Number(req.params.telegramId));
    const all = await BetModel.findByTelegramId(Number(req.params.telegramId));
    res.json({ active, all });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const users = await UserModel.findTop(20);
    res.json(users.map((u, i) => ({
      rank: i + 1, telegramId: u.telegramId,
      username: u.username || u.firstName || 'Anonymous',
      balance: u.balance || 0, totalBets: u.totalBets || 0,
      totalWins: u.totalWins || 0, vip: isVipActive(u)
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/daily/:telegramId', async (req, res) => {
  try {
    const user = await UserModel.findOne(Number(req.params.telegramId));
    if (!user) return res.status(404).json({ error: 'User not found' });
    const now = Date.now();
    const last = user.lastDailyClaim || 0;
    const DAY_MS = 24 * 60 * 60 * 1000;
    if (now - last < DAY_MS) {
      const remaining = DAY_MS - (now - last);
      return res.json({ error: 'already_claimed', remaining, hours: Math.floor(remaining / 3600000), mins: Math.floor((remaining % 3600000) / 60000) });
    }
    const yesterday = last && (now - last) < (2 * DAY_MS);
    let newStreak = (user.dailyStreak || 0) + 1;
    if (!yesterday && last > 0) newStreak = 1;
    const bonusInfo = calculateDailyBonus({ ...user, dailyStreak: newStreak });
    const newBal = (user.balance || 0) + bonusInfo.total;
    await UserModel.update(user.telegramId, { balance: newBal, lastDailyClaim: now, dailyStreak: newStreak });
    res.json({ success: true, bonus: bonusInfo, newBalance: newBal, streak: newStreak });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/spin/:telegramId', async (req, res) => {
  try {
    const user = await UserModel.findOne(Number(req.params.telegramId));
    if (!user) return res.status(404).json({ error: 'User not found' });
    const now = Date.now();
    const lastSpin = user.lastSpin || 0;
    const DAY_MS = 24 * 60 * 60 * 1000;
    if (now - lastSpin < DAY_MS) {
      const remaining = DAY_MS - (now - lastSpin);
      return res.json({ error: 'already_spun', remaining, hours: Math.floor(remaining / 3600000) });
    }
    const reward = getSpinReward();
    const newBal = (user.balance || 0) + reward.prize;
    await UserModel.update(user.telegramId, { balance: newBal, lastSpin: now });
    res.json({ success: true, prize: reward.prize, emoji: reward.emoji, newBalance: newBal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ai-analysis/:matchId/:telegramId', async (req, res) => {
  try {
    const user = await UserModel.findOne(Number(req.params.telegramId));
    if (!user || !isVipActive(user)) {
      return res.status(403).json({ error: 'AI Analysis is available only for VIP members' });
    }
    const matchData = await fetchMatchById(Number(req.params.matchId));
    if (!matchData) return res.status(404).json({ error: 'Match not found' });
    const analysis = await getMatchAnalysis(matchData);
    res.json({ success: true, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/winners', (req, res) => {
  const names = ["Rifat Ahmed","Sakib Hasan","Tanvir Islam","Mehedi Hasan","Rakib Hossain","Siam Khan","Shuvo Roy","Mahim Islam","Fahim Ahmed","Jisan Ali","Nayeem Hasan","Sojib Islam","Arif Hossain","Rony Ahmed","Shakil Khan","Sohan Roy","Emon Hasan","Ashik Ahmed","Tamim Hossain","Rasel Mia","Rabbi Islam","Raihan Khan","Nafis Rahman","Imran Hossain","Arafat Rahman","Saif Uddin","Ridoy Ahmed","Alif Khan","Akash Roy","Tuhin Islam"];
  const shuffled = [...names].sort(() => 0.5 - Math.random());
  const winners = shuffled.slice(0, 10).map(name => ({ name, amount: Math.floor(Math.random() * 1200) + 250 }));
  res.json(winners);
});

router.get('/payouts', (req, res) => {
  const names = ["Rifat Ahmed","Sakib Hasan","Tanvir Islam","Mehedi Hasan","Rakib Hossain","Siam Khan","Shuvo Roy","Mahim Islam","Fahim Ahmed","Jisan Ali"];
  const shuffled = [...names].sort(() => 0.5 - Math.random());
  const payouts = shuffled.slice(0, 10).map(name => ({ name, amount: Math.floor(Math.random() * 1800) + 400 }));
  res.json(payouts);
});

router.post('/deposit', async (req, res) => {
  try {
    const { telegramId, amount } = req.body;
    if (!telegramId || !amount) return res.status(400).json({ error: 'Missing fields' });
    const user = await UserModel.findOne(Number(telegramId));
    if (!user) return res.status(404).json({ error: 'User not found' });
    const min = parseInt(process.env.MIN_DEPOSIT) || 100;
    if (amount < min) return res.status(400).json({ error: `Minimum deposit: ${min}` });
    const method = process.env.PAYMENT_METHOD || 'bKash/Nagad';
    const number = process.env.PAYMENT_NUMBER || '01XXXXXXXXX';
    res.json({ success: true, method, number, amount, instructions: `Send ${amount} BDT to ${method}: ${number}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/deposit/confirm', async (req, res) => {
  try {
    const { telegramId, amount, txid } = req.body;
    if (!telegramId || !amount || !txid) return res.status(400).json({ error: 'Missing fields' });
    const existingDeposits = await DepositModel.findPending();
    const exists = existingDeposits.some(d => d.txid === txid);
    if (exists) return res.status(400).json({ error: 'Transaction ID already submitted' });
    const deposit = await DepositModel.create({ telegramId: Number(telegramId), amount: Number(amount), txid, status: 'PENDING' });
    await fraudService.logActivity(Number(telegramId), 'deposit_request', { amount, txid });
    res.json({ success: true, depositId: deposit.id, message: 'Deposit submitted. Awaiting admin approval.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/withdraw', async (req, res) => {
  try {
    const { telegramId, amount } = req.body;
    if (!telegramId || !amount) return res.status(400).json({ error: 'Missing fields' });
    const user = await UserModel.findOne(Number(telegramId));
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (amount < 100) return res.status(400).json({ error: 'Minimum withdrawal: 100 coins' });
    if (user.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });
    await UserModel.update(user.telegramId, { balance: (user.balance || 0) - amount });
    await WithdrawModel.create({ telegramId: Number(telegramId), amount: Number(amount), username: user.username || '', status: 'PENDING' });
    await fraudService.logActivity(Number(telegramId), 'withdraw_request', { amount });
    res.json({ success: true, message: 'Withdraw submitted. Awaiting admin approval.', newBalance: (user.balance || 0) - amount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/vip/buy', async (req, res) => {
  try {
    const { telegramId } = req.body;
    const user = await UserModel.findOne(Number(telegramId));
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (isVipActive(user)) return res.status(400).json({ error: 'Already VIP' });
    const VIP_COST = parseInt(process.env.VIP_COST) || 5000;
    const VIP_DAYS = parseInt(process.env.VIP_DAYS) || 30;
    if (user.balance < VIP_COST) return res.status(400).json({ error: 'Insufficient balance' });
    const expiry = Date.now() + VIP_DAYS * 24 * 60 * 60 * 1000;
    await UserModel.update(user.telegramId, { balance: user.balance - VIP_COST, vip: true, vipExpiry: expiry });
    res.json({ success: true, newBalance: user.balance - VIP_COST, vipExpiry: expiry, message: `VIP active for ${VIP_DAYS} days!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
