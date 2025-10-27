"use client"

import React, { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { Play, Star, Calendar, Clock, X, Heart, Eye, EyeOff, ChevronDown, Tv, Info, List, Grid2x2 as Grid, ChevronLeft, Search } from "lucide-react"
import { tmdb } from "../services/tmdb"
import type { TVDetails, Episode } from "../types"
import { watchlistService } from "../services/watchlist"
import { continueWatchingService } from "../services/continueWatching"
import Loading from "./Loading"
import { useIsMobile } from "../hooks/useIsMobile"
import PlayerSelector from "./PlayerSelector"
import SettingsMenu from "./SettingsMenu"


const TVDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [show, setShow] = useState<TVDetails | null>(null)
  const [selectedSeason, setSelectedSeason] = useState(1)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)
  const [episodesLoading, setEpisodesLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showDescriptions, setShowDescriptions] = useState<{ [key: number]: boolean }>({})
  const [recentlyViewedTV, setRecentlyViewedTV] = useState<any[]>([])
  const [recentlyViewedTVEpisodes, setRecentlyViewedTVEpisodes] = useState<{ [showId: number]: { show: any; episodes: any[] } }>({})
  const [recentlyViewedMovies, setRecentlyViewedMovies] = useState<any[]>([])
  const [isFavorited, setIsFavorited] = useState(false)
  const [cast, setCast] = React.useState([])
  const [seasonCast, setSeasonCast] = React.useState<any[]>([])

  const isMobile = useIsMobile()


  useEffect(() => {
    async function fetchSeasonCredits() {
      if (!show?.id) return;
      if (!selectedSeason) {
        // No season selected, show default cast
        setSeasonCast([]);
        return;
      }
      try {
        const credits = await tmdb.getTVSeasonCredits(show.id, selectedSeason);
        setSeasonCast(credits.cast || []);
      } catch (error) {
        console.error("Failed to fetch season credits:", error);
        setSeasonCast([]);
      }
    }
    fetchSeasonCredits();
  }, [show?.id, selectedSeason]);

  useEffect(() => {
    const checkFavorite = async () => {
      if (show) {
        const isFav = await watchlistService.isShowInFavorites(show.id)
        setIsFavorited(isFav)
      }
    }
    checkFavorite()
  }, [show])

  const toggleFavorite = async () => {
    if (!show) return
    if (isFavorited) {
      await watchlistService.removeShowFromFavorites(show.id)
      setIsFavorited(false)
    } else {
      await watchlistService.addShowToFavorites({
        id: show.id,
        name: show.name,
        poster_path: show.poster_path,
        first_air_date: show.first_air_date,
        vote_average: show.vote_average,
      })
      setIsFavorited(true)
    }
  }

  useEffect(() => {
    async function fetchCredits() {
      setLoading(true)
      const credits = await tmdb.getTVCredits(show.id)
      setCast(credits.cast || [])
      setLoading(false)
    }

    if (show?.id) {
      fetchCredits()
    }
  }, [show?.id])

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("recentlyViewedTVEpisodes") || "{}")
    const data2 = JSON.parse(localStorage.getItem("recentlyViewedMovies") || "[]")
    setRecentlyViewedTVEpisodes(data)
    setRecentlyViewedMovies(data2)
  }, [])

  const clearRecentlyViewed = () => {
    localStorage.removeItem("recentlyViewedTVEpisodes")
    setRecentlyViewedTVEpisodes({})
    localStorage.removeItem("recentlyViewedMovies")
    setRecentlyViewedMovies([])
  }

  useEffect(() => {
    const fetchShow = async () => {
      if (!id) return
      
      const showId = Number.parseInt(id);
      
      setLoading(true)
      try {
        const showData = await tmdb.getTVDetails(showId)
        setShow(showData)
        if (showData.seasons && showData.seasons.length > 0) {
          const firstSeason = showData.seasons.find((s: any) => s.season_number > 0) || showData.seasons[0]
          setSelectedSeason(firstSeason.season_number)
        }
      } catch (error) {
        console.error("Failed to fetch TV show:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchShow()
  }, [id])

  useEffect(() => {
    const fetchEpisodesAndRating = async () => {
      if (!id || selectedSeason === 0) return
      setEpisodesLoading(true)
      try {
        const seasonData = await tmdb.getTVSeasons(Number.parseInt(id), selectedSeason)
        setEpisodes(seasonData.episodes || [])
      } catch (error) {
        console.error("Failed to fetch episodes or season details:", error)
      } finally {
        setEpisodesLoading(false)
      }
    }

    fetchEpisodesAndRating()
  }, [id, selectedSeason])

  useEffect(() => {
    if (show) {
      const existing = JSON.parse(localStorage.getItem("recentlyViewedTV") || "[]")
      const filtered = existing.filter((item: any) => item.id !== show.id)
      const updated = [
        {
          id: show.id,
          name: show.name,
          poster_path: show.poster_path,
          first_air_date: show.first_air_date,
        },
        ...filtered,
      ]
      localStorage.setItem("recentlyViewedTV", JSON.stringify(updated.slice(0, 5)))
      setRecentlyViewedTV(updated.slice(0, 5))
    }
  }, [show])

  // -------------- UPDATED: Send Discord notification on watch -------------
  const handleWatchEpisode = (episode: Episode) => {
    if (show && id) {
      // Add to continue watching
      continueWatchingService.addOrUpdateItem({
        type: 'tv',
        tmdbId: show.id,
        title: show.name,
        poster: tmdb.getImageUrl(show.poster_path, 'w500') || '',
        season: episode.season_number,
        episode: episode.episode_number,
        episodeTitle: episode.name,
        progress: 0
      });

      watchlistService.addShowToWatchlist({
        id: show.id,
        name: show.name,
        poster_path: show.poster_path,
        first_air_date: show.first_air_date,
        vote_average: show.vote_average,
      });

      const existing = JSON.parse(localStorage.getItem("recentlyViewedTVEpisodes") || "{}")

      const currentShowGroup = existing[show.id] || {
        show: {
          id: show.id,
          name: show.name,
          poster_path: show.poster_path,
          first_air_date: show.first_air_date,
        },
        episodes: [],
      }

      currentShowGroup.episodes = currentShowGroup.episodes.filter(
        (ep: any) => !(ep.season_number === episode.season_number && ep.episode_number === episode.episode_number),
      )

      currentShowGroup.episodes.unshift({
        id: episode.id,
        name: episode.name,
        season_number: episode.season_number,
        episode_number: episode.episode_number,
        air_date: episode.air_date,
      })

      currentShowGroup.episodes = currentShowGroup.episodes.slice(0, 5)

      const updated = {
        ...existing,
        [show.id]: currentShowGroup,
      }

      localStorage.setItem("recentlyViewedTVEpisodes", JSON.stringify(updated))
      setRecentlyViewedTVEpisodes(updated)


      const episodeDuration =
        show.episode_run_time && show.episode_run_time.length > 0 ? show.episode_run_time[0] * 60 : 45 * 60

      document.body.classList.add('player-active')
      setCurrentEpisode(episode)
      setIsPlaying(true)
    }
  }

  const handleClosePlayer = () => {
    document.body.classList.remove('player-active')
    setIsPlaying(false)
    setCurrentEpisode(null)
  }


  const toggleDescription = (episodeId: number) => {
    setShowDescriptions((prev) => ({
      ...prev,
      [episodeId]: !prev[episodeId],
    }))
  }

  const formatAirDate = (dateString: string) => {
    if (!dateString) return "TBA"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return <Loading message='Loading show details...' />
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50 to-slate-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">
            Show not found
          </h2>
          <Link
            to="/"
            className="text-[var(--grad-from)] dark:text-[var(--grad-from)] hover:text-[var(--grad-to)] dark:hover:text-pink-300 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  if (isPlaying && currentEpisode) {
    return (
      <PlayerSelector
        tmdbId={show.id}
        mediaType="tv"
        title={show.name}
        season={currentEpisode.season_number}
        episode={currentEpisode.episode_number}
        onClose={handleClosePlayer}
      />
    );
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

          {/* TV Show Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Poster */}
              <div className="flex-shrink-0">
                <img
                  src={tmdb.getImageUrl(show.poster_path, "w500") || "/placeholder.svg"}
                  alt={show.name}
                  className="w-64 h-96 object-cover rounded-lg shadow-2xl"
                />
              </div>

              {/* Show Info */}
              <div className="flex-1">
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                  {show.name}
                </h1>

                <div className="flex items-center space-x-4 mb-6">
                  <span className="text-green-400 font-semibold">
                    {Math.round(show.vote_average * 10)}% Match
                  </span>
                  <span className="text-gray-400">
                    {new Date(show.first_air_date).getFullYear()}
                  </span>
                  <span className="text-gray-400">
                    {show.number_of_seasons} Season{show.number_of_seasons !== 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center space-x-1">
                    <span className="text-yellow-500">★</span>
                    <span className="text-white">{show.vote_average.toFixed(1)}</span>
                  </div>
                </div>

                <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                  {show.overview}
                </p>

                {/* Genres */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {show.genres?.map((genre) => (
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
                    onClick={() => handleWatchEpisode(episodes[0])}
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

          {/* Season Selector */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Episodes</h2>
              {show?.seasons && show.seasons.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                    className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {show.seasons
                      .filter((season: any) => season.season_number > 0)
                      .map((season: any) => (
                        <option key={season.id} value={season.season_number}>
                          Season {season.season_number}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Episodes List */}
          {episodesLoading ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-red-600 rounded-full animate-spin flex items-center justify-center mb-4 shadow-lg mx-auto">
                <Tv className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-400 text-lg">
                Loading episodes...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {episodes.map((episode) => (
                <div
                  key={episode.id}
                  className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          {episode.episode_number}
                        </span>
                        <h3 className="text-xl font-semibold text-white">
                          {episode.name}
                        </h3>
                      </div>

                      {episode.air_date && (
                        <div className="flex items-center text-sm text-gray-400 mb-3">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{formatAirDate(episode.air_date)}</span>
                        </div>
                      )}

                      {episode.overview && (
                        <p className="text-gray-300 leading-relaxed">
                          {episode.overview}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 ml-6">
                      <Link
                        to={`/tv/${id}/season/${episode.season_number}/episode/${episode.episode_number}`}
                        className="text-gray-400 hover:text-white transition-colors p-2"
                        title="View Episode Details"
                      >
                        <Info className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleWatchEpisode(episode)}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>Watch</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TVDetail