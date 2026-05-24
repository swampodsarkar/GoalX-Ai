import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { buyVip } from '../api'

function formatBal(b) { return (Number(b) || 0).toLocaleString() }

export default function Profile() {
  const { user, setUser } = useApp()
  const navigate = useNavigate()

  const userLevel = user.level || { name:'BEGINNER', badge:'🌱' }
  const winRate = user.totalBets > 0
    ? ((user.totalWins / user.totalBets) * 100).toFixed(1)
    : '0.0'
  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})
    : 'N/A'

  const handleBuyVip = async () => {
    try {
      const res = await buyVip(user.telegramId)
      setUser(prev => ({ ...prev, balance: res.newBalance, vip: true, vipExpiry: res.vipExpiry }))
    } catch (e) { alert(e.message) }
  }

  return (
    <div className="container">
      <h1 className="page-title">👤 Profile</h1>

      <div className="card text-center">
        <div style={{fontSize:48,marginBottom:8}}>{userLevel.badge}</div>
        <div style={{fontSize:20,fontWeight:700,color:'#fff'}}>
          {user.firstName || user.username || 'Player'}
          {user.vip ? <span style={{fontSize:16,marginLeft:6}}>💎</span> : null}
        </div>
        <div className="text-sm text-muted">{user.username ? `@${user.username}` : ''}</div>
        <div style={{marginTop:8}}>
          <span className="status approved">{userLevel.name}</span>
          {user.vip && <span className="status pending" style={{marginLeft:4}}>💎 VIP</span>}
        </div>
      </div>

      <div className="card">
        <div className="grid-3 text-center">
          <div>
            <div className="card-header">Bets</div>
            <div className="card-value" style={{fontSize:20}}>{user.totalBets || 0}</div>
          </div>
          <div>
            <div className="card-header">Wins</div>
            <div className="card-value green" style={{fontSize:20}}>{user.totalWins || 0}</div>
          </div>
          <div>
            <div className="card-header">Win Rate</div>
            <div className="card-value" style={{fontSize:20,color:'#6bb5ff'}}>{winRate}%</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{color:'#fff',marginBottom:12}}>📊 Stats</h3>
        <div className="text-sm">
          <div className="flex flex-between" style={{padding:'6px 0'}}>
            <span className="text-muted">Joined</span>
            <span>{joinDate}</span>
          </div>
          <div className="flex flex-between" style={{padding:'6px 0'}}>
            <span className="text-muted">Streak</span>
            <span>🔥 {user.dailyStreak || 0} days</span>
          </div>
          <div className="flex flex-between" style={{padding:'6px 0'}}>
            <span className="text-muted">Balance</span>
            <span className="text-gold">{formatBal(user.balance)}</span>
          </div>
          <div className="flex flex-between" style={{padding:'6px 0'}}>
            <span className="text-muted">Total Won</span>
            <span className="text-green">{formatBal(user.totalWon)}</span>
          </div>
          <div className="flex flex-between" style={{padding:'6px 0'}}>
            <span className="text-muted">Total Deposited</span>
            <span>{formatBal(user.totalDeposited)}</span>
          </div>
        </div>
      </div>

      {!user.vip && (
        <div className="card">
          <h3 style={{color:'#fff',marginBottom:8}}>💎 VIP Membership</h3>
          <p className="text-sm text-muted" style={{marginBottom:12}}>
            Get double daily bonus, AI match analysis, and VIP badge!
          </p>
          <button className="btn btn-gold" onClick={handleBuyVip}>
            💎 Buy VIP (5,000 coins)
          </button>
        </div>
      )}

      <div className="card" style={{padding:12}}>
        <div className="flex" style={{gap:8,flexWrap:'wrap'}}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/referral')}>🎁 Referral</button>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/daily')}>🎁 Daily</button>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/spin')}>🎰 Spin</button>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/history')}>📜 History</button>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/leaderboard')}>🏆 Rankings</button>
        </div>
      </div>
    </div>
  )
}
