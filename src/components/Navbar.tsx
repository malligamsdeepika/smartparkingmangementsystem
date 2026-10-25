import React, { useState, useEffect } from 'react';
import {
  Car,
  Compass,
  CalendarCheck,
  Calculator,
  ShieldCheck,
  GraduationCap,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Clock,
  Sparkles,
  ChevronDown,
  Bell,
  MapPin,
  QrCode,
  Radio,
  Share2
} from 'lucide-react';
import { User } from '../types';
import { RealtimeSync, RealtimeStatus } from '../services/realtimeSync';

interface NavbarProps {
  activeTab: 'home' | 'dashboard' | 'book' | 'my-bookings' | 'admin' | 'docs';
  setActiveTab: (tab: 'home' | 'dashboard' | 'book' | 'my-bookings' | 'admin' | 'docs') => void;
  currentUser: User | null;
  onOpenAuth: (initialMode?: 'login' | 'register' | 'admin') => void;
  onLogout: () => void;
  onOpenFeeCalc: () => void;
  onOpenMap: () => void;
  onOpenNotifications: () => void;
  onOpenGateScanner?: () => void;
  onOpenMultiDevice?: () => void;
  onSwitchToAdmin?: () => void;
  unreadNotificationsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenFeeCalc,
  onOpenMap,
  onOpenNotifications,
  onOpenGateScanner,
  onOpenMultiDevice,
  onSwitchToAdmin,
  unreadNotificationsCount = 0,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<RealtimeStatus>('connecting');
  const [clientCount, setClientCount] = useState<number>(1);

  useEffect(() => {
    const unsubscribe = RealtimeSync.onStatusChange((status, count) => {
      setSyncStatus((prev) => (prev === status ? prev : status));
      setClientCount((prev) => (prev === count ? prev : count));
    });
    return unsubscribe;
  }, []);

  const navItems = [
    { id: 'home', label: 'Home', icon: Compass },
    { id: 'dashboard', label: 'Parking Slots', icon: Car },
    { id: 'book', label: 'Book a Slot', icon: CalendarCheck },
    { id: 'my-bookings', label: 'My Bookings', icon: Clock },
    { id: 'docs', label: 'Project Code & Viva', icon: GraduationCap, highlight: true },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            id="brand-logo"
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  Smart<span className="text-blue-600">Parking</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  Live
                </span>
                <button
                  type="button"
                  onClick={onOpenMultiDevice}
                  title={
                    syncStatus === 'connected'
                      ? `Real-time synchronization active! ${clientCount} active device(s) connected. Click to open on another computer or phone.`
                      : 'Connecting to real-time engine... Click for device setup.'
                  }
                  className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full transition-all cursor-pointer hover:opacity-90 active:scale-95 ${
                    syncStatus === 'connected'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      syncStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  ></span>
                  <span>
                    {syncStatus === 'connected'
                      ? `Real-Time Sync (${clientCount} dev)`
                      : 'Syncing...'}
                  </span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Automated Slot Finder & Management</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : item.highlight
                      ? 'text-indigo-700 hover:bg-indigo-50 border border-indigo-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : item.highlight ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.highlight && (
                    <span className="flex h-1.5 w-1.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-600"></span>
                    </span>
                  )}
                </button>
              );
            })}

            {/* Map View Trigger */}
            <button
              id="nav-map-btn"
              onClick={onOpenMap}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50/70 transition-colors cursor-pointer"
              title="Interactive Campus Parking Map"
            >
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Map View</span>
            </button>

            {/* Fee Calculator Trigger */}
            <button
              id="nav-calc-btn"
              onClick={onOpenFeeCalc}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-colors cursor-pointer"
              title="Estimate parking charges"
            >
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span>Rates</span>
            </button>
          </nav>

          {/* Right Action: Gate Scanner, Notifications, Auth / User Profile */}
          <div className="hidden md:flex items-center gap-2">
            {/* Gate Scanner Quick Trigger */}
            {onOpenGateScanner && (
              <button
                onClick={onOpenGateScanner}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                title="Smart Gate Entry & Exit Terminal"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                <span>Gate Scanner</span>
              </button>
            )}

            {/* 2nd Computer / Mobile Quick Connect */}
            {onOpenMultiDevice && (
              <button
                onClick={onOpenMultiDevice}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                title="Open on another computer or smartphone"
              >
                <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>2nd PC / Phone</span>
              </button>
            )}

            {/* Smart Notification Bell */}
            <button
              id="nav-notifications-bell"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Smart Notifications"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-xs animate-bounce">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>
            {currentUser?.role === 'admin' ? (
              <button
                id="nav-admin-dashboard-btn"
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeTab === 'admin'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-900 text-amber-300'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Admin Console</span>
              </button>
            ) : (
              <button
                id="nav-admin-login-link"
                onClick={onSwitchToAdmin || (() => onOpenAuth('admin'))}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg shadow-2xs transition-all cursor-pointer"
                title="Open Administrator Console for live booking telemetry & alerts"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Admin Console</span>
              </button>
            )}

            {currentUser ? (
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="text-left text-xs hidden lg:block">
                    <p className="font-semibold text-slate-800 leading-tight truncate max-w-[100px]">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-slate-500 capitalize">{currentUser.role}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div
                    id="user-dropdown-menu"
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="px-3.5 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900">{currentUser.name}</p>
                      <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                      <span className="mt-1 inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        Role: {currentUser.role}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab('my-bookings');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>My Reservations</span>
                    </button>

                    {currentUser.role === 'admin' && (
                      <button
                        onClick={() => {
                          setActiveTab('admin');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                        <span>Admin Dashboard</span>
                      </button>
                    )}

                    <div className="border-t border-slate-100 mt-1">
                      <button
                        id="user-logout-btn"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="nav-login-btn"
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Log In
                </button>
                <button
                  id="nav-register-btn"
                  onClick={() => onOpenAuth('register')}
                  className="px-3.5 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 bg-rose-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div id="mobile-nav-drawer" className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-5 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setIsMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => {
              onOpenMap();
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 font-medium"
          >
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>Campus Parking Map</span>
          </button>

          {onOpenGateScanner && (
            <button
              onClick={() => {
                onOpenGateScanner();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 font-medium"
            >
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span>Gate Entry/Exit Scanner</span>
            </button>
          )}

          <button
            onClick={() => {
              onOpenFeeCalc();
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 font-medium"
          >
            <Calculator className="w-4 h-4 text-emerald-600" />
            <span>Parking Rate Calculator</span>
          </button>

          <div className="pt-3 border-t border-slate-200 space-y-2">
            {currentUser ? (
              <>
                <div className="px-3 py-1 text-xs text-slate-500">
                  Signed in as: <span className="font-semibold text-slate-800">{currentUser.name}</span> ({currentUser.role})
                </div>
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => {
                      setActiveTab('admin');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg bg-amber-50 text-amber-800 text-sm font-semibold flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Admin Dashboard</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-rose-600 text-sm font-medium flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    onOpenAuth('login');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2 text-center rounded-lg border border-slate-300 text-sm font-medium text-slate-700"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    onOpenAuth('register');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2 text-center rounded-lg bg-blue-600 text-sm font-semibold text-white shadow-xs"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
