import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Gift, Award, HelpCircle, CheckCircle2, Clock, CalendarHeart, Sparkles } from 'lucide-react';

export default function Daily() {
  const { user, claimDailyReward } = useApp();
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [cooldownTime, setCooldownTime] = useState('');

  const daysRewardIncentives = [
    { day: 1, amount: 100 },
    { day: 2, amount: 200 },
    { day: 3, amount: 300 },
    { day: 4, amount: 400 },
    { day: 5, amount: 500 },
    { day: 6, amount: 600 },
    { day: 7, amount: 700 }
  ];

  // Helper inside to assess cooldown clock
  useEffect(() => {
    if (!user || !user.lastDailyRewardTimestamp) return;

    const interval = setInterval(() => {
      const now = new Date();
      const last = new Date(user.lastDailyRewardTimestamp!);
      const diffMs = now.getTime() - last.getTime();
      const diffHrs = diffMs / (1000 * 60 * 60);

      if (diffHrs < 24) {
        const remainingTicks = (24 * 60 * 60 * 1000) - diffMs;
        const hrs = Math.floor(remainingTicks / (1000 * 60 * 60));
        const mins = Math.floor((remainingTicks % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((remainingTicks % (1000 * 60)) / 1000);
        setCooldownTime(`${hrs}h ${mins}m ${secs}s`);
      } else {
        setCooldownTime('');
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  const handleClaim = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const result = await claimDailyReward();
      setSuccessMsg(`Congratulations! Claimed +${result.amount} coins to bankroll! ${result.isCombo ? 'GOLDEN COMBO 7-DAYS COMPLETED!' : ''}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Claim failed');
    }
  };

  if (!user) {
    return <div className="text-center py-20 text-xs text-slate-500 font-mono">Connecting streaks...</div>;
  }

  const currentStreakIdx = user.dailyStreak; // e.g. 2 means they claimed up to Day 2 or completed Day 2

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <CalendarHeart className="w-8 h-8 text-amber-400" />
        <div>
          <h2 className="text-lg font-extrabold text-slate-100">Daily Streak Check-Ins</h2>
          <p className="text-[10px] text-slate-400 font-mono">Claim free coins consecutive days to spike rewards multiplier</p>
        </div>
      </div>

      {/* 1. Main visual checker console */}
      <section className="bg-gradient-to-br from-[#241a10] to-[#1c120a] p-5 rounded-2xl border border-amber-500/10 shadow flex flex-col items-center gap-3 relative text-center">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -z-10" />
        
        <Gift className="w-12 h-12 text-amber-400 animate-bounce" />
        
        <div>
          <h3 className="text-[11px] font-bold text-amber-400 uppercase tracking-widest leading-none">Consecutive Streak</h3>
          <h4 className="text-2xl font-black text-slate-100 font-sans tracking-tight mt-1 leading-tight">{user.dailyStreak} Days Claimed</h4>
          <p className="text-[9px] text-[#dac8b2] leading-tight mt-1">Streaks must be maintained. Missing a check-in resets current day back to 1!</p>
        </div>

        {/* Claim Buttons / Cooldown Timer */}
        <div className="w-full mt-2">
          {cooldownTime ? (
            <div className="bg-[#100a05]/65 p-3 rounded-xl border border-amber-500/15 flex flex-col items-center gap-1">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Claim cooldown active</span>
              <strong className="text-sm font-mono text-amber-400 tracking-wider font-extrabold flex items-center gap-1">
                <Clock className="w-4 h-4 text-amber-400" /> {cooldownTime}
              </strong>
            </div>
          ) : (
            <button 
              onClick={handleClaim}
              className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-amber-500/5 leading-none font-sans"
            >
              <Sparkles className="w-4 h-4 text-slate-950" /> Claim Day {Math.min(currentStreakIdx + 1, 7)} Rewards
            </button>
          )}
        </div>

        {/* Message Alert prompts */}
        {successMsg && <p className="text-xs text-emerald-400 font-medium bg-emerald-500/10 p-2.5 border border-emerald-500/20 rounded-lg w-full mt-1.5">{successMsg}</p>}
        {errorMsg && <p className="text-xs text-red-500 font-medium bg-red-500/10 p-2.5 border border-red-500/20 rounded-lg w-full mt-1.5">{errorMsg}</p>}
      </section>

      {/* 2. Visual Streaks Grid Calendar */}
      <section className="flex flex-col gap-2.5">
        <h3 className="text-[11px] font-bold tracking-wider uppercase text-slate-400 px-1 font-mono">Streak Map</h3>
        
        <div className="grid grid-cols-4 gap-2">
          {daysRewardIncentives.map((item) => {
            const isCompleted = item.day <= currentStreakIdx;
            const isNext = item.day === currentStreakIdx + 1 && !cooldownTime;
            
            return (
              <div 
                key={item.day}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition ${isCompleted ? 'bg-amber-500/10 border-amber-400 text-amber-400 shadow-md' : isNext ? 'bg-slate-900 border-dashed border-amber-500/30 text-slate-300 animate-pulse' : 'bg-[#141424] border-slate-900 text-slate-500'}`}
                style={{ gridColumn: item.day === 7 ? 'span 2' : undefined }}
              >
                <div className="text-[8px] font-mono font-bold uppercase block leading-none">Day {item.day}</div>
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-amber-500 mt-1.5" />
                ) : (
                  <strong className="text-xs font-mono font-black mt-1.5 block leading-none">+{item.amount}</strong>
                )}
                <span className="text-[8px] text-slate-500 block font-sans mt-0.5 leading-none">Coins</span>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
