import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Grid,
  LandPlot,
  Users,
  CreditCard,
  Settings,
  PlusCircle,
  Trophy,
} from 'lucide-react';
import { ActiveTab } from '../../types.ts';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  pendingPaymentCount: number;
  todayBookingCount: number;
  onOpenNewBooking: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  pendingPaymentCount,
  todayBookingCount,
  onOpenNewBooking,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: <CalendarDays className="w-4 h-4" />,
      badge: todayBookingCount > 0 ? todayBookingCount : undefined,
    },
    {
      id: 'slots',
      label: 'Slots & Schedule',
      icon: <Grid className="w-4 h-4" />,
    },
    {
      id: 'turfs',
      label: 'Turfs',
      icon: <LandPlot className="w-4 h-4" />,
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: <CreditCard className="w-4 h-4" />,
      badge: pendingPaymentCount > 0 ? pendingPaymentCount : undefined,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0 min-h-[calc(100vh-61px)] p-4 shadow-xs">
      {/* Quick Booking CTA */}
      <div className="mb-6">
        <button
          onClick={onOpenNewBooking}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap"
          id="sidebar-new-booking-btn"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span>New Booking</span>
        </button>
      </div>

      {/* Main Nav Items */}
      <div className="flex-1 space-y-1.5">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Management
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              id={`nav-item-${item.id}`}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-emerald-600' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    item.id === 'payments'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer Info */}
      <div className="mt-auto pt-4 border-t border-slate-200">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-1">
            <Trophy className="w-3.5 h-3.5 text-emerald-600" />
            <span>Turf Operations Live</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Real-time live sync across devices with zero double-booking protection.
          </p>
        </div>
      </div>
    </aside>
  );
};
