import React, { useEffect, useState } from 'react';
import { Film, Play, Star, Zap, SkipForward } from 'lucide-react';
import { useAnimation } from './AnimationContext';

interface IntroAnimationProps {
  onComplete: () => void;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const { settings } = useAnimation();
  const [isExiting, setIsExiting] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [skipClicked, setSkipClicked] = useState(false);

  const handleSkip = () => {
    setSkipClicked(true);
    setIsExiting(true);
    setTimeout(onComplete, 600);
  };

  useEffect(() => {
    if (!settings.enableWelcomeAnimation || skipClicked) {
      return;
    }

    const phases = [
      { duration: 500, action: () => setAnimationPhase(1) }, // Initial scale up
      { duration: 800, action: () => setAnimationPhase(2) }, // Gentle fade in
      { duration: 1000, action: () => setAnimationPhase(3) }, // Settle and glow
      { duration: 2000, action: () => setIsExiting(true) },  // Exit animation
      { duration: 600, action: () => onComplete() }          // Complete
    ];

    let totalDelay = 0;
    const timers = phases.map(phase => {
      totalDelay += phase.duration;
      return setTimeout(phase.action, totalDelay - phase.duration);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [settings.enableWelcomeAnimation, onComplete, skipClicked]);

  if (!settings.enableWelcomeAnimation) {
    return null;
  }

  const getLogoTransform = () => {
    switch (animationPhase) {
      case 0: return 'scale(0) rotate(0deg)';
      case 1: return 'scale(1.2) rotate(0deg)';
      case 2: return 'scale(1) rotate(0deg)';
      case 3: return 'scale(1) rotate(0deg)';
      default: return 'scale(1) rotate(0deg)';
    }
  };

  const getGlowOpacity = () => {
    switch (animationPhase) {
      case 0: return 0;
      case 1: return 0.4;
      case 2: return 0.7;
      case 3: return 0.8;
      default: return 0.8;
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 ${
        isExiting ? 'animate-fade-out-background' : ''
      }`}
    >
      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute top-8 right-8 z-20 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20 transition-all duration-200"
      >
        <SkipForward className="w-4 h-4" />
        Skip
      </button>

      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10" />
      </div>

      {/* Main logo with high-quality animation */}
      <div className="relative z-10">
        <div
          className="transition-all duration-300 ease-out"
          style={{
            transform: getLogoTransform(),
            transformOrigin: 'center'
          }}
        >
          <div className="relative">
            {/* Primary glow effect */}
            <div
              className="absolute inset-0 rounded-full blur-3xl transition-all duration-500"
              style={{
                background: `radial-gradient(circle, rgba(59, 130, 246, ${getGlowOpacity()}) 0%, rgba(147, 197, 253, ${getGlowOpacity() * 0.8}) 50%, transparent 70%)`,
                transform: `scale(${1 + getGlowOpacity()})`
              }}
            />

            {/* Secondary inner glow */}
            <div
              className="absolute inset-4 rounded-full blur-2xl transition-all duration-400"
              style={{
                background: `radial-gradient(circle, rgba(6, 182, 212, ${getGlowOpacity() * 0.6}) 0%, rgba(56, 189, 248, ${getGlowOpacity() * 0.4}) 100%)`,
                animation: animationPhase >= 2 ? 'pulse 3s ease-in-out infinite' : 'none'
              }}
            />

            {/* Main film icon with high quality styling */}
            <div className="relative z-10 p-8">
              <Film
                className="w-32 h-32 text-white drop-shadow-2xl filter contrast-110 brightness-110"
                style={{
                  filter: `drop-shadow(0 0 ${getGlowOpacity() * 20}px rgba(59, 130, 246, ${getGlowOpacity()}))`
                }}
              />
            </div>

            {/* Sparkle effects */}
            {animationPhase >= 2 && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={`sparkle-${i}`}
                    className="absolute w-1 h-1 bg-cyan-200 rounded-full animate-ping"
                    style={{
                      left: `${40 + Math.sin(i * 45 * Math.PI / 180) * 70}px`,
                      top: `${40 + Math.cos(i * 45 * Math.PI / 180) * 70}px`,
                      animationDelay: `${i * 0.3}s`,
                      animationDuration: '2s'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default IntroAnimation;