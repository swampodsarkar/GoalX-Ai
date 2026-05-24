import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import {
  ref,
  set,
  update,
  remove,
  get,
  push,
  onValue,
  query,
  orderByChild,
  equalTo,
  limitToLast,
  increment
} from 'firebase/database';
import { auth, db, handleFirebaseError, OperationType } from '../firebase';
import { User, Match, Bet, Transaction, SpinHistory } from '../types';

interface AppContextProps {
  user: User | null;
  matches: Match[];
  bets: Bet[];
  loading: boolean;
  isTelegram: boolean;
  telegramRawUser: any;
  currentMockId: string;
  setMockTelegramUser: (mockId: string, mockUsername: string) => Promise<void>;
  placeBet: (matchId: string, selection: '1' | 'X' | '2' | 'OVER_2_5' | 'UNDER_2_5' | 'BTTS_YES' | 'BTTS_NO' | 'DC_1X' | 'DC_12' | 'DC_X2', stake: number) => Promise<string>;
  claimDailyReward: () => Promise<{ amount: number; isCombo: boolean }>;
  spinWheel: () => Promise<{ prize: string; amount: number }>;
  depositFunds: (amount: number) => Promise<void>;
  withdrawFunds: (amount: number) => Promise<void>;
  simulateGoal: (matchId: string) => Promise<void>;
  simulateEndMatch: (matchId: string, forceStatus?: '1' | 'X' | '2') => Promise<void>;
  resetAllMatches: () => Promise<void>;
  leaderboard: User[];
  referrals: User[];
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export function getOddsForSelection(match: Match, selection: string): number {
  switch (selection) {
    case '1': return match.oddsHome;
    case 'X': return match.oddsDraw;
    case '2': return match.oddsAway;
    case 'OVER_2_5': {
      const p = match.predictionHomeWinProb + match.predictionAwayWinProb;
      const base = p > 70 ? 1.65 : 1.95;
      return parseFloat((base + (Math.abs(match.oddsHome - match.oddsAway) * 0.05)).toFixed(2));
    }
    case 'UNDER_2_5': {
      const o25 = getOddsForSelection(match, 'OVER_2_5');
      return parseFloat((4.2 - o25 - 0.4).toFixed(2));
    }
    case 'BTTS_YES': {
      const base = Math.min(match.oddsHome, match.oddsAway) < 2.0 ? 1.70 : 1.85;
      return parseFloat(base.toFixed(2));
    }
    case 'BTTS_NO': {
      const bttsY = getOddsForSelection(match, 'BTTS_YES');
      return parseFloat((3.8 - bttsY).toFixed(2));
    }
    case 'DC_1X': {
      const homeDrawProb = (match.predictionHomeWinProb + match.predictionDrawProb) / 100;
      return parseFloat(Math.max(1.10, 1.85 - homeDrawProb).toFixed(2));
    }
    case 'DC_12': {
      const noDrawProb = (match.predictionHomeWinProb + match.predictionAwayWinProb) / 100;
      return parseFloat(Math.max(1.10, 1.65 - noDrawProb).toFixed(2));
    }
    case 'DC_X2': {
      const awayDrawProb = (match.predictionAwayWinProb + match.predictionDrawProb) / 100;
      return parseFloat(Math.max(1.10, 1.85 - awayDrawProb).toFixed(2));
    }
    default: return 1.50;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [referrals, setReferrals] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTelegram, setIsTelegram] = useState(false);
  const [telegramRawUser, setTelegramRawUser] = useState<any>(null);
  const [currentMockId, setCurrentMockId] = useState('mock_user_777');
  const [currentMockUsername, setCurrentMockUsername] = useState('FootballWarlock');

  // Load Telegram SDK and authorize
  useEffect(() => {
    let tId = currentMockId;
    let tUsername = currentMockUsername;

    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      
      // Configure Colors for Telegram
      if (tg.setHeaderColor) {
        tg.setHeaderColor('#0f0f1a');
      }
      if (tg.setBackgroundColor) {
        tg.setBackgroundColor('#0f0f1a');
      }

      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        setIsTelegram(true);
        setTelegramRawUser(tgUser);
        tId = String(tgUser.id);
        tUsername = tgUser.username || tgUser.first_name || `TG_USER_${tgUser.id}`;
        setCurrentMockId(tId);
        setCurrentMockUsername(tUsername);
      }
    }

    // Set up Firebase Anonymous Authentication
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentAuthUser) => {
      if (!currentAuthUser) {
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.error("Firebase Anonymous Auth Failed:", err);
        }
        return;
      }

      // We have an authenticated Firebase user. Let's sync with Realtime DB profile.
      await setupUserProfile(tId, tUsername, currentAuthUser.uid);
    });

    return () => unsubscribeAuth();
  }, []);

  // Sync real matches from Football API to Realtime DB on mount
  useEffect(() => {
    async function syncRealMatchesOnStart() {
      try {
        console.log("Triggering start sync of real matches from football-data.org API...");
        const apiRes = await fetch('/api/matches');
        if (!apiRes.ok) throw new Error("API responded with an issue: " + apiRes.statusText);
        const seedData = await apiRes.json();
        if (Array.isArray(seedData) && seedData.length > 0) {
          console.log(`Successfully fetched ${seedData.length} live matches. Overwriting in Realtime DB...`);
          for (const m of seedData) {
            await set(ref(db, 'matches/' + m.id), m);
          }
        }
      } catch (err) {
        console.error("Failed to background sync live matches on mount:", err);
      }
    }
    syncRealMatchesOnStart();
  }, []);

  // Hook representing user change triggers
  async function setupUserProfile(telegramId: string, username: string, firebaseUid: string, referralCode?: string | null) {
    setLoading(true);
    const userRef = ref(db, 'users/' + telegramId);
    
    try {
      const snap = await get(userRef);
      if (!snap.exists()) {
        // Retrieve referral code if loaded inside TG link
        let refCode = referralCode || null;
        if (!refCode) {
          const tg = (window as any).Telegram?.WebApp;
          const startParam = tg?.initDataUnsafe?.start_param;
          if (startParam && startParam.startsWith('ref_')) {
            refCode = startParam.replace('ref_', '');
          }
        }

        // Fresh profile initialization
        const initialUser: User = {
          id: telegramId,
          uid: firebaseUid,
          username: username,
          balance: 2000, // 2000 starting coins, welcoming users
          vipLevel: 'Bronze',
          totalBetsCount: 0,
          totalBetsAmount: 0,
          totalWinnings: 0,
          dailyStreak: 0,
          lastDailyRewardTimestamp: null,
          lastSpinTimestamp: null,
          referredBy: refCode && refCode !== telegramId ? refCode : null,
          referralEarnings: 0,
          createdAt: new Date().toISOString()
        };

        await set(userRef, initialUser);

        // If referred, increment referralEarnings to structural ledger
        if (initialUser.referredBy) {
          const referrerRef = ref(db, 'users/' + initialUser.referredBy);
          const referrerSnap = await get(referrerRef);
          if (referrerSnap.exists()) {
            await update(referrerRef, {
              balance: increment(100),
              referralEarnings: increment(100)
            });

            // Log referee bonus payout
            const referralTxnRef = push(ref(db, 'transactions'));
            await set(referralTxnRef, {
              id: referralTxnRef.key,
              userId: initialUser.referredBy,
              type: 'REFERRAL_BONUS',
              amount: 100,
              timestamp: new Date().toISOString()
            });
          }
        }
      } else {
        // Ensure UID matches current session (security binding)
        const profile = snap.val() as User;
        if (profile.uid !== firebaseUid) {
          await update(userRef, { uid: firebaseUid });
        }
      }
    } catch (err) {
      handleFirebaseError(err, OperationType.GET, `users/${telegramId}`);
    }

    // Subscribe to current user profile in real-time
    const unsubscribeUser = onValue(ref(db, 'users/' + telegramId), (snap) => {
      if (snap.exists()) {
        setUser(snap.val() as User);
      }
      setLoading(false);
    }, (err) => {
      handleFirebaseError(err, OperationType.GET, `users/${telegramId}`);
    });

    // Subscribe to matches collection
    const unsubscribeMatches = onValue(ref(db, 'matches'), async (snap) => {
      let list: Match[] = [];
      snap.forEach(child => {
        const item = child.val() as Match;
        if (item && item.id) {
          if (item.id.startsWith('api_')) {
            list.push(item);
          } else {
            remove(ref(db, 'matches/' + item.id)).catch(err => {
              console.warn("Clean legacy doc failed:", item.id, err);
            });
          }
        }
      });

      if (list.length === 0) {
        console.log("Seeding initial football match fixtures from Live API...");
        try {
          const apiRes = await fetch('/api/matches');
          const seedData = await apiRes.json();
          if (Array.isArray(seedData)) {
            for (const m of seedData) {
              await set(ref(db, 'matches/' + m.id), m);
            }
            list = seedData;
          }
        } catch (err) {
          console.error("Failed to fetch live matches:", err);
          list = [];
        }
      }
      
      // Sort matches so live matches come first, then closest upcoming
      list.sort((a,b) => {
        if (a.status === 'LIVE' && b.status !== 'LIVE') return -1;
        if (a.status !== 'LIVE' && b.status === 'LIVE') return 1;
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });

      setMatches(list);
    }, (err) => {
      handleFirebaseError(err, OperationType.GET, 'matches');
    });

    // Subscribe to user bets
    const betsQuery = query(ref(db, 'bets'), orderByChild('userId'), equalTo(telegramId));
    const unsubscribeBets = onValue(betsQuery, (snap) => {
      const list: Bet[] = [];
      snap.forEach(child => {
        list.push(child.val() as Bet);
      });
      list.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBets(list);
    }, (err) => {
      console.warn("Bets listener error, falling back", err);
      onValue(betsQuery, (fallbackSnap) => {
        const list: Bet[] = [];
        fallbackSnap.forEach(child => {
          list.push(child.val() as Bet);
        });
        list.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setBets(list);
      });
    });

    // Fetch Leaderboard entries
    const leaderboardQuery = query(ref(db, 'users'), orderByChild('totalWinnings'), limitToLast(20));
    const unsubscribeLeaderboard = onValue(leaderboardQuery, (snap) => {
      const list: User[] = [];
      snap.forEach(child => {
        list.push(child.val() as User);
      });
      list.reverse();
      setLeaderboard(list);
    }, (err) => {
      console.warn("Leaderboard snapshot error, falling back", err);
    });

    // Search and display referrals
    const referralsQuery = query(ref(db, 'users'), orderByChild('referredBy'), equalTo(telegramId));
    const unsubscribeReferrals = onValue(referralsQuery, (snap) => {
      const list: User[] = [];
      snap.forEach(child => {
        list.push(child.val() as User);
      });
      setReferrals(list);
    });

    return () => {
      unsubscribeUser();
      unsubscribeMatches();
      unsubscribeBets();
      unsubscribeLeaderboard();
      unsubscribeReferrals();
    };
  }

  // Allow choosing a mock user in Web preview (highly useful for developers)
  async function setMockTelegramUser(mockId: string, mockUsername: string) {
    setCurrentMockId(mockId);
    setCurrentMockUsername(mockUsername);
    if (auth.currentUser) {
      await setupUserProfile(mockId, mockUsername, auth.currentUser.uid);
    }
  }

  // Wager bet placing function
  async function placeBet(
    matchId: string, 
    selection: '1' | 'X' | '2' | 'OVER_2_5' | 'UNDER_2_5' | 'BTTS_YES' | 'BTTS_NO' | 'DC_1X' | 'DC_12' | 'DC_X2', 
    stake: number
  ): Promise<string> {
    if (!user) throw new Error("Authentication user profile missing.");
    if (user.balance < stake) throw new Error("Insufficient gold coins in wallet.");
    
    const betMatch = matches.find(m => m.id === matchId);
    if (!betMatch) throw new Error("Match not found.");
    if (betMatch.status === 'FINISHED') throw new Error("Match already finished! Cannot place bet.");

    // Retrieve corresponding odds
    const odds = getOddsForSelection(betMatch, selection);

    const potentialWin = Number((stake * odds).toFixed(2));
    const betId = `bet_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const newBet: Bet = {
      id: betId,
      userId: user.id,
      matchId: matchId,
      homeTeam: betMatch.homeTeam,
      awayTeam: betMatch.awayTeam,
      selection,
      odds,
      stake,
      potentialWin,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    // Calculate VIP Level
    const newTotalStake = user.totalBetsAmount + stake;
    let newVip = user.vipLevel;
    if (newTotalStake >= 20000) newVip = 'Platinum';
    else if (newTotalStake >= 5000) newVip = 'Gold';
    else if (newTotalStake >= 1000) newVip = 'Silver';

    try {
      await set(ref(db, 'bets/' + betId), newBet);

      await update(ref(db, 'users/' + user.id), {
        balance: user.balance - stake,
        totalBetsCount: user.totalBetsCount + 1,
        totalBetsAmount: newTotalStake,
        vipLevel: newVip
      });

      return betId;
    } catch (err) {
      return handleFirebaseError(err, OperationType.WRITE, `bets/${betId}`);
    }
  }

  // Claim Daily Rewards checking logic and streaks
  async function claimDailyReward(): Promise<{ amount: number; isCombo: boolean }> {
    if (!user) throw new Error("User profile not loaded.");
    
    const now = new Date();
    const lastClaim = user.lastDailyRewardTimestamp ? new Date(user.lastDailyRewardTimestamp) : null;
    
    if (lastClaim) {
      const diffMs = now.getTime() - lastClaim.getTime();
      const diffHrs = diffMs / (1000 * 60 * 60);
      if (diffHrs < 24) {
        throw new Error(`Rewards already claimed. Try again in ${Math.ceil(24 - diffHrs)} hours.`);
      }
    }

    // Determine Streak
    let newStreak = 1;
    let isCombo = false;
    if (lastClaim) {
      const diffMs = now.getTime() - lastClaim.getTime();
      const diffHrs = diffMs / (1000 * 60 * 60);
      // If claimed within 48 hours, consecutive check streak continues!
      if (diffHrs < 48) {
        newStreak = Math.min((user.dailyStreak || 0) + 1, 7);
        if (newStreak === 7) isCombo = true;
      }
    }

    const rewardAmount = 100 * newStreak;

    try {
      // 1. Update user profile
      await update(ref(db, 'users/' + user.id), {
        balance: user.balance + rewardAmount,
        dailyStreak: newStreak,
        lastDailyRewardTimestamp: now.toISOString()
      });

      // 2. Add ledger transaction
      const txnRef = push(ref(db, 'transactions'));
      await set(txnRef, {
        id: txnRef.key,
        userId: user.id,
        type: 'DAILY_REWARD',
        amount: rewardAmount,
        timestamp: now.toISOString()
      });

      return { amount: rewardAmount, isCombo };
    } catch (err) {
      return handleFirebaseError(err, OperationType.WRITE, `users/${user.id}`);
    }
  }

  // Spin Wheel implementation
  async function spinWheel(): Promise<{ prize: string; amount: number }> {
    if (!user) throw new Error("User profile missing.");

    const now = new Date();
    const lastSpin = user.lastSpinTimestamp ? new Date(user.lastSpinTimestamp) : null;

    if (lastSpin) {
      const diffMs = now.getTime() - lastSpin.getTime();
      const diffHrs = diffMs / (1000 * 60 * 60);
      if (diffHrs < 24) {
        throw new Error(`Spin has cooled down. Try again in ${Math.ceil(24 - diffHrs)} hours.`);
      }
    }

    // Dynamic Prize list
    const prizes = [
      { prize: '100 Coin Bundle', amount: 100 },
      { prize: '300 Coin Jackpot', amount: 300 },
      { prize: '500 Mega Chest', amount: 500 },
      { prize: '1000 Ultimate Fortune', amount: 1000 },
      { prize: '50 Consolation Pack', amount: 50 },
      { prize: '150 Elite Prize', amount: 150 },
    ];
    
    const chosen = prizes[Math.floor(Math.random() * prizes.length)];

    try {
      const spinRef = push(ref(db, 'spinHistory'));
      await set(spinRef, {
        id: spinRef.key,
        userId: user.id,
        reward: chosen.prize,
        timestamp: now.toISOString()
      });

      await update(ref(db, 'users/' + user.id), {
        balance: user.balance + chosen.amount,
        lastSpinTimestamp: now.toISOString()
      });

      const txnRef = push(ref(db, 'transactions'));
      await set(txnRef, {
        id: txnRef.key,
        userId: user.id,
        type: 'SPIN_REWARD',
        amount: chosen.amount,
        timestamp: now.toISOString()
      });

      return { prize: chosen.prize, amount: chosen.amount };
    } catch (err) {
      return handleFirebaseError(err, OperationType.WRITE, `users/${user.id}`);
    }
  }

  // Add Deposit simulation function
  async function depositFunds(amount: number) {
    if (!user) return;
    try {
      await update(ref(db, 'users/' + user.id), {
        balance: user.balance + amount
      });

      const txnRef = push(ref(db, 'transactions'));
      await set(txnRef, {
        id: txnRef.key,
        userId: user.id,
        type: 'DEPOSIT',
        amount: amount,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      handleFirebaseError(err, OperationType.WRITE, `users/${user.id}`);
    }
  }

  // Withdraw simulation function
  async function withdrawFunds(amount: number) {
    if (!user) return;
    if (user.balance < amount) throw new Error("Insufficient funds to withdraw.");
    try {
      await update(ref(db, 'users/' + user.id), {
        balance: user.balance - amount
      });

      const txnRef = push(ref(db, 'transactions'));
      await set(txnRef, {
        id: txnRef.key,
        userId: user.id,
        type: 'WITHDRAW',
        amount: amount,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      handleFirebaseError(err, OperationType.WRITE, `users/${user.id}`);
    }
  }

  // Simulate goal events for live matches (highly interactive!)
  async function simulateGoal(matchId: string) {
    const freshMatch = matches.find(m => m.id === matchId);
    if (!freshMatch) return;
    if (freshMatch.status !== 'LIVE') return;

    // Decide who scored (home 55%, away 45%)
    const isHome = Math.random() < 0.55;
    const newHomeScore = isHome ? freshMatch.homeScore + 1 : freshMatch.homeScore;
    const newAwayScore = !isHome ? freshMatch.awayScore + 1 : freshMatch.awayScore;

    try {
      await update(ref(db, 'matches/' + matchId), {
        homeScore: newHomeScore,
        awayScore: newAwayScore
      });
    } catch (err) {
      console.error(err);
    }
  }

  // Conclude a match and resolve state to won/lost bets
  async function simulateEndMatch(matchId: string, forceOutcome?: '1' | 'X' | '2') {
    const fMatch = matches.find(m => m.id === matchId);
    if (!fMatch) return;
    if (fMatch.status === 'FINISHED') return;

    let finalHome = fMatch.homeScore;
    let finalAway = fMatch.awayScore;

    if (forceOutcome) {
      if (forceOutcome === '1') {
        finalHome = 3;
        finalAway = 1;
      } else if (forceOutcome === '2') {
        finalHome = 0;
        finalAway = 2;
      } else {
        finalHome = 1;
        finalAway = 1;
      }
    }

    // Determine final output string
    let finalSelection: '1' | 'X' | '2' = 'X';
    if (finalHome > finalAway) finalSelection = '1';
    else if (finalAway > finalHome) finalSelection = '2';

    try {
      await update(ref(db, 'matches/' + matchId), {
        status: 'FINISHED',
        homeScore: finalHome,
        awayScore: finalAway
      });

      const pendingBetsQuery = query(ref(db, 'bets'), orderByChild('matchId'), equalTo(matchId));
      
      const snap = await get(pendingBetsQuery);
      const pendingBets: Bet[] = [];
      snap.forEach(child => {
        const bet = child.val() as Bet;
        if (bet.status === 'PENDING') pendingBets.push(bet);
      });
      
      for (const bet of pendingBets) {
        const betDocRef = ref(db, 'bets/' + bet.id);
        
        let payout = 0;
        let isWin = false;

        const totalGoals = finalHome + finalAway;
        const btts = finalHome > 0 && finalAway > 0;

        if (bet.selection === '1') isWin = finalHome > finalAway;
        else if (bet.selection === 'X') isWin = finalHome === finalAway;
        else if (bet.selection === '2') isWin = finalAway > finalHome;
        else if (bet.selection === 'OVER_2_5') isWin = totalGoals > 2;
        else if (bet.selection === 'UNDER_2_5') isWin = totalGoals <= 2;
        else if (bet.selection === 'BTTS_YES') isWin = btts;
        else if (bet.selection === 'BTTS_NO') isWin = !btts;
        else if (bet.selection === 'DC_1X') isWin = finalHome >= finalAway;
        else if (bet.selection === 'DC_12') isWin = finalHome !== finalAway;
        else if (bet.selection === 'DC_X2') isWin = finalAway >= finalHome;
        
        if (isWin) {
          payout = bet.potentialWin;
          // Apply VIP bonuses
          let userDocSnap = await get(ref(db, 'users/' + bet.userId));
          if (userDocSnap.exists()) {
            const betUser = userDocSnap.val() as User;
            let vipBonusPercent = 0;
            if (betUser.vipLevel === 'Silver') vipBonusPercent = 0.05;
            else if (betUser.vipLevel === 'Gold') vipBonusPercent = 0.10;
            else if (betUser.vipLevel === 'Platinum') vipBonusPercent = 0.20;

            const bonusGold = Number((payout * vipBonusPercent).toFixed(2));
            payout += bonusGold;

            // Increment profile balance
            await update(ref(db, 'users/' + bet.userId), {
              balance: increment(payout),
              totalWinnings: increment(payout)
            });
          }

          await update(betDocRef, {
            status: 'WON',
            potentialWin: payout
          });
        } else {
          await update(betDocRef, {
            status: 'LOST'
          });
        }
      }
    } catch (err) {
      console.error("Match conclude error:", err);
    }
  }

  // Restore and reset default fixtures
  async function resetAllMatches() {
    try {
      for (const m of matches) {
        await remove(ref(db, 'matches/' + m.id));
      }
      const apiRes = await fetch('/api/matches');
      const initialSeed = await apiRes.json();
      for (const m of initialSeed) {
        await set(ref(db, 'matches/' + m.id), m);
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <AppContext.Provider value={{
      user,
      matches,
      bets,
      loading,
      isTelegram,
      telegramRawUser,
      currentMockId,
      setMockTelegramUser,
      placeBet,
      claimDailyReward,
      spinWheel,
      depositFunds,
      withdrawFunds,
      simulateGoal,
      simulateEndMatch,
      resetAllMatches,
      leaderboard,
      referrals
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside an AppProvider.");
  return context;
}
