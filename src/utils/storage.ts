import {
  Booking,
  DashboardStats,
  ParkingLocation,
  ParkingSlot,
  ParkingSession,
  PaymentRecord,
  PlateRecognitionResult,
  SlotRecommendation,
  SlotStatus,
  SmartNotification,
  AdminNotification,
  User,
  VehicleType,
} from '../types';
import {
  INITIAL_BOOKINGS,
  INITIAL_LOCATIONS,
  INITIAL_PAYMENTS,
  INITIAL_USERS,
  generateInitialSlots,
  generateSlotsForLocation,
} from '../data/mockData';
import { ApiService } from '../services/api';
import { RealtimeSync, RealtimeEventPayload } from '../services/realtimeSync';

let realtimeInitialized = false;

const STORAGE_KEYS = {
  LOCATIONS: 'spms_locations_v1',
  SLOTS: 'spms_slots_v1',
  BOOKINGS: 'spms_bookings_v1',
  PAYMENTS: 'spms_payments_v1',
  USERS: 'spms_users_v1',
  CURRENT_USER: 'spms_current_user_v1',
  NOTIFICATIONS: 'spms_notifications_v1',
  ADMIN_NOTIFICATIONS: 'spms_admin_notifications_v1',
  SESSIONS: 'spms_sessions_v1',
  OCR_LOGS: 'spms_ocr_logs_v1',
};

export const INITIAL_ADMIN_NOTIFICATIONS: AdminNotification[] = [
  {
    id: 'adm-notif-1',
    adminId: 'usr-admin',
    title: 'New Booking: Bay G-03 Confirmed',
    message: 'Reservation PK-94281 placed by Rahul Sharma (KA 03 MX 4421) at Metro City Center Plaza. Amount: ₹40.00.',
    type: 'new_booking',
    createdAt: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    isRead: false,
    read: false,
    relatedEntityId: 'PK-94281',
    bookingId: 'PK-94281',
    metadata: {
      bookingId: 'PK-94281',
      slotNumber: 'G-03',
      locationName: 'Metro City Center Plaza',
      userName: 'Rahul Sharma',
      amount: 40,
    },
  },
  {
    id: 'adm-notif-2',
    adminId: 'usr-admin',
    title: 'Payment Received: ₹40.00',
    message: 'Online parking payment verified for Booking PK-94281 via UPI (TXN-9841284712).',
    type: 'payment_update',
    createdAt: new Date(Date.now() - 3600000 * 2.4).toISOString(),
    isRead: false,
    read: false,
    relatedEntityId: 'pay-1',
    bookingId: 'PK-94281',
    metadata: {
      paymentId: 'pay-1',
      amount: 40,
      transactionId: 'TXN-9841284712',
    },
  },
  {
    id: 'adm-notif-3',
    adminId: 'usr-admin',
    title: 'Slot Status: Bay G-02 Occupied',
    message: 'Vehicle AP 03 CM 4488 entered Bay G-02 via Boom Barrier Entry Sensor 1.',
    type: 'slot_update',
    createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    isRead: true,
    read: true,
    relatedEntityId: 'slot-loc1-2',
    metadata: {
      slotId: 'slot-loc1-2',
      slotNumber: 'G-02',
      status: 'occupied',
    },
  },
  {
    id: 'adm-notif-4',
    adminId: 'usr-admin',
    title: 'New User Registered: Priya Patel',
    message: 'New driver account registered: priya@example.com (+91 98765 11223).',
    type: 'user_registration',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    isRead: true,
    read: true,
    relatedEntityId: 'usr-2',
    metadata: {
      userId: 'usr-2',
      userName: 'Priya Patel',
      email: 'priya@example.com',
    },
  },
  {
    id: 'adm-notif-5',
    adminId: 'usr-admin',
    title: 'Facility Capacity Alert: High Occupancy',
    message: 'Metro City Center Plaza has 85% occupancy. Only 3 available bays remain.',
    type: 'capacity_alert',
    createdAt: new Date(Date.now() - 3600000 * 0.8).toISOString(),
    isRead: false,
    read: false,
    relatedEntityId: 'loc-1',
    metadata: {
      locationId: 'loc-1',
      locationName: 'Metro City Center Plaza',
      capacityPercentage: 85,
    },
  },
];

const INITIAL_NOTIFICATIONS: SmartNotification[] = [
  {
    id: 'notif-1',
    userId: 'usr-1',
    title: 'Registration Successful',
    message: 'Welcome to Smart Parking! Your driver account has been activated.',
    type: 'registration',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'notif-2',
    userId: 'usr-1',
    title: 'Booking Confirmed - Bay G-03',
    message: 'Reservation PK-94281 confirmed at Metro City Center Plaza. Present your QR pass at gate entry.',
    type: 'booking_confirm',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    bookingId: 'PK-94281',
  },
  {
    id: 'notif-3',
    userId: 'usr-1',
    title: 'Parking Reminder: 45 Mins Remaining',
    message: 'Your allocated parking duration at Bay G-03 expires shortly. Overtime is billed at standard ₹10/hr.',
    type: 'time_reminder',
    read: true,
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    bookingId: 'PK-94281',
  },
  {
    id: 'notif-4',
    userId: 'usr-1',
    title: 'Payment Received: ₹30.00',
    message: 'Payment verified via Online / UPI (Ref: TXN-5829104). Receipt generated.',
    type: 'payment',
    read: true,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    bookingId: 'PK-94281',
  },
];

export function formatReadableTime(input?: string | Date | number): string {
  if (!input) return '';
  try {
    if (typeof input === 'string') {
      const trimmed = input.trim();
      // Match already formatted "10:00 AM" or "4:30 PM"
      if (/^(0?[1-9]|1[0-2]):[0-5][0-9]\s*(AM|PM)$/i.test(trimmed)) {
        return trimmed.toUpperCase();
      }
      // Match 24hr "16:30"
      if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(trimmed)) {
        const [h, m] = trimmed.split(':').map(Number);
        const period = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
      }
    }
    const d = new Date(input);
    if (isNaN(d.getTime())) return String(input);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return String(input);
  }
}

const INITIAL_SESSIONS: ParkingSession[] = [
  {
    id: 'sess-1',
    bookingId: 'PK-94281',
    slotId: 'slot-loc1-3',
    slotNumber: 'G-03',
    locationId: 'loc-1',
    vehicleNumber: 'KA-01-MJ-5000',
    entryTime: new Date(Date.now() - 3600000 * 2).toISOString(),
    plannedDurationHours: 3,
    baseAmount: 40,
    totalAmountPaid: 40,
    status: 'ACTIVE',
    verifiedBy: 'Gate Scanner Terminal A1',
  },
  {
    id: 'sess-2',
    bookingId: 'PK-91204',
    slotId: 'slot-loc1-2',
    slotNumber: 'G-02',
    locationId: 'loc-1',
    vehicleNumber: 'AP 03 CM 4488',
    entryTime: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    plannedDurationHours: 2,
    baseAmount: 30,
    totalAmountPaid: 30,
    status: 'ACTIVE',
    verifiedBy: 'Boom Barrier Entry Sensor 1',
  },
  {
    id: 'sess-3',
    bookingId: 'PK-55192',
    slotId: 'slot-loc1-6',
    slotNumber: 'G-06',
    locationId: 'loc-1',
    vehicleNumber: 'KA 05 EQ 8900',
    entryTime: new Date(Date.now() - 3600000 * 1).toISOString(),
    plannedDurationHours: 2,
    baseAmount: 40,
    totalAmountPaid: 40,
    status: 'ACTIVE',
    verifiedBy: 'EV Terminal Scanner G1',
  },
  {
    id: 'sess-4',
    bookingId: 'PK-33812',
    slotId: 'slot-loc1-9',
    slotNumber: 'G-09',
    locationId: 'loc-1',
    vehicleNumber: 'KA 01 JJ 7721',
    entryTime: new Date(Date.now() - 3600000 * 1.8).toISOString(),
    plannedDurationHours: 2,
    baseAmount: 15,
    totalAmountPaid: 15,
    status: 'ACTIVE',
    verifiedBy: 'Two-Wheeler Gate 2',
  },
  {
    id: 'sess-5',
    bookingId: 'PK-44910',
    slotId: 'slot-loc1-15',
    slotNumber: 'F1-03',
    locationId: 'loc-1',
    vehicleNumber: 'DL 08 CA 1928',
    entryTime: new Date(Date.now() - 3600000 * 0.75).toISOString(),
    plannedDurationHours: 2,
    baseAmount: 30,
    totalAmountPaid: 30,
    status: 'ACTIVE',
    verifiedBy: 'Floor 1 Ramp Scanner',
  },
  {
    id: 'sess-6',
    bookingId: 'PK-66291',
    slotId: 'slot-loc1-20',
    slotNumber: 'F1-08',
    locationId: 'loc-1',
    vehicleNumber: 'TN 07 BE 1234',
    entryTime: new Date(Date.now() - 3600000 * 1.2).toISOString(),
    plannedDurationHours: 2,
    baseAmount: 15,
    totalAmountPaid: 15,
    status: 'ACTIVE',
    verifiedBy: 'Floor 1 Bike Sensor',
  },
  {
    id: 'sess-7',
    bookingId: 'PK-77182',
    slotId: 'slot-loc2-2',
    slotNumber: 'A-02',
    locationId: 'loc-2',
    vehicleNumber: 'MH 12 PQ 3421',
    entryTime: new Date(Date.now() - 3600000 * 1).toISOString(),
    plannedDurationHours: 3,
    baseAmount: 40,
    totalAmountPaid: 40,
    status: 'ACTIVE',
    verifiedBy: 'Tech Park Gate 3',
  },
  {
    id: 'sess-8',
    bookingId: 'PK-88291',
    slotId: 'slot-loc3-3',
    slotNumber: 'M-103',
    locationId: 'loc-3',
    vehicleNumber: 'TS 09 UA 9911',
    entryTime: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    plannedDurationHours: 3,
    baseAmount: 55,
    totalAmountPaid: 55,
    status: 'ACTIVE',
    verifiedBy: 'Mall Lower Ground Scanner',
  },
  {
    id: 'sess-9',
    bookingId: 'PK-99120',
    slotId: 'slot-loc4-2',
    slotNumber: 'R-02',
    locationId: 'loc-4',
    vehicleNumber: 'KA 04 MM 5566',
    entryTime: new Date(Date.now() - 3600000 * 0.5).toISOString(),
    plannedDurationHours: 2,
    baseAmount: 30,
    totalAmountPaid: 30,
    status: 'ACTIVE',
    verifiedBy: 'Railway Junction Gate A',
  },
];

// Helper for localStorage
function getItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Error reading key ${key} from localStorage`, e);
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving key ${key} to localStorage`, e);
  }
}

export const StorageService = {
  // Initialize storage if empty
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.LOCATIONS)) {
      setItem(STORAGE_KEYS.LOCATIONS, INITIAL_LOCATIONS);
    } else {
      // Ensure all cities (Tirupati, Chennai, etc.) are present even if older storage exists
      const storedLocs = getItem<ParkingLocation[]>(STORAGE_KEYS.LOCATIONS, []);
      if (storedLocs.length < INITIAL_LOCATIONS.length || !storedLocs.some((l) => l.city.toLowerCase() === 'tirupati')) {
        const locMap = new Map<string, ParkingLocation>();
        INITIAL_LOCATIONS.forEach((l) => locMap.set(l.id, l));
        storedLocs.forEach((l) => locMap.set(l.id, { ...locMap.get(l.id), ...l }));
        setItem(STORAGE_KEYS.LOCATIONS, Array.from(locMap.values()));
      }
    }

    if (!localStorage.getItem(STORAGE_KEYS.SLOTS)) {
      setItem(STORAGE_KEYS.SLOTS, generateInitialSlots());
    } else {
      const storedSlots = getItem<ParkingSlot[]>(STORAGE_KEYS.SLOTS, []);
      const initialSlots = generateInitialSlots();
      if (storedSlots.length < initialSlots.length) {
        const slotMap = new Map<string, ParkingSlot>();
        initialSlots.forEach((s) => slotMap.set(s.id, s));
        storedSlots.forEach((s) => slotMap.set(s.id, s));
        setItem(STORAGE_KEYS.SLOTS, Array.from(slotMap.values()));
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
      setItem(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
      setItem(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    }
    // Do not force-default to Rahul Sharma; session starts empty unless a user previously logged in
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      setItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
      setItem(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.OCR_LOGS)) {
      setItem(STORAGE_KEYS.OCR_LOGS, []);
    }

    // Connect to Cloud Real-time Engine
    if (!realtimeInitialized && typeof window !== 'undefined') {
      realtimeInitialized = true;
      RealtimeSync.subscribe((event: RealtimeEventPayload) => {
        StorageService.handleRealtimeEvent(event);
      });
      // Fetch fresh server state
      this.syncWithServer().catch(() => {});
    }
  },

  /**
   * Processes live Server-Sent Events from other connected computers/phones
   */
  handleRealtimeEvent(event: RealtimeEventPayload) {
    const { eventType, payload } = event;
    if (!payload || eventType === 'CONNECTED' || eventType === 'PONG') return;

    if (eventType === 'SLOT_UPDATED') {
      const rawSlots = this.getRawSlots();
      const idx = rawSlots.findIndex((s) => s.id === payload.slotId);
      if (idx !== -1) {
        rawSlots[idx].status = payload.status;
        if (payload.bookingId) rawSlots[idx].currentBookingId = payload.bookingId;
        else if (payload.status === 'available') delete rawSlots[idx].currentBookingId;
        setItem(STORAGE_KEYS.SLOTS, rawSlots);
      }
    } else if (eventType === 'BOOKING_CREATED' || eventType === 'NEW_BOOKING') {
      if (payload.booking) {
        const bookings = this.getBookings();
        if (!bookings.some((b) => b.id === payload.booking.id)) {
          bookings.unshift(payload.booking);
          setItem(STORAGE_KEYS.BOOKINGS, bookings);
        }
      }
      if (payload.notification) {
        const notifs = getItem<AdminNotification[]>(STORAGE_KEYS.ADMIN_NOTIFICATIONS, INITIAL_ADMIN_NOTIFICATIONS);
        if (!notifs.some((n) => n.id === payload.notification.id)) {
          notifs.unshift(payload.notification);
          setItem(STORAGE_KEYS.ADMIN_NOTIFICATIONS, notifs);
        }
      }
      const targetSlotId = payload.slotId || payload.booking?.slotId;
      if (targetSlotId) {
        const rawSlots = this.getRawSlots();
        const idx = rawSlots.findIndex((s) => s.id === targetSlotId);
        if (idx !== -1) {
          rawSlots[idx].status = payload.status || 'reserved';
          if (payload.booking?.id) rawSlots[idx].currentBookingId = payload.booking.id;
          setItem(STORAGE_KEYS.SLOTS, rawSlots);
        }
      }
    } else if (eventType === 'BOOKING_CANCELLED' || eventType === 'BOOKING_COMPLETED') {
      const bookings = this.getBookings();
      const b = bookings.find((item) => item.id === payload.bookingId);
      if (b) {
        b.status = eventType === 'BOOKING_CANCELLED' ? 'cancelled' : 'completed';
        setItem(STORAGE_KEYS.BOOKINGS, bookings);
      }
      if (payload.slotId) {
        const rawSlots = this.getRawSlots();
        const idx = rawSlots.findIndex((s) => s.id === payload.slotId);
        if (idx !== -1) {
          rawSlots[idx].status = 'available';
          delete rawSlots[idx].currentBookingId;
          setItem(STORAGE_KEYS.SLOTS, rawSlots);
        }
      }
    } else if (eventType === 'GATE_ENTRY') {
      if (payload.session) {
        const sessions = this.getParkingSessions();
        if (!sessions.some((s) => s.id === payload.session.id)) {
          sessions.unshift(payload.session);
          setItem(STORAGE_KEYS.SESSIONS, sessions);
        }
      }
      if (payload.slotId) {
        const rawSlots = this.getRawSlots();
        const idx = rawSlots.findIndex((s) => s.id === payload.slotId);
        if (idx !== -1) {
          rawSlots[idx].status = 'occupied';
          setItem(STORAGE_KEYS.SLOTS, rawSlots);
        }
      }
    } else if (eventType === 'GATE_EXIT') {
      if (payload.sessionId) {
        const sessions = this.getParkingSessions();
        const s = sessions.find((item) => item.id === payload.sessionId);
        if (s) {
          s.status = 'COMPLETED';
          s.exitTime = new Date().toISOString();
          setItem(STORAGE_KEYS.SESSIONS, sessions);
        }
      }
      if (payload.slotId) {
        const rawSlots = this.getRawSlots();
        const idx = rawSlots.findIndex((s) => s.id === payload.slotId);
        if (idx !== -1) {
          rawSlots[idx].status = 'available';
          delete rawSlots[idx].currentBookingId;
          setItem(STORAGE_KEYS.SLOTS, rawSlots);
        }
      }
    } else if (eventType === 'ADMIN_NOTIFICATION' && payload.notification) {
      const notifs = getItem<AdminNotification[]>(STORAGE_KEYS.ADMIN_NOTIFICATIONS, INITIAL_ADMIN_NOTIFICATIONS);
      if (!notifs.some((n) => n.id === payload.notification.id)) {
        notifs.unshift(payload.notification);
        setItem(STORAGE_KEYS.ADMIN_NOTIFICATIONS, notifs);
      }

      // If notification is a new booking, also ensure bookings and slots are updated on Laptop B
      if (payload.notification.type === 'new_booking') {
        const meta = payload.notification.metadata;
        const bId = meta?.bookingId || payload.notification.bookingId || payload.notification.relatedEntityId;
        if (bId) {
          const bookings = this.getBookings();
          if (!bookings.some((b) => b.id === bId || b.bookingCode === meta?.bookingCode)) {
            const synthBooking: Booking = {
              id: bId,
              bookingCode: meta?.bookingCode || bId,
              userId: meta?.userId || 'usr-1',
              userName: meta?.userName || 'Driver',
              userEmail: meta?.userEmail || 'driver@example.com',
              userPhone: meta?.userPhone || '9876543210',
              locationId: meta?.locationId || 'loc-1',
              locationName: meta?.locationName || 'Central Parking Facility',
              slotId: meta?.slotId || 'slot-loc1-1',
              slotNumber: meta?.slotNumber || 'P-101',
              floor: meta?.floor || 'Ground Floor',
              vehicleType: (meta?.vehicleType as any) || 'car',
              vehicleNumber: meta?.vehicleNumber || 'KA-01-AB-1234',
              bookingDate: meta?.bookingDate || new Date().toISOString().split('T')[0],
              entryTime: meta?.bookingTime || '10:00 AM',
              exitTime: meta?.exitTime || '12:00 PM',
              durationHours: meta?.durationHours || 2,
              amount: meta?.amount || 40,
              paymentStatus: 'paid',
              paymentMethod: meta?.paymentMethod || 'UPI',
              status: 'confirmed',
              transactionId: meta?.transactionId || `TXN-${bId}`,
              createdAt: payload.notification.createdAt || new Date().toISOString(),
            };
            bookings.unshift(synthBooking);
            setItem(STORAGE_KEYS.BOOKINGS, bookings);
          }
        }
        const targetSlotId = meta?.slotId;
        if (targetSlotId) {
          const rawSlots = this.getRawSlots();
          const idx = rawSlots.findIndex((s) => s.id === targetSlotId || (meta?.slotNumber && s.slotNumber === meta.slotNumber));
          if (idx !== -1) {
            rawSlots[idx].status = 'reserved';
            if (bId) rawSlots[idx].currentBookingId = bId;
            setItem(STORAGE_KEYS.SLOTS, rawSlots);
          }
        }
      }
    } else if (eventType === 'ADMIN_NOTIFICATION_READ' && payload.notificationId) {
      const notifs = getItem<AdminNotification[]>(STORAGE_KEYS.ADMIN_NOTIFICATIONS, INITIAL_ADMIN_NOTIFICATIONS);
      const target = notifs.find((n) => n.id === payload.notificationId);
      if (target) {
        target.isRead = true;
        target.read = true;
        setItem(STORAGE_KEYS.ADMIN_NOTIFICATIONS, notifs);
      }
    } else if (eventType === 'ADMIN_ALL_NOTIFICATIONS_READ') {
      const notifs = getItem<AdminNotification[]>(STORAGE_KEYS.ADMIN_NOTIFICATIONS, INITIAL_ADMIN_NOTIFICATIONS);
      notifs.forEach((n) => {
        n.isRead = true;
        n.read = true;
      });
      setItem(STORAGE_KEYS.ADMIN_NOTIFICATIONS, notifs);
    }

    // Trigger local React re-render
    window.dispatchEvent(new CustomEvent('smartparking:sync'));
  },

  /**
   * Synchronizes local state with cloud master state
   */
  async syncWithServer(): Promise<boolean> {
    try {
      const res = await ApiService.getSyncData();
      if (res && res.success && res.data) {
        const data = res.data;
        if (data.locations && data.locations.length > 0) {
          setItem(STORAGE_KEYS.LOCATIONS, data.locations);
        }
        if (data.slots && data.slots.length > 0) {
          setItem(STORAGE_KEYS.SLOTS, data.slots);
        }
        if (data.bookings) {
          setItem(STORAGE_KEYS.BOOKINGS, data.bookings);
        }
        if (data.payments) {
          setItem(STORAGE_KEYS.PAYMENTS, data.payments);
        }
        if (data.sessions) {
          setItem(STORAGE_KEYS.SESSIONS, data.sessions);
        }
        if (data.users && data.users.length > 0) {
          setItem(STORAGE_KEYS.USERS, data.users);
        }
        if (data.adminNotifications && data.adminNotifications.length > 0) {
          setItem(STORAGE_KEYS.ADMIN_NOTIFICATIONS, data.adminNotifications);
        }
        window.dispatchEvent(new CustomEvent('smartparking:sync'));
        return true;
      }
    } catch {
      // Offline fallback: keep cached local state
    }
    return false;
  },

  resetAllData() {
    localStorage.removeItem(STORAGE_KEYS.LOCATIONS);
    localStorage.removeItem(STORAGE_KEYS.SLOTS);
    localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.OCR_LOGS);
    this.init();
  },

  // Users
  getUsers(): User[] {
    return getItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },

  getCurrentUser(): User | null {
    return getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      setItem(STORAGE_KEYS.CURRENT_USER, user);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  async registerUserAsync(
    name: string,
    email: string,
    phone: string,
    password: string
  ): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const res = await ApiService.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        role: 'user',
      });

      if (res && res.success && res.user) {
        const users = this.getUsers();
        const existingIdx = users.findIndex(
          (u) => u.id === res.user.id || u.email.toLowerCase() === res.user.email.toLowerCase()
        );
        if (existingIdx !== -1) {
          users[existingIdx] = res.user;
        } else {
          users.push(res.user);
        }
        setItem(STORAGE_KEYS.USERS, users);
        this.setCurrentUser(res.user);

        // Auto notification for registration
        this.addNotification({
          userId: res.user.id,
          title: 'Registration Successful',
          message: `Welcome, ${res.user.name}! Your Smart Parking driver account is active.`,
          type: 'registration',
        });

        return { success: true, message: res.message || 'Registration successful! Welcome.', user: res.user };
      }

      if (res && !res.success) {
        return { success: false, message: res.message || 'Registration failed.' };
      }
    } catch (err: any) {
      console.warn('[Register Async error, fallback to local storage]', err);
    }

    // Fallback to local storage
    return this.registerUser(name, email, phone, password);
  },

  registerUser(name: string, email: string, phone: string, password: string): { success: boolean; message: string; user?: User } {
    const users = this.getUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase().trim())) {
      return { success: false, message: 'Email address already registered!' };
    }
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role: 'user',
      password,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    setItem(STORAGE_KEYS.USERS, users);
    this.setCurrentUser(newUser);

    // Auto notification for registration
    this.addNotification({
      userId: newUser.id,
      title: 'Registration Successful',
      message: `Welcome, ${newUser.name}! Your Smart Parking driver account is active.`,
      type: 'registration',
    });

    // Admin Notification: New User Registration
    this.addAdminNotification({
      title: `New User Registration: ${newUser.name}`,
      message: `A new driver account has registered: ${newUser.name} (${newUser.email}), Phone: ${newUser.phone || 'N/A'}.`,
      type: 'user_registration',
      relatedEntityId: newUser.id,
      metadata: {
        userId: newUser.id,
        userName: newUser.name,
        userEmail: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
    });

    return { success: true, message: 'Registration successful! Welcome.', user: newUser };
  },

  async loginUserAsync(
    email: string,
    password: string,
    asAdmin = false
  ): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const res = await ApiService.login(email.trim().toLowerCase(), password, asAdmin);
      if (res && res.success && res.user) {
        this.setCurrentUser(res.user);
        const users = this.getUsers();
        const existingIdx = users.findIndex(
          (u) => u.id === res.user.id || u.email.toLowerCase() === res.user.email.toLowerCase()
        );
        if (existingIdx !== -1) {
          users[existingIdx] = res.user;
        } else {
          users.push(res.user);
        }
        setItem(STORAGE_KEYS.USERS, users);
        return { success: true, message: res.message || `Welcome back, ${res.user.name}!`, user: res.user };
      }

      if (res && !res.success) {
        return { success: false, message: res.message || 'Login failed.' };
      }
    } catch (err: any) {
      console.warn('[Login Async error, fallback to local storage]', err);
    }

    // Fallback to local authentication
    return this.loginUser(email, password, asAdmin);
  },

  loginUser(email: string, password: string, asAdmin = false): { success: boolean; message: string; user?: User } {
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, message: 'Account not found with this email. Please check your credentials or register.' };
    }

    if (user.password && user.password !== password) {
      return { success: false, message: 'Incorrect password entered.' };
    }

    if (asAdmin && user.role !== 'admin') {
      return { success: false, message: 'Access denied: this account does not have Admin privileges.' };
    }

    this.setCurrentUser(user);
    return { success: true, message: `Welcome back, ${user.name}!`, user };
  },

  // Locations
  getLocations(searchQuery?: string, cityFilter?: string): ParkingLocation[] {
    let locs = getItem<ParkingLocation[]>(STORAGE_KEYS.LOCATIONS, INITIAL_LOCATIONS);
    
    // Ensure any newly added INITIAL_LOCATIONS (e.g., Tirupati, Chennai, Delhi) are guaranteed in storage
    const idSet = new Set(locs.map((l) => l.id));
    let hasNew = false;
    for (const initLoc of INITIAL_LOCATIONS) {
      if (!idSet.has(initLoc.id)) {
        locs.push(initLoc);
        hasNew = true;
      }
    }
    if (hasNew) {
      setItem(STORAGE_KEYS.LOCATIONS, locs);
    }

    const allSlots = this.getRawSlots();

    // Dynamically calculate live available slots for each facility
    locs = locs.map((l) => {
      const locSlots = allSlots.filter((s) => s.locationId === l.id);
      const avail = locSlots.filter((s) => s.status === 'available').length;
      return {
        ...l,
        availableSlots: locSlots.length > 0 ? avail : (l.availableSlots ?? Math.round(l.totalSlots * 0.7)),
      };
    });

    if (cityFilter && cityFilter !== 'all') {
      locs = locs.filter((l) => l.city.toLowerCase() === cityFilter.toLowerCase());
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      locs = locs.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          l.area.toLowerCase().includes(q) ||
          l.landmark.toLowerCase().includes(q) ||
          l.address.toLowerCase().includes(q) ||
          (l.parkingType && l.parkingType.toLowerCase().includes(q))
      );
    }

    return locs;
  },

  getLocationById(id: string): ParkingLocation | undefined {
    return this.getLocations().find((l) => l.id === id);
  },

  getAllCities(): string[] {
    const locs = this.getLocations();
    const cities = new Set<string>();
    locs.forEach((l) => {
      if (l.city) cities.add(l.city);
    });
    return Array.from(cities);
  },

  ensureSlotsForLocation(locationId: string): ParkingSlot[] {
    const rawSlots = this.getRawSlots();
    const existing = rawSlots.filter((s) => s.locationId === locationId);
    if (existing.length > 0) return existing;

    const loc = this.getLocationById(locationId);
    if (!loc) return [];

    const newSlots = generateSlotsForLocation(loc);
    rawSlots.push(...newSlots);
    setItem(STORAGE_KEYS.SLOTS, rawSlots);
    return newSlots;
  },

  addLocation(newLocation: Omit<ParkingLocation, 'id'> & { id?: string }): ParkingLocation {
    const locs = getItem<ParkingLocation[]>(STORAGE_KEYS.LOCATIONS, INITIAL_LOCATIONS);
    const id = newLocation.id || `loc-custom-${Date.now()}`;
    const location: ParkingLocation = {
      ...newLocation,
      id,
      rates: newLocation.rates || { firstHour: 20, additionalHour: 10 },
      image:
        newLocation.image ||
        'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
      rating: newLocation.rating || 4.8,
      operatingHours: newLocation.operatingHours || '24/7 All Days',
      parkingType: newLocation.parkingType || 'Multi-Level Covered',
      openingTime: newLocation.openingTime || '00:00',
      closingTime: newLocation.closingTime || '23:59',
      totalSlots: newLocation.totalSlots || 20,
    };
    locs.push(location);
    setItem(STORAGE_KEYS.LOCATIONS, locs);

    // Auto-generate slots for this newly added facility
    this.ensureSlotsForLocation(location.id);
    window.dispatchEvent(new CustomEvent('smartparking:sync'));
    return location;
  },

  // Slots
  getRawSlots(): ParkingSlot[] {
    let slots = getItem<ParkingSlot[]>(STORAGE_KEYS.SLOTS, []);
    if (slots.length === 0) {
      slots = generateInitialSlots();
      setItem(STORAGE_KEYS.SLOTS, slots);
    } else {
      // Ensure any newly added locations (e.g., Tirupati, Chennai) have slots generated
      const locIdsWithSlots = new Set(slots.map((s) => s.locationId));
      let addedSlots = false;
      for (const loc of INITIAL_LOCATIONS) {
        if (!locIdsWithSlots.has(loc.id)) {
          const newSlots = generateSlotsForLocation(loc);
          slots.push(...newSlots);
          addedSlots = true;
        }
      }
      if (addedSlots) {
        setItem(STORAGE_KEYS.SLOTS, slots);
      }
    }
    return slots;
  },

  getSlots(): ParkingSlot[] {
    const rawSlots = this.getRawSlots();
    const bookings = getItem<Booking[]>(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
    const sessions = getItem<ParkingSession[]>(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);

    return rawSlots.map((slot) => {
      const enriched: ParkingSlot = { ...slot };

      // 1. Check for active physical session in gate
      const activeSession = sessions.find((s) => s.slotId === slot.id && s.status === 'ACTIVE');

      // 2. Check for active/confirmed booking
      const activeBooking = bookings.find(
        (b) => b.slotId === slot.id && (b.status === 'active' || b.status === 'confirmed')
      );

      // 3. Check for last completed session or booking (for actual exit time)
      const lastSession = sessions.find(
        (s) => s.slotId === slot.id && s.status === 'COMPLETED' && s.exitTime
      );
      const lastBooking = bookings.find(
        (b) => b.slotId === slot.id && b.status === 'completed' && b.actualExitTime
      );

      if (lastSession?.exitTime) {
        enriched.actualExitTime = formatReadableTime(lastSession.exitTime);
      } else if (lastBooking?.actualExitTime) {
        enriched.actualExitTime = formatReadableTime(lastBooking.actualExitTime);
      }

      if (slot.status === 'occupied') {
        if (activeSession) {
          const entryDate = new Date(activeSession.entryTime);
          const durationHours = activeSession.plannedDurationHours || 2;
          const expectedExitDate = new Date(entryDate.getTime() + durationHours * 3600000);

          enriched.currentVehicleNumber = activeSession.vehicleNumber;
          enriched.entryTime = formatReadableTime(entryDate);
          enriched.actualEntryTime = activeSession.entryTime;
          enriched.bookedDurationHours = durationHours;
          enriched.expectedExitTime = expectedExitDate.toISOString();
          enriched.expectedLeavingTime = formatReadableTime(expectedExitDate);
          enriched.availableFrom = enriched.expectedLeavingTime;
          enriched.bookingStatus = 'active';
          enriched.currentBookingId = activeSession.bookingId;

          // Detect late exit / overtime
          const now = Date.now();
          if (now > expectedExitDate.getTime()) {
            const overtimeMins = Math.floor((now - expectedExitDate.getTime()) / 60000);
            if (overtimeMins >= 1) {
              enriched.isOvertime = true;
              enriched.overtimeMinutes = overtimeMins;
              const rate = slot.vehicleType === 'ev' ? 15 : 10;
              enriched.overtimeFee = Math.max(10, Math.ceil(overtimeMins / 60) * rate);
            }
          }
        } else if (activeBooking) {
          const entryTimeStr = activeBooking.actualEntryTime
            ? formatReadableTime(activeBooking.actualEntryTime)
            : activeBooking.entryTime || '10:00 AM';
          enriched.currentVehicleNumber = activeBooking.vehicleNumber;
          enriched.entryTime = entryTimeStr;
          enriched.actualEntryTime = activeBooking.actualEntryTime || activeBooking.createdAt;
          enriched.bookedDurationHours = activeBooking.durationHours || 2;
          enriched.expectedLeavingTime = activeBooking.exitTime || formatReadableTime(new Date(Date.now() + 3600000 * 2));
          enriched.availableFrom = enriched.expectedLeavingTime;
          enriched.bookingStatus = activeBooking.status;
          enriched.driverName = activeBooking.userName;
          enriched.currentBookingId = activeBooking.id;
        } else {
          // Realistic fallback for occupied slot without explicit session
          const seedEntry = new Date(Date.now() - 3600000 * 1.5);
          const seedExit = new Date(seedEntry.getTime() + 2.5 * 3600000);
          enriched.currentVehicleNumber = 'AP 03 CM 4488';
          enriched.entryTime = formatReadableTime(seedEntry);
          enriched.actualEntryTime = seedEntry.toISOString();
          enriched.bookedDurationHours = 2;
          enriched.expectedLeavingTime = formatReadableTime(seedExit);
          enriched.availableFrom = enriched.expectedLeavingTime;
          enriched.bookingStatus = 'active';
        }
      } else if (slot.status === 'reserved') {
        if (activeBooking) {
          enriched.currentVehicleNumber = activeBooking.vehicleNumber;
          enriched.entryTime = activeBooking.entryTime;
          enriched.bookedDurationHours = activeBooking.durationHours;
          enriched.expectedLeavingTime = activeBooking.exitTime;
          enriched.availableFrom = activeBooking.exitTime;
          enriched.bookingStatus = 'confirmed';
          enriched.driverName = activeBooking.userName;
          enriched.currentBookingId = activeBooking.id;
        } else {
          const mockExit = new Date(Date.now() + 3600000 * 2);
          enriched.currentVehicleNumber = 'KA 03 MX 4421';
          enriched.entryTime = formatReadableTime(new Date());
          enriched.bookedDurationHours = 2;
          enriched.expectedLeavingTime = formatReadableTime(mockExit);
          enriched.availableFrom = enriched.expectedLeavingTime;
          enriched.bookingStatus = 'confirmed';
        }
      } else if (slot.status === 'available') {
        enriched.availableFrom = 'Now';
        enriched.currentVehicleNumber = undefined;
        enriched.entryTime = undefined;
        enriched.expectedLeavingTime = undefined;
        enriched.isOvertime = false;
        enriched.overtimeMinutes = 0;
        enriched.overtimeFee = 0;
      } else if (slot.status === 'maintenance') {
        enriched.availableFrom = 'Under Maintenance';
        enriched.currentVehicleNumber = undefined;
        enriched.entryTime = undefined;
        enriched.expectedLeavingTime = undefined;
        enriched.isOvertime = false;
      }

      return enriched;
    });
  },

  getSlotsByLocation(locationId: string): ParkingSlot[] {
    const slots = this.getSlots();
    return slots.filter((s) => s.locationId === locationId);
  },

  updateSlotStatus(slotId: string, status: SlotStatus, bookingId?: string): boolean {
    const rawSlots = this.getRawSlots();
    const idx = rawSlots.findIndex((s) => s.id === slotId);
    if (idx === -1) return false;

    rawSlots[idx].status = status;
    if (bookingId) {
      rawSlots[idx].currentBookingId = bookingId;
    } else if (status === 'available') {
      delete rawSlots[idx].currentBookingId;
    }
    setItem(STORAGE_KEYS.SLOTS, rawSlots);

    const slot = rawSlots[idx];

    // Admin Notification: Parking Slot Update
    this.addAdminNotification({
      title: `Slot Update: Bay ${slot.slotNumber} is ${status.toUpperCase()}`,
      message: `Parking bay ${slot.slotNumber} (${slot.floor}) marked as ${status.toUpperCase()}${bookingId ? ` (Booking: ${bookingId})` : ''}.`,
      type: 'slot_update',
      relatedEntityId: slot.id,
      metadata: {
        slotId: slot.id,
        slotNumber: slot.slotNumber,
        locationId: slot.locationId,
        status,
        bookingId,
      },
    });

    if (status === 'occupied' || status === 'reserved') {
      this.checkLocationCapacity(slot.locationId);
    }

    // Persist to server and broadcast to all connected devices in real-time
    ApiService.updateSlotStatus(slotId, status, bookingId).catch(() => {});
    return true;
  },

  /**
   * Release a slot immediately (Early Exit, Admin Clearance, or Session End)
   * When a vehicle exits earlier or on time:
   * 1. Records actual exit time
   * 2. Sets slot to AVAILABLE
   * 3. Sets Available From to Now
   * 4. Removes vehicle info
   * 5. Makes slot available for new bookings
   */
  releaseSlotEarly(
    slotId: string,
    verifiedBy = 'Security Terminal / Quick Checkout'
  ): { success: boolean; message: string; actualExitTime?: string } {
    const exitNow = new Date();
    const formattedExit = formatReadableTime(exitNow);

    // 1. Close any active session
    const sessions = this.getParkingSessions();
    const session = sessions.find((s) => s.slotId === slotId && s.status === 'ACTIVE');
    if (session) {
      session.exitTime = exitNow.toISOString();
      session.status = 'COMPLETED';
      session.verifiedBy = verifiedBy;
      setItem(STORAGE_KEYS.SESSIONS, sessions);
      ApiService.gateCheckOut(session.id, slotId).catch(() => {});
    }

    // 2. Complete any active or confirmed booking
    const bookings = this.getBookings();
    const booking = bookings.find(
      (b) => b.slotId === slotId && (b.status === 'active' || b.status === 'confirmed')
    );
    if (booking) {
      booking.status = 'completed';
      booking.actualExitTime = exitNow.toISOString();
      setItem(STORAGE_KEYS.BOOKINGS, bookings);

      this.addNotification({
        userId: booking.userId,
        title: 'Parking Session Ended',
        message: `Exit confirmed for ${booking.vehicleNumber} at Slot ${booking.slotNumber}. Actual exit: ${formattedExit}. Bay is now released.`,
        type: 'session_completed',
        bookingId: booking.id,
      });
    }

    // 3. Mark slot available immediately
    this.updateSlotStatus(slotId, 'available');

    return {
      success: true,
      message: `Slot released successfully! Actual exit time recorded at ${formattedExit}. Available from: Now.`,
      actualExitTime: formattedExit,
    };
  },

  /**
   * Demo Simulation helper: Fast-forwards entry time into the past to demonstrate
   * "Parking time exceeded" indicator and automated overtime fee calculation.
   */
  simulateOvertime(slotId: string, hoursOverdue = 1.5): boolean {
    const sessions = this.getParkingSessions();
    let session = sessions.find((s) => s.slotId === slotId && s.status === 'ACTIVE');

    if (!session) {
      // Create session on this slot if none
      const slot = this.getSlots().find((s) => s.id === slotId);
      if (!slot) return false;
      this.updateSlotStatus(slotId, 'occupied');
      session = {
        id: `sess-sim-${Date.now()}`,
        bookingId: `SIM-${Math.floor(1000 + Math.random() * 9000)}`,
        slotId,
        slotNumber: slot.slotNumber,
        locationId: slot.locationId,
        vehicleNumber: 'AP 03 CM 4488',
        entryTime: new Date(Date.now() - (2 + hoursOverdue) * 3600000).toISOString(),
        plannedDurationHours: 2,
        baseAmount: 30,
        totalAmountPaid: 30,
        status: 'ACTIVE',
        verifiedBy: 'Simulated Entry Gate',
      };
      sessions.unshift(session);
    } else {
      // Shift entry time back
      const planned = session.plannedDurationHours || 2;
      session.entryTime = new Date(Date.now() - (planned + hoursOverdue) * 3600000).toISOString();
    }

    setItem(STORAGE_KEYS.SESSIONS, sessions);
    return true;
  },

  addSlot(slotData: Omit<ParkingSlot, 'id'>): ParkingSlot {
    const slots = this.getSlots();
    const newSlot: ParkingSlot = {
      ...slotData,
      id: `slot-custom-${Date.now()}`,
    };
    slots.push(newSlot);
    setItem(STORAGE_KEYS.SLOTS, slots);
    return newSlot;
  },

  deleteSlot(slotId: string): boolean {
    const slots = this.getSlots();
    const filtered = slots.filter((s) => s.id !== slotId);
    if (filtered.length === slots.length) return false;
    setItem(STORAGE_KEYS.SLOTS, filtered);
    return true;
  },

  // Fee calculation rule:
  // "First hour: ₹20, Every additional hour: ₹10"
  calculateParkingFee(durationHours: number, vehicleType: VehicleType = 'car'): {
    durationHours: number;
    firstHourCharge: number;
    additionalHourCharge: number;
    additionalHours: number;
    totalAmount: number;
  } {
    const hours = Math.max(1, Math.ceil(durationHours));
    let baseRate = 20;
    let addRate = 10;

    if (vehicleType === 'bike') {
      baseRate = 10;
      addRate = 5;
    } else if (vehicleType === 'ev') {
      baseRate = 25; // includes charging port access
      addRate = 15;
    }

    const additionalHours = Math.max(0, hours - 1);
    const firstHourCharge = baseRate;
    const additionalHourCharge = additionalHours * addRate;
    const totalAmount = firstHourCharge + additionalHourCharge;

    return {
      durationHours: hours,
      firstHourCharge,
      additionalHourCharge,
      additionalHours,
      totalAmount,
    };
  },

  // Bookings with double-booking collision check!
  getBookings(): Booking[] {
    return getItem<Booking[]>(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
  },

  setBookingsCache(bookings: Booking[]): void {
    if (Array.isArray(bookings)) {
      setItem(STORAGE_KEYS.BOOKINGS, bookings);
      window.dispatchEvent(new CustomEvent('smartparking:sync'));
    }
  },

  getUserBookings(userId: string): Booking[] {
    const bookings = this.getBookings();
    return bookings.filter((b) => b.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createBooking(params: {
    userId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    locationId: string;
    slotId: string;
    vehicleType: VehicleType;
    vehicleNumber: string;
    bookingDate: string;
    entryTime: string;
    exitTime: string;
    durationHours: number;
    paymentMethod: string;
    customBookingId?: string;
    customTxnId?: string;
    skipApiSync?: boolean;
  }): { success: boolean; message: string; booking?: Booking } {
    const slots = this.getSlots();
    const targetSlot = slots.find((s) => s.id === params.slotId);

    if (!targetSlot) {
      return { success: false, message: 'Selected parking slot not found.' };
    }

    // Atomic double-booking prevention!
    if (targetSlot.status !== 'available' && targetSlot.currentBookingId !== params.customBookingId) {
      return {
        success: false,
        message: `Collision Detected: Slot ${targetSlot.slotNumber} was just reserved or is occupied. Please select an available slot.`,
      };
    }

    const locations = this.getLocations();
    const loc = locations.find((l) => l.id === params.locationId) || {
      name: 'Central Parking Facility',
    };

    const feeDetails = this.calculateParkingFee(params.durationHours, params.vehicleType);
    const bookingId = params.customBookingId || `PK-${Math.floor(10000 + Math.random() * 90000)}`;
    const transactionId = params.customTxnId || `TXN-${Date.now().toString().slice(-8)}${Math.floor(10 + Math.random() * 90)}`;

    const newBooking: Booking = {
      id: bookingId,
      userId: params.userId,
      userName: params.userName,
      userEmail: params.userEmail,
      userPhone: params.userPhone,
      locationId: params.locationId,
      locationName: loc.name,
      slotId: targetSlot.id,
      slotNumber: targetSlot.slotNumber,
      floor: targetSlot.floor,
      vehicleType: params.vehicleType,
      vehicleNumber: params.vehicleNumber.toUpperCase().trim(),
      bookingDate: params.bookingDate,
      entryTime: params.entryTime,
      exitTime: params.exitTime,
      durationHours: feeDetails.durationHours,
      amount: feeDetails.totalAmount,
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: params.paymentMethod || 'Online / UPI',
      transactionId,
      createdAt: new Date().toISOString(),
      qrCodeData: `SPMS|${bookingId}|${targetSlot.slotNumber}|${params.vehicleNumber}|₹${feeDetails.totalAmount}`,
    };

    // 1. Save booking
    const bookings = this.getBookings();
    const existingIdx = bookings.findIndex((b) => b.id === bookingId);
    if (existingIdx >= 0) {
      bookings[existingIdx] = newBooking;
    } else {
      bookings.unshift(newBooking);
    }
    setItem(STORAGE_KEYS.BOOKINGS, bookings);

    // 2. Automatically update slot status to 'reserved'
    this.updateSlotStatus(targetSlot.id, 'reserved', bookingId);

    // 3. Record payment
    const payments = getItem<PaymentRecord[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      bookingId,
      userId: params.userId,
      userName: params.userName,
      amount: feeDetails.totalAmount,
      paymentMethod: params.paymentMethod || 'Online / UPI',
      status: 'paid',
      timestamp: new Date().toISOString(),
      transactionRef: transactionId,
    };
    payments.unshift(newPayment);
    setItem(STORAGE_KEYS.PAYMENTS, payments);

    // Auto-generate smart notifications for successful booking and payment
    this.addNotification({
      userId: params.userId,
      title: 'Booking Confirmed',
      message: `Reservation ${bookingId} confirmed for Slot ${targetSlot.slotNumber} at ${loc.name}.`,
      type: 'booking_confirm',
      bookingId,
    });

    this.addNotification({
      userId: params.userId,
      title: 'Payment Successful',
      message: `Payment of ₹${feeDetails.totalAmount.toFixed(2)} received via ${params.paymentMethod || 'Online'}. (Ref: ${transactionId})`,
      type: 'payment',
      bookingId,
    });

    this.addNotification({
      userId: params.userId,
      title: 'Parking Reminder Scheduled',
      message: `Remember to arrive at ${loc.name} by ${params.entryTime} for slot ${targetSlot.slotNumber}.`,
      type: 'upcoming_reminder',
      bookingId,
    });

    // Admin Notification: New Booking Event (with exact multi-device format)
    this.addAdminNotification({
      title: 'New Parking Booking Received',
      message: `Location: ${loc.name} | Slot: ${targetSlot.slotNumber} | Vehicle: ${params.vehicleNumber} | User: ${params.userName} | Booking Time: ${params.entryTime} | Status: Confirmed`,
      type: 'new_booking',
      relatedEntityId: bookingId,
      metadata: {
        bookingId,
        slotId: targetSlot.id,
        slotNumber: targetSlot.slotNumber,
        locationId: params.locationId,
        locationName: loc.name,
        userName: params.userName,
        userPhone: params.userPhone,
        vehicleNumber: params.vehicleNumber,
        bookingTime: params.entryTime,
        status: 'Confirmed',
        amount: feeDetails.totalAmount,
        paymentMethod: params.paymentMethod || 'Online / UPI',
      },
    });

    // Admin Notification: Payment Update
    this.addAdminNotification({
      title: `Payment Received: ₹${feeDetails.totalAmount}.00`,
      message: `Payment of ₹${feeDetails.totalAmount}.00 recorded for Reservation #${bookingId} via ${params.paymentMethod || 'Online / UPI'} (Txn: ${transactionId}).`,
      type: 'payment_update',
      relatedEntityId: newPayment.id,
      metadata: {
        paymentId: newPayment.id,
        bookingId,
        amount: feeDetails.totalAmount,
        transactionId,
        paymentStatus: 'completed',
      },
    });

    this.checkLocationCapacity(params.locationId);

    // Sync with backend API & broadcast to other devices (unless already synced via createBookingAsync)
    if (!params.skipApiSync) {
      ApiService.createBooking({
        ...newBooking,
        slotId: targetSlot.id,
        amount: feeDetails.totalAmount,
      }).catch(() => {});
    }

    return {
      success: true,
      message: `Success! Slot ${targetSlot.slotNumber} has been reserved for ${params.vehicleNumber}.`,
      booking: newBooking,
    };
  },

  /**
   * Asynchronous booking creation communicating with central backend first!
   * Guarantees that bookings made from Laptop A immediately notify Laptop B's Admin Console.
   */
  async createBookingAsync(params: {
    userId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    locationId: string;
    slotId: string;
    vehicleType: VehicleType;
    vehicleNumber: string;
    bookingDate: string;
    entryTime: string;
    exitTime: string;
    durationHours: number;
    paymentMethod: string;
  }): Promise<{ success: boolean; message: string; booking?: Booking }> {
    const feeDetails = this.calculateParkingFee(params.durationHours, params.vehicleType);
    const bookingId = `PK-${Math.floor(10000 + Math.random() * 90000)}`;
    const transactionId = `TXN-${Date.now().toString().slice(-8)}${Math.floor(10 + Math.random() * 90)}`;
    const locations = this.getLocations();
    const loc = locations.find((l) => l.id === params.locationId) || { name: 'Central Parking Facility' };
    const slots = this.getSlots();
    const targetSlot = slots.find((s) => s.id === params.slotId);

    if (!targetSlot) {
      return { success: false, message: 'Selected parking slot not found.' };
    }

    const payload = {
      id: bookingId,
      bookingCode: bookingId,
      userId: params.userId,
      userName: params.userName,
      userEmail: params.userEmail,
      userPhone: params.userPhone,
      locationId: params.locationId,
      locationName: loc.name,
      slotId: targetSlot.id,
      slotNumber: targetSlot.slotNumber,
      floor: targetSlot.floor,
      vehicleType: params.vehicleType,
      vehicleNumber: params.vehicleNumber.toUpperCase().trim(),
      bookingDate: params.bookingDate,
      entryTime: params.entryTime,
      exitTime: params.exitTime,
      durationHours: feeDetails.durationHours,
      amount: feeDetails.totalAmount,
      paymentMethod: params.paymentMethod || 'Online / UPI',
      transactionId,
    };

    let serverConfirmedBooking: Booking | undefined;
    let isServerInitializingOrOffline = false;
    try {
      // 1. Submit directly to shared backend cloud database
      const apiRes = await ApiService.createBooking(payload);
      if (apiRes && apiRes.success && (apiRes.booking || apiRes.data)) {
        serverConfirmedBooking = apiRes.booking || apiRes.data;
      } else if (apiRes && !apiRes.success) {
        // Only reject if there is a real business conflict (slot already taken)
        const isSlotConflict =
          apiRes.status === '409' ||
          (apiRes.message && (
            apiRes.message.toLowerCase().includes('conflict') ||
            apiRes.message.toLowerCase().includes('already reserved') ||
            apiRes.message.toLowerCase().includes('already booked') ||
            apiRes.message.toLowerCase().includes('another user')
          ));

        if (isSlotConflict) {
          return { success: false, message: apiRes.message || 'Slot was just booked by another user. Please choose another bay.' };
        }

        // If server is initializing, returned HTML, 404, or route warming up:
        console.warn('[StorageService] Cloud sync deferred (server initializing):', apiRes.message);
        isServerInitializingOrOffline = true;
      }
    } catch (err: any) {
      console.warn('[StorageService] Central server network warning:', err);
      isServerInitializingOrOffline = true;
    }

    // 2. Persist locally with instant reservation lock & QR pass generation
    const localResult = this.createBooking({
      ...params,
      customBookingId: serverConfirmedBooking?.id || bookingId,
      customTxnId: transactionId,
      skipApiSync: serverConfirmedBooking ? true : false,
    });

    const confirmedBooking = serverConfirmedBooking || localResult.booking || ({
      ...payload,
      status: 'confirmed',
      paymentStatus: 'paid',
      createdAt: new Date().toISOString(),
      qrCodeData: `SMART_PARK|${bookingId}|${targetSlot.slotNumber}|${params.vehicleNumber}`,
    } as Booking);

    return {
      success: true,
      message: isServerInitializingOrOffline
        ? `Success! Slot ${targetSlot.slotNumber} reserved for ${params.vehicleNumber}. (Pass confirmed & active)`
        : `Success! Slot ${targetSlot.slotNumber} reserved for ${params.vehicleNumber}.`,
      booking: confirmedBooking,
    };
  },

  cancelBooking(bookingId: string): { success: boolean; message: string } {
    const bookings = this.getBookings();
    const idx = bookings.findIndex((b) => b.id === bookingId);
    if (idx === -1) {
      return { success: false, message: 'Booking record not found.' };
    }

    const booking = bookings[idx];
    if (booking.status === 'cancelled') {
      return { success: false, message: 'This booking is already cancelled.' };
    }

    booking.status = 'cancelled';
    booking.paymentStatus = 'refunded';
    setItem(STORAGE_KEYS.BOOKINGS, bookings);

    // Free the slot back to 'available'
    this.updateSlotStatus(booking.slotId, 'available');

    // Sync cancellation to server
    ApiService.cancelBooking(bookingId).catch(() => {});

    // Notify user of cancellation & refund
    this.addNotification({
      userId: booking.userId,
      title: 'Booking Cancelled & Refunded',
      message: `Booking #${bookingId} for Slot ${booking.slotNumber} has been cancelled. Refund of ₹${booking.amount} initiated.`,
      type: 'info',
      bookingId,
    });

    // Admin Notification: Booking Cancellation
    this.addAdminNotification({
      title: `Booking Cancelled: #${bookingId}`,
      message: `Reservation #${bookingId} (${booking.slotNumber}, ${booking.vehicleNumber}) was cancelled. Bay ${booking.slotNumber} released.`,
      type: 'booking_cancellation',
      relatedEntityId: bookingId,
      metadata: {
        bookingId,
        slotId: booking.slotId,
        slotNumber: booking.slotNumber,
        vehicleNumber: booking.vehicleNumber,
        userName: booking.userName,
        amount: booking.amount,
      },
    });

    return {
      success: true,
      message: `Booking #${bookingId} has been cancelled and Slot ${booking.slotNumber} has been released.`,
    };
  },

  completeBooking(bookingId: string): boolean {
    const bookings = this.getBookings();
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return false;

    booking.status = 'completed';
    setItem(STORAGE_KEYS.BOOKINGS, bookings);
    this.updateSlotStatus(booking.slotId, 'available');

    // Sync completion to server
    ApiService.completeBooking(bookingId).catch(() => {});

    this.addNotification({
      userId: booking.userId,
      title: 'Parking Session Completed',
      message: `Thank you for parking at ${booking.locationName}! Slot ${booking.slotNumber} has been checked out.`,
      type: 'session_completed',
      bookingId,
    });

    return true;
  },

  // ==========================================
  // SMART NOTIFICATIONS SYSTEM
  // ==========================================
  getNotifications(userId?: string): SmartNotification[] {
    const notifs = getItem<SmartNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    if (!userId) return notifs;
    return notifs
      .filter((n) => n.userId === userId || n.userId === 'all')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  addNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: SmartNotification['type'];
    bookingId?: string;
  }): SmartNotification {
    const notifs = getItem<SmartNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const newNotif: SmartNotification = {
      id: `notif-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      read: false,
      createdAt: new Date().toISOString(),
      bookingId: data.bookingId,
    };
    notifs.unshift(newNotif);
    setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smartparking:sync'));
    }
    return newNotif;
  },

  markNotificationAsRead(id: string): void {
    const notifs = getItem<SmartNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const target = notifs.find((n) => n.id === id);
    if (target) {
      target.read = true;
      setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
    }
  },

  markAllNotificationsAsRead(userId: string): void {
    const notifs = getItem<SmartNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    notifs.forEach((n) => {
      if (n.userId === userId || n.userId === 'all') {
        n.read = true;
      }
    });
    setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
  },

  deleteNotification(id: string): void {
    const notifs = getItem<SmartNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const filtered = notifs.filter((n) => n.id !== id);
    setItem(STORAGE_KEYS.NOTIFICATIONS, filtered);
  },

  clearAllNotifications(userId?: string): void {
    if (!userId) {
      setItem(STORAGE_KEYS.NOTIFICATIONS, []);
      return;
    }
    const notifs = getItem<SmartNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const remaining = notifs.filter((n) => n.userId !== userId && n.userId !== 'all');
    setItem(STORAGE_KEYS.NOTIFICATIONS, remaining);
  },

  // ==========================================
  // ADMIN NOTIFICATIONS SYSTEM
  // ==========================================
  getAdminNotifications(filter: 'all' | 'unread' = 'all', type?: string): AdminNotification[] {
    const notifs = getItem<AdminNotification[]>(STORAGE_KEYS.ADMIN_NOTIFICATIONS, INITIAL_ADMIN_NOTIFICATIONS);
    let list = notifs;
    if (filter === 'unread') {
      list = list.filter((n) => !n.isRead && !n.read);
    }
    if (type && type !== 'all') {
      list = list.filter((n) => n.type === type);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getAdminUnreadCount(): number {
    const notifs = getItem<AdminNotification[]>(STORAGE_KEYS.ADMIN_NOTIFICATIONS, INITIAL_ADMIN_NOTIFICATIONS);
    return notifs.filter((n) => !n.isRead && !n.read).length;
  },

  addAdminNotification(data: {
    title: string;
    message: string;
    type: string;
    relatedEntityId?: string;
    adminId?: string;
    metadata?: Record<string, any>;
  }): AdminNotification {
    const notifs = getItem<AdminNotification[]>(STORAGE_KEYS.ADMIN_NOTIFICATIONS, INITIAL_ADMIN_NOTIFICATIONS);
    const newNotif: AdminNotification = {
      id: `adm-notif-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      adminId: data.adminId || 'usr-admin',
      title: data.title,
      message: data.message,
      type: data.type,
      createdAt: new Date().toISOString(),
      isRead: false,
      read: false,
      relatedEntityId: data.relatedEntityId,
      bookingId: data.metadata?.bookingId,
      metadata: data.metadata,
    };
    notifs.unshift(newNotif);
    setItem(STORAGE_KEYS.ADMIN_NOTIFICATIONS, notifs);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smartparking:admin-notification', { detail: newNotif }));
      window.dispatchEvent(new CustomEvent('smartparking:sync'));
    }

    return newNotif;
  },

  markAdminNotificationAsRead(id: string): void {
    const notifs = getItem<AdminNotification[]>(STORAGE_KEYS.ADMIN_NOTIFICATIONS, INITIAL_ADMIN_NOTIFICATIONS);
    const target = notifs.find((n) => n.id === id);
    if (target) {
      target.isRead = true;
      target.read = true;
      setItem(STORAGE_KEYS.ADMIN_NOTIFICATIONS, notifs);
      ApiService.markAdminNotificationRead(id).catch(() => {});
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('smartparking:sync'));
      }
    }
  },

  markAllAdminNotificationsAsRead(): void {
    const notifs = getItem<AdminNotification[]>(STORAGE_KEYS.ADMIN_NOTIFICATIONS, INITIAL_ADMIN_NOTIFICATIONS);
    notifs.forEach((n) => {
      n.isRead = true;
      n.read = true;
    });
    setItem(STORAGE_KEYS.ADMIN_NOTIFICATIONS, notifs);
    ApiService.markAllAdminNotificationsRead().catch(() => {});
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smartparking:sync'));
    }
  },

  deleteAdminNotification(id: string): void {
    const notifs = getItem<AdminNotification[]>(STORAGE_KEYS.ADMIN_NOTIFICATIONS, INITIAL_ADMIN_NOTIFICATIONS);
    const filtered = notifs.filter((n) => n.id !== id);
    setItem(STORAGE_KEYS.ADMIN_NOTIFICATIONS, filtered);
    ApiService.deleteAdminNotification(id).catch(() => {});
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smartparking:sync'));
    }
  },

  checkLocationCapacity(locationId: string): void {
    const loc = this.getLocationById(locationId);
    if (!loc) return;
    const slots = this.getSlotsByLocation(locationId);
    if (slots.length === 0) return;
    const total = slots.length;
    const occupiedCount = slots.filter((s) => s.status === 'occupied' || s.status === 'reserved').length;
    const availableCount = slots.filter((s) => s.status === 'available').length;
    const percentage = Math.round((occupiedCount / total) * 100);

    if (availableCount === 0 || percentage >= 85) {
      this.addAdminNotification({
        title: `Capacity Alert: ${loc.name} ${availableCount === 0 ? 'Full' : 'Near Capacity'}`,
        message: `${loc.name} is currently at ${percentage}% capacity (${occupiedCount}/${total} slots occupied/reserved, ${availableCount} available).`,
        type: 'capacity_alert',
        relatedEntityId: loc.id,
        metadata: {
          locationId: loc.id,
          locationName: loc.name,
          capacityPercentage: percentage,
          occupiedCount,
          availableCount,
          totalSlots: total,
          severity: availableCount === 0 ? 'error' : 'warning',
        },
      });
    }
  },

  // ==========================================
  // QR CODE ENTRY & EXIT SESSION GATE TRACKING
  // ==========================================
  getParkingSessions(): ParkingSession[] {
    return getItem<ParkingSession[]>(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
  },

  getBookingByQRCode(qrText: string): Booking | null {
    if (!qrText || !qrText.trim()) return null;
    const clean = qrText.trim();
    const bookings = this.getBookings();

    // 1. Direct booking ID check
    let found = bookings.find((b) => b.id.toLowerCase() === clean.toLowerCase());
    if (found) return found;

    // 2. Structured SPMS format: SPMS|PK-XXXXX|Slot|Vehicle|Price
    if (clean.includes('|')) {
      const parts = clean.split('|');
      const idCandidate = parts.find((p) => p.startsWith('PK-'));
      if (idCandidate) {
        found = bookings.find((b) => b.id === idCandidate);
        if (found) return found;
      }
    }

    // 3. Match vehicle number in active bookings
    found = bookings.find(
      (b) => b.vehicleNumber.replace(/[\s-]/g, '').toLowerCase() === clean.replace(/[\s-]/g, '').toLowerCase() && b.status !== 'cancelled'
    );
    return found || null;
  },

  verifyGateCheckIn(
    bookingIdOrCode: string,
    verifiedBy = 'Security Gate Terminal 1'
  ): { success: boolean; message: string; session?: ParkingSession; booking?: Booking } {
    const booking = this.getBookingByQRCode(bookingIdOrCode);
    if (!booking) {
      return { success: false, message: 'Invalid QR Code: No matching reservation found in the system.' };
    }

    if (booking.status === 'cancelled') {
      return { success: false, message: 'Access Denied: This booking was cancelled.' };
    }

    if (booking.status === 'completed') {
      return { success: false, message: 'Access Denied: This parking session has already been completed.' };
    }

    const sessions = this.getParkingSessions();
    const existingActiveSession = sessions.find((s) => s.bookingId === booking.id && s.status === 'ACTIVE');
    if (existingActiveSession) {
      return {
        success: false,
        message: `Duplicate Entry Prevented: Vehicle ${booking.vehicleNumber} already entered at ${new Date(
          existingActiveSession.entryTime
        ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        session: existingActiveSession,
        booking,
      };
    }

    // Create active entry session
    const entryNow = new Date().toISOString();
    const newSession: ParkingSession = {
      id: `sess-${Date.now()}`,
      bookingId: booking.id,
      slotId: booking.slotId,
      slotNumber: booking.slotNumber,
      locationId: booking.locationId,
      vehicleNumber: booking.vehicleNumber,
      entryTime: entryNow,
      plannedDurationHours: booking.durationHours,
      baseAmount: booking.amount,
      totalAmountPaid: booking.amount,
      status: 'ACTIVE',
      verifiedBy,
    };

    sessions.unshift(newSession);
    setItem(STORAGE_KEYS.SESSIONS, sessions);

    // Update booking state
    booking.actualEntryTime = entryNow;
    booking.status = 'active';
    const allBookings = this.getBookings();
    const bIdx = allBookings.findIndex((b) => b.id === booking.id);
    if (bIdx !== -1) {
      allBookings[bIdx] = booking;
      setItem(STORAGE_KEYS.BOOKINGS, allBookings);
    }

    // Mark slot occupied
    this.updateSlotStatus(booking.slotId, 'occupied', booking.id);

    // Notify user
    this.addNotification({
      userId: booking.userId,
      title: 'Gate Entry Recorded - Welcome!',
      message: `QR Verified. Bay ${booking.slotNumber} barrier opened for ${booking.vehicleNumber} at ${new Date(
        entryNow
      ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      type: 'info',
      bookingId: booking.id,
    });

    return {
      success: true,
      message: `Verified! Boom barrier opened for Slot ${booking.slotNumber} (${booking.vehicleNumber}).`,
      session: newSession,
      booking,
    };
  },

  verifyGateCheckOut(
    bookingIdOrCode: string,
    verifiedBy = 'Exit Gate Terminal 1'
  ): {
    success: boolean;
    message: string;
    session?: ParkingSession;
    booking?: Booking;
    overtimeMinutes: number;
    extraFee: number;
    totalFee: number;
  } {
    const booking = this.getBookingByQRCode(bookingIdOrCode);
    if (!booking) {
      return {
        success: false,
        message: 'Invalid QR Code: No matching reservation found.',
        overtimeMinutes: 0,
        extraFee: 0,
        totalFee: 0,
      };
    }

    const sessions = this.getParkingSessions();
    const session = sessions.find((s) => s.bookingId === booking.id && s.status === 'ACTIVE');

    const exitNow = new Date();
    const entryDate = session ? new Date(session.entryTime) : new Date(booking.createdAt);
    const elapsedMinutes = Math.max(1, Math.round((exitNow.getTime() - entryDate.getTime()) / (1000 * 60)));

    const plannedMinutes = booking.durationHours * 60;
    const overtimeMinutes = Math.max(0, elapsedMinutes - plannedMinutes);

    // Overtime billing rule: ₹10 per additional 60 min block (or ₹15 for EV)
    let extraFee = 0;
    if (overtimeMinutes > 15) {
      const extraBlocks = Math.ceil(overtimeMinutes / 60);
      const ratePerHour = booking.vehicleType === 'ev' ? 15 : 10;
      extraFee = extraBlocks * ratePerHour;
    }

    const totalFee = booking.amount + extraFee;

    if (session) {
      session.exitTime = exitNow.toISOString();
      session.actualDurationMinutes = elapsedMinutes;
      session.overtimeMinutes = overtimeMinutes;
      session.overtimeAmount = extraFee;
      session.totalAmountPaid = totalFee;
      session.status = 'COMPLETED';
      session.verifiedBy = verifiedBy;
      setItem(STORAGE_KEYS.SESSIONS, sessions);
    }

    // Complete booking and free slot
    booking.actualExitTime = exitNow.toISOString();
    booking.status = 'completed';
    booking.overtimeMinutes = overtimeMinutes;
    booking.overtimeFee = extraFee;

    const allBookings = this.getBookings();
    const bIdx = allBookings.findIndex((b) => b.id === booking.id);
    if (bIdx !== -1) {
      allBookings[bIdx] = booking;
      setItem(STORAGE_KEYS.BOOKINGS, allBookings);
    }

    this.updateSlotStatus(booking.slotId, 'available');

    // Notify user
    this.addNotification({
      userId: booking.userId,
      title: 'Exit Gate Verified - Session Complete',
      message: `Checked out from Slot ${booking.slotNumber}. Total parked duration: ${Math.floor(
        elapsedMinutes / 60
      )}h ${elapsedMinutes % 60}m.${extraFee > 0 ? ` Overtime surcharge: ₹${extraFee}.` : ' Have a safe journey!'}`,
      type: 'session_completed',
      bookingId: booking.id,
    });

    return {
      success: true,
      message: `Exit verified! Slot ${booking.slotNumber} is now released and available.`,
      session,
      booking,
      overtimeMinutes,
      extraFee,
      totalFee,
    };
  },

  // ==========================================
  // SMART PARKING SLOT RECOMMENDATIONS
  // ==========================================
  getSlotRecommendations(
    locationId: string,
    vehicleType: VehicleType = 'car',
    durationHours = 2
  ): SlotRecommendation[] {
    const slots = this.getSlotsByLocation(locationId).filter((s) => s.status === 'available');
    if (slots.length === 0) return [];

    const recommendations: SlotRecommendation[] = slots.map((slot) => {
      let score = 100;
      const reasons: string[] = [];
      const dist = slot.distanceToEntranceMeters || 30;

      // 1. Vehicle match preference
      if (vehicleType === 'ev') {
        if (slot.hasCharging) {
          score += 40;
          reasons.push('Dedicated EV Charging Port included');
        } else {
          score -= 30;
        }
      } else if (vehicleType === 'bike') {
        if (slot.vehicleType === 'bike') {
          score += 35;
          reasons.push('Designated Two-Wheeler bay (budget tariff)');
        }
      } else {
        if (slot.vehicleType === 'car') {
          score += 25;
          reasons.push('Full-size Automobile Bay with ample clearance');
        }
      }

      // 2. Floor convenience
      if (slot.floor.toLowerCase().includes('ground')) {
        score += 30;
        reasons.push('Ground Floor: zero ramps & easiest entry/exit');
      } else if (slot.floor.toLowerCase().includes('1st') || slot.floor.toLowerCase().includes('basement 1')) {
        score += 15;
        reasons.push('Lower tier: fast escalator/lift access');
      }

      // 3. Proximity to entry gate / lift
      if (dist <= 25) {
        score += 25;
        reasons.push(`Just ${dist}m walking distance to campus entrance`);
      } else if (dist <= 50) {
        score += 10;
        reasons.push(`Close to pedestrian walkway (${dist}m)`);
      }

      // 4. Shading & protection
      if (slot.isShaded) {
        score += 15;
        reasons.push('All-weather covered / shaded bay');
      }

      const isBestValue = slot.hourlyRateFirstHour <= 20;

      return {
        slot,
        score,
        reasons,
        distanceToEntrance: dist,
        isBestValue,
        tag:
          score >= 150
            ? 'Top Pick: Highly Recommended'
            : slot.hasCharging
            ? 'Best for EV'
            : dist <= 25
            ? 'Nearest to Entrance'
            : 'Standard Bay',
      };
    });

    return recommendations.sort((a, b) => b.score - a.score);
  },

  // ==========================================
  // VEHICLE ANPR / OCR LOGS
  // ==========================================
  savePlateScan(plateResult: PlateRecognitionResult): void {
    const logs = getItem<PlateRecognitionResult[]>(STORAGE_KEYS.OCR_LOGS, []);
    logs.unshift(plateResult);
    setItem(STORAGE_KEYS.OCR_LOGS, logs.slice(0, 50));
  },

  getPlateScans(): PlateRecognitionResult[] {
    return getItem<PlateRecognitionResult[]>(STORAGE_KEYS.OCR_LOGS, []);
  },

  // Payments
  getPayments(): PaymentRecord[] {
    return getItem<PaymentRecord[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  },

  // Comprehensive Reports & Stats
  getDashboardStats(): DashboardStats {
    const locations = this.getLocations();
    const slots = this.getSlots();
    const bookings = this.getBookings();
    const payments = this.getPayments();
    const sessions = this.getParkingSessions();

    const todayStr = new Date().toISOString().split('T')[0];

    const availableSlots = slots.filter((s) => s.status === 'available').length;
    const occupiedSlots = slots.filter((s) => s.status === 'occupied').length;
    const reservedSlots = slots.filter((s) => s.status === 'reserved').length;
    const maintenanceSlots = slots.filter((s) => s.status === 'maintenance').length;

    const todayBookings = bookings.filter((b) => b.bookingDate === todayStr || b.createdAt.startsWith(todayStr)).length;

    const validPayments = payments.filter((p) => p.status === 'paid');
    const totalRevenue = validPayments.reduce((acc, curr) => acc + curr.amount, 0);

    const todayRevenue = validPayments
      .filter((p) => p.timestamp.startsWith(todayStr))
      .reduce((acc, curr) => acc + curr.amount, 0);

    const activeSessions = sessions.filter((s) => s.status === 'ACTIVE').length;
    const completedSessions = sessions.filter((s) => s.status === 'COMPLETED').length;

    return {
      totalSlots: slots.length,
      availableSlots,
      occupiedSlots,
      reservedSlots,
      maintenanceSlots,
      totalBookings: bookings.length,
      todayBookings,
      totalRevenue,
      todayRevenue,
      totalLocations: locations.length,
      activeSessions,
      completedSessions,
    };
  },
};

// Run initial check
StorageService.init();
