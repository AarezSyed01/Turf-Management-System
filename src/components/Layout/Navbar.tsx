import React from 'react';
import { Plus, Calendar, ShieldCheck, Edit3 } from 'lucide-react';
import { FacilitySettings } from '../../types.ts';

interface NavbarProps {
  settings: FacilitySettings;
  onOpenNewBooking: () => void;
  onOpenTurfSetup?: () => void;
  activeTurfCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onOpenNewBooking,
  onOpenTurfSetup,
  activeTurfCount,
}) => {
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 transition-colors shadow-xs">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Facility Branding */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-base sm:text-lg shadow-xs shrink-0">
            ⚽
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenTurfSetup}
                className="group flex items-center gap-1.5 text-left text-sm sm:text-lg font-bold text-slate-900 tracking-tight truncate max-w-[140px] xs:max-w-[190px] sm:max-w-xs hover:text-emerald-700 transition-colors cursor-pointer"
                title="Click to rename turf or arena"
              >
                <span className="truncate">{settings.facilityName || 'Turf Management'}</span>
                <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {activeTurfCount} {activeTurfCount === 1 ? 'Turf' : 'Turfs'} Active
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{todayFormatted}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div
            onClick={onOpenTurfSetup}
            className="hidden md:flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer transition-colors"
            title="Edit facility & owner details"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{settings.ownerName || 'Owner Admin'}</span>
          </div>

          <button
            onClick={onOpenNewBooking}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-xs cursor-pointer min-h-[40px] touch-manipulation whitespace-nowrap"
            id="nav-new-booking-btn"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>New Booking</span>
          </button>
        </div>
      </div>
    </header>
  );
};
