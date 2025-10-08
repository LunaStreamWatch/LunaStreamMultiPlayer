import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';

interface PlayerSelectorProps {
  tmdbId: string | number;
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
  title: string;
  onClose: () => void;
}

type PlayerType = 'videasy' | 'vidify' | 'vidplus' | 'vidfast';

const PlayerSelector: React.FC<PlayerSelectorProps> = ({
  tmdbId,
  mediaType,
  season,
  episode,
  title,
  onClose
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerType>('videasy');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const players = [
    { id: 'videasy' as PlayerType, name: 'Videasy' },
    { id: 'vidify' as PlayerType, name: 'Vidify' },
    { id: 'vidplus' as PlayerType, name: 'VidPlus' },
    { id: 'vidfast' as PlayerType, name: 'VidFast' }
  ];

  const getPlayerUrl = (): string => {
    const color = 'fbc9ff';

    if (mediaType === 'movie') {
      switch (selectedPlayer) {
        case 'videasy':
          return `https://player.videasy.net/movie/${tmdbId}?color=${color}&chromecast=false&nextEpisode=true&autoplayNextEpisode=true`;
        case 'vidify':
          return `https://player.vidify.top/embed/movie/${tmdbId}?primarycolor=${color}&chromecast=false&poster=true`;
        case 'vidplus':
          return `https://player.vidplus.to/embed/movie/${tmdbId}?primarycolor=${color}&chromecast=false&nextButton=true&autoNext=true`;
        case 'vidfast':
          return `https://vidfast.pro/movie/${tmdbId}?theme=${color}&chromecast=false&nextButton=true&autoNext=true&poster=true`;
        default:
          return `https://player.videasy.net/movie/${tmdbId}?color=${color}&chromecast=false`;
      }
    } else {
      switch (selectedPlayer) {
        case 'videasy':
          return `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}?color=${color}&chromecast=false&nextEpisode=true&autoplayNextEpisode=true`;
        case 'vidify':
          return `https://player.vidify.top/embed/tv/${tmdbId}/${season}/${episode}?primarycolor=${color}&chromecast=false&poster=true`;
        case 'vidplus':
          return `https://player.vidplus.to/embed/tv/${tmdbId}/${season}/${episode}?primarycolor=${color}&chromecast=false&nextButton=true&autoNext=true`;
        case 'vidfast':
          return `https://vidfast.pro/tv/${tmdbId}/${season}/${episode}?theme=${color}&chromecast=false&nextButton=true&autoNext=true&poster=true`;
        default:
          return `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}?color=${color}&chromecast=false`;
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="absolute top-6 right-6 z-10 flex items-center space-x-4">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg transition-all"
          >
            <span>{players.find(p => p.id === selectedPlayer)?.name}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full mt-2 right-0 bg-gray-900 rounded-lg shadow-xl overflow-hidden min-w-[160px] border border-gray-700">
              {players.map((player) => (
                <button
                  key={player.id}
                  onClick={() => {
                    setSelectedPlayer(player.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors ${
                    selectedPlayer === player.id
                      ? 'bg-gradient-to-r from-[rgb(251,201,255)] to-[rgb(219,151,226)] text-white'
                      : 'text-gray-300'
                  }`}
                >
                  {player.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 transition-colors"
          aria-label="Close Player"
        >
          <X className="w-8 h-8" />
        </button>
      </div>

      <iframe
        key={selectedPlayer}
        src={getPlayerUrl()}
        className="fixed top-0 left-0 w-full h-full border-0"
        title={title}
        allowFullScreen
        allow="encrypted-media"
      />
    </div>
  );
};

export default PlayerSelector;
