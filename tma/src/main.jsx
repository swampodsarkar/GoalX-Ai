import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './App.css'

const tg = window.Telegram?.WebApp
if (tg) {
  tg.expand()
  tg.enableClosingConfirmation?.()
  tg.setHeaderColor?.('#0f0f1a')
  tg.setBackgroundColor?.('#0f0f1a')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/tma">
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
