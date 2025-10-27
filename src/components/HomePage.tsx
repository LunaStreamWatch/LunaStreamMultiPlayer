import React, { useState, useEffect } from "react"
import { Search, TrendingUp } from "lucide-react"
import { useNavigate, useParams, Link } from "react-router-dom"

import { tmdb } from "../services/tmdb"
import type { Movie, TVShow } from "../types"
import GlobalNavbar from "./GlobalNavbar"
import ContinueWatching from "./ContinueWatching"
import { filterBannedContent } from "../utils/banList"

import { watchlistService } from "../services/watchlist"

const HomePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<(Movie | (TVShow & { media_type: "movie" | "tv" }))[]>([])
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([])
  const [trendingTV, setTrendingTV] = useState<TVShow[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [showAllFaves, setShowAllFaves] = React.useState(false)

  const [recentlyViewedMovies, setRecentlyViewedMovies] = useState<any[]>([])
  const [recentlyViewedTVEpisodes, setRecentlyViewedTVEpisodes] = useState<{
    [showId: number]: { show: any; episodes: any[] }
  }>({})

  // State
  const [favoriteShows, setFavoriteShows] = useState<number[]>([])
  const [favoriteMovies, setFavoriteMovies] = useState<number[]>([])

  // Load favorites from database on mount
  useEffect(() => {
    const loadFavorites = async () => {
      const shows = await watchlistService.getFavoriteShows()
      const movies = await watchlistService.getFavoriteMovies()
      setFavoriteShows(shows.map(s => s.id))
      setFavoriteMovies(movies.map(m => m.id))
    }
    loadFavorites()
  }, [])

  const toggleFavorite = async (item: any) => {
    if (item.type === "tv") {
      if (favoriteShows.includes(item.show.id)) {
        await watchlistService.removeShowFromFavorites(item.show.id)
        setFavoriteShows(favoriteShows.filter((id) => id !== item.show.id))
      } else {
        await watchlistService.addShowToFavorites({
          id: item.show.id,
          name: item.show.name,
          poster_path: item.show.poster_path,
          first_air_date: item.show.first_air_date,
          vote_average: item.show.vote_average,
        })
        setFavoriteShows([item.show.id, ...favoriteShows])
      }
    }

    if (item.type === "movie") {
      if (favoriteMovies.includes(item.movie.id)) {
        await watchlistService.removeMovieFromFavorites(item.movie.id)
        setFavoriteMovies(favoriteMovies.filter((id) => id !== item.movie.id))
      } else {
        await watchlistService.addMovieToFavorites({
          id: item.movie.id,
          title: item.movie.title,
          poster_path: item.movie.poster_path,
          release_date: item.movie.release_date,
          vote_average: item.movie.vote_average,
        })
        setFavoriteMovies([item.movie.id, ...favoriteMovies])
      }
    }
  }

  const isFavorited = (item: any) => {
    if (item.type === "tv") {
      return favoriteShows.includes(item.show.id)
    }
    if (item.type === "movie") {
      return favoriteMovies.includes(item.movie.id)
    }
    return false
  }

  const clearRecentlyViewed = () => {
    localStorage.removeItem("recentlyViewedMovies")
    localStorage.removeItem("recentlyViewedTVEpisodes")
    setRecentlyViewedMovies([])
    setRecentlyViewedTVEpisodes({})
  }

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem("recentlyViewedMovies") || "[]")
    setRecentlyViewedMovies(items)
  }, [id])

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("recentlyViewedTVEpisodes") || "{}")
    setRecentlyViewedTVEpisodes(data)
  }, [])

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const [moviesData, tvData] = await Promise.all([tmdb.getTrendingMovies(), tmdb.getTrendingTV()])
        setTrendingMovies(moviesData.results?.slice(0, 12) || [])
        setTrendingTV(tvData.results?.slice(0, 12) || [])
      } catch (error) {
        console.error('Error fetching trending content:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTrending()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const showRecentlyViewed = recentlyViewedMovies.length > 0 || Object.keys(recentlyViewedTVEpisodes).length > 0

  return (
    <div className="min-h-screen bg-black dark:bg-gray-900 transition-colors duration-300">
      {/* Netflix-style Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-500 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <Film className="w-5 h-5 text-white" />
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

      {/* Hero Section with Search */}
      <div className="relative pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          {/* Hero Content */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6">
              Unlimited movies, TV shows, and more
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Watch anywhere. Cancel anytime.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
              <div className="relative bg-white/10 backdrop-blur-md rounded-full border border-gray-600 transition-colors duration-300">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={async (e) => {
                    const value = e.target.value
                    setQuery(value)
                    if (value.trim().length > 1) {
                      try {
                        const [movieRes, tvRes] = await Promise.all([tmdb.searchMovies(value), tmdb.searchTV(value)])
                        const movieResults = (movieRes.results || []).map((item) => ({
                          ...item,
                          media_type: "movie",
                        }))

                        // Fetch additional details for TV shows
                        const tvResults = await Promise.all(
                          (tvRes.results || []).slice(0, 3).map(async (item) => {
                            try {
                              const details = await tmdb.getTVDetails(item.id)
                              return {
                                ...item,
                                media_type: "tv",
                                number_of_seasons: details.number_of_seasons,
                                number_of_episodes: details.number_of_episodes,
                              }
                            } catch {
                              return {
                                ...item,
                                media_type: "tv",
                              }
                            }
                          }),
                        )

                        // Filter banned content from suggestions
                        const filteredMovies = filterBannedContent(movieResults);
                        const filteredTV = filterBannedContent(tvResults);
                        const combined = [...filteredMovies, ...filteredTV]
                          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
                          .slice(0, 6)
                        setSuggestions(combined)
                      } catch (error) {
                        console.error('Search failed:', error)
                        setSuggestions([])
                      }
                    } else {
                      setSuggestions([])
                    }
                  }}
                  placeholder="Search for movies, TV shows..."
                  className="block w-full pl-12 pr-32 py-4 text-lg bg-transparent border-0 placeholder-gray-400 text-white focus:ring-0 focus:outline-none"
                />
                <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-6">
                  <div className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-semibold transition-colors">
                    Search
                  </div>
                </button>
              </div>

              {/* Search Suggestions */}
              {suggestions.length > 0 && (
                <div className="absolute z-50 mt-2 w-full bg-gray-800/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700 max-h-96 overflow-auto">
                  {suggestions.map((item) => {
                    const isMovie = item.media_type === "movie"
                    const title = isMovie ? item.title : item.name
                    const releaseDate = isMovie ? item.release_date : item.first_air_date
                    const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A'

                    return (
                      <div
                        key={`${item.title || item.name}-${item.id}`}
                        onClick={() => navigate(`/${item.media_type}/${item.id}`)}
                        className="flex items-center p-4 hover:bg-gray-700/50 cursor-pointer transition-all duration-200 border-b border-gray-700/30 last:border-b-0"
                      >
                        {/* Poster Image */}
                        <div className="flex-shrink-0 w-12 h-16 mr-4 rounded-lg overflow-hidden shadow-md">
                          <img
                            src={tmdb.getImageUrl(item.poster_path, "w92") || "/placeholder.svg"}
                            alt={title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white text-sm truncate">
                                {title}
                              </h3>
                              <div className="flex items-center space-x-3 mt-1">
                                <span className="text-xs text-gray-400">{year}</span>
                                <div className="flex items-center space-x-1">
                                  <span className="text-yellow-500 text-xs">★</span>
                                  <span className="text-xs text-gray-300">
                                    {item.vote_average.toFixed(1)}
                                  </span>
                                </div>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    isMovie
                                      ? "bg-red-900/50 text-red-300"
                                      : "bg-blue-900/50 text-blue-300"
                                  }`}
                                >
                                  {isMovie ? 'Movie' : 'TV Show'}
                                </span>
                              </div>

                              {/* TV Show specific info */}
                              {!isMovie && (
                                <div className="flex items-center space-x-3 mt-1 text-xs text-gray-400">
                                  <span>Seasons: {(item as any).number_of_seasons || 'N/A'}</span>
                                  <span>Episodes: {(item as any).number_of_episodes || 'N/A'}</span>
                                </div>
                              )}

                              {/* Overview preview */}
                              {item.overview && (
                                <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                  {item.overview}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Continue Watching Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <ContinueWatching />
      </div>

      {/* Trending Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-600 rounded-full animate-spin flex items-center justify-center mb-4 shadow-lg mx-auto">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-400 text-lg">
              Loading trending content...
            </p>
          </div>
        ) : (
          <>
            {/* Trending Movies */}
            <div className="mb-12">
              <h2 className="flex items-center mb-8 text-3xl font-bold text-white">
                <TrendingUp className="w-8 h-8 mr-3 text-red-500" />
                Trending Movies
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 tablet-grid lg:grid-cols-6 gap-4 sm:gap-6">
                {trendingMovies.map((movie) => (
                  <Link
                    key={movie.id}
                    to={`/movie/${movie.id}`}
                    className="group block bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden hover:bg-gray-700/50 transition-all duration-300 hover:scale-105"
                  >
                    <div className="aspect-[2/3] overflow-hidden">
                      <img
                        src={tmdb.getImageUrl(movie.poster_path) || "/placeholder.svg"}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-white text-sm mb-2 line-clamp-2 group-hover:text-red-400 transition-colors">
                        {movie.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{new Date(movie.release_date).getFullYear()}</span>
                        <div className="flex items-center">
                          <span className="text-yellow-500">★</span>
                          <span className="ml-1">{movie.vote_average.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Trending TV Shows */}
            <div>
              <h2 className="flex items-center mb-8 text-3xl font-bold text-white">
                <TrendingUp className="w-8 h-8 mr-3 text-blue-500" />
                Trending TV Shows
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 tablet-grid lg:grid-cols-6 gap-4 sm:gap-6">
                {trendingTV.map((show) => (
                  <Link
                    key={show.id}
                    to={`/tv/${show.id}`}
                    className="group block bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden hover:bg-gray-700/50 transition-all duration-300 hover:scale-105"
                  >
                    <div className="aspect-[2/3] overflow-hidden">
                      <img
                        src={tmdb.getImageUrl(show.poster_path) || "/placeholder.svg"}
                        alt={show.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-white text-sm mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                        {show.name}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{new Date(show.first_air_date).getFullYear()}</span>
                        <div className="flex items-center">
                          <span className="text-yellow-500">★</span>
                          <span className="ml-1">{show.vote_average.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default HomePage