function isAdmin(telegramId) {
  const admins = (process.env.ADMIN_USER_IDS || '').split(',').map(id => parseInt(id.trim()));
  return admins.includes(telegramId);
}

function formatBalance(balance) {
  const num = Number(balance) || 0;
  return `${num.toLocaleString()} coins`;
}

function escapeMarkdown(text) {
  if (!text) return '';
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

function parseBetCommand(text) {
  const parts = text.trim().split(/\s+/);
  if (parts.length !== 4) return null;
  const matchId = parseInt(parts[1]);
  const prediction = parts[2].toUpperCase();
  const stake = parseInt(parts[3]);
  if (!matchId || !['HOME', 'DRAW', 'AWAY'].includes(prediction) || !stake || stake < 1) return null;
  return { matchId, prediction, stake };
}

function getDisplayName(user) {
  if (!user) return 'Player';
  if (user.username) return `@${user.username}`;
  if (user.firstName) return user.firstName;
  return 'Player';
}

function generateReferralLink(telegramId) {
  const botName = process.env.BOT_NAME || 'betpredictorbot';
  return `https://t.me/${botName}?start=ref_${telegramId}`;
}

function calcWinRate(wins, total) {
  if (!total || total === 0) return '0%';
  return ((wins / total) * 100).toFixed(1) + '%';
}

function isVipActive(user) {
  if (!user || !user.vip) return false;
  if (!user.vipExpiry) return true;
  return Date.now() < user.vipExpiry;
}

function calculateDailyBonus(user) {
  const base = 80;
  const isVip = isVipActive(user);
  const streak = user.dailyStreak || 0;

  let bonus = base;
  let streakBonus = 0;

  if (streak >= 7) streakBonus = 150;
  else if (streak >= 3) streakBonus = 50;

  let total = bonus + streakBonus;
  if (isVip) total = Math.floor(total * 2);

  return { base: bonus, streakBonus, total, isVip, streak };
}

function getUserLevel(user) {
  const bets = user.totalBets || 0;
  const wins = user.totalWins || 0;
  const winRate = bets > 0 ? (wins / bets) * 100 : 0;
  const isVip = isVipActive(user);

  if (bets >= 300 && winRate >= 55 && isVip) {
    return { level: 5, name: 'LEGEND', badge: '👑' };
  }
  if (bets >= 150 && winRate >= 48) {
    return { level: 4, name: 'GOLD', badge: '🥇' };
  }
  if (bets >= 50 && winRate >= 40) {
    return { level: 3, name: 'SILVER', badge: '🥈' };
  }
  if (bets >= 10) {
    return { level: 2, name: 'BRONZE', badge: '🥉' };
  }
  return { level: 1, name: 'BEGINNER', badge: '🌱' };
}

function getSpinReward() {
  const rewards = [
    { prize: 10,   weight: 35, emoji: '🪙' },
    { prize: 20,   weight: 25, emoji: '🪙' },
    { prize: 50,   weight: 18, emoji: '💰' },
    { prize: 100,  weight: 12, emoji: '💰' },
    { prize: 200,  weight: 6,  emoji: '💎' },
    { prize: 500,  weight: 3,  emoji: '💎' },
    { prize: 5000, weight: 1,  emoji: '🎰' }
  ];

  const totalWeight = rewards.reduce((sum, r) => sum + r.weight, 0);
  let random = Math.random() * totalWeight;

  for (const reward of rewards) {
    random -= reward.weight;
    if (random <= 0) return reward;
  }
  return rewards[0];
}

module.exports = {
  isAdmin, formatBalance, escapeMarkdown, parseBetCommand, getDisplayName,
  generateReferralLink, calcWinRate, isVipActive, calculateDailyBonus,
  getUserLevel, getSpinReward
};
