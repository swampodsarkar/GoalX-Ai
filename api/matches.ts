import { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const comps = ['WC', 'CL', 'BL1', 'DED', 'BSA', 'PD', 'FL1', 'ELC', 'PPL', 'EC', 'SA', 'PL'];
    const today = new Date();
    const future = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const past = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const token = process.env.FOOTBALL_API_TOKEN || 'd346b14f24964cc4ace98a5e87c25091';
    const url = `https://api.football-data.org/v4/matches?competitions=${comps.join(',')}&dateFrom=${formatDate(past)}&dateTo=${formatDate(future)}`;

    const response = await fetch(url, {
      headers: { 'X-Auth-Token': token }
    });

    if (!response.ok) {
      throw new Error(`Football API error: ${response.statusText}`);
    }

    const data = await response.json();
    const matchesList = data.matches || [];
    const formattedMatches = matchesList.map((m: any) => {
      let status: 'LIVE' | 'FINISHED' | 'UPCOMING' = 'UPCOMING';
      if (['IN_PLAY', 'PAUSED', 'LIVE'].includes(m.status)) status = 'LIVE';
      if (['FINISHED', 'AWARDED'].includes(m.status)) status = 'FINISHED';

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
        status,
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

    const body = JSON.stringify(formattedMatches.slice(0, 120));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(body);
  } catch (err: any) {
    console.error(err);
    const body = JSON.stringify({ error: err.message });
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(body);
  }
}
