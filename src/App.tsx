import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Wallet from './pages/Wallet';
import Matches from './pages/Matches';
import MatchDetail from './pages/MatchDetail';
import MyBets from './pages/MyBets';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Referral from './pages/Referral';
import Daily from './pages/Daily';
import Spin from './pages/Spin';
import GlobalHistory from './pages/History';

export default function App() {
  return (
    <AppProvider>
      <Router>
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
            <Route path="/history" element={<GlobalHistory />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}
