import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLeagues, getMatches, getMatchesByCompetition } from '../api'

export default function Matches() {
  const navigate = useNavigate()
  const [leagues, setLeagues] = useState([])
  const [matches, setMatches] = useState([])
  const [selectedLeague, setSelectedLeague] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLeagues().then(setLeagues).catch(() => {})
    getMatches().then(all => {
      setMatches(all)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const loadLeague = async (code) => {
    setLoading(true)
    setSelectedLeague(code)
    try {
      const m = await getMatchesByCompetition(code)
      setMatches(m)
    } catch {}
    setLoading(false)
  }

  const showAll = () => {
    setSelectedLeague(null)
    setLoading(true)
    getMatches().then(setMatches).catch(() => {}).finally(() => setLoading(false))
  }

  const liveMatches = matches.filter(m => m.live)
  const upcoming = matches.filter(m => !m.live && m.canBet)
  const closed = matches.filter(m => !m.live && !m.canBet)

  return (
    <div className="container">
      <h1 className="page-title">⚽ Matches</h1>

      <div style={{marginBottom:12, display:'flex', gap:4, overflowX:'auto', paddingBottom:4}}>
        <button className={`btn btn-sm ${!selectedLeague ? 'btn-gold' : 'btn-outline'}`}
          onClick={showAll} style={{whiteSpace:'nowrap',flexShrink:0}}>All</button>
        {leagues.map(l => (
          <button key={l.code} className={`btn btn-sm ${selectedLeague===l.code ? 'btn-gold' : 'btn-outline'}`}
            onClick={() => loadLeague(l.code)} style={{whiteSpace:'nowrap',flexShrink:0}}>
            {l.emoji} {l.code}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading matches...</div>
      ) : matches.length === 0 ? (
        <div className="card text-center">
          <div style={{fontSize:48,marginBottom:12}}>⚽</div>
          <p className="text-muted">No matches available right now</p>
        </div>
      ) : (
        <>
          {liveMatches.length > 0 && (
            <div className="card">
              <h3 style={{fontSize:14,color:'#ff6b6b',marginBottom:8}}>🔴 Live ({liveMatches.length})</h3>
              {liveMatches.map(m => (
                <div key={m.id} className="match-row" onClick={() => navigate(`/match/${m.id}`)}>
                  <div style={{flex:1}}>
                    <div className="team">{m.homeTeam} vs {m.awayTeam}</div>
                    <div className="meta">{m.competition}</div>
                  </div>
                  <span className="badge live">LIVE</span>
                </div>
              ))}
            </div>
          )}

          {upcoming.length > 0 && (
            <div className="card">
              <h3 style={{fontSize:14,color:'#64ffda',marginBottom:8}}>
                📅 Upcoming ({upcoming.length})
              </h3>
              {upcoming.map(m => (
                <div key={m.id} className="match-row" onClick={() => navigate(`/match/${m.id}`)}>
                  <div style={{flex:1}}>
                    <div className="team">{m.homeTeam} vs {m.awayTeam}</div>
                    <div className="meta">{m.competition} • {new Date(m.utcDate).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
                  </div>
                  <span className="badge upcoming">Bet</span>
                </div>
              ))}
            </div>
          )}

          {closed.length > 0 && (
            <div className="card">
              <h3 style={{fontSize:14,color:'#8892b0',marginBottom:8}}>⚫ Closed ({closed.length})</h3>
              {closed.map(m => (
                <div key={m.id} className="match-row" onClick={() => navigate(`/match/${m.id}`)}>
                  <div style={{flex:1}}>
                    <div className="team">{m.homeTeam} vs {m.awayTeam}</div>
                    <div className="meta">{m.competition}</div>
                  </div>
                  <span className="badge closed">Closed</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
