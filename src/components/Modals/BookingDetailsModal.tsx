import React, { useState } from 'react';
import { Booking, FacilitySettings } from '../../types.ts';
import { cancelBooking, markBookingCompleted, deleteBooking } from '../../lib/db.ts';
import {
  sendBookingConfirmationSMS,
  formatBookingConfirmationSMS,
  openDeviceSMSApp,
  createDeviceSMSUri,
} from '../../lib/sms.ts';
import {
  X,
  Calendar,
  Clock,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  XCircle,
  CreditCard,
  Printer,
  Share2,
  Trash2,
  Ban,
  ShieldCheck,
  MessageSquare,
  Send,
  Copy,
  Check,
} from 'lucide-react';

interface BookingDetailsModalProps {
  booking: Booking | null;
  settings: FacilitySettings;
  onClose: () => void;
  onOpenRecordPayment: (booking: Booking) => void;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  booking,
  settings,
  onClose,
  onOpenRecordPayment,
}) => {
  if (!booking) return null;
  const currency = settings.currencySymbol || '₹';

  const [loading, setLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [smsSending, setSmsSending] = useState(false);
  const [smsFeedback, setSmsFeedback] = useState<string | null>(null);
  const [hasCopiedSMS, setHasCopiedSMS] = useState(false);

  const formattedConfirmationText = formatBookingConfirmationSMS(booking, settings);

  const handleSendManualSMS = async () => {
    if (!booking.customerPhone) {
      alert('No customer phone number available for this booking.');
      return;
    }
    // Also launch the phone's native SMS app with the prefilled formatted text
    openDeviceSMSApp(booking.customerPhone, formattedConfirmationText);

    setSmsSending(true);
    setSmsFeedback(null);
    try {
      const res = await sendBookingConfirmationSMS(booking, settings);
      if (res.success) {
        setSmsFeedback('✓ SMS Confirmation recorded & opened!');
      } else {
        setSmsFeedback(`⚠️ ${res.error || 'Failed to send via gateway, opened in phone SMS'}`);
      }
      setTimeout(() => setSmsFeedback(null), 4000);
    } catch (err: any) {
      setSmsFeedback('Opened in phone SMS');
      setTimeout(() => setSmsFeedback(null), 4000);
    } finally {
      setSmsSending(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      await cancelBooking(booking.id, booking.slotId);
      onClose();
    } catch (error) {
      console.error(error);
      alert('Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteBooking(booking.id, booking.slotId);
      onClose();
    } catch (error) {
      console.error(error);
      alert('Failed to delete booking');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await markBookingCompleted(booking.id);
      onClose();
    } catch (error) {
      console.error(error);
      alert('Failed to mark booking as completed');
    } finally {
      setLoading(false);
    }
  };

  const shareText = `*${settings.facilityName || 'Turf'} Booking Receipt*%0A` +
    `👤 Customer: ${booking.customerName}%0A` +
    `🏟️ Turf: ${booking.turfName}%0A` +
    `📅 Date: ${booking.date}%0A` +
    `⏰ Time: ${booking.startTime} - ${booking.endTime}%0A` +
    `💰 Total: ${currency}${booking.totalAmount}%0A` +
    `✅ Paid: ${currency}${booking.paidAmount}%0A` +
    (booking.pendingAmount > 0 ? `⚠️ Pending Due: ${currency}${booking.pendingAmount}%0A` : `✨ Status: Fully Paid%0A`) +
    `%0AThank you for playing with us!`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white border-t sm:border border-slate-200 rounded-t-3xl sm:rounded-2xl w-full max-w-lg p-4 sm:p-6 shadow-2xl relative my-0 sm:my-8 max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Booking Details</h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  booking.bookingStatus === 'confirmed'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : booking.bookingStatus === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {booking.bookingStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Ref ID: #{booking.id.substring(0, 8)}
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

        {/* Receipt Container with Scroll */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3">
          {/* Customer info with prominent Call and WhatsApp buttons */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Customer Details
              </span>
              {booking.customerPhone && (
                <a
                  href={`tel:${booking.customerPhone}`}
                  className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" /> Call Player
                </a>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-900">{booking.customerName || 'Walk-in Customer'}</span>
              <span className="text-sm font-mono font-medium text-slate-700">
                {booking.customerPhone || <span className="text-xs text-slate-400 font-sans italic">Not provided</span>}
              </span>
            </div>
          </div>

          {/* Turf & Slot */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Turf Court:</span>
              <span className="font-semibold text-slate-900">{booking.turfName}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Date:</span>
              <span className="font-mono text-slate-800">{booking.date}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Time Slot:</span>
              <span className="font-mono font-bold text-emerald-700 text-sm">
                {booking.startTime} – {booking.endTime}
              </span>
            </div>
            {booking.notes && (
              <div className="pt-2 border-t border-slate-200 text-slate-600">
                <span>Notes: </span>
                <span className="text-slate-900 font-medium">{booking.notes}</span>
              </div>
            )}
          </div>

          {/* Payment Breakdown */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Total Booking Amount:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {currency}{booking.totalAmount}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Amount Paid ({booking.paymentMethod}):</span>
              <span className="font-mono font-bold text-emerald-700">
                {currency}{booking.paidAmount}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="font-semibold text-slate-700">Outstanding Due:</span>
              <span
                className={`font-mono font-extrabold text-base ${
                  booking.pendingAmount > 0 ? 'text-amber-700' : 'text-emerald-700'
                }`}
              >
                {currency}{booking.pendingAmount}
              </span>
            </div>
          </div>

          {/* SMS & WhatsApp Action Area */}
          <div className="pt-1 space-y-2.5">
            {booking.customerPhone ? (
              <div className="space-y-2">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      Confirmation Message (for {booking.customerPhone})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(formattedConfirmationText);
                        setHasCopiedSMS(true);
                        setTimeout(() => setHasCopiedSMS(false), 2500);
                      }}
                      className="text-[11px] text-emerald-300 hover:text-white font-semibold cursor-pointer flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700"
                    >
                      <Copy className="w-3 h-3" />
                      {hasCopiedSMS ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-[11px] font-mono text-emerald-200 whitespace-pre-wrap leading-relaxed">
                    {formattedConfirmationText}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleSendManualSMS}
                    disabled={smsSending}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors min-h-[44px] cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>📱 Open Phone SMS App</span>
                  </button>

                  <a
                    href={`https://wa.me/${booking.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(formattedConfirmationText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors min-h-[44px] text-center"
                  >
                    <Share2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Send via WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : (
              <a
                href={`https://wa.me/?text=${encodeURIComponent(formattedConfirmationText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
              >
                <Share2 className="w-4 h-4 text-emerald-700" />
                <span>Share WhatsApp Booking Receipt</span>
              </a>
            )}

            {smsFeedback && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-800 text-center animate-fadeIn">
                {smsFeedback}
              </div>
            )}
          </div>
        </div>

        {/* Confirmation prompt for Cancellation */}
        {showCancelConfirm ? (
          <div className="mt-2 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 shrink-0">
            <div className="text-xs text-amber-900 font-medium">
              Cancel this booking? The slot will immediately be made available again for other bookings, and status marked as cancelled.
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-3 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer min-h-[40px]"
              >
                Back
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 bg-amber-600 text-white font-bold rounded-xl text-xs hover:bg-amber-700 cursor-pointer disabled:opacity-50 min-h-[40px]"
              >
                {loading ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        ) : showDeleteConfirm ? (
          <div className="mt-2 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 shrink-0">
            <div className="text-xs text-rose-900 font-medium">
              Are you sure you want to permanently delete this booking record? The time slot will be released.
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer min-h-[40px]"
              >
                Back
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl text-xs hover:bg-rose-700 cursor-pointer disabled:opacity-50 min-h-[40px] flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {loading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1">
              {booking.bookingStatus !== 'cancelled' && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="p-2 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors min-h-[44px]"
                  title="Cancel Booking (Keep Record)"
                >
                  <Ban className="w-3.5 h-3.5 text-amber-600" />
                  <span>Cancel</span>
                </button>
              )}

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors min-h-[44px]"
                title="Delete Booking Permanently"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete</span>
              </button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {booking.pendingAmount > 0 && booking.bookingStatus !== 'cancelled' && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenRecordPayment(booking);
                  }}
                  className="px-4 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-[44px]"
                >
                  Collect {currency}{booking.pendingAmount}
                </button>
              )}

              {booking.bookingStatus === 'confirmed' && (
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs min-h-[44px]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Completed</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
