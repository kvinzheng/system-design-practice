export type Movie = {
    id: number;
    title: string;
    poster_path?: string | null;
    posterUrl?: string;
    description?: string;
    releaseDate?: string;
    rating?: number;
    genres?: string[];
    director?: string;
    cast?: string[];
    runtime?: number;
    language?: string;
};

export type MovieListProps = {
    movies: Movie[];
    onEndReached?: () => void;
    isLoading?: boolean;
    hasMore?: boolean;
    rowType?: 'trending' | 'newReleases' | 'action';
};

export interface TMDBResponse {
    page: number
    results: Movie[]
    total_pages: number
    total_results: number
}
