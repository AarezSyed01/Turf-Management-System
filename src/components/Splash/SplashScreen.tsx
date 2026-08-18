import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LandPlot, ShieldCheck, Zap } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  durationMs = 3000,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress bar animation interval
    const intervalTime = 30;
    const step = (intervalTime / durationMs) * 100;
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    // Trigger exit animation shortly before full duration
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, durationMs - 350);

    // Final complete callback after duration
    const finishTimer = setTimeout(() => {
      onComplete();
    }, durationMs);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(hideTimer);
      clearTimeout(finishTimer);
    };
  }, [durationMs, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="turfos-splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-[#062017] to-slate-950 text-white select-none overflow-hidden"
        >
          {/* Subtle Ambient Stadium Light & Field Glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
            
            {/* Subtle Pitch Grid Lines Background */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md w-full">
            {/* Animated Logo Emblem */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative mb-6"
            >
              {/* Outer Glow Ring */}
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-3xl blur-md opacity-40 animate-pulse" />
              
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 rounded-3xl p-0.5 border border-emerald-400/40 shadow-2xl flex items-center justify-center">
                <div className="w-full h-full bg-slate-900/60 backdrop-blur-md rounded-[22px] flex items-center justify-center relative overflow-hidden">
                  {/* Decorative Pitch Stripe */}
                  <div className="absolute inset-x-0 h-1/2 top-0 bg-emerald-500/10" />
                  
                  <motion.div
                    initial={{ rotate: -15, scale: 0.8 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
                    className="relative flex items-center justify-center"
                  >
                    <LandPlot className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-400" strokeWidth={2.2} />
                    <Zap className="w-4 h-4 text-emerald-300 absolute -top-1 -right-1 fill-emerald-300" />
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Main Welcome Heading */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="space-y-2"
            >
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
                <span>Welcome to</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
                  TurfOS
                </span>
              </h1>

              {/* Subheading requested by user: "By AR Web Solutions" */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.4 }}
                className="flex items-center justify-center gap-1.5 pt-1"
              >
                <div className="h-[1px] w-6 bg-gradient-to-r from-transparent to-emerald-500/50" />
                <h2 className="text-xs sm:text-sm font-semibold tracking-widest text-emerald-400 uppercase">
                  By AR Web Solutions
                </h2>
                <div className="h-[1px] w-6 bg-gradient-to-l from-transparent to-emerald-500/50" />
              </motion.div>
            </motion.div>

            {/* Tagline Pill */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.65, duration: 0.4 }}
              className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/20 text-slate-300 text-xs font-medium backdrop-blur-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Smart Arena & Slot Operating System</span>
            </motion.div>

            {/* Modern Athletic Stadium & Radar Pulse Loader */}
            <div className="mt-8 flex flex-col items-center gap-3">
              {/* Spinning Ring & Radar Pulse Core */}
              <div className="relative w-14 h-14 flex items-center justify-center">
                {/* Outer pulsing ring */}
                <motion.div
                  animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-full bg-emerald-500/20 blur-sm"
                />

                {/* Rotating Conic Gradient Spinner */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 rounded-full p-[2.5px] bg-gradient-to-tr from-emerald-500 via-teal-300 to-transparent"
                >
                  <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center" />
                </motion.div>

                {/* Inner Glowing Core */}
                <div className="absolute w-4 h-4 bg-gradient-to-br from-emerald-400 to-teal-300 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-pulse" />
              </div>

              {/* Dynamic Status Ticker */}
              <div className="text-center space-y-1">
                <p className="text-xs font-medium text-emerald-300/90 tracking-wide">
                  {progress < 30
                    ? 'Initializing TurfOS Arena...'
                    : progress < 65
                    ? 'Loading Slots & Facilities...'
                    : progress < 90
                    ? 'Syncing Bookings & Payments...'
                    : 'System Ready'}
                </p>

                {/* Segmented Stadium Light Dots */}
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  {[0, 25, 50, 75, 100].map((step, idx) => (
                    <motion.div
                      key={step}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        progress >= step
                          ? 'w-4 bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                          : 'w-1.5 bg-slate-800'
                      }`}
                      animate={
                        progress >= step
                          ? { opacity: [0.7, 1, 0.7] }
                          : { opacity: 0.4 }
                      }
                      transition={{ duration: 1, repeat: Infinity, delay: idx * 0.15 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
