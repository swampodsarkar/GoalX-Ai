import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp, getOddsForSelection } from '../context/AppContext';
import { Flame, Clock, Award, HelpCircle, AlertTriangle, Play, RefreshCw, Zap } from 'lucide-react';
import { TEAMS } from '../utils/sportsProvider';

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const { 
    user, 
    matches, 
    placeBet, 
    simulateGoal, 
    simulateEndMatch, 
    isTelegram 
  } = useApp();
  const navigate = useNavigate();

  const match = matches.find(m => m.id === id);

  const [selection, setSelection] = useState<'1' | 'X' | '2' | 'OVER_2_5' | 'UNDER_2_5' | 'BTTS_YES' | 'BTTS_NO' | 'DC_1X' | 'DC_12' | 'DC_X2'>('1');
  const [stake, setStake] = useState('100');
  const [betPlacing, setBetPlacing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Find corresponding team detail colorings
  const findTeamDetail = (teamName: string) => {
    return TEAMS.find(t => t.name === teamName) || { short: teamName.substring(0, 3).toUpperCase(), bg: '#1e293b', color: '#ffffff' };
  };

  if (!match) {
    return (
      <div className="text-center py-20 text-xs text-slate-400">
        Fixture not found or matching.
        <button onClick={() => navigate('/matches')} className="text-amber-400 underline font-bold ml-1">Lobby</button>
      </div>
    );
  }

  const homeDetail = findTeamDetail(match.homeTeam);
  const awayDetail = findTeamDetail(match.awayTeam);

  // Active odds calculated using getOddsForSelection
  const activeOdds = getOddsForSelection(match, selection);
  const numStake = parseFloat(stake) || 0;
  
  // Calculate potential payout with VIP tier multipliers
  const calculatePotentialPayout = () => {
    const rawPayout = numStake * activeOdds;
    if (!user) return rawPayout;
    
    let bonusChance = 0;
    if (user.vipLevel === 'Silver') bonusChance = 0.05;
    else if (user.vipLevel === 'Gold') bonusChance = 0.10;
    else if (user.vipLevel === 'Platinum') bonusChance = 0.20;
    
    return rawPayout + (rawPayout * bonusChance);
  };

  const getVipMultPercent = () => {
    if (!user) return 0;
    if (user.vipLevel === 'Silver') return 5;
    if (user.vipLevel === 'Gold') return 10;
    if (user.vipLevel === 'Platinum') return 20;
    return 0;
  };

  const handlePlaceBet = async () => {
    if (!user) return;
    setErrorMsg('');
    setSuccessMsg('');

    if (numStake <= 0) {
      setErrorMsg('Please specify a positive coin stake.');
      return;
    }

    if (user.balance < numStake) {
      setErrorMsg('Insufficient coins in virtual wallet. Refuel at the wallet page!');
      return;
    }

    setBetPlacing(true);
    try {
      await placeBet(match.id, selection, numStake);
      setSuccessMsg(`Bet Registered! Your potential win is ${calculatePotentialPayout().toFixed(0)} coins.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error executing betting wager.');
    } finally {
      setBetPlacing(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      
      {/* 1. Big Match Header Panel */}
      <section className="bg-gradient-to-br from-[#121224] to-[#1a1a38] p-4 rounded-2xl border border-slate-900 shadow-xl flex flex-col items-center gap-3 relative">
        <button 
          onClick={() => navigate('/matches')}
          className="absolute top-3 left-3 text-[10px] text-slate-400 font-bold bg-[#0c0c16] hover:bg-slate-900 p-1 px-3 border border-slate-800 rounded-lg"
        >
          ← Lobbies
        </button>

        {/* Live Indicator */}
        <div className="flex items-center justify-center mt-2.5">
          {match.status === 'LIVE' ? (
            <span className="bg-red-600 border border-red-500/20 text-white text-[9px] font-mono font-bold py-0.5 px-3 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> MATCH LIVE
            </span>
          ) : match.status === 'FINISHED' ? (
            <span className="bg-emerald-600/40 border border-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold py-0.5 px-3 rounded-full">
              CONCLUDED
            </span>
          ) : (
            <span className="bg-sky-600/30 border border-sky-500/20 text-sky-400 text-[9px] font-mono font-bold py-0.5 px-3 rounded-full">
              UPCOMING — {new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Teams Matchup Visuals */}
        <div className="flex justify-between items-center w-full py-2 px-1">
          <div className="flex flex-col items-center gap-2 flex-1">
            {match.homeLogo ? (
              <img 
                src={match.homeLogo} 
                alt={match.homeTeam} 
                className="w-12 h-12 object-contain bg-slate-900/60 p-1.5 rounded-full border border-slate-800 shadow"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow border border-slate-800 animate-pulse"
                style={{ backgroundColor: homeDetail.bg, color: homeDetail.color }}
              >
                {homeDetail.short}
              </div>
            )}
            <span className="text-xs font-bold text-slate-100 text-center max-w-[100px] leading-tight">{match.homeTeam}</span>
          </div>

          <div className="flex flex-col items-center justify-center px-4">
            {match.status === 'UPCOMING' ? (
              <span className="text-2xl font-black text-amber-400 tracking-wider">VS</span>
            ) : (
              <span className="text-3xl font-extrabold font-mono text-amber-300 tracking-tight">
                {match.homeScore} : {match.awayScore}
              </span>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 flex-1">
            {match.awayLogo ? (
              <img 
                src={match.awayLogo} 
                alt={match.awayTeam} 
                className="w-12 h-12 object-contain bg-slate-900/60 p-1.5 rounded-full border border-slate-800 shadow"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow border border-slate-800 animate-pulse"
                style={{ backgroundColor: awayDetail.bg, color: awayDetail.color }}
              >
                {awayDetail.short}
              </div>
            )}
            <span className="text-xs font-bold text-slate-100 text-center max-w-[100px] leading-tight">{match.awayTeam}</span>
          </div>
        </div>
      </section>

      {/* 2. Advanced Match Simulations (Only visible in desktop/dev environment checks) */}
      {!isTelegram && (
        <section className="bg-amber-500/10 border border-dashed border-amber-500/30 p-3.5 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
            <h3 className="text-[10px] font-mono font-extrabold uppercase text-amber-400 tracking-wider leading-none">Developer Simulator Suite</h3>
          </div>
          <p className="text-[9px] text-slate-400 leading-tight">Simulate live goals as they happen, or conclude matches to trigger bets audits!</p>

          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <button 
              onClick={() => simulateGoal(match.id)}
              disabled={match.status !== 'LIVE'}
              className="flex-1 bg-slate-950/60 disabled:opacity-45 hover:bg-slate-950 p-1.5 rounded text-[9px] font-bold border border-slate-800"
            >
              ⚽ Add Random Goal
            </button>
            <button 
              onClick={() => simulateEndMatch(match.id, '1')}
              disabled={match.status === 'FINISHED'}
              className="flex-1 bg-slate-950/60 disabled:opacity-45 hover:bg-slate-950 p-1.5 rounded text-[9px] font-bold border border-slate-800 text-emerald-400"
            >
              🏁 Force Home Win (3:1)
            </button>
            <button 
              onClick={() => simulateEndMatch(match.id, 'X')}
              disabled={match.status === 'FINISHED'}
              className="flex-1 bg-slate-950/60 disabled:opacity-45 hover:bg-slate-950 p-1.5 rounded text-[9px] font-bold border border-slate-800 text-amber-400"
            >
              🏁 Force Draw (1:1)
            </button>
            <button 
              onClick={() => simulateEndMatch(match.id, '2')}
              disabled={match.status === 'FINISHED'}
              className="flex-1 bg-slate-950/60 disabled:opacity-45 hover:bg-slate-950 p-1.5 rounded text-[9px] font-bold border border-slate-800 text-rose-400"
            >
              🏁 Force Away Win (0:2)
            </button>
          </div>
        </section>
      )}

      {/* 3. Betting Wager Placement Form */}
      <section className="bg-[#141424] border border-slate-900 rounded-2xl p-4 flex flex-col gap-4">
        <h3 className="text-[11px] font-bold tracking-wider uppercase text-slate-400 px-1 font-mono">Place Virtual Bet</h3>

        {match.status === 'FINISHED' ? (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center flex flex-col items-center justify-center gap-1.5 text-xs text-red-400">
            <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
            <p className="font-bold">Betting Closed</p>
            <p className="text-[10px] text-slate-400">This fixture has already finished. Check upcoming or live matches in the lobby!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Outcomes Multi-Market Picker section */}
            <div className="flex flex-col gap-4">
              {/* Category 1: Main Outcome 1X2 */}
              <div className="bg-[#10101c] p-2.5 rounded-xl border border-slate-900/60">
                <span className="text-[9px] tracking-wider uppercase font-bold text-slate-400 block mb-2 px-0.5 font-mono">1X2 Full-Time Result</span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <button
                    onClick={() => setSelection('1')}
                    className={`py-2 px-1 border rounded-xl flex flex-col justify-center items-center gap-1 transition-all duration-200 ${selection === '1' ? 'bg-amber-400 border-amber-400 text-slate-950 font-black shadow-md' : 'bg-slate-900 border-slate-800 text-slate-300'}`}
                  >
                    <span className="text-[8px] uppercase tracking-wider block leading-none">Home (1)</span>
                    <span className="text-xs font-extrabold font-mono">{getOddsForSelection(match, '1').toFixed(2)}</span>
                  </button>
                  <button
                    onClick={() => setSelection('X')}
                    className={`py-2 px-1 border rounded-xl flex flex-col justify-center items-center gap-1 transition-all duration-200 ${selection === 'X' ? 'bg-amber-400 border-amber-400 text-slate-950 font-black shadow-md' : 'bg-slate-900 border-slate-800 text-slate-300'}`}
                  >
                    <span className="text-[8px] uppercase tracking-wider block leading-none">Draw (X)</span>
                    <span className="text-xs font-extrabold font-mono">{getOddsForSelection(match, 'X').toFixed(2)}</span>
                  </button>
                  <button
                    onClick={() => setSelection('2')}
                    className={`py-2 px-1 border rounded-xl flex flex-col justify-center items-center gap-1 transition-all duration-200 ${selection === '2' ? 'bg-amber-400 border-amber-400 text-slate-950 font-black shadow-md' : 'bg-slate-900 border-slate-800 text-slate-300'}`}
                  >
                    <span className="text-[8px] uppercase tracking-wider block leading-none">Away (2)</span>
                    <span className="text-xs font-extrabold font-mono">{getOddsForSelection(match, '2').toFixed(2)}</span>
                  </button>
                </div>
              </div>

              {/* Category 2: Over/Under + BTTS */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#10101c] p-2.5 rounded-xl border border-slate-900/60">
                  <span className="text-[9px] tracking-wider uppercase font-bold text-slate-400 block mb-2 px-0.5 font-mono">Goals Over/Under 2.5</span>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => setSelection('OVER_2_5')}
                      className={`w-full py-1.5 px-2 border rounded-lg flex justify-between items-center transition-all ${selection === 'OVER_2_5' ? 'bg-amber-400 border-amber-400 text-slate-950 font-extrabold' : 'bg-slate-900 border-slate-800 text-slate-300'}`}
                    >
                      <span className="text-[8px] uppercase">Over 2.5</span>
                      <span className="text-xs font-bold font-mono">{getOddsForSelection(match, 'OVER_2_5').toFixed(2)}</span>
                    </button>
                    <button
                      onClick={() => setSelection('UNDER_2_5')}
                      className={`w-full py-1.5 px-2 border rounded-lg flex justify-between items-center transition-all ${selection === 'UNDER_2_5' ? 'bg-amber-400 border-amber-400 text-slate-950 font-extrabold' : 'bg-slate-900 border-slate-800 text-slate-300'}`}
                    >
                      <span className="text-[8px] uppercase">Under 2.5</span>
                      <span className="text-xs font-bold font-mono">{getOddsForSelection(match, 'UNDER_2_5').toFixed(2)}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-[#10101c] p-2.5 rounded-xl border border-slate-900/60">
                  <span className="text-[9px] tracking-wider uppercase font-bold text-slate-400 block mb-2 px-0.5 font-mono">Both Teams To Score</span>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => setSelection('BTTS_YES')}
                      className={`w-full py-1.5 px-2 border rounded-lg flex justify-between items-center transition-all ${selection === 'BTTS_YES' ? 'bg-amber-400 border-amber-400 text-slate-950 font-extrabold' : 'bg-slate-900 border-slate-800 text-slate-300'}`}
                    >
                      <span className="text-[8px] uppercase font-bold">Yes</span>
                      <span className="text-xs font-bold font-mono">{getOddsForSelection(match, 'BTTS_YES').toFixed(2)}</span>
                    </button>
                    <button
                      onClick={() => setSelection('BTTS_NO')}
                      className={`w-full py-1.5 px-2 border rounded-lg flex justify-between items-center transition-all ${selection === 'BTTS_NO' ? 'bg-amber-400 border-amber-400 text-slate-950 font-extrabold' : 'bg-slate-900 border-slate-800 text-slate-300'}`}
                    >
                      <span className="text-[8px] uppercase font-bold">No</span>
                      <span className="text-xs font-bold font-mono">{getOddsForSelection(match, 'BTTS_NO').toFixed(2)}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Category 3: Double Chance */}
              <div className="bg-[#10101c] p-2.5 rounded-xl border border-slate-900/60">
                <span className="text-[9px] tracking-wider uppercase font-bold text-slate-400 block mb-2 px-0.5 font-mono">Double Chance Options</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelection('DC_1X')}
                    className={`py-1.5 px-1 border rounded-lg flex flex-col items-center gap-1 transition-all ${selection === 'DC_1X' ? 'bg-amber-400 border-amber-400 text-slate-950 font-extrabold' : 'bg-slate-900 border-slate-800 text-slate-300'}`}
                  >
                    <span className="text-[7.5px] uppercase">1X Home/Draw</span>
                    <span className="text-xs font-bold font-mono">{getOddsForSelection(match, 'DC_1X').toFixed(2)}</span>
                  </button>
                  <button
                    onClick={() => setSelection('DC_12')}
                    className={`py-1.5 px-1 border rounded-lg flex flex-col items-center gap-1 transition-all ${selection === 'DC_12' ? 'bg-amber-400 border-amber-400 text-slate-950 font-extrabold' : 'bg-slate-900 border-slate-800 text-slate-300'}`}
                  >
                    <span className="text-[7.5px] uppercase">12 Home/Away</span>
                    <span className="text-xs font-bold font-mono">{getOddsForSelection(match, 'DC_12').toFixed(2)}</span>
                  </button>
                  <button
                    onClick={() => setSelection('DC_X2')}
                    className={`py-1.5 px-1 border rounded-lg flex flex-col items-center gap-1 transition-all ${selection === 'DC_X2' ? 'bg-amber-400 border-amber-400 text-slate-950 font-extrabold' : 'bg-slate-900 border-slate-800 text-slate-300'}`}
                  >
                    <span className="text-[7.5px] uppercase">X2 Draw/Away</span>
                    <span className="text-xs font-bold font-mono">{getOddsForSelection(match, 'DC_X2').toFixed(2)}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stake Input */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Coins Stake Amount</span>
              <div className="flex gap-2">
                <input 
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  className="flex-1 bg-[#1c1c34] border border-slate-800 text-slate-100 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-400 font-mono font-bold"
                  placeholder="Stake value"
                />
              </div>
              <div className="flex gap-1">
                {['50', '100', '200', '500'].map(chip => (
                  <button 
                    key={chip}
                    onClick={() => setStake(chip)}
                    className={`flex-1 p-1 bg-slate-950/50 hover:bg-slate-900 text-[10px] border border-slate-800/80 rounded font-mono ${stake === chip ? 'text-amber-400 font-bold border-amber-500/40' : 'text-slate-400'}`}
                  >
                    {chip}🪙
                  </button>
                ))}
              </div>
            </div>

            {/* Payout Calculation Card */}
            <div className="bg-[#18182a] border border-slate-850 p-3 rounded-xl flex justify-between items-center text-xs">
              <div>
                <p className="text-slate-400 tracking-tight text-[10px]">Multiplier Total Odds</p>
                <p className="text-sm font-extrabold font-mono text-slate-200 mt-0.5">{activeOdds.toFixed(2)}x</p>
              </div>
              {getVipMultPercent() > 0 && (
                <div className="text-right">
                  <p className="text-slate-400 tracking-tight text-[10px] flex items-center justify-end gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-400" /> VIP Bonus boost
                  </p>
                  <p className="text-xs font-mono font-extrabold text-amber-400">+{getVipMultPercent()}% on returns</p>
                </div>
              )}
              <div className="text-right">
                <p className="text-slate-400 tracking-tight text-[10px]">Estimated Returns</p>
                <p className="text-base font-black font-mono text-amber-300 mt-0.5">{calculatePotentialPayout().toFixed(0)} 🪙</p>
              </div>
            </div>

            {/* Status alerts */}
            {successMsg && <p className="text-xs text-emerald-400 font-medium bg-emerald-500/10 p-2.5 border border-emerald-500/20 rounded-lg">{successMsg}</p>}
            {errorMsg && <p className="text-xs text-red-400 font-medium bg-red-500/10 p-2.5 border border-red-500/20 rounded-lg">{errorMsg}</p>}

            {/* Submit bet button */}
            <button
              onClick={handlePlaceBet}
              disabled={betPlacing}
              className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 disabled:opacity-50 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-400/5 cursor-pointer leading-none"
            >
              🚀 {betPlacing ? 'Submitting bet...' : 'Place Sports Wager'}
            </button>
          </div>
        )}
      </section>

      {/* 4. AI Predictions Analytics Block */}
      <section className="bg-[#141424] border border-slate-900 rounded-2xl p-4 flex flex-col gap-3">
        <h3 className="text-[11px] font-bold tracking-wider uppercase text-slate-400 px-1 font-mono">🤖 AI Outcome Projections</h3>
        
        {/* Progress Bar Probabilities */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-300 font-bold">
            <span className="text-amber-400">Home Win ({match.predictionHomeWinProb}%)</span>
            <span className="text-slate-400">Draw ({match.predictionDrawProb}%)</span>
            <span className="text-sky-300">Away Win ({match.predictionAwayWinProb}%)</span>
          </div>

          <div className="w-full h-3 rounded-full flex overflow-hidden">
            <div 
              style={{ width: `${match.predictionHomeWinProb}%` }} 
              className="bg-amber-400 h-full transition-all duration-300 shadow-inner" 
            />
            <div 
              style={{ width: `${match.predictionDrawProb}%` }} 
              className="bg-slate-600 h-full transition-all duration-300" 
            />
            <div 
              style={{ width: `${match.predictionAwayWinProb}%` }} 
              className="bg-sky-400 h-full transition-all duration-300 shadow-inner" 
            />
          </div>
        </div>

        {/* AI Sports tipster analysis */}
        <div className="bg-[#19192c] p-3.5 border border-slate-800 rounded-xl max-h-[300px] overflow-y-auto">
          <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed pb-1 select-text">
            {match.aiAnalysis.replace(/###/g, '').replace(/####/g, '•').replace(/\*\*/g, '')}
          </p>
        </div>
      </section>

    </div>
  );
}
