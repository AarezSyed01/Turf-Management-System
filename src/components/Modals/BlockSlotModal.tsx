import React, { useState } from 'react';
import { Slot, FacilitySettings } from '../../types.ts';
import { blockSlot, unblockSlot } from '../../lib/db.ts';
import { X, Ban, Unlock, ShieldAlert, Wrench, Lock, UserCheck } from 'lucide-react';

interface BlockSlotModalProps {
  slot: Slot | null;
  settings: FacilitySettings;
  onClose: () => void;
}

export const BlockSlotModal: React.FC<BlockSlotModalProps> = ({
  slot,
  settings,
  onClose,
}) => {
  if (!slot) return null;

  const [reasonCategory, setReasonCategory] = useState<string>('Maintenance');
  const [customNotes, setCustomNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const isAlreadyBlocked = slot.status === 'blocked';

  const handleBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fullReason =
        reasonCategory === 'Other'
          ? customNotes.trim() || 'Other'
          : customNotes.trim()
          ? `${reasonCategory}: ${customNotes.trim()}`
          : reasonCategory;

      await blockSlot(slot.id, fullReason);
      onClose();
    } catch (error) {
      console.error(error);
      alert('Failed to block slot.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async () => {
    setLoading(true);
    try {
      await unblockSlot(slot.id);
      onClose();
    } catch (error) {
      console.error(error);
      alert('Failed to unblock slot.');
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
              <Ban className="w-5 h-5 text-rose-600" />
              {isAlreadyBlocked ? 'Manage Blocked Slot' : 'Block Turf Slot'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Prevent regular bookings for maintenance, personal use or private games.
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

        {/* Slot Info */}
        <div className="flex-1 overflow-y-auto py-2 space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
            <div className="flex justify-between text-slate-900 font-semibold">
              <span>🏟️ {slot.turfName}</span>
              <span className="font-mono text-emerald-700">{slot.date}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Time Slot:</span>
              <span className="font-mono text-slate-800 font-bold">{slot.startTime} – {slot.endTime}</span>
            </div>
            {isAlreadyBlocked && slot.blockReason && (
              <div className="pt-2 border-t border-slate-200 text-rose-700 font-medium">
                Current reason: <strong>{slot.blockReason}</strong>
              </div>
            )}
          </div>

          {isAlreadyBlocked ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                This slot is currently marked as blocked and cannot be reserved by regular customers. Click unblock below to make it open for booking again.
              </p>
            </div>
          ) : (
            <form onSubmit={handleBlock} id="block-slot-form" className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Reason for Blocking *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Maintenance / Repair', value: 'Maintenance' },
                    { label: 'Private Match / Event', value: 'Private Booking' },
                    { label: 'Personal / Owner Use', value: 'Personal Use' },
                    { label: 'Other Reason', value: 'Other' },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setReasonCategory(item.value)}
                      className={`p-3 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer border min-h-[48px] flex items-center ${
                        reasonCategory === item.value
                          ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Specific Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Floodlight repair / Owner practice match..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base sm:text-sm focus:outline-none focus:border-rose-500 focus:bg-white"
                />
              </div>
            </form>
          )}
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
          {isAlreadyBlocked ? (
            <button
              type="button"
              onClick={handleUnblock}
              disabled={loading}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs min-h-[44px]"
            >
              <Unlock className="w-4 h-4" />
              <span>{loading ? 'Unblocking...' : 'Unblock Slot'}</span>
            </button>
          ) : (
            <button
              type="submit"
              form="block-slot-form"
              disabled={loading}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs min-h-[44px]"
            >
              <Ban className="w-4 h-4" />
              <span>{loading ? 'Blocking...' : 'Confirm Block'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
