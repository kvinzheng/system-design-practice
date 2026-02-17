import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { tmdbFetch } from './tmdb'

const MovieIdSchema = z.object({
    movieId: z.number()
});

export type Video = {
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
    official: boolean;
};

export const getMovieTrailers = createServerFn()
    .inputValidator(MovieIdSchema)
    .handler(async ({ data }) => {
        const { movieId } = data;
        const res = await tmdbFetch(
            `https://api.themoviedb.org/3/movie/${movieId}/videos?language=en-US`
        )

        if (!res.ok) {
            throw new Error(`Failed to fetch trailers: ${res.status} ${res.statusText}`);
        }

        const response = await res.json();
        const videos: Video[] = response.results || [];

        const trailers = videos.filter(
            video => video.site === 'YouTube' &&
            (video.type === 'Trailer' || video.type === 'Teaser' || video.type === 'Clip' || video.type === 'Featurette')
        );

        return trailers;
    });
