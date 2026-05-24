import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Ticket, Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function MyBets() {
  const { bets, loading } = useApp();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'WON' | 'LOST'>('ALL');

  const filteredBets = bets.filter(bet => {
    if (filter === 'ALL') return true;
    return bet.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WON':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-sans font-extrabold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1 shadow-inner">
            <CheckCircle2 className="w-2.5 h-2.5" /> WON
          </span>
         );
      case 'LOST':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-sans font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-1">
            <XCircle className="w-2.5 h-2.5" /> LOST
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-sans font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1 animate-pulse">
            <Clock className="w-2.5 h-2.5" /> PENDING
          </span>
        );
    }
  };

  const getSelectionName = (sel: string) => {
    switch (sel) {
      case '1': return 'Home Win (1)';
      case 'X': return 'Draw (X)';
      case '2': return 'Away Win (2)';
      case 'OVER_2_5': return 'Over 2.5 Goals';
      case 'UNDER_2_5': return 'Under 2.5 Goals';
      case 'BTTS_YES': return 'Both Teams to Score: Yes';
      case 'BTTS_NO': return 'Both Teams to Score: No';
      case 'DC_1X': return 'Double Chance: 1X';
      case 'DC_12': return 'Double Chance: 12';
      case 'DC_X2': return 'Double Chance: X2';
      default: return sel;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-xs text-slate-400 animate-pulse font-mono flex flex-col justify-center items-center gap-2">
        <Ticket className="w-8 h-8 text-amber-500/40 animate-bounce" />
        Syncing wagering slips...
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      
      {/* Header */}
      <div>
        <h2 className="text-lg font-extrabold text-slate-100">My Bet Slips</h2>
        <p className="text-[10px] text-slate-400 font-mono">Verify your historical wagers, payout statuses, and active odds</p>
      </div>

      {/* Filter Tabs */}
      <section className="bg-[#141424] p-1 border border-slate-900 rounded-xl flex items-center justify-between text-[11px] font-bold">
        {['ALL', 'PENDING', 'WON', 'LOST'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            className={`flex-1 py-1.5 rounded-lg text-center transition ${filter === status ? 'bg-slate-900 text-amber-400 font-extrabold shadow-sm' : 'text-slate-400'}`}
          >
            {status}
          </button>
        ))}
      </section>

      {/* Bets List */}
      <section className="flex flex-col gap-3">
        {filteredBets.length === 0 ? (
          <div className="bg-[#141424]/30 border border-dashed border-slate-900 p-10 rounded-2xl text-center text-slate-400 text-xs">
            <Ticket className="w-10 h-10 text-slate-600/60 mx-auto mb-2" />
            No matching bet slips on record. Go place some sports wagers on the Lobbies page!
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredBets.map(bet => (
              <div 
                key={bet.id}
                className="bg-[#141424] border border-slate-900 rounded-xl p-3.5 flex flex-col gap-2.5 shadow hover:border-slate-800 transition"
              >
                {/* Header */}
                <div className="flex justify-between items-center bg-slate-950/30 p-1.5 rounded-lg border border-slate-900 text-[9px] font-mono text-slate-400 leading-none">
                  <span>SLIP #{(bet.id || '').toUpperCase().substring(0, 12)}</span>
                  <span>{new Date(bet.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>

                {/* Fixture Match Name */}
                <div className="flex justify-between items-center px-1">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 leading-none">
                      {bet.homeTeam} <span className="text-[10px] text-amber-500">vs</span> {bet.awayTeam}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-sans mt-1.5 leading-none">
                      Wager Target: <strong className="text-slate-200">{getSelectionName(bet.selection)}</strong> (odds: {bet.odds.toFixed(2)})
                    </p>
                  </div>

                  {/* Status */}
                  <div>{getStatusBadge(bet.status)}</div>
                </div>

                {/* Financial Ledger Specs */}
                <div className="grid grid-cols-2 gap-2 mt-1 pt-2 border-t border-slate-950/40 text-[10px] font-mono">
                  <div className="bg-slate-950/30 border border-slate-900 p-2 rounded-lg flex flex-col">
                    <span className="text-slate-500 font-sans text-[8px] uppercase tracking-wide">Coins Stake</span>
                    <strong className="text-slate-300 mt-0.5 text-xs">{bet.stake.toLocaleString()} 🪙</strong>
                  </div>
                  <div className="bg-slate-950/30 border border-slate-900 p-2 rounded-lg flex flex-col text-right">
                    <span className="text-slate-500 font-sans text-[8px] uppercase tracking-wide text-right">
                      {bet.status === 'WON' ? 'Winnings Received' : 'Potential Return'}
                    </span>
                    <strong className={`mt-0.5 text-xs ${bet.status === 'WON' ? 'text-emerald-400 font-black' : 'text-amber-400'}`}>
                      {bet.potentialWin.toLocaleString()} 🪙
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
