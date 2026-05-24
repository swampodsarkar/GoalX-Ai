import React, { useState } from 'react'
import { useApp } from '../App'

function formatBal(b) { return (Number(b) || 0).toLocaleString() }

export default function Referral() {
  const { user } = useApp()
  const [copied, setCopied] = useState(false)
  const link = `https://t.me/${window.Telegram?.WebApp?.initDataUnsafe?.user?.username ? '' : 'betpredictorbot'}?start=ref_${user.telegramId}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      prompt('Copy this link:', link)
    }
  }

  return (
    <div className="container">
      <h1 className="page-title">🎁 Referral</h1>

      <div className="card text-center">
        <div style={{fontSize:48,marginBottom:12}}>🎁</div>
        <h3 style={{color:'#fff',marginBottom:8}}>Refer & Earn</h3>
        <p className="text-sm text-muted" style={{marginBottom:16}}>
          Invite friends and earn 500 coins for each referral!
        </p>
        <div className="grid-2" style={{marginBottom:16}}>
          <div className="card" style={{padding:12,textAlign:'center',margin:0}}>
            <div className="card-header">Earnings</div>
            <div className="card-value gold" style={{fontSize:20}}>{formatBal(user.referralEarnings)}</div>
          </div>
          <div className="card" style={{padding:12,textAlign:'center',margin:0}}>
            <div className="card-header">Friends</div>
            <div className="card-value" style={{fontSize:20}}>{user.referralCount || 0}</div>
          </div>
        </div>
        <div style={{background:'#0a0a1a',borderRadius:10,padding:12,marginBottom:12,wordBreak:'break-all',fontSize:12,color:'#8892b0'}}>
          {link}
        </div>
        <button className="btn btn-gold" onClick={handleCopy}>
          {copied ? '✅ Copied!' : '📋 Copy Link'}
        </button>
      </div>
    </div>
  )
}
