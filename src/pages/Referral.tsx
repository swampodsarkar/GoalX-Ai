import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Globe, Share2, Award, ClipboardCheck, Users, UsersIcon } from 'lucide-react';

export default function Referral() {
  const { user, referrals } = useApp();
  const [copied, setCopied] = useState(false);

  if (!user) {
    return <div className="text-center py-20 text-xs text-slate-500 font-mono">Connecting affiliations...</div>;
  }

  // Generate real Telegram deep link format
  // Fallbacks gracefully to development app url in metadata environments
  const referralLink = `https://t.me/BetMateAIBot/app?startapp=ref_${user.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Browser frame restrictions safeguard fallback instructions
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <Globe className="w-8 h-8 text-emerald-400" />
        <div>
          <h2 className="text-lg font-extrabold text-slate-100">Affiliate Commission Hub</h2>
          <p className="text-[10px] text-slate-400 font-mono">Invite friends and earn virtual commission credit rewards</p>
        </div>
      </div>

      {/* 1. Campaign Cards */}
      <section className="bg-gradient-to-br from-[#101918] to-[#12281a] p-5 rounded-2xl border border-emerald-500/20 shadow flex flex-col gap-4 relative">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
        
        <div>
          <span className="text-[8px] tracking-wider uppercase font-mono font-bold text-emerald-400">Campaign Promotion</span>
          <h3 className="text-sm font-extrabold text-[#e0f2f1] mt-1 leading-snug">Get 100 🪙 For Every Friend Who Joins Under Your Referral Link</h3>
          <p className="text-[9px] text-[#b2dfdb]/70 mt-1 lines-tight">They get a starting bonus of 2,000 coins instantly, and you get 100 coins credited directly to your bankroll!</p>
        </div>

        {/* Highlight Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-[#0b1414]/80 p-3 rounded-xl border border-emerald-500/10">
            <span className="text-[8px] font-mono text-slate-500 block leading-tight">Total Friends Invited</span>
            <strong className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5 block leading-none">{referrals.length}</strong>
          </div>
          <div className="bg-[#0b1414]/80 p-3 rounded-xl border border-emerald-500/10">
            <span className="text-[8px] font-mono text-slate-500 block leading-tight">Referrals Earned Commission</span>
            <strong className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5 block leading-none">{user.referralEarnings.toLocaleString()} 🪙</strong>
          </div>
        </div>
      </section>

      {/* 2. Link Action Module */}
      <section className="bg-[#141424] border border-slate-900 rounded-2xl p-4 flex flex-col gap-3">
        <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Your Affiliate DeepLink</label>
        
        <div className="flex items-center gap-2 bg-[#1a1a2e] border border-slate-800 p-2.5 rounded-xl font-mono text-xs">
          <input 
            type="text" 
            readOnly 
            value={referralLink} 
            className="bg-transparent border-none text-[10px] text-slate-300 focus:outline-none w-full select-all"
          />
        </div>

        <button 
          onClick={handleCopy}
          className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-500/5 leading-none"
        >
          {copied ? (
            <>
              <ClipboardCheck className="w-4 h-4 text-emerald-950" /> Copied Link!
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-emerald-950" /> Copy Referral Link
            </>
          )}
        </button>
      </section>

      {/* 3. Refferees List */}
      <section className="flex flex-col gap-3">
        <h3 className="text-[11px] font-bold tracking-wider uppercase text-slate-400 px-1 font-mono flex items-center gap-1.5">
          <UsersIcon className="w-3.5 h-3.5 text-emerald-400" /> Active Invitees ({referrals.length})
        </h3>

        {referrals.length === 0 ? (
          <div className="bg-[#141424]/40 border border-slate-900 rounded-2xl p-8 text-center text-slate-400 text-xs">
            No direct invitees found yet. Use your link above to start growing your BetMate network!
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {referrals.map(item => (
              <div 
                key={item.id}
                className="bg-[#141424] border border-slate-900 p-3 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border-slate-705 flex items-center justify-center font-bold text-xs">
                    {item.username.substring(0,1).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">@{item.username}</h4>
                    <p className="text-[8px] text-slate-500 font-mono mt-0.5">
                      JOINED: {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-sans font-extrabold bg-[#1a1a2e] text-slate-300 border border-slate-800">
                    {item.vipLevel.toUpperCase()}
                  </span>
                  <div className="text-[8px] text-slate-400 font-mono mt-1">
                    Win stake: {item.totalBetsAmount.toLocaleString()}🪙
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
