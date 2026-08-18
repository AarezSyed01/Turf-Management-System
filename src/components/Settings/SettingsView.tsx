import React, { useState } from 'react';
import { FacilitySettings } from '../../types.ts';
import { updateFacilitySettings, seedSampleData } from '../../lib/db.ts';
import {
  Settings,
  Building,
  CheckCircle2,
  Sparkles,
  Phone,
  MapPin,
  Clock,
  IndianRupee,
  Save,
} from 'lucide-react';

interface SettingsViewProps {
  settings: FacilitySettings;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings }) => {
  // Facility Form State
  const [facilityName, setFacilityName] = useState(settings.facilityName);
  const [ownerName, setOwnerName] = useState(settings.ownerName || '');
  const [phone, setPhone] = useState(settings.phone || '');
  const [address, setAddress] = useState(settings.address || '');
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || '₹');
  const [openingHour, setOpeningHour] = useState(settings.openingHour || 6);
  const [closingHour, setClosingHour] = useState(settings.closingHour || 23);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sample data seeder
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSaveFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateFacilitySettings({
        facilityName: facilityName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        currencySymbol: currencySymbol.trim() || '₹',
        openingHour: Number(openingHour),
        closingHour: Number(closingHour),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeed = async () => {
    if (
      !confirm(
        'This will populate sample turfs, slots for today/tomorrow, bookings, and payments. Continue?'
      )
    ) {
      return;
    }
    setIsSeeding(true);
    try {
      await seedSampleData();
      alert('Sample turf facility loaded successfully! Check Dashboard and Slots.');
    } catch (error) {
      console.error(error);
      alert('Failed to seed sample data.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-emerald-600" />
          Facility & Operations Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure turf facility metadata, operating hours, currency format, and data setup.
        </p>
      </div>

      {/* Facility Configuration Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600" />
              Turf Facility Profile
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These details appear on dashboard headers and booking receipts.
            </p>
          </div>

          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Saved!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveFacility} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Facility / Arena Name *
              </label>
              <input
                type="text"
                required
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Owner / Manager Name
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Aarez Ali"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Facility Contact Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Address & Location
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Near Sports Complex, Ring Road, Mumbai"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Currency Symbol
              </label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Default Opening Hour
              </label>
              <select
                value={openingHour}
                onChange={(e) => setOpeningHour(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const p = i >= 12 ? 'PM' : 'AM';
                  const h = i % 12 === 0 ? 12 : i % 12;
                  return (
                    <option key={i} value={i}>
                      {h}:00 {p}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Default Closing Hour
              </label>
              <select
                value={closingHour}
                onChange={(e) => setClosingHour(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const p = i >= 12 ? 'PM' : 'AM';
                  const h = i % 12 === 0 ? 12 : i % 12;
                  return (
                    <option key={i} value={i}>
                      {h}:00 {p}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Facility Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Demo Seed Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Seed Sample Data
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Load realistic turfs, slots, bookings with partial/full payments to test the system.
          </p>
        </div>

        <button
          onClick={handleSeed}
          disabled={isSeeding}
          className="px-4 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
        >
          {isSeeding ? 'Seeding Data...' : '⚡ Seed Demo Data'}
        </button>
      </div>
    </div>
  );
};
