const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
const PORT = 3001;

// In-memory movie cache (keyed by ID)
const movieCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getFromCache(id) {
  const cached = movieCache.get(id);
  if (cached && Date.now() < cached.expires) {
    return cached.data;
  }
  movieCache.delete(id);
  return null;
}

function addToCache(movie) {
  movieCache.set(movie.id, {
    data: movie,
    expires: Date.now() + CACHE_TTL,
  });
}

// Movie data with full details
const trending = [
  { id: 1, title: "A", posterUrl: "https://image.tmdb.org/t/p/w500/8AQRfTuTHeFTddZN4IUAqprN8Od.jpg", description: "A thrilling adventure.", releaseDate: "2022-01-01", rating: 7.8, genres: ["Action", "Adventure"], director: "Jane Doe", cast: ["Actor 1", "Actor 2"], runtime: 120, language: "English" },
  { id: 2, title: "B", posterUrl: "https://image.tmdb.org/t/p/w500/6Lw54zxm6BAEKJeGlabyzzR5Juu.jpg", description: "A romantic comedy.", releaseDate: "2021-05-10", rating: 6.5, genres: ["Comedy", "Romance"], director: "John Smith", cast: ["Actor 3", "Actor 4"], runtime: 105, language: "English" },
  { id: 3, title: "C", posterUrl: "https://image.tmdb.org/t/p/w500/9OYu6oDLIidSOocW3JTGtd2Oyqy.jpg", description: "A sci-fi epic.", releaseDate: "2020-11-20", rating: 8.2, genres: ["Sci-Fi"], director: "Alice Lee", cast: ["Actor 5", "Actor 6"], runtime: 140, language: "English" },
  { id: 4, title: "D", posterUrl: "https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg", description: "A family drama.", releaseDate: "2019-07-15", rating: 7.0, genres: ["Drama"], director: "Bob Brown", cast: ["Actor 7", "Actor 8"], runtime: 110, language: "English" },
  { id: 5, title: "E", posterUrl: "https://image.tmdb.org/t/p/w500/2CAL2433ZeIihfX1Hb2139CX0pW.jpg", description: "A horror mystery.", releaseDate: "2018-10-31", rating: 6.9, genres: ["Horror", "Mystery"], director: "Carol White", cast: ["Actor 9", "Actor 10"], runtime: 98, language: "English" }
];

const newReleases = [
  { id: 3, title: "C", posterUrl: "https://image.tmdb.org/t/p/w500/9OYu6oDLIidSOocW3JTGtd2Oyqy.jpg", description: "A sci-fi epic.", releaseDate: "2020-11-20", rating: 8.2, genres: ["Sci-Fi"], director: "Alice Lee", cast: ["Actor 5", "Actor 6"], runtime: 140, language: "English" },
  { id: 4, title: "D", posterUrl: "https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg", description: "A family drama.", releaseDate: "2019-07-15", rating: 7.0, genres: ["Drama"], director: "Bob Brown", cast: ["Actor 7", "Actor 8"], runtime: 110, language: "English" },
  { id: 5, title: "E", posterUrl: "https://image.tmdb.org/t/p/w500/2CAL2433ZeIihfX1Hb2139CX0pW.jpg", description: "A horror mystery.", releaseDate: "2018-10-31", rating: 6.9, genres: ["Horror", "Mystery"], director: "Carol White", cast: ["Actor 9", "Actor 10"], runtime: 98, language: "English" },
  { id: 6, title: "F", posterUrl: "https://image.tmdb.org/t/p/w500/ynXoOxmDHNQ4UAy0oU6avW71HVW.jpg", description: "A fantasy adventure.", releaseDate: "2017-03-10", rating: 7.5, genres: ["Fantasy", "Adventure"], director: "David Green", cast: ["Actor 11", "Actor 12"], runtime: 130, language: "English" },
  { id: 7, title: "G", posterUrl: "https://image.tmdb.org/t/p/w500/5KCVkau1HEl7ZzfPsKAPM0sMiKc.jpg", description: "A historical drama.", releaseDate: "2016-09-20", rating: 7.3, genres: ["Drama", "History"], director: "Eve Black", cast: ["Actor 13", "Actor 14"], runtime: 120, language: "English" }
];

const action = [
  { id: 2, title: "B", posterUrl: "https://image.tmdb.org/t/p/w500/6Lw54zxm6BAEKJeGlabyzzR5Juu.jpg", description: "A romantic comedy.", releaseDate: "2021-05-10", rating: 6.5, genres: ["Comedy", "Romance"], director: "John Smith", cast: ["Actor 3", "Actor 4"], runtime: 105, language: "English" },
  { id: 5, title: "E", posterUrl: "https://image.tmdb.org/t/p/w500/2CAL2433ZeIihfX1Hb2139CX0pW.jpg", description: "A horror mystery.", releaseDate: "2018-10-31", rating: 6.9, genres: ["Horror", "Mystery"], director: "Carol White", cast: ["Actor 9", "Actor 10"], runtime: 98, language: "English" },
  { id: 7, title: "G", posterUrl: "https://image.tmdb.org/t/p/w500/5KCVkau1HEl7ZzfPsKAPM0sMiKc.jpg", description: "A historical drama.", releaseDate: "2016-09-20", rating: 7.3, genres: ["Drama", "History"], director: "Eve Black", cast: ["Actor 13", "Actor 14"], runtime: 120, language: "English" },
  { id: 8, title: "H", posterUrl: "https://image.tmdb.org/t/p/w500/6aUWe0GSl69wMTSWWexsorMIvwU.jpg", description: "A family drama.", releaseDate: "2019-07-15", rating: 7.0, genres: ["Drama"], director: "Bob Brown", cast: ["Actor 7", "Actor 8"], runtime: 110, language: "English" },
  { id: 9, title: "I", posterUrl: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg", description: "A thrilling adventure.", releaseDate: "2022-01-01", rating: 7.8, genres: ["Action", "Adventure"], director: "Jane Doe", cast: ["Actor 1", "Actor 2"], runtime: 120, language: "English" }
];

// Helper: paginate array (returns minimal movie data: id, title, posterUrl)
function paginate(array, page = 1, pageSize = 5) {
  const totalPages = Math.ceil(array.length / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    movies: array.slice(start, end).map(m => ({
      id: m.id,
      title: m.title,
      posterUrl: m.posterUrl,
    })),
    page,
    totalPages,
  };
}

// REST Endpoints

// GET /api/movies/trending?page=1
app.get('/api/movies/trending', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
  res.json(paginate(trending, page));
});

// GET /api/movies/new-releases?page=1
app.get('/api/movies/new-releases', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
  res.json(paginate(newReleases, page));
});

// GET /api/movies/action?page=1
app.get('/api/movies/action', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
  res.json(paginate(action, page));
});

// GET /api/movies/:id - Get single movie by ID
app.get('/api/movies/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  // Check cache first
  const cached = getFromCache(id);
  if (cached) {
    res.set('Cache-Control', 'public, max-age=300');
    return res.json(cached);
  }
  
  const allMovies = [...trending, ...newReleases, ...action];
  const movie = allMovies.find(m => m.id === id);
  if (movie) {
    addToCache(movie);
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    res.json(movie);
  } else {
    res.status(404).json({ error: 'Movie not found' });
  }
});

// POST /api/movies/batch - Batch get movies by IDs
app.post('/api/movies/batch', (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: 'ids array required' });
  }
  
  const results = [];
  const uncachedIds = [];
  
  // Check cache for each ID
  for (const id of ids) {
    const numId = parseInt(id);
    const cached = getFromCache(numId);
    if (cached) {
      results.push(cached);
    } else {
      uncachedIds.push(numId);
    }
  }
  
  // Fetch uncached movies from data source
  if (uncachedIds.length > 0) {
    const allMovies = [...trending, ...newReleases, ...action];
    const uniqueMovies = Array.from(new Map(allMovies.map(m => [m.id, m])).values());
    const fetched = uniqueMovies.filter(m => uncachedIds.includes(m.id));
    
    // Add to cache and results
    for (const movie of fetched) {
      addToCache(movie);
      results.push(movie);
    }
  }
  
  res.json({ results });
});

// POST /api/movies - Add a new movie
let nextId = 10;
app.post('/api/movies', (req, res) => {
  const { title, posterUrl, list } = req.body;
  const newMovie = {
    id: nextId++,
    title,
    posterUrl: posterUrl || 'https://image.tmdb.org/t/p/w500/default.jpg',
    description: 'No description provided.',
    releaseDate: new Date().toISOString().split('T')[0],
    rating: 7.0,
    genres: ['Drama'],
    director: 'Unknown',
    cast: ['Unknown'],
    runtime: 120,
    language: 'English',
  };
  if (list === 'trending') trending.push(newMovie);
  else if (list === 'newReleases') newReleases.push(newMovie);
  else if (list === 'action') action.push(newMovie);
  res.status(201).json(newMovie);
});

app.listen(PORT, () => {
  console.log(`REST API server running at http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  GET  /api/movies/trending?page=1');
  console.log('  GET  /api/movies/new-releases?page=1');
  console.log('  GET  /api/movies/action?page=1');
  console.log('  GET  /api/movies/:id');
  console.log('  POST /api/movies/batch  { ids: [1,2,3] }');
  console.log('  POST /api/movies  { title, posterUrl, list }');
});
