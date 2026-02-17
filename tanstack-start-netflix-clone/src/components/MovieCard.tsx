import { Link } from "@tanstack/react-router";
import type { Movie } from "../types";
import { useState, useRef } from "react";

const TMDB_IMAGES_ASSET_URL = "https://image.tmdb.org/t/p/w500/";

const MovieCard = ({ movie }: { movie: Movie }) => {
    const [isHovered, setIsHovered] = useState(false);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setIsHovered(true);
        }, 500); // Delay before showing expanded card
    };

    const handleMouseLeave = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        setIsHovered(false);
    };

    const posterSrc = movie?.posterUrl || (movie?.poster_path ? TMDB_IMAGES_ASSET_URL + movie?.poster_path : "/placeholder.svg");
    const matchPercent = movie.rating ? Math.round(movie.rating * 10) : 95;
    const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 2024;
    const duration = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : "1h 45m";

    return (
        <div
            ref={cardRef}
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Base Card */}
            <Link to="/watch/$movieId" params={{ movieId: String(movie.id) }}>
                <div className="rounded-md overflow-hidden transition-all duration-300 w-32 h-48 md:w-48 md:h-72 bg-zinc-800">
                    <img
                        src={posterSrc}
                        alt={movie?.title || "Movie poster"}
                        className="w-full h-full object-cover"
                    />
                </div>
            </Link>

            {/* Netflix-style Hover Preview */}
            {isHovered && (
                <div
                    className="absolute z-50 transition-all duration-300 scale-100"
                    style={{
                        top: '-25%',
                        left: '-25%',
                        width: 'calc(100% + 50%)',
                        minWidth: '280px',
                    }}
                >
                    <div className="bg-zinc-900 rounded-lg shadow-2xl overflow-hidden border border-zinc-700">
                        {/* Preview Image/Video */}
                        <div className="relative aspect-video bg-zinc-800">
                            <img
                                src={posterSrc}
                                alt={movie?.title || "Movie poster"}
                                className="w-full h-full object-cover"
                            />
                            {/* Play indicator overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center hover:bg-white cursor-pointer">
                                    <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                            </div>
                            {/* Title overlay */}
                            <div className="absolute bottom-2 left-3 right-3">
                                <h3 className="text-white font-bold text-lg drop-shadow-lg truncate">{movie.title}</h3>
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="p-3">
                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 mb-3">
                                <Link to="/watch/$movieId" params={{ movieId: String(movie.id) }}>
                                    <button className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200 transition">
                                        <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </button>
                                </Link>
                                <button className="w-9 h-9 rounded-full border-2 border-zinc-500 text-white flex items-center justify-center hover:border-white transition">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                                <button className="w-9 h-9 rounded-full border-2 border-zinc-500 text-white flex items-center justify-center hover:border-white transition">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                    </svg>
                                </button>
                                <button className="w-9 h-9 rounded-full border-2 border-zinc-500 text-white flex items-center justify-center hover:border-white transition ml-auto">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>

                            {/* Meta Info */}
                            <div className="flex items-center gap-2 text-sm mb-2">
                                <span className="text-green-500 font-semibold">{matchPercent}% Match</span>
                                <span className="border border-zinc-500 px-1.5 py-0.5 text-xs text-zinc-400">PG-13</span>
                                <span className="text-zinc-400">{year}</span>
                                <span className="text-zinc-400">{duration}</span>
                                <span className="border border-zinc-500 px-1.5 py-0.5 text-xs text-zinc-400">HD</span>
                            </div>

                            {/* Genres */}
                            <div className="flex flex-wrap gap-1 text-sm text-zinc-300">
                                {(movie.genres || ['Drama', 'Action']).slice(0, 3).map((genre, idx) => (
                                    <span key={genre} className="flex items-center">
                                        {idx > 0 && <span className="text-zinc-600 mx-1">•</span>}
                                        {genre}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MovieCard;
