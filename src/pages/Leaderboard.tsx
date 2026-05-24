import { useApp } from '../context/AppContext';
import { Trophy, Award, Crown, Calendar, Users } from 'lucide-react';

export default function Leaderboard() {
  const { leaderboard, user } = useApp();

  const getPodiumAccent = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-6 h-6 rounded-full bg-yellow-400 border border-yellow-300 shadow flex items-center justify-center font-bold text-slate-950 text-[11px]">
            <Crown className="w-3.5 h-3.5" />
          </div>
        );
      case 2:
        return (
          <div className="w-6 h-6 rounded-full bg-slate-300 border border-slate-200 shadow flex items-center justify-center font-bold text-slate-950 text-[11px]">
            2
          </div>
        );
      case 3:
        return (
          <div className="w-6 h-6 rounded-full bg-amber-700 border border-amber-600 shadow flex items-center justify-center font-bold text-amber-100 text-[11px]">
            3
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-slate-400 text-[10px] font-mono">
            {rank}
          </div>
        );
    }
  };

  const isCurrentUser = (itemUserId: string) => {
    return user && itemUserId === user.id;
  };

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <Trophy className="w-8 h-8 text-yellow-400" />
        <div>
          <h2 className="text-lg font-extrabold text-slate-100">Global Leaderboards</h2>
          <p className="text-[10px] text-slate-400 font-mono">Ranked by accumulated sports betting payouts in coins</p>
        </div>
      </div>

      {/* Tilted Standings cards */}
      <section className="bg-[#141424] border border-slate-900 rounded-2xl p-4 flex flex-col gap-2.5 shadow">
        
        {/* Table Column headers */}
        <div className="flex items-center justify-between text-[9px] font-mono font-bold tracking-wider uppercase text-slate-500 pb-1.5 border-b border-slate-900 px-1">
          <div className="flex items-center gap-6">
            <span>Rank</span>
            <span>Competitor</span>
          </div>
          <span>Total Winnings</span>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500 font-mono animate-pulse">
            Compiling tournament standings...
          </div>
        ) : (
          <div className="flex flex-col gap-2 pt-1.5">
            {leaderboard.map((item, index) => {
              const rank = index + 1;
              const highlighted = isCurrentUser(item.id);
              
              return (
                <div 
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-xl transition ${highlighted ? 'bg-[#231b54]/50 border border-amber-400/50 shadow-inner' : 'bg-slate-950/25 border border-slate-900/50'}`}
                >
                  <div className="flex items-center gap-4.5">
                    {/* Podium Emblem */}
                    {getPodiumAccent(rank)}

                    {/* Username detail */}
                    <div>
                      <h4 className={`text-xs font-bold leading-none ${highlighted ? 'text-amber-400 font-black' : 'text-slate-200'}`}>
                        @{item.username}
                      </h4>
                      <p className="text-[8px] text-slate-500 font-mono uppercase mt-1">
                        LEVEL: {item.vipLevel}
                      </p>
                    </div>
                  </div>

                  {/* Cash Winning Score */}
                  <div className="text-right font-mono text-xs font-black">
                    <span className={rank <= 3 ? 'text-amber-300' : 'text-slate-300'}>
                      {item.totalWinnings.toLocaleString()} 🪙
                    </span>
                    {highlighted && <div className="text-[8px] text-amber-500 font-sans font-bold uppercase mt-0.5">That's You!</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
