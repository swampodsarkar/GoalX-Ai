import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../App'

const navItems = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/matches', label: 'Matches', icon: '⚽' },
  { path: '/my-bets', label: 'My Bets', icon: '📋' },
  { path: '/wallet', label: 'Wallet', icon: '💰' },
  { path: '/profile', label: 'Profile', icon: '👤' },
]

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useApp()
  const isDark = true

  return (
    <div style={{ background:'#0f0f1a', minHeight:'100vh' }}>
      <div className="page">
        {children}
      </div>
      <nav className="nav-bar">
        {navItems.map(item => (
          <button
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
