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
      { duration: 800, action: () => setAnimationPhase(1) }, // Bounce in
      { duration: 1200, action: () => setAnimationPhase(2) }, // Settle
      { duration: 2000, action: () => setAnimationPhase(3) }, // Zoom out and fade
      { duration: 1000, action: () => onComplete() }          // Complete
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
      case 0: return 'scale(0) translateY(50px)';
      case 1: return 'scale(1.1) translateY(-10px)';
      case 2: return 'scale(1) translateY(0px)';
      case 3: return 'scale(1.5) translateY(0px)';
      default: return 'scale(1) translateY(0px)';
    }
  };

  const getLogoOpacity = () => {
    switch (animationPhase) {
      case 0: return 0;
      case 1: return 1;
      case 2: return 1;
      case 3: return 0;
      default: return 1;
    }
  };


  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black ${
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


      {/* Main logo with high-quality animation */}
      <div className="relative z-10">
        <div
          className="transition-all duration-500 ease-out"
          style={{
            transform: getLogoTransform(),
            opacity: getLogoOpacity(),
            transformOrigin: 'center'
          }}
        >
          <Film className="w-32 h-32 text-white" />
        </div>
      </div>

    </div>
  );
};

export default IntroAnimation;