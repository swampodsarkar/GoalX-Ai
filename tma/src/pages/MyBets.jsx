import React, { useState, useEffect } from 'react'
import { useApp } from '../App'
import { getBets } from '../api'

function formatBal(b) { return (Number(b) || 0).toLocaleString() }

export default function MyBets() {
  const { user } = useApp()
  const [active, setActive] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getBets(user.telegramId).then(res => {
      setActive(res.active || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user.telegramId])

  const emoji = (p) => p === 'HOME' ? '🏠' : p === 'AWAY' ? '✈️' : '🤝'

  if (loading) return <div className="container"><div className="loading">Loading bets...</div></div>

  return (
    <div className="container">
      <h1 className="page-title">📋 My Bets</h1>

      {active.length === 0 ? (
        <div className="card text-center">
          <div style={{fontSize:48,marginBottom:12}}>📭</div>
          <p className="text-muted">No active bets</p>
          <button className="btn btn-gold mt-4" onClick={() => window.location.href='/tma/matches'}>
            ⚽ Place a Bet
          </button>
        </div>
      ) : (
        active.map((b, i) => (
          <div key={b.id || i} className="card" style={{padding:16}}>
            <div className="flex flex-between items-center" style={{marginBottom:8}}>
              <div style={{fontWeight:600,fontSize:14,color:'#fff'}}>
                {b.homeTeam} vs {b.awayTeam}
              </div>
              <span className="status pending">⏳ Active</span>
            </div>
            <div className="flex flex-between text-sm">
              <span className="text-muted">{emoji(b.prediction)} {b.prediction === 'HOME' ? b.homeTeam : b.prediction === 'AWAY' ? b.awayTeam : 'DRAW'}</span>
              <span className="text-gold font-bold">{formatBal(b.stake)} coins</span>
            </div>
            {b.predictedScore && (
              <div className="text-sm text-muted mt-4">🎯 Exact Score: {b.predictedScore}</div>
            )}
            <div className="text-sm text-muted" style={{marginTop:4}}>
              {b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : ''}
            </div>
          </div>
        ))
      )}

      {active.length > 0 && (
        <div className="card" style={{padding:12}}>
          <div className="flex flex-between items-center">
            <span className="text-muted text-sm">Total Active</span>
            <span className="text-gold font-bold">{active.length} bet(s)</span>
          </div>
        </div>
      )}
    </div>
  )
}
