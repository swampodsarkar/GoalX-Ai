import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { getLeaderboard, getWinners, getMatches } from '../api'

function formatBal(b) {
  return (Number(b) || 0).toLocaleString()
}

export default function Home() {
  const { user } = useApp()
  const navigate = useNavigate()
  const [leaders, setLeaders] = useState([])
  const [winners, setWinners] = useState([])
  const [liveCount, setLiveCount] = useState(0)

  useEffect(() => {
    getLeaderboard().then(setLeaders).catch(() => {})
    getWinners().then(setWinners).catch(() => {})
    getMatches().then(m => setLiveCount(m.filter(x => x.live).length)).catch(() => {})
  }, [])

  const quickActions = [
    { icon: '🎯', label: 'Place Bet', color: '#ffd700', action: () => navigate('/matches') },
    { icon: '🎁', label: 'Daily Bonus', color: '#64ffda', action: () => navigate('/daily') },
    { icon: '🎰', label: 'Lucky Spin', color: '#6bb5ff', action: () => navigate('/spin') },
    { icon: '🏆', label: 'Leaderboard', color: '#ff6b6b', action: () => navigate('/leaderboard') },
  ]

  return (
    <div className="container">
      <div className="card" style={{marginTop:8}}>
        <div className="flex flex-between items-center">
          <div>
            <div style={{fontSize:12,color:'#8892b0'}}>Welcome back</div>
            <div style={{fontSize:18,fontWeight:700,color:'#fff'}}>
              {user.firstName || user.username || 'Player'}
              {user.vip ? <span style={{fontSize:14,marginLeft:6}}>💎</span> : null}
            </div>
          </div>
          <div className="text-center">
            <div style={{fontSize:22,fontWeight:700,color:'#ffd700'}}>⚽</div>
            <div style={{fontSize:10,color:'#8892b0'}}>GoalX AI</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-between items-center">
          <div>
            <div className="card-header">Balance</div>
            <div className="card-value gold">{formatBal(user.balance)}</div>
          </div>
          <div className="text-right">
            <div className="card-header">Bets</div>
            <div className="card-value" style={{fontSize:20}}>{user.totalBets || 0}</div>
          </div>
          <div className="text-right">
            <div className="card-header">Won</div>
            <div className="card-value green" style={{fontSize:20}}>{formatBal(user.totalWon)}</div>
          </div>
        </div>
      </div>

      {liveCount > 0 && (
        <div className="card" style={{border: '1px solid rgba(255,107,107,0.3)'}}>
          <div className="flex items-center" style={{gap:8}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:'#ff6b6b',display:'inline-block'}}></span>
            <span style={{color:'#ff6b6b',fontWeight:600,fontSize:14}}>{liveCount} Live Matches</span>
            <span style={{marginLeft:'auto',fontSize:12,color:'#8892b0',cursor:'pointer'}} onClick={() => navigate('/matches')}>View →</span>
          </div>
        </div>
      )}

      <div className="grid-2" style={{marginBottom:16}}>
        {quickActions.map((item, i) => (
          <div key={i} className="card" style={{cursor:'pointer',padding:16,textAlign:'center'}} onClick={item.action}>
            <div style={{fontSize:28,marginBottom:4}}>{item.icon}</div>
            <div style={{fontSize:13,color:item.color,fontWeight:600}}>{item.label}</div>
          </div>
        ))}
      </div>

      {leaders.length > 0 && (
        <div className="card">
          <div className="flex flex-between items-center" style={{marginBottom:12}}>
            <h3 style={{fontSize:15,color:'#fff'}}>🏆 Top Players</h3>
            <span style={{fontSize:12,color:'#8892b0',cursor:'pointer'}} onClick={() => navigate('/leaderboard')}>See all →</span>
          </div>
          {leaders.slice(0, 3).map((u, i) => (
            <div key={i} className="flex flex-between items-center" style={{padding:'8px 0',borderBottom:i<2?'1px solid rgba(255,255,255,0.03)':'none'}}>
              <div className="flex items-center" style={{gap:8}}>
                <span style={{fontSize:16}}>{['🥇','🥈','🥉'][i]}</span>
                <span style={{fontSize:13}}>{u.username || 'Anonymous'}</span>
              </div>
              <span className="text-gold font-bold" style={{fontSize:13}}>{formatBal(u.balance)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3 style={{fontSize:15,color:'#fff',marginBottom:12}}>🔥 Live Winners</h3>
        {winners.slice(0, 5).map((w, i) => (
          <div key={i} className="flex flex-between items-center" style={{padding:'6px 0',fontSize:13}}>
            <span>🇧🇩 {w.name}</span>
            <span className="text-green font-bold">+{w.amount}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
