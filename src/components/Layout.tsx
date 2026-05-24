import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Home, Flame, Ticket, User, Wallet, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isTelegram, setMockTelegramUser, currentMockId, resetAllMatches } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [showMockSelector, setShowMockSelector] = useState(false);

  const navigationTabs = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Matches', path: '/matches', icon: Flame },
    { name: 'My Bets', path: '/my-bets', icon: Ticket },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const handleMockSwitch = async (id: string, name: string) => {
    await setMockTelegramUser(id, name);
    setShowMockSelector(false);
  };

  const currentActiveTab = navigationTabs.find(tab => {
    if (tab.path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(tab.path);
  });

  return (
    <div className="min-h-screen text-slate-100 flex flex-col max-w-md mx-auto relative shadow-2xl bg-[#0f0f1a] pb-24 overflow-x-hidden border-x border-slate-900">
      
      {/* Top Bar Navigation */}
      <header className="sticky top-0 z-40 bg-[#0f0f1a]/95 backdrop-blur-md border-b border-slate-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center font-bold text-slate-950 shadow-inner">
            B
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight font-sans text-amber-400">BetMate AI</h1>
            <p className="text-[10px] text-slate-400 font-mono">Telegram Arena</p>
          </div>
        </div>

        {/* Balance Card Quick Actions */}
        <div className="flex items-center gap-3">
          {user && (
            <div 
              onClick={() => navigate('/wallet')} 
              className="bg-[#181829] border border-slate-800 rounded-full pl-3 pr-4 py-1 flex items-center gap-2 hover:bg-slate-800 transition cursor-pointer"
            >
              <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center font-bold text-[10px] text-slate-950">
                $
              </div>
              <span className="text-xs font-mono font-bold text-amber-300">{user.balance.toLocaleString()}🪙</span>
            </div>
          )}

          {/* Dev-Mode Mock User Switcher (Only visible in desktop browser previews) */}
          {!isTelegram && (
            <button 
              onClick={() => setShowMockSelector(!showMockSelector)}
              className="p-1 px-2 border border-dashed border-amber-500/50 rounded-lg text-[10px] font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 transition"
            >
              Dev-Accounts
            </button>
          )}
        </div>
      </header>

      {/* Embedded Dev accounts drawer */}
      {showMockSelector && (
        <div className="absolute top-[52px] left-0 w-full z-50 bg-[#16162a]/95 border-b border-slate-800 p-4 shadow-xl text-xs flex flex-col gap-3 font-sans transition-all">
          <p className="text-amber-400 font-bold tracking-wider uppercase text-[10px]">🎨 Developer Simulated Telegram Accounts</p>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => handleMockSwitch('mock_user_777', 'FootballWarlock')}
              className={`p-2 rounded-lg text-left transition ${currentMockId === 'mock_user_777' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 hover:bg-slate-800'}`}
            >
              🧙‍♂️ FootballWarlock (777)
            </button>
            <button 
              onClick={() => handleMockSwitch('ref_user_222', 'ApexBettor')}
              className={`p-2 rounded-lg text-left transition ${currentMockId === 'ref_user_222' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 hover:bg-slate-800'}`}
            >
              🦁 ApexBettor (222 - Invitee)
            </button>
            <button 
              onClick={() => handleMockSwitch('vip_user_999', 'SparksPlatBet')}
              className={`p-2 rounded-lg text-left transition ${currentMockId === 'vip_user_999' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 hover:bg-slate-800'}`}
            >
              💎 SparksPlatBet (999 - VIP)
            </button>
            <button 
              onClick={() => handleMockSwitch('new_user_111', 'RookieGreen')}
              className={`p-2 rounded-lg text-left transition ${currentMockId === 'new_user_111' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 hover:bg-slate-800'}`}
            >
              🌱 RookieGreen (111)
            </button>
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t border-slate-800/60">
            <button 
              onClick={async () => {
                await resetAllMatches();
                setShowMockSelector(false);
              }}
              className="flex items-center gap-1 p-1.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-[10px]"
            >
              <RefreshCw className="w-3 h-3" /> Reset Match Fixtures
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-4 overflow-y-auto">
        {children}
      </main>

      {/* Bottom Navigation Navbar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#0a0a14]/95 backdrop-blur-lg border-t border-slate-950 px-6 py-2 flex items-center justify-between z-40 shadow-2xl">
        {navigationTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentActiveTab?.path === tab.path;
          return (
            <button
              key={tab.name}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl hover:bg-slate-900/40 relative active:scale-95 transition"
              style={{ minWidth: '60px' }}
            >
              <Icon 
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'text-amber-400 scale-110' : 'text-slate-400 hover:text-slate-200'
                }`} 
              />
              <span className={`text-[10px] font-semibold ${
                isActive ? 'text-amber-400 font-bold' : 'text-slate-400'
              }`}>
                {tab.name}
              </span>
              {isActive && (
                <span className="absolute -top-1 w-5 h-[2px] bg-amber-400 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

    </div>
  );
}
