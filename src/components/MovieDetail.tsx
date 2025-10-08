"use client"

import React, { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { Play, X, ChevronLeft } from "lucide-react"
import { tmdb } from "../services/tmdb"
import { isBanned } from "../utils/banList"
import type { MovieDetails } from "../types"
import { watchlistService } from "../services/watchlist"
import { continueWatchingService } from "../services/continueWatching"
import GlobalNavbar from "./GlobalNavbar"
import Loading from "./Loading"
import HybridMovieHeader from "./HybridMovieHeader"
import PlayerSelector from "./PlayerSelector"


const MovieDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [movie, setMovie] = useState<MovieDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [frogBoops, setFrogBoops] = useState(0)
  const [showBoopAnimation, setShowBoopAnimation] = useState(false)
  const [recentlyViewedMovies, setRecentlyViewedMovies] = useState<any[]>([])
  const [recentlyViewedTVEpisodes, setRecentlyViewedTVEpisodes] = useState({})
  const [isFavorited, setIsFavorited] = useState(false)
  const [cast, setCast] = useState<
    { id: number; name: string; character: string; profile_path: string | null; gender?: number }[]
  >([])

  useEffect(() => {
    const checkFavorite = async () => {
      if (movie) {
        const isFav = await watchlistService.isMovieInFavorites(movie.id)
        setIsFavorited(isFav)
      }
    }
    checkFavorite()
  }, [movie])

  useEffect(() => {
    if (!movie?.id) return
    const fetchCredits = async () => {
      try {
        setLoading(true)
        const credits = await tmdb.getMovieCredits(movie.id)

        const castWithGender = await Promise.all(
          (credits.cast || []).slice(0, 12).map(async (actor) => {
            const personDetails = await tmdb.getPersonDetails(actor.id)
            return { ...actor, gender: personDetails.gender }
          })
        )

        setCast(castWithGender)
      } catch (e) {
        console.error("Failed to load cast", e)
      } finally {
        setLoading(false)
      }
    }
    fetchCredits()
  }, [movie?.id])

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem("recentlyViewedMovies") || "[]")
    setRecentlyViewedMovies(items)
  }, [id])

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) return
      const movieId = parseInt(id)
      if (isNaN(movieId) || isBanned(movieId)) {
        setMovie(null)
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const movieData = await tmdb.getMovieDetails(movieId)
        setMovie(movieData)
      } catch (error) {
        console.error("Failed to fetch movie:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchMovie()
  }, [id])

  const toggleFavorite = async () => {
    if (!movie) return
    if (isFavorited) {
      await watchlistService.removeMovieFromFavorites(movie.id)
      setIsFavorited(false)
    } else {
      await watchlistService.addMovieToFavorites({
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
      })
      setIsFavorited(true)
    }
  }

  const handleWatchMovie = () => {
    if (!movie || !id) return

    // Add to continue watching
    continueWatchingService.addOrUpdateItem({
      type: 'movie',
      tmdbId: movie.id,
      title: movie.title,
      poster: tmdb.getImageUrl(movie.poster_path, 'w500') || '',
      progress: 0
    });

    watchlistService.addMovieToWatchlist({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
    })
    document.body.classList.add('player-active')
    setIsPlaying(true)

    const existing = JSON.parse(localStorage.getItem("recentlyViewedMovies") || "[]")
    const filtered = existing.filter((item: any) => item.id !== movie.id)
    const updated = [
      {
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
      },
      ...filtered,
    ]
    localStorage.setItem("recentlyViewedMovies", JSON.stringify(updated.slice(0, 10)))
    setRecentlyViewedMovies(updated.slice(0, 10))
  }

  const handleClosePlayer = () => {
    if (sessionId) {
      const finalTime = Math.random() * (movie?.runtime ? movie.runtime * 60 : 7200)
      setSessionId(null)
    }
    document.body.classList.remove('player-active')
    setIsPlaying(false)
  }

  useEffect(() => {
    if (!isPlaying || !sessionId || !movie?.runtime) return
    const interval = setInterval(() => {
      const currentTime = Math.random() * (movie.runtime * 60)
      const additionalData: any = {}
      if (Math.random() > 0.95) additionalData.pauseEvents = 1
      if (Math.random() > 0.98) additionalData.seekEvents = 1
      if (Math.random() > 0.99) additionalData.bufferingEvents = 1
      if (Math.random() > 0.9) additionalData.isFullscreen = Math.random() > 0.5

    }, 30000)

    return () => clearInterval(interval)
  }, [isPlaying, sessionId, movie?.runtime])

  const handleFrogBoop = () => {
    setFrogBoops((prev) => prev + 1)
    setShowBoopAnimation(true)
    setTimeout(() => setShowBoopAnimation(false), 600)
  }

  if (loading) {
    return <Loading message="Loading movie details..." />
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-pink-50 to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Movie not found
          </h2>
          <Link
            to="/"
            className="text-[var(--grad-from)] dark:text-[var(--grad-from)] hover:text-[var(--grad-to)] dark:hover:text-[var(--grad-to)]"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  if (isPlaying && id) {
    return (
      <PlayerSelector
        tmdbId={id}
        mediaType="movie"
        title={movie.title}
        onClose={handleClosePlayer}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50 to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <GlobalNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="p-4 sm:p-8 flex-1 mobile-spacing">
          <div className="space-y-6">
            <Link to={`/`} className="text-[var(--grad-from)] dark:text-[var(--grad-from)] hover:underline ml-1">
              <ChevronLeft />
            </Link>
            <HybridMovieHeader
              show={movie}
              isFavorited={isFavorited}
              onToggleFavorite={toggleFavorite}
            />
            <button
              onClick={handleWatchMovie}
              className="w-full flex justify-center items-center space-x-2 bg-gradient-to-r from-[var(--grad-from)] to-[var(--grad-to)] hover:opacity-95 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Play className="w-5 h-5" />
              <span>Watch Movie</span>
            </button>
            
            {/* Comments Section removed */}
          </div>
          <div className="mt-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm mobile-card rounded-2xl shadow-xl border border-pink-200/50 dark:border-gray-700/50 p-4 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Cast Overview
            </h2>

            {cast.length === 0 ? (
              <p className="text-gray-700 dark:text-gray-300">
                No cast information available.
              </p>
            ) : (
              <div className="flex flex-wrap gap-6 justify-start">
                {cast.slice(0, 12).map((actor) => {
                  const profileImage = actor.profile_path
                    ? tmdb.getImageUrl(actor.profile_path, "w185")
                    : actor.gender === 1
                    ? "/female.png"
                    : actor.gender === 2
                    ? "/male.png"
                    : "/unknown.png"

                  return (
                    <div key={actor.id} className="w-28 text-center">
                      <img
                        src={profileImage}
                        alt={actor.name}
                        className="w-28 h-28 object-cover rounded-full shadow-sm mb-2 border border-gray-300 dark:border-gray-600"
                      />
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {actor.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {actor.character}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Easter Egg */}
      {movie && [816, 817, 818].includes(movie.id) && (
        <div
          className="fixed bottom-4 right-4 z-50 flex items-center space-x-3 bg-gradient-to-r from-[var(--grad-from)] to-[var(--grad-to)] rounded-full px-4 py-2 shadow-lg cursor-pointer"
          onClick={handleFrogBoop}
          role="button"
          tabIndex={0}
          aria-label="Boop the frog"
          onKeyDown={(e) => e.key === "Enter" && handleFrogBoop()}
        >
          <div className="flex items-center space-x-2">
            <img
              src="/frog.png"
              alt="Frog icon"
              className="w-6 h-6"
              draggable={false}
            />
            <span className="text-white font-semibold text-lg">
              {frogBoops} Boops
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default MovieDetail