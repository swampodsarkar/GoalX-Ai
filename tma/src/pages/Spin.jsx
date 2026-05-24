import React, { useState } from 'react'
import { useApp } from '../App'
import { doSpin } from '../api'

function formatBal(b) { return (Number(b) || 0).toLocaleString() }

export default function Spin() {
  const { user, setUser } = useApp()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [spinning, setSpinning] = useState(false)

  const handleSpin = async () => {
    setSpinning(true)
    setLoading(true)
    setTimeout(async () => {
      try {
        const res = await doSpin(user.telegramId)
        if (res.error === 'already_spun') {
          setResult({type:'wait',hours:res.hours})
        } else {
          setUser(prev => ({ ...prev, balance: res.newBalance }))
          setResult({type:'success',prize:res.prize,emoji:res.emoji})
        }
      } catch (e) {
        setResult({type:'error',text:e.message})
      }
      setLoading(false)
      setSpinning(false)
    }, 1500)
  }

  return (
    <div className="container">
      <h1 className="page-title">🎰 Lucky Spin</h1>

      <div className="card text-center">
        <div style={{
          fontSize: spinning ? 72 : 64,
          marginBottom: 12,
          transition: 'transform 0.1s',
          transform: spinning ? 'rotate(720deg)' : 'rotate(0deg)',
          animation: spinning ? 'none' : undefined
        }}>
          🎰
        </div>

        <h3 style={{color:'#fff',marginBottom:8}}>Daily Lucky Spin</h3>
        <p className="text-sm text-muted" style={{marginBottom:16}}>
          Spin the wheel and win up to 5,000 coins!
        </p>

        <div className="grid-3" style={{marginBottom:16}}>
          <div style={{textAlign:'center'}}>
            <div className="text-sm">🪙</div>
            <div className="text-xs text-muted">10-50</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div className="text-sm">💰</div>
            <div className="text-xs text-muted">100-200</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div className="text-sm">💎</div>
            <div className="text-xs text-muted">500+</div>
          </div>
        </div>

        {!result && (
          <button className="btn btn-gold" onClick={handleSpin} disabled={loading} style={{fontSize:18,padding:'16px 32px'}}>
            {spinning ? '🎰 Spinning...' : '🎰 SPIN!'}
          </button>
        )}

        {result?.type === 'success' && (
          <div>
            <div className="card" style={{borderColor:'#ffd700',padding:16,marginBottom:12}}>
              <div style={{fontSize:48,marginBottom:8}}>{result.emoji}</div>
              <div className="text-gold font-bold" style={{fontSize:20,marginBottom:4}}>
                +{result.prize} coins!
              </div>
              {result.prize >= 5000 && (
                <div style={{fontSize:16,color:'#ff6b6b',fontWeight:700}}>🎉 JACKPOT! 🎉</div>
              )}
            </div>
            <div className="text-sm text-muted">New Balance: {formatBal(user.balance)} coins</div>
            <button className="btn btn-outline mt-4" onClick={() => setResult(null)}>
              🔄 Spin Again
            </button>
          </div>
        )}

        {result?.type === 'wait' && (
          <div className="card" style={{borderColor:'#ffd700',padding:12}}>
            <div className="text-gold font-bold" style={{marginBottom:4}}>⏳ Already spun today</div>
            <div className="text-sm text-muted">Come back in {result.hours}h</div>
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
