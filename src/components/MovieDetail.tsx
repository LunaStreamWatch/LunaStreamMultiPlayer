"use client"

import React, { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { Play, X, ChevronLeft, Search, Heart } from "lucide-react"
import { tmdb } from "../services/tmdb"
import { isBanned } from "../utils/banList"
import type { MovieDetails } from "../types"
import { watchlistService } from "../services/watchlist"
import { continueWatchingService } from "../services/continueWatching"
import Loading from "./Loading"
import PlayerSelector from "./PlayerSelector"
import SettingsMenu from "./SettingsMenu"


const MovieDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
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
    <div className="min-h-screen bg-black">
      {/* Netflix-style Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-500 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-white">
                LunaStream
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-white hover:text-gray-300 transition-colors">Home</Link>
              <Link to="/search" className="text-white hover:text-gray-300 transition-colors">Search</Link>
              <Link to="/vault" className="text-white hover:text-gray-300 transition-colors">My List</Link>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              {/* Search Button */}
              <button
                onClick={() => navigate('/search')}
                className="text-white hover:text-gray-300 transition-colors p-2"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Donate Button */}
              <Link
                to="/donate"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition-colors"
              >
                Donate
              </Link>

              {/* Discord Button */}
              <a
                href="https://discord.gg/lunastream"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-gray-300 transition-colors p-2"
                title="Join Discord"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 1 0-.008.128 10.2 10.2 0 0 0 .372.292 10.302 10.302 0 0 0 11.293.009.077.077 0 0 0-.01-.125c-.597-.205-1.253-.462-1.872-.892a.077.077 0 0 1-.045-.106c.253-.561.548-1.114 1.226-1.994a.076.076 0 0 0 .084-.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>

              {/* Settings Menu */}
              <SettingsMenu />
            </div>
          </div>
        </div>
      </div>

      <div className="relative pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Link to="/" className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-6">
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>

          {/* Movie Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Poster */}
              <div className="flex-shrink-0">
                <img
                  src={tmdb.getImageUrl(movie.poster_path, "w500") || "/placeholder.svg"}
                  alt={movie.title}
                  className="w-64 h-96 object-cover rounded-lg shadow-2xl"
                />
              </div>

              {/* Movie Info */}
              <div className="flex-1">
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                  {movie.title}
                </h1>

                <div className="flex items-center space-x-4 mb-6">
                  <span className="text-green-400 font-semibold">
                    {Math.round(movie.vote_average * 10)}% Match
                  </span>
                  <span className="text-gray-400">
                    {new Date(movie.release_date).getFullYear()}
                  </span>
                  <span className="text-gray-400">
                    {movie.runtime} min
                  </span>
                  <div className="flex items-center space-x-1">
                    <span className="text-yellow-500">★</span>
                    <span className="text-white">{movie.vote_average.toFixed(1)}</span>
                  </div>
                </div>

                <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                  {movie.overview}
                </p>

                {/* Genres */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {movie.genres?.map((genre) => (
                    <span
                      key={genre.id}
                      className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleWatchMovie}
                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    <Play className="w-5 h-5" />
                    <span>Play</span>
                  </button>

                  <button
                    onClick={toggleFavorite}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                      isFavorited
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-800 hover:bg-gray-700 text-white'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current text-red-500' : ''}`} />
                    <span>{isFavorited ? 'In My List' : 'Add to My List'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Cast Section */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6">
              Cast
            </h2>

            {cast.length === 0 ? (
              <p className="text-gray-400">
                No cast information available.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {cast.slice(0, 12).map((actor) => {
                  const profileImage = actor.profile_path
                    ? tmdb.getImageUrl(actor.profile_path, "w185")
                    : actor.gender === 1
                    ? "/female.png"
                    : actor.gender === 2
                    ? "/male.png"
                    : "/unknown.png"

                  return (
                    <div key={actor.id} className="text-center">
                      <img
                        src={profileImage}
                        alt={actor.name}
                        className="w-24 h-24 object-cover rounded-full mx-auto mb-3 border-2 border-gray-700"
                      />
                      <p className="text-sm font-medium text-white truncate">
                        {actor.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
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