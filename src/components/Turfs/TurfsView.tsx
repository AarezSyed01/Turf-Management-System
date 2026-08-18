import React, { useState } from 'react';
import { Turf, SportType, FacilitySettings } from '../../types.ts';
import { addTurf, updateTurf, deleteTurf } from '../../lib/db.ts';
import {
  Plus,
  Edit2,
  Trash2,
  Trophy,
  CheckCircle2,
  XCircle,
  LandPlot,
  Layers,
  IndianRupee,
  Activity,
  AlertTriangle,
} from 'lucide-react';

interface TurfsViewProps {
  turfs: Turf[];
  settings: FacilitySettings;
}

export const TurfsView: React.FC<TurfsViewProps> = ({ turfs, settings }) => {
  const currency = settings.currencySymbol || '₹';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTurf, setEditingTurf] = useState<Turf | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sport: 'football' as SportType,
    pricePerHour: 800,
    isActive: true,
  });

  const openAddModal = () => {
    setEditingTurf(null);
    setFormData({
      name: '',
      sport: 'football',
      pricePerHour: 800,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (turf: Turf) => {
    setEditingTurf(turf);
    setFormData({
      name: turf.name,
      sport: turf.sport,
      pricePerHour: turf.pricePerHour,
      isActive: turf.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      if (editingTurf) {
        await updateTurf(editingTurf.id, {
          name: formData.name.trim(),
          sport: formData.sport,
          pricePerHour: Number(formData.pricePerHour),
          isActive: formData.isActive,
        });
      } else {
        await addTurf({
          name: formData.name.trim(),
          sport: formData.sport,
          pricePerHour: Number(formData.pricePerHour),
          isActive: formData.isActive,
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save turf:', error);
      alert('Error saving turf.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTurf(id);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete turf:', error);
      alert('Error deleting turf.');
    }
  };

  const getSportEmoji = (sport: SportType) => {
    switch (sport) {
      case 'football':
        return '⚽ Football';
      case 'cricket':
        return '🏏 Cricket Box';
      case 'badminton':
        return '🏸 Badminton';
      case 'pickleball':
        return '🏓 Pickleball';
      case 'tennis':
        return '🎾 Tennis';
      default:
        return '🏆 Multi-Sport';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <LandPlot className="w-6 h-6 text-emerald-600" />
            Manage Turfs & Courts
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure your sports pitches, hourly pricing, and availability.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-sm transition-all shadow-sm cursor-pointer"
          id="add-turf-btn"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Turf</span>
        </button>
      </div>

      {/* Turf Grid */}
      {turfs.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white border border-dashed border-slate-200 rounded-2xl shadow-xs">
          <LandPlot className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No Turfs Added Yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            Add your football turfs, cricket boxes, or sports courts to get started.
          </p>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 transition-all cursor-pointer shadow-sm"
          >
            Add Your First Turf
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {turfs.map((turf) => (
            <div
              key={turf.id}
              className={`bg-white border rounded-2xl p-5 flex flex-col justify-between transition-all shadow-xs hover:border-emerald-500 ${
                turf.isActive ? 'border-slate-200' : 'border-slate-200/80 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-emerald-700 border border-slate-200 mb-1.5">
                      {getSportEmoji(turf.sport)}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {turf.name}
                    </h3>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      turf.isActive
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {turf.isActive ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-slate-400" /> Inactive
                      </>
                    )}
                  </span>
                </div>

                {/* Rate Display */}
                <div className="py-3 border-y border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Hourly Rate:</span>
                  <span className="text-sm font-bold text-emerald-700 font-mono">
                    {currency}{turf.pricePerHour} / hr
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-2 flex items-center justify-between gap-2">
                <button
                  onClick={() => openEditModal(turf)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Turf
                </button>

                {deleteConfirmId === turf.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDelete(turf.id)}
                      className="py-2 px-3 bg-rose-600 text-white font-bold rounded-xl text-xs hover:bg-rose-700 transition-colors cursor-pointer shadow-xs"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="py-2 px-2 text-slate-500 hover:text-slate-900 text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(turf.id)}
                    title="Delete Turf"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Turf Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-xl relative">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editingTurf ? 'Edit Turf Court' : 'Add New Turf Court'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Specify court details and standard hourly rate.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Turf Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Football Turf 1 (Main Arena)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Sport Type *
                  </label>
                  <select
                    value={formData.sport}
                    onChange={(e) =>
                      setFormData({ ...formData, sport: e.target.value as SportType })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
                  >
                    <option value="football">⚽ Football</option>
                    <option value="cricket">🏏 Cricket Box</option>
                    <option value="badminton">🏸 Badminton</option>
                    <option value="pickleball">🏓 Pickleball</option>
                    <option value="tennis">🎾 Tennis</option>
                    <option value="multisport">🏆 Multi-Sport</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Price Per Hour ({currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.pricePerHour}
                    onChange={(e) =>
                      setFormData({ ...formData, pricePerHour: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 bg-slate-100 border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="isActiveToggle" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Turf is Active and available for bookings
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-900 text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {loading ? 'Saving...' : editingTurf ? 'Save Changes' : 'Create Turf'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
