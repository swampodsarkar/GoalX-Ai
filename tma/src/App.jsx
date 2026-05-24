import React, { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Wallet from './pages/Wallet'
import Matches from './pages/Matches'
import MatchDetail from './pages/MatchDetail'
import MyBets from './pages/MyBets'
import Profile from './pages/Profile'
import Leaderboard from './pages/Leaderboard'
import Referral from './pages/Referral'
import Daily from './pages/Daily'
import Spin from './pages/Spin'
import History from './pages/History'
import { auth } from './api'

export const AppContext = createContext()

export function useApp() {
  return useContext(AppContext)
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    const initData = tg?.initData || ''
    if (!initData) {
      const testUser = { telegramId: 123456789, username: 'TestUser', firstName: 'Test', balance: 5000, totalBets: 0, totalWins: 0, totalDeposited: 0, totalWon: 0, vip: false, vipExpiry: null, dailyStreak: 2, lastDailyClaim: Date.now() - 3600000, lastSpin: 0, referralEarnings: 0, referralCount: 0, level: { level: 1, title: 'Bronze', minBets: 0, maxBets: 50, bonusPercent: 0 }, banned: false, flagged: false, referralLink: '' }
      setUser(testUser)
      setLoading(false)
      return
    }
    auth(initData)
      .then(res => { setUser(res.user); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0f0f1a', color:'#ffd700' }}>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:48,marginBottom:16}}>⚽</div>
          <div>Loading...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0f0f1a', color:'#fff', padding:24 }}>
        <div style={{textAlign:'center', maxWidth:400}}>
          <div style={{fontSize:64,marginBottom:16}}>⚽</div>
          <h1 style={{color:'#ffd700',marginBottom:8}}>GoalX AI</h1>
          <p style={{color:'#8892b0',marginBottom:24}}>Open this app from Telegram to start betting on football matches!</p>
        </div>
      </div>
    )
  }

  return (
    <AppContext.Provider value={{ user, setUser, tg: window.Telegram?.WebApp }}>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/match/:id" element={<MatchDetail />} />
          <Route path="/my-bets" element={<MyBets />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/referral" element={<Referral />} />
          <Route path="/daily" element={<Daily />} />
          <Route path="/spin" element={<Spin />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </Layout>
    </AppContext.Provider>
  )
}
