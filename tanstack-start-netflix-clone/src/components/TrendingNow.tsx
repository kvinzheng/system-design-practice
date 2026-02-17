
import MovieList from "./MovieList";
import type { Movie } from '../types'

const TrendingNow = ({
    movies,
    onEndReached,
    isLoading,
    hasMore
}: {
    movies: Movie[]
    onEndReached?: () => void
    isLoading?: boolean
    hasMore?: boolean
}) => {
    return (
        <div className="py-8">
            <h3 className="font-medium lg:text-2xl sm:text-xl px-4">Trending Now</h3>

            <div className="my-4">
                <MovieList
                    movies={movies}
                    onEndReached={onEndReached}
                    isLoading={isLoading}
                    hasMore={hasMore}
                />
            </div>
        </div>
    );
};

export default TrendingNow;
