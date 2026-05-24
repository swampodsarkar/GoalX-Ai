$env:TELEGRAM_BOT_TOKEN='test_token'
$env:FOOTBALL_API_KEY='test'
Start-Process -WindowStyle Hidden -FilePath "node" -ArgumentList "server.js"
