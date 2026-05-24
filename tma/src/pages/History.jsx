import React, { useState, useEffect } from 'react'
import { useApp } from '../App'
import { getBets } from '../api'

function formatBal(b) { return (Number(b) || 0).toLocaleString() }

export default function History() {
  const { user } = useApp()
  const [bets, setBets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getBets(user.telegramId).then(res => {
      setBets(res.all || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user.telegramId])

  const statusEmoji = (s) => s === 'EXACT' ? '⭐' : s === 'WON' ? '✅' : s === 'LOST' ? '❌' : '⏳'
  const predEmoji = (p) => p === 'HOME' ? '🏠' : p === 'AWAY' ? '✈️' : '🤝'

  if (loading) return <div className="container"><div className="loading">Loading history...</div></div>

  return (
    <div className="container">
      <h1 className="page-title">📜 Bet History</h1>

      {bets.length === 0 ? (
        <div className="card text-center">
          <div style={{fontSize:48,marginBottom:12}}>📭</div>
          <p className="text-muted">No bet history yet</p>
        </div>
      ) : (
        bets.slice(0, 50).map((b, i) => (
          <div key={b.id || i} className="bet-history-item">
            <div className="flex flex-between items-center" style={{marginBottom:4}}>
              <div style={{fontSize:13,fontWeight:500,color:'#fff'}}>
                {b.homeTeam} vs {b.awayTeam}
              </div>
              <span className={`status ${(b.status||'pending').toLowerCase()}`}>
                {statusEmoji(b.status)} {b.status}
              </span>
            </div>
            <div className="flex flex-between text-sm">
              <span className="text-muted">
                {predEmoji(b.prediction)} {b.prediction === 'HOME' ? b.homeTeam : b.prediction === 'AWAY' ? b.awayTeam : 'DRAW'}
                {b.predictedScore ? ` 🎯${b.predictedScore}` : ''}
              </span>
              <div className="text-right">
                <span className="text-muted">Stake: {formatBal(b.stake)}</span>
                {b.payout > 0 && <span className="text-green font-bold" style={{marginLeft:8}}>+{formatBal(b.payout)}</span>}
              </div>
            </div>
            <div className="text-xs text-muted" style={{marginTop:4}}>
              {b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : ''}
            </div>
          </div>
        ))
      )}

      {bets.length > 0 && (
        <div className="card" style={{padding:12}}>
          <div className="flex flex-between items-center">
            <span className="text-muted text-sm">Total Bets</span>
            <span className="text-gold font-bold">{bets.length}</span>
          </div>
        </div>
      )}
    </div>
  )
}
