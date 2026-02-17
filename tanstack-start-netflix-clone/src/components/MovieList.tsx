import { useRef, useEffect } from "react"
import type { Movie, MovieListProps } from "../types"
import MovieCard from './MovieCard'

const MovieList = ({ movies, onEndReached, isLoading = false, hasMore = true, rowType }: MovieListProps) => {
    const lastItemRef = useRef<HTMLLIElement | null>(null);
    const listRef = useRef<HTMLUListElement | null>(null);
    // Throttle onEndReached to prevent rapid repeated calls
    const throttleTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!onEndReached || isLoading || !hasMore || movies.length === 0) return;
        const lastItem = lastItemRef.current;
        const list = listRef.current;
        if (!lastItem || !list) return;
        // Make the last item visually obvious for debugging
        lastItem.style.minWidth = '40px';
        lastItem.style.minHeight = '40px';
        lastItem.style.background = 'rgba(255,0,0,0.2)';
        const observer = new window.IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    if (!throttleTimeout.current) {
                        onEndReached();
                        throttleTimeout.current = setTimeout(() => {
                            throttleTimeout.current = null;
                        }, 1000); // 1 second throttle
                    }
                }
            },
            {
                root: list, // Use the <ul> as the root scroll container
                rootMargin: '0px',
                threshold: 0,
            }
        );
        observer.observe(lastItem);
        return () => {
            observer.disconnect();
            lastItem.style.background = '';
            if (throttleTimeout.current) {
                clearTimeout(throttleTimeout.current);
                throttleTimeout.current = null;
            }
        };
    }, [onEndReached, isLoading, hasMore, movies.length]);
    return (
        <ul
            ref={listRef}
            className="flex overflow-x-scroll overflow-y-visible gap-6 scrollbar-hide relative px-4 py-8"
            style={{ paddingTop: '2rem', paddingBottom: '2rem' }}
        >
            {movies.map((movie: Movie, idx) => {
                const isLast = idx === movies.length - 1;
                return (
                    <li
                        key={movie.id}
                        ref={isLast ? lastItemRef : undefined}
                        className="flex-shrink-0 w-32 md:w-48"
                        data-movie-id={movie.id}
                        data-row-type={rowType}
                    >
                        <MovieCard movie={movie} />
                    </li>
                );
            })}
        </ul>
    );
}

export default MovieList
