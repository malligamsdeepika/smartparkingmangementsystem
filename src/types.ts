export type VehicleType = 'car' | 'bike' | 'ev';
export type SlotStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';
export type BookingStatus = 'confirmed' | 'active' | 'completed' | 'cancelled';
export type PaymentStatus = 'paid' | 'pending' | 'refunded' | 'completed';
export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  password?: string;
  createdAt: string;
}

export interface ParkingLocation {
  id: string;
  name: string;
  city: string;
  area: string;
  address: string;
  totalSlots: number;
  availableSlots?: number;
  parkingType?: string;
  openingTime?: string;
  closingTime?: string;
  contactPhone?: string;
  rates: {
    firstHour: number;
    additionalHour: number;
  };
  image: string;
  landmark: string;
  rating: number;
  latitude?: number;
  longitude?: number;
  operatingHours?: string;
  distanceFromCampusKm?: number;
}

export interface ParkingSlot {
  id: string;
  locationId: string;
  slotNumber: string;
  floor: string;
  vehicleType: VehicleType;
  status: SlotStatus;
  currentBookingId?: string;
  hourlyRateFirstHour: number;
  hourlyRateAdditional: number;
  hasCharging?: boolean;
  distanceToEntranceMeters?: number;
  isShaded?: boolean;
  
  // Real-Time Slot Availability & Expected Leaving Time Fields
  currentVehicleNumber?: string;
  entryTime?: string;              // formatted e.g. "4:30 PM"
  actualEntryTime?: string;        // ISO string or formatted timestamp
  expectedLeavingTime?: string;    // formatted e.g. "6:30 PM"
  expectedExitTime?: string;       // ISO or formatted timestamp
  actualExitTime?: string;         // formatted e.g. "6:42 PM"
  bookedDurationHours?: number;    // e.g. 2
  availableFrom?: string;          // "Available now" or "6:30 PM"
  isOvertime?: boolean;
  overtimeMinutes?: number;
  overtimeFee?: number;
  bookingStatus?: BookingStatus;
  driverName?: string;
}

export interface SlotAvailabilityInfo {
  slotId: string;
  slotNumber: string;
  status: SlotStatus;
  currentVehicleNumber?: string;
  entryTime?: string;
  actualEntryTime?: string;
  expectedLeavingTime?: string;
  expectedExitTime?: string;
  actualExitTime?: string;
  bookedDurationHours?: number;
  availableFrom: string;
  isOvertime: boolean;
  overtimeMinutes: number;
  overtimeFee: number;
  bookingId?: string;
  driverName?: string;
}

export interface Booking {
  id: string;
  bookingCode?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  locationId: string;
  locationName: string;
  slotId: string;
  slotNumber: string;
  floor: string;
  vehicleType: VehicleType;
  vehicleNumber: string;
  bookingDate: string;
  entryTime: string;
  exitTime: string;
  durationHours: number;
  amount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  transactionId: string;
  createdAt: string;
  qrCodeData?: string;
  // Gate entry/exit session tracking
  actualEntryTime?: string;
  actualExitTime?: string;
  overtimeMinutes?: number;
  overtimeFee?: number;
  refundStatus?: 'none' | 'pending' | 'processed' | 'refunded' | 'not_applicable';
  refundAmount?: number;
}

export interface ParkingSession {
  id: string;
  bookingId: string;
  slotId: string;
  slotNumber: string;
  locationId: string;
  locationName?: string;
  vehicleNumber: string;
  entryTime: string;
  exitTime?: string;
  plannedDurationHours: number;
  durationHours?: number;
  entryTimestamp?: string;
  actualDurationMinutes?: number;
  overtimeMinutes?: number;
  baseAmount: number;
  overtimeAmount?: number;
  totalAmountPaid: number;
  status: 'ACTIVE' | 'COMPLETED' | 'OVERDUE';
  verifiedBy?: string;
}

export interface PaymentRecord {
  id: string;
  bookingId: string;
  userId?: string;
  userName?: string;
  amount: number;
  paymentMethod: string;
  status: PaymentStatus;
  timestamp: string;
  transactionRef?: string;
  transactionId?: string;
}

export type AdminNotificationType =
  | 'new_booking'
  | 'booking_cancellation'
  | 'payment_update'
  | 'payment_success'
  | 'payment_failed'
  | 'slot_update'
  | 'user_registration'
  | 'capacity_alert'
  | 'system_alert'
  | 'info';

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: AdminNotificationType | string;
  createdAt: string;
  isRead: boolean;
  read?: boolean; // Backwards compatibility with boolean toggles
  adminId?: string;
  userId?: string;
  relatedEntityId?: string;
  bookingId?: string;
  metadata?: {
    bookingId?: string;
    userId?: string;
    userName?: string;
    userEmail?: string;
    slotId?: string;
    slotNumber?: string;
    locationId?: string;
    locationName?: string;
    paymentId?: string;
    amount?: number;
    paymentStatus?: string;
    slotStatus?: string;
    capacityPercentage?: number;
    severity?: 'info' | 'warning' | 'error' | 'success';
    [key: string]: any;
  };
}

export interface SmartNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type:
    | 'registration'
    | 'booking_success'
    | 'booking_confirm'
    | 'time_reminder'
    | 'upcoming_reminder'
    | 'expiry'
    | 'payment'
    | 'session_completed'
    | 'new_booking'
    | 'booking_cancellation'
    | 'slot_update'
    | 'user_registration'
    | 'capacity_alert'
    | 'system_alert'
    | 'info';
  read: boolean;
  isRead?: boolean;
  createdAt: string;
  bookingId?: string;
  adminId?: string;
  relatedEntityId?: string;
  metadata?: Record<string, any>;
}

export interface PlateRecognitionResult {
  id?: string;
  plateNumber: string;
  confidence: number;
  vehicleTypeGuess: VehicleType;
  state: string;
  plateRegionImage?: string;
  timestamp: string;
  scannedAt?: string;
}

export interface SlotRecommendation {
  slot: ParkingSlot;
  score: number;
  reasons: string[];
  distanceToEntrance: number;
  isBestValue: boolean;
  tag: string;
}

export interface DashboardStats {
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  reservedSlots: number;
  maintenanceSlots: number;
  totalBookings: number;
  todayBookings: number;
  totalRevenue: number;
  todayRevenue: number;
  totalLocations?: number;
  activeSessions?: number;
  completedSessions?: number;
}
