const { getDB } = require('../config/firebase');

function getFraudLogsRef() {
  const db = getDB();
  if (!db) return null;
  return db.ref('fraud_logs');
}

function getUsersRef() {
  const db = getDB();
  if (!db) return null;
  return db.ref('users');
}

async function logActivity(telegramId, action, details = {}) {
  const ref = getFraudLogsRef();
  if (!ref) return;

  const logEntry = {
    telegramId: Number(telegramId), action,
    timestamp: new Date().toISOString(),
    ...details
  };

  await ref.push(logEntry);
}

async function checkRapidDeposit(telegramId) {
  const ref = getFraudLogsRef();
  if (!ref) return { suspicious: false };

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const snapshot = await ref
    .orderByChild('telegramId').equalTo(Number(telegramId)).once('value');

  let depositCount = 0;

  snapshot.forEach(child => {
    const val = child.val();
    if (val.action === 'deposit_request' && val.timestamp >= oneHourAgo) {
      depositCount++;
    }
  });

  if (depositCount >= 3) {
    return { suspicious: true, reason: `Rapid deposits: ${depositCount} in last 1 hour` };
  }

  return { suspicious: false };
}

async function flagUser(telegramId, reason, flaggedBy = 'system') {
  const usersRef = getUsersRef();
  if (!usersRef) return;

  const userRef = usersRef.child(telegramId);

  await userRef.update({
    flagged: true, flagReason: reason,
    flaggedAt: new Date().toISOString(), flaggedBy
  });

  await logActivity(telegramId, 'flagged', { reason, flaggedBy });
}

async function unflagUser(telegramId) {
  const usersRef = getUsersRef();
  if (!usersRef) return;

  await usersRef.child(telegramId).update({
    flagged: false, flagReason: null, flaggedAt: null, flaggedBy: null
  });
}

async function getFlaggedUsers() {
  const usersRef = getUsersRef();
  if (!usersRef) return [];

  const snapshot = await usersRef.once('value');
  const flagged = [];

  snapshot.forEach(child => {
    const data = child.val();
    if (data.flagged) {
      flagged.push({ telegramId: Number(child.key), ...data });
    }
  });

  return flagged;
}

async function getUserActivity(telegramId, limit = 20) {
  const ref = getFraudLogsRef();
  if (!ref) return [];

  const snapshot = await ref
    .orderByChild('telegramId').equalTo(Number(telegramId)).limitToLast(limit).once('value');

  const activities = [];
  snapshot.forEach(child => {
    activities.push({ id: child.key, ...child.val() });
  });

  return activities.reverse();
}

module.exports = {
  logActivity, checkRapidDeposit, flagUser, unflagUser, getFlaggedUsers, getUserActivity
};
