export type SportType = 'football' | 'cricket' | 'badminton' | 'pickleball' | 'tennis' | 'multisport';

export type SlotStatus = 'available' | 'booked' | 'blocked';

export type PaymentStatus = 'paid' | 'partial' | 'pending';

export type BookingStatus = 'confirmed' | 'completed' | 'cancelled';

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Other';

export interface Turf {
  id: string;
  name: string;
  sport: SportType;
  pricePerHour: number;
  surface?: string;
  size?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Slot {
  id: string;
  turfId: string;
  turfName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "06:00 PM" or "18:00"
  endTime: string; // e.g. "07:00 PM" or "19:00"
  price: number;
  status: SlotStatus;
  blockReason?: string;
  bookingId?: string;
  isCustom?: boolean;
  createdAt?: string;
}

export interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  turfId: string;
  turfName: string;
  slotId?: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  isCustomTime?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  totalBookings: number;
  totalSpent: number;
  pendingAmount: number;
  lastBookingDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentRecord {
  id: string;
  bookingId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  recordedAt: string;
}

export interface FacilitySettings {
  id?: string;
  facilityName: string;
  phone?: string;
  address?: string;
  currencySymbol?: string;
  openingHour?: number;
  closingHour?: number;
  openingTime?: string;
  closingTime?: string;
  slotDurationMinutes?: number;
  passcode?: string;
}

export type ActiveTab = 'dashboard' | 'bookings' | 'slots' | 'turfs' | 'customers' | 'payments' | 'settings';
