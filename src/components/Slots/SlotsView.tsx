import React, { useState } from 'react';
import { Turf, Slot, FacilitySettings } from '../../types.ts';
import {
  generateSlotsForDate,
  addCustomSlot,
  blockSlot,
  unblockSlot,
  updateSlotPrice,
} from '../../lib/db.ts';
import {
  time24To12,
  calculateDurationMinutes,
  formatDurationHuman,
  minutesTo24Hour,
  parseTimeToMinutes,
} from '../../lib/timeUtils.ts';
import {
  Grid,
  Calendar,
  Clock,
  Plus,
  Ban,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Tag,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Settings2,
  Timer,
} from 'lucide-react';

interface SlotsViewProps {
  turfs: Turf[];
  slots: Slot[];
  settings: FacilitySettings;
  onOpenNewBooking: (
    turfId?: string,
    slot?: Slot,
    defaultCustomer?: { name: string; phone: string },
    mode?: 'predefined' | 'custom'
  ) => void;
  onOpenBlockSlot: (slot: Slot) => void;
}

export const SlotsView: React.FC<SlotsViewProps> = ({
  turfs,
  slots,
  settings,
  onOpenNewBooking,
  onOpenBlockSlot,
}) => {
  const currency = settings.currencySymbol || '₹';
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedTurfId, setSelectedTurfId] = useState<string>(
    turfs.length > 0 ? turfs[0].id : 'all'
  );

  // Generator modal state
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [genTurfId, setGenTurfId] = useState<string>(turfs.length > 0 ? turfs[0].id : '');
  const [genDate, setGenDate] = useState<string>(todayStr);
  const [genOpeningHour, setGenOpeningHour] = useState<number>(6);
  const [genClosingHour, setGenClosingHour] = useState<number>(23);
  const [genDuration, setGenDuration] = useState<number>(60);
  const [genPrice, setGenPrice] = useState<number>(800);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState<string | null>(null);

  // Custom single slot modal state
  const [isCustomSlotModalOpen, setIsCustomSlotModalOpen] = useState(false);
  const [customSlotTurfId, setCustomSlotTurfId] = useState<string>(
    turfs.length > 0 ? turfs[0].id : ''
  );
  const [customSlotDate, setCustomSlotDate] = useState<string>(todayStr);
  const [customSlotStart24, setCustomSlotStart24] = useState<string>('19:30');
  const [customSlotEnd24, setCustomSlotEnd24] = useState<string>('21:00');
  const [customSlotPrice, setCustomSlotPrice] = useState<number>(1200);
  const [isAddingCustomSlot, setIsAddingCustomSlot] = useState(false);
  const [customSlotError, setCustomSlotError] = useState<string | null>(null);

  // Quick price editing state
  const [editingPriceSlotId, setEditingPriceSlotId] = useState<string | null>(null);
  const [newPriceValue, setNewPriceValue] = useState<number>(800);

  // Filter slots for selected date & turf
  const dateSlots = slots.filter((s) => s.date === selectedDate);
  const filteredSlots = dateSlots.filter((s) =>
    selectedTurfId === 'all' ? true : s.turfId === selectedTurfId
  );

  // Sort chronologically
  const parseHour = (timeStr: string) => {
    return parseTimeToMinutes(timeStr);
  };

  const sortedSlots = [...filteredSlots].sort(
    (a, b) => parseHour(a.startTime) - parseHour(b.startTime)
  );

  // Quick Date Jump helper
  const changeDateByDays = (days: number) => {
    const curr = new Date(selectedDate);
    curr.setDate(curr.getDate() + days);
    setSelectedDate(curr.toISOString().split('T')[0]);
  };

  const handleGenerateSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetTurf = turfs.find((t) => t.id === genTurfId);
    if (!targetTurf) return;

    setIsGenerating(true);
    setGenMessage(null);
    try {
      const createdCount = await generateSlotsForDate({
        date: genDate,
        turfId: targetTurf.id,
        turfName: targetTurf.name,
        openingHour: Number(genOpeningHour),
        closingHour: Number(genClosingHour),
        slotDurationMinutes: Number(genDuration),
        pricePerHour: Number(genPrice || targetTurf.pricePerHour),
      });

      setSelectedDate(genDate);
      setSelectedTurfId(targetTurf.id);
      setGenMessage(`Successfully generated ${createdCount} slots for ${genDate}!`);
      setTimeout(() => {
        setIsGenModalOpen(false);
        setGenMessage(null);
      }, 1200);
    } catch (error) {
      console.error(error);
      alert('Failed to generate slots.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddCustomSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomSlotError(null);
    const targetTurf = turfs.find((t) => t.id === customSlotTurfId);
    if (!targetTurf) {
      setCustomSlotError('Please select a valid turf court.');
      return;
    }

    const durationMins = calculateDurationMinutes(customSlotStart24, customSlotEnd24);
    if (durationMins < 15) {
      setCustomSlotError('Duration must be at least 15 minutes.');
      return;
    }

    setIsAddingCustomSlot(true);
    try {
      await addCustomSlot({
        turfId: targetTurf.id,
        turfName: targetTurf.name,
        date: customSlotDate,
        startTime: time24To12(customSlotStart24),
        endTime: time24To12(customSlotEnd24),
        price: Number(customSlotPrice),
      });

      setSelectedDate(customSlotDate);
      setSelectedTurfId(targetTurf.id);
      setIsCustomSlotModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setCustomSlotError(err.message || 'Failed to add custom slot.');
    } finally {
      setIsAddingCustomSlot(false);
    }
  };

  const handleSavePrice = async (slotId: string) => {
    if (newPriceValue <= 0) return;
    try {
      await updateSlotPrice(slotId, Number(newPriceValue));
      setEditingPriceSlotId(null);
    } catch (error) {
      console.error(error);
      alert('Failed to update price');
    }
  };

  const handleUnblock = async (slotId: string) => {
    try {
      await unblockSlot(slotId);
    } catch (error) {
      console.error(error);
    }
  };

  // Next 7 days quick chips
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dStr = d.toISOString().split('T')[0];
    const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
    return { dateStr: dStr, label: dayLabel };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Grid className="w-6 h-6 text-emerald-600" />
            Manage Slots & Schedules
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Generate hourly slots, add custom play windows, and manage booking availability.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setCustomSlotDate(selectedDate);
              if (selectedTurfId !== 'all') {
                setCustomSlotTurfId(selectedTurfId);
              } else if (turfs.length > 0) {
                setCustomSlotTurfId(turfs[0].id);
              }
              const t = turfs.find((item) => item.id === (selectedTurfId !== 'all' ? selectedTurfId : turfs[0]?.id));
              if (t) setCustomSlotPrice(Math.round(t.pricePerHour * 1.5));
              setIsCustomSlotModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-2xs cursor-pointer min-h-[44px]"
            id="add-custom-slot-btn"
          >
            <Timer className="w-4 h-4 text-emerald-600" />
            <span>+ Custom Time Slot</span>
          </button>

          <button
            onClick={() => {
              setGenDate(selectedDate);
              if (turfs.length > 0) setGenTurfId(turfs[0].id);
              setIsGenModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm cursor-pointer min-h-[44px]"
            id="auto-generate-slots-btn"
          >
            <Sparkles className="w-4 h-4" />
            <span>⚡ Auto-Generate Slots</span>
          </button>
        </div>
      </div>

      {/* Date & Turf Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        {/* Date Selector Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeDateByDays(-1)}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-slate-900 text-sm font-semibold focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => changeDateByDays(1)}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Date Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {next7Days.map((d) => (
              <button
                key={d.dateStr}
                onClick={() => setSelectedDate(d.dateStr)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[36px] ${
                  selectedDate === d.dateStr
                    ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Turf Selector Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto no-scrollbar">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Turf:</span>
          <button
            onClick={() => setSelectedTurfId('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[36px] ${
              selectedTurfId === 'all'
                ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Turfs ({turfs.length})
          </button>
          {turfs.map((turf) => (
            <button
              key={turf.id}
              onClick={() => setSelectedTurfId(turf.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[36px] ${
                selectedTurfId === turf.id
                  ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {turf.name}
            </button>
          ))}
        </div>
      </div>

      {/* Slots Grid */}
      {sortedSlots.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white border border-dashed border-slate-200 rounded-2xl shadow-xs">
          <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No Slots for {selectedDate}</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
            You can automatically generate the standard schedule or add a custom time range.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => {
                setGenDate(selectedDate);
                setIsGenModalOpen(true);
              }}
              className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 transition-all cursor-pointer shadow-sm min-h-[44px]"
            >
              ⚡ Auto-Generate Hourly Slots
            </button>
            <button
              onClick={() => {
                onOpenNewBooking(
                  selectedTurfId !== 'all' ? selectedTurfId : undefined,
                  undefined,
                  undefined,
                  'custom'
                );
              }}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-sm transition-all cursor-pointer min-h-[44px]"
            >
              ⏱️ Book Custom Time Window
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1 flex-wrap gap-2">
            <span>
              Showing <strong>{sortedSlots.length}</strong> slots on <strong>{selectedDate}</strong>
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available (
                {sortedSlots.filter((s) => s.status === 'available').length})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Booked (
                {sortedSlots.filter((s) => s.status === 'booked').length})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Blocked (
                {sortedSlots.filter((s) => s.status === 'blocked').length})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
            {sortedSlots.map((slot) => {
              const isAvailable = slot.status === 'available';
              const isBooked = slot.status === 'booked';
              const isBlocked = slot.status === 'blocked';
              const durationMins = calculateDurationMinutes(slot.startTime, slot.endTime);

              return (
                <div
                  key={slot.id}
                  className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between shadow-xs ${
                    isBooked
                      ? 'bg-blue-50/50 border-blue-200'
                      : isBlocked
                      ? 'bg-rose-50/50 border-rose-200'
                      : 'bg-white border-slate-200 hover:border-emerald-500'
                  }`}
                >
                  <div>
                    {/* Top Row: Time & Status */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-bold text-slate-900 tracking-wide font-mono block">
                          {slot.startTime} – {slot.endTime}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {formatDurationHuman(durationMins)}
                          {slot.isCustom && ' • Custom'}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isAvailable
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : isBooked
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {slot.status}
                      </span>
                    </div>

                    {/* Turf Name */}
                    <div className="text-xs text-slate-500 truncate mb-3 font-medium">
                      🏟️ {slot.turfName}
                    </div>

                    {/* Price with Inline Edit */}
                    <div className="flex items-center justify-between py-2 border-y border-slate-100 mb-3 text-xs">
                      <span className="text-slate-500">Slot Price:</span>
                      {editingPriceSlotId === slot.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            value={newPriceValue}
                            onChange={(e) => setNewPriceValue(Number(e.target.value))}
                            className="w-18 px-2 py-0.5 bg-slate-50 border border-emerald-500 rounded text-xs font-mono text-slate-900"
                          />
                          <button
                            onClick={() => handleSavePrice(slot.id)}
                            className="px-2 py-0.5 bg-emerald-600 text-white font-bold rounded text-[11px] cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingPriceSlotId(null)}
                            className="text-slate-400 hover:text-slate-700 text-[11px] cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {currency}{slot.price}
                          </span>
                          {!isBooked && (
                            <button
                              onClick={() => {
                                setEditingPriceSlotId(slot.id);
                                setNewPriceValue(slot.price);
                              }}
                              className="text-[10px] text-slate-500 hover:text-emerald-600 cursor-pointer underline"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {isBlocked && (
                      <p className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-100 mb-3">
                        ⚠️ Reason: {slot.blockReason || 'Maintenance'}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {isAvailable && (
                      <>
                        <button
                          onClick={() => onOpenBlockSlot(slot)}
                          className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer min-h-[38px]"
                        >
                          Block
                        </button>
                        <button
                          onClick={() => onOpenNewBooking(slot.turfId, slot)}
                          className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors text-center cursor-pointer shadow-xs min-h-[38px] flex items-center justify-center"
                        >
                          + Book Slot
                        </button>
                      </>
                    )}

                    {isBlocked && (
                      <button
                        onClick={() => handleUnblock(slot.id)}
                        className="w-full py-1.5 px-3 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-slate-200 flex items-center justify-center gap-1.5 min-h-[38px]"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        Unblock Slot
                      </button>
                    )}

                    {isBooked && (
                      <div className="w-full text-center py-1.5 text-xs text-blue-700 font-semibold bg-blue-100 rounded-lg">
                        Reserved for Booking
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Auto-Generate Slots Modal */}
      {isGenModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-xl relative max-h-[92vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Auto-Generate Turf Slots
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Automatically populate regular time slots with opening hours and duration.
            </p>

            {genMessage && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{genMessage}</span>
              </div>
            )}

            <form onSubmit={handleGenerateSlots} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Turf *
                </label>
                <select
                  value={genTurfId}
                  onChange={(e) => {
                    setGenTurfId(e.target.value);
                    const t = turfs.find((item) => item.id === e.target.value);
                    if (t) setGenPrice(t.pricePerHour);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
                >
                  {turfs.map((turf) => (
                    <option key={turf.id} value={turf.id}>
                      {turf.name} ({currency}{turf.pricePerHour}/hr)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Date *
                </label>
                <input
                  type="date"
                  required
                  value={genDate}
                  onChange={(e) => setGenDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Opening Time *
                  </label>
                  <select
                    value={genOpeningHour}
                    onChange={(e) => setGenOpeningHour(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const period = i >= 12 ? 'PM' : 'AM';
                      const h = i % 12 === 0 ? 12 : i % 12;
                      return (
                        <option key={i} value={i}>
                          {h}:00 {period}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Closing Time *
                  </label>
                  <select
                    value={genClosingHour}
                    onChange={(e) => setGenClosingHour(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
                  >
                    {Array.from({ length: 25 }, (_, i) => {
                      const hourNum = i === 24 ? 24 : i;
                      const displayH = hourNum === 24 ? '12:00 AM (Midnight)' : hourNum >= 12 ? `${hourNum % 12 === 0 ? 12 : hourNum % 12}:00 PM` : `${hourNum % 12 === 0 ? 12 : hourNum % 12}:00 AM`;
                      return (
                        <option key={i} value={hourNum}>
                          {displayH}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Slot Duration
                  </label>
                  <select
                    value={genDuration}
                    onChange={(e) => setGenDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
                  >
                    <option value={60}>60 Minutes (Standard)</option>
                    <option value={90}>90 Minutes (1.5 Hours)</option>
                    <option value={120}>120 Minutes (2 Hours)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Default Price ({currency})
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={genPrice}
                    onChange={(e) => setGenPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGenModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-900 text-sm font-semibold cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-sm min-h-[44px]"
                >
                  {isGenerating ? 'Generating...' : '⚡ Generate Slots'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Time Slot Modal */}
      {isCustomSlotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-xl relative max-h-[92vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Timer className="w-5 h-5 text-emerald-600" />
              Add Custom Time Slot
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Add a standalone custom time interval (e.g. 07:30 PM to 09:00 PM) to the schedule.
            </p>

            {customSlotError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{customSlotError}</span>
              </div>
            )}

            <form onSubmit={handleAddCustomSlot} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Turf Court *
                </label>
                <select
                  value={customSlotTurfId}
                  onChange={(e) => {
                    setCustomSlotTurfId(e.target.value);
                    const t = turfs.find((item) => item.id === e.target.value);
                    if (t) {
                      const dur = calculateDurationMinutes(customSlotStart24, customSlotEnd24);
                      setCustomSlotPrice(Math.round(t.pricePerHour * (dur / 60)));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
                >
                  {turfs.map((turf) => (
                    <option key={turf.id} value={turf.id}>
                      {turf.name} ({currency}{turf.pricePerHour}/hr)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Slot Date *
                </label>
                <input
                  type="date"
                  required
                  value={customSlotDate}
                  onChange={(e) => setCustomSlotDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Start Time (From) *
                  </label>
                  <input
                    type="time"
                    required
                    value={customSlotStart24}
                    onChange={(e) => {
                      setCustomSlotStart24(e.target.value);
                      const t = turfs.find((item) => item.id === customSlotTurfId);
                      if (t) {
                        const dur = calculateDurationMinutes(e.target.value, customSlotEnd24);
                        setCustomSlotPrice(Math.round(t.pricePerHour * (dur / 60)));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                  <span className="text-[11px] font-mono text-slate-500 mt-1 block">
                    {time24To12(customSlotStart24)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    End Time (To) *
                  </label>
                  <input
                    type="time"
                    required
                    value={customSlotEnd24}
                    onChange={(e) => {
                      setCustomSlotEnd24(e.target.value);
                      const t = turfs.find((item) => item.id === customSlotTurfId);
                      if (t) {
                        const dur = calculateDurationMinutes(customSlotStart24, e.target.value);
                        setCustomSlotPrice(Math.round(t.pricePerHour * (dur / 60)));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                  <span className="text-[11px] font-mono text-slate-500 mt-1 block">
                    {time24To12(customSlotEnd24)}
                  </span>
                </div>
              </div>

              {/* Quick duration buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-500">Preset duration:</span>
                {[30, 60, 90, 120, 150, 180].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => {
                      const startMins = parseTimeToMinutes(customSlotStart24);
                      const end24 = minutesTo24Hour(startMins + mins);
                      setCustomSlotEnd24(end24);
                      const t = turfs.find((item) => item.id === customSlotTurfId);
                      if (t) {
                        setCustomSlotPrice(Math.round(t.pricePerHour * (mins / 60)));
                      }
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Slot Price ({currency}) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={customSlotPrice}
                  onChange={(e) => setCustomSlotPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono font-bold focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCustomSlotModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-900 text-sm font-semibold cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingCustomSlot}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-sm min-h-[44px]"
                >
                  {isAddingCustomSlot ? 'Adding...' : '✓ Add Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

