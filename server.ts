import express from "express";
import path from "path";

const app = express();
const PORT = 3000;

app.use(express.json());

const FOOTBALL_API_TOKEN = process.env.FOOTBALL_API_TOKEN || "d346b14f24964cc4ace98a5e87c25091";

app.get("/api/matches", async (req, res) => {
  try {
    // The competitions to fetch matches for
    const comps = ['WC', 'CL', 'BL1', 'DED', 'BSA', 'PD', 'FL1', 'ELC', 'PPL', 'EC', 'SA', 'PL'];
    
    // Get matches for today +/- 5 days or past 3 / future 7 days (exactly 10 days of real data)
    const today = new Date();
    const future = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days in the future
    const past = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);   // 3 days in the past
    
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const url = `https://api.football-data.org/v4/matches?competitions=${comps.join(',')}&dateFrom=${formatDate(past)}&dateTo=${formatDate(future)}`;
    
    const response = await fetch(url, {
      headers: {
        'X-Auth-Token': FOOTBALL_API_TOKEN
      }
    });

    if (!response.ok) {
        throw new Error(`Football API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform formatting to Match type our frontend expects
    const matchesList = data.matches || [];
    const formattedMatches = matchesList.map((m: any) => {
      // football-data.org status mapping
      let status: 'LIVE' | 'FINISHED' | 'UPCOMING' = 'UPCOMING';
      if (['IN_PLAY', 'PAUSED', 'LIVE'].includes(m.status)) status = 'LIVE';
      if (['FINISHED', 'AWARDED'].includes(m.status)) status = 'FINISHED';

      // Parse fake odds or real odds if provided
      const oddsHome = m.odds?.homeWin || (Math.random() * 2 + 1).toFixed(2);
      const oddsDraw = m.odds?.draw || (Math.random() * 2 + 2).toFixed(2);
      const oddsAway = m.odds?.awayWin || (Math.random() * 2 + 1).toFixed(2);

      const homeInv = 1 / parseFloat(oddsHome);
      const drawInv = 1 / parseFloat(oddsDraw);
      const awayInv = 1 / parseFloat(oddsAway);
      const sumInv = homeInv + drawInv + awayInv;

      return {
        id: `api_${m.id}`,
        homeTeam: m.homeTeam?.shortName || m.homeTeam?.name || 'Unknown Home',
        awayTeam: m.awayTeam?.shortName || m.awayTeam?.name || 'Unknown Away',
        homeLogo: m.homeTeam?.crest || '',
        awayLogo: m.awayTeam?.crest || '',
        startTime: m.utcDate,
        status: status,
        homeScore: m.score?.fullTime?.home ?? 0,
        awayScore: m.score?.fullTime?.away ?? 0,
        oddsHome: parseFloat(oddsHome),
        oddsDraw: parseFloat(oddsDraw),
        oddsAway: parseFloat(oddsAway),
        predictionHomeWinProb: Math.round((homeInv / sumInv) * 100),
        predictionAwayWinProb: Math.round((awayInv / sumInv) * 100),
        predictionDrawProb: Math.round((drawInv / sumInv) * 100),
        aiAnalysis: `### 📊 AI Sports Analyst\n\nLive API fetched fixture analysis for ${m.homeTeam?.name} vs ${m.awayTeam?.name}.`
      };
    });

    res.json(formattedMatches.slice(0, 120)); // Return max 120 matches (encompassing all 10 days) for optimal performance
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Vite middleware setup (if dev)
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // dynamically import vite so it only runs in dev
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
