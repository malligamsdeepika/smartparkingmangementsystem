import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  ShieldCheck,
  PlusCircle,
  Trash2,
  Edit2,
  Search,
  Filter,
  Users,
  Car,
  DollarSign,
  TrendingUp,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Building,
  Bike,
  Zap,
  ArrowUpDown,
  QrCode,
  Scan,
  Activity,
  AlertTriangle,
  Bell,
  CheckCheck,
  AlertOctagon,
  UserPlus,
  Receipt,
  CalendarCheck,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Volume2,
  VolumeX
} from 'lucide-react';
import {
  Booking,
  DashboardStats,
  ParkingLocation,
  ParkingSlot,
  ParkingSession,
  PaymentRecord,
  PlateRecognitionResult,
  SlotStatus,
  User,
  VehicleType,
  AdminNotification,
} from '../types';
import { StorageService } from '../utils/storage';
import { ApiService } from '../services/api';
import { RealtimeSync } from '../services/realtimeSync';
import { soundManager } from '../utils/sound';
import { AdminNotificationPanel } from './AdminNotificationPanel';
import { AdminBookingToast, BookingAlertItem } from './AdminBookingToast';

interface AdminDashboardProps {
  locations: ParkingLocation[];
  slots: ParkingSlot[];
  bookings: Booking[];
  users: User[];
  payments: PaymentRecord[];
  stats: DashboardStats;
  onRefreshData: () => void;
  onOpenGateScanner?: () => void;
  currentUser?: User | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  locations,
  slots,
  bookings,
  users,
  payments,
  stats,
  onRefreshData,
  onOpenGateScanner,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'slots' | 'bookings' | 'users' | 'revenue' | 'sessions' | 'notifications'>('overview');

  // Admin Notification State
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [unreadAdminCount, setUnreadAdminCount] = useState<number>(0);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState<boolean>(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [bookingAlerts, setBookingAlerts] = useState<BookingAlertItem[]>([]);
  const dismissedAlertIdsRef = useRef<Set<string>>(new Set<string>());
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(soundManager.isSoundEnabled());
  const [notifPermission, setNotifPermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied'
  );

  // Real-time synced bookings list for instantaneous admin updates
  const [localBookings, setLocalBookings] = useState<Booking[]>(bookings);
  const [isBookingsLoading, setIsBookingsLoading] = useState<boolean>(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  // Fetch bookings directly from shared central cloud database
  const fetchCloudBookings = useCallback(async (quiet = false) => {
    if (!quiet) setIsBookingsLoading(true);
    setBookingsError(null);
    try {
      const res = await ApiService.getAllBookings();
      if (res && res.success && Array.isArray(res.bookings)) {
        setLocalBookings(res.bookings);
        StorageService.setBookingsCache(res.bookings);
      }
    } catch (err: any) {
      console.warn('[AdminDashboard] Fetch bookings error:', err);
      setBookingsError('Could not sync latest bookings from central database');
    } finally {
      if (!quiet) setIsBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    setLocalBookings((prev) => {
      if (!bookings || bookings.length === 0) return prev;
      const map = new Map<string, Booking>();
      [...prev, ...bookings].forEach((b) => {
        if (b?.id) map.set(b.id, b);
      });
      const merged = Array.from(map.values()).sort((a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      if (merged.length === prev.length && merged[0]?.id === prev[0]?.id) return prev;
      return merged;
    });
  }, [bookings]);

  // Real-time synchronization transport & status indicator
  const [realtimeTransport, setRealtimeTransport] = useState<string>(RealtimeSync.getTransport());
  const [realtimeStatus, setRealtimeStatus] = useState<string>(RealtimeSync.getStatus());
  const [connectedDevicesCount, setConnectedDevicesCount] = useState<number>(RealtimeSync.getClientCount());

  // Web Audio API instant chime for incoming notifications
  const playNotificationChime = useCallback(() => {
    soundManager.play('admin');
  }, []);

  // Stable refs for props to avoid effect re-execution cycles
  const currentUserRef = useRef(currentUser);
  const onRefreshDataRef = useRef(onRefreshData);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    onRefreshDataRef.current = onRefreshData;
  }, [onRefreshData]);

  // Notifications Tab Search & Filters
  const [notifSearch, setNotifSearch] = useState('');
  const [notifTypeFilter, setNotifTypeFilter] = useState('all');
  const [notifStatusFilter, setNotifStatusFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Fetch admin notifications from backend API with fallback to storage
  const fetchAdminNotifications = useCallback(async (quiet = false) => {
    if (!quiet) setIsNotificationsLoading(true);
    setNotificationError(null);
    try {
      const adminToken = currentUserRef.current?.id || 'usr-admin';
      const res = await ApiService.getAdminNotifications('all', undefined, adminToken);
      let notifsList: AdminNotification[] = [];
      if (res && res.success && res.notifications) {
        notifsList = res.notifications;
        setAdminNotifications(res.notifications);
        const unread = res.unreadCount ?? res.notifications.filter((n: AdminNotification) => !n.isRead && !n.read).length;
        setUnreadAdminCount(unread);
      } else {
        const local = StorageService.getAdminNotifications();
        notifsList = local;
        setAdminNotifications(local);
        setUnreadAdminCount(local.filter((n) => !n.isRead && !n.read).length);
      }

      // If admin opened Console after bookings occurred, show unread booking alerts immediately
      const unreadBookingNotifs = notifsList.filter(
        (n) => (n.type === 'new_booking' || n.title.toLowerCase().includes('booking')) && !n.isRead && !n.read
      );
      if (unreadBookingNotifs.length > 0) {
        // Deduplicate notifications by bookingId upfront so identical booking alerts are not doubled
        const uniqueNotifsByBooking = new Map<string, (typeof unreadBookingNotifs)[0]>();
        for (const n of unreadBookingNotifs) {
          const groupKey = n.bookingId || n.metadata?.bookingId || n.id;
          if (!uniqueNotifsByBooking.has(groupKey)) {
            uniqueNotifsByBooking.set(groupKey, n);
          }
        }

        const alertsFromUnread: BookingAlertItem[] = Array.from(uniqueNotifsByBooking.values()).map((n) => {
          let user = n.metadata?.userName || 'Driver';
          let vehicle = n.metadata?.vehicleNumber || 'APXX1234';
          let location = n.metadata?.locationName || 'Central Facility';
          let floor = n.metadata?.floor || 'Floor 1';
          let slot = n.metadata?.slotNumber || 'P-101';
          let time = n.metadata?.bookingTime || new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          if (n.message && n.message.includes('|')) {
            const parts = n.message.split('|');
            for (const part of parts) {
              const [k, ...v] = part.split(':');
              const key = k?.trim().toLowerCase();
              const val = v?.join(':').trim();
              if (key === 'user') user = val;
              else if (key === 'vehicle' || key === 'vehicle number') vehicle = val;
              else if (key === 'location') location = val;
              else if (key === 'floor') floor = val;
              else if (key === 'slot') slot = val;
              else if (key === 'booking time') time = val;
            }
          }

          const bId = n.bookingId || n.metadata?.bookingId;
          const uniqueAlertId = `alert-${bId || n.id}-${n.id}`;

          return {
            id: uniqueAlertId,
            notificationId: n.id,
            bookingId: bId,
            userName: user,
            vehicleNumber: vehicle,
            locationName: location,
            floor: floor,
            slotNumber: slot,
            bookingTime: time,
            amount: n.metadata?.amount || 40,
            status: n.metadata?.status || 'Confirmed',
            receivedAt: new Date(n.createdAt),
          };
        });

        setBookingAlerts((prev) => {
          const existingBookingIds = new Set(prev.map((a) => a.bookingId).filter(Boolean));
          const existingNotifIds = new Set(prev.map((a) => a.notificationId).filter(Boolean));
          const existingIds = new Set(prev.map((a) => a.id));

          const newItems: BookingAlertItem[] = [];
          for (const a of alertsFromUnread) {
            if (existingIds.has(a.id) || dismissedAlertIdsRef.current.has(a.id)) continue;
            if (a.bookingId && (existingBookingIds.has(a.bookingId) || dismissedAlertIdsRef.current.has(a.bookingId))) continue;
            if (a.notificationId && (existingNotifIds.has(a.notificationId) || dismissedAlertIdsRef.current.has(a.notificationId))) continue;

            existingIds.add(a.id);
            if (a.bookingId) existingBookingIds.add(a.bookingId);
            if (a.notificationId) existingNotifIds.add(a.notificationId);
            newItems.push(a);
          }

          if (newItems.length === 0) return prev;
          // Play chime and trigger desktop notifications for newly arrived booking alerts
          soundManager.play('admin');
          newItems.forEach((item) => {
            soundManager.showDesktopNotification('🔔 New Parking Booking Received', {
              body: `Bay: ${item.slotNumber} | Vehicle: ${item.vehicleNumber} | User: ${item.userName} | ₹${item.amount}`,
            });
          });
          return [...prev, ...newItems];
        });
      }
    } catch {
      const local = StorageService.getAdminNotifications();
      setAdminNotifications(local);
      setUnreadAdminCount(local.filter((n) => !n.isRead && !n.read).length);
    } finally {
      if (!quiet) setIsNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch of notifications and cloud bookings
    fetchAdminNotifications();
    fetchCloudBookings();

    // Listen to Realtime status & transport changes
    const unsubStatus = RealtimeSync.onStatusChange((status, count, transport) => {
      setRealtimeStatus((prev) => (prev === status ? prev : status));
      setConnectedDevicesCount((prev) => (prev === count ? prev : count));
      setRealtimeTransport((prev) => (prev === transport ? prev : transport));
    });

    // 1. Subscribe to true real-time events (<50ms delivery)
    const unsubscribeRealtime = RealtimeSync.subscribe((event) => {
      // INSTANT ADMIN NOTIFICATION & NEW BOOKING DISPATCH (<1s Delivery)
      if (
        event.eventType === 'NEW_BOOKING' ||
        (event.eventType === 'ADMIN_NOTIFICATION' && event.payload?.notification) ||
        (event.eventType === 'BOOKING_CREATED' && event.payload?.booking)
      ) {
        const incoming: AdminNotification | undefined = event.payload?.notification;
        const newBooking: Booking | undefined = event.payload?.booking;

        const isBookingEvent =
          event.eventType === 'NEW_BOOKING' ||
          incoming?.type === 'new_booking' ||
          event.eventType === 'BOOKING_CREATED';

        if (isBookingEvent) {
          const userName =
            event.payload?.userName ||
            incoming?.metadata?.userName ||
            newBooking?.userName ||
            'Driver';
          const vehicleNumber =
            event.payload?.vehicleNumber ||
            incoming?.metadata?.vehicleNumber ||
            newBooking?.vehicleNumber ||
            'APXX1234';
          const locationName =
            event.payload?.locationName ||
            incoming?.metadata?.locationName ||
            newBooking?.locationName ||
            'Central Facility';
          const floor =
            event.payload?.floor ||
            incoming?.metadata?.floor ||
            newBooking?.floor ||
            'Floor 1';
          const slotNumber =
            event.payload?.slotNumber ||
            incoming?.metadata?.slotNumber ||
            newBooking?.slotNumber ||
            'P-101';
          const bookingTime =
            event.payload?.bookingTime ||
            incoming?.metadata?.bookingTime ||
            newBooking?.entryTime ||
            'Just now';
          const amount =
            event.payload?.amount ||
            incoming?.metadata?.amount ||
            newBooking?.amount ||
            40;
          const status =
            event.payload?.status ||
            incoming?.metadata?.status ||
            newBooking?.status ||
            'Confirmed';
          const bookingId =
            event.payload?.bookingId ||
            incoming?.bookingId ||
            newBooking?.id ||
            `BK-${Date.now()}`;

          console.log('ADMIN: Booking notification received', {
            bookingId,
            user: userName,
            vehicle: vehicleNumber,
            location: locationName,
            floor,
            slot: slotNumber,
            bookingTime,
            status,
          });

          // 1. Play real-time notification audio chime & desktop notification
          playNotificationChime();
          soundManager.showDesktopNotification('🔔 Live Parking Booking Received', {
            body: `Slot: ${slotNumber} | Vehicle: ${vehicleNumber} | User: ${userName} | ₹${amount}`,
          });

          // 2. Push prominent floating real-time toast alert
          const alertId = `alert-${bookingId || incoming?.id || Date.now()}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
          const alertItem: BookingAlertItem = {
            id: alertId,
            notificationId: incoming?.id,
            bookingId,
            userName,
            vehicleNumber,
            locationName,
            floor,
            slotNumber,
            bookingTime,
            amount,
            status,
            receivedAt: new Date(),
          };
          setBookingAlerts((prev) => {
            // Deduplicate if same booking already active
            if (
              prev.some(
                (a) =>
                  a.id === alertId ||
                  (bookingId && a.bookingId === bookingId) ||
                  (incoming?.id && a.notificationId === incoming.id)
              )
            ) {
              return prev;
            }
            return [alertItem, ...prev];
          });

          // 3. Update Admin Notifications history
          if (incoming) {
            setAdminNotifications((prev) => {
              if (prev.some((n) => n.id === incoming.id || (incoming.bookingId && n.bookingId === incoming.bookingId))) {
                return prev;
              }
              return [incoming, ...prev];
            });
          } else {
            const synthNotif: AdminNotification = {
              id: `adm-notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              adminId: 'usr-admin',
              title: 'New Parking Booking Received',
              message: `Location: ${locationName} | Slot: ${slotNumber} | Vehicle: ${vehicleNumber} | User: ${userName} | Booking Time: ${bookingTime} | Status: Confirmed`,
              type: 'new_booking',
              createdAt: new Date().toISOString(),
              isRead: false,
              read: false,
              bookingId,
              relatedEntityId: bookingId,
              metadata: {
                bookingId,
                slotNumber,
                floor,
                locationName,
                vehicleNumber,
                userName,
                bookingTime,
                amount,
                status,
              },
            };
            setAdminNotifications((prev) => [synthNotif, ...prev]);
          }

          // 4. Increase unread badge count
          if (typeof event.payload?.unreadCount === 'number') {
            setUnreadAdminCount(event.payload.unreadCount);
          } else {
            setUnreadAdminCount((prev) => prev + 1);
          }

          // 5. Update local bookings table immediately
          if (newBooking) {
            setLocalBookings((prev) => {
              if (prev.some((b) => b.id === newBooking.id || b.bookingCode === newBooking.bookingCode)) {
                return prev;
              }
              return [newBooking, ...prev];
            });
          } else if (bookingId) {
            fetchCloudBookings(true);
          }
          // Refresh global state across whole application
          try { onRefreshDataRef.current?.(); } catch {}
          return;
        }

        // Generic admin notification (cancellations, payments, capacity alerts)
        if (incoming) {
          setAdminNotifications((prev) => {
            if (prev.some((n) => n.id === incoming.id)) return prev;
            return [incoming, ...prev];
          });
          if (typeof event.payload?.unreadCount === 'number') {
            setUnreadAdminCount(event.payload.unreadCount);
          } else {
            setUnreadAdminCount((prev) => prev + 1);
          }
          playNotificationChime();
          triggerToast(`🔔 ${incoming.title}`);
          try { onRefreshDataRef.current?.(); } catch {}
          return;
        }
      }

      if (event.eventType === 'BOOKING_CANCELLED' && event.payload?.bookingId) {
        setLocalBookings((prev) =>
          prev.map((b) => (b.id === event.payload.bookingId ? { ...b, status: 'cancelled' } : b))
        );
      }

      // Mark single notification read
      if (event.eventType === 'ADMIN_NOTIFICATION_READ' && event.payload?.notificationId) {
        setAdminNotifications((prev) =>
          prev.map((n) => (n.id === event.payload.notificationId ? { ...n, isRead: true, read: true } : n))
        );
        if (typeof event.payload.unreadCount === 'number') {
          setUnreadAdminCount(event.payload.unreadCount);
        } else {
          setUnreadAdminCount((prev) => Math.max(0, prev - 1));
        }
        return;
      }

      // Mark all notifications read
      if (event.eventType === 'ADMIN_ALL_NOTIFICATIONS_READ') {
        setAdminNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })));
        setUnreadAdminCount(0);
        return;
      }

      // If connection was re-established after a drop, synchronize missed notifications and bookings
      if (event.eventType === 'RECONNECTED') {
        fetchAdminNotifications(true);
        fetchCloudBookings(true);
        onRefreshDataRef.current();
        return;
      }

      // For other events (gate entries, slot changes, cancellations), refresh in background
      if (
        event.eventType === 'BOOKING_CREATED' ||
        event.eventType === 'BOOKING_CANCELLED' ||
        event.eventType === 'SLOT_UPDATED' ||
        event.eventType === 'GATE_ENTRY' ||
        event.eventType === 'GATE_EXIT'
      ) {
        fetchAdminNotifications(true);
        fetchCloudBookings(true);
        onRefreshDataRef.current();
      }
    });

    // 2. Window custom events for immediate local synchronization
    const handleSync = () => {
      fetchAdminNotifications(true);
      fetchCloudBookings(true);
    };
    window.addEventListener('smartparking:sync', handleSync);

    // 3. Fallback polling only when real-time connection is down
    const fallbackPollingTimer = setInterval(() => {
      if (RealtimeSync.getStatus() !== 'connected') {
        fetchAdminNotifications(true);
        fetchCloudBookings(true);
      }
    }, 4000);

    // 4. Background reconciliation (every 4s) to guarantee zero dropped alerts and bookings between computers
    const reconciliationTimer = setInterval(() => {
      fetchAdminNotifications(true);
      fetchCloudBookings(true);
    }, 4000);

    return () => {
      unsubStatus();
      unsubscribeRealtime();
      window.removeEventListener('smartparking:sync', handleSync);
      clearInterval(fallbackPollingTimer);
      clearInterval(reconciliationTimer);
    };
  }, [fetchAdminNotifications, playNotificationChime]);

  // Mark single notification as read
  const handleMarkAsRead = async (id: string) => {
    // Optimistic UI update
    setAdminNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true, read: true } : n))
    );
    setUnreadAdminCount((prev) => Math.max(0, prev - 1));

    StorageService.markAdminNotificationAsRead(id);
    await ApiService.markAdminNotificationRead(id, currentUser?.id || 'usr-admin').catch(() => {});
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    setAdminNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, read: true }))
    );
    setUnreadAdminCount(0);

    StorageService.markAllAdminNotificationsAsRead();
    await ApiService.markAllAdminNotificationsRead(currentUser?.id || 'usr-admin').catch(() => {});
  };

  // Delete notification
  const handleDeleteNotification = async (id: string) => {
    const target = adminNotifications.find((n) => n.id === id);
    if (target && !target.isRead && !target.read) {
      setUnreadAdminCount((prev) => Math.max(0, prev - 1));
    }
    setAdminNotifications((prev) => prev.filter((n) => n.id !== id));

    StorageService.deleteAdminNotification(id);
    await ApiService.deleteAdminNotification(id, currentUser?.id || 'usr-admin').catch(() => {});
  };

  // Trigger test system alert
  const handleTriggerTestAlert = async (type: 'booking' | 'capacity' | 'system') => {
    if (type === 'booking') {
      const sampleSlot = slots.find((s) => s.status === 'available') || slots[0] || { slotNumber: 'P-101', floor: 'Ground Floor' };
      const sampleLoc = locations[0] || { name: 'Metro City Center Plaza', id: 'loc-1' };
      const testVehicle = `AP-${Math.floor(10 + Math.random() * 89)}-TX-${Math.floor(1000 + Math.random() * 9000)}`;
      const testUser = 'Rahul Sharma (Test)';
      const testBookingId = `BK-${Date.now().toString().slice(-5)}`;

      // 1. Play alert chime
      soundManager.play('admin');

      // 2. Desktop notification
      soundManager.showDesktopNotification('🔔 New Parking Booking Received', {
        body: `Bay: ${sampleSlot.slotNumber} | Vehicle: ${testVehicle} | Driver: ${testUser} | ₹40.00`,
      });

      // 3. Floating toast item
      const alertItem: BookingAlertItem = {
        id: `alert-${testBookingId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        bookingId: testBookingId,
        userName: testUser,
        vehicleNumber: testVehicle,
        locationName: sampleLoc.name,
        floor: sampleSlot.floor || 'Ground Floor',
        slotNumber: sampleSlot.slotNumber,
        bookingTime: 'Just now',
        amount: 40,
        status: 'Confirmed',
        receivedAt: new Date(),
      };

      setBookingAlerts((prev) => [alertItem, ...prev]);

      // 4. Save to Admin Notifications
      StorageService.addAdminNotification({
        title: 'New Parking Booking Received',
        message: `User: ${testUser} | Vehicle Number: ${testVehicle} | Location: ${sampleLoc.name} | Floor: ${sampleSlot.floor || 'Ground Floor'} | Slot: ${sampleSlot.slotNumber} | Booking Time: Just now`,
        type: 'new_booking',
        relatedEntityId: testBookingId,
        metadata: {
          bookingId: testBookingId,
          slotNumber: sampleSlot.slotNumber,
          floor: sampleSlot.floor || 'Ground Floor',
          locationName: sampleLoc.name,
          vehicleNumber: testVehicle,
          userName: testUser,
          bookingTime: 'Just now',
          amount: 40,
          status: 'Confirmed',
        },
      });

      // 5. Broadcast to other connected devices
      try {
        await RealtimeSync.broadcast('NEW_BOOKING', {
          bookingId: testBookingId,
          userName: testUser,
          vehicleNumber: testVehicle,
          locationName: sampleLoc.name,
          floor: sampleSlot.floor || 'Ground Floor',
          slotNumber: sampleSlot.slotNumber,
          bookingTime: 'Just now',
          amount: 40,
          status: 'Confirmed',
        });
      } catch {}

      triggerToast(`🔔 Test booking alert generated for ${testVehicle}!`);
      fetchAdminNotifications(true);
      return;
    }

    if (type === 'capacity') {
      const loc = locations[0] || { name: 'Metro City Center Plaza', id: 'loc-1' };
      StorageService.addAdminNotification({
        title: `Parking Capacity Alert: ${loc.name} at 100%`,
        message: `${loc.name} has reached critical peak capacity. All standard parking bays are currently occupied.`,
        type: 'capacity_alert',
        relatedEntityId: loc.id,
        metadata: {
          locationId: loc.id,
          locationName: loc.name,
          capacityPercentage: 100,
        },
      });
      triggerToast('Generated test parking capacity alert.');
    } else {
      StorageService.addAdminNotification({
        title: 'System Alert: Gate Barrier Sensor Offline',
        message: 'Operational Notice: Sensor Terminal A2 reported high latency. Switched to automated backup scanning.',
        type: 'system_alert',
        relatedEntityId: 'sys-sensor-02',
        metadata: {
          severity: 'warning',
          subsystem: 'Gate Controller',
        },
      });
      triggerToast('Generated test system alert.');
    }
    fetchAdminNotifications();
  };

  // Slot Management Form Modal state
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [newSlotNumber, setNewSlotNumber] = useState('');
  const [newSlotFloor, setNewSlotFloor] = useState('Ground Floor');
  const [newSlotLocationId, setNewSlotLocationId] = useState(locations[0]?.id || '');
  const [newSlotVehicleType, setNewSlotVehicleType] = useState<VehicleType>('car');
  const [newSlotHasCharging, setNewSlotHasCharging] = useState(false);

  // Search & Filters for Bookings
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('all');

  // Search & Filters for Slots
  const [slotLocationFilter, setSlotLocationFilter] = useState<string>('all');
  const [slotStatusFilter, setSlotStatusFilter] = useState<string>('all');

  // Notification feedback
  const [toastMsg, setToastMsg] = useState('');

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Add Slot Handler
  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotNumber.trim()) {
      alert('Please provide a slot number (e.g. G-15, F2-08).');
      return;
    }

    StorageService.addSlot({
      locationId: newSlotLocationId,
      slotNumber: newSlotNumber.trim().toUpperCase(),
      floor: newSlotFloor,
      vehicleType: newSlotVehicleType,
      status: 'available',
      hourlyRateFirstHour: 20,
      hourlyRateAdditional: 10,
      hasCharging: newSlotHasCharging,
    });

    triggerToast(`Added new parking slot ${newSlotNumber.toUpperCase()} successfully!`);
    setNewSlotNumber('');
    setShowAddSlotModal(false);
    onRefreshData();
  };

  // Delete Slot Handler
  const handleDeleteSlot = (slotId: string, slotNum: string) => {
    if (confirm(`Are you sure you want to remove Slot ${slotNum}?`)) {
      const ok = StorageService.deleteSlot(slotId);
      if (ok) {
        triggerToast(`Slot ${slotNum} removed from system.`);
        onRefreshData();
      }
    }
  };

  // Update Slot Status directly
  const handleUpdateStatus = (slotId: string, status: SlotStatus) => {
    StorageService.updateSlotStatus(slotId, status);
    triggerToast(`Slot status changed to ${status.toUpperCase()}.`);
    onRefreshData();
  };

  // Filtered Bookings (synced in real-time)
  const filteredBookings = useMemo(() => {
    return localBookings.filter((b) => {
      const matchSearch =
        !bookingSearch.trim() ||
        b.id.toLowerCase().includes(bookingSearch.toLowerCase().trim()) ||
        b.slotNumber.toLowerCase().includes(bookingSearch.toLowerCase().trim()) ||
        b.vehicleNumber.toLowerCase().includes(bookingSearch.toLowerCase().trim()) ||
        b.userName.toLowerCase().includes(bookingSearch.toLowerCase().trim());
      const matchStatus = bookingStatusFilter === 'all' || b.status === bookingStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [localBookings, bookingSearch, bookingStatusFilter]);

  // Filtered Slots
  const filteredSlots = useMemo(() => {
    return slots.filter((s) => {
      const matchLoc = slotLocationFilter === 'all' || s.locationId === slotLocationFilter;
      const matchStatus = slotStatusFilter === 'all' || s.status === slotStatusFilter;
      return matchLoc && matchStatus;
    });
  }, [slots, slotLocationFilter, slotStatusFilter]);

  // Filtered Admin Notifications
  const filteredAdminNotifications = useMemo(() => {
    return adminNotifications.filter((n) => {
      const matchSearch =
        !notifSearch.trim() ||
        n.title.toLowerCase().includes(notifSearch.toLowerCase().trim()) ||
        n.message.toLowerCase().includes(notifSearch.toLowerCase().trim()) ||
        (n.relatedEntityId && n.relatedEntityId.toLowerCase().includes(notifSearch.toLowerCase().trim()));
      const matchType = notifTypeFilter === 'all' || n.type === notifTypeFilter;
      const matchStatus =
        notifStatusFilter === 'all'
          ? true
          : notifStatusFilter === 'unread'
          ? !n.isRead && !n.read
          : n.isRead || n.read;
      return matchSearch && matchType && matchStatus;
    });
  }, [adminNotifications, notifSearch, notifTypeFilter, notifStatusFilter]);

  // Export CSV summary report
  const handleExportCSV = () => {
    const csvRows = [
      ['Booking ID', 'User Name', 'Phone', 'Facility', 'Slot', 'Vehicle No', 'Type', 'Date', 'Entry', 'Exit', 'Amount', 'Status'],
      ...bookings.map((b) => [
        b.id,
        b.userName,
        b.userPhone,
        b.locationName,
        b.slotNumber,
        b.vehicleNumber,
        b.vehicleType,
        b.bookingDate,
        b.entryTime,
        b.exitTime,
        `₹${b.amount}`,
        b.status,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smart_parking_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Report exported as CSV file successfully!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Top Header */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-amber-300 text-xs font-semibold border border-slate-700">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Administrator Control Center</span>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
              realtimeStatus === 'connected'
                ? realtimeTransport === 'websocket'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                  : 'bg-teal-950/80 text-teal-300 border-teal-700/60'
                : 'bg-amber-950/80 text-amber-300 border-amber-700/60'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${realtimeStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span>
                {realtimeStatus === 'connected'
                  ? realtimeTransport === 'websocket'
                    ? `Live WebSocket (<20ms · ${connectedDevicesCount} dev)`
                    : `Live SSE (<80ms · ${connectedDevicesCount} dev)`
                  : 'Reconnecting...'}
              </span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Smart Parking Admin Panel</h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Monitor real-time bay occupancy, add/remove physical slots, supervise user reservations, and track revenue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Test Booking Alert Button */}
          <button
            onClick={() => handleTriggerTestAlert('booking')}
            className="px-3.5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
            title="Simulate slot booking notification with chime sound"
          >
            <Bell className="w-4 h-4 fill-slate-950" />
            <span>Test Alert Notification</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              const next = !isSoundEnabled;
              soundManager.setSoundEnabled(next);
              setIsSoundEnabled(next);
              if (next) soundManager.play('admin');
            }}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              isSoundEnabled
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/80 hover:bg-emerald-900/80'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
            title={isSoundEnabled ? 'Alert chimes active - click to mute' : 'Alert chimes muted - click to enable sound'}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            <span className="hidden sm:inline">{isSoundEnabled ? 'Sound ON' : 'Muted'}</span>
          </button>

          {/* Enable Browser Alerts if not granted */}
          {notifPermission !== 'granted' && (
            <button
              onClick={async () => {
                const p = await soundManager.requestNotificationPermission();
                setNotifPermission(p);
                if (p === 'granted') {
                  soundManager.showDesktopNotification('Desktop Notifications Enabled!', {
                    body: 'You will receive instant alerts on this laptop whenever a booking is created.',
                  });
                  triggerToast('Desktop browser notifications enabled!');
                }
              }}
              className="px-3 py-2.5 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold border border-indigo-500 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Enable OS/browser popup notifications"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Enable Browser Alerts</span>
            </button>
          )}

          {/* Admin Notification Bell with red unread badge */}
          <button
            id="admin-header-notification-bell"
            onClick={() => setIsNotificationPanelOpen(true)}
            className="relative px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs hover:text-white"
            title={`Administrator Alerts (${unreadAdminCount} unread)`}
          >
            <Bell className={`w-4 h-4 ${unreadAdminCount > 0 ? 'text-amber-300' : 'text-slate-300'}`} />
            <span>Alerts</span>
            {unreadAdminCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-pulse">
                {unreadAdminCount > 99 ? '99+' : unreadAdminCount}
              </span>
            )}
          </button>

          {onOpenGateScanner && (
            <button
              onClick={onOpenGateScanner}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-emerald-200" />
              <span>Gate QR Scanner</span>
            </button>
          )}

          <button
            onClick={() => setShowAddSlotModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Slot</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-300" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              onRefreshData();
              fetchAdminNotifications();
              triggerToast('System data & notifications re-synced.');
            }}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
            title="Refresh Data & Alerts"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Persistent High-Visibility Real-Time Booking Alert Banner */}
      {(() => {
        const unreadBookings = adminNotifications.filter(
          (n) => (n.type === 'new_booking' || n.title.toLowerCase().includes('booking')) && !n.isRead && !n.read
        );
        if (unreadBookings.length === 0) return null;
        const latest = unreadBookings[0];
        return (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 via-slate-900 to-indigo-950 text-white rounded-2xl border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-3">
            <div className="flex items-start gap-3.5">
              <div className="relative shrink-0">
                <span className="absolute -inset-1 rounded-xl bg-emerald-400/40 animate-ping"></span>
                <div className="relative w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md">
                  <Bell className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm text-emerald-300 tracking-wide uppercase">
                    🔔 Live Booking Alert Received
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-extrabold border border-emerald-400/40">
                    {unreadBookings.length} Unacknowledged
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(latest.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-medium leading-relaxed max-w-3xl">
                  {latest.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <button
                onClick={() => {
                  setActiveTab('bookings');
                  if (latest.bookingId) setBookingSearch(latest.bookingId);
                }}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <span>View in Bookings</span>
                <Clock className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleMarkAsRead(latest.id)}
                className="px-3 py-2 rounded-xl bg-emerald-700/60 hover:bg-emerald-600/70 border border-emerald-500/60 text-emerald-100 text-xs font-semibold transition-all cursor-pointer"
              >
                <span>Acknowledge</span>
              </button>
              <button
                onClick={() => setIsNotificationPanelOpen(true)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              >
                <span>All Alerts</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* Navigation Tabs for Admin */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Overview & Reports', icon: TrendingUp },
          { id: 'slots', label: `Manage Slots (${slots.length})`, icon: Car },
          { id: 'bookings', label: `All Bookings (${localBookings.length})`, icon: Clock },
          { id: 'sessions', label: `Gate Sessions & ANPR (${StorageService.getParkingSessions().length})`, icon: QrCode },
          { id: 'users', label: `Registered Users (${users.length})`, icon: Users },
          { id: 'revenue', label: 'Revenue Analytics', icon: DollarSign },
          {
            id: 'notifications',
            label: `Admin Notifications ${unreadAdminCount > 0 ? `(${unreadAdminCount} new)` : `(${adminNotifications.length})`}`,
            icon: Bell,
            badge: unreadAdminCount,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && tab.badge > 0 && !isActive ? (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & REPORTS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Live Recent Booking Alert Banner */}
          {adminNotifications.some((n) => (n.type === 'new_booking' || n.title.toLowerCase().includes('booking')) && !n.isRead && !n.read) && (
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white p-4 sm:p-5 rounded-2xl shadow-lg border border-emerald-400/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-emerald-100 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm sm:text-base tracking-tight">
                      🔔 Live Slot Booking Received
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white text-emerald-800">
                      New
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    {adminNotifications.find((n) => (n.type === 'new_booking' || n.title.toLowerCase().includes('booking')) && !n.isRead && !n.read)?.message}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  onClick={() => {
                    setActiveTab('bookings');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white text-emerald-800 font-bold text-xs hover:bg-emerald-50 transition-colors shadow-xs cursor-pointer"
                >
                  View in Bookings
                </button>
                <button
                  onClick={() => {
                    const firstUnread = adminNotifications.find((n) => (n.type === 'new_booking' || n.title.toLowerCase().includes('booking')) && !n.isRead && !n.read);
                    if (firstUnread) handleMarkAsRead(firstUnread.id);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  Acknowledge
                </button>
              </div>
            </div>
          )}

          {/* Key Metric KPI Cards (Requirement 10: Reports) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Slots</span>
              <p className="text-3xl font-black text-slate-900 mt-1">{stats.totalSlots}</p>
              <p className="text-xs text-slate-400 mt-1">Available: {stats.availableSlots}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase">Available Slots</span>
              <p className="text-3xl font-black text-emerald-700 mt-1">{stats.availableSlots}</p>
              <p className="text-xs text-emerald-600 mt-1">
                {Math.round((stats.availableSlots / Math.max(1, stats.totalSlots)) * 100)}% capacity free
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs">
              <span className="text-[11px] font-semibold text-rose-700 uppercase">Occupied Slots</span>
              <p className="text-3xl font-black text-rose-700 mt-1">{stats.occupiedSlots}</p>
              <p className="text-xs text-rose-600 mt-1">Reserved: {stats.reservedSlots}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs">
              <span className="text-[11px] font-semibold text-blue-700 uppercase">Total Revenue</span>
              <p className="text-3xl font-black text-blue-700 mt-1">₹{stats.totalRevenue}</p>
              <p className="text-xs text-blue-600 mt-1">Today: ₹{stats.todayRevenue}</p>
            </div>
          </div>

          {/* Secondary KPI Row: Locations, Active Gate Sessions, Completed */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Parking Locations</span>
                <p className="text-xl font-bold text-slate-900">{stats.totalLocations || locations.length} Facilities Active</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Active Gate Sessions</span>
                <p className="text-xl font-bold text-emerald-700">{stats.activeSessions || 0} Parked Inside</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Completed Sessions</span>
                <p className="text-xl font-bold text-indigo-700">{stats.completedSessions || 0} Exited & Verified</p>
              </div>
            </div>
          </div>

          {/* Quick Statistics Breakdown & Location Utilization */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-base">Location Capacity Breakdown</h3>
              <div className="space-y-3">
                {locations.map((loc) => {
                  const locSlots = slots.filter((s) => s.locationId === loc.id);
                  const occ = locSlots.filter((s) => s.status === 'occupied' || s.status === 'reserved').length;
                  const total = locSlots.length;
                  const pct = total > 0 ? Math.round((occ / total) * 100) : 0;

                  return (
                    <div key={loc.id} className="p-3.5 bg-slate-50 rounded-xl space-y-2 border border-slate-200/60">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-800">{loc.name}</span>
                        <span className="text-slate-600">
                          {occ}/{total} Occupied ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-base">Booking Summary Statistics</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">All-Time Bookings:</span>
                  <span className="font-bold text-slate-900">{stats.totalBookings}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Today's Bookings:</span>
                  <span className="font-bold text-blue-700">{stats.todayBookings}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Active / In-Parking:</span>
                  <span className="font-bold text-emerald-700">
                    {bookings.filter((b) => b.status === 'confirmed' || b.status === 'active').length}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Total Registered Users:</span>
                  <span className="font-bold text-slate-900">{users.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SLOT AVAILABILITY & EXPECTED LEAVING TIME ENGINE */}
      {activeTab === 'slots' && (
        <div className="space-y-6">
          {/* Header & Feature Description */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Clock className="w-5 h-5" />
                </span>
                <h2 className="text-xl font-bold text-slate-900">Slot Availability & Expected Leaving Time Engine</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Real-time tracking of vehicle occupancy, actual gate entry, expected departure, early exit handling, and next available prediction.
              </p>
            </div>

            <button
              onClick={() => setShowAddSlotModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Parking Slot</span>
            </button>
          </div>

          {/* Filter Bar with Status Pills */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Quick Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter:</span>
                </span>
                {[
                  { id: 'all', label: 'All Slots', count: slots.length, color: 'bg-slate-100 text-slate-700' },
                  { id: 'available', label: 'Available', count: slots.filter((s) => s.status === 'available').length, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                  { id: 'occupied', label: 'Occupied', count: slots.filter((s) => s.status === 'occupied').length, color: 'bg-rose-50 text-rose-800 border-rose-200' },
                  { id: 'reserved', label: 'Reserved', count: slots.filter((s) => s.status === 'reserved').length, color: 'bg-amber-50 text-amber-800 border-amber-200' },
                  { id: 'maintenance', label: 'Maintenance', count: slots.filter((s) => s.status === 'maintenance').length, color: 'bg-slate-100 text-slate-700 border-slate-300' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSlotStatusFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                      slotStatusFilter === f.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : `${f.color} hover:bg-slate-200`
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${slotStatusFilter === f.id ? 'bg-blue-500 text-white' : 'bg-white/80'}`}>
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Location Selector */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-500">Location:</span>
                <select
                  value={slotLocationFilter}
                  onChange={(e) => setSlotLocationFilter(e.target.value)}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Facilities ({locations.length})</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Slots Table with the exact requested columns */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider text-[11px]">
                  <tr>
                    <th className="p-4">Slot Number</th>
                    <th className="p-4">Current Status</th>
                    <th className="p-4">Current Vehicle</th>
                    <th className="p-4">Entry Time</th>
                    <th className="p-4">Expected Exit</th>
                    <th className="p-4">Actual Exit</th>
                    <th className="p-4">Next Available Time</th>
                    <th className="p-4 text-right">Actions / Release</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredSlots.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No parking slots match the selected status filter.
                      </td>
                    </tr>
                  ) : (
                    filteredSlots.map((slot) => {
                      const isOccupied = slot.status === 'occupied';
                      const isReserved = slot.status === 'reserved';
                      const isAvailable = slot.status === 'available';

                      return (
                        <tr key={slot.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Slot Number */}
                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-sm text-slate-900">
                                {slot.slotNumber}
                              </span>
                              {slot.hasCharging && (
                                <span className="p-0.5 rounded bg-emerald-100 text-emerald-700" title="EV Bay">
                                  <Zap className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">{slot.floor}</span>
                          </td>

                          {/* Current Status */}
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                isAvailable
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : isOccupied
                                  ? slot.isOvertime
                                    ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                                    : 'bg-rose-100 text-rose-800 border-rose-300'
                                  : isReserved
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-slate-200 text-slate-700 border-slate-300'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isAvailable ? 'bg-emerald-600' : isOccupied ? 'bg-rose-600' : isReserved ? 'bg-amber-600' : 'bg-slate-500'
                                }`}
                              ></span>
                              <span>{slot.status}</span>
                            </span>
                            {slot.isOvertime && (
                              <p className="text-[10px] font-bold text-rose-600 mt-0.5">⚠️ Overtime (+₹{slot.overtimeFee})</p>
                            )}
                          </td>

                          {/* Current Vehicle */}
                          <td className="p-4">
                            {slot.currentVehicleNumber ? (
                              <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                                {slot.currentVehicleNumber}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Entry Time */}
                          <td className="p-4">
                            {slot.entryTime ? (
                              <span className="font-semibold text-slate-800">{slot.entryTime}</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Expected Exit */}
                          <td className="p-4">
                            {slot.expectedLeavingTime ? (
                              <div>
                                <span className="font-bold text-slate-900">{slot.expectedLeavingTime}</span>
                                {slot.bookedDurationHours && (
                                  <span className="text-[10px] text-slate-400 block">({slot.bookedDurationHours}h booked)</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Actual Exit */}
                          <td className="p-4">
                            {slot.actualExitTime ? (
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {slot.actualExitTime}
                              </span>
                            ) : isOccupied ? (
                              <span className="text-amber-700 text-[11px] font-medium bg-amber-50 px-1.5 py-0.5 rounded">
                                Active in Bay
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Next Available Time */}
                          <td className="p-4">
                            {isAvailable ? (
                              <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                Available now
                              </span>
                            ) : (
                              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {slot.availableFrom}
                              </span>
                            )}
                          </td>

                          {/* Actions / Release */}
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Early Exit Trigger for Occupied Slot */}
                              {isOccupied && (
                                <button
                                  onClick={() => {
                                    const res = StorageService.releaseSlotEarly(slot.id);
                                    triggerToast(res.message);
                                    onRefreshData();
                                  }}
                                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                                  title="Check out vehicle & release bay immediately (Available From: Now)"
                                >
                                  Early Exit
                                </button>
                              )}

                              {/* Quick status dropdown */}
                              <select
                                value={slot.status}
                                onChange={(e) => handleUpdateStatus(slot.id, e.target.value as SlotStatus)}
                                className="bg-slate-100 border border-slate-200 rounded-lg p-1 text-[11px] font-semibold text-slate-800 cursor-pointer"
                              >
                                <option value="available">Available</option>
                                <option value="occupied">Occupied</option>
                                <option value="reserved">Reserved</option>
                                <option value="maintenance">Maintenance</option>
                              </select>

                              {/* Delete slot */}
                              <button
                                onClick={() => handleDeleteSlot(slot.id, slot.slotNumber)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Remove Slot"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ALL BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                placeholder="Search by ID, plate, user or slot..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
              />
            </div>

            <select
              value={bookingStatusFilter}
              onChange={(e) => setBookingStatusFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed / Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="p-4">Booking ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Slot & Facility</th>
                    <th className="p-4">Vehicle Plate</th>
                    <th className="p-4">Timing</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4 font-mono font-bold text-blue-700">#{b.id}</td>
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{b.userName}</p>
                        <p className="text-[11px] text-slate-400">{b.userPhone}</p>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-800">{b.slotNumber}</span>
                        <p className="text-[11px] text-slate-400">{b.locationName}</p>
                      </td>
                      <td className="p-4 font-mono font-bold uppercase">{b.vehicleNumber}</td>
                      <td className="p-4">
                        <p className="font-medium text-slate-800">{b.bookingDate}</p>
                        <p className="text-[11px] text-slate-400">
                          {b.entryTime} - {b.exitTime}
                        </p>
                      </td>
                      <td className="p-4 font-extrabold text-blue-700">₹{b.amount}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            b.status === 'confirmed' || b.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : b.status === 'completed'
                              ? 'bg-slate-100 text-slate-700 border-slate-200'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {(b.status === 'confirmed' || b.status === 'active') && (
                          <button
                            onClick={() => {
                              StorageService.completeBooking(b.id);
                              triggerToast(`Booking #${b.id} marked as completed.`);
                              onRefreshData();
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold cursor-pointer"
                          >
                            Mark Completed
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REGISTERED USERS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">System Users & Driver Directory</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="p-4">User Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Total Reservations</th>
                  <th className="p-4">Member Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const userBookingCount = bookings.filter((b) => b.userId === u.id || b.userEmail === u.email).length;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="p-4 font-bold text-slate-900">{u.name}</td>
                      <td className="p-4 text-slate-600">{u.email}</td>
                      <td className="p-4 font-mono text-slate-600">{u.phone}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-blue-700">{userBookingCount} bookings</td>
                      <td className="p-4 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: REVENUE ANALYTICS */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-400 uppercase font-semibold">Total Revenue Collected</span>
              <p className="text-3xl font-black text-blue-600 mt-1">₹{stats.totalRevenue}</p>
              <p className="text-xs text-slate-500 mt-1">From {payments.length} verified transactions</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-400 uppercase font-semibold">Average Fee / Booking</span>
              <p className="text-3xl font-black text-slate-900 mt-1">
                ₹{payments.length > 0 ? Math.round(stats.totalRevenue / payments.length) : 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">Based on standard ₹20 + ₹10 tariff</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-400 uppercase font-semibold">Today's Collections</span>
              <p className="text-3xl font-black text-emerald-600 mt-1">₹{stats.todayRevenue}</p>
              <p className="text-xs text-slate-500 mt-1">Instant gate settlements</p>
            </div>
          </div>

          {/* Payment Transactions Log */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Payment Transaction Ledger</h3>
              <button
                onClick={handleExportCSV}
                className="text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                Export Ledger
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="p-4">Transaction Ref</th>
                    <th className="p-4">Booking Ref</th>
                    <th className="p-4">User</th>
                    <th className="p-4">Payment Method</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="p-4 font-mono font-bold text-slate-800">{p.transactionRef}</td>
                      <td className="p-4 font-mono text-blue-700 font-semibold">#{p.bookingId}</td>
                      <td className="p-4 font-medium text-slate-900">{p.userName}</td>
                      <td className="p-4 text-slate-600">{p.paymentMethod}</td>
                      <td className="p-4 font-extrabold text-blue-700">₹{p.amount}</td>
                      <td className="p-4 text-slate-500">{new Date(p.timestamp).toLocaleString()}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: GATE SESSIONS & ANPR AUDIT */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <QrCode className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-bold text-slate-900">QR Gate Sessions & ANPR Audit Log</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Real-time tracking of vehicles physically present inside campus bays, boom barrier operations, and automated plate scans.
              </p>
            </div>

            {onOpenGateScanner && (
              <button
                onClick={onOpenGateScanner}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <QrCode className="w-4 h-4" />
                <span>Open Barrier Scanner Terminal</span>
              </button>
            )}
          </div>

          {/* Active / In-Facility Gate Sessions Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-sm text-slate-900">Live Parking Sessions (In-Facility)</h4>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                {StorageService.getParkingSessions().filter((s) => s.status === 'ACTIVE').length} Vehicles Parked Inside
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="p-4">Session ID</th>
                    <th className="p-4">Vehicle Number</th>
                    <th className="p-4">Facility & Bay</th>
                    <th className="p-4">Entry Timestamp</th>
                    <th className="p-4">Planned Duration</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Gate Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {StorageService.getParkingSessions().length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No gate sessions logged yet. Check in vehicles using the QR Gate Scanner Terminal.
                      </td>
                    </tr>
                  ) : (
                    StorageService.getParkingSessions().map((sess) => {
                      const isActive = sess.status === 'ACTIVE';
                      const locName = sess.locationName || locations.find((l) => l.id === sess.locationId)?.name || 'Campus Garage';
                      const entryFormatted = sess.entryTime
                        ? new Date(sess.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Active';
                      const durationDisplay = sess.plannedDurationHours || sess.durationHours || 2;
                      return (
                        <tr key={sess.id} className="hover:bg-slate-50/70">
                          <td className="p-4 font-mono font-bold text-blue-700">#{sess.id}</td>
                          <td className="p-4 font-mono font-black text-slate-900">{sess.vehicleNumber}</td>
                          <td className="p-4">
                            <span className="font-bold text-slate-800">{sess.slotNumber}</span>
                            <span className="text-slate-400 block text-[10px]">{locName}</span>
                          </td>
                          <td className="p-4 text-slate-600">{entryFormatted}</td>
                          <td className="p-4 text-slate-600">{durationDisplay} Hours</td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {isActive ? '● In Facility' : 'Completed'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {isActive && (
                              <button
                                onClick={() => {
                                  const res = StorageService.verifyGateCheckOut(sess.bookingId);
                                  triggerToast(res.message);
                                  onRefreshData();
                                }}
                                className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] font-bold border border-rose-200 transition-colors cursor-pointer"
                              >
                                Trigger Exit Gate
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ANPR Vehicle Plate OCR Audit Log */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scan className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-sm text-slate-900">Vehicle Number Plate Recognition (ANPR / OCR) Logs</h4>
              </div>
              <span className="text-xs text-slate-500">
                {StorageService.getPlateScans().length} OCR Scans Performed
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Recognized Plate</th>
                    <th className="p-4">State RTO</th>
                    <th className="p-4">Vehicle Category</th>
                    <th className="p-4">OCR Confidence</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {StorageService.getPlateScans().length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No license plate scans recorded yet. Use the ANPR scanner in the booking form.
                      </td>
                    </tr>
                  ) : (
                    StorageService.getPlateScans().map((scan, idx) => (
                      <tr key={scan.id || `${scan.plateNumber}-${idx}`} className="hover:bg-slate-50/70">
                        <td className="p-4 text-slate-500">
                          {scan.timestamp ? new Date(scan.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
                        </td>
                        <td className="p-4 font-mono font-black text-slate-900 tracking-wider">
                          {scan.plateNumber}
                        </td>
                        <td className="p-4 font-semibold text-slate-700">{scan.state}</td>
                        <td className="p-4 uppercase text-slate-600 font-medium">{scan.vehicleTypeGuess}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                            {scan.confidence}%
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                            Verified
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: ADMIN NOTIFICATIONS & SYSTEM EVENT AUDIT */}
      {activeTab === 'notifications' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Notification KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Alerts</span>
              <p className="text-3xl font-black text-slate-900 mt-1">{adminNotifications.length}</p>
              <p className="text-xs text-slate-400 mt-1">Logged event history</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs">
              <span className="text-[11px] font-semibold text-rose-700 uppercase">Unread Alerts</span>
              <p className="text-3xl font-black text-rose-700 mt-1">{unreadAdminCount}</p>
              <p className="text-xs text-rose-600 mt-1">Pending admin review</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase">Booking Events</span>
              <p className="text-3xl font-black text-emerald-700 mt-1">
                {adminNotifications.filter((n) => n.type === 'new_booking' || n.type === 'booking_cancellation').length}
              </p>
              <p className="text-xs text-emerald-600 mt-1">Reservations & cancellations</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs">
              <span className="text-[11px] font-semibold text-amber-700 uppercase">System & Capacity</span>
              <p className="text-3xl font-black text-amber-700 mt-1">
                {adminNotifications.filter((n) => n.type === 'capacity_alert' || n.type === 'system_alert').length}
              </p>
              <p className="text-xs text-amber-600 mt-1">Operational issues</p>
            </div>
          </div>

          {/* Notification Action Controls & Filter Toolbar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 max-w-md relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={notifSearch}
                  onChange={(e) => setNotifSearch(e.target.value)}
                  placeholder="Search notifications by title, booking ID, slot, vehicle..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={notifTypeFilter}
                  onChange={(e) => setNotifTypeFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Event Types</option>
                  <option value="new_booking">New Bookings</option>
                  <option value="booking_cancellation">Cancellations</option>
                  <option value="payment_update">Payment Updates</option>
                  <option value="slot_update">Slot Updates</option>
                  <option value="capacity_alert">Capacity Alerts</option>
                  <option value="user_registration">User Registrations</option>
                  <option value="system_alert">System Alerts</option>
                </select>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setNotifStatusFilter('all')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      notifStatusFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setNotifStatusFilter('unread')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      notifStatusFilter === 'unread'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Unread ({unreadAdminCount})
                  </button>
                  <button
                    onClick={() => setNotifStatusFilter('read')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      notifStatusFilter === 'read'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Read
                  </button>
                </div>

                {unreadAdminCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark All Read</span>
                  </button>
                )}

                <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                  <button
                    onClick={() => handleTriggerTestAlert('capacity')}
                    className="px-2.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    title="Simulate a parking capacity alert"
                  >
                    Test Capacity Alert
                  </button>
                  <button
                    onClick={() => handleTriggerTestAlert('system')}
                    className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    title="Simulate a system error alert"
                  >
                    Test System Alert
                  </button>
                </div>
              </div>
            </div>

            {/* Notification Cards List */}
            <div className="space-y-3 pt-2">
              {filteredAdminNotifications.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <Bell className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">No matching notifications found</p>
                  <p className="text-xs text-slate-500">
                    Try adjusting your search query or filters. New event notifications will appear here in real-time.
                  </p>
                </div>
              ) : (
                filteredAdminNotifications.map((notif) => {
                  const isUnread = !notif.isRead && !notif.read;
                  return (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-2xl border transition-all relative ${
                        isUnread
                          ? 'bg-blue-50/70 border-blue-200 text-slate-900 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1 p-2 rounded-xl bg-white shadow-xs border border-slate-200 shrink-0">
                            {notif.type === 'new_booking' && <CalendarCheck className="w-4 h-4 text-emerald-600" />}
                            {notif.type === 'booking_cancellation' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                            {(notif.type === 'payment_update' || notif.type === 'payment_success') && <Receipt className="w-4 h-4 text-blue-600" />}
                            {notif.type === 'slot_update' && <Car className="w-4 h-4 text-indigo-600" />}
                            {notif.type === 'user_registration' && <UserPlus className="w-4 h-4 text-purple-600" />}
                            {notif.type === 'capacity_alert' && <AlertOctagon className="w-4 h-4 text-rose-600" />}
                            {notif.type === 'system_alert' && <ShieldAlert className="w-4 h-4 text-red-600" />}
                            {notif.type !== 'new_booking' &&
                              notif.type !== 'booking_cancellation' &&
                              notif.type !== 'payment_update' &&
                              notif.type !== 'payment_success' &&
                              notif.type !== 'slot_update' &&
                              notif.type !== 'user_registration' &&
                              notif.type !== 'capacity_alert' &&
                              notif.type !== 'system_alert' && <Bell className="w-4 h-4 text-slate-500" />}
                          </div>

                          <div className="space-y-1 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-extrabold text-sm text-slate-900">{notif.title}</span>
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                {notif.type.replace(/_/g, ' ')}
                              </span>
                              {isUnread && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-black shadow-xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                  <span>Unread</span>
                                </span>
                              )}
                            </div>

                            {notif.message.includes(' | ') ? (
                              <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80 my-1.5 space-y-1 text-xs">
                                {notif.message.split(' | ').map((part, pIdx) => {
                                  const [k, ...v] = part.split(': ');
                                  return (
                                    <div key={pIdx} className="flex items-baseline justify-between gap-2">
                                      <span className="text-slate-400 font-semibold">{k}:</span>
                                      <span className="font-bold text-slate-800 text-right">{v.join(': ')}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                              <span>
                                {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {notif.relatedEntityId && (
                                <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                  ID: {notif.relatedEntityId}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {(notif.bookingId || notif.relatedEntityId) && (
                            <button
                              onClick={() => {
                                setActiveTab('bookings');
                                setBookingSearch(notif.bookingId || notif.relatedEntityId || '');
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                              title="Inspect this booking"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                              <span>View Booking</span>
                            </button>
                          )}

                          {isUnread && (
                            <button
                              onClick={() => handleMarkAsRead(notif.id)}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                              title="Mark as read"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark as Read</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteNotification(notif.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete notification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {showAddSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <PlusCircle className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900">Add New Parking Slot</h3>
              </div>
              <button
                onClick={() => setShowAddSlotModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSlot} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Facility</label>
                <select
                  value={newSlotLocationId}
                  onChange={(e) => setNewSlotLocationId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Slot Number (e.g. G-13, F2-05, EV-08)
                </label>
                <input
                  type="text"
                  value={newSlotNumber}
                  onChange={(e) => setNewSlotNumber(e.target.value.toUpperCase())}
                  placeholder="G-13"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono uppercase focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Floor Designation</label>
                  <select
                    value={newSlotFloor}
                    onChange={(e) => setNewSlotFloor(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                  >
                    <option value="Ground Floor">Ground Floor</option>
                    <option value="1st Floor">1st Floor</option>
                    <option value="2nd Floor">2nd Floor</option>
                    <option value="Basement 1">Basement 1</option>
                    <option value="Basement 2">Basement 2</option>
                    <option value="Open Parking Lot">Open Parking Lot</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Category</label>
                  <select
                    value={newSlotVehicleType}
                    onChange={(e) => setNewSlotVehicleType(e.target.value as VehicleType)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                  >
                    <option value="car">Car (4-Wheeler)</option>
                    <option value="bike">Bike (2-Wheeler)</option>
                    <option value="ev">Electric Vehicle (EV)</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newSlotHasCharging}
                  onChange={(e) => setNewSlotHasCharging(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Equipped with EV Charging Port Station</span>
              </label>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
              >
                Create Slot
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Real-Time Notification Center Slide-over Dropdown Panel */}
      <AdminNotificationPanel
        isOpen={isNotificationPanelOpen}
        onClose={() => setIsNotificationPanelOpen(false)}
        notifications={adminNotifications}
        unreadCount={unreadAdminCount}
        isLoading={isNotificationsLoading}
        errorMessage={notificationError}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDeleteNotification={handleDeleteNotification}
        onViewAllNotifications={() => {
          setActiveTab('notifications');
          setIsNotificationPanelOpen(false);
        }}
        onViewBooking={(bookingId) => {
          setActiveTab('bookings');
          setBookingSearch(bookingId);
          setIsNotificationPanelOpen(false);
        }}
        onRefresh={fetchAdminNotifications}
      />

      {/* Real-time Visible Floating Booking Toast (<1s delivery without refresh) */}
      <AdminBookingToast
        alerts={bookingAlerts}
        onDismiss={(id) => {
          dismissedAlertIdsRef.current.add(id);
          const found = bookingAlerts.find((a) => a.id === id);
          if (found?.bookingId) dismissedAlertIdsRef.current.add(found.bookingId);
          if (found?.notificationId) dismissedAlertIdsRef.current.add(found.notificationId);
          setBookingAlerts((prev) => prev.filter((a) => a.id !== id));
        }}
        onOpenAdminConsole={() => setActiveTab('bookings')}
      />
    </div>
  );
};
