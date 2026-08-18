import React, { useState } from 'react';
import { SportType, FacilitySettings } from '../../types.ts';
import { addTurf, updateFacilitySettings, generateSlotsForDate } from '../../lib/db.ts';
import {
  LandPlot,
  Trophy,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  User,
  Clock,
  IndianRupee,
  X,
} from 'lucide-react';

interface InitialTurfSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSettings: FacilitySettings;
  onSeedData?: () => void;
}

export const InitialTurfSetupModal: React.FC<InitialTurfSetupModalProps> = ({
  isOpen,
  onClose,
  existingSettings,
  onSeedData,
}) => {
  const [facilityName, setFacilityName] = useState(
    existingSettings.facilityName || 'Apex Sports Turf'
  );
  const [ownerName, setOwnerName] = useState(
    existingSettings.ownerName || 'Aarez Ali'
  );
  const [turfName, setTurfName] = useState('Main Football Turf (Pitch 1)');
  const [sport, setSport] = useState<SportType>('football');
  const [pricePerHour, setPricePerHour] = useState<number>(800);
  const [surface, setSurface] = useState('FIFA Quality Artificial Turf');
  const [phone, setPhone] = useState(existingSettings.phone || '+91 98765 43210');
  const [cityAddress, setCityAddress] = useState(
    existingSettings.address || 'Sports Complex, Ring Road'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const sportOptions: { type: SportType; label: string; icon: string; defaultSurface: string }[] = [
    { type: 'football', label: 'Football', icon: '⚽', defaultSurface: 'FIFA Artificial Turf (50mm)' },
    { type: 'cricket', label: 'Box Cricket', icon: '🏏', defaultSurface: 'Astro Turf with Net Enclosure' },
    { type: 'badminton', label: 'Badminton', icon: '🏸', defaultSurface: 'Synthetic BWF Mat Court' },
    { type: 'pickleball', label: 'Pickleball', icon: '🏓', defaultSurface: 'Pro Acrylic Hard Court' },
    { type: 'tennis', label: 'Tennis', icon: '🎾', defaultSurface: 'Clay / Hard Court' },
    { type: 'multisport', label: 'Multisport', icon: '🏆', defaultSurface: 'Multi-use Sports Surface' },
  ];

  const handleSportSelect = (selectedSport: SportType) => {
    setSport(selectedSport);
    const found = sportOptions.find((s) => s.type === selectedSport);
    if (found) {
      setSurface(found.defaultSurface);
      if (selectedSport === 'cricket') {
        setTurfName('Box Cricket Arena (Pitch A)');
        setPricePerHour(900);
      } else if (selectedSport === 'badminton') {
        setTurfName('Badminton Court 1');
        setPricePerHour(500);
      } else if (selectedSport === 'pickleball') {
        setTurfName('Pickleball Court A');
        setPricePerHour(600);
      } else if (selectedSport === 'football') {
        setTurfName('Main Football Turf (Pitch 1)');
        setPricePerHour(800);
      }
    }
  };

  const handleProcessSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMessage(null);

    const fName = facilityName.trim() || 'Apex Sports Arena';
    const oName = ownerName.trim() || 'Turf Owner';
    const tName = turfName.trim() || `${sport.toUpperCase()} Turf 1`;
    const rate = Number(pricePerHour) > 0 ? Number(pricePerHour) : 800;

    setLoading(true);
    try {
      // 1. Update facility settings with facility name and owner name
      await updateFacilitySettings({
        facilityName: fName,
        ownerName: oName,
        phone: phone.trim() || '+91 98765 43210',
        address: cityAddress.trim() || 'Sports Complex Arena',
        currencySymbol: existingSettings.currencySymbol || '₹',
        openingTime: existingSettings.openingTime || '06:00',
        closingTime: existingSettings.closingTime || '23:00',
        slotDurationMinutes: 60,
      });

      // 2. Add the first turf
      const newTurfId = await addTurf({
        name: tName,
        sport,
        pricePerHour: rate,
        surface: surface.trim() || 'Standard Sports Turf',
        size: sport === 'football' ? '5-a-side (90x50 ft)' : 'Standard Pitch',
        description: `Primary ${sport} arena at ${fName} managed by ${oName}`,
        isActive: true,
      });

      // 3. Generate slots for today so the schedule is immediately populated
      if (newTurfId) {
        const todayStr = new Date().toISOString().split('T')[0];
        try {
          await generateSlotsForDate({
            date: todayStr,
            turfId: newTurfId,
            turfName: tName,
            openingHour: 6,
            closingHour: 23,
            slotDurationMinutes: 60,
            pricePerHour: rate,
          });
        } catch (slotErr) {
          console.warn('Slot auto-generate warning:', slotErr);
        }
      }

      // Store completion in localStorage and close modal
      localStorage.setItem('turf_initial_setup_completed', 'true');
      onClose();
    } catch (error: any) {
      console.error('Failed to setup initial turf:', error);
      setErrorMessage(
        error?.message || 'Unable to save turf settings. Please check your network and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkipOrSample = async () => {
    localStorage.setItem('turf_initial_setup_completed', 'true');
    if (onSeedData) {
      await onSeedData();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-xl font-bold border border-white/25">
              🏟️
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100 bg-white/15 px-2.5 py-0.5 rounded-full">
                Welcome Onboarding
              </span>
              <h2 className="text-xl font-bold tracking-tight text-white mt-1">
                Setup Turf Name & Owner Details
              </h2>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-emerald-50 max-w-md">
            Enter your sports arena brand and owner name to personalize your booking engine and schedule.
          </p>
        </div>

        {/* Setup Form Body */}
        <form onSubmit={handleProcessSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-500 hover:text-rose-700 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Row 1: Facility / Arena Name & Owner Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Turf Complex Name *</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                placeholder="e.g. Apex Arena, Champion Turf"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
                id="initial-setup-facility-name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Owner / Manager Name *</span>
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Aarez Ali"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
                id="initial-setup-owner-name"
              />
            </div>
          </div>

          {/* Row 2: First Turf / Pitch Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <LandPlot className="w-3.5 h-3.5 text-emerald-600" />
              <span>First Turf / Court Name *</span>
            </label>
            <input
              type="text"
              required
              value={turfName}
              onChange={(e) => setTurfName(e.target.value)}
              placeholder="e.g. Football Turf 1 (Main Pitch), Box Cricket Arena A"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
              id="initial-setup-turf-name"
            />
          </div>

          {/* Row 3: Sport Type Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sport Category</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {sportOptions.map((opt) => {
                const isSelected = sport === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => handleSportSelect(opt.type)}
                    className={`py-2 px-1.5 rounded-xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-lg">{opt.icon}</span>
                    <span className="text-[11px] leading-tight truncate w-full">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 4: Price Per Hour & Surface */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                <span>Price per Hour ({existingSettings.currencySymbol || '₹'})</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">
                  {existingSettings.currencySymbol || '₹'}
                </span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  required
                  value={pricePerHour}
                  onChange={(e) => setPricePerHour(Number(e.target.value))}
                  className="w-full pl-8 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono font-bold"
                  id="initial-setup-price"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Surface / Spec</span>
              </label>
              <input
                type="text"
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
                placeholder="e.g. 50mm Artificial Grass"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Contact Details (Phone & City) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-500">Facility Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-500">Location / City</label>
              <input
                type="text"
                value={cityAddress}
                onChange={(e) => setCityAddress(e.target.value)}
                placeholder="Sector 4, Sports Arena"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Actions & Skip */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleSkipOrSample}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors cursor-pointer order-2 sm:order-1"
            >
              Load Demo Turfs & Bookings
            </button>

            <div className="flex items-center gap-2.5 w-full sm:w-auto order-1 sm:order-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Skip for now
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={(e) => handleProcessSubmit(e)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-emerald-700/20 cursor-pointer disabled:opacity-50"
                id="initial-setup-submit-btn"
              >
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Turf...</span>
                  </span>
                ) : (
                  <>
                    <span>Save & Launch Turf</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
