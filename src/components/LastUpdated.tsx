import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Film } from 'lucide-react';
import GlobalNavbar from './GlobalNavbar';

const LastUpdated: React.FC = () => {
  const lastUpdated = new Date(document.lastModified);
  const localTime = lastUpdated.toLocaleString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      <GlobalNavbar />

      {/* Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-200/50 dark:border-gray-700/50 p-8 transition-colors duration-300">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">{t.last_updated_title || 'Page Last Updated'}</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 transition-colors duration-300">{t.last_updated_message || 'This page was last updated on:'}</p>
          <p className="text-xl font-semibold text-gray-800 dark:text-gray-200 transition-colors duration-300">{localTime}</p>
        </div>
      </div>
    </div>
  );
};

export default LastUpdated;
