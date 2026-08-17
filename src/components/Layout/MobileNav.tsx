import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Grid,
  Users,
  CreditCard,
  Settings,
  LandPlot,
  Plus,
} from 'lucide-react';
import { ActiveTab } from '../../types.ts';

interface MobileNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenNewBooking: () => void;
  todayBookingCount?: number;
  pendingPaymentCount?: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onTabChange,
  onOpenNewBooking,
  todayBookingCount = 0,
  pendingPaymentCount = 0,
}) => {
  const mainTabs: {
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }[] = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-5 h-5" /> },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: <CalendarDays className="w-5 h-5" />,
      badge: todayBookingCount > 0 ? todayBookingCount : undefined,
      badgeColor: 'bg-emerald-600',
    },
    { id: 'slots', label: 'Slots', icon: <Grid className="w-5 h-5" /> },
    {
      id: 'payments',
      label: 'Payments',
      icon: <CreditCard className="w-5 h-5" />,
      badge: pendingPaymentCount > 0 ? pendingPaymentCount : undefined,
      badgeColor: 'bg-amber-600',
    },
    { id: 'turfs', label: 'Turfs', icon: <LandPlot className="w-5 h-5" /> },
    { id: 'customers', label: 'Players', icon: <Users className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Floating Action Button for Mobile Quick Booking */}
      <div className="lg:hidden fixed bottom-18 right-3.5 z-40">
        <button
          onClick={onOpenNewBooking}
          className="flex items-center gap-1.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-full shadow-lg shadow-emerald-700/30 transition-transform active:scale-95 cursor-pointer touch-manipulation min-h-[44px] whitespace-nowrap"
          id="mobile-fab-booking"
          aria-label="Create New Booking"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="text-xs font-bold tracking-wide">New Booking</span>
        </button>
      </div>

      {/* Bottom Nav Bar with safe-area support and horizontal scroll */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg pb-safe">
        <div className="flex items-center justify-between px-1 py-1 overflow-x-auto no-scrollbar">
          {mainTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center py-1 px-1.5 rounded-xl text-[10px] transition-all min-w-[50px] min-h-[44px] cursor-pointer touch-manipulation relative ${
                  isActive
                    ? 'text-emerald-700 font-bold'
                    : 'text-slate-500 hover:text-slate-900 active:text-emerald-600 font-medium'
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all relative ${
                    isActive ? 'bg-emerald-50 text-emerald-700' : ''
                  }`}
                >
                  {tab.icon}
                  {tab.badge !== undefined && (
                    <span
                      className={`absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-extrabold text-white flex items-center justify-center ${
                        tab.badgeColor || 'bg-emerald-600'
                      }`}
                    >
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </div>
                <span className="mt-0.5 whitespace-nowrap leading-tight text-[10px]">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
