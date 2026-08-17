import React, { useState } from 'react';
import { Customer, Booking, FacilitySettings } from '../../types.ts';
import { updateCustomer, deleteCustomer } from '../../lib/db.ts';
import {
  Users,
  Search,
  Phone,
  Calendar,
  IndianRupee,
  History,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Trophy,
  ChevronRight,
  Clock,
  UserCheck,
} from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  bookings: Booking[];
  settings: FacilitySettings;
  onOpenNewBooking: (turfId?: string, slot?: any, defaultCustomer?: { name: string; phone: string }) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  bookings,
  settings,
  onOpenNewBooking,
}) => {
  const currency = settings.currencySymbol || '₹';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.notes && c.notes.toLowerCase().includes(q))
    );
  });

  const getCustomerBookings = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return bookings.filter(
      (b) => b.customerPhone.replace(/[^0-9]/g, '') === cleanPhone
    );
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditName(customer.name);
    setEditNotes(customer.notes || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setIsSaving(true);
    try {
      await updateCustomer(editingCustomer.id, {
        name: editName.trim(),
        notes: editNotes.trim(),
      });
      if (selectedCustomer && selectedCustomer.id === editingCustomer.id) {
        setSelectedCustomer({
          ...selectedCustomer,
          name: editName.trim(),
          notes: editNotes.trim(),
        });
      }
      setEditingCustomer(null);
    } catch (error) {
      console.error(error);
      alert('Failed to update customer');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCustomer(customerToDelete.id);
      if (selectedCustomer?.id === customerToDelete.id) {
        setSelectedCustomer(null);
      }
      if (editingCustomer?.id === customerToDelete.id) {
        setEditingCustomer(null);
      }
      setCustomerToDelete(null);
    } catch (error) {
      console.error(error);
      alert('Failed to delete customer');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-emerald-600" />
            Customer Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Auto-synced customer database with lifetime spend, booking history, and balance.
          </p>
        </div>

        <div className="text-xs text-slate-600 bg-white border border-slate-200 px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-xs">
          <UserCheck className="w-4 h-4 text-emerald-600" />
          <span><strong>{customers.length}</strong> Registered Players</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search players by name, phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Customer Cards & History */}
      {filteredCustomers.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white border border-dashed border-slate-200 rounded-2xl shadow-xs">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No Customers Found</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Customers are automatically added when you create a booking.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => {
            const customerBookings = getCustomerBookings(customer.phone);

            return (
              <div
                key={customer.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 flex flex-col justify-between transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {customer.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        {customer.phone}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(customer)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit Customer"
                        id={`edit-customer-${customer.id}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setCustomerToDelete(customer)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Customer"
                        id={`delete-customer-${customer.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Lifetime metrics */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 my-3 text-center">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Bookings</span>
                      <span className="text-sm font-bold text-slate-900">
                        {customer.totalBookings || customerBookings.length}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Spent</span>
                      <span className="text-sm font-bold text-emerald-700 font-mono">
                        {currency}{customer.totalSpent || 0}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Pending</span>
                      <span
                        className={`text-sm font-bold font-mono ${
                          (customer.pendingAmount || 0) > 0 ? 'text-amber-700' : 'text-slate-500'
                        }`}
                      >
                        {currency}{customer.pendingAmount || 0}
                      </span>
                    </div>
                  </div>

                  {customer.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl mb-3 line-clamp-2 border border-slate-200/60">
                      📝 {customer.notes}
                    </p>
                  )}

                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Last Active:</span>
                    <span className="text-slate-800 font-medium">
                      {customer.lastBookingDate || 'Recently'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-2 flex items-center gap-2 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedCustomer(customer)}
                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5" />
                    History ({customerBookings.length})
                  </button>

                  <button
                    onClick={() =>
                      onOpenNewBooking(undefined, undefined, {
                        name: customer.name,
                        phone: customer.phone,
                      })
                    }
                    className="py-2 px-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    + Book
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Booking History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 shadow-xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>👤 {selectedCustomer.name}</span>
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Phone: {selectedCustomer.phone}
                </p>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 block">Total Bookings</span>
                <span className="text-lg font-bold text-slate-900">
                  {selectedCustomer.totalBookings || 0}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 block">Total Spent</span>
                <span className="text-lg font-bold text-emerald-700 font-mono">
                  {currency}{selectedCustomer.totalSpent || 0}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 block">Outstanding Balance</span>
                <span className="text-lg font-bold text-amber-700 font-mono">
                  {currency}{selectedCustomer.pendingAmount || 0}
                </span>
              </div>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Booking History
              </h4>
              {getCustomerBookings(selectedCustomer.phone).length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No previous bookings found.
                </div>
              ) : (
                getCustomerBookings(selectedCustomer.phone).map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {b.turfName}
                      </div>
                      <div className="text-slate-500 mt-0.5 font-mono">
                        {b.date} · {b.startTime} - {b.endTime}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-900">
                        {currency}{b.totalAmount}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          b.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {b.paymentStatus.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const target = selectedCustomer;
                  setSelectedCustomer(null);
                  setCustomerToDelete(target);
                }}
                className="px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Customer
              </button>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Notes Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-3">Edit Customer Info</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Notes / Group Details
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Regular weekend captain, prefers football turf 1..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = editingCustomer;
                    setEditingCustomer(null);
                    setCustomerToDelete(target);
                  }}
                  className="px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCustomer(null)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Customer Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Customer</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to delete <strong className="text-slate-800">{customerToDelete.name}</strong> ({customerToDelete.phone}) from the customer directory?
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                This will remove the player profile from the directory. Historical bookings and payment records remain saved.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                id="confirm-delete-customer-btn"
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
