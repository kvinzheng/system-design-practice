
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

app.use(cors());

// Example data sources (replace with real DB/API calls)
const trending = [
  { id: 1, title: "A", posterUrl: "https://image.tmdb.org/t/p/w500/8AQRfTuTHeFTddZN4IUAqprN8Od.jpg" },
  { id: 2, title: "B", posterUrl: "https://image.tmdb.org/t/p/w500/6Lw54zxm6BAEKJeGlabyzzR5Juu.jpg" },
  { id: 3, title: "C", posterUrl: "https://image.tmdb.org/t/p/w500/9OYu6oDLIidSOocW3JTGtd2Oyqy.jpg" },
  { id: 4, title: "D", posterUrl: "https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg" },
  { id: 5, title: "E", posterUrl: "https://image.tmdb.org/t/p/w500/2CAL2433ZeIihfX1Hb2139CX0pW.jpg" }
];
const newReleases = [
  { id: 3, title: "C", posterUrl: "https://image.tmdb.org/t/p/w500/9OYu6oDLIidSOocW3JTGtd2Oyqy.jpg" },
  { id: 4, title: "D", posterUrl: "https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg" },
  { id: 5, title: "E", posterUrl: "https://image.tmdb.org/t/p/w500/2CAL2433ZeIihfX1Hb2139CX0pW.jpg" },
  { id: 6, title: "F", posterUrl: "https://image.tmdb.org/t/p/w500/ynXoOxmDHNQ4UAy0oU6avW71HVW.jpg" },
  { id: 7, title: "G", posterUrl: "https://image.tmdb.org/t/p/w500/5KCVkau1HEl7ZzfPsKAPM0sMiKc.jpg" }
];
const action = [
  { id: 2, title: "B", posterUrl: "https://image.tmdb.org/t/p/w500/6Lw54zxm6BAEKJeGlabyzzR5Juu.jpg" },
  { id: 5, title: "E", posterUrl: "https://image.tmdb.org/t/p/w500/2CAL2433ZeIihfX1Hb2139CX0pW.jpg" },
  { id: 7, title: "G", posterUrl: "https://image.tmdb.org/t/p/w500/5KCVkau1HEl7ZzfPsKAPM0sMiKc.jpg" },
  { id: 8, title: "H", posterUrl: "https://image.tmdb.org/t/p/w500/6aUWe0GSl69wMTSWWexsorMIvwU.jpg" },
  { id: 9, title: "I", posterUrl: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg" }
];

// Deduplication helper
function dedupe(list, usedIds) {
  return list.filter(movie => {
    if (usedIds.has(movie.id)) return false;
    usedIds.add(movie.id);
    return true;
  });
}

app.get('/api/homepage', (req, res) => {
  const usedIds = new Set();
  const trendingRow = dedupe(trending, usedIds);
  const newReleasesRow = dedupe(newReleases, usedIds);
  const actionRow = dedupe(action, usedIds);

  res.json({
    trending: trendingRow,
    newReleases: newReleasesRow,
    action: actionRow
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
