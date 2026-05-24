require('dotenv').config();

const express = require('express');
const { initFirebase } = require('./config/firebase');
const { loadConfig } = require('./config/appConfig');
const tmaRoutes = require('./routes/tmaApi');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api/tma', tmaRoutes);

app.use(express.static('public'));
app.use('/tma', express.static('public/tma'));
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/public/tma/index.html');
});

initFirebase();
loadConfig().catch(() => {});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err?.message || err);
});

app.listen(PORT, () => {
  console.log('GoalX AI server running on port ' + PORT);
  console.log('Telegram Mini App: http://localhost:' + PORT + '/tma/');
  console.log('API: http://localhost:' + PORT + '/api/tma/');
});

process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});
