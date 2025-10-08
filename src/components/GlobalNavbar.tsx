import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Film,
  Archive,
  Home,
  Search,
  Compass,
  Heart,
  Flower,
  Menu,
  X,
} from "lucide-react";
import { SettingsMenu } from "./SettingsMenu";

const GlobalNavbar: React.FC = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/search", label: "Search", icon: Search },
    { path: "/anime", label: "Anime", icon: Flower },
    { path: "/discover", label: "Discover", icon: Compass },
    { path: "/vault", label: "Vault", icon: Archive },
  ];

  return (
    <>
      <nav className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-pink-200/50 dark:border-gray-600/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center h-16">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <Film className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                LunaStream
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-1 absolute left-1/2 transform -translate-x-1/2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
                      isActive(item.path)
                        ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg"
                        : "text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-pink-600 dark:hover:text-pink-400"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="hidden md:flex items-center ml-auto space-x-3 z-10">
              <Link
                to="/donate"
                className="p-2 rounded-lg text-pink-500 hover:text-pink-600 transition flex items-center"
                title="Donate"
              >
                <Heart className="w-5 h-5" />
              </Link>

              <SettingsMenu />
            </div>

            <div className="md:hidden ml-auto flex items-center">
              <button
                onClick={() => setMenuOpen(true)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />

          <div className="relative z-50 w-72 max-w-full h-full bg-white dark:bg-gray-900 p-6 space-y-6 overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Menu</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                      isActive(item.path)
                        ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-auto flex items-center justify-start space-x-3">
              <Link
                to="/donate"
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-lg text-pink-500 hover:text-pink-600 transition flex items-center"
                title="Donate"
              >
                <Heart className="w-5 h-5" />
              </Link>

              <div className="flex items-center h-full">
                <SettingsMenu />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalNavbar;
