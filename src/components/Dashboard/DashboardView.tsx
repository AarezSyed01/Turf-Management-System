import React, { useState } from 'react';
import {
  Turf,
  Slot,
  Booking,
  Customer,
  PaymentRecord,
  FacilitySettings,
} from '../../types.ts';
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
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedTurfFilter, setSelectedTurfFilter] = useState<string>('all');

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
                {todayStr}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">
              Live status for every time slot. Click any slot to book or inspect.
            </p>
          </div>

          {/* Turf Filter with smooth mobile scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium whitespace-nowrap shrink-0">Filter:</span>
            <button
              onClick={() => setSelectedTurfFilter('all')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[34px] ${
                selectedTurfFilter === 'all'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300'
              }`}
            >
              All ({turfs.length})
            </button>
            {turfs.map((turf) => (
              <button
                key={turf.id}
                onClick={() => setSelectedTurfFilter(turf.id)}
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
        </div>

        {/* Schedule Grid / List */}
        {scheduleItems.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Clock className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-800">No Slots Generated for Today</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
              Generate regular hourly slots for your turfs to start booking players.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => onNavigateToTab('slots')}
                className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                Go to Slots & Auto-Generate
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {scheduleItems.map(({ slot, booking }) => {
              const isBooked = slot.status === 'booked' && booking;
              const isBlocked = slot.status === 'blocked';
              const isAvailable = slot.status === 'available';

              return (
                <div
                  key={slot.id}
                  className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all relative ${
                    isBooked
                      ? 'bg-slate-50/90 border-slate-200 hover:border-emerald-500/50'
                      : isBlocked
                      ? 'bg-rose-50/60 border-rose-200'
                      : 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/20 shadow-2xs'
                  }`}
                >
                  {/* Top Time and Turf Tag */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-wide">
                      {slot.startTime} – {slot.endTime}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 truncate max-w-[120px] sm:max-w-[140px]">
                      {slot.turfName}
                    </span>
                  </div>

                  {/* Status Body */}
                  {isBooked ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
                          👤 {booking.customerName}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-900">
                          {currency}{booking.totalAmount}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {booking.paymentStatus === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            PAID
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              {currency}{booking.pendingAmount} Due
                            </span>
                            <button
                              onClick={() => onOpenRecordPayment(booking)}
                              className="text-[11px] font-bold text-amber-700 hover:text-amber-800 underline cursor-pointer p-1"
                            >
                              Collect
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => onSelectBooking(booking)}
                          className="text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer p-1"
                        >
                          Details →
                        </button>
                      </div>
                    </div>
                  ) : isBlocked ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-rose-700 flex items-center gap-1.5 truncate">
                          <Ban className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="truncate">Blocked: {slot.blockReason || 'Maintenance'}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
                        <span>Unavailable</span>
                        <button
                          onClick={() => onOpenBlockSlot(slot)}
                          className="text-slate-700 hover:text-slate-900 font-semibold cursor-pointer underline p-1"
                        >
                          Manage
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Available
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-700">
                          {currency}{slot.price}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => onOpenBlockSlot(slot)}
                          className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer font-medium p-1"
                        >
                          Block
                        </button>
                        <button
                          onClick={() => onOpenNewBooking(slot.turfId, slot)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-2xs touch-manipulation min-h-[34px] flex items-center gap-1"
                        >
                          Book Slot
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
    </div>
  );
};
