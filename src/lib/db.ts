import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase.ts';
import {
  Turf,
  Slot,
  Booking,
  Customer,
  PaymentRecord,
  FacilitySettings,
  PaymentMethod,
} from '../types.ts';

// ----------------------------------------------------
// TURFS
// ----------------------------------------------------

export function subscribeTurfs(callback: (turfs: Turf[]) => void) {
  const colRef = collection(db, 'turfs');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Turf[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Turf, 'id'>) });
      });
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'turfs');
    }
  );
}

export async function addTurf(data: Omit<Turf, 'id' | 'createdAt'>): Promise<string> {
  const docRef = doc(collection(db, 'turfs'));
  const newTurf: Turf = {
    id: docRef.id,
    ...data,
    createdAt: new Date().toISOString(),
  };
  try {
    await setDoc(docRef, newTurf);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `turfs/${docRef.id}`);
  }
}

export async function updateTurf(id: string, data: Partial<Turf>): Promise<void> {
  try {
    const docRef = doc(db, 'turfs', id);
    await updateDoc(docRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `turfs/${id}`);
  }
}

export async function deleteTurf(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'turfs', id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `turfs/${id}`);
  }
}

// ----------------------------------------------------
// SLOTS
// ----------------------------------------------------

export function subscribeSlots(callback: (slots: Slot[]) => void) {
  const colRef = collection(db, 'slots');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Slot[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Slot, 'id'>) });
      });
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'slots');
    }
  );
}

export function subscribeSlotsForDate(date: string, callback: (slots: Slot[]) => void) {
  const q = query(collection(db, 'slots'), where('date', '==', date));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Slot[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Slot, 'id'>) });
      });
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `slots?date=${date}`);
    }
  );
}

export async function generateSlotsForDate(params: {
  date: string;
  turfId: string;
  turfName: string;
  openingHour?: number; // e.g. 6 (6 AM)
  closingHour?: number; // e.g. 23 (11 PM)
  slotDurationMinutes?: number; // e.g. 60
  pricePerHour?: number;
}): Promise<number> {
  const {
    date,
    turfId,
    turfName,
    openingHour = 6,
    closingHour = 23,
    slotDurationMinutes = 60,
    pricePerHour = 800,
  } = params;
  
  // Format helpers
  const formatTimeStr = (hour: number, minute: number): string => {
    const h = hour % 24;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const minStr = minute < 10 ? `0${minute}` : `${minute}`;
    return `${displayH}:${minStr} ${period}`;
  };

  const totalMinutesStart = openingHour * 60;
  const totalMinutesEnd = closingHour * 60;
  let count = 0;

  try {
    // Check existing slots to avoid duplicates
    const existingQ = query(
      collection(db, 'slots'),
      where('date', '==', date),
      where('turfId', '==', turfId)
    );
    const snap = await getDocs(existingQ);
    const existingMap = new Map<string, Slot>();
    snap.forEach((d) => {
      const data = d.data() as Slot;
      existingMap.set(data.startTime, data);
    });

    for (let current = totalMinutesStart; current < totalMinutesEnd; current += slotDurationMinutes) {
      const startH = Math.floor(current / 60);
      const startM = current % 60;
      const endTotal = current + slotDurationMinutes;
      const endH = Math.floor(endTotal / 60);
      const endM = endTotal % 60;

      const startTimeStr = formatTimeStr(startH, startM);
      const endTimeStr = formatTimeStr(endH, endM);

      if (!existingMap.has(startTimeStr)) {
        const slotRef = doc(collection(db, 'slots'));
        const newSlot: Slot = {
          id: slotRef.id,
          turfId,
          turfName,
          date,
          startTime: startTimeStr,
          endTime: endTimeStr,
          price: pricePerHour,
          status: 'available',
          createdAt: new Date().toISOString(),
        };
        await setDoc(slotRef, newSlot);
        count++;
      }
    }
    return count;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'slots/bulk-generate');
  }
}

export async function blockSlot(slotId: string, reason: string): Promise<void> {
  try {
    const docRef = doc(db, 'slots', slotId);
    await updateDoc(docRef, {
      status: 'blocked',
      blockReason: reason || 'Facility Maintenance',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `slots/${slotId}`);
  }
}

export async function unblockSlot(slotId: string): Promise<void> {
  try {
    const docRef = doc(db, 'slots', slotId);
    await updateDoc(docRef, {
      status: 'available',
      blockReason: null,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `slots/${slotId}`);
  }
}

export async function updateSlotPrice(slotId: string, newPrice: number): Promise<void> {
  try {
    const docRef = doc(db, 'slots', slotId);
    await updateDoc(docRef, { price: newPrice });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `slots/${slotId}`);
  }
}

export async function addCustomSlot(data: {
  turfId: string;
  turfName: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
}): Promise<string> {
  const slotRef = doc(collection(db, 'slots'));
  const newSlot: Slot = {
    id: slotRef.id,
    turfId: data.turfId,
    turfName: data.turfName,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    price: Number(data.price),
    status: 'available',
    isCustom: true,
    createdAt: new Date().toISOString(),
  };
  try {
    await setDoc(slotRef, newSlot);
    return slotRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `slots/${slotRef.id}`);
  }
}

// ----------------------------------------------------
// BOOKINGS & CUSTOMER AGGREGATION
// ----------------------------------------------------

export function subscribeBookings(callback: (bookings: Booking[]) => void) {
  const colRef = collection(db, 'bookings');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Booking[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Booking, 'id'>) });
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'bookings');
    }
  );
}

export async function createBooking(data: {
  customerName: string;
  customerPhone: string;
  turfId: string;
  turfName: string;
  slotId?: string;
  date: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  isCustomTime?: boolean;
  notes?: string;
}): Promise<string> {
  const pendingAmount = Math.max(0, data.totalAmount - data.paidAmount);
  const paymentStatus =
    pendingAmount === 0 ? 'paid' : data.paidAmount > 0 ? 'partial' : 'pending';

  let finalSlotId = data.slotId;

  // 1. If existing slotId provided, verify and lock slot
  if (data.slotId) {
    const slotRef = doc(db, 'slots', data.slotId);
    const slotSnap = await getDoc(slotRef);
    if (slotSnap.exists()) {
      const slotData = slotSnap.data() as Slot;
      if (slotData.status === 'booked') {
        throw new Error('This slot is already booked. Please choose another time.');
      }
      if (slotData.status === 'blocked') {
        throw new Error('This slot is currently blocked.');
      }
    }
  } else {
    // Custom Time Booking: Create a corresponding custom Slot doc
    const slotRef = doc(collection(db, 'slots'));
    finalSlotId = slotRef.id;
    const customSlot: Slot = {
      id: slotRef.id,
      turfId: data.turfId,
      turfName: data.turfName,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      price: Number(data.totalAmount),
      status: 'booked',
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    await setDoc(slotRef, customSlot);
  }

  // 2. Create Booking Document
  const bookingRef = doc(collection(db, 'bookings'));
  const newBooking: Booking = {
    id: bookingRef.id,
    customerName: data.customerName.trim(),
    customerPhone: data.customerPhone.trim(),
    turfId: data.turfId,
    turfName: data.turfName,
    slotId: finalSlotId,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    totalAmount: Number(data.totalAmount),
    paidAmount: Number(data.paidAmount),
    pendingAmount,
    paymentMethod: data.paymentMethod,
    paymentStatus,
    bookingStatus: 'confirmed',
    isCustomTime: !!data.isCustomTime || !data.slotId,
    notes: data.notes || '',
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(bookingRef, newBooking);

    // 3. Mark Slot as Booked with bookingId
    if (finalSlotId) {
      const slotRef = doc(db, 'slots', finalSlotId);
      await updateDoc(slotRef, {
        status: 'booked',
        bookingId: bookingRef.id,
      });
    }

    // 4. Record Initial Payment if paidAmount > 0
    if (data.paidAmount > 0) {
      const payRef = doc(collection(db, 'payments'));
      const payment: PaymentRecord = {
        id: payRef.id,
        bookingId: bookingRef.id,
        customerName: data.customerName.trim(),
        customerPhone: data.customerPhone.trim(),
        amount: Number(data.paidAmount),
        paymentMethod: data.paymentMethod,
        notes: `Initial payment for booking ${data.date} (${data.startTime})`,
        recordedAt: new Date().toISOString(),
      };
      await setDoc(payRef, payment);
    }

    // 5. Update or Create Customer Directory Entry
    await syncCustomerOnBooking(
      data.customerName.trim(),
      data.customerPhone.trim(),
      data.totalAmount,
      pendingAmount,
      data.date
    );

    return bookingRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `bookings/${bookingRef.id}`);
  }
}

export async function cancelBooking(bookingId: string, slotId?: string): Promise<void> {
  try {
    const bRef = doc(db, 'bookings', bookingId);
    const bSnap = await getDoc(bRef);
    if (!bSnap.exists()) return;
    const bData = bSnap.data() as Booking;

    await updateDoc(bRef, {
      bookingStatus: 'cancelled',
      updatedAt: new Date().toISOString(),
    });

    // Release slot
    const targetSlotId = slotId || bData.slotId;
    if (targetSlotId) {
      const sRef = doc(db, 'slots', targetSlotId);
      await updateDoc(sRef, {
        status: 'available',
        bookingId: null,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `bookings/${bookingId}`);
  }
}

export async function markBookingCompleted(bookingId: string): Promise<void> {
  try {
    const bRef = doc(db, 'bookings', bookingId);
    await updateDoc(bRef, {
      bookingStatus: 'completed',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `bookings/${bookingId}`);
  }
}

export async function deleteBooking(
  bookingId: string,
  slotId?: string
): Promise<void> {
  try {
    const bRef = doc(db, 'bookings', bookingId);
    const bSnap = await getDoc(bRef);
    const bData = bSnap.exists() ? (bSnap.data() as Booking) : null;

    // Release slot if bound
    const targetSlotId = slotId || bData?.slotId;
    if (targetSlotId) {
      try {
        const sRef = doc(db, 'slots', targetSlotId);
        const sSnap = await getDoc(sRef);
        if (sSnap.exists()) {
          if (bData?.isCustomTime) {
            await deleteDoc(sRef);
          } else {
            await updateDoc(sRef, {
              status: 'available',
              bookingId: null,
            });
          }
        }
      } catch (e) {
        console.warn('Could not release slot on booking delete:', e);
      }
    }

    await deleteDoc(bRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `bookings/${bookingId}`);
  }
}

export async function updateBooking(
  bookingId: string,
  data: Partial<Booking>
): Promise<void> {
  try {
    const bRef = doc(db, 'bookings', bookingId);
    await updateDoc(bRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `bookings/${bookingId}`);
  }
}

// ----------------------------------------------------
// PAYMENTS
// ----------------------------------------------------

export function subscribePayments(callback: (payments: PaymentRecord[]) => void) {
  const colRef = collection(db, 'payments');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: PaymentRecord[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<PaymentRecord, 'id'>) });
      });
      list.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'payments');
    }
  );
}

export async function recordPaymentForBooking(params: {
  bookingId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}): Promise<void> {
  const { bookingId, amount, paymentMethod, notes } = params;
  try {
    const bRef = doc(db, 'bookings', bookingId);
    const bSnap = await getDoc(bRef);
    if (!bSnap.exists()) throw new Error('Booking not found');

    const bData = bSnap.data() as Booking;
    const newPaidAmount = Number(bData.paidAmount) + Number(amount);
    const newPendingAmount = Math.max(0, Number(bData.totalAmount) - newPaidAmount);
    const newPaymentStatus =
      newPendingAmount === 0 ? 'paid' : newPaidAmount > 0 ? 'partial' : 'pending';

    // Update booking
    await updateDoc(bRef, {
      paidAmount: newPaidAmount,
      pendingAmount: newPendingAmount,
      paymentStatus: newPaymentStatus,
      updatedAt: new Date().toISOString(),
    });

    // Create payment record
    const pRef = doc(collection(db, 'payments'));
    const payment: PaymentRecord = {
      id: pRef.id,
      bookingId,
      customerName: bData.customerName,
      customerPhone: bData.customerPhone,
      amount: Number(amount),
      paymentMethod,
      notes: notes || `Payment against pending balance`,
      recordedAt: new Date().toISOString(),
    };
    await setDoc(pRef, payment);

    // Sync Customer pending balance
    await syncCustomerOnPayment(bData.customerPhone, Number(amount));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `payments/for-${bookingId}`);
  }
}

// ----------------------------------------------------
// CUSTOMERS
// ----------------------------------------------------

export function subscribeCustomers(callback: (customers: Customer[]) => void) {
  const colRef = collection(db, 'customers');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Customer[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Customer, 'id'>) });
      });
      list.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'customers');
    }
  );
}

export async function updateCustomer(
  customerId: string,
  data: Partial<Customer>
): Promise<void> {
  try {
    const cRef = doc(db, 'customers', customerId);
    await updateDoc(cRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `customers/${customerId}`);
  }
}

export async function deleteCustomer(customerId: string): Promise<void> {
  try {
    const cRef = doc(db, 'customers', customerId);
    await deleteDoc(cRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `customers/${customerId}`);
  }
}

async function syncCustomerOnBooking(
  name: string,
  phone: string,
  totalAmount: number,
  pendingAmount: number,
  bookingDate: string
) {
  try {
    const safePhoneId = phone.replace(/[^0-9]/g, '') || 'cust_' + Date.now();
    const cRef = doc(db, 'customers', safePhoneId);
    const cSnap = await getDoc(cRef);

    if (cSnap.exists()) {
      const existing = cSnap.data() as Customer;
      await updateDoc(cRef, {
        name: name || existing.name,
        totalBookings: (existing.totalBookings || 0) + 1,
        totalSpent: (existing.totalSpent || 0) + Number(totalAmount),
        pendingAmount: (existing.pendingAmount || 0) + Number(pendingAmount),
        lastBookingDate: bookingDate,
        updatedAt: new Date().toISOString(),
      });
    } else {
      const newCustomer: Customer = {
        id: safePhoneId,
        name,
        phone,
        totalBookings: 1,
        totalSpent: Number(totalAmount),
        pendingAmount: Number(pendingAmount),
        lastBookingDate: bookingDate,
        notes: '',
        createdAt: new Date().toISOString(),
      };
      await setDoc(cRef, newCustomer);
    }
  } catch (error) {
    console.error('Failed to sync customer:', error);
  }
}

async function syncCustomerOnPayment(phone: string, paymentAmount: number) {
  try {
    const safePhoneId = phone.replace(/[^0-9]/g, '');
    if (!safePhoneId) return;
    const cRef = doc(db, 'customers', safePhoneId);
    const cSnap = await getDoc(cRef);
    if (cSnap.exists()) {
      const existing = cSnap.data() as Customer;
      const newPending = Math.max(0, (existing.pendingAmount || 0) - paymentAmount);
      await updateDoc(cRef, {
        pendingAmount: newPending,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Failed to sync customer payment:', error);
  }
}

// ----------------------------------------------------
// SETTINGS
// ----------------------------------------------------

const DEFAULT_SETTINGS: FacilitySettings = {
  facilityName: 'Apex Arena & Sports Turf',
  phone: '+91 98765 43210',
  address: 'Ring Road Arena, Sector 4',
  currencySymbol: '₹',
  openingTime: '06:00',
  closingTime: '23:00',
  slotDurationMinutes: 60,
};

export function subscribeSettings(callback: (settings: FacilitySettings) => void) {
  const docRef = doc(db, 'settings', 'facility_config');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...(snapshot.data() as FacilitySettings) });
      } else {
        callback(DEFAULT_SETTINGS);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/facility_config');
    }
  );
}

export async function recordBookingPayment(
  bookingId: string,
  amount: number,
  paymentMethod: PaymentMethod,
  notes?: string
): Promise<void> {
  return recordPaymentForBooking({
    bookingId,
    amount,
    paymentMethod,
    notes,
  });
}

// Export named aliases for convenience
export const subscribeToTurfs = subscribeTurfs;
export const subscribeToSlots = subscribeSlots;
export const subscribeToBookings = subscribeBookings;
export const subscribeToCustomers = subscribeCustomers;
export const subscribeToPayments = subscribePayments;
export const subscribeToFacilitySettings = subscribeSettings;
export async function updateFacilitySettings(settings: Partial<FacilitySettings>): Promise<void> {
  const docRef = doc(db, 'settings', 'facility_config');
  try {
    await setDoc(docRef, settings, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/facility_config');
  }
}

export const updateSettings = updateFacilitySettings;


// ----------------------------------------------------
// SAMPLE DATA SEEDER FOR QUICK ONBOARDING
// ----------------------------------------------------

export async function seedSampleData(): Promise<void> {
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // 1. Set Settings
  await updateSettings({
    facilityName: 'Apex Sports Arena & Turf',
    phone: '+91 98765 43210',
    address: 'Near Central Stadium, Sports Hub, Mumbai',
    currencySymbol: '₹',
    openingTime: '06:00',
    closingTime: '23:00',
    slotDurationMinutes: 60,
  });

  // 2. Add Turfs
  const t1Id = await addTurf({
    name: 'Football Turf 1 (Main Pitch)',
    sport: 'football',
    pricePerHour: 1000,
    surface: 'FIFA Pro Artificial Grass (50mm)',
    size: '5-a-side / 7-a-side (100x60 ft)',
    description: 'High-grade turf with floodlights and spectator dugout',
    isActive: true,
  });

  const t2Id = await addTurf({
    name: 'Football Turf 2 (Mini Pitch)',
    sport: 'football',
    pricePerHour: 800,
    surface: 'Synthetic Turf 40mm',
    size: '5-a-side (80x50 ft)',
    description: 'Ideal for training and fast 5v5 matches',
    isActive: true,
  });

  const t3Id = await addTurf({
    name: 'Cricket Box Arena',
    sport: 'cricket',
    pricePerHour: 900,
    surface: 'High-density astro turf with net cage',
    size: 'Box Cricket (90x45 ft)',
    description: 'Full net enclosure, bowling machine ready, LED floodlights',
    isActive: true,
  });

  // 3. Generate slots for today & tomorrow
  await generateSlotsForDate({
    date: todayStr,
    turfId: t1Id,
    turfName: 'Football Turf 1 (Main Pitch)',
    openingHour: 6,
    closingHour: 23,
    slotDurationMinutes: 60,
    pricePerHour: 1000,
  });

  await generateSlotsForDate({
    date: todayStr,
    turfId: t2Id,
    turfName: 'Football Turf 2 (Mini Pitch)',
    openingHour: 6,
    closingHour: 23,
    slotDurationMinutes: 60,
    pricePerHour: 800,
  });

  await generateSlotsForDate({
    date: todayStr,
    turfId: t3Id,
    turfName: 'Cricket Box Arena',
    openingHour: 6,
    closingHour: 23,
    slotDurationMinutes: 60,
    pricePerHour: 900,
  });

  // 4. Create sample bookings matching the prompt example
  // "6:00 PM – 7:00 PM Rahul ₹800 PAID"
  // "8:00 PM – 9:00 PM Ahmed ₹800 ₹300 Pending"
  await createBooking({
    customerName: 'Rahul Sharma',
    customerPhone: '+91 98201 12345',
    turfId: t2Id,
    turfName: 'Football Turf 2 (Mini Pitch)',
    date: todayStr,
    startTime: '6:00 PM',
    endTime: '7:00 PM',
    totalAmount: 800,
    paidAmount: 800,
    paymentMethod: 'UPI',
    notes: 'Weekly Friday football group',
  });

  await createBooking({
    customerName: 'Ahmed Khan',
    customerPhone: '+91 98199 87654',
    turfId: t2Id,
    turfName: 'Football Turf 2 (Mini Pitch)',
    date: todayStr,
    startTime: '8:00 PM',
    endTime: '9:00 PM',
    totalAmount: 800,
    paidAmount: 500,
    paymentMethod: 'Cash',
    notes: 'Advance given, remaining ₹300 on arrival',
  });

  await createBooking({
    customerName: 'Vikram Mehta',
    customerPhone: '+91 99300 45678',
    turfId: t1Id,
    turfName: 'Football Turf 1 (Main Pitch)',
    date: todayStr,
    startTime: '7:00 PM',
    endTime: '8:00 PM',
    totalAmount: 1000,
    paidAmount: 1000,
    paymentMethod: 'UPI',
    notes: 'Corporate match',
  });

  await createBooking({
    customerName: 'Sanjay Patel',
    customerPhone: '+91 97654 32109',
    turfId: t3Id,
    turfName: 'Cricket Box Arena',
    date: todayStr,
    startTime: '9:00 PM',
    endTime: '10:00 PM',
    totalAmount: 900,
    paidAmount: 900,
    paymentMethod: 'Card',
    notes: 'Box cricket tournament round 1',
  });
}
