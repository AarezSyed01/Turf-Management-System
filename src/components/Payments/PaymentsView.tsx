import React, { useState } from 'react';
import { Booking, PaymentRecord, FacilitySettings } from '../../types.ts';
import {
  CreditCard,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Receipt,
  ArrowDownRight,
  Filter,
  Layers,
  Sparkles,
} from 'lucide-react';

interface PaymentsViewProps {
  bookings: Booking[];
  payments: PaymentRecord[];
  settings: FacilitySettings;
  onOpenRecordPayment: (booking: Booking) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  bookings,
  payments,
  settings,
  onOpenRecordPayment,
}) => {
  const currency = settings.currencySymbol || '₹';
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<'pending' | 'ledger'>('pending');
  const [filterMethod, setFilterMethod] = useState<string>('all');

  // Calculations
  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

  const activeBookings = bookings.filter((b) => b.bookingStatus !== 'cancelled');

  const pendingPaymentsSum = activeBookings.reduce(
    (acc, b) => acc + (b.pendingAmount || 0),
    0
  );

  const paidBookingsCount = activeBookings.filter((b) => b.paymentStatus === 'paid').length;
  const partialBookingsCount = activeBookings.filter((b) => b.paymentStatus === 'partial').length;
  const unpaidBookingsCount = activeBookings.filter((b) => b.paymentStatus === 'pending').length;

  // Unsettled bookings queue
  const pendingBookingsQueue = activeBookings.filter(
    (b) => b.pendingAmount > 0
  );

  const filteredPending = pendingBookingsQueue.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.customerName.toLowerCase().includes(q) ||
      b.customerPhone.toLowerCase().includes(q) ||
      b.turfName.toLowerCase().includes(q)
    );
  });

  const filteredPayments = payments.filter((p) => {
    if (filterMethod !== 'all' && p.paymentMethod !== filterMethod) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.customerName.toLowerCase().includes(q) ||
      p.customerPhone.toLowerCase().includes(q) ||
      p.paymentMethod.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <CreditCard className="w-6 h-6 text-emerald-600" />
          Payments & Cashflow Tracker
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitor revenue collections, settle outstanding receivables, and view payment receipts.
        </p>
      </div>

      {/* Financial KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Collected */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Total Collected</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono">
            {currency}{totalCollected.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Across {payments.length} successful transactions
          </p>
        </div>

        {/* Pending Receivables */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Pending Receivables</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 font-mono">
            {currency}{pendingPaymentsSum.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-amber-700/90 mt-1.5">
            {pendingBookingsQueue.length} bookings with due balance
          </p>
        </div>

        {/* Paid Bookings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Fully Paid Bookings</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {paidBookingsCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            100% Cleared Reservations
          </p>
        </div>

        {/* Partial & Unpaid */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Partially Paid Bookings</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {partialBookingsCount + unpaidBookingsCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            {partialBookingsCount} partial · {unpaidBookingsCount} unpaid
          </p>
        </div>
      </div>

      {/* Tab Switcher & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setTab('pending')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tab === 'pending'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Due Payments Queue ({pendingBookingsQueue.length})
          </button>
          <button
            onClick={() => setTab('ledger')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tab === 'ledger'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Transaction History ({payments.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          {tab === 'ledger' && (
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white"
            >
              <option value="all">All Methods</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Other">Other</option>
            </select>
          )}

          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Tab 1: Pending / Unsettled Bookings Queue */}
      {tab === 'pending' && (
        <div>
          {filteredPending.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white border border-dashed border-slate-200 rounded-2xl shadow-xs">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900">All Payments Are Settled!</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
                There are no pending amounts or outstanding balances from any active bookings.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPending.map((b) => (
                <div
                  key={b.id}
                  className="bg-white border border-amber-200 hover:border-amber-300 rounded-2xl p-5 flex flex-col justify-between transition-all shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">
                          {b.customerName}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {b.customerPhone}
                        </p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        Due: {currency}{b.pendingAmount}
                      </span>
                    </div>

                    {/* Booking Breakdown */}
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-xs my-3">
                      <div className="flex justify-between text-slate-600">
                        <span className="text-slate-500">Turf:</span>
                        <span className="font-medium text-slate-900 truncate max-w-[160px]">
                          {b.turfName}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="text-slate-500">Date & Slot:</span>
                        <span className="font-mono text-slate-800">
                          {b.date} · {b.startTime}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                        <span className="text-slate-500">Total Price:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {currency}{b.totalAmount}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="text-slate-500">Already Paid:</span>
                        <span className="font-mono text-emerald-700 font-semibold">
                          {currency}{b.paidAmount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mark as paid button */}
                  <button
                    onClick={() => onOpenRecordPayment(b)}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Collect Payment ({currency}{b.pendingAmount})</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Transaction Ledger History */}
      {tab === 'ledger' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Receipt className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No Transactions Recorded</h3>
              <p className="text-xs text-slate-500 mt-1">
                Payments recorded during booking or settlement will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Customer</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Method</th>
                    <th className="px-5 py-3.5">Timestamp</th>
                    <th className="px-5 py-3.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p) => {
                    const formattedTime = new Date(p.recordedAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                    });

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900">
                            {p.customerName}
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            {p.customerPhone}
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="font-mono font-bold text-emerald-700 text-sm">
                            +{currency}{p.amount}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            💳 {p.paymentMethod}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">
                          {formattedTime}
                        </td>

                        <td className="px-5 py-3.5 text-xs text-slate-500 max-w-xs truncate">
                          {p.notes || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
