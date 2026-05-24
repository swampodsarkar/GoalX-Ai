const API = '/api/tma'

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export function auth(initData) {
  return request('/auth', { method: 'POST', body: JSON.stringify({ initData }) })
}

export function getUser(telegramId) {
  return request(`/user/${telegramId}`)
}

export function getMatches() {
  return request('/matches')
}

export function getMatchesByCompetition(code) {
  return request(`/matches/${code}`)
}

export function getMatch(id) {
  return request(`/match/${id}`)
}

export function getLeagues() {
  return request('/leagues')
}

export function placeBet(telegramId, matchId, prediction, stake, predictedScore) {
  return request('/bet', {
    method: 'POST',
    body: JSON.stringify({ telegramId, matchId, prediction, stake, predictedScore })
  })
}

export function getBets(telegramId) {
  return request(`/bets/${telegramId}`)
}

export function getLeaderboard() {
  return request('/leaderboard')
}

export function claimDaily(telegramId) {
  return request(`/daily/${telegramId}`, { method: 'POST' })
}

export function doSpin(telegramId) {
  return request(`/spin/${telegramId}`, { method: 'POST' })
}

export function getAiAnalysis(matchId, telegramId) {
  return request(`/ai-analysis/${matchId}/${telegramId}`)
}

export function getWinners() {
  return request('/winners')
}

export function getPayouts() {
  return request('/payouts')
}

export function requestDeposit(telegramId, amount) {
  return request('/deposit', { method: 'POST', body: JSON.stringify({ telegramId, amount }) })
}

export function confirmDeposit(telegramId, amount, txid) {
  return request('/deposit/confirm', { method: 'POST', body: JSON.stringify({ telegramId, amount, txid }) })
}

export function requestWithdraw(telegramId, amount) {
  return request('/withdraw', { method: 'POST', body: JSON.stringify({ telegramId, amount }) })
}

export function buyVip(telegramId) {
  return request('/vip/buy', { method: 'POST', body: JSON.stringify({ telegramId }) })
}
