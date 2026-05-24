import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Award, Trophy, Globe, History, Gift, Zap, TrendingUp, Sparkles, LogOut, ChevronRight } from 'lucide-react';

export default function Profile() {
  const { user, bets, isTelegram, setMockTelegramUser } = useApp();
  const navigate = useNavigate();

  // Color combinations for VIP tiers
  const getVipBadgeColor = (vipLevel: string) => {
    switch (vipLevel) {
      case 'Platinum': return 'from-teal-400 to-indigo-500 text-slate-100 border-indigo-400';
      case 'Gold': return 'from-yellow-400 to-amber-600 text-slate-950 border-amber-300';
      case 'Silver': return 'from-slate-300 to-slate-500 text-slate-950 border-slate-200';
      default: return 'from-amber-700 to-amber-950 text-amber-200 border-amber-800';
    }
  };

  const getVipRequirementLabel = (vipLevel: string, totalAmount: number) => {
    if (vipLevel === 'Bronze') return `${(1000 - totalAmount).toFixed(0)} coins to Silver`;
    if (vipLevel === 'Silver') return `${(5000 - totalAmount).toFixed(0)} coins to Gold`;
    if (vipLevel === 'Gold') return `${(20000 - totalAmount).toFixed(0)} coins to Platinum`;
    return 'Top Tier Unlocked';
  };

  const calculateWinRate = () => {
    if (!bets || bets.length === 0) return '0%';
    const completedBets = bets.filter(b => b.status !== 'PENDING');
    if (completedBets.length === 0) return '0%';
    const wonCount = completedBets.filter(b => b.status === 'WON').length;
    return `${Math.round((wonCount / completedBets.length) * 100)}%`;
  };

  if (!user) {
    return (
      <div className="text-center py-20 text-xs text-slate-500 animate-pulse font-mono">
        Connecting sports console...
      </div>
    );
  }

  // Links list modules
  const linkItems = [
    { title: 'Leaderboards Standing', desc: 'Standings and top wagers earnings', path: '/leaderboard', icon: Trophy, color: 'text-yellow-400 bg-yellow-400/10' },
    { title: 'Commission Referrals', desc: 'Share your code and earn commissions', path: '/referral', icon: Globe, color: 'text-emerald-400 bg-emerald-400/10' },
    { title: 'Daily Streaks Bonus', desc: 'Claim daily coins up to 7 days combo', path: '/daily', icon: Gift, color: 'text-amber-400 bg-amber-400/10' },
    { title: 'Simulated Fortune Spin', desc: 'Free spins cooldown and histories', path: '/spin', icon: Zap, color: 'text-indigo-400 bg-indigo-400/10' },
    { title: 'Trans Ledger Histories', desc: 'Financial audit deposit/withdraw logs', path: '/history', icon: History, color: 'text-sky-400 bg-sky-400/10' }
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      
      {/* 1. Header Profile Box */}
      <section className="bg-gradient-to-r from-[#141424] to-[#1c1c34] p-5 rounded-2xl border border-slate-900 flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -z-10" />
        
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-extrabold text-2xl text-slate-100 shadow-md">
            {user.username.substring(0,1).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-100">@{user.username}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-sans font-extrabold bg-gradient-to-tr border shadow ${getVipBadgeColor(user.vipLevel)}`}>
                {user.vipLevel.toUpperCase()}
              </span>
            </div>
            <p className="text-[9px] text-slate-500 font-mono mt-1">TELEGRAM ID: {user.id}</p>
          </div>
        </div>

        {/* Level details */}
        <div className="flex justify-between items-center text-[10px] font-mono border-t border-slate-900/60 pt-3">
          <span className="text-slate-400">Streak: <strong className="text-amber-400">{user.dailyStreak} Days</strong></span>
          <span className="text-slate-400">VIP Upgrade: <strong className="text-slate-200">{getVipRequirementLabel(user.vipLevel, user.totalBetsAmount)}</strong></span>
        </div>
      </section>

      {/* 2. Betting Performance Stats Cards */}
      <section className="grid grid-cols-2 gap-2.5">
        <div className="bg-[#141424] border border-slate-900 rounded-xl p-3">
          <span className="text-[8px] tracking-wider uppercase font-bold text-slate-500 font-mono">Total Stake Volume</span>
          <h4 className="text-base font-black font-mono text-slate-200 mt-1">{user.totalBetsAmount.toLocaleString()} 🪙</h4>
          <p className="text-[8px] text-slate-400 mt-0.5">{user.totalBetsCount} bets placed</p>
        </div>

        <div className="bg-[#141424] border border-slate-900 rounded-xl p-3">
          <span className="text-[8px] tracking-wider uppercase font-bold text-slate-500 font-mono">Net Career Winnings</span>
          <h4 className="text-base font-black font-mono text-emerald-400 mt-1">{user.totalWinnings.toLocaleString()} 🪙</h4>
          <p className="text-[8px] text-slate-400 mt-0.5">Calculated ledger payouts</p>
        </div>

        <div className="bg-[#141424] border border-slate-900 rounded-xl p-3">
          <span className="text-[8px] tracking-wider uppercase font-bold text-slate-500 font-mono">Successful Accuracy Rate</span>
          <h4 className="text-base font-black font-mono text-amber-300 mt-1">{calculateWinRate()}</h4>
          <p className="text-[8px] text-slate-400 mt-0.5">Excludes pending slips</p>
        </div>

        <div className="bg-[#141424] border border-slate-900 rounded-xl p-3">
          <span className="text-[8px] tracking-wider uppercase font-bold text-slate-500 font-mono">Referral Earnings</span>
          <h4 className="text-base font-black font-mono text-indigo-400 mt-1">{user.referralEarnings.toLocaleString()} 🪙</h4>
          <p className="text-[8px] text-slate-400 mt-0.5">Commision audits payout</p>
        </div>
      </section>

      {/* 3. Link Navigation list */}
      <section className="bg-[#141424] border border-slate-900 rounded-2xl overflow-hidden shadow-md">
        {linkItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div 
              key={item.title}
              onClick={() => navigate(item.path)}
              className={`flex items-center justify-between p-3.5 hover:bg-slate-900/40 cursor-pointer transition ${index > 0 ? 'border-t border-slate-900/60' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border border-slate-800/20 ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 leading-tight">{item.title}</h4>
                  <p className="text-[9px] text-slate-400 leading-none mt-1">{item.desc}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </div>
          );
        })}
      </section>

    </div>
  );
}
