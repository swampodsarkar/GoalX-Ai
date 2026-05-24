import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { HelpCircle, Clock, Zap, Sparkles, Award, Star } from 'lucide-react';
import { ref, query, orderByChild, equalTo, onValue } from 'firebase/database';
import { db } from '../firebase';
import { SpinHistory } from '../types';

export default function Spin() {
  const { user, spinWheel } = useApp();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [cooldownTime, setCooldownTime] = useState('');
  const [prizeName, setPrizeName] = useState('');
  const [prizeCount, setPrizeCount] = useState(0);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [spinHistory, setSpinHistory] = useState<SpinHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const wheelPrizes = [
    { label: '50 🪙', degree: 30, amount: 50, color: 'bg-slate-900 border-slate-800' },
    { label: '100 🪙', degree: 90, amount: 100, color: 'bg-[#151530] border-slate-850' },
    { label: '150 🪙', degree: 150, amount: 150, color: 'bg-indigo-950/40 border-slate-850 text-indigo-400' },
    { label: '300 🪙', degree: 210, amount: 300, color: 'bg-[#1a133d] border-slate-850 text-amber-300' },
    { label: '500 🪙', degree: 270, amount: 500, color: 'bg-emerald-950/40 border-slate-850 text-emerald-400 font-extrabold' },
    { label: '1000 💎', degree: 330, amount: 1000, color: 'bg-gradient-to-tr from-[#2a134a] to-[#ffaa00]/10 border-amber-500/30 text-amber-400 font-black' }
  ];

  // Cooldown tracker interval
  useEffect(() => {
    if (!user || !user.lastSpinTimestamp) {
      setLoadingHistory(false);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const last = new Date(user.lastSpinTimestamp!);
      const diffMs = now.getTime() - last.getTime();
      const diffHrs = diffMs / (1000 * 60 * 60);

      if (diffHrs < 24) {
        const left = (24 * 60 * 60 * 1000) - diffMs;
        const h = Math.floor(left / (1000 * 60 * 60));
        const m = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((left % (1000 * 60)) / 1000);
        setCooldownTime(`${h}h ${m}m ${s}s`);
      } else {
        setCooldownTime('');
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  // Read historical wheel spin events in real-time
  useEffect(() => {
    if (!user) return;
    const q = query(ref(db, 'spinHistory'), orderByChild('userId'), equalTo(user.id));
    const unsubscribe = onValue(q, (snap) => {
      const list: SpinHistory[] = [];
      snap.forEach(child => {
        list.push(child.val() as SpinHistory);
      });
      list.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setSpinHistory(list.slice(0, 5));
      setLoadingHistory(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSpin = async () => {
    if (spinning || cooldownTime) return;

    setSpinning(true);
    try {
      const result = await spinWheel();

      // Find segment representing prize
      const prizeSegmentIdx = wheelPrizes.findIndex(p => p.amount === result.amount);
      const degreeGoal = wheelPrizes[prizeSegmentIdx >= 0 ? prizeSegmentIdx : 0].degree;

      // Spin degree: 10 full turns (3600) + inverse degree goal to line up to top pointer
      const totalDegree = 3600 + (360 - degreeGoal);
      setRotation(totalDegree);

      // Timeout aligned to transition animation length
      setTimeout(() => {
        setPrizeName(result.prize);
        setPrizeCount(result.amount);
        setShowPrizeModal(true);
        setSpinning(false);
        // Reset rotation back to offset for potential next spin clicks
        setRotation(totalDegree % 360);
      }, 3200);

    } catch (err: any) {
      setSpinning(false);
      alert(err.message || 'Spin failed error.');
    }
  };

  if (!user) {
    return <div className="text-center py-20 text-xs text-slate-500 font-mono">Connecting Spin wheel...</div>;
  }

  return (
    <div className="animate-fade-in flex flex-col gap-5 items-center relative">
      
      {/* Header */}
      <div className="w-full text-left">
        <h2 className="text-lg font-extrabold text-slate-100 flex items-center gap-1.5 leading-none">
          <Zap className="w-5 h-5 text-indigo-400" /> Fortune Spin Arena
        </h2>
        <p className="text-[10px] text-slate-400 font-mono mt-1">Spin the daily wheel for guaranteed coins wins</p>
      </div>

      {/* 1. Main Wheel segment board wrapping */}
      <section className="bg-gradient-to-b from-[#14142d] to-[#0c0c16] border border-slate-905 p-6 rounded-2xl w-full flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden">
        
        {/* Wheel Pointer */}
        <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-amber-400 absolute top-3.5 z-30 drop-shadow animate-pulse" />

        {/* CSS segments wheel circle */}
        <div className="w-52 h-52 rounded-full border-4 border-slate-950 relative overflow-hidden flex items-center justify-center shadow-inner mt-4">
          <div 
            className="w-full h-full rounded-full transition-transform duration-[3s] ease-out relative"
            style={{ 
              transform: `rotate(${rotation}deg)`,
              backgroundImage: 'conic-gradient(from 0deg, #18182d 0deg, #18182d 60deg, #251235 60deg, #251235 120deg, #111122 120deg, #111122 180deg, #2a1140 180deg, #2a1140 240deg, #1c1c36 240deg, #1c1c36 300deg, #351c55 300deg, #351c55 360deg)'
            }}
          >
            {/* Prize Labels around circle degree paths */}
            {wheelPrizes.map((p, i) => (
              <div
                key={p.label}
                className="absolute top-0 bottom-0 left-0 right-0 flex justify-center pt-5 text-[10px] font-mono font-black select-none text-slate-100 tracking-tight"
                style={{ transform: `rotate(${p.degree}deg)` }}
              >
                <div className="flex flex-col items-center">
                  <span>{p.label}</span>
                  <Star className="w-2 h-2 text-amber-500/30 mt-1" />
                </div>
              </div>
            ))}
          </div>

          {/* Central Spin Core Button */}
          <button 
            onClick={handleSpin}
            disabled={spinning || !!cooldownTime}
            className={`w-14 h-14 rounded-full border-2 border-slate-950 absolute z-20 flex flex-col items-center justify-center font-black transition cursor-pointer active:scale-90 select-none ${spinning ? 'bg-slate-800 text-slate-400' : 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-md'}`}
          >
            <span className="text-[11px] leading-none uppercase font-extrabold">{spinning ? '...' : 'SPIN'}</span>
          </button>
        </div>

        {/* Lock cooldown description bar */}
        <div className="w-full text-center">
          {cooldownTime ? (
            <div className="bg-[#0b0b14] p-3 rounded-lg border border-slate-900 inline-flex items-center gap-1.5 text-[10px] font-mono text-slate-400 justify-center w-full">
              <Clock className="w-3.5 h-3.5 text-amber-500" /> Free spin in cooldown: <strong>{cooldownTime}</strong>
            </div>
          ) : (
            <p className="text-[10px] font-sans text-amber-400 font-bold tracking-wide animate-pulse uppercase leading-none mt-1 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Free Daily Spin Active! Tap center button!
            </p>
          )}
        </div>
      </section>

      {/* 2. Celebration Prize Modal popup overlay */}
      {showPrizeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 max-w-md mx-auto">
          <div className="bg-[#141424] border border-amber-400/40 p-6 rounded-2xl flex flex-col items-center gap-4 text-center max-w-sm w-full shadow-2xl animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400 flex items-center justify-center animate-bounce">
              <Award className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-100">🎉 Daily Grand Fortune!</h3>
              <p className="text-xs text-slate-400 mt-1 leading-snug">The Fortune Wheel has stopped. You were awarded:</p>
              <h4 className="text-2xl font-black text-amber-300 font-mono tracking-tight mt-2.5">+{prizeCount}🪙 Credits</h4>
            </div>

            <button 
              onClick={() => setShowPrizeModal(false)}
              className="w-full bg-amber-400 hover:bg-amber-300 py-2.5 rounded-xl text-slate-950 font-bold text-xs shadow-md mt-2 transition"
            >
              Collect Rewards
            </button>
          </div>
        </div>
      )}

      {/* 3. Spin Histories */}
      <section className="w-full flex flex-col gap-2.5">
        <h3 className="text-[11px] font-bold tracking-wider uppercase text-slate-400 px-1 font-mono">My Recent Spins</h3>
        {loadingHistory ? (
          <div className="text-center py-4 text-xs font-mono text-slate-500">Syncing spin logs...</div>
        ) : spinHistory.length === 0 ? (
          <div className="bg-[#141424]/30 border border-slate-900 rounded-xl p-5 text-center text-slate-400 text-xs">
            No spin history documented yet. Hit the center button to launch!
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {spinHistory.map(item => (
              <div 
                key={item.id}
                className="bg-[#141424] border border-slate-900 p-2.5 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-indigo-400" />
                  <div>
                    <h4 className="font-bold text-slate-200">{item.reward}</h4>
                    <p className="text-[8px] text-slate-500 font-mono mt-0.5">
                      {new Date(item.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>

                <div className="text-right text-[10px] font-mono font-bold text-emerald-400">
                  +Credited
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
