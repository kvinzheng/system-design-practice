import { createFileRoute } from '@tanstack/react-router'
import Hero from '../components/Hero'
import MovieList from '../components/MovieList'
import MovieCard from '../components/MovieCard'
import { createServerFn } from '@tanstack/react-start';
import { useState, useRef } from 'react'
import type { Movie } from '../types';

// SSR: Fetch all movie rows on server for instant render
const getHomepageRows = createServerFn()
.handler(async () => {
  const API_BASE = 'http://localhost:3001';
  
  // 1. Fetch IDs from all 3 category endpoints in parallel
  const [trendingRes, newReleasesRes, actionRes] = await Promise.all([
    fetch(`${API_BASE}/api/movies/trending?page=1`),
    fetch(`${API_BASE}/api/movies/new-releases?page=1`),
    fetch(`${API_BASE}/api/movies/action?page=1`),
  ]);
  
  const [trendingData, newReleasesData, actionData] = await Promise.all([
    trendingRes.json(),
    newReleasesRes.json(),
    actionRes.json(),
  ]);

  // 2. Collect unique IDs
  const trendingIds: number[] = trendingData.ids || [];
  const newReleasesIds: number[] = newReleasesData.ids || [];
  const actionIds: number[] = actionData.ids || [];
  const allIds = [...new Set([...trendingIds, ...newReleasesIds, ...actionIds])];

  // 3. Batch fetch all movie details
  const batchRes = await fetch(`${API_BASE}/api/movies/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: allIds }),
  });
  const batchData = await batchRes.json();
  const moviesById = new Map<number, Movie>();
  for (const movie of batchData.results || []) {
    moviesById.set(movie.id, movie);
  }

  // 4. Distribute movies to each row
  return {
    trending: {
      movies: trendingIds.map(id => moviesById.get(id)).filter((m): m is Movie => !!m),
      page: trendingData.page,
      totalPages: trendingData.totalPages,
    },
    newReleases: {
      movies: newReleasesIds.map(id => moviesById.get(id)).filter((m): m is Movie => !!m),
      page: newReleasesData.page,
      totalPages: newReleasesData.totalPages,
    },
    action: {
      movies: actionIds.map(id => moviesById.get(id)).filter((m): m is Movie => !!m),
      page: actionData.page,
      totalPages: actionData.totalPages,
    },
  };
});

export const Route = createFileRoute('/')({
  loader: async () => {
    try {
      // SSR: Fetch all rows on server
      const rows = await getHomepageRows();
      return {
        ...rows,
        error: null
      }
    } catch (error) {
      console.error('Error fetching homepage rows:', error);
      return {
        trending: { movies: [], page: 1, totalPages: 1 },
        newReleases: { movies: [], page: 1, totalPages: 1 },
        action: { movies: [], page: 1, totalPages: 1 },
        error: (error as Error).message
      }
    }
  },
  component: App
})

function App() {
  const loaderData = Route.useLoaderData()
  const { error, trending: ssrTrending, newReleases: ssrNewReleases, action: ssrAction } = loaderData;
  const [isLoadingMoreTrending, setIsLoadingMoreTrending] = useState(false);
  const [isLoadingMoreNewReleases, setIsLoadingMoreNewReleases] = useState(false);
  const [isLoadingMoreAction, setIsLoadingMoreAction] = useState(false);
  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Error Loading Movies</h1>
        <p className="text-red-500">{error}</p>
      </div>
    </div>
  }
  // SSR: Initialize state with server-rendered data
  // Paginated fetching for Trending Now row
  const [trending, setTrending] = useState<Movie[]>(ssrTrending.movies);
  const [trendingPage, setTrendingPage] = useState(ssrTrending.page);
  const [hasMoreTrending, setHasMoreTrending] = useState(ssrTrending.page < ssrTrending.totalPages);
  const trendingRowRef = useRef<HTMLDivElement | null>(null);
  // State for New Releases row
  const [row2, setRow2] = useState<Movie[]>(ssrNewReleases.movies);
  const [row2Page, setRow2Page] = useState(ssrNewReleases.page);
  const [hasMoreNewReleases, setHasMoreNewReleases] = useState(ssrNewReleases.page < ssrNewReleases.totalPages);
  const newReleasesRowRef = useRef<HTMLDivElement | null>(null);
  // State for Action row
  const [row3, setRow3] = useState<Movie[]>(ssrAction.movies);
  const [row3Page, setRow3Page] = useState(ssrAction.page);
  const [hasMoreAction, setHasMoreAction] = useState(ssrAction.page < ssrAction.totalPages);
  const actionRowRef = useRef<HTMLDivElement | null>(null);
  // State for trendingMinimal demo (initialized from SSR)
  const trendingMinimal = ssrTrending.movies.map(m => ({ id: m.id, title: m.title, posterUrl: m.posterUrl || '' }));

  // Load more for trending row (client-side pagination)
  const loadMoreTrending = async () => {
    if (isLoadingMoreTrending || !hasMoreTrending) return;
    setIsLoadingMoreTrending(true);
    try {
      const nextPage = trendingPage + 1;
      const res = await fetch(`http://localhost:3001/api/movies/trending?page=${nextPage}`);
      const data = await res.json();
      const ids: number[] = data.ids || [];
      
      // Batch fetch movie details
      const batchRes = await fetch('http://localhost:3001/api/movies/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const batchData = await batchRes.json();
      const moviesById = new Map<number, Movie>();
      for (const movie of batchData.results || []) {
        moviesById.set(movie.id, movie);
      }
      const newMovies = ids.map(id => moviesById.get(id)).filter((m): m is Movie => !!m);
      
      setTrending(prev => deduplicateMovies([...prev, ...newMovies]));
      setTrendingPage(data.page);
      setHasMoreTrending(data.page < data.totalPages);
    } finally {
      setIsLoadingMoreTrending(false);
    }
  };

  // Load more for new releases row
  const loadMoreNewReleases = async () => {
    if (isLoadingMoreNewReleases || !hasMoreNewReleases) return;
    setIsLoadingMoreNewReleases(true);
    try {
      const nextPage = row2Page + 1;
      const res = await fetch(`http://localhost:3001/api/movies/new-releases?page=${nextPage}`);
      const data = await res.json();
      const ids: number[] = data.ids || [];
      
      // Batch fetch movie details
      const batchRes = await fetch('http://localhost:3001/api/movies/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const batchData = await batchRes.json();
      const moviesById = new Map<number, Movie>();
      for (const movie of batchData.results || []) {
        moviesById.set(movie.id, movie);
      }
      const newMovies = ids.map(id => moviesById.get(id)).filter((m): m is Movie => !!m);
      
      setRow2(prev => deduplicateMovies([...prev, ...newMovies]));
      setRow2Page(data.page);
      setHasMoreNewReleases(data.page < data.totalPages);
    } finally {
      setIsLoadingMoreNewReleases(false);
    }
  };

  // Load more for action row
  const loadMoreAction = async () => {
    if (isLoadingMoreAction || !hasMoreAction) return;
    setIsLoadingMoreAction(true);
    try {
      const nextPage = row3Page + 1;
      const res = await fetch(`http://localhost:3001/api/movies/action?page=${nextPage}`);
      const data = await res.json();
      const ids: number[] = data.ids || [];
      
      // Batch fetch movie details
      const batchRes = await fetch('http://localhost:3001/api/movies/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const batchData = await batchRes.json();
      const moviesById = new Map<number, Movie>();
      for (const movie of batchData.results || []) {
        moviesById.set(movie.id, movie);
      }
      const newMovies = ids.map(id => moviesById.get(id)).filter((m): m is Movie => !!m);
      
      setRow3(prev => deduplicateMovies([...prev, ...newMovies]));
      setRow3Page(data.page);
      setHasMoreAction(data.page < data.totalPages);
    } finally {
      setIsLoadingMoreAction(false);
    }
  };

  // --- Demo: trendingMinimal is derived from SSR data ---

  // --- Add Movie Example ---
  const addMovie = async () => {
    const res = await fetch('http://localhost:3001/api/movies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: "New Movie", posterUrl: "", list: "trending" }),
    });
    const data = await res.json();
    if (data.id) {
      setTrending((prev) => [...prev, data]);
    }
  };
  console.log('hasMoreTrending',hasMoreTrending)
  return (
    <main>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        <Hero />
        <div className='container px-6'>
          <button
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={addMovie}
          >
            Add Random Movie to Trending
          </button>
          <div className="py-8">
            <h3 className="font-medium lg:text-2xl sm:text-xl px-4">Trending Now</h3>
            <div className="my-4 relative" style={{ overflow: 'visible' }} ref={trendingRowRef}>
              <div className="relative">
                <div
                  className="overflow-x-auto overflow-y-visible flex gap-6 pr-24 py-8"
                  style={{ scrollBehavior: 'smooth', pointerEvents: 'auto' }}
                >
                  {trending.map((movie) => (
                    <li key={movie.id} data-movie-id={movie.id} data-row-type="trending" className="flex-shrink-0 w-32 md:w-48 list-none">
                      <MovieCard movie={movie} />
                    </li>
                  ))}
                </div>
                <button
                  className="absolute top-1/2 right-0 -translate-y-1/2 bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-2xl border-4 border-white hover:bg-blue-700 z-[100]"
                  style={{ background: '#2563eb', boxShadow: '0 4px 24px 4px rgba(0,0,0,0.25)', pointerEvents: 'auto' }}
                  onClick={() => {
                    if (hasMoreTrending) {
                      loadMoreTrending();
                    } else {
                      const el = document.querySelector('.trending-scroll');
                      if (el) {
                        el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
                      }
                    }
                  }}
                  aria-label="Load more trending movies"
                >
                  {isLoadingMoreTrending ? (
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                  ) : (
                    <span className="text-xl">→</span>
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="py-8">
            <h3 className="font-medium lg:text-2xl sm:text-xl px-4">New Releases</h3>
            <div className="my-4 relative" style={{ overflow: 'visible' }} ref={newReleasesRowRef}>
              <div className="relative">
                <div
                  className="overflow-x-auto overflow-y-visible flex gap-6 pr-24 new-releases-scroll"
                  style={{ scrollBehavior: 'smooth', pointerEvents: 'auto' }}
                >
                  <MovieList
                    movies={row2}
                    onEndReached={loadMoreNewReleases}
                    isLoading={isLoadingMoreNewReleases}
                    hasMore={hasMoreNewReleases}
                    rowType="newReleases"
                  />
                </div>
                <button
                  className="absolute top-1/2 right-0 -translate-y-1/2 bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-2xl border-4 border-white hover:bg-blue-700 z-[100]"
                  style={{ background: '#2563eb', boxShadow: '0 4px 24px 4px rgba(0,0,0,0.25)', pointerEvents: 'auto' }}
                  onClick={() => {
                    if (hasMoreNewReleases) {
                      loadMoreNewReleases();
                    } else {
                      const el = document.querySelector('.new-releases-scroll');
                      if (el) {
                        el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
                      }
                    }
                  }}
                  aria-label="Load more new releases"
                >
                  {isLoadingMoreNewReleases ? (
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                  ) : (
                    <span className="text-xl">→</span>
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="py-8">
            <h3 className="font-medium lg:text-2xl sm:text-xl px-4">Action & Adventure</h3>
            <div className="my-4 relative" style={{ overflow: 'visible' }} ref={actionRowRef}>
              <div className="relative">
                <div
                  className="overflow-x-auto overflow-y-visible flex gap-6 pr-24 action-scroll"
                  style={{ scrollBehavior: 'smooth', pointerEvents: 'auto' }}
                >
                  <MovieList
                    movies={row3}
                    onEndReached={loadMoreAction}
                    isLoading={isLoadingMoreAction}
                    hasMore={hasMoreAction}
                    rowType="action"
                  />
                </div>
                <button
                  className="absolute top-1/2 right-0 -translate-y-1/2 bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-2xl border-4 border-white hover:bg-blue-700 z-[100]"
                  style={{ background: '#2563eb', boxShadow: '0 4px 24px 4px rgba(0,0,0,0.25)', pointerEvents: 'auto' }}
                  onClick={() => {
                    if (hasMoreAction) {
                      loadMoreAction();
                    } else {
                      const el = document.querySelector('.action-scroll');
                      if (el) {
                        el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
                      }
                    }
                  }}
                  aria-label="Load more action movies"
                >
                  {isLoadingMoreAction ? (
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                  ) : (
                    <span className="text-xl">→</span>
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="py-8">
            <h3 className="font-medium lg:text-2xl sm:text-xl px-4 text-green-700">Trending (Only Title & PosterUrl Fetched via GraphQL)</h3>
            <div className="my-4 flex gap-6 overflow-x-auto">
              {trendingMinimal.map((movie) => (
                <div key={movie.id} className="flex-shrink-0 w-32 md:w-48">
                  <img src={movie.posterUrl} alt={movie.title} className="w-full h-48 md:h-72 object-cover rounded-2xl" />
                  <div className="mt-2 text-center text-sm font-semibold">{movie.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Utility to deduplicate movies by id
function deduplicateMovies(movies: Movie[]): Movie[] {
  const seen = new Set<number>();
  return movies.filter(movie => {
    if (seen.has(movie.id)) return false;
    seen.add(movie.id);
    return true;
  });
}
