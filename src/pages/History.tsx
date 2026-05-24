import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ref, query, orderByChild, equalTo, onValue } from 'firebase/database';
import { db } from '../firebase';
import { Transaction, SpinHistory } from '../types';
import { History, Landmark, Zap, ArrowDownLeft, ArrowUpRight, Gift, Award, Star } from 'lucide-react';

export default function GlobalHistory() {
  const { user } = useApp();
  const [tab, setTab] = useState<'TRANSACTIONS' | 'SPINS'>('TRANSACTIONS');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [spins, setSpins] = useState<SpinHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const txnQ = query(ref(db, 'transactions'), orderByChild('userId'), equalTo(user.id));
    const unsubTxn = onValue(txnQ, (snap) => {
      const list: Transaction[] = [];
      snap.forEach(child => { list.push(child.val() as Transaction); });
      list.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setTransactions(list);
      setLoading(false);
    });

    const spinQ = query(ref(db, 'spinHistory'), orderByChild('userId'), equalTo(user.id));
    const unsubSpins = onValue(spinQ, (snap) => {
      const list: SpinHistory[] = [];
      snap.forEach(child => { list.push(child.val() as SpinHistory); });
      list.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setSpins(list);
    });

    return () => {
      unsubTxn();
      unsubSpins();
    };
  }, [user]);

  const getTxnIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />;
      case 'WITHDRAW':
        return <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />;
      case 'DAILY_REWARD':
        return <Gift className="w-3.5 h-3.5 text-amber-400" />;
      case 'REFERRAL_BONUS':
        return <Award className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <Landmark className="w-3.5 h-3.5 text-sky-450" />;
    }
  };

  if (!user) {
    return <div className="text-center py-20 text-xs text-slate-500 font-mono">Syncing histories...</div>;
  }

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <History className="w-8 h-8 text-sky-400" />
        <div>
          <h2 className="text-lg font-extrabold text-slate-100">Global Account Logs</h2>
          <p className="text-[10px] text-slate-400 font-mono">Historical logging vault for spin actions and wallet ledgers</p>
        </div>
      </div>

      {/* Toggles */}
      <section className="bg-[#141424] p-1 border border-slate-900 rounded-xl flex items-center justify-between text-[11px] font-bold">
        <button 
          onClick={() => setTab('TRANSACTIONS')}
          className={`flex-1 py-1.5 rounded-lg text-center flex items-center justify-center gap-1.5 transition ${tab === 'TRANSACTIONS' ? 'bg-[#0f0f1a] text-amber-400 font-extrabold shadow-sm' : 'text-slate-400'}`}
        >
          <Landmark className="w-3.5 h-3.5" /> Coins Ledger
        </button>
        <button 
          onClick={() => setTab('SPINS')}
          className={`flex-1 py-1.5 rounded-lg text-center flex items-center justify-center gap-1.5 transition ${tab === 'SPINS' ? 'bg-[#0f0f1a] text-amber-400 font-extrabold shadow-sm' : 'text-slate-400'}`}
        >
          <Zap className="w-3.5 h-3.5" /> Wheel Spins
        </button>
      </section>

      {/* Table displays */}
      <section className="flex flex-col gap-2.5">
        {loading ? (
          <div className="text-center py-8 text-xs font-mono text-slate-500 animate-pulse">Retrieving vault history...</div>
        ) : tab === 'TRANSACTIONS' ? (
          transactions.length === 0 ? (
            <div className="bg-[#141424]/40 border border-slate-900 rounded-2xl p-8 text-center text-slate-400 text-xs">
              No transactions recorded in ledger. Let's make a simulated credit reload!
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {transactions.map(item => (
                <div 
                  key={item.id}
                  className="bg-[#141424] border border-slate-900 p-3 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-slate-950 rounded-lg flex items-center justify-center border border-slate-850">
                      {getTxnIcon(item.type)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 capitalize leading-none">{item.type.replace('_', ' ').toLowerCase()}</h4>
                      <p className="text-[9px] text-slate-500 font-mono mt-1">
                        {new Date(item.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>

                  <strong className={`font-mono text-xs ${item.type === 'WITHDRAW' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {item.type === 'WITHDRAW' ? '-' : '+'}{item.amount.toLocaleString()} 🪙
                  </strong>
                </div>
              ))}
            </div>
          )
        ) : (
          spins.length === 0 ? (
            <div className="bg-[#141424]/40 border border-[#1b1c31] rounded-2xl p-8 text-center text-slate-400 text-xs animate-fade-in">
              No daily spins documented in ledger. Play the Wheel of Fortune!
            </div>
          ) : (
            <div className="flex flex-col gap-2 animate-fade-in">
              {spins.map(item => (
                <div 
                  key={item.id}
                  className="bg-[#141424] border border-slate-900 p-3 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-indigo-500/10 rounded-lg flex items-center justify-center border border-indigo-550/20 text-indigo-400">
                      <Star className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 leading-none">{item.reward}</h4>
                      <p className="text-[9px] text-slate-500 font-mono mt-1">
                        {new Date(item.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] uppercase font-mono font-bold text-emerald-400">
                    Credited
                  </span>
                </div>
              ))}
            </div>
          )
        )}
      </section>

    </div>
  );
}
