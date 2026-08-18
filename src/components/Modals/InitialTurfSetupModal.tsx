import React, { useState } from 'react';
import { FacilitySettings } from '../../types.ts';
import { updateFacilitySettings } from '../../lib/db.ts';
import {
  LandPlot,
  ArrowRight,
  User,
  MapPin,
  X,
} from 'lucide-react';

interface InitialTurfSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSettings: FacilitySettings;
}

export const InitialTurfSetupModal: React.FC<InitialTurfSetupModalProps> = ({
  isOpen,
  onClose,
  existingSettings,
}) => {
  const [turfName, setTurfName] = useState(existingSettings.facilityName || '');
  const [ownerName, setOwnerName] = useState(existingSettings.ownerName || '');
  const [location, setLocation] = useState(existingSettings.address || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleProcessSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMessage(null);

    const tName = turfName.trim();
    const oName = ownerName.trim();
    const loc = location.trim();

    if (!tName) {
      setErrorMessage('Please enter the turf name');
      return;
    }

    if (!oName) {
      setErrorMessage('Please enter the owner name');
      return;
    }

    setLoading(true);
    try {
      // Update facility organization settings (brand name, owner name, location)
      await updateFacilitySettings({
        facilityName: tName,
        ownerName: oName,
        address: loc || '',
        phone: existingSettings.phone || '',
        currencySymbol: existingSettings.currencySymbol || '₹',
        openingTime: existingSettings.openingTime || '06:00',
        closingTime: existingSettings.closingTime || '23:00',
        slotDurationMinutes: 60,
      });

      // Mark setup as completed in localStorage and close modal
      localStorage.setItem('turf_initial_setup_completed', 'true');
      onClose();
    } catch (error: any) {
      console.error('Failed to setup organization details:', error);
      setErrorMessage(
        error?.message || 'Unable to save turf details. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 sm:p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-xl font-bold border border-white/25 shrink-0">
              🏟️
            </div>
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-100 bg-white/15 px-2.5 py-0.5 rounded-full inline-block">
                Welcome to TurfOS
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-1">
                Turf Setup
              </h2>
            </div>
          </div>
          <p className="text-xs text-emerald-50 mt-1">
            Enter your turf name, owner name, and location to get started.
          </p>
        </div>

        {/* Setup Form */}
        <form onSubmit={handleProcessSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-500 hover:text-rose-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Turf Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <LandPlot className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Turf Name *</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={turfName}
              onChange={(e) => setTurfName(e.target.value)}
              placeholder="Enter turf name"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
              id="initial-setup-turf-name"
            />
          </div>

          {/* Owner Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Owner Name *</span>
            </label>
            <input
              type="text"
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Enter owner name"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
              id="initial-setup-owner-name"
            />
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Location</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
              id="initial-setup-location"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-emerald-700/20 cursor-pointer disabled:opacity-50 min-h-[42px]"
              id="initial-setup-submit-btn"
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </span>
              ) : (
                <>
                  <span>Save Turf</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

