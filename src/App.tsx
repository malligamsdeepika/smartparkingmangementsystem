/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { StorageService } from './utils/storage';
import { Booking, DashboardStats, ParkingLocation, ParkingSlot, PaymentRecord, SlotStatus, User } from './types';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { ParkingDashboard } from './components/ParkingDashboard';
import { BookingPage } from './components/BookingPage';
import { MyBookings } from './components/MyBookings';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { BookingConfirmationModal } from './components/BookingConfirmationModal';
import { FeeCalculatorModal } from './components/FeeCalculatorModal';
import { CollegeProjectDocsModal } from './components/CollegeProjectDocsModal';
import { ProjectCodePage } from './components/ProjectCodePage';
import { TestingHelperWidget } from './components/TestingHelperWidget';
import { MultiDeviceModal } from './components/MultiDeviceModal';
import { ParkingMapModal } from './components/ParkingMapModal';
import { NotificationPanel } from './components/NotificationPanel';
import { GateScannerModal } from './components/GateScannerModal';
import { AdminBookingToast, BookingAlertItem } from './components/AdminBookingToast';
import { UserBookingAlertToast, UserAlertNotification } from './components/UserBookingAlertToast';
import { soundManager } from './utils/sound';
import { RealtimeSync, RealtimeEventPayload } from './services/realtimeSync';
import { SmartNotification } from './types';
import {
  Car,
  Heart,
  Shield,
  GraduationCap,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Clock,
  RotateCcw,
  Compass
} from 'lucide-react';

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard' | 'book' | 'my-bookings' | 'admin' | 'docs'>('home');

  // Core Data State (lazy initializers prevent mount-time setState cascades)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    StorageService.init();
    return StorageService.getCurrentUser();
  });
  const [locations, setLocations] = useState<ParkingLocation[]>(() => StorageService.getLocations());
  const [slots, setSlots] = useState<ParkingSlot[]>(() => StorageService.getSlots());
  const [bookings, setBookings] = useState<Booking[]>(() => StorageService.getBookings());
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [payments, setPayments] = useState<PaymentRecord[]>(() => StorageService.getPayments());
  const [stats, setStats] = useState<DashboardStats>(() => StorageService.getDashboardStats());

  // Pre-selection states for booking or dashboard
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');

  // Modals & Panels
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'admin'>('login');
  const [isFeeCalcOpen, setIsFeeCalcOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isMultiDeviceOpen, setIsMultiDeviceOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isGateScannerOpen, setIsGateScannerOpen] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [notifications, setNotifications] = useState<SmartNotification[]>(() => StorageService.getNotifications());
  const [globalAdminAlerts, setGlobalAdminAlerts] = useState<BookingAlertItem[]>([]);
  const [userAlerts, setUserAlerts] = useState<UserAlertNotification[]>([]);

  // Keep stable refs to avoid re-triggering effects when user or active tab changes
  const currentUserRef = React.useRef(currentUser);
  const activeTabRef = React.useRef(activeTab);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Sync state from StorageService with identity guards to eliminate unnecessary renders
  const refreshAllData = useCallback(() => {
    const freshUser = StorageService.getCurrentUser();
    setCurrentUser((prev) => {
      if (!prev && !freshUser) return null;
      if (
        prev &&
        freshUser &&
        prev.id === freshUser.id &&
        prev.email === freshUser.email &&
        prev.role === freshUser.role &&
        prev.name === freshUser.name
      ) {
        return prev;
      }
      return freshUser;
    });

    const freshLocs = StorageService.getLocations();
    setLocations((prev) => (prev.length === freshLocs.length ? prev : freshLocs));

    const freshSlots = StorageService.getSlots();
    setSlots((prev) => {
      if (prev.length !== freshSlots.length) return freshSlots;
      const changed = prev.some((s, idx) => s.id !== freshSlots[idx].id || s.status !== freshSlots[idx].status);
      return changed ? freshSlots : prev;
    });

    const freshBookings = StorageService.getBookings();
    setBookings((prev) => {
      if (prev.length !== freshBookings.length) return freshBookings;
      const changed = prev.some((b, idx) => b.id !== freshBookings[idx].id || b.status !== freshBookings[idx].status);
      return changed ? freshBookings : prev;
    });

    const freshUsers = StorageService.getUsers();
    setUsers((prev) => (prev.length === freshUsers.length ? prev : freshUsers));

    const freshPayments = StorageService.getPayments();
    setPayments((prev) => (prev.length === freshPayments.length ? prev : freshPayments));

    const freshStats = StorageService.getDashboardStats();
    setStats((prev) => {
      if (
        prev.totalSlots === freshStats.totalSlots &&
        prev.availableSlots === freshStats.availableSlots &&
        prev.occupiedSlots === freshStats.occupiedSlots &&
        prev.reservedSlots === freshStats.reservedSlots &&
        prev.totalBookings === freshStats.totalBookings &&
        prev.totalRevenue === freshStats.totalRevenue
      ) {
        return prev;
      }
      return freshStats;
    });

    const freshNotifs = StorageService.getNotifications();
    setNotifications((prev) => {
      if (prev.length !== freshNotifs.length) return freshNotifs;
      const changed = prev.some((n, idx) => n.id !== freshNotifs[idx].id || n.read !== freshNotifs[idx].read);
      return changed ? freshNotifs : prev;
    });

    // Auto-sync unread admin booking notifications into globalAdminAlerts so Laptop B gets alerts on any tab
    if (activeTabRef.current !== 'admin') {
      const adminNotifs = StorageService.getAdminNotifications();
      const unreadBookingNotifs = adminNotifs.filter(
        (n) => (n.type === 'new_booking' || (n.title && n.title.toLowerCase().includes('booking'))) && !n.isRead && !n.read
      );
      if (unreadBookingNotifs.length > 0) {
        setGlobalAdminAlerts((prev) => {
          const existingBookingIds = new Set(prev.map((a) => a.bookingId).filter(Boolean));
          const existingIds = new Set(prev.map((a) => a.id));
          const newAlerts: BookingAlertItem[] = [];

          for (const notif of unreadBookingNotifs) {
            const bId = notif.bookingId || notif.metadata?.bookingId;
            const alertId = `global-alert-${bId || notif.id}`;
            if (existingIds.has(alertId) || (bId && existingBookingIds.has(bId))) continue;

            const bookingTime = notif.metadata?.bookingTime || new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            newAlerts.push({
              id: alertId,
              notificationId: notif.id,
              bookingId: bId,
              userName: notif.metadata?.userName || 'Driver',
              vehicleNumber: notif.metadata?.vehicleNumber || 'APXX1234',
              locationName: notif.metadata?.locationName || 'Central Facility',
              floor: notif.metadata?.floor || 'Floor 1',
              slotNumber: notif.metadata?.slotNumber || 'P-101',
              bookingTime,
              amount: notif.metadata?.amount || 40,
              status: notif.metadata?.status || 'Confirmed',
              receivedAt: new Date(notif.createdAt),
            });
            existingIds.add(alertId);
            if (bId) existingBookingIds.add(bId);
          }

          if (newAlerts.length > 0) {
            soundManager.play('admin');
            newAlerts.forEach((item) => {
              soundManager.showDesktopNotification('🔔 New Parking Booking Received', {
                body: `Bay: ${item.slotNumber} | Vehicle: ${item.vehicleNumber} | User: ${item.userName} | ₹${item.amount}`,
              });
            });
            return [...prev, ...newAlerts];
          }
          return prev;
        });
      }
    }
  }, []);

  useEffect(() => {
    // 4. Avoid false notifications on initial load:
    // Ignore existing bookings on initial load so old bookings don't notify on page load.
    let isInitialLoad = true;
    const initialSyncTimer = setTimeout(() => {
      isInitialLoad = false;
    }, 1500);

    // Track notified booking IDs to prevent duplicates
    const notifiedBookingIds = new Set<string>();
    StorageService.getBookings().forEach((b) => {
      if (b.id) notifiedBookingIds.add(b.id);
      if (b.bookingCode) notifiedBookingIds.add(b.bookingCode);
    });

    // 3. One global listener on the shared real-time booking updates
    const unsubscribe = RealtimeSync.subscribe((event: RealtimeEventPayload) => {
      // 6. Live updates: refresh data across whole app so Parking Slots page updates live
      refreshAllData();

      if (
        event.eventType === 'NEW_BOOKING' ||
        event.eventType === 'BOOKING_CREATED' ||
        (event.eventType === 'ADMIN_NOTIFICATION' && event.payload?.notification?.type === 'new_booking')
      ) {
        const payload = event.payload;
        const booking = payload?.booking;
        const notif = payload?.notification;
        const bId = payload?.bookingId || booking?.id || notif?.bookingId || notif?.metadata?.bookingId;

        // 4. Ignore initial snapshot and ignore if already notified
        if (isInitialLoad || (bId && notifiedBookingIds.has(bId))) {
          if (bId) notifiedBookingIds.add(bId);
          return;
        }

        const bookingUserId = payload?.userId || booking?.userId || notif?.metadata?.userId;
        const currentUserId = currentUserRef.current?.id;

        // 4. Ignore bookings made by the current user's own userId so they don't get two notifications
        if (bookingUserId && currentUserId && bookingUserId === currentUserId) {
          if (bId) notifiedBookingIds.add(bId);
          return;
        }

        if (bId) notifiedBookingIds.add(bId);

        const slotNumber = payload?.slotNumber || booking?.slotNumber || notif?.metadata?.slotNumber || 'P-101';
        const userName = payload?.userName || booking?.userName || notif?.metadata?.userName || 'Driver';
        const vehicleNumber = payload?.vehicleNumber || booking?.vehicleNumber || notif?.metadata?.vehicleNumber || '';
        const locationName = payload?.locationName || booking?.locationName || notif?.metadata?.locationName || 'Central Facility';
        const floor = payload?.floor || booking?.floor || notif?.metadata?.floor || 'Ground Floor';
        const bookingTime = payload?.bookingTime || booking?.entryTime || notif?.metadata?.bookingTime || 'Just now';
        const amount = payload?.amount || booking?.amount || notif?.metadata?.amount || 40;

        // Message: "Slot G-01 was booked by Rahul"
        const notifBody = `Slot ${slotNumber} was booked by ${userName}`;

        // Play chime tone
        soundManager.play('bell');

        // 5. Browser Notification (if permission granted; falls back to in-app toast)
        soundManager.showDesktopNotification('🚗 Parking Slot Booked', {
          body: notifBody,
        });

        // 3. Show in-app Toast notification (visible on both Admin and Normal Users)
        const alertItem: BookingAlertItem = {
          id: `alert-${bId || Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          bookingId: bId,
          userName,
          vehicleNumber,
          locationName,
          floor,
          slotNumber,
          bookingTime,
          amount,
          status: 'Confirmed',
          receivedAt: new Date(),
        };

        setGlobalAdminAlerts((prev) => {
          if (bId && prev.some((a) => a.bookingId === bId)) return prev;
          return [alertItem, ...prev];
        });
      }

      // 6. Normal users & Admins notified when any slot status changes (booked or released)
      if (event.eventType === 'SLOT_UPDATED' || event.eventType === 'BOOKING_CANCELLED') {
        const slotNumber = event.payload?.slotNumber || 'Bay';
        const newStatus = event.payload?.status || 'available';
        const statusText = newStatus === 'available' ? 'is now available' : `is now ${newStatus}`;
        soundManager.showDesktopNotification('🅿️ Slot Status Updated', {
          body: `Slot ${slotNumber} ${statusText}`,
        });
      }
    });

    // Immediate and periodic synchronization to guarantee parity
    StorageService.syncWithServer()
      .then(() => refreshAllData())
      .catch(() => {});

    const reconcileTimer = setInterval(() => {
      StorageService.syncWithServer().catch(() => {});
    }, 2500);

    const handleSync = () => {
      refreshAllData();
    };
    window.addEventListener('smartparking:sync', handleSync);

    // 4. Unsubscribe in the useEffect cleanup so notifications don't duplicate
    return () => {
      clearTimeout(initialSyncTimer);
      clearInterval(reconcileTimer);
      unsubscribe();
      window.removeEventListener('smartparking:sync', handleSync);
    };
  }, [refreshAllData]);

  // Handlers
  const handleOpenAuth = (mode: 'login' | 'register' | 'admin' = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleLogout = () => {
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
    if (activeTab === 'admin' || activeTab === 'my-bookings') {
      setActiveTab('home');
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    // 5. Ask for browser notification permission on user login. If denied, falls back to in-app toast
    soundManager.requestNotificationPermission().catch(() => {});
    if (user.role === 'admin') {
      setActiveTab('admin');
    }
  };

  // Navigating to dashboard with optional location preset
  const handleFindParking = (locId?: string) => {
    if (locId) setSelectedLocationId(locId);
    setActiveTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigating to booking form with optional location & slot preset
  const handleBookSlot = (locId?: string, slotId?: string) => {
    if (locId) setSelectedLocationId(locId);
    if (slotId) setSelectedSlotId(slotId);
    setActiveTab('book');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSlotFromDashboard = (slot: ParkingSlot, locId: string) => {
    setSelectedLocationId(locId);
    setSelectedSlotId(slot.id);
    setActiveTab('book');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSlotStatusUpdate = (slotId: string, newStatus: SlotStatus) => {
    StorageService.updateSlotStatus(slotId, newStatus);
    refreshAllData();
  };

  const handleBookingSuccess = (booking: Booking) => {
    refreshAllData();
    setConfirmedBooking(booking);
    // 1. Notification calls removed from the booking button's handler.
    // Notifications are delivered globally through the shared real-time database listener.
  };

  const handleResetData = () => {
    if (confirm('Reset system data to initial college demo seed? (Slots, sample bookings & users)')) {
      StorageService.resetAllData();
      refreshAllData();
    }
  };

  const unreadNotificationsCount =
    currentUser?.role === 'admin'
      ? StorageService.getAdminNotifications().filter((n) => !n.isRead && !n.read).length
      : notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'docs') {
            setIsDocsOpen(true);
          } else {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onOpenFeeCalc={() => setIsFeeCalcOpen(true)}
        onOpenMap={() => setIsMapOpen(true)}
        onOpenNotifications={() => {
          if (currentUser?.role === 'admin') {
            setActiveTab('admin');
          } else {
            setIsNotificationsOpen(true);
          }
        }}
        onOpenGateScanner={() => setIsGateScannerOpen(true)}
        onOpenMultiDevice={() => setIsMultiDeviceOpen(true)}
        onSwitchToAdmin={() => {
          const adminUser = StorageService.getUsers().find((u) => u.role === 'admin') || {
            id: 'usr-admin',
            name: 'System Administrator',
            email: 'admin@smartparking.com',
            phone: '9999900000',
            role: 'admin' as const,
            createdAt: new Date().toISOString(),
          };
          StorageService.setCurrentUser(adminUser as any);
          setCurrentUser(adminUser as any);
          setActiveTab('admin');
        }}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* TOP GLOBAL MULTI-CITY LOCATION BAR - VISIBLE AT THE VERY TOP OF EVERY PAGE */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-900/60 py-2.5 px-4 shadow-md sticky top-16 z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-800">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>LOCATION:</span>
            </span>

            {/* City dropdown */}
            <select
              id="top-global-location-select"
              aria-label="Select Parking Location"
              value={selectedLocationId || locations[0]?.id || ''}
              onChange={(e) => {
                const newId = e.target.value;
                setSelectedLocationId(newId);
              }}
              className="bg-slate-800 text-white font-bold rounded-lg px-3 py-1 border border-slate-700 text-xs sm:text-sm focus:ring-2 focus:ring-cyan-400 focus:outline-none cursor-pointer"
            >
              {Array.from(new Set(locations.map((l) => l.city))).map((city) => (
                <optgroup key={city} label={`── ${city} ──`} className="text-slate-900 bg-slate-100 font-bold">
                  {locations
                    .filter((l) => l.city === city)
                    .map((loc) => (
                      <option key={loc.id} value={loc.id} className="text-slate-900 bg-white font-semibold">
                        {loc.city}: {loc.name} ({loc.area})
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>

            {/* Quick city switch chips */}
            <div className="hidden md:flex items-center gap-1">
              {Array.from(new Set(locations.map((l) => l.city))).map((city) => {
                const cityLoc = locations.find((l) => l.city === city);
                const isSelected = (locations.find((l) => l.id === (selectedLocationId || locations[0]?.id))?.city || '') === city;
                return (
                  <button
                    key={city}
                    onClick={() => {
                      if (cityLoc) setSelectedLocationId(cityLoc.id);
                    }}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                        : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {city}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => {
                setActiveTab('book');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
            >
              <span>Book Slot Here</span>
              <span>→</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('dashboard');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1"
            >
              <span>View Sensor Grid</span>
            </button>
            <button
              onClick={() => setIsMapOpen(true)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Map View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <HomePage
            stats={stats}
            locations={locations}
            onFindParking={handleFindParking}
            onBookSlot={handleBookSlot}
            onOpenFeeCalc={() => setIsFeeCalcOpen(true)}
            onOpenDocs={() => {
              setActiveTab('docs');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAuth={handleOpenAuth}
            onOpenMap={() => setIsMapOpen(true)}
          />
        )}

        {activeTab === 'dashboard' && (
          <ParkingDashboard
            locations={locations}
            slots={slots}
            selectedLocationId={selectedLocationId}
            currentUser={currentUser}
            onSelectSlotToBook={handleSelectSlotFromDashboard}
            onUpdateSlotStatus={handleSlotStatusUpdate}
            onOpenBooking={() => setActiveTab('book')}
          />
        )}

        {activeTab === 'book' && (
          <BookingPage
            locations={locations}
            slots={slots}
            currentUser={currentUser}
            initialLocationId={selectedLocationId}
            initialSlotId={selectedSlotId}
            onBookingSuccess={handleBookingSuccess}
            onOpenAuth={handleOpenAuth}
            onGoToDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'my-bookings' && (
          <MyBookings
            currentUser={currentUser}
            bookings={bookings}
            onOpenBooking={() => setActiveTab('book')}
            onOpenAuth={() => handleOpenAuth('login')}
            onViewPass={(b) => setConfirmedBooking(b)}
            onRefreshBookings={refreshAllData}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            locations={locations}
            slots={slots}
            bookings={bookings}
            users={users}
            payments={payments}
            stats={stats}
            onRefreshData={refreshAllData}
            onOpenGateScanner={() => setIsGateScannerOpen(true)}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'docs' && (
          <ProjectCodePage
            onNavigateHome={() => {
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenMultiDevice={() => setIsMultiDeviceOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 mt-16 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand & Project Summary */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <Car className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  Smart<span className="text-blue-600">Parking</span> Management System
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                A modern full-featured automated parking reservation and slot management platform.
                Designed for high efficiency, real-time bay status tracking, collision-free slot allocation,
                and transparent parking duration billing.
              </p>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200/80">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                <span>BCA Academic Project • Placement & Demonstration Edition</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-2 text-xs">
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">System Views</p>
              <ul className="space-y-1.5 text-slate-600">
                <li>
                  <button onClick={() => setActiveTab('home')} className="hover:text-blue-600 cursor-pointer">
                    Home Portal
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('dashboard')} className="hover:text-blue-600 cursor-pointer">
                    Live Bay Availability Grid
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('book')} className="hover:text-blue-600 cursor-pointer">
                    Reserve Parking Bay
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('my-bookings')} className="hover:text-blue-600 cursor-pointer">
                    Driver Passes & History
                  </button>
                </li>
                <li>
                  <button onClick={() => setIsFeeCalcOpen(true)} className="hover:text-blue-600 cursor-pointer">
                    Tariff Rate Calculator (₹20/hr)
                  </button>
                </li>
              </ul>
            </div>

            {/* Project Academic Kit */}
            <div className="space-y-2 text-xs">
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Academic & Admin</p>
              <ul className="space-y-1.5 text-slate-600">
                <li>
                  <button
                    onClick={() => {
                      setActiveTab('docs');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Project Code & MySQL Script</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => handleOpenAuth('admin')} className="hover:text-blue-600 cursor-pointer">
                    Admin Portal Login
                  </button>
                </li>
                <li>
                  <button onClick={handleResetData} className="text-slate-400 hover:text-rose-600 cursor-pointer flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Demo Data</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <p>© 2026 Smart Parking Management System. Built with HTML5, CSS3, JavaScript, Java Backend & MySQL.</p>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>System Online (4 Facilities Active)</span>
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Auth Modal (User Login, Register & Admin Login) */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* 2. Booking Confirmation Modal (QR Code pass & Print receipt) */}
      <BookingConfirmationModal
        booking={confirmedBooking}
        onClose={() => setConfirmedBooking(null)}
        onViewMyBookings={() => {
          setConfirmedBooking(null);
          setActiveTab('my-bookings');
        }}
      />

      {/* 3. Fee Calculator Modal */}
      <FeeCalculatorModal
        isOpen={isFeeCalcOpen}
        onClose={() => setIsFeeCalcOpen(false)}
        onProceedToBook={() => {
          setIsFeeCalcOpen(false);
          setActiveTab('book');
        }}
      />

      {/* 4. College Project & Viva Hub Modal */}
      <CollegeProjectDocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />

      {/* 5. Interactive Campus Parking Map Modal */}
      <ParkingMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        locations={locations}
        slots={slots}
        selectedLocationId={selectedLocationId}
        onSelectLocationForBooking={(locId: string) => {
          setIsMapOpen(false);
          handleBookSlot(locId);
        }}
        onViewLocationSlots={(locId: string) => {
          setIsMapOpen(false);
          handleFindParking(locId);
        }}
      />

      {/* 6. Smart Notifications Slide-Over Panel */}
      <NotificationPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={(id: string) => {
          StorageService.markNotificationAsRead(id);
          refreshAllData();
        }}
        onMarkAllAsRead={() => {
          StorageService.markAllNotificationsAsRead(currentUser?.id || 'all');
          refreshAllData();
        }}
        onDeleteNotification={(id: string) => {
          StorageService.deleteNotification(id);
          refreshAllData();
        }}
        onViewBooking={(bookingId: string) => {
          setIsNotificationsOpen(false);
          const b = bookings.find((item) => item.id === bookingId);
          if (b) setConfirmedBooking(b);
          else setActiveTab('my-bookings');
        }}
        onSimulateReminder={() => {
          StorageService.addNotification({
            userId: currentUser?.id || 'usr-1',
            title: 'Parking Reminder: 15 Minutes Left',
            message: 'Your reserved parking session at Ground Floor G-04 expires in 15 minutes. Extend now to prevent overtime charges.',
            type: 'time_reminder',
          });
          refreshAllData();
        }}
      />

      {/* 7. QR Gate Entry & Exit Barrier Scanner */}
      <GateScannerModal
        isOpen={isGateScannerOpen}
        onClose={() => setIsGateScannerOpen(false)}
        activeBookings={bookings.filter((b) => b.status === 'confirmed' || b.status === 'active')}
        onSessionUpdated={refreshAllData}
      />

      {/* 8. Multi-Device & Cross-Network Connection Modal */}
      <MultiDeviceModal
        isOpen={isMultiDeviceOpen}
        onClose={() => setIsMultiDeviceOpen(false)}
      />

      {/* 9. Floating Testing & Evaluation Hub Widget */}
      <TestingHelperWidget
        currentUser={currentUser}
        onLoginAs={(role) => {
          const target =
            StorageService.getUsers().find((u) => u.role === role) ||
            (role === 'admin'
              ? {
                  id: 'usr-admin',
                  name: 'System Administrator',
                  email: 'admin@smartparking.com',
                  phone: '9999900000',
                  role: 'admin' as const,
                  createdAt: new Date().toISOString(),
                }
              : {
                  id: 'usr-1',
                  name: 'Rahul Sharma',
                  email: 'rahul@example.com',
                  phone: '9876543210',
                  role: 'user' as const,
                  createdAt: new Date().toISOString(),
                });
          StorageService.setCurrentUser(target);
          setCurrentUser(target);
          if (role === 'admin') {
            setActiveTab('admin');
          } else {
            setActiveTab('home');
          }
        }}
        onOpenFeeCalc={() => setIsFeeCalcOpen(true)}
        onOpenDocs={() => setIsDocsOpen(true)}
        onOpenMultiDevice={() => setIsMultiDeviceOpen(true)}
        onResetData={handleResetData}
      />

      {/* Driver / Customer Booking Alert Toast */}
      <UserBookingAlertToast
        alerts={userAlerts}
        onDismiss={(id) => setUserAlerts((prev) => prev.filter((a) => a.id !== id))}
        onViewPass={(b) => setConfirmedBooking(b)}
        onViewMyBookings={() => {
          setActiveTab('my-bookings');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Global Booking Notification Toast when outside Admin Console */}
      {activeTab !== 'admin' && (
        <AdminBookingToast
          alerts={globalAdminAlerts}
          onDismiss={(id) => setGlobalAdminAlerts((prev) => prev.filter((a) => a.id !== id))}
          onOpenAdminConsole={() => {
            if (currentUser?.role !== 'admin') {
              const adminUser = StorageService.getUsers().find((u) => u.role === 'admin') || {
                id: 'usr-admin',
                name: 'System Administrator',
                email: 'admin@smartparking.com',
                phone: '9999900000',
                role: 'admin',
                createdAt: new Date().toISOString(),
              };
              StorageService.setCurrentUser(adminUser as any);
              setCurrentUser(adminUser as any);
            }
            setActiveTab('admin');
          }}
        />
      )}
    </div>
  );
}
