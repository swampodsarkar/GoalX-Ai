import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ref, query, orderByChild, equalTo, onValue } from 'firebase/database';
import { db } from '../firebase';
import { Transaction } from '../types';
import { ArrowDownLeft, ArrowUpRight, Award, Gift, HelpCircle, Landmark } from 'lucide-react';

export default function Wallet() {
  const { user, depositFunds, withdrawFunds } = useApp();
  const [amount, setAmount] = useState('500');
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!user) return;

    const txnRef = ref(db, 'transactions');
    const q = query(txnRef, orderByChild('userId'), equalTo(user.id));

    const unsubscribe = onValue(q, (snap) => {
      const list: Transaction[] = [];
      snap.forEach(child => {
        list.push(child.val() as Transaction);
      });
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setHistory(list.slice(0, 20));
      setLoadingHistory(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDeposit = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setErrorMsg('Please specify a valid deposit amount.');
      return;
    }
    try {
      await depositFunds(val);
      setSuccessMsg(`Successfully deposited ${val.toLocaleString()} simulated coins.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Deposit failed');
    }
  };

  const handleWithdraw = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setErrorMsg('Please specify a valid withdrawal amount.');
      return;
    }
    if (user && user.balance < val) {
      setErrorMsg('Insufficient balance for withdrawal request.');
      return;
    }
    try {
      await withdrawFunds(val);
      setSuccessMsg(`Simulated cash out request of ${val.toLocaleString()} coins complete.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Withdrawal failed');
    }
  };

  const getTxnIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg"><ArrowDownLeft className="w-4 h-4" /></div>;
      case 'WITHDRAW':
        return <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg"><ArrowUpRight className="w-4 h-4" /></div>;
      case 'DAILY_REWARD':
        return <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg"><Gift className="w-4 h-4" /></div>;
      case 'REFERRAL_BONUS':
        return <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg"><Award className="w-4 h-4" /></div>;
      default:
        return <div className="p-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-lg"><Landmark className="w-4 h-4" /></div>;
    }
  };

  if (!user) {
    return <div className="text-center py-20 text-xs text-slate-400">Loading Wallet...</div>;
  }

  return (
    <div className="animate-fade-in flex flex-col gap-5">
      
      {/* Mini Header */}
      <div>
        <h2 className="text-lg font-extrabold text-slate-100">Simulated Mini-Wallet</h2>
        <p className="text-[10px] text-slate-400 font-mono">Simulate deposits, withdrawals, and track audit ledgers</p>
      </div>

      {/* Big Balance Screen */}
      <section className="bg-gradient-to-br from-[#121224] to-[#1c1c34] p-5 rounded-2xl border border-slate-900 text-center relative overflow-hidden">
        <span className="text-xs font-mono text-slate-400 uppercase tracking-widest leading-none">Your Virtual Coin Balance</span>
        <h3 className="text-4xl font-extrabold text-amber-300 tracking-tight mt-1 mb-2">
          {(user.balance || 0).toLocaleString()} <span className="text-lg font-normal text-amber-500">🪙</span>
        </h3>
        <p className="text-[9px] text-[#8e8ec8] leading-tight">These are virtual platform credits. Use deposit inputs to reload and keep betting!</p>
      </section>

      {/* Action Fields */}
      <section className="bg-[#141424] border border-slate-900 rounded-2xl p-4 flex flex-col gap-4">
        <div>
          <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono">Simulate Action Amount</label>
          <div className="flex gap-2 mt-1.5">
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-[#1a1a2e] border border-slate-800 text-slate-100 px-4 py-2 text-sm rounded-xl focus:outline-none focus:border-amber-500 font-mono"
              placeholder="Enter coin value"
            />
          </div>
        </div>

        {/* Amount suggestions chips */}
        <div className="flex gap-2">
          {['100', '500', '2000', '10000'].map(val => (
            <button
              key={val}
              onClick={() => setAmount(val)}
              className={`flex-1 py-1.5 border rounded-lg text-xs font-mono font-bold transition ${amount === val ? 'bg-amber-400 border-amber-400 text-slate-950' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
            >
              +{parseInt(val).toLocaleString()}
            </button>
          ))}
        </div>

        {/* Status indicators */}
        {successMsg && <p className="text-xs text-emerald-400 font-medium bg-emerald-500/10 p-2 border border-emerald-500/20 rounded-lg">{successMsg}</p>}
        {errorMsg && <p className="text-xs text-red-400 font-medium bg-red-500/10 p-2 border border-red-500/20 rounded-lg">{errorMsg}</p>}

        <div className="grid grid-cols-2 gap-3 mt-1">
          <button 
            onClick={handleDeposit}
            className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold py-2.5 rounded-xl text-xs transition"
          >
            📥 Deposit Simulated Coins
          </button>
          <button 
            onClick={handleWithdraw}
            className="bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 text-rose-400 font-bold py-2.5 rounded-xl text-xs transition"
          >
            📤 Simulated Withdraw
          </button>
        </div>
      </section>

      {/* Transaction Ledger Log */}
      <section className="flex flex-col gap-3">
        <h3 className="text-[11px] font-bold tracking-wider uppercase text-slate-400 px-1 font-mono">Simulated Audit Ledger</h3>
        
        {loadingHistory ? (
          <div className="text-center py-6 text-xs text-slate-500 font-mono animate-pulse">Syncing transactions ledger...</div>
        ) : history.length === 0 ? (
          <div className="bg-[#141424]/40 border border-slate-900 rounded-2xl p-6 text-center text-slate-400 text-xs">
            No financial history recorded yet. Deposit some coins above!
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map(item => (
              <div 
                key={item.id}
                className="bg-[#141424] border border-slate-900 p-3 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {getTxnIcon(item.type)}
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 capitalize leading-tight">{item.type.replace('_', ' ').toLowerCase()}</h4>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                      {new Date(item.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono text-xs font-extrabold">
                  <span className={item.type === 'WITHDRAW' ? 'text-rose-400' : 'text-emerald-400'}>
                    {item.type === 'WITHDRAW' ? '-' : '+'}{(item.amount || 0).toLocaleString()} 🪙
                  </span>
                  <div className="text-[8px] text-slate-400 font-normal">Completed</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
