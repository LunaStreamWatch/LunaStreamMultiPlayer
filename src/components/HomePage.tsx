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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      <GlobalNavbar />

      {/* Hero & Search */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          {/* Heading */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 transition-colors duration-300 px-4">
              <span className="bg-gradient-to-r from-[var(--grad-from)] to-[var(--grad-to)] bg-clip-text text-transparent">
                Discover Unlimited Entertainment
              </span>
            </h1>
            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto transition-colors duration-300 px-4">
              Stream your favorite movies and TV shows
            </p>
            {/* Search with Suggestions */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative px-4">
                <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-200/50 dark:border-gray-700/50 transition-colors duration-300">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 dark:text-blue-400 transition-colors duration-300" />
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
                    placeholder="Search movies and TV shows..."
                    className="block w-full pl-12 sm:pl-16 pr-4 sm:pr-6 py-4 sm:py-6 text-base sm:text-lg bg-transparent border-0 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:ring-0 focus:outline-none transition-colors duration-300"
                  />
                  <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-6">
                    <div className="bg-gradient-to-r from-[var(--grad-from)] to-[var(--grad-to)] text-white px-4 sm:px-8 py-2 sm:py-3 rounded-xl font-semibold hover:opacity-95 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                      <span className="hidden sm:inline">Search</span>
                      <Search className="w-4 h-4 sm:hidden" />
                    </div>
                  </button>
                </div>
                {/* Enhanced Suggestions Dropdown */}
                {suggestions.length > 0 && (
                  <div className="absolute z-50 mt-2 w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 max-h-96 overflow-auto">
                    {suggestions.map((item) => {
                      const isMovie = item.media_type === "movie"
                      const title = isMovie ? item.title : item.name
                      const releaseDate = isMovie ? item.release_date : item.first_air_date
                      const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A'

                      return (
                        <div
                          key={`${item.title || item.name}-${item.id}`}
                          onClick={() => navigate(`/${item.media_type}/${item.id}`)}
                          className="flex items-center p-4 hover:bg-pink-50 dark:hover:bg-gray-700/50 cursor-pointer transition-all duration-200 border-b border-gray-100 dark:border-gray-700/30 last:border-b-0"
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
                                <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                  {title}
                                </h3>
                                <div className="flex items-center space-x-3 mt-1">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{year}</span>
                                  <div className="flex items-center space-x-1">
                                    <span className="text-yellow-500 text-xs">★</span>
                                    <span className="text-xs text-gray-600 dark:text-gray-300">
                                      {item.vote_average.toFixed(1)}
                                    </span>
                                  </div>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                      isMovie
                                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                        : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                                    }`}
                                  >
                                    {isMovie ? 'Movie' : 'TV Show'}
                                  </span>
                                </div>

                                {/* TV Show specific info */}
                                {!isMovie && (
                                  <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    <span>Seasons: {(item as any).number_of_seasons || 'N/A'}</span>
                                    <span>Episodes: {(item as any).number_of_episodes || 'N/A'}</span>
                                  </div>
                                )}

                                {/* Overview preview */}
                                {item.overview && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                    {item.overview}
                                  </p>
                                )}
                              </div>

                              {/* Popularity indicator */}
                              <div className="flex-shrink-0 ml-3">
                                <div className="w-2 h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className="bg-gradient-to-t from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                                    style={{
                                      height: `${Math.min((item.popularity / 100) * 100, 100)}%`,
                                      width: "100%",
                                    }}
                                  ></div>
                                </div>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mobile-spacing">
        <ContinueWatching />
      </div>

      <br />

      {/* Trending Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 mobile-spacing">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-spin flex items-center justify-center mb-4 shadow-lg mx-auto">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-lg transition-colors duration-300">
              Loading trending content...
            </p>
          </div>
        ) : (
          <>
            {/* Trending Movies */}
            <div className="mb-12">
              <h2 className="flex items-center mb-8 text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                <TrendingUp className="w-8 h-8 mr-3 text-blue-500" />
                Trending Movies
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 tablet-grid lg:grid-cols-6 gap-4 sm:gap-6">
                {trendingMovies.map((movie) => (
                  <Link
                    key={movie.id}
                    to={`/movie/${movie.id}`}
                    className="group block bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm mobile-card rounded-xl shadow-lg border border-blue-200/50 dark:border-gray-700/50 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                  >
                    <div className="aspect-[2/3] overflow-hidden">
                      <img
                        src={tmdb.getImageUrl(movie.poster_path) || "/placeholder.svg"}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-3 sm:p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {movie.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
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
              <h2 className="flex items-center mb-8 text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                <TrendingUp className="w-8 h-8 mr-3 text-indigo-500" />
                Trending TV Shows
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 tablet-grid lg:grid-cols-6 gap-4 sm:gap-6">
                {trendingTV.map((show) => (
                  <Link
                    key={show.id}
                    to={`/tv/${show.id}`}
                    className="group block bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm mobile-card rounded-xl shadow-lg border border-indigo-200/50 dark:border-gray-700/50 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                  >
                    <div className="aspect-[2/3] overflow-hidden">
                      <img
                        src={tmdb.getImageUrl(show.poster_path) || "/placeholder.svg"}
                        alt={show.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-3 sm:p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {show.name}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
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