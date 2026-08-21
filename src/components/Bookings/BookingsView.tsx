import React, { useState } from 'react';
import {
  Booking,
  Turf,
  FacilitySettings,
  BookingStatus,
  PaymentStatus,
} from '../../types.ts';
import { cancelBooking, markBookingCompleted, deleteBooking } from '../../lib/db.ts';
import {
  CalendarDays,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  IndianRupee,
  Phone,
  User,
  Plus,
  Eye,
  Calendar,
  Layers,
  ChevronDown,
  Trash2,
  MessageSquare,
} from 'lucide-react';

interface BookingsViewProps {
  bookings: Booking[];
  turfs: Turf[];
  settings: FacilitySettings;
  onOpenNewBooking: () => void;
  onSelectBooking: (booking: Booking) => void;
  onOpenRecordPayment: (booking: Booking) => void;
}

export const BookingsView: React.FC<BookingsViewProps> = ({
  bookings,
  turfs,
  settings,
  onOpenNewBooking,
  onSelectBooking,
  onOpenRecordPayment,
}) => {
  const currency = settings.currencySymbol || '₹';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTurfId, setFilterTurfId] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all');
  const [filterBookingStatus, setFilterBookingStatus] = useState<string>('all');

  // Cancel & Delete action confirmation states
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return;
    setIsDeleting(true);
    try {
      await deleteBooking(bookingToDelete.id, bookingToDelete.slotId);
      setBookingToDelete(null);
    } catch (error) {
      console.error(error);
      alert('Failed to delete booking');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered bookings
  const filteredBookings = bookings.filter((b) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = b.customerName.toLowerCase().includes(q);
      const matchPhone = b.customerPhone.toLowerCase().includes(q);
      const matchId = b.id.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchId) return false;
    }

    // Turf filter
    if (filterTurfId !== 'all' && b.turfId !== filterTurfId) return false;

    // Date filter
    if (filterDate && b.date !== filterDate) return false;

    // Payment status filter
    if (filterPaymentStatus !== 'all' && b.paymentStatus !== filterPaymentStatus)
      return false;

    // Booking status filter
    if (filterBookingStatus !== 'all' && b.bookingStatus !== filterBookingStatus)
      return false;

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-emerald-600" />
            Bookings Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse, search, edit, and track payment receipts for all customer bookings.
          </p>
        </div>

        <button
          onClick={onOpenNewBooking}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-sm transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Booking</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Turf Filter */}
          <div>
            <select
              value={filterTurfId}
              onChange={(e) => setFilterTurfId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
            >
              <option value="all">All Turfs ({turfs.length})</option>
              {turfs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="relative">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="absolute right-8 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={filterPaymentStatus}
              onChange={(e) => setFilterPaymentStatus(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
            >
              <option value="all">All Payment Status</option>
              <option value="paid">Paid (Fully Cleared)</option>
              <option value="partial">Partially Paid</option>
              <option value="pending">Pending (Unpaid)</option>
            </select>
          </div>
        </div>

        {/* Status quick tabs & Clear */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-slate-500 font-medium">Status:</span>
            {['all', 'confirmed', 'completed', 'cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterBookingStatus(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  filterBookingStatus === st
                    ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {(searchQuery || filterTurfId !== 'all' || filterDate || filterPaymentStatus !== 'all' || filterBookingStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterTurfId('all');
                setFilterDate('');
                setFilterPaymentStatus('all');
                setFilterBookingStatus('all');
              }}
              className="text-xs text-emerald-600 hover:underline cursor-pointer font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Bookings Table / Cards */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white border border-dashed border-slate-200 rounded-2xl shadow-xs">
          <CalendarDays className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No Bookings Found</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            Try adjusting your search criteria or create a new booking for a player.
          </p>
          <button
            onClick={onOpenNewBooking}
            className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 transition-all cursor-pointer shadow-sm"
          >
            + Create New Booking
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Customer & Contact</th>
                  <th className="px-5 py-3.5">Turf & Date</th>
                  <th className="px-5 py-3.5">Time Slot</th>
                  <th className="px-5 py-3.5">Total / Paid / Pending</th>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Customer */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{b.customerName || 'Walk-in Customer'}</span>
                      </div>
                      {b.customerPhone ? (
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{b.customerPhone}</span>
                          <span
                            title="SMS Confirmation sent to customer"
                            className="inline-flex items-center gap-0.5 text-[10px] font-sans font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/80"
                          >
                            <MessageSquare className="w-2.5 h-2.5" /> SMS
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No phone provided</span>
                      )}
                    </td>

                    {/* Turf & Date */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800 truncate max-w-[170px]">
                        {b.turfName}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-emerald-600" />
                        <span>{b.date}</span>
                      </div>
                    </td>

                    {/* Time Slot */}
                    <td className="px-5 py-4">
                      <span className="font-mono font-medium text-slate-700 text-xs bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        {b.startTime} – {b.endTime}
                      </span>
                    </td>

                    {/* Amount breakdown */}
                    <td className="px-5 py-4">
                      <div className="font-mono font-bold text-slate-900">
                        {currency}{b.totalAmount}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        Paid: <span className="text-emerald-700 font-semibold">{currency}{b.paidAmount}</span>
                        {b.pendingAmount > 0 && (
                          <> · Due: <span className="text-amber-700 font-bold">{currency}{b.pendingAmount}</span></>
                        )}
                      </div>
                    </td>

                    {/* Payment status badge */}
                    <td className="px-5 py-4">
                      {b.paymentStatus === 'paid' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Paid
                        </span>
                      ) : b.paymentStatus === 'partial' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3" /> Partial
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-800 bg-rose-100 border border-rose-200 px-2.5 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" /> Unpaid
                        </span>
                      )}
                      <div className="text-[11px] text-slate-400 mt-1 capitalize">
                        via {b.paymentMethod}
                      </div>
                    </td>

                    {/* Booking Status */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                          b.bookingStatus === 'confirmed'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : b.bookingStatus === 'completed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {b.bookingStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.pendingAmount > 0 && b.bookingStatus !== 'cancelled' && (
                          <button
                            onClick={() => onOpenRecordPayment(b)}
                            className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Collect {currency}{b.pendingAmount}
                          </button>
                        )}

                        <button
                          onClick={() => onSelectBooking(b)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                          id={`view-booking-${b.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setBookingToDelete(b)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Booking"
                          id={`delete-booking-${b.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="lg:hidden space-y-3">
            {filteredBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {b.customerName || 'Walk-in Customer'}
                    </h3>
                    {b.customerPhone ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-xs text-slate-500 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {b.customerPhone}
                        </p>
                        <span
                          title="SMS Confirmation sent"
                          className="inline-flex items-center gap-0.5 text-[9px] font-sans font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200"
                        >
                          <MessageSquare className="w-2.5 h-2.5" /> SMS Sent
                        </span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic mt-0.5">
                        No phone provided
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        b.bookingStatus === 'confirmed'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : b.bookingStatus === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {b.bookingStatus}
                    </span>
                    <button
                      onClick={() => setBookingToDelete(b)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                      title="Delete Booking"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs border border-slate-200/60">
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-500">Turf:</span>
                    <span className="font-semibold text-slate-900 truncate max-w-[180px]">
                      {b.turfName}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-500">Date & Time:</span>
                    <span className="font-mono text-slate-800">
                      {b.date} · {b.startTime} – {b.endTime}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Payment:</span>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900">
                        {currency}{b.totalAmount}
                      </span>
                      <span className="text-slate-500 text-[11px] block">
                        Paid: <strong className="text-emerald-700">{currency}{b.paidAmount}</strong>
                        {b.pendingAmount > 0 && (
                          <span className="text-amber-700 font-semibold ml-1">
                            (Due: {currency}{b.pendingAmount})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mobile Actions */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  {b.pendingAmount > 0 && b.bookingStatus !== 'cancelled' && (
                    <button
                      onClick={() => onOpenRecordPayment(b)}
                      className="flex-1 py-2 px-3 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                    >
                      Collect {currency}{b.pendingAmount}
                    </button>
                  )}

                  <button
                    onClick={() => onSelectBooking(b)}
                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Booking Confirmation Modal */}
      {bookingToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Booking Record</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to permanently delete this booking for <strong className="text-slate-800">{bookingToDelete.customerName}</strong> ({bookingToDelete.turfName}, {bookingToDelete.date} at {bookingToDelete.startTime})?
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Deleting this booking will remove its record and release its time slot back to <strong>available</strong>.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setBookingToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteBooking}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                id="confirm-delete-booking-btn"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
