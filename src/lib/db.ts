import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  getDoc,
  writeBatch,
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
// LOCAL REACTIVE STORAGE & FAST PERSISTENCE CACHE
// ----------------------------------------------------

const STORAGE_KEYS = {
  TURFS: 'turf_app_turfs_v1',
  SLOTS: 'turf_app_slots_v1',
  BOOKINGS: 'turf_app_bookings_v1',
  CUSTOMERS: 'turf_app_customers_v1',
  PAYMENTS: 'turf_app_payments_v1',
  SETTINGS: 'turf_app_settings_v1',
};

function loadLocal<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
}

function saveLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('Local storage write warning:', err);
  }
}

// In-memory cache loaded synchronously
let localTurfs: Turf[] = loadLocal<Turf[]>(STORAGE_KEYS.TURFS, []);
let localSlots: Slot[] = loadLocal<Slot[]>(STORAGE_KEYS.SLOTS, []);
let localBookings: Booking[] = loadLocal<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
let localCustomers: Customer[] = loadLocal<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
let localPayments: PaymentRecord[] = loadLocal<PaymentRecord[]>(STORAGE_KEYS.PAYMENTS, []);
let localSettings: FacilitySettings = loadLocal<FacilitySettings>(STORAGE_KEYS.SETTINGS, {
  facilityName: '',
  ownerName: '',
  phone: '',
  address: '',
  currencySymbol: '₹',
  openingTime: '06:00',
  closingTime: '23:00',
  slotDurationMinutes: 60,
});

// Event target for immediate local broadcasts
const emitter = new EventTarget();

function emitChange(entity: string) {
  emitter.dispatchEvent(new Event(`change:${entity}`));
}

// Non-blocking fire-and-forget sync helper with timeout
function safeCloudSync(action: () => Promise<any>): void {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Cloud sync timeout')), 2500)
  );
  Promise.race([action(), timeoutPromise]).catch((err) => {
    // Cloud sync failure or offline status is non-blocking
    console.warn('Background Firestore sync notice:', err?.message || err);
  });
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

// ----------------------------------------------------
// TURFS
// ----------------------------------------------------

export function subscribeTurfs(callback: (turfs: Turf[]) => void): () => void {
  // 1. Immediately invoke with local cache
  callback([...localTurfs]);

  // 2. Listen to local changes
  const localHandler = () => callback([...localTurfs]);
  emitter.addEventListener('change:turfs', localHandler);

  // 3. Listen to Firestore when available
  let unsubFirestore = () => {};
  try {
    const colRef = collection(db, 'turfs');
    unsubFirestore = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Turf[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Turf, 'id'>) });
          });
          localTurfs = list;
          saveLocal(STORAGE_KEYS.TURFS, localTurfs);
          callback([...localTurfs]);
        }
      },
      (err) => {
        console.warn('Firestore turf subscription offline:', err.message);
      }
    );
  } catch {
    // Firestore offline fallback
  }

  return () => {
    emitter.removeEventListener('change:turfs', localHandler);
    unsubFirestore();
  };
}

export async function addTurf(data: Omit<Turf, 'id' | 'createdAt'>): Promise<string> {
  const newId = generateId('turf');
  const newTurf: Turf = {
    id: newId,
    ...data,
    createdAt: new Date().toISOString(),
  };

  // Instant local commit
  localTurfs = [newTurf, ...localTurfs.filter((t) => t.id !== newId)];
  saveLocal(STORAGE_KEYS.TURFS, localTurfs);
  emitChange('turfs');

  // Background Cloud Sync
  safeCloudSync(async () => {
    const docRef = doc(db, 'turfs', newId);
    await setDoc(docRef, newTurf);
  });

  return newId;
}

export async function updateTurf(id: string, data: Partial<Turf>): Promise<void> {
  localTurfs = localTurfs.map((t) => (t.id === id ? { ...t, ...data } : t));
  saveLocal(STORAGE_KEYS.TURFS, localTurfs);
  emitChange('turfs');

  safeCloudSync(async () => {
    const docRef = doc(db, 'turfs', id);
    await updateDoc(docRef, data);
  });
}

export async function deleteTurf(id: string): Promise<void> {
  localTurfs = localTurfs.filter((t) => t.id !== id);
  saveLocal(STORAGE_KEYS.TURFS, localTurfs);
  emitChange('turfs');

  safeCloudSync(async () => {
    const docRef = doc(db, 'turfs', id);
    await deleteDoc(docRef);
  });
}

// ----------------------------------------------------
// SLOTS
// ----------------------------------------------------

export function subscribeSlots(callback: (slots: Slot[]) => void): () => void {
  callback([...localSlots]);

  const localHandler = () => callback([...localSlots]);
  emitter.addEventListener('change:slots', localHandler);

  let unsubFirestore = () => {};
  try {
    const colRef = collection(db, 'slots');
    unsubFirestore = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Slot[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Slot, 'id'>) });
          });
          localSlots = list;
          saveLocal(STORAGE_KEYS.SLOTS, localSlots);
          callback([...localSlots]);
        }
      },
      (err) => {
        console.warn('Firestore slots subscription offline:', err.message);
      }
    );
  } catch {
    // Firestore offline fallback
  }

  return () => {
    emitter.removeEventListener('change:slots', localHandler);
    unsubFirestore();
  };
}

export function subscribeSlotsForDate(date: string, callback: (slots: Slot[]) => void): () => void {
  const filterForDate = () => callback(localSlots.filter((s) => s.date === date));
  filterForDate();

  const localHandler = () => filterForDate();
  emitter.addEventListener('change:slots', localHandler);

  let unsubFirestore = () => {};
  try {
    const q = query(collection(db, 'slots'), where('date', '==', date));
    unsubFirestore = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteList: Slot[] = [];
          snapshot.forEach((docSnap) => {
            remoteList.push({ id: docSnap.id, ...(docSnap.data() as Omit<Slot, 'id'>) });
          });
          // Merge remote with local
          const otherSlots = localSlots.filter((s) => s.date !== date);
          localSlots = [...otherSlots, ...remoteList];
          saveLocal(STORAGE_KEYS.SLOTS, localSlots);
          filterForDate();
        }
      },
      (err) => {
        console.warn('Firestore slot date subscription offline:', err.message);
      }
    );
  } catch {
    // Offline fallback
  }

  return () => {
    emitter.removeEventListener('change:slots', localHandler);
    unsubFirestore();
  };
}

export async function generateSlotsForDate(params: {
  date: string;
  turfId: string;
  turfName: string;
  openingHour?: number;
  closingHour?: number;
  slotDurationMinutes?: number;
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

  const formatTimeStr = (hour: number, minute: number): string => {
    const h = hour % 24;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const minStr = minute < 10 ? `0${minute}` : `${minute}`;
    return `${displayH}:${minStr} ${period}`;
  };

  const totalMinutesStart = openingHour * 60;
  const totalMinutesEnd = closingHour * 60;

  const existingMap = new Map<string, Slot>();
  localSlots
    .filter((s) => s.date === date && s.turfId === turfId)
    .forEach((s) => existingMap.set(s.startTime, s));

  const newSlotsToCreate: Slot[] = [];

  for (let current = totalMinutesStart; current < totalMinutesEnd; current += slotDurationMinutes) {
    const startH = Math.floor(current / 60);
    const startM = current % 60;
    const endTotal = current + slotDurationMinutes;
    const endH = Math.floor(endTotal / 60);
    const endM = endTotal % 60;

    const startTimeStr = formatTimeStr(startH, startM);
    const endTimeStr = formatTimeStr(endH, endM);

    if (!existingMap.has(startTimeStr)) {
      const slotId = generateId(`slot_${turfId.slice(-4)}`);
      const newSlot: Slot = {
        id: slotId,
        turfId,
        turfName,
        date,
        startTime: startTimeStr,
        endTime: endTimeStr,
        price: pricePerHour,
        status: 'available',
        createdAt: new Date().toISOString(),
      };
      newSlotsToCreate.push(newSlot);
    }
  }

  if (newSlotsToCreate.length > 0) {
    localSlots = [...localSlots, ...newSlotsToCreate];
    saveLocal(STORAGE_KEYS.SLOTS, localSlots);
    emitChange('slots');

    // Background Firestore writeBatch
    safeCloudSync(async () => {
      const batch = writeBatch(db);
      newSlotsToCreate.forEach((slot) => {
        const ref = doc(db, 'slots', slot.id);
        batch.set(ref, slot);
      });
      await batch.commit();
    });
  }

  return newSlotsToCreate.length;
}

export async function blockSlot(slotId: string, reason: string): Promise<void> {
  localSlots = localSlots.map((s) =>
    s.id === slotId ? { ...s, status: 'blocked', blockReason: reason || 'Facility Maintenance' } : s
  );
  saveLocal(STORAGE_KEYS.SLOTS, localSlots);
  emitChange('slots');

  safeCloudSync(async () => {
    const docRef = doc(db, 'slots', slotId);
    await updateDoc(docRef, {
      status: 'blocked',
      blockReason: reason || 'Facility Maintenance',
    });
  });
}

export async function unblockSlot(slotId: string): Promise<void> {
  localSlots = localSlots.map((s) =>
    s.id === slotId ? { ...s, status: 'available', blockReason: undefined } : s
  );
  saveLocal(STORAGE_KEYS.SLOTS, localSlots);
  emitChange('slots');

  safeCloudSync(async () => {
    const docRef = doc(db, 'slots', slotId);
    await updateDoc(docRef, {
      status: 'available',
      blockReason: null,
    });
  });
}

export async function updateSlotPrice(slotId: string, newPrice: number): Promise<void> {
  localSlots = localSlots.map((s) => (s.id === slotId ? { ...s, price: newPrice } : s));
  saveLocal(STORAGE_KEYS.SLOTS, localSlots);
  emitChange('slots');

  safeCloudSync(async () => {
    const docRef = doc(db, 'slots', slotId);
    await updateDoc(docRef, { price: newPrice });
  });
}

export async function addCustomSlot(data: {
  turfId: string;
  turfName: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
}): Promise<string> {
  const slotId = generateId('slot_custom');
  const newSlot: Slot = {
    id: slotId,
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

  localSlots = [...localSlots, newSlot];
  saveLocal(STORAGE_KEYS.SLOTS, localSlots);
  emitChange('slots');

  safeCloudSync(async () => {
    const slotRef = doc(db, 'slots', slotId);
    await setDoc(slotRef, newSlot);
  });

  return slotId;
}

// ----------------------------------------------------
// BOOKINGS & REVENUE
// ----------------------------------------------------

export function subscribeBookings(callback: (bookings: Booking[]) => void): () => void {
  const sorted = [...localBookings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  callback(sorted);

  const localHandler = () => {
    const fresh = [...localBookings].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    callback(fresh);
  };
  emitter.addEventListener('change:bookings', localHandler);

  let unsubFirestore = () => {};
  try {
    const colRef = collection(db, 'bookings');
    unsubFirestore = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Booking[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Booking, 'id'>) });
          });
          localBookings = list;
          saveLocal(STORAGE_KEYS.BOOKINGS, localBookings);
          localHandler();
        }
      },
      (err) => {
        console.warn('Firestore bookings subscription offline:', err.message);
      }
    );
  } catch {
    // Offline fallback
  }

  return () => {
    emitter.removeEventListener('change:bookings', localHandler);
    unsubFirestore();
  };
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

  // If custom time, create custom slot
  if (!finalSlotId) {
    finalSlotId = generateId('slot_custom');
    const customSlot: Slot = {
      id: finalSlotId,
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
    localSlots = [...localSlots, customSlot];
    saveLocal(STORAGE_KEYS.SLOTS, localSlots);
    emitChange('slots');
  } else {
    // Mark existing slot booked
    localSlots = localSlots.map((s) =>
      s.id === finalSlotId ? { ...s, status: 'booked', bookingId: finalSlotId } : s
    );
    saveLocal(STORAGE_KEYS.SLOTS, localSlots);
    emitChange('slots');
  }

  const bookingId = generateId('book');
  const newBooking: Booking = {
    id: bookingId,
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

  localBookings = [newBooking, ...localBookings];
  saveLocal(STORAGE_KEYS.BOOKINGS, localBookings);
  emitChange('bookings');

  // Record payment if paidAmount > 0
  if (data.paidAmount > 0) {
    const payId = generateId('pay');
    const payment: PaymentRecord = {
      id: payId,
      bookingId,
      customerName: data.customerName.trim(),
      customerPhone: data.customerPhone.trim(),
      amount: Number(data.paidAmount),
      paymentMethod: data.paymentMethod,
      notes: `Initial payment for booking ${data.date} (${data.startTime})`,
      recordedAt: new Date().toISOString(),
    };
    localPayments = [payment, ...localPayments];
    saveLocal(STORAGE_KEYS.PAYMENTS, localPayments);
    emitChange('payments');
  }

  // Update Customer Directory
  syncCustomerLocally(
    data.customerName.trim(),
    data.customerPhone.trim(),
    data.totalAmount,
    pendingAmount,
    data.date
  );

  // Background Cloud Sync
  safeCloudSync(async () => {
    const bRef = doc(db, 'bookings', bookingId);
    await setDoc(bRef, newBooking);
    if (finalSlotId) {
      const sRef = doc(db, 'slots', finalSlotId);
      await updateDoc(sRef, { status: 'booked', bookingId });
    }
  });

  return bookingId;
}

export async function cancelBooking(bookingId: string, slotId?: string): Promise<void> {
  const target = localBookings.find((b) => b.id === bookingId);
  const targetSlotId = slotId || target?.slotId;

  localBookings = localBookings.map((b) =>
    b.id === bookingId
      ? { ...b, bookingStatus: 'cancelled', updatedAt: new Date().toISOString() }
      : b
  );
  saveLocal(STORAGE_KEYS.BOOKINGS, localBookings);
  emitChange('bookings');

  if (targetSlotId) {
    localSlots = localSlots.map((s) =>
      s.id === targetSlotId ? { ...s, status: 'available', bookingId: undefined } : s
    );
    saveLocal(STORAGE_KEYS.SLOTS, localSlots);
    emitChange('slots');
  }

  safeCloudSync(async () => {
    const bRef = doc(db, 'bookings', bookingId);
    await updateDoc(bRef, { bookingStatus: 'cancelled', updatedAt: new Date().toISOString() });
    if (targetSlotId) {
      const sRef = doc(db, 'slots', targetSlotId);
      await updateDoc(sRef, { status: 'available', bookingId: null });
    }
  });
}

export async function markBookingCompleted(bookingId: string): Promise<void> {
  localBookings = localBookings.map((b) =>
    b.id === bookingId
      ? { ...b, bookingStatus: 'completed', updatedAt: new Date().toISOString() }
      : b
  );
  saveLocal(STORAGE_KEYS.BOOKINGS, localBookings);
  emitChange('bookings');

  safeCloudSync(async () => {
    const bRef = doc(db, 'bookings', bookingId);
    await updateDoc(bRef, { bookingStatus: 'completed', updatedAt: new Date().toISOString() });
  });
}

export async function deleteBooking(bookingId: string, slotId?: string): Promise<void> {
  const target = localBookings.find((b) => b.id === bookingId);
  const targetSlotId = slotId || target?.slotId;

  localBookings = localBookings.filter((b) => b.id !== bookingId);
  saveLocal(STORAGE_KEYS.BOOKINGS, localBookings);
  emitChange('bookings');

  if (targetSlotId) {
    localSlots = localSlots.map((s) =>
      s.id === targetSlotId ? { ...s, status: 'available', bookingId: undefined } : s
    );
    saveLocal(STORAGE_KEYS.SLOTS, localSlots);
    emitChange('slots');
  }

  safeCloudSync(async () => {
    const bRef = doc(db, 'bookings', bookingId);
    await deleteDoc(bRef);
    if (targetSlotId) {
      const sRef = doc(db, 'slots', targetSlotId);
      await updateDoc(sRef, { status: 'available', bookingId: null });
    }
  });
}

export async function updateBookingStatus(
  bookingId: string,
  newStatus: 'confirmed' | 'completed' | 'cancelled'
): Promise<void> {
  if (newStatus === 'cancelled') {
    return cancelBooking(bookingId);
  } else if (newStatus === 'completed') {
    return markBookingCompleted(bookingId);
  }

  localBookings = localBookings.map((b) =>
    b.id === bookingId ? { ...b, bookingStatus: newStatus, updatedAt: new Date().toISOString() } : b
  );
  saveLocal(STORAGE_KEYS.BOOKINGS, localBookings);
  emitChange('bookings');
}

// ----------------------------------------------------
// PAYMENTS
// ----------------------------------------------------

export function subscribePayments(callback: (payments: PaymentRecord[]) => void): () => void {
  const sorted = [...localPayments].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  );
  callback(sorted);

  const localHandler = () => {
    const fresh = [...localPayments].sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );
    callback(fresh);
  };
  emitter.addEventListener('change:payments', localHandler);

  let unsubFirestore = () => {};
  try {
    const colRef = collection(db, 'payments');
    unsubFirestore = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: PaymentRecord[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...(docSnap.data() as Omit<PaymentRecord, 'id'>) });
          });
          localPayments = list;
          saveLocal(STORAGE_KEYS.PAYMENTS, localPayments);
          localHandler();
        }
      },
      (err) => {
        console.warn('Firestore payments subscription offline:', err.message);
      }
    );
  } catch {
    // Offline fallback
  }

  return () => {
    emitter.removeEventListener('change:payments', localHandler);
    unsubFirestore();
  };
}

export async function recordPaymentForBooking(
  paramsOrBookingId:
    | {
        bookingId: string;
        amount: number;
        paymentMethod: PaymentMethod;
        notes?: string;
      }
    | string,
  amountArg?: number,
  paymentMethodArg?: PaymentMethod,
  notesArg?: string
): Promise<void> {
  let bookingId: string;
  let amount: number;
  let paymentMethod: PaymentMethod;
  let notes: string | undefined;

  if (typeof paramsOrBookingId === 'object') {
    bookingId = paramsOrBookingId.bookingId;
    amount = paramsOrBookingId.amount;
    paymentMethod = paramsOrBookingId.paymentMethod;
    notes = paramsOrBookingId.notes;
  } else {
    bookingId = paramsOrBookingId;
    amount = amountArg || 0;
    paymentMethod = paymentMethodArg || 'UPI';
    notes = notesArg;
  }

  let targetCustomerPhone = '';
  let targetCustomerName = '';

  localBookings = localBookings.map((b) => {
    if (b.id === bookingId) {
      targetCustomerPhone = b.customerPhone;
      targetCustomerName = b.customerName;
      const newPaid = Number(b.paidAmount) + Number(amount);
      const newPending = Math.max(0, Number(b.totalAmount) - newPaid);
      const newStatus = newPending === 0 ? 'paid' : newPaid > 0 ? 'partial' : 'pending';
      return {
        ...b,
        paidAmount: newPaid,
        pendingAmount: newPending,
        paymentStatus: newStatus,
        updatedAt: new Date().toISOString(),
      };
    }
    return b;
  });
  saveLocal(STORAGE_KEYS.BOOKINGS, localBookings);
  emitChange('bookings');

  // Create payment entry
  const payId = generateId('pay');
  const payment: PaymentRecord = {
    id: payId,
    bookingId,
    customerName: targetCustomerName || 'Customer',
    customerPhone: targetCustomerPhone || '',
    amount: Number(amount),
    paymentMethod,
    notes: notes || 'Payment against pending balance',
    recordedAt: new Date().toISOString(),
  };
  localPayments = [payment, ...localPayments];
  saveLocal(STORAGE_KEYS.PAYMENTS, localPayments);
  emitChange('payments');

  // Sync customer pending amount
  if (targetCustomerPhone) {
    const safePhone = targetCustomerPhone.replace(/[^0-9]/g, '');
    localCustomers = localCustomers.map((c) =>
      c.id === safePhone
        ? {
            ...c,
            pendingAmount: Math.max(0, (c.pendingAmount || 0) - Number(amount)),
            updatedAt: new Date().toISOString(),
          }
        : c
    );
    saveLocal(STORAGE_KEYS.CUSTOMERS, localCustomers);
    emitChange('customers');
  }

  // Cloud Sync
  safeCloudSync(async () => {
    const pRef = doc(db, 'payments', payId);
    await setDoc(pRef, payment);
    const bRef = doc(db, 'bookings', bookingId);
    const b = localBookings.find((item) => item.id === bookingId);
    if (b) {
      await updateDoc(bRef, {
        paidAmount: b.paidAmount,
        pendingAmount: b.pendingAmount,
        paymentStatus: b.paymentStatus,
        updatedAt: b.updatedAt,
      });
    }
  });
}

export const recordBookingPayment = recordPaymentForBooking;

// ----------------------------------------------------
// CUSTOMERS
// ----------------------------------------------------

export function subscribeCustomers(callback: (customers: Customer[]) => void): () => void {
  const sorted = [...localCustomers].sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
  callback(sorted);

  const localHandler = () => {
    const fresh = [...localCustomers].sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
    callback(fresh);
  };
  emitter.addEventListener('change:customers', localHandler);

  let unsubFirestore = () => {};
  try {
    const colRef = collection(db, 'customers');
    unsubFirestore = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Customer[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Customer, 'id'>) });
          });
          localCustomers = list;
          saveLocal(STORAGE_KEYS.CUSTOMERS, localCustomers);
          localHandler();
        }
      },
      (err) => {
        console.warn('Firestore customers subscription offline:', err.message);
      }
    );
  } catch {
    // Offline fallback
  }

  return () => {
    emitter.removeEventListener('change:customers', localHandler);
    unsubFirestore();
  };
}

function syncCustomerLocally(
  name: string,
  phone: string,
  totalAmount: number,
  pendingAmount: number,
  bookingDate: string
) {
  const safePhoneId = phone.replace(/[^0-9]/g, '') || 'cust_' + Date.now();
  const existingIndex = localCustomers.findIndex((c) => c.id === safePhoneId);

  if (existingIndex >= 0) {
    const existing = localCustomers[existingIndex];
    localCustomers[existingIndex] = {
      ...existing,
      name: name || existing.name,
      totalBookings: (existing.totalBookings || 0) + 1,
      totalSpent: (existing.totalSpent || 0) + Number(totalAmount),
      pendingAmount: (existing.pendingAmount || 0) + Number(pendingAmount),
      lastBookingDate: bookingDate,
      updatedAt: new Date().toISOString(),
    };
  } else {
    const newCust: Customer = {
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
    localCustomers.push(newCust);
  }

  saveLocal(STORAGE_KEYS.CUSTOMERS, localCustomers);
  emitChange('customers');
}

export async function deleteCustomer(customerId: string): Promise<void> {
  localCustomers = localCustomers.filter((c) => c.id !== customerId);
  saveLocal(STORAGE_KEYS.CUSTOMERS, localCustomers);
  emitChange('customers');

  safeCloudSync(async () => {
    const docRef = doc(db, 'customers', customerId);
    await deleteDoc(docRef);
  });
}

export async function updateCustomer(customerId: string, data: Partial<Customer>): Promise<void> {
  localCustomers = localCustomers.map((c) =>
    c.id === customerId ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
  );
  saveLocal(STORAGE_KEYS.CUSTOMERS, localCustomers);
  emitChange('customers');

  safeCloudSync(async () => {
    const docRef = doc(db, 'customers', customerId);
    await updateDoc(docRef, data);
  });
}

// ----------------------------------------------------
// FACILITY SETTINGS
// ----------------------------------------------------

export function subscribeSettings(callback: (settings: FacilitySettings) => void): () => void {
  callback({ ...localSettings });

  const localHandler = () => callback({ ...localSettings });
  emitter.addEventListener('change:settings', localHandler);

  let unsubFirestore = () => {};
  try {
    const docRef = doc(db, 'settings', 'facility_config');
    unsubFirestore = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          localSettings = { id: snapshot.id, ...(snapshot.data() as FacilitySettings) };
          saveLocal(STORAGE_KEYS.SETTINGS, localSettings);
          callback({ ...localSettings });
        }
      },
      (err) => {
        console.warn('Firestore settings subscription offline:', err.message);
      }
    );
  } catch {
    // Offline fallback
  }

  return () => {
    emitter.removeEventListener('change:settings', localHandler);
    unsubFirestore();
  };
}

export async function updateFacilitySettings(settings: Partial<FacilitySettings>): Promise<void> {
  localSettings = { ...localSettings, ...settings };
  saveLocal(STORAGE_KEYS.SETTINGS, localSettings);
  emitChange('settings');

  safeCloudSync(async () => {
    const docRef = doc(db, 'settings', 'facility_config');
    await setDoc(docRef, settings, { merge: true });
  });
}

export const updateSettings = updateFacilitySettings;

// ----------------------------------------------------
// ALIASES
// ----------------------------------------------------

export const subscribeToTurfs = subscribeTurfs;
export const subscribeToSlots = subscribeSlots;
export const subscribeToBookings = subscribeBookings;
export const subscribeToCustomers = subscribeCustomers;
export const subscribeToPayments = subscribePayments;
export const subscribeToFacilitySettings = subscribeSettings;

// ----------------------------------------------------
// SAMPLE DATA SEEDER
// ----------------------------------------------------

export async function seedSampleData(): Promise<void> {
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Set Settings
  await updateSettings({
    facilityName: 'Apex Sports Arena & Turf',
    ownerName: 'Aarez Ali',
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

  // 3. Generate slots for today
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

  // 4. Create sample bookings
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
