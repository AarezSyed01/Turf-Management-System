import React, { useState, useEffect, useMemo } from 'react';
import {
  Turf,
  Slot,
  Customer,
  FacilitySettings,
  PaymentMethod,
  PaymentStatus,
} from '../../types.ts';
import { createBooking, generateSlotsForDate } from '../../lib/db.ts';
import {
  parseTimeToMinutes,
  minutesTo12Hour,
  minutesTo24Hour,
  time24To12,
  time12To24,
  calculateDurationMinutes,
  formatDurationHuman,
  isTimeOverlapping,
} from '../../lib/timeUtils.ts';
import {
  X,
  Calendar,
  Clock,
  Phone,
  User,
  IndianRupee,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Sliders,
  Timer,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  turfs: Turf[];
  slots: Slot[];
  customers: Customer[];
  settings: FacilitySettings;
  preselectedTurfId?: string;
  preselectedSlot?: Slot;
  defaultCustomer?: { name: string; phone: string };
  initialMode?: 'predefined' | 'custom';
}

export const NewBookingModal: React.FC<NewBookingModalProps> = ({
  isOpen,
  onClose,
  turfs,
  slots,
  customers,
  settings,
  preselectedTurfId,
  preselectedSlot,
  defaultCustomer,
  initialMode = 'predefined',
}) => {
  const currency = settings.currencySymbol || '₹';
  const todayStr = new Date().toISOString().split('T')[0];

  const [timeMode, setTimeMode] = useState<'predefined' | 'custom'>(
    preselectedSlot ? 'predefined' : initialMode
  );

  const [customerName, setCustomerName] = useState(defaultCustomer?.name || '');
  const [customerPhone, setCustomerPhone] = useState(defaultCustomer?.phone || '');
  const [selectedTurfId, setSelectedTurfId] = useState<string>(
    preselectedTurfId || preselectedSlot?.turfId || (turfs.length > 0 ? turfs[0].id : '')
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    preselectedSlot?.date || todayStr
  );

  // Predefined slot selection
  const [selectedSlotId, setSelectedSlotId] = useState<string>(
    preselectedSlot?.id || ''
  );

  // Custom time range selection (24h strings for inputs: "18:00", "19:30")
  const [customStartTime24, setCustomStartTime24] = useState<string>('18:00');
  const [customEndTime24, setCustomEndTime24] = useState<string>('19:30');

  const [totalAmount, setTotalAmount] = useState<number | ''>(
    preselectedSlot?.price || 800
  );
  const [paidAmount, setPaidAmount] = useState<number | ''>(
    preselectedSlot?.price || 800
  );
  const [isAmountManuallyEdited, setIsAmountManuallyEdited] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedTurf = useMemo(() => {
    return turfs.find((t) => t.id === selectedTurfId) || turfs[0];
  }, [turfs, selectedTurfId]);

  // Auto-fill existing customer info when phone number is typed
  const handlePhoneChange = (val: string) => {
    setCustomerPhone(val);
    const clean = val.replace(/[^0-9]/g, '');
    if (clean.length >= 10) {
      const match = customers.find(
        (c) => c.phone.replace(/[^0-9]/g, '') === clean
      );
      if (match && !customerName) {
        setCustomerName(match.name);
      }
    }
  };

  // Find available slots for selected Turf and Date
  const availableSlots = useMemo(() => {
    return slots.filter(
      (s) =>
        s.turfId === selectedTurfId &&
        s.date === selectedDate &&
        (s.status === 'available' || s.id === preselectedSlot?.id)
    );
  }, [slots, selectedTurfId, selectedDate, preselectedSlot]);

  const sortedAvailableSlots = useMemo(() => {
    return [...availableSlots].sort(
      (a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)
    );
  }, [availableSlots]);

  // Custom Time computed values
  const customStartTime12 = useMemo(
    () => time24To12(customStartTime24),
    [customStartTime24]
  );
  const customEndTime12 = useMemo(
    () => time24To12(customEndTime24),
    [customEndTime24]
  );

  const customDurationMinutes = useMemo(() => {
    return calculateDurationMinutes(customStartTime24, customEndTime24);
  }, [customStartTime24, customEndTime24]);

  const customDurationHours = useMemo(() => {
    return Math.round((customDurationMinutes / 60) * 10) / 10;
  }, [customDurationMinutes]);

  // Conflict detection for custom range
  const customTimeConflict = useMemo(() => {
    if (timeMode !== 'custom') return null;
    if (!selectedTurfId || !selectedDate) return null;

    const daySlots = slots.filter(
      (s) =>
        s.turfId === selectedTurfId &&
        s.date === selectedDate &&
        (s.status === 'booked' || s.status === 'blocked')
    );

    for (const slot of daySlots) {
      if (
        isTimeOverlapping(
          slot.startTime,
          slot.endTime,
          customStartTime12,
          customEndTime12
        )
      ) {
        return slot;
      }
    }
    return null;
  }, [timeMode, selectedTurfId, selectedDate, slots, customStartTime12, customEndTime12]);

  // Auto-calculate price when custom time changes
  useEffect(() => {
    if (timeMode === 'custom' && selectedTurf) {
      const calculated = Math.round(
        selectedTurf.pricePerHour * (customDurationMinutes / 60)
      );
      if (!isAmountManuallyEdited) {
        setTotalAmount(calculated);
        setPaidAmount(calculated);
      }
    }
  }, [timeMode, selectedTurf, customDurationMinutes, isAmountManuallyEdited]);

  // When predefined slot selection changes, update default total amount
  useEffect(() => {
    if (timeMode === 'predefined' && selectedSlotId) {
      const slot = slots.find((s) => s.id === selectedSlotId);
      if (slot) {
        setTotalAmount(slot.price);
        setPaidAmount(slot.price);
        setIsAmountManuallyEdited(false);
      }
    }
  }, [timeMode, selectedSlotId, slots]);

  // If preselected slot passed in
  useEffect(() => {
    if (preselectedSlot) {
      setSelectedTurfId(preselectedSlot.turfId);
      setSelectedDate(preselectedSlot.date);
      setSelectedSlotId(preselectedSlot.id);
      setTimeMode('predefined');
      setTotalAmount(preselectedSlot.price);
      setPaidAmount(preselectedSlot.price);
    }
  }, [preselectedSlot]);

  // Quick duration helper (e.g. +30m, +1h, +1.5h, +2h)
  const setQuickDuration = (minutes: number) => {
    const startMins = parseTimeToMinutes(customStartTime24);
    const endMins = startMins + minutes;
    setCustomEndTime24(minutesTo24Hour(endMins));
    setIsAmountManuallyEdited(false);
  };

  // Quick start time preset helper
  const setQuickStartTime = (time24: string) => {
    setCustomStartTime24(time24);
    const startMins = parseTimeToMinutes(time24);
    const currentDuration = customDurationMinutes > 0 ? customDurationMinutes : 90;
    setCustomEndTime24(minutesTo24Hour(startMins + currentDuration));
    setIsAmountManuallyEdited(false);
  };

  // Derived pending amount & payment status
  const numTotalAmount = totalAmount === '' ? 0 : Number(totalAmount);
  const numPaidAmount = paidAmount === '' ? 0 : Number(paidAmount);
  const pendingAmount = Math.max(0, numTotalAmount - numPaidAmount);
  const paymentStatus: PaymentStatus =
    numPaidAmount >= numTotalAmount && numTotalAmount > 0
      ? 'paid'
      : numPaidAmount > 0
      ? 'partial'
      : 'pending';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const turf = turfs.find((t) => t.id === selectedTurfId) || selectedTurf;
    if (!turf) {
      setErrorMessage('Selected turf court not found.');
      return;
    }

    let finalStartTime = '';
    let finalEndTime = '';
    let finalSlotId: string | undefined = undefined;

    if (timeMode === 'predefined') {
      if (!selectedSlotId) {
        setErrorMessage('Please select an available time slot or switch to Custom Time.');
        return;
      }
      const slot = slots.find((s) => s.id === selectedSlotId);
      if (!slot) {
        setErrorMessage('Selected slot could not be found.');
        return;
      }
      finalStartTime = slot.startTime;
      finalEndTime = slot.endTime;
      finalSlotId = slot.id;
    } else {
      // Custom Time Mode
      if (customDurationMinutes < 15) {
        setErrorMessage('Custom booking duration must be at least 15 minutes.');
        return;
      }
      if (customTimeConflict) {
        setErrorMessage(
          `Time conflict: Overlaps with ${
            customTimeConflict.status === 'blocked' ? 'blocked' : 'booked'
          } slot (${customTimeConflict.startTime} – ${customTimeConflict.endTime}). Please adjust custom time.`
        );
        return;
      }
      finalStartTime = customStartTime12;
      finalEndTime = customEndTime12;
      finalSlotId = undefined; // Will auto-create a custom slot in db.ts
    }

    setLoading(true);
    try {
      const finalCustomerName = customerName.trim() || 'Walk-in Customer';
      const finalCustomerPhone = customerPhone.trim();

      await createBooking({
        turfId: turf.id,
        turfName: turf.name,
        slotId: finalSlotId,
        date: selectedDate,
        startTime: finalStartTime,
        endTime: finalEndTime,
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        totalAmount: Number(totalAmount),
        paidAmount: Number(paidAmount),
        paymentMethod,
        isCustomTime: timeMode === 'custom',
        notes: notes.trim(),
      });

      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to create booking.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to generate slots on the fly if none exist
  const handleQuickGenerateForDate = async () => {
    const turf = selectedTurf;
    if (!turf) return;
    try {
      await generateSlotsForDate({
        turfId: turf.id,
        turfName: turf.name,
        date: selectedDate,
        pricePerHour: turf.pricePerHour,
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white border-t sm:border border-slate-200 rounded-t-3xl sm:rounded-2xl w-full max-w-xl p-4 sm:p-6 shadow-2xl relative my-0 sm:my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              New Turf Booking
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct reservation with standard slots or custom start & end times
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 py-3 pr-0.5 mt-1">
          {/* Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Customer Name <span className="text-slate-400 font-normal text-[10px] normal-case">(Optional)</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma or Walk-in"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base sm:text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Customer Phone <span className="text-slate-400 font-normal text-[10px] normal-case">(Optional)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="e.g. 9876543210"
                  value={customerPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base sm:text-sm font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Turf & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Select Turf Court *
              </label>
              <select
                value={selectedTurfId}
                onChange={(e) => {
                  setSelectedTurfId(e.target.value);
                  setSelectedSlotId('');
                }}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base sm:text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
              >
                {turfs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({currency}{t.pricePerHour}/hr)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Booking Date *
              </label>
              <input
                type="date"
                required
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlotId('');
                }}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base sm:text-sm focus:outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
              />
            </div>
          </div>

          {/* Time Mode Switcher & Time Selection */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Time Slot</span>
              </span>
              <div className="flex bg-slate-200/70 p-0.5 rounded-xl text-xs font-medium shrink-0">
                <button
                  type="button"
                  onClick={() => setTimeMode('predefined')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer text-xs ${
                    timeMode === 'predefined'
                      ? 'bg-white text-slate-900 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Slots ({sortedAvailableSlots.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTimeMode('custom')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer text-xs flex items-center gap-1 ${
                    timeMode === 'custom'
                      ? 'bg-white text-emerald-700 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Timer className="w-3 h-3" />
                  Custom
                </button>
              </div>
            </div>

            {/* PREDEFINED SLOTS MODE */}
            {timeMode === 'predefined' ? (
              <div>
                {sortedAvailableSlots.length === 0 ? (
                  <div className="p-3 bg-white border border-dashed border-slate-300 rounded-xl text-center space-y-2">
                    <p className="text-xs text-slate-500">
                      No standard slots for this day.
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTimeMode('custom')}
                        className="px-3 py-1 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-lg border border-emerald-200 cursor-pointer"
                      >
                        ⏱️ Custom Time
                      </button>
                      <button
                        type="button"
                        onClick={handleQuickGenerateForDate}
                        className="px-3 py-1 bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg cursor-pointer"
                      >
                        ⚡ Generate Slots
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1 bg-white rounded-xl border border-slate-200">
                    {sortedAvailableSlots.map((slot) => {
                      const isSelected = selectedSlotId === slot.id;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-left border transition-all cursor-pointer min-h-[38px] flex items-center justify-between ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-slate-50/70 text-slate-800 border-slate-200/80 hover:border-emerald-400'
                          }`}
                        >
                          <span className="text-xs font-bold font-mono truncate">
                            {slot.startTime} – {slot.endTime}
                          </span>
                          <span
                            className={`text-[11px] font-bold font-mono ml-1 shrink-0 ${
                              isSelected ? 'text-emerald-100' : 'text-emerald-700'
                            }`}
                          >
                            {currency}{slot.price}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* CUSTOM TIME RANGE MODE */
              <div className="space-y-2.5 bg-white p-3 rounded-xl border border-slate-200">
                {/* Time Inputs */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Start Time ({customStartTime12})
                    </label>
                    <input
                      type="time"
                      required
                      value={customStartTime24}
                      onChange={(e) => {
                        setCustomStartTime24(e.target.value);
                        setIsAmountManuallyEdited(false);
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                      End Time ({customEndTime12})
                    </label>
                    <input
                      type="time"
                      required
                      value={customEndTime24}
                      onChange={(e) => {
                        setCustomEndTime24(e.target.value);
                        setIsAmountManuallyEdited(false);
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Duration Presets & Badge */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-1.5">
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { label: '1h', mins: 60 },
                      { label: '1.5h', mins: 90 },
                      { label: '2h', mins: 120 },
                      { label: '3h', mins: 180 },
                    ].map((preset) => (
                      <button
                        key={preset.mins}
                        type="button"
                        onClick={() => setQuickDuration(preset.mins)}
                        className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border transition-all cursor-pointer shrink-0 ${
                          customDurationMinutes === preset.mins
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                    {formatDurationHuman(customDurationMinutes)}
                  </span>
                </div>

                {/* Conflict Status / Availability Banner */}
                {customTimeConflict ? (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="truncate">
                      <strong>Conflict:</strong> {customTimeConflict.startTime} – {customTimeConflict.endTime} ({customTimeConflict.status})
                    </span>
                  </div>
                ) : (
                  <div className="p-1.5 px-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{customStartTime12} – {customEndTime12} available</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-700 shrink-0 ml-1">
                      {currency}{selectedTurf ? Math.round(selectedTurf.pricePerHour * (customDurationMinutes / 60)) : 0}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pricing & Advance Calculation */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Payment & Billing Details</span>
              {timeMode === 'custom' && selectedTurf && (
                <span className="text-[11px] font-normal text-slate-500">
                  Rate: {currency}{selectedTurf.pricePerHour}/hr × {customDurationHours} hrs
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Total Amount ({currency}) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  placeholder="0"
                  value={totalAmount}
                  onChange={(e) => {
                    const valStr = e.target.value;
                    if (valStr === '') {
                      setTotalAmount('');
                      setIsAmountManuallyEdited(true);
                      return;
                    }
                    const val = Number(valStr);
                    setTotalAmount(val);
                    setIsAmountManuallyEdited(true);
                    if (paidAmount !== '' && paidAmount > val) setPaidAmount(val);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold text-base sm:text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Paid / Advance ({currency}) *
                </label>
                <input
                  type="number"
                  min={0}
                  max={totalAmount === '' ? undefined : totalAmount}
                  required
                  placeholder="0"
                  value={paidAmount}
                  onChange={(e) => {
                    const valStr = e.target.value;
                    if (valStr === '') {
                      setPaidAmount('');
                      return;
                    }
                    setPaidAmount(Number(valStr));
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-emerald-700 font-mono font-bold text-base sm:text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Pending Due
                </label>
                <div
                  className={`px-3 py-2 bg-white border rounded-xl font-mono font-bold text-sm flex items-center justify-between min-h-[38px] ${
                    pendingAmount > 0
                      ? 'border-amber-300 text-amber-800'
                      : 'border-emerald-300 text-emerald-800'
                  }`}
                >
                  <span>{currency}{pendingAmount}</span>
                  <span className="text-[10px] uppercase font-bold">
                    {paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Payment Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-slate-500 font-medium">Quick Set:</span>
              <button
                type="button"
                onClick={() => setPaidAmount(numTotalAmount)}
                className="px-2 py-1 text-[11px] font-bold bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                Full ({currency}{numTotalAmount})
              </button>
              <button
                type="button"
                onClick={() => setPaidAmount(Math.round(numTotalAmount / 2))}
                className="px-2 py-1 text-[11px] font-bold bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                50% ({currency}{Math.round(numTotalAmount / 2)})
              </button>
              <button
                type="button"
                onClick={() => setPaidAmount(0)}
                className="px-2 py-1 text-[11px] font-bold bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                Pay Later (₹0)
              </button>
            </div>

            {/* Payment Method Selector */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Payment Method (for Paid Amount)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['UPI', 'Cash', 'Card', 'Other'] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border min-h-[40px] flex items-center justify-center ${
                      paymentMethod === method
                        ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Booking Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 7v7 friendly match / 1.5 hr custom slot / advance received..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base sm:text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-500 hover:text-slate-900 text-sm font-semibold cursor-pointer min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                (timeMode === 'predefined' && !selectedSlotId) ||
                (timeMode === 'custom' && !!customTimeConflict)
              }
              className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs min-h-[44px]"
            >
              {loading
                ? 'Confirming...'
                : timeMode === 'custom'
                ? `✓ Book ${customStartTime12} – ${customEndTime12}`
                : '✓ Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
