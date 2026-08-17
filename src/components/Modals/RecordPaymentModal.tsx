import React, { useState } from 'react';
import { Booking, FacilitySettings, PaymentMethod } from '../../types.ts';
import { recordBookingPayment } from '../../lib/db.ts';
import {
  X,
  IndianRupee,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Phone,
} from 'lucide-react';

interface RecordPaymentModalProps {
  booking: Booking | null;
  settings: FacilitySettings;
  onClose: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  booking,
  settings,
  onClose,
}) => {
  if (!booking) return null;
  const currency = settings.currencySymbol || '₹';

  const [amount, setAmount] = useState<number>(booking.pendingAmount);
  const [method, setMethod] = useState<PaymentMethod>('UPI');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const remainingAfterPayment = Math.max(0, booking.pendingAmount - amount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    setLoading(true);
    try {
      await recordBookingPayment(
        booking.id,
        Number(amount),
        method,
        notes.trim() || 'Balance settlement'
      );
      onClose();
    } catch (error) {
      console.error(error);
      alert('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white border-t sm:border border-slate-200 rounded-t-3xl sm:rounded-2xl w-full max-w-md p-4 sm:p-6 shadow-2xl relative my-0 sm:my-8 max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Collect Payment
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Record receipt and settle pending balance
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer & Booking Summary Box */}
        <div className="flex-1 overflow-y-auto py-2 space-y-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-900 font-semibold">
              <span>👤 {booking.customerName}</span>
              <span className="font-mono text-slate-500">{booking.customerPhone}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Turf & Date:</span>
              <span className="text-slate-900 font-medium">{booking.turfName} ({booking.date})</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Slot:</span>
              <span className="font-mono text-slate-900">{booking.startTime} - {booking.endTime}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="text-slate-600">Current Outstanding Due:</span>
              <span className="font-mono font-bold text-amber-700 text-sm">
                {currency}{booking.pendingAmount}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} id="record-payment-form" className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Payment Amount ({currency}) *
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setAmount(booking.pendingAmount)}
                    className="px-2 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100"
                  >
                    Full Due ({currency}{booking.pendingAmount})
                  </button>
                  {booking.pendingAmount > 200 && (
                    <button
                      type="button"
                      onClick={() => setAmount(Math.round(booking.pendingAmount / 2))}
                      className="px-2 py-0.5 text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200"
                    >
                      50%
                    </button>
                  )}
                </div>
              </div>
              <input
                type="number"
                min={1}
                max={booking.pendingAmount}
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-emerald-700 font-mono font-bold text-lg focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
              {remainingAfterPayment > 0 ? (
                <p className="text-[11px] text-amber-700 mt-1">
                  Remaining balance after this collection: <strong>{currency}{remainingAfterPayment}</strong>
                </p>
              ) : (
                <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Fully clears all outstanding balance!
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Method *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['UPI', 'Cash', 'Card', 'Other'] as PaymentMethod[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border min-h-[44px] flex items-center justify-center ${
                      method === m
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Receipt Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Paid in cash at counter / GPay UPI Ref..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base sm:text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </form>
        </div>

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
            form="record-payment-form"
            disabled={loading || amount <= 0}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs min-h-[44px]"
          >
            {loading ? 'Recording...' : `Record ${currency}${amount}`}
          </button>
        </div>
      </div>
    </div>
  );
};
