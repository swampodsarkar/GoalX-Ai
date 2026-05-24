import React, { useState } from 'react'
import { useApp } from '../App'
import { claimDaily } from '../api'

function formatBal(b) { return (Number(b) || 0).toLocaleString() }

export default function Daily() {
  const { user, setUser } = useApp()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleClaim = async () => {
    setLoading(true)
    try {
      const res = await claimDaily(user.telegramId)
      if (res.error === 'already_claimed') {
        setResult({type:'wait',hours:res.hours,mins:res.mins})
      } else {
        setUser(prev => ({ ...prev, balance: res.newBalance, dailyStreak: res.streak }))
        setResult({type:'success',bonus:res.bonus})
      }
    } catch (e) {
      setResult({type:'error',text:e.message})
    }
    setLoading(false)
  }

  return (
    <div className="container">
      <h1 className="page-title">🎁 Daily Bonus</h1>

      <div className="card text-center">
        <div style={{fontSize:64,marginBottom:12}}>🎁</div>
        <h3 style={{color:'#fff',marginBottom:8}}>Daily Reward</h3>
        <p className="text-sm text-muted" style={{marginBottom:16}}>
          Come back every day to claim your bonus!
          {user.dailyStreak > 0 && <><br/>🔥 Current streak: {user.dailyStreak} days</>}
        </p>

        <div className="grid-2" style={{marginBottom:16}}>
          <div className="card" style={{padding:12,textAlign:'center',margin:0}}>
            <div className="card-header">Base Bonus</div>
            <div className="card-value green" style={{fontSize:20}}>80</div>
          </div>
          <div className="card" style={{padding:12,textAlign:'center',margin:0}}>
            <div className="card-header">Streak Bonus</div>
            <div className="card-value" style={{fontSize:20,color:'#6bb5ff'}}>
              {user.dailyStreak >= 7 ? 150 : user.dailyStreak >= 3 ? 50 : 0}
            </div>
          </div>
        </div>

        {!result && (
          <button className="btn btn-gold" onClick={handleClaim} disabled={loading}>
            {loading ? 'Claiming...' : '🎁 Claim Daily Bonus'}
          </button>
        )}

        {result?.type === 'success' && (
          <div>
            <div className="card" style={{borderColor:'#64ffda',padding:12,marginBottom:12}}>
              <div className="text-green font-bold" style={{fontSize:16,marginBottom:8}}>
                ✅ +{result.bonus.total} coins claimed!
              </div>
              <div className="text-sm text-muted">
                Base: +{result.bonus.base} | Streak: +{result.bonus.streakBonus} | Total: +{result.bonus.total}
                {result.bonus.isVip ? ' (VIP x2)' : ''}
              </div>
            </div>
            <div className="text-sm text-muted">New Balance: {formatBal(user.balance)} coins</div>
          </div>
        )}

        {result?.type === 'wait' && (
          <div className="card" style={{borderColor:'#ffd700',padding:12}}>
            <div className="text-gold font-bold" style={{marginBottom:4}}>⏳ Already claimed today</div>
            <div className="text-sm text-muted">Come back in {result.hours}h {result.mins}m</div>
          </div>
        )}

        {result?.type === 'error' && (
          <div className="card" style={{borderColor:'#ff6b6b',padding:12}}>
            <div className="text-red">❌ {result.text}</div>
          </div>
        )}
      </div>
    </div>
  )
}
