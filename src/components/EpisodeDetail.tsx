import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Play, Calendar, Star, Clock, X } from 'lucide-react';
import { tmdb } from '../services/tmdb';
import { watchlistService } from '../services/watchlist';
import { continueWatchingService } from '../services/continueWatching';
import GlobalNavbar from './GlobalNavbar';
import Loading from './Loading';
import { useIsMobile } from '../hooks/useIsMobile';
import PlayerSelector from './PlayerSelector';

interface Episode {
  id: number;
  name: string;
  episode_number: number;
  season_number: number;
  air_date: string;
  overview: string;
  still_path: string | null;
  vote_average: number;
  runtime: number;
}

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  gender?: number; // add optional gender property
}

const EpisodeDetail: React.FC = () => {
  const { id, seasonNumber, episodeNumber } = useParams<{ 
    id: string; 
    seasonNumber: string; 
    episodeNumber: string; 
  }>();
  const [show, setShow] = useState<any>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showDescriptions, setShowDescriptions] = useState<{ [key: number]: boolean }>({});
  const [seasonCast, setSeasonCast] = useState<any[]>([]);
  
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !seasonNumber || !episodeNumber) return;
      
      setLoading(true);
      try {
        const [showData, seasonData, episodeCredits] = await Promise.all([
          tmdb.getTVDetails(parseInt(id)),
          tmdb.getTVSeasons(parseInt(id), parseInt(seasonNumber)),
          tmdb.getTVEpisodeCredits(parseInt(id), parseInt(seasonNumber), parseInt(episodeNumber))  // Assuming you have this function in your tmdb service
        ]);
        
        const episodeData = seasonData.episodes?.find(
          (ep: any) => ep.episode_number === parseInt(episodeNumber)
        );

        // Filter cast for this episode if available (TMDB API gives show-level credits for TV)
        // If you want episode-specific cast, you might have to call getTVCredits for episode instead.
        // But TMDB does not support episode-level credits directly through one endpoint,
        // so we show show-level main cast.

        setShow(showData);
        setEpisode(episodeData || null);
        setCast(episodeCredits.cast || []);
      } catch (error) {
        console.error('Failed to fetch episode data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, seasonNumber, episodeNumber]);

  useEffect(() => {
    const fetchCastDetails = async () => {
      if (!cast.length) return;
      const castWithGender = await Promise.all(
        cast.map(async (member) => {
          try {
            const personDetails = await tmdb.getPersonDetails(member.id);
            return { ...member, gender: personDetails.gender };
          } catch (err) {
            console.error('Error fetching person details', err);
            return member;
          }
        })
      );
      setCast(castWithGender);
    };
    fetchCastDetails();
  }, [cast]);

  const handleWatchEpisode = () => {
    if (!show || !episode || !id) return;

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

    const episodeDuration = episode.runtime
      ? episode.runtime * 60
      : (show.episode_run_time && show.episode_run_time.length > 0
          ? show.episode_run_time[0] * 60
          : 45 * 60);
    setIsPlaying(true);
  };

  const handleClosePlayer = () => {
    setIsPlaying(false);
  };

  if (loading) {
    return <Loading message={t.status_loading || 'Loading...'} />;
  }

  if (!episode || !show) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50 to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t.episode_not_found || 'Episode not found'}
          </h2>
          <Link to="/" className="text-[var(--grad-from)] dark:text-[var(--grad-from)] hover:underline">
            {t.error_404_go_home}
          </Link>
        </div>
      </div>
    );
  }

  if (isPlaying && id && seasonNumber && episodeNumber) {
    return (
      <PlayerSelector
        tmdbId={id}
        mediaType="tv"
        season={parseInt(seasonNumber)}
        episode={parseInt(episodeNumber)}
        title={`${show.name} - S${episode.season_number}E${episode.episode_number}`}
        onClose={handleClosePlayer}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50 to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <GlobalNavbar />
      
      <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isMobile ? 'px-4 py-4' : ''}`}>
        {/* Back Navigation */}
        <div className="mb-6 space-y-2">
          <Link
            to={`/tv/${id}`}
            className="inline-flex items-center space-x-2 text-[var(--grad-from)] dark:text-[var(--grad-from)] hover:text-[var(--grad-to)] dark:hover:text-[var(--grad-to)] transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.back_to_show || 'Back to Show'}</span>
          </Link>
          <Link
            to={`/tv/${id}/season/${seasonNumber}`}
            className="inline-flex items-center space-x-2 text-[var(--grad-from)] dark:text-[var(--grad-from)] hover:text-[var(--grad-to)] dark:hover:text-[var(--grad-to)] transition-colors text-sm ml-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.back_to_season || 'Back to Season'}</span>
          </Link>
        </div>

        {/* Episode Details */}
        <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-pink-200/50 dark:border-gray-700/50 overflow-hidden ${isMobile ? 'rounded-xl' : ''}`}>
          {/* Episode Image */}
          {episode.still_path && (
            <div className={`w-full ${isMobile ? 'h-48' : 'h-64'} overflow-hidden`}>
              <img
                src={tmdb.getImageUrl(episode.still_path, 'w780')}
                alt={episode.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className={isMobile ? 'p-4' : 'p-8'}>
            {/* Episode Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className={`font-bold text-gray-900 dark:text-white mb-2 ${isMobile ? 'text-lg' : 'text-3xl'}`}>
                    {show.name}
                  </h1>
                  <h2 className={`font-semibold text-[var(--grad-from)] dark:text-[var(--grad-from)] mb-2 ${isMobile ? 'text-base' : 'text-xl'}`}>
                    {t.season} {episode.season_number}, {t.episode || 'Episode'} {episode.episode_number}
                  </h2>
                  <h3 className={`font-medium text-gray-700 dark:text-gray-300 ${isMobile ? 'text-sm' : 'text-lg'}`}>
                    {episode.name}
                  </h3>
                </div>
                
                {episode.vote_average > 0 && (
                  <div className="flex items-center bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full ml-4">
                    <Star className="w-4 h-4 mr-1" />
                    <span className="text-sm font-semibold">{episode.vote_average.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Episode Meta */}
              <div className={`flex flex-wrap items-center gap-4 mb-6 text-gray-600 dark:text-gray-300 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {episode.air_date && (
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(episode.air_date).toLocaleDateString()}
                  </div>
                )}
                {episode.runtime && (
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {episode.runtime} {t.minutes || 'minutes'}
                  </div>
                )}
              </div>

              {/* Watch Button */}
              <button
                onClick={handleWatchEpisode}
                className={`bg-gradient-to-r from-[var(--grad-from)] to-[var(--grad-to)] text-white font-semibold hover:opacity-90 transition-all flex items-center space-x-2 shadow-lg ${isMobile ? 'px-4 py-2 rounded-lg text-sm' : 'px-6 py-3 rounded-xl'}`}
              >
                <Play className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
                <span>{t.action_watch}</span>
              </button>
            </div>

            {/* Episode Overview */}
            {episode.overview && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className={`font-semibold text-gray-900 dark:text-white mb-3 ${isMobile ? 'text-sm' : 'text-lg'}`}>
                  {t.overview || 'Overview'}
                </h4>
                <p className={`text-gray-700 dark:text-gray-300 leading-relaxed ${isMobile ? 'text-sm' : ''}`}>
                  {episode.overview}
                </p>
              </div>
            )}

            {/* Cast List */}
            {cast.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                <h4 className={`font-semibold text-gray-900 dark:text-white mb-4 ${isMobile ? 'text-sm' : 'text-lg'}`}>
                  {t.cast || 'Cast'}
                </h4>
                <div className="flex flex-wrap gap-4 overflow-x-auto">
                  {cast.slice(0, 12).map((member) => (
                    <div key={member.id} className="w-20 text-center">
                      <img
                        src={
                          member.profile_path
                            ? tmdb.getImageUrl(member.profile_path, 'w185')
                            : (() => {
                                if (member.gender === 1) return "/female.png"
                                if (member.gender === 2) return "/male.png"
                                return "/unknown.png"
                              })()
                        }
                        alt={member.name}
                        className="w-20 h-28 rounded-lg object-cover mb-1"
                      />
                      <div className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                        {member.name}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {member.character}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default EpisodeDetail;