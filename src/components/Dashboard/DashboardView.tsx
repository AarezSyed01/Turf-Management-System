import React, { useState } from 'react';
import {
  Turf,
  Slot,
  Booking,
  Customer,
  PaymentRecord,
  FacilitySettings,
} from '../../types.ts';
import { generateSlotsForDate } from '../../lib/db.ts';
import {
  CalendarDays,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  PlusCircle,
  Ban,
  Shield,
  Layers,
  ChevronRight,
  Filter,
  Sparkles,
  DollarSign,
  LandPlot,
} from 'lucide-react';

interface DashboardViewProps {
  turfs: Turf[];
  slots: Slot[];
  bookings: Booking[];
  customers: Customer[];
  payments: PaymentRecord[];
  settings: FacilitySettings;
  onOpenNewBooking: (turfId?: string, slot?: Slot) => void;
  onOpenRecordPayment: (booking: Booking) => void;
  onOpenBlockSlot: (slot: Slot) => void;
  onSelectBooking: (booking: Booking) => void;
  onNavigateToTab: (tab: any) => void;
  onSeedData: () => void;
  onOpenTurfSetup?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  turfs,
  slots,
  bookings,
  customers,
  payments,
  settings,
  onOpenNewBooking,
  onOpenRecordPayment,
  onOpenBlockSlot,
  onSelectBooking,
  onNavigateToTab,
  onSeedData,
  onOpenTurfSetup,
}) => {
  const currency = settings.currencySymbol || '₹';
  const todayObj = new Date();
  const todayStr = todayObj.toISOString().split('T')[0];
  const todayFormattedDDMM = `${String(todayObj.getDate()).padStart(2, '0')}/${String(todayObj.getMonth() + 1).padStart(2, '0')}/${todayObj.getFullYear()}`;

  const [selectedTurfFilter, setSelectedTurfFilter] = useState<string>('all');
  const [isDashGenModalOpen, setIsDashGenModalOpen] = useState(false);
  const [dashGenTurfId, setDashGenTurfId] = useState<string>('all');
  const [dashGenOpeningHour, setDashGenOpeningHour] = useState<number>(6);
  const [dashGenClosingHour, setDashGenClosingHour] = useState<number>(23);
  const [dashGenDuration, setDashGenDuration] = useState<number>(60);
  const [isDashGenerating, setIsDashGenerating] = useState(false);
  const [dashGenSuccess, setDashGenSuccess] = useState<string | null>(null);

  const handleDashAutoGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (turfs.length === 0) {
      alert('Please add at least one turf court before generating slots.');
      return;
    }

    const targetTurfs =
      dashGenTurfId === 'all'
        ? turfs
        : turfs.filter((t) => t.id === dashGenTurfId);

    setIsDashGenerating(true);
    setDashGenSuccess(null);
    try {
      let totalCreated = 0;
      for (const t of targetTurfs) {
        const count = await generateSlotsForDate({
          date: todayStr,
          turfId: t.id,
          turfName: t.name,
          openingHour: Number(dashGenOpeningHour),
          closingHour: Number(dashGenClosingHour),
          slotDurationMinutes: Number(dashGenDuration),
          pricePerHour: t.pricePerHour,
        });
        totalCreated += count;
      }
      setDashGenSuccess(`Successfully generated ${totalCreated} slots for today!`);
      setTimeout(() => {
        setIsDashGenModalOpen(false);
        setDashGenSuccess(null);
      }, 1200);
    } catch (err) {
      console.error(err);
      alert('Failed to generate slots for today.');
    } finally {
      setIsDashGenerating(false);
    }
  };

  // Filter today's items
  const todayBookings = bookings.filter((b) => b.date === todayStr && b.bookingStatus !== 'cancelled');
  const todaySlots = slots.filter((s) => s.date === todayStr);

  // Revenue calculations
  // Today's revenue from payments made today or bookings for today
  const todayPaymentsSum = payments
    .filter((p) => p.recordedAt.startsWith(todayStr))
    .reduce((acc, p) => acc + p.amount, 0);

  // Week calculation (last 7 days)
  const oneWeekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const thisWeekPaymentsSum = payments
    .filter((p) => p.recordedAt.split('T')[0] >= oneWeekAgo)
    .reduce((acc, p) => acc + p.amount, 0);

  // Month calculation (current calendar month)
  const currentMonthPrefix = todayStr.substring(0, 7); // "YYYY-MM"
  const thisMonthPaymentsSum = payments
    .filter((p) => p.recordedAt.startsWith(currentMonthPrefix))
    .reduce((acc, p) => acc + p.amount, 0);

  // All time
  const totalRevenueAllTime = payments.reduce((acc, p) => acc + p.amount, 0);

  // Pending payments (sum of all uncollected pending amounts on non-cancelled bookings)
  const totalPendingAmount = bookings
    .filter((b) => b.bookingStatus !== 'cancelled' && b.pendingAmount > 0)
    .reduce((acc, b) => acc + b.pendingAmount, 0);

  // Available slots today
  const todayAvailableSlots = todaySlots.filter((s) => s.status === 'available');

  // Filter today's slots by selected turf
  const displayedScheduleSlots = todaySlots.filter((s) =>
    selectedTurfFilter === 'all' ? true : s.turfId === selectedTurfFilter
  );

  // Map slots to booking details if booked
  const scheduleItems = displayedScheduleSlots.map((slot) => {
    const matchedBooking = bookings.find(
      (b) =>
        (b.slotId === slot.id ||
          (b.date === slot.date &&
            b.turfId === slot.turfId &&
            b.startTime === slot.startTime)) &&
        b.bookingStatus !== 'cancelled'
    );
    return {
      slot,
      booking: matchedBooking,
    };
  });

  // Sort schedule chronologically
  const parseHour = (timeStr: string) => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return 0;
    let hour = parseInt(match[1], 10);
    const min = parseInt(match[2], 10);
    const period = match[3]?.toUpperCase();
    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return hour * 60 + min;
  };

  scheduleItems.sort((a, b) => parseHour(a.slot.startTime) - parseHour(b.slot.startTime));

  // Chart data for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayRevenue = payments
      .filter((p) => p.recordedAt.startsWith(dateStr))
      .reduce((acc, p) => acc + p.amount, 0);
    const dayBookingsCount = bookings.filter((b) => b.date === dateStr && b.bookingStatus !== 'cancelled').length;
    return { dateStr, dayName, revenue: dayRevenue, bookingsCount: dayBookingsCount };
  });

  const maxRevenueInWeek = Math.max(...last7Days.map((d) => d.revenue), 1000);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-16 sm:pb-20">
      {/* Welcome Banner - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
              Live Arena OS
            </span>
            <span className="text-[11px] sm:text-xs text-slate-500 truncate">
              {settings.ownerName ? `Owner: ${settings.ownerName}` : 'Manager Portal'}
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate">
            {settings.facilityName || 'Turf Operations Center'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1 line-clamp-2 sm:line-clamp-none">
            Real-time schedule, slots availability, revenue collection, and customer records.
          </p>
        </div>

        {/* Action Buttons - Responsive Grid on Mobile */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
          {onOpenTurfSetup && (
            <button
              onClick={onOpenTurfSetup}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 sm:py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px] touch-manipulation truncate"
              title="Set up or change your turf name and complex details"
            >
              <LandPlot className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{settings.facilityName ? 'Facility Details' : 'Turf Setup'}</span>
            </button>
          )}
          <button
            onClick={() => onOpenNewBooking()}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer min-h-[42px] touch-manipulation whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>+ New Booking</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid - Highly Responsive on Mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Today's Bookings */}
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 relative overflow-hidden group hover:border-slate-300 transition-all shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] sm:text-xs font-semibold mb-1.5 sm:mb-2">
            <span className="truncate">Today's Bookings</span>
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
              <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            {todayBookings.length}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 sm:mt-1.5 flex items-center gap-1 truncate">
            <span className="text-emerald-600 font-bold">{bookings.filter(b => b.bookingStatus !== 'cancelled').length}</span>
            <span className="truncate">Total All-Time</span>
          </p>
        </div>

        {/* Today's Revenue */}
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 relative overflow-hidden group hover:border-slate-300 transition-all shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] sm:text-xs font-semibold mb-1.5 sm:mb-2">
            <span className="truncate">Today's Revenue</span>
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
              <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-extrabold text-emerald-600 leading-tight truncate">
            {currency}{todayPaymentsSum.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 sm:mt-1.5 truncate">
            Month: <span className="text-slate-800 font-bold">{currency}{thisMonthPaymentsSum.toLocaleString('en-IN')}</span>
          </p>
        </div>

        {/* Pending Payments */}
        <div
          onClick={() => onNavigateToTab('payments')}
          className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 relative overflow-hidden group hover:border-amber-400 cursor-pointer transition-all shadow-xs touch-manipulation"
        >
          <div className="flex items-center justify-between text-slate-500 text-[11px] sm:text-xs font-semibold mb-1.5 sm:mb-2">
            <span className="truncate">Pending Dues</span>
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-extrabold text-amber-600 leading-tight truncate">
            {currency}{totalPendingAmount.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] sm:text-[11px] text-amber-700 mt-1 sm:mt-1.5 flex items-center justify-between font-bold truncate">
            <span className="truncate">Collect pending</span>
            <ChevronRight className="w-3 h-3 text-amber-500 shrink-0 ml-0.5" />
          </p>
        </div>

        {/* Available Slots */}
        <div
          onClick={() => onNavigateToTab('slots')}
          className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 relative overflow-hidden group hover:border-slate-300 cursor-pointer transition-all shadow-xs touch-manipulation"
        >
          <div className="flex items-center justify-between text-slate-500 text-[11px] sm:text-xs font-semibold mb-1.5 sm:mb-2">
            <span className="truncate">Available Slots</span>
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            {todayAvailableSlots.length}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 sm:mt-1.5 flex items-center justify-between truncate">
            <span className="truncate">{todaySlots.length} Total Slots</span>
            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0 ml-0.5" />
          </p>
        </div>
      </div>

      {/* TODAY'S SCHEDULE */}
      <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
                <span>Today's Schedule & Slot Timeline</span>
              </h3>
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                {todayFormattedDDMM}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">
              Live status for every time slot. Click any slot to book or inspect.
            </p>
          </div>

          {/* Turf Filter with smooth mobile scroll */}
          {turfs.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
              <span className="text-[11px] sm:text-xs text-slate-500 font-medium whitespace-nowrap shrink-0">Turfs and courts:</span>
              {turfs.map((turf) => (
                <button
                  key={turf.id}
                  onClick={() =>
                    setSelectedTurfFilter(
                      selectedTurfFilter === turf.id ? 'all' : turf.id
                    )
                  }
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[34px] ${
                    selectedTurfFilter === turf.id
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300'
                  }`}
                >
                  {turf.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Schedule List / Columns View */}
        {scheduleItems.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Clock className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-800">No Slots Generated for Today</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
              Generate regular hourly slots for your turfs to start booking players.
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <button
                onClick={() => {
                  setDashGenTurfId(selectedTurfFilter !== 'all' ? selectedTurfFilter : 'all');
                  setIsDashGenModalOpen(true);
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-xs flex items-center gap-1.5 min-h-[42px]"
              >
                <Sparkles className="w-4 h-4" />
                <span>⚡ Auto-Generate Today's Slots</span>
              </button>
              <button
                onClick={() => onNavigateToTab('slots')}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer min-h-[42px]"
              >
                Manage in Slots Tab →
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Desktop Table Header (Hidden on Mobile) */}
            <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2.5 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider rounded-xl border border-slate-200/80 mb-2">
              <div className="col-span-3">Time & Turf</div>
              <div className="col-span-3">Status / Customer</div>
              <div className="col-span-3">Amount & Payment</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>

            {/* List Rows - Mobile Optimized Card Layout & Desktop Grid */}
            <div className="space-y-2 sm:space-y-1.5">
              {scheduleItems.map(({ slot, booking }) => {
                const isBooked = slot.status === 'booked' && booking;
                const isBlocked = slot.status === 'blocked';
                const isAvailable = slot.status === 'available';

                return (
                  <div
                    key={slot.id}
                    className={`p-3 sm:px-4 sm:py-3 rounded-xl border transition-all ${
                      isBooked
                        ? 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                        : isBlocked
                        ? 'bg-rose-50/40 border-rose-200'
                        : 'bg-white border-slate-200/90 hover:border-emerald-400 hover:bg-emerald-50/10'
                    }`}
                  >
                    {/* Mobile View (< sm) */}
                    <div className="sm:hidden space-y-2.5">
                      {/* Top Row: Time, Turf & Status Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-mono font-bold text-sm text-slate-900 flex items-center gap-1.5">
                            <span>{slot.startTime} – {slot.endTime}</span>
                          </div>
                          <div className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                            <span>🏟️</span>
                            <span>{slot.turfName}</span>
                          </div>
                        </div>

                        <div>
                          {isBooked ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              BOOKED
                            </span>
                          ) : isBlocked ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <Ban className="w-2.5 h-2.5 text-rose-600" />
                              BLOCKED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              AVAILABLE
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle Row: Customer Info or Price */}
                      {isBooked ? (
                        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60">
                          <div className="min-w-0 pr-2">
                            <div className="font-bold text-slate-900 truncate flex items-center gap-1">
                              <span>👤</span>
                              <span className="truncate">{booking.customerName || 'Walk-in Customer'}</span>
                            </div>
                            {booking.customerPhone && (
                              <div className="text-[11px] font-mono text-slate-500 mt-0.5 truncate">
                                {booking.customerPhone}
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-mono font-bold text-slate-900">
                              {currency}{booking.totalAmount}
                            </div>
                            {booking.paymentStatus === 'paid' ? (
                              <span className="text-[10px] font-bold text-emerald-700">PAID</span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-700">{currency}{booking.pendingAmount} Due</span>
                            )}
                          </div>
                        </div>
                      ) : isBlocked ? (
                        <div className="text-xs text-rose-700 font-medium pt-1 border-t border-rose-100">
                          Reason: {slot.blockReason || 'Manual hold'}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                          <span className="text-slate-500">Hourly Rate</span>
                          <span className="font-mono font-bold text-emerald-700 text-sm">{currency}{slot.price}</span>
                        </div>
                      )}

                      {/* Bottom Action Buttons (Mobile) */}
                      <div className="flex items-center gap-2 pt-1">
                        {isBooked ? (
                          <>
                            {booking.paymentStatus !== 'paid' && (
                              <button
                                onClick={() => onOpenRecordPayment(booking)}
                                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer text-center min-h-[38px] shadow-2xs"
                              >
                                Collect {currency}{booking.pendingAmount}
                              </button>
                            )}
                            <button
                              onClick={() => onSelectBooking(booking)}
                              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer text-center min-h-[38px]"
                            >
                              View Details
                            </button>
                          </>
                        ) : isBlocked ? (
                          <button
                            onClick={() => onOpenBlockSlot(slot)}
                            className="w-full py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer text-center min-h-[38px]"
                          >
                            Unblock / Manage
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => onOpenBlockSlot(slot)}
                              className="w-1/3 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 font-semibold text-xs rounded-xl transition-colors cursor-pointer min-h-[38px]"
                            >
                              Block
                            </button>
                            <button
                              onClick={() => onOpenNewBooking(slot.turfId, slot)}
                              className="w-2/3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer text-center min-h-[38px] shadow-2xs flex items-center justify-center gap-1.5"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>Book Slot</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Desktop View (>= sm) */}
                    <div className="hidden sm:grid grid-cols-12 gap-3 items-center">
                      {/* Column 1: Time & Turf */}
                      <div className="col-span-3 min-w-0">
                        <div className="font-mono font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {slot.startTime} – {slot.endTime}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                          🏟️ {slot.turfName}
                        </div>
                      </div>

                      {/* Column 2: Status / Customer */}
                      <div className="col-span-3 min-w-0">
                        {isBooked ? (
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                              <span>👤</span>
                              <span className="truncate">{booking.customerName || 'Walk-in Customer'}</span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                              {booking.customerPhone || <span className="text-slate-400 font-sans italic">No phone</span>}
                            </div>
                          </div>
                        ) : isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                            <Ban className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="truncate">{slot.blockReason || 'Blocked'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            <span>Available</span>
                          </span>
                        )}
                      </div>

                      {/* Column 3: Amount & Payment */}
                      <div className="col-span-3 min-w-0">
                        {isBooked ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs sm:text-sm text-slate-900">
                              {currency}{booking.totalAmount}
                            </span>
                            {booking.paymentStatus === 'paid' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                PAID
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                {currency}{booking.pendingAmount} Due
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="font-mono font-bold text-xs sm:text-sm text-slate-700">
                            {currency}{slot.price}
                          </div>
                        )}
                      </div>

                      {/* Column 4: Actions */}
                      <div className="col-span-3 flex items-center justify-end gap-1.5 shrink-0">
                        {isBooked ? (
                          <>
                            {booking.paymentStatus !== 'paid' && (
                              <button
                                onClick={() => onOpenRecordPayment(booking)}
                                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
                              >
                                Collect
                              </button>
                            )}
                            <button
                              onClick={() => onSelectBooking(booking)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                            >
                              Details
                            </button>
                          </>
                        ) : isBlocked ? (
                          <button
                            onClick={() => onOpenBlockSlot(slot)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            Manage
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => onOpenBlockSlot(slot)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                            >
                              Block
                            </button>
                            <button
                              onClick={() => onOpenNewBooking(slot.turfId, slot)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                            >
                              <span>Book</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Revenue Summary Breakdown & Simple Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-6">
        {/* Revenue Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Revenue Summary</span>
              </h3>
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                Live Totals
              </span>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <div className="p-3 sm:p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] sm:text-xs text-slate-500 block font-medium">Today's Collection</span>
                  <span className="text-base sm:text-lg font-extrabold text-slate-900">
                    {currency}{todayPaymentsSum.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {todayBookings.length} Bookings
                </span>
              </div>

              <div className="p-3 sm:p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] sm:text-xs text-slate-500 block font-medium">This Week</span>
                  <span className="text-base sm:text-lg font-extrabold text-emerald-700">
                    {currency}{thisWeekPaymentsSum.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Last 7 Days</span>
              </div>

              <div className="p-3 sm:p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] sm:text-xs text-slate-500 block font-medium">This Month</span>
                  <span className="text-base sm:text-lg font-extrabold text-slate-900">
                    {currency}{thisMonthPaymentsSum.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium">
                  {new Date().toLocaleDateString('en-US', { month: 'short' })}
                </span>
              </div>

              <div className="p-3 sm:p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] sm:text-xs text-slate-500 block font-medium">All Time Revenue</span>
                  <span className="text-base sm:text-lg font-extrabold text-slate-900">
                    {currency}{totalRevenueAllTime.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium">{payments.length} Txns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Simple Revenue Trend Visualizer */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  7-Day Revenue Trend
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Daily collection performance</p>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Collected</span>
              </div>
            </div>

            {/* Custom Bar Chart - Responsive sizing */}
            <div className="h-36 sm:h-48 pt-4 sm:pt-6 flex items-end justify-between gap-1.5 sm:gap-4 border-b border-slate-200 pb-2">
              {last7Days.map((day, idx) => {
                const heightPercent = Math.max(8, Math.round((day.revenue / maxRevenueInWeek) * 100));
                const isToday = day.dateStr === todayStr;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 sm:gap-2 h-full justify-end group">
                    <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono whitespace-nowrap font-medium">
                      {currency}{day.revenue > 999 ? `${Math.round(day.revenue / 1000)}k` : day.revenue}
                    </span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[28px] sm:max-w-[36px] rounded-t-md sm:rounded-t-lg transition-all ${
                        isToday
                          ? 'bg-emerald-500 shadow-xs'
                          : 'bg-emerald-200 hover:bg-emerald-300'
                      }`}
                    />
                    <span
                      className={`text-[10px] sm:text-[11px] font-medium ${
                        isToday ? 'text-emerald-700 font-bold' : 'text-slate-500'
                      }`}
                    >
                      {day.dayName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 sm:mt-4 flex items-center justify-between text-[11px] sm:text-xs text-slate-500 pt-1 sm:pt-2">
            <span>Peak: <strong className="text-slate-900 font-bold">{currency}{maxRevenueInWeek.toLocaleString('en-IN')}</strong></span>
            <button
              onClick={() => onNavigateToTab('payments')}
              className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              Ledger <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Hub - Touch Friendly 2x2 Grid on Mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <button
          onClick={() => onOpenNewBooking()}
          className="p-3.5 sm:p-4 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 hover:border-emerald-400 rounded-xl sm:rounded-2xl text-left transition-all group cursor-pointer shadow-xs touch-manipulation"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-105 transition-transform">
            <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900">Create Booking</h4>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Book player slot</p>
        </button>

        <button
          onClick={() => onNavigateToTab('slots')}
          className="p-3.5 sm:p-4 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 hover:border-blue-400 rounded-xl sm:rounded-2xl text-left transition-all group cursor-pointer shadow-xs touch-manipulation"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-105 transition-transform">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900">Generate Slots</h4>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Bulk schedules</p>
        </button>

        <button
          onClick={() => onNavigateToTab('turfs')}
          className="p-3.5 sm:p-4 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 hover:border-purple-400 rounded-xl sm:rounded-2xl text-left transition-all group cursor-pointer shadow-xs touch-manipulation"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-105 transition-transform">
            <LandPlot className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900">Manage Turfs</h4>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Add & edit courts</p>
        </button>

        <button
          onClick={() => onNavigateToTab('customers')}
          className="p-3.5 sm:p-4 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 hover:border-amber-400 rounded-xl sm:rounded-2xl text-left transition-all group cursor-pointer shadow-xs touch-manipulation"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-105 transition-transform">
            <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900">Customer Hub</h4>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{customers.length} registered</p>
        </button>
      </div>
      {/* Dashboard Quick Auto-Generate Modal */}
      {isDashGenModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-xl relative max-h-[92vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Auto-Generate Today's Slots
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Quickly create standard hourly slots for {todayFormattedDDMM}.
            </p>

            {dashGenSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{dashGenSuccess}</span>
              </div>
            )}

            <form onSubmit={handleDashAutoGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Turf Court *
                </label>
                <select
                  value={dashGenTurfId}
                  onChange={(e) => setDashGenTurfId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
                >
                  <option value="all">⚡ All Turfs ({turfs.length} Courts)</option>
                  {turfs.map((turf) => (
                    <option key={turf.id} value={turf.id}>
                      {turf.name} ({currency}{turf.pricePerHour}/hr)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Opening Time *
                  </label>
                  <select
                    value={dashGenOpeningHour}
                    onChange={(e) => setDashGenOpeningHour(Number(e.target.value))}
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
                    value={dashGenClosingHour}
                    onChange={(e) => setDashGenClosingHour(Number(e.target.value))}
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Slot Duration
                </label>
                <select
                  value={dashGenDuration}
                  onChange={(e) => setDashGenDuration(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
                >
                  <option value={60}>60 Minutes (Standard 1 Hour)</option>
                  <option value={90}>90 Minutes (1.5 Hours)</option>
                  <option value={120}>120 Minutes (2 Hours)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDashGenModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-900 text-sm font-semibold cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDashGenerating}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-sm min-h-[44px]"
                >
                  {isDashGenerating ? 'Generating...' : '⚡ Generate Slots'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
