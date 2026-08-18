import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Layout/Navbar.tsx';
import { Sidebar } from './components/Layout/Sidebar.tsx';
import { MobileNav } from './components/Layout/MobileNav.tsx';
import { DashboardView } from './components/Dashboard/DashboardView.tsx';
import { BookingsView } from './components/Bookings/BookingsView.tsx';
import { SlotsView } from './components/Slots/SlotsView.tsx';
import { TurfsView } from './components/Turfs/TurfsView.tsx';
import { CustomersView } from './components/Customers/CustomersView.tsx';
import { PaymentsView } from './components/Payments/PaymentsView.tsx';
import { SettingsView } from './components/Settings/SettingsView.tsx';
import { NewBookingModal } from './components/Modals/NewBookingModal.tsx';
import { RecordPaymentModal } from './components/Modals/RecordPaymentModal.tsx';
import { BlockSlotModal } from './components/Modals/BlockSlotModal.tsx';
import { BookingDetailsModal } from './components/Modals/BookingDetailsModal.tsx';
import { InitialTurfSetupModal } from './components/Modals/InitialTurfSetupModal.tsx';

import {
  subscribeToTurfs,
  subscribeToSlots,
  subscribeToBookings,
  subscribeToCustomers,
  subscribeToPayments,
  subscribeToFacilitySettings,
  seedSampleData,
} from './lib/db.ts';

import {
  Turf,
  Slot,
  Booking,
  Customer,
  PaymentRecord,
  FacilitySettings,
  ActiveTab,
} from './types.ts';

import { Loader2 } from 'lucide-react';

const defaultFacilitySettings: FacilitySettings = {
  facilityName: 'Apex Arena & Sports Turf',
  phone: '+91 98765 43210',
  address: 'Ring Road Sports Complex, Mumbai',
  currencySymbol: '₹',
  openingHour: 6,
  closingHour: 23,
  passcode: '1234',
};

const MainApp: React.FC = () => {
  // App State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [settings, setSettings] = useState<FacilitySettings>(defaultFacilitySettings);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Modal States
  const [isInitialTurfSetupOpen, setIsInitialTurfSetupOpen] = useState(false);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [bookingPreselectTurfId, setBookingPreselectTurfId] = useState<string | undefined>();
  const [bookingPreselectSlot, setBookingPreselectSlot] = useState<Slot | undefined>();
  const [bookingDefaultCustomer, setBookingDefaultCustomer] = useState<
    { name: string; phone: string } | undefined
  >();
  const [bookingInitialMode, setBookingInitialMode] = useState<'predefined' | 'custom'>('predefined');

  const [paymentBookingTarget, setPaymentBookingTarget] = useState<Booking | null>(null);
  const [blockSlotTarget, setBlockSlotTarget] = useState<Slot | null>(null);
  const [detailsBookingTarget, setDetailsBookingTarget] = useState<Booking | null>(null);

  // Subscribe to real-time Firestore collections immediately on mount
  useEffect(() => {
    let unsubCount = 0;
    const checkLoaded = () => {
      unsubCount++;
      if (unsubCount >= 4) {
        setDataLoaded(true);
      }
    };

    const unsubTurfs = subscribeToTurfs((data) => {
      setTurfs(data);
      checkLoaded();
      // If first time opening app or no turfs configured, prompt for initial turf & owner setup
      const hasCompletedSetup = localStorage.getItem('turf_initial_setup_completed');
      if (!hasCompletedSetup || data.length === 0) {
        setIsInitialTurfSetupOpen(true);
      }
    });

    const unsubSlots = subscribeToSlots((data) => {
      setSlots(data);
      checkLoaded();
    });

    const unsubBookings = subscribeToBookings((data) => {
      setBookings(data);
      checkLoaded();
    });

    const unsubCustomers = subscribeToCustomers((data) => {
      setCustomers(data);
      checkLoaded();
    });

    const unsubPayments = subscribeToPayments((data) => {
      setPayments(data);
    });

    const unsubSettings = subscribeToFacilitySettings((data) => {
      if (data) setSettings(data);
    });

    return () => {
      unsubTurfs();
      unsubSlots();
      unsubBookings();
      unsubCustomers();
      unsubPayments();
      unsubSettings();
    };
  }, []);

  // Handler for opening New Booking Modal
  const handleOpenNewBooking = (
    turfId?: string,
    slot?: Slot,
    defaultCust?: { name: string; phone: string },
    mode?: 'predefined' | 'custom'
  ) => {
    setBookingPreselectTurfId(turfId);
    setBookingPreselectSlot(slot);
    setBookingDefaultCustomer(defaultCust);
    setBookingInitialMode(mode || 'predefined');
    setIsNewBookingOpen(true);
  };

  // Handler for Seeding sample data
  const handleSeedData = async () => {
    try {
      await seedSampleData();
    } catch (e) {
      console.error('Seed error:', e);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookingsCount = bookings.filter(
    (b) => b.date === todayStr && b.bookingStatus !== 'cancelled'
  ).length;
  const pendingPaymentCount = bookings.filter(
    (b) => b.bookingStatus !== 'cancelled' && b.pendingAmount > 0
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        settings={settings}
        activeTurfCount={turfs.filter((t) => t.isActive).length}
        onOpenNewBooking={() => handleOpenNewBooking()}
        onOpenTurfSetup={() => setIsInitialTurfSetupOpen(true)}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          todayBookingCount={todayBookingsCount}
          pendingPaymentCount={pendingPaymentCount}
          onOpenNewBooking={() => handleOpenNewBooking()}
        />

        {/* Dynamic Main View Tab Content */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 sm:pb-8 bg-slate-50">
          {activeTab === 'dashboard' && (
            <DashboardView
              turfs={turfs}
              slots={slots}
              bookings={bookings}
              customers={customers}
              payments={payments}
              settings={settings}
              onOpenNewBooking={handleOpenNewBooking}
              onOpenRecordPayment={(b) => setPaymentBookingTarget(b)}
              onOpenBlockSlot={(s) => setBlockSlotTarget(s)}
              onSelectBooking={(b) => setDetailsBookingTarget(b)}
              onNavigateToTab={setActiveTab}
              onSeedData={handleSeedData}
              onOpenTurfSetup={() => setIsInitialTurfSetupOpen(true)}
            />
          )}

          {activeTab === 'bookings' && (
            <BookingsView
              bookings={bookings}
              turfs={turfs}
              settings={settings}
              onOpenNewBooking={() => handleOpenNewBooking()}
              onSelectBooking={(b) => setDetailsBookingTarget(b)}
              onOpenRecordPayment={(b) => setPaymentBookingTarget(b)}
            />
          )}

          {activeTab === 'slots' && (
            <SlotsView
              turfs={turfs}
              slots={slots}
              settings={settings}
              onOpenNewBooking={handleOpenNewBooking}
              onOpenBlockSlot={(s) => setBlockSlotTarget(s)}
            />
          )}

          {activeTab === 'turfs' && (
            <TurfsView turfs={turfs} settings={settings} />
          )}

          {activeTab === 'customers' && (
            <CustomersView
              customers={customers}
              bookings={bookings}
              settings={settings}
              onOpenNewBooking={handleOpenNewBooking}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentsView
              bookings={bookings}
              payments={payments}
              settings={settings}
              onOpenRecordPayment={(b) => setPaymentBookingTarget(b)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView settings={settings} />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenNewBooking={() => handleOpenNewBooking()}
        todayBookingCount={todayBookingsCount}
        pendingPaymentCount={pendingPaymentCount}
      />

      {/* New Booking Modal */}
      {isNewBookingOpen && (
        <NewBookingModal
          isOpen={isNewBookingOpen}
          onClose={() => setIsNewBookingOpen(false)}
          turfs={turfs}
          slots={slots}
          customers={customers}
          settings={settings}
          preselectedTurfId={bookingPreselectTurfId}
          preselectedSlot={bookingPreselectSlot}
          defaultCustomer={bookingDefaultCustomer}
          initialMode={bookingInitialMode}
        />
      )}

      {/* Record Payment / Settle Balance Modal */}
      {paymentBookingTarget && (
        <RecordPaymentModal
          booking={paymentBookingTarget}
          settings={settings}
          onClose={() => setPaymentBookingTarget(null)}
        />
      )}

      {/* Block / Unblock Slot Modal */}
      {blockSlotTarget && (
        <BlockSlotModal
          slot={blockSlotTarget}
          settings={settings}
          onClose={() => setBlockSlotTarget(null)}
        />
      )}

      {/* Booking Details / Receipt Modal */}
      {detailsBookingTarget && (
        <BookingDetailsModal
          booking={detailsBookingTarget}
          settings={settings}
          onClose={() => setDetailsBookingTarget(null)}
          onOpenRecordPayment={(b) => {
            setDetailsBookingTarget(null);
            setPaymentBookingTarget(b);
          }}
        />
      )}
      {/* Initial Turf Setup Onboarding Modal */}
      {isInitialTurfSetupOpen && (
        <InitialTurfSetupModal
          isOpen={isInitialTurfSetupOpen}
          onClose={() => setIsInitialTurfSetupOpen(false)}
          existingSettings={settings}
          onSeedData={handleSeedData}
        />
      )}
    </div>
  );
};

export default function App() {
  return <MainApp />;
}
