import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Calendar, Film, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Movie, TVShow } from '../types';

type MediaItem = (Movie | TVShow) & { media_type: 'movie' | 'tv'; popularity: number };

type MobileSearchResultsProps = {
  query: string;
  results: MediaItem[];
  loading: boolean;
  error: string | null;
  warningVisible: boolean;
  setWarningVisible: (visible: boolean) => void;
  sortBy: 'score' | 'popularity';
  setSortBy: (sortBy: 'score' | 'popularity') => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  resultsPerPage: number;
  getTitle: (item: MediaItem) => string;
  getDate: (item: MediaItem) => string | undefined;
  getLink: (item: MediaItem) => string;
};

const SearchResultsMobile: React.FC<MobileSearchResultsProps> = ({
  query,
  results,
  loading,
  error,
  warningVisible,
  setWarningVisible,
  sortBy,
  setSortBy,
  currentPage,
  setCurrentPage,
  resultsPerPage,
  getTitle,
  getDate,
  getLink,
}) => {
  const totalLocalPages = Math.ceil(results.length / resultsPerPage);
  const startIdx = (currentPage - 1) * resultsPerPage;
  const paginatedResults = results.slice(startIdx, startIdx + resultsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50 to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300 px-4 py-4">

      {/* Warning modal */}
      {warningVisible && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000] flex items-center justify-center px-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-lg w-full text-center">
            <h2 className="text-3xl font-bold mb-4 text-[var(--grad-from)] dark:text-[var(--grad-from)]">Haiii!</h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">Please stay safe online and avoid inappropriate content.</p>
            <button
              onClick={() => setWarningVisible(false)}
              className="bg-[var(--grad-from)] hover:bg-[var(--grad-to)] text-white font-semibold px-6 py-3 rounded-lg shadow-lg focus:ring-4 focus:ring-blue-400"
            >
              I understand, continue
            </button>
          </div>
        </div>
      )}

      {/* Loading & error */}
      {loading && <p className="mt-8 text-center text-gray-600 dark:text-gray-400">Loading...</p>}
      {error && <p className="mt-8 text-center text-red-600 dark:text-red-400 font-semibold">{error}</p>}

      {/* Results list */}
      {!loading && !error && paginatedResults.length > 0 && (
        <ul className="flex flex-col space-y-4 mt-4">
          {paginatedResults.map((item) => (
            <li
              key={`${item.media_type}-${item.id}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <Link
                to={getLink(item)}
                className="flex gap-4 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={`${getTitle(item)} (${getDate(item)?.slice(0, 4) || 'N/A'}) - ${item.media_type.toUpperCase()}`}
              >
                {item.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w154${item.poster_path}`}
                    alt={getTitle(item)}
                    className="w-24 h-36 object-cover rounded-md flex-shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-24 h-36 bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs rounded-md flex-shrink-0">
                    No Poster
                  </div>
                )}

                <div className="flex flex-col flex-grow min-w-0">
                  <h3
                    className="text-lg font-semibold text-gray-900 dark:text-white truncate"
                    title={getTitle(item)}
                  >
                    {getTitle(item)}
                  </h3>

                  <div className="flex items-center space-x-3 text-xs text-gray-600 dark:text-gray-300 font-semibold mt-1">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{getDate(item) ? getDate(item).slice(0, 4) : 'N/A'}</span>
                    </span>

                    <span className="flex items-center space-x-1 text-yellow-500">
                      <Star className="w-4 h-4" />
                      <span>{item.vote_average?.toFixed(1) || '–'}</span>
                    </span>

                    <span className="flex items-center space-x-1 uppercase">
                      <Film className="w-4 h-4" />
                      <span>{item.media_type}</span>
                    </span>
                  </div>

                  <p
                    className="mt-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-3 overflow-hidden"
                    title={item.overview}
                  >
                    {item.overview || 'N/A'}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {totalLocalPages > 1 && (
        <div className="flex flex-col items-center justify-center mt-8 space-y-4">
          <nav aria-label="Pagination" className="flex flex-wrap justify-center gap-2">
            {/* Go to First Page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-md bg-[var(--grad-from)] text-white font-semibold hover:bg-[var(--grad-to)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <ChevronsLeft />
            </button>
            {/* Go to Previous Page */}
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-md bg-[var(--grad-from)] text-white font-semibold hover:bg-[var(--grad-to)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <ChevronLeft />
            </button>
            {/* Render clickable page numbers */}
            {(() => {
              const pagesToShow = 7;
              let startPage = Math.max(1, currentPage - Math.floor(pagesToShow / 2));
              let endPage = Math.min(totalLocalPages, startPage + pagesToShow - 1);

              // Adjust startPage if we're at the end
              if (endPage - startPage + 1 < pagesToShow) {
                startPage = Math.max(1, endPage - pagesToShow + 1);
              }

              const pageNumbers = [];
              for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    aria-current={currentPage === i ? 'page' : undefined}
                    className={`px-4 py-2 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                      currentPage === i
                        ? 'bg-[var(--grad-from)] text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-pink-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {i}
                  </button>
                );
              }
              return pageNumbers;
            })()}
            {/* Go to Next Page */}
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalLocalPages))}
              disabled={currentPage === totalLocalPages}
              className="px-4 py-2 rounded-md bg-[var(--grad-from)] text-white font-semibold hover:bg-[var(--grad-to)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <ChevronRight />
            </button>
            {/* Go to Last Page */}
            <button
              onClick={() => setCurrentPage(totalLocalPages)}
              disabled={currentPage === totalLocalPages}
              className="px-4 py-2 rounded-md bg-[var(--grad-from)] text-white font-semibold hover:bg-[var(--grad-to)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <ChevronsRight />
            </button>
          </nav>
        </div>
      )}
      
      {/* No results */}
      {!loading && !error && results.length === 0 && (
        <p className="mt-12 text-center text-gray-600 dark:text-gray-400">
          No results found
        </p>
      )}
    </div>
  );
};

export default SearchResultsMobile;