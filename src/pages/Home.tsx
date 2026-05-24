import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Award, Gift, HelpCircle, Trophy, Globe, History, Zap, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import { TEAMS } from '../utils/sportsProvider';

export default function Home() {
  const { user, matches, loading } = useApp();
  const navigate = useNavigate();

  // Find VIP Status detail thresholds
  const getVipBadgeColor = (vipLevel: string) => {
    switch (vipLevel) {
      case 'Platinum': return 'from-teal-400 to-indigo-500 text-slate-100 border-indigo-400';
      case 'Gold': return 'from-yellow-400 to-amber-600 text-slate-950 border-amber-300';
      case 'Silver': return 'from-slate-300 to-slate-500 text-slate-950 border-slate-200';
      default: return 'from-amber-700 to-amber-900 text-amber-200 border-amber-800';
    }
  };

  const getVipBoostPercent = (vipLevel: string) => {
    switch (vipLevel) {
      case 'Platinum': return '+20% Payout Bonus';
      case 'Gold': return '+10% Payout Bonus';
      case 'Silver': return '+5% Payout Bonus';
      default: return 'Standard Returns';
    }
  };

  const getVipRequirementLabel = (vipLevel: string, totalAmount: number) => {
    if (vipLevel === 'Bronze') return `${(1000 - totalAmount).toFixed(0)} coins to Silver`;
    if (vipLevel === 'Silver') return `${(5000 - totalAmount).toFixed(0)} coins to Gold`;
    if (vipLevel === 'Gold') return `${(20000 - totalAmount).toFixed(0)} coins to Platinum`;
    return 'Highest Tier Unlocked';
  };

  const getVipPercentage = (vipLevel: string, totalAmount: number) => {
    if (vipLevel === 'Bronze') return Math.min((totalAmount / 1000) * 100, 100);
    if (vipLevel === 'Silver') return Math.min(((totalAmount - 1000) / 4000) * 100, 100);
    if (vipLevel === 'Gold') return Math.min(((totalAmount - 5000) / 15000) * 100, 100);
    return 100;
  };

  const liveMatches = matches.filter(m => m.status === 'LIVE');
  const trendingMatches = matches.filter(m => m.status === 'UPCOMING').slice(0, 2);

  // Helper to extract styled team bubbles
  const findTeamDetail = (teamName: string) => {
    return TEAMS.find(t => t.name === teamName) || { short: teamName.substring(0, 3).toUpperCase(), bg: '#1e293b', color: '#ffffff' };
  };

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-mono">Loading BetMate Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col gap-5">
      
      {/* 1. Welcome Card and VIP Meter */}
      <section className="bg-[#141424] border border-slate-900 rounded-2xl p-4 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-lg text-slate-100 border border-slate-700">
              {user.username.substring(0,1).toUpperCase()}
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold leading-none">Welcome back,</p>
              <h2 className="text-sm font-bold text-slate-100 leading-tight">@{user.username}</h2>
            </div>
          </div>
          
          {/* VIP Badge */}
          <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-sans font-extrabold bg-gradient-to-tr border shadow ${getVipBadgeColor(user.vipLevel)}`}>
            {user.vipLevel.toUpperCase()}
          </div>
        </div>

        {/* Level Indicator Progress */}
        <div className="bg-[#1c1c34] p-3 rounded-xl border border-slate-800/80">
          <div className="flex justify-between items-center mb-1 text-[10px]">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 animate-pulse" /> {getVipBoostPercent(user.vipLevel)}
            </span>
            <span className="text-slate-400 font-mono text-[9px]">
              {getVipRequirementLabel(user.vipLevel, user.totalBetsAmount)}
            </span>
          </div>
          <div className="w-full bg-[#10101e] h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 h-full rounded-full transition-all duration-500"
              style={{ width: `${getVipPercentage(user.vipLevel, user.totalBetsAmount)}%` }}
            />
          </div>
        </div>
      </section>

      {/* 2. Main Balance Card */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2a1b5c] to-[#120e36] border border-[#3e2e80]/50 p-5 shadow-2xl flex flex-col gap-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -z-10" />
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-widest">Available Virtual Wallet</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-extrabold font-sans text-amber-300 tracking-tight">{user.balance.toLocaleString()}</span>
              <span className="text-sm font-bold text-amber-500 uppercase">Coins</span>
            </div>
          </div>
          <Wallet className="w-12 h-12 text-amber-400/20" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => navigate('/wallet')}
            className="flex-1 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 shadow-md shadow-amber-400/10 transition"
          >
            💰 Deposit Simulated Credits
          </button>
          <button 
            onClick={() => navigate('/wallet')}
            className="flex-1 bg-slate-950/40 hover:bg-slate-950/60 active:scale-95 border border-slate-800 text-amber-400 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 transition"
          >
            💸 Cash Out Winnings
          </button>
        </div>
      </section>

      {/* 3. Action Grid Portal Scroll Columns */}
      <section className="flex flex-col gap-2">
        <h3 className="text-[11px] font-bold tracking-wider uppercase text-slate-400 px-1 font-mono">Quick Earn Portallocs</h3>
        <div className="grid grid-cols-4 gap-2.5">
          <button 
            onClick={() => navigate('/spin')}
            className="flex flex-col items-center justify-center p-2.5 bg-[#141424] hover:bg-[#1b1b31] border border-slate-900 rounded-xl transition cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-1 bg-gradient-to-b group-hover:scale-105 transition">
              <Zap className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-[10px] font-bold text-slate-300">Spin Wheel</span>
          </button>

          <button 
            onClick={() => navigate('/daily')}
            className="flex flex-col items-center justify-center p-2.5 bg-[#141424] hover:bg-[#1b1b31] border border-slate-900 rounded-xl transition cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-1 bg-gradient-to-b group-hover:scale-105 transition">
              <Gift className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-[10px] font-bold text-slate-300">Daily Bonus</span>
          </button>

          <button 
            onClick={() => navigate('/leaderboard')}
            className="flex flex-col items-center justify-center p-2.5 bg-[#141424] hover:bg-[#1b1b31] border border-slate-900 rounded-xl transition cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-1 bg-gradient-to-b group-hover:scale-105 transition">
              <Trophy className="w-4 h-4 text-yellow-400" />
            </div>
            <span className="text-[10px] font-bold text-slate-300">Leaders</span>
          </button>

          <button 
            onClick={() => navigate('/referral')}
            className="flex flex-col items-center justify-center p-2.5 bg-[#141424] hover:bg-[#1b1b31] border border-slate-900 rounded-xl transition cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-1 bg-gradient-to-b group-hover:scale-105 transition">
              <Globe className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold text-slate-300">Referrals</span>
          </button>
        </div>
      </section>

      {/* 4. Live / Hot Matches */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[11px] font-bold tracking-wider uppercase text-slate-400 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live Arenas In Progress
          </h3>
          <span 
            onClick={() => navigate('/matches')}
            className="text-[10px] font-bold text-amber-400 hover:underline cursor-pointer"
          >
            View All ({matches.length})
          </span>
        </div>

        {liveMatches.length === 0 ? (
          <div className="bg-[#141424]/40 border border-dashed border-slate-900 rounded-2xl p-6 text-center">
            <p className="text-xs text-slate-400">No matches are actively playing live now.</p>
            <button 
              onClick={() => navigate('/matches')}
              className="text-xs text-amber-400 font-bold mt-2 hover:underline inline-flex items-center gap-1"
            >
              Check Upcoming Matches <TrendingUp className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {liveMatches.map(m => {
              const homeDetail = findTeamDetail(m.homeTeam);
              const awayDetail = findTeamDetail(m.awayTeam);
              return (
                <div 
                  key={m.id}
                  onClick={() => navigate(`/match/${m.id}`)}
                  className="bg-[#141424] border border-slate-900 rounded-2xl p-4 flex flex-col gap-3 hover:border-slate-800 transition shadow-md cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 bg-red-600 text-white font-mono font-bold text-[8px] px-2.5 py-0.5 rounded-br-lg flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> LIVE
                  </div>

                  {/* Club Rows */}
                  <div className="flex justify-between items-center mt-2.5">
                    <div className="flex items-center gap-3 flex-1">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow border border-slate-800"
                        style={{ backgroundColor: homeDetail.bg, color: homeDetail.color }}
                      >
                        {homeDetail.short}
                      </div>
                      <span className="text-xs font-bold tracking-tight text-slate-100">{m.homeTeam}</span>
                    </div>

                    <div className="flex flex-col items-center justify-center px-4">
                      <span className="text-lg font-extrabold font-mono text-amber-300">
                        {m.homeScore} : {m.awayScore}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <span className="text-xs font-bold tracking-tight text-slate-100 text-right">{m.awayTeam}</span>
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow border border-slate-800"
                        style={{ backgroundColor: awayDetail.bg, color: awayDetail.color }}
                      >
                        {awayDetail.short}
                      </div>
                    </div>
                  </div>

                  {/* Live Odds Grid */}
                  <div className="grid grid-cols-3 gap-2 mt-1 pt-2 border-t border-slate-900/60 text-center font-mono text-xs">
                    <div className="bg-[#1a1a2e] p-1.5 rounded-lg border border-slate-800/80">
                      <div className="text-[8px] text-slate-400 leading-none mb-0.5 font-sans">Home (1)</div>
                      <div className="font-bold text-slate-200">{m.oddsHome.toFixed(2)}</div>
                    </div>
                    <div className="bg-[#1a1a2e] p-1.5 rounded-lg border border-slate-800/80">
                      <div className="text-[8px] text-slate-400 leading-none mb-0.5 font-sans">Draw (X)</div>
                      <div className="font-bold text-slate-200">{m.oddsDraw.toFixed(2)}</div>
                    </div>
                    <div className="bg-[#1a1a2e] p-1.5 rounded-lg border border-slate-800/80">
                      <div className="text-[8px] text-slate-400 leading-none mb-0.5 font-sans">Away (2)</div>
                      <div className="font-bold text-slate-200">{m.oddsAway.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. Trending / Upcoming Fixtures */}
      <section className="flex flex-col gap-3">
        <h3 className="text-[11px] font-bold tracking-wider uppercase text-slate-400 px-1 font-mono">Hot Matches Today</h3>
        <div className="flex flex-col gap-2.5">
          {trendingMatches.map(m => {
            const homeDetail = findTeamDetail(m.homeTeam);
            const awayDetail = findTeamDetail(m.awayTeam);
            return (
              <div 
                key={m.id}
                onClick={() => navigate(`/match/${m.id}`)}
                className="bg-[#141424] border border-slate-900 p-3.5 rounded-xl hover:border-slate-800 transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2 flex-1">
                  <div 
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[9px] shadow border border-slate-850"
                    style={{ backgroundColor: homeDetail.bg, color: homeDetail.color }}
                  >
                    {homeDetail.short}
                  </div>
                  <span className="text-[11px] font-bold text-slate-100 max-w-[80px] truncate">{m.homeTeam}</span>
                </div>

                <div className="flex flex-col items-center justify-center bg-[#1a1a2e] px-3 py-1 rounded-lg border border-slate-800 text-[10px]">
                  <span className="text-amber-400 font-bold">VS</span>
                  <span className="text-slate-400 text-[8px] font-mono leading-none mt-0.5">
                    {new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="text-[11px] font-bold text-slate-100 max-w-[80px] truncate text-right">{m.awayTeam}</span>
                  <div 
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[9px] shadow border border-slate-850"
                    style={{ backgroundColor: awayDetail.bg, color: awayDetail.color }}
                  >
                    {awayDetail.short}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
