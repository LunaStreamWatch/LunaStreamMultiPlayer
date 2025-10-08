import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Cog, Moon, Sun, Wand2, X } from "lucide-react";
import { AnimationSettingsService, type AnimationSettings } from "../services/animationSettings";

const storage = {
  get: (k: string) => {
    try { return localStorage.getItem(k) } catch { return null }
  },
  set: (k: string, v: string) => {
    try { localStorage.setItem(k, v) } catch { /* noop */ }
  }
}

export const SettingsMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => (document.documentElement.classList.contains("dark") ? "dark" : (storage.get("theme") as any) || "light"));
  const ref = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"theme" | "visuals">("theme");
  const [animationSettings, setAnimationSettings] = useState<AnimationSettings>(
    AnimationSettingsService.getSettings()
  );

  const handleAnimationSettingChange = (
    key: keyof AnimationSettings,
    value: boolean
  ) => {
    const newSettings = { ...animationSettings, [key]: value };
    setAnimationSettings(newSettings);
    AnimationSettingsService.saveSettings(newSettings);
  };

  const resetAll = () => {
    setTheme("light");
    const newAnimationSettings = { enableWelcomeAnimation: false };
    setAnimationSettings(newAnimationSettings);
    AnimationSettingsService.saveSettings(newAnimationSettings);
    try {
      localStorage.removeItem("theme");
    } catch {}
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      const prevBodyTouch = (document.body.style as any).touchAction;
      const prevHtmlOverscroll = (document.documentElement.style as any).overscrollBehavior;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      (document.body.style as any).touchAction = 'none';
      (document.documentElement.style as any).overscrollBehavior = 'contain';
      return () => {
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
        (document.body.style as any).touchAction = prevBodyTouch;
        (document.documentElement.style as any).overscrollBehavior = prevHtmlOverscroll;
      };
    }
  }, [open]);

  useEffect(() => {
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    storage.set("theme", theme);
  }, [theme]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Open settings"
      >
        <Cog className="w-5 h-5" />
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[9999]" aria-modal="true" role="dialog">
          <div onClick={() => setOpen(false)} aria-label="Close settings overlay" className="fixed inset-0 bg-black/70 backdrop-blur-sm" />

          <div ref={ref} className="fixed inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl sm:rounded-2xl rounded-none bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/50 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh]">
              <div className="sticky top-0 z-10 px-4 py-3 border-b border-gray-200 dark:border-gray-700/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-white">
                    <Cog className="w-4 h-4" /> Settings
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={resetAll} className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">Reset</button>
                    <button onClick={() => setOpen(false)} aria-label="Close settings" className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                      <X className="w-5 h-5 text-gray-600 dark:text-gray-200" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:hidden">
                  <button onClick={() => setTab('theme')} className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-sm text-gray-700 dark:text-gray-200 ${tab==='theme'? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    <Moon className="w-4 h-4"/> Theme
                  </button>
                  <button onClick={() => setTab('visuals')} className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-sm text-gray-700 dark:text-gray-200 ${tab==='visuals'? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    <Wand2 className="w-4 h-4"/> Visuals
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 sm:grid-cols-[180px,1fr] gap-4">
                  <div className="hidden sm:flex flex-col gap-2">
                    <button onClick={() => setTab('theme')} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-gray-700 dark:text-gray-200 ${tab==='theme'? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                      <Moon className="w-4 h-4"/> Theme
                    </button>
                    <button onClick={() => setTab('visuals')} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-gray-700 dark:text-gray-200 ${tab==='visuals'? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                      <Wand2 className="w-4 h-4"/> Visuals
                    </button>
                  </div>
                  <div>
                    {tab === 'theme' && (
                      <div className="space-y-3">
                        <div className="text-sm font-semibold text-gray-700 dark:text-white">Choose theme</div>
                        <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => setTheme("light")} className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border text-gray-700 dark:text-gray-200 ${theme==='light'? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                            <Sun className="w-4 h-4" /> Light
                          </button>
                          <button onClick={() => setTheme("dark")} className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border text-gray-700 dark:text-gray-200 ${theme==='dark'? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                            <Moon className="w-4 h-4" /> Dark
                          </button>
                        </div>
                      </div>
                    )}

                    {tab === 'visuals' && (
                      <div className="space-y-4">
                        <div className="text-sm font-semibold text-gray-700 dark:text-white mb-4">Visual Settings</div>
                        <div className="space-y-6">
                          <label className="flex items-center justify-between">
                            <div>
                              <span className="text-sm text-gray-700 dark:text-gray-300">Welcome Animation</span>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Show animation when visiting home page</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={animationSettings.enableWelcomeAnimation}
                              onChange={(e) => handleAnimationSettingChange('enableWelcomeAnimation', e.target.checked)}
                              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}

export default SettingsMenu;
