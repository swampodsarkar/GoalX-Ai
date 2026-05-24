import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { getMatch, placeBet, getAiAnalysis } from '../api'

function formatBal(b) { return (Number(b) || 0).toLocaleString() }

export default function MatchDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, setUser } = useApp()
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [prediction, setPrediction] = useState(null)
  const [stake, setStake] = useState('')
  const [predictedScore, setPredictedScore] = useState('')
  const [placing, setPlacing] = useState(false)
  const [result, setResult] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  useEffect(() => {
    getMatch(id).then(m => {
      setMatch(m)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const handlePlaceBet = async () => {
    const s = parseInt(stake)
    if (!prediction) { setResult({type:'error',text:'Select a prediction'}); return }
    if (!s || s < 10) { setResult({type:'error',text:'Minimum stake: 10 coins'}); return }
    if (s > user.balance) { setResult({type:'error',text:'Insufficient balance'}); return }
    setPlacing(true)
    try {
      const bet = await placeBet(user.telegramId, id, prediction, s, predictedScore || null)
      setUser(prev => ({ ...prev, balance: prev.balance - s }))
      setResult({type:'success',text:`Bet placed! ${match.homeTeam} vs ${match.awayTeam} → ${prediction} | ${s} coins`})
      setStake(''); setPrediction(null); setPredictedScore('')
    } catch (e) { setResult({type:'error',text:e.message}) }
    setPlacing(false)
  }

  const handleAiAnalysis = async () => {
    setAnalysisLoading(true)
    try {
      const res = await getAiAnalysis(id, user.telegramId)
      setAnalysis(res.analysis)
    } catch (e) { setResult({type:'error',text:e.message}) }
    setAnalysisLoading(false)
  }

  if (loading) return <div className="container"><div className="loading">Loading match...</div></div>
  if (!match) return <div className="container"><div className="card text-center"><p className="text-muted">Match not found</p></div></div>

  const scoreStr = match.score ? `${match.score.home || 0} - ${match.score.away || 0}` : null
  const dateStr = new Date(match.utcDate).toLocaleString('en-US', { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })

  return (
    <div className="container">
      <div className="card text-center">
        {match.homeCrest && <img src={match.homeCrest} alt="" style={{width:40,height:40}} />}
        <div style={{fontSize:18,fontWeight:700,color:'#fff',margin:'8px 0'}}>
          {match.homeTeam} vs {match.awayTeam}
        </div>
        {match.awayCrest && <img src={match.awayCrest} alt="" style={{width:40,height:40}} />}
        <div className="text-sm text-muted" style={{marginTop:4}}>
          {match.competition} • {dateStr}
        </div>
        {scoreStr && <div style={{fontSize:32,fontWeight:700,color:'#ffd700',margin:'12px 0'}}>{scoreStr}</div>}
        <div style={{marginTop:8}}>
          {match.live ? <span className="badge live">🔴 LIVE</span>
            : match.canBet ? <span className="badge upcoming">Bet Open</span>
            : <span className="badge closed">Bet Closed</span>}
        </div>
      </div>

      {result && (
        <div className="card" style={{borderColor:result.type==='error'?'#ff6b6b':'#64ffda',padding:12,marginBottom:12}}>
          <div className="flex items-center" style={{gap:8}}>
            <span>{result.type==='error'?'❌':'✅'}</span>
            <span style={{fontSize:13}}>{result.text}</span>
          </div>
        </div>
      )}

      {match.canBet && (
        <div className="card">
          <h3 style={{color:'#fff',marginBottom:12}}>🎯 Place Bet</h3>
          <div className="grid-3" style={{marginBottom:12}}>
            {['HOME','DRAW','AWAY'].map(p => (
              <div key={p} className={`bet-option ${prediction===p?'selected':''}`}
                onClick={() => setPrediction(p)}>
                <div style={{fontSize:16}}>
                  {p === 'HOME' ? '🏠' : p === 'AWAY' ? '✈️' : '🤝'}
                </div>
                <div style={{fontSize:13,marginTop:4}}>
                  {p === 'HOME' ? match.homeTeam : p === 'AWAY' ? match.awayTeam : 'DRAW'}
                </div>
                <div className="odds">{p === 'HOME' || p === 'AWAY' ? '1.9x' : '1.9x'}</div>
              </div>
            ))}
          </div>

          <div style={{marginBottom:8}}>
            <input placeholder="Stake (min 10)" type="number" value={stake}
              onChange={e => setStake(e.target.value)} />
          </div>
          <div style={{marginBottom:12}}>
            <input placeholder="Exact Score (optional, e.g. 2-1)" value={predictedScore}
              onChange={e => setPredictedScore(e.target.value)} />
          </div>

          <div className="flex flex-between text-sm text-muted" style={{marginBottom:12}}>
            <span>Balance: {formatBal(user.balance)} coins</span>
            {prediction && stake && <span>Payout: {parseInt(stake)*1.9} coins{!predictedScore?'':' / 3.5x exact'}</span>}
          </div>

          <button className="btn btn-gold" onClick={handlePlaceBet} disabled={placing || !prediction}>
            {placing ? 'Placing...' : '✅ Place Bet'}
          </button>

          {user.vip && (
            <button className="btn btn-outline mt-4" onClick={handleAiAnalysis} disabled={analysisLoading}>
              {analysisLoading ? 'Analyzing...' : '🤖 AI Analysis'}
            </button>
          )}

          {analysis && (
            <div style={{marginTop:12,padding:12,background:'rgba(255,215,0,0.05)',borderRadius:12,fontSize:13,whiteSpace:'pre-wrap'}}>
              {analysis}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h3 style={{color:'#fff',marginBottom:8}}>📋 Match Info</h3>
        <div className="text-sm text-muted">
          <div>Stage: {match.stage || 'Regular'}</div>
          <div>Venue: {match.venue || 'TBD'}</div>
          <div>Status: {match.status}</div>
        </div>
      </div>
    </div>
  )
}
