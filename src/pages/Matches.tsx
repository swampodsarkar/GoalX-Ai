import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Flame, Clock, CheckCircle2, Search } from 'lucide-react';
import { TEAMS } from '../utils/sportsProvider';

type FilterType = 'LIVE' | 'UPCOMING' | 'FINISHED';

export default function Matches() {
  const { matches, loading } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('LIVE');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract color pairings
  const findTeamDetail = (teamName: string) => {
    return TEAMS.find(t => t.name === teamName) || { short: teamName.substring(0, 3).toUpperCase(), bg: '#1e293b', color: '#ffffff' };
  };

  const filteredMatches = matches.filter(m => {
    const matchesFilter = m.status === filter;
    const matchesSearch = searchQuery === '' || 
      m.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.awayTeam.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getFilterIcon = (type: FilterType) => {
    switch (type) {
      case 'LIVE': return <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse" />;
      case 'UPCOMING': return <Clock className="w-3.5 h-3.5 text-sky-400" />;
      case 'FINISHED': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-xs text-slate-400 animate-pulse font-mono flex flex-col items-center gap-2 justify-center">
        <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
        Syncing live match lobbies...
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      
      {/* Header */}
      <div>
        <h2 className="text-lg font-extrabold text-slate-100">Football Arena Lobbies</h2>
        <p className="text-[10px] text-slate-400 font-mono">Tap on any fixture to check detailed AI stats and place bets</p>
      </div>

      {/* Navigation Filter Tabs */}
      <section className="bg-[#141424] p-1 border border-slate-900 rounded-xl flex items-center justify-between text-xs font-bold shrink-0">
        {(['LIVE', 'UPCOMING', 'FINISHED'] as FilterType[]).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${filter === type ? 'bg-slate-900 text-amber-400 font-extrabold shadow-md' : 'text-slate-400'}`}
          >
            {getFilterIcon(type)}
            <span>{type}</span>
          </button>
        ))}
      </section>

      {/* Simple Search Box */}
      <section className="bg-[#141424] border border-slate-900 p-2.5 rounded-xl flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-500" />
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by team name..."
          className="bg-transparent border-none text-slate-200 text-xs focus:outline-none w-full"
        />
      </section>

      {/* Matches Grid List */}
      <section className="flex flex-col gap-3">
        {filteredMatches.length === 0 ? (
          <div className="bg-[#141424]/30 border border-dashed border-slate-900 p-10 rounded-2xl text-center text-slate-400 text-xs">
            <p className="font-mono">No matches found in this category.</p>
            {searchQuery && <p className="text-[10px] text-slate-500 mt-1">Try resetting your search query.</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredMatches.map(m => {
              const homeDetail = findTeamDetail(m.homeTeam);
              const awayDetail = findTeamDetail(m.awayTeam);
              return (
                <div 
                  key={m.id}
                  onClick={() => navigate(`/match/${m.id}`)}
                  className="bg-[#141424] border border-slate-900 rounded-xl p-3.5 hover:border-slate-800 transition flex flex-col gap-2 cursor-pointer shadow-md"
                >
                  {/* Match Metadata header */}
                  <div className="flex items-center justify-between text-[8px] font-mono font-bold text-slate-400">
                    <span className="bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800/80">
                      ID: {m.id.toUpperCase()}
                    </span>
                    <span>
                      {filter === 'FINISHED' ? 'CONCLUDED' : new Date(m.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>

                  {/* Club Rows */}
                  <div className="flex justify-between items-center py-1">
                    <div className="flex items-center gap-2 flex-1">
                      {m.homeLogo ? (
                        <img 
                          src={m.homeLogo} 
                          alt={m.homeTeam} 
                          className="w-8 h-8 object-contain bg-slate-900/60 p-1 rounded-full border border-slate-800 shadow"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] shadow border border-slate-850"
                          style={{ backgroundColor: homeDetail.bg, color: homeDetail.color }}
                        >
                          {homeDetail.short}
                        </div>
                      )}
                      <span className="text-xs font-bold text-slate-100 max-w-[100px] truncate">{m.homeTeam}</span>
                    </div>

                    <div className="flex flex-col items-center justify-center px-2">
                       {m.status === 'UPCOMING' ? (
                        <div className="text-[10px] text-amber-400 font-bold tracking-wider font-mono bg-amber-400/5 px-2 py-0.5 rounded-full border border-amber-400/10">
                          VS
                        </div>
                      ) : (
                        <span className="text-sm font-extrabold font-mono text-amber-300">
                          {m.homeScore} : {m.awayScore}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <span className="text-xs font-bold text-slate-100 max-w-[100px] truncate text-right">{m.awayTeam}</span>
                      {m.awayLogo ? (
                        <img 
                          src={m.awayLogo} 
                          alt={m.awayTeam} 
                          className="w-8 h-8 object-contain bg-slate-900/60 p-1 rounded-full border border-slate-800 shadow animate-fade-in"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] shadow border border-slate-850"
                          style={{ backgroundColor: awayDetail.bg, color: awayDetail.color }}
                        >
                          {awayDetail.short}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Decimal Odds footer */}
                  <div className="grid grid-cols-3 gap-2 mt-1.5 pt-2 border-t border-slate-950/40 text-center font-mono text-[10px]">
                    <div className="bg-[#181829] p-1 rounded-lg border border-slate-905">
                      <span className="text-slate-500 font-sans pr-1">1</span>
                      <strong className="text-slate-300">{m.oddsHome.toFixed(2)}</strong>
                    </div>
                    <div className="bg-[#181829] p-1 rounded-lg border border-slate-905">
                      <span className="text-slate-500 font-sans pr-1">Draw</span>
                      <strong className="text-slate-300">{m.oddsDraw.toFixed(2)}</strong>
                    </div>
                    <div className="bg-[#181829] p-1 rounded-lg border border-slate-905">
                      <span className="text-slate-500 font-sans pr-1">2</span>
                      <strong className="text-slate-300">{m.oddsAway.toFixed(2)}</strong>
                    </div>
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
