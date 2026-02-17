type TmdbAuthConfig = {
  headers: HeadersInit
  url: string
}

function appendApiKey(url: string, apiKey: string): string {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}api_key=${encodeURIComponent(apiKey)}`
}

function getTmdbAuthConfig(url: string, headers?: HeadersInit): TmdbAuthConfig {
  const apiKey = process.env.TMDB_API_KEY
  const authToken = process.env.TMDB_AUTH_TOKEN

  if (!authToken && !apiKey) {
    throw new Error('TMDB_AUTH_TOKEN or TMDB_API_KEY is not defined in environment variables')
  }

  const resolvedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((headers ?? {}) as Record<string, string>)
  }

  if (apiKey) {
    return {
      headers: resolvedHeaders,
      url: appendApiKey(url, apiKey)
    }
  }

  resolvedHeaders.Authorization = `Bearer ${authToken}`
  return { headers: resolvedHeaders, url }
}

// In-memory cache for TMDB responses (15 min TTL)
const cache = new Map<string, { data: unknown; expires: number }>()
const CACHE_TTL = 15 * 60 * 1000 // 15 minutes

export async function tmdbFetch(url: string, init: RequestInit = {}) {
  // Only cache GET requests (no body)
  const isGet = !init.method || init.method.toUpperCase() === 'GET'
  
  if (isGet) {
    const cached = cache.get(url)
    if (cached && Date.now() < cached.expires) {
      return new Response(JSON.stringify(cached.data), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  const { headers, url: resolvedUrl } = getTmdbAuthConfig(url, init.headers)
  const res = await fetch(resolvedUrl, { ...init, headers })
  
  // Cache successful GET responses
  if (isGet && res.ok) {
    const data = await res.clone().json()
    cache.set(url, { data, expires: Date.now() + CACHE_TTL })
  }
  
  return res
}
