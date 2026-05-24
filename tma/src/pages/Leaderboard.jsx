import React, { useState, useEffect } from 'react'
import { getLeaderboard } from '../api'

function formatBal(b) { return (Number(b) || 0).toLocaleString() }

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLeaderboard().then(data => {
      setLeaders(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="container"><div className="loading">Loading...</div></div>

  const medals = ['🥇','🥈','🥉']

  return (
    <div className="container">
      <h1 className="page-title">🏆 Leaderboard</h1>

      <div className="card">
        {leaders.length === 0 ? (
          <p className="text-muted text-center">No players yet</p>
        ) : (
          leaders.map((u, i) => (
            <div key={u.telegramId} className="flex flex-between items-center"
              style={{padding:'10px 0', borderBottom: i < leaders.length-1 ? '1px solid rgba(255,255,255,0.03)' : 'none'}}>
              <div className="flex items-center" style={{gap:10}}>
                <span style={{fontSize:18,width:28,textAlign:'center'}}>{medals[i] || `#${i+1}`}</span>
                <div>
                  <div style={{fontSize:13,fontWeight:500,color:'#fff'}}>
                    {u.username || 'Anonymous'}
                    {u.vip ? <span style={{fontSize:11,marginLeft:4}}>💎</span> : null}
                  </div>
                  <div className="text-xs text-muted">{u.totalBets} bets</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-gold font-bold" style={{fontSize:14}}>{formatBal(u.balance)}</div>
                <div className="text-xs text-muted">coins</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
