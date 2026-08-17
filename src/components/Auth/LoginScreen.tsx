import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ShieldCheck, Lock, LogIn, KeyRound, Sparkles, CheckCircle2, Trophy } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginWithGoogle, loginWithOwnerPin } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!pin.trim()) {
      setError('Please enter your owner passcode or PIN');
      return;
    }

    const success = loginWithOwnerPin(pin);
    if (!success) {
      setError('Invalid owner passcode. Default passcode is 1234.');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err?.message || 'Google sign-in was cancelled or failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient turf lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-4 shadow-inner">
            <Trophy className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Turf Owner Portal
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Admin management system for turf scheduling, bookings & revenue
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs sm:text-sm flex items-start gap-2.5">
            <span className="text-rose-400 font-bold">!</span>
            <span>{error}</span>
          </div>
        )}

        {/* Pin Form */}
        <form onSubmit={handlePinSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Owner Passcode / PIN
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter passcode (Default: 1234)"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" /> Default: <strong className="text-emerald-400 font-mono">1234</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setPin('1234');
                  loginWithOwnerPin('1234');
                }}
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 cursor-pointer"
              >
                Auto-fill & Enter
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Enter Owner Dashboard</span>
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <span className="relative bg-slate-900 px-3 text-xs uppercase tracking-wider text-slate-500">
            or sign in with
          </span>
        </div>

        {/* Google Login Option */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoggingIn}
          type="button"
          className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.5.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
            />
          </svg>
          {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
        </button>

        {/* Feature badges footer */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Owner-Only Access</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Live Real-time Sync</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Mobile-First Controls</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Zero Double Booking</span>
          </div>
        </div>
      </div>
    </div>
  );
};
