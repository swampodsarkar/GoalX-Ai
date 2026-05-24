import React, { useState } from 'react'
import { useApp } from '../App'
import { requestDeposit, confirmDeposit, requestWithdraw } from '../api'

function formatBal(b) { return (Number(b) || 0).toLocaleString() }

export default function Wallet() {
  const { user, setUser } = useApp()
  const [tab, setTab] = useState('balance')
  const [amount, setAmount] = useState('')
  const [txid, setTxid] = useState('')
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleDeposit = async () => {
    const amt = parseInt(amount)
    if (!amt || amt < 100) { setMsg({type:'error',text:'Minimum 100 coins'}); return }
    setLoading(true)
    try {
      const res = await requestDeposit(user.telegramId, amt)
      setMsg({type:'success',text:`Send ${amt} BDT to ${res.method}: ${res.number}`})
    } catch (e) { setMsg({type:'error',text:e.message}) }
    setLoading(false)
  }

  const handleConfirmDeposit = async () => {
    const amt = parseInt(amount)
    if (!amt || !txid) { setMsg({type:'error',text:'Enter amount and TXID'}); return }
    setLoading(true)
    try {
      await confirmDeposit(user.telegramId, amt, txid)
      setMsg({type:'success',text:'Deposit submitted! Awaiting admin approval.'})
      setAmount(''); setTxid('')
    } catch (e) { setMsg({type:'error',text:e.message}) }
    setLoading(false)
  }

  const handleWithdraw = async () => {
    const amt = parseInt(amount)
    if (!amt || amt < 100) { setMsg({type:'error',text:'Minimum 100 coins'}); return }
    if (amt > user.balance) { setMsg({type:'error',text:'Insufficient balance'}); return }
    setLoading(true)
    try {
      const res = await requestWithdraw(user.telegramId, amt)
      setUser(prev => ({ ...prev, balance: res.newBalance }))
      setMsg({type:'success',text:'Withdraw submitted! Awaiting admin approval.'})
      setAmount('')
    } catch (e) { setMsg({type:'error',text:e.message}) }
    setLoading(false)
  }

  return (
    <div className="container">
      <h1 className="page-title">💰 Wallet</h1>

      <div className="card">
        <div className="card-header">Available Balance</div>
        <div className="card-value gold">{formatBal(user.balance)} coins</div>
        <div className="flex" style={{marginTop:8}}>
          <div className="text-sm text-muted">Deposited: {formatBal(user.totalDeposited)}</div>
          <div className="text-sm text-muted" style={{marginLeft:'auto'}}>Won: {formatBal(user.totalWon)}</div>
        </div>
      </div>

      <div className="flex" style={{marginBottom:16,gap:4}}>
        {['balance','deposit','withdraw'].map(t => (
          <button key={t} className={`btn btn-sm ${tab===t?'btn-gold':'btn-outline'}`}
            style={{textTransform:'capitalize'}} onClick={() => setTab(t)}>
            {t === 'balance' ? '📊' : t === 'deposit' ? '📥' : '📤'} {t}
          </button>
        ))}
      </div>

      {msg && (
        <div className="card" style={{borderColor: msg.type==='error' ? '#ff6b6b' : '#64ffda', padding:12, marginBottom:12}}>
          <div className="flex items-center" style={{gap:8}}>
            <span>{msg.type==='error'?'❌':'✅'}</span>
            <span style={{fontSize:13}}>{msg.text}</span>
          </div>
        </div>
      )}

      {tab === 'deposit' && (
        <div className="card">
          <h3 style={{color:'#fff',marginBottom:12}}>📥 Deposit Coins</h3>
          <input placeholder="Amount (min 100)" type="number" value={amount}
            onChange={e => setAmount(e.target.value)} style={{marginBottom:8}} />
          <input placeholder="Transaction ID (after payment)" value={txid}
            onChange={e => setTxid(e.target.value)} style={{marginBottom:12}} />
          <button className="btn btn-gold mb-4" onClick={handleDeposit} disabled={loading}>
            {loading ? 'Processing...' : '💳 Request Deposit'}
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleConfirmDeposit} disabled={loading}
            style={{fontSize:12}}>
            ✅ Confirm with TXID
          </button>
        </div>
      )}

      {tab === 'withdraw' && (
        <div className="card">
          <h3 style={{color:'#fff',marginBottom:12}}>📤 Withdraw Coins</h3>
          <p className="text-sm text-muted" style={{marginBottom:8}}>
            Balance: {formatBal(user.balance)} coins | Min: 100 coins
          </p>
          <input placeholder="Amount" type="number" value={amount}
            onChange={e => setAmount(e.target.value)} style={{marginBottom:12}} />
          <button className="btn btn-danger" onClick={handleWithdraw} disabled={loading}>
            {loading ? 'Processing...' : '📤 Request Withdraw'}
          </button>
        </div>
      )}

      {tab === 'balance' && (
        <div className="card">
          <h3 style={{color:'#fff',marginBottom:12}}>📊 Transaction History</h3>
          <p className="text-sm text-muted">Deposit and withdraw history is managed by admins. Check the bot for notifications.</p>
        </div>
      )}
    </div>
  )
}
