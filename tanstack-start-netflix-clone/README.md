# Reactflix - System Design Document

A Netflix-inspired streaming interface for mock interview preparation.

---

## 1. Functional Requirements

### Core Features
| Feature | Description |
|---------|-------------|
| **Browse Movies** | Users can browse movies organized by category rows (Trending, New Releases, Action) |
| **Lazy Loading Rows** | Movie rows load data only when scrolled into viewport |
| **Movie Hover Preview** | Hovering on a movie card shows expanded details (rating, genres, description) |
| **Horizontal Pagination** | Each row has right/left arrows to navigate and fetch next page of movies |
| **Search** | Users can search for movies by title |
| **Watch Movie** | Users can navigate to watch a specific movie |

### User Stories
1. As a user, I want to see trending movies when I load the homepage
2. As a user, I want movie details to appear instantly when I hover over a card
3. As a user, I want to click arrow buttons to navigate and load more movies in a row
4. As a user, I want rows below the fold to load only when I scroll down (saves bandwidth)

---

## 2. Non-Functional Requirements

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **Latency** | < 200ms for row data fetch | Users expect instant feedback |
| **Hover Response** | 0ms (data pre-loaded) | No additional fetch on hover |
| **Initial Load** | < 2.5s LCP | Hero image renders quickly |
| **Bandwidth** | ~40KB per row (20 movies × 2KB) | Acceptable trade-off for instant hover |
| **Scalability** | Support 10K+ concurrent users | Horizontal scaling with load balancer |
| **Availability** | 99.9% uptime | Caching layer for resilience |

### Performance Goals (Core Web Vitals)
- **LCP (Largest Contentful Paint)**: < 2.5s — Hero image/banner renders quickly
- **INP (Interaction to Next Paint)**: < 200ms — Responsive to user clicks (replaced FID in 2024)
- **CLS (Cumulative Layout Shift)**: < 0.1 — No layout jumping during load

---

## 3. API Design

### REST Endpoints

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/api/movies/trending?page=1` | Paginated trending movies | `{ ids: number[], page, totalPages }` |
| GET | `/api/movies/new-releases?page=1` | Paginated new releases | `{ ids: number[], page, totalPages }` |
| GET | `/api/movies/action?page=1` | Paginated action movies | `{ ids: number[], page, totalPages }` |
| GET | `/api/movies/:id` | Single movie by ID | `Movie` |
| POST | `/api/movies/batch` | Batch get movies | `{ results: Movie[] }` |
| POST | `/api/movies` | Add new movie | `Movie` |

### Movie Schema
```typescript
interface Movie {
  id: number;
  title: string;
  posterUrl: string;
  description: string;
  releaseDate: string;
  rating: number;          // 0-10
  genres: string[];
  director: string;
  cast: string[];
  runtime: number;         // minutes
  language: string;
}
```

### API Response Example
```json
GET /api/movies/trending?page=1

{
  "ids": [1, 2, 3, 4, 5],
  "page": 1,
  "totalPages": 5
}
```

### Why REST over GraphQL for this use case?
| Factor | REST | GraphQL |
|--------|------|---------|
| Caching | Easy HTTP caching (CDN, browser) | Requires custom caching |
| Simplicity | Simple GET requests | Query complexity |
| Over-fetching | Fixed response (acceptable here) | Flexible field selection |
| Learning curve | Lower | Higher |

---

## 4. Frontend Architecture

### Component Hierarchy
```
App
├── Header
├── Hero (featured movie)
└── MovieRows
    ├── TrendingRow (ref: trendingRowRef)
    │   └── MovieCard[] (with hover modal)
    ├── NewReleasesRow (ref: newReleasesRowRef)
    │   └── MovieCard[]
    └── ActionRow (ref: actionRowRef)
        └── MovieCard[]
```

### State Management
```typescript
// Per-row state pattern
const [movies, setMovies] = useState<Movie[]>([]);
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);
const [isFetched, setIsFetched] = useState(false);
const rowRef = useRef<HTMLDivElement>(null);
```

### Server-Side Rendering (TanStack Start)
```typescript
// createServerFn runs on the server, data is serialized to client
const getHomepageRows = createServerFn()
.handler(async () => {
  // 1. Fetch IDs from all 3 categories in parallel
  const [trendingRes, newReleasesRes, actionRes] = await Promise.all([
    fetch('http://localhost:3001/api/movies/trending?page=1'),
    fetch('http://localhost:3001/api/movies/new-releases?page=1'),
    fetch('http://localhost:3001/api/movies/action?page=1'),
  ]);
  
  // 2. Collect unique IDs → batch fetch details
  const allIds = [...new Set([...trendingIds, ...newReleasesIds, ...actionIds])];
  const batchRes = await fetch('/api/movies/batch', { method: 'POST', body: JSON.stringify({ ids: allIds }) });
  
  // 3. Return full movie data for all rows
  return { trending, newReleases, action };
});

export const Route = createFileRoute('/')({
  loader: async () => await getHomepageRows(),  // Runs on server
  component: App
});

function App() {
  // Movies are available instantly - no loading state needed
  const { trending, newReleases, action } = Route.useLoaderData();
  // ...
}
```

### Data Flow (SSR + Client Pagination)
```
┌─────────────────────────────────────────────────────────────────┐
│                    INITIAL PAGE LOAD (SSR)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│            TanStack Start route loader (server)                 │
│               getHomepageRows() called                          │
│     GET /api/movies/trending?page=1      (parallel)             │
│     GET /api/movies/new-releases?page=1  (parallel)             │
│     GET /api/movies/action?page=1        (parallel)             │
│                         ↓                                        │
│     POST /api/movies/batch (unique IDs)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│            HTML rendered with movie data embedded               │
│            Movies visible on FIRST PAINT (faster LCP)           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    USER HOVERS ON CARD                          │
│              → Show modal INSTANTLY (0ms fetch)                 │
│              → Data already in state from SSR                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  USER CLICKS RIGHT ARROW                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│             loadMoreTrending() (client-side)                    │
│         GET /api/movies/trending?page=2                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Response: { ids: [21,22,23...], page, totalPages } │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 POST /api/movies/batch                          │
│                 Body: { ids: [21,22,23...] }                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              setMovies(prev => [...prev, ...newMovies])         │
│              setPage(2)                                         │
│              setHasMore(page < totalPages)                      │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Responsibility |
|-----------|---------------|
| `MovieCard` | Renders poster, handles hover state, shows expanded modal |
| `MovieList` | Horizontal list of MovieCards with arrow navigation |
| `Hero` | Featured movie banner at top |
| `Header` | Navigation, search bar |

---

## 5. Performance Optimizations

### Current Implementation
| Optimization | How | Impact |
|--------------|-----|--------|
| **Server-Side Rendering** | TanStack Start `createServerFn` + route loader | Movies visible on first paint, faster LCP |
| **Batch API fetching** | Single POST `/api/movies/batch` for all unique IDs | Fewer network requests, deduplication |
| **Full details on initial fetch** | Include all fields in batch response | Zero latency on hover |
| **Deduplication** | `deduplicateMovies()` helper | Prevent duplicate renders |
| **Debounced hover** | 500ms delay before showing modal | Avoid flicker on quick mouse movements |

### Scaling Strategies

```
┌─────────────────────────────────────────────────────────────────┐
│                      CURRENT ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────┘
        Browser ──────► REST Server (Port 3001) ──────► TMDB API


┌─────────────────────────────────────────────────────────────────┐
│                      SCALED ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────┘

                         ┌─────────┐
                         │   CDN   │ (static assets, images)
                         └────┬────┘
                              │
        Browser ──────► Load Balancer
                              │
              ┌───────────────┼───────────────┐
              │               │               │
        ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
        │  Server 1  │   │  Server 2  │   │  Server 3  │
        └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
              │               │               │
              └───────────────┼───────────────┘
                              │
                        ┌─────▼─────┐
                        │   Redis   │ (cache TMDB responses)
                        └─────┬─────┘
                              │
                        ┌─────▼─────┐
                        │ PostgreSQL│ (user data, watchlist)
                        └─────┬─────┘
                              │
                        ┌─────▼─────┐
                        │ TMDB API  │
                        └───────────┘
```

### Caching Strategy
| Layer | TTL | What to Cache |
|-------|-----|---------------|
| **Browser** | 5 min | API responses (Cache-Control header) |
| **CDN** | 1 hour | Movie poster images |
| **Redis** | 15 min | TMDB API responses (movies don't change often) |

### Potential Improvements
1. **Virtual scrolling** - For rows with 1000+ movies, render only visible cards
2. **Image lazy loading** - Use `loading="lazy"` on poster images
3. **Service Worker** - Cache API responses for offline support
4. **SSR/ISR** - Pre-render trending row at build time
5. **Skeleton loading** - Show placeholder cards while fetching
6. **Code splitting** - Lazy load routes (search, watch) to reduce initial bundle → faster LCP

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Start REST API server
node server/rest-server.cjs

# Start frontend (in another terminal)
pnpm run dev
```

**Server**: http://localhost:3001  
**Frontend**: http://localhost:3000
