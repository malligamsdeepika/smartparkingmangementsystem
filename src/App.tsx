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

  }, []);

  useEffect(() => {
    // 1. One global listener on shared real-time updates to update slot availability and bookings silently.
    // Requirement 1 & 6: Remove all admin booking notification pop-ups, toast messages, floating cards,
    // and live alerts from the user-facing interface. Only authenticated Admin Console receives admin alerts.
    const unsubscribe = RealtimeSync.subscribe((_event: RealtimeEventPayload) => {
      refreshAllData();
    });

    // Immediate and periodic synchronization to guarantee multi-device parity
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

    return () => {
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

  const userNotifications = React.useMemo(() => {
    if (!currentUser) return [];
    return notifications.filter((n) => n.userId === currentUser.id);
  }, [notifications, currentUser]);

  const unreadNotificationsCount =
    currentUser?.role === 'admin'
      ? StorageService.getAdminNotifications().filter((n) => !n.isRead && !n.read).length
      : userNotifications.filter((n) => !n.read).length;

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
        onSwitchToAdmin={() => handleOpenAuth('admin')}
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
        notifications={userNotifications}
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
          if (!currentUser) return;
          StorageService.addNotification({
            userId: currentUser.id,
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
          handleOpenAuth(role === 'admin' ? 'admin' : 'login');
        }}
        onOpenFeeCalc={() => setIsFeeCalcOpen(true)}
        onOpenDocs={() => setIsDocsOpen(true)}
        onOpenMultiDevice={() => setIsMultiDeviceOpen(true)}
        onResetData={handleResetData}
      />

    </div>
  );
}
