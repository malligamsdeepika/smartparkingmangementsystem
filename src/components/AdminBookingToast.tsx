import React, { useEffect, useState } from 'react';
import {
  Bell,
  X,
  Car,
  User,
  MapPin,
  Layers,
  Clock,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { AdminNotification } from '../types';

export interface BookingAlertItem {
  id: string;
  notificationId?: string;
  bookingId?: string;
  userName: string;
  vehicleNumber: string;
  locationName: string;
  floor: string;
  slotNumber: string;
  bookingTime: string;
  amount?: number;
  status?: string;
  receivedAt: Date;
}

interface AdminBookingToastProps {
  alerts: BookingAlertItem[];
  onDismiss: (id: string) => void;
  onOpenAdminConsole?: () => void;
}

export const AdminBookingToast: React.FC<AdminBookingToastProps> = ({
  alerts,
  onDismiss,
  onOpenAdminConsole,
}) => {
  if (!alerts || alerts.length === 0) return null;

  // Defensive deduplication to ensure React never encounters duplicate keys
  const seenKeys = new Set<string>();
  const uniqueAlerts = alerts.filter((alert, idx) => {
    const key = alert.id || (alert.bookingId ? `alert-${alert.bookingId}` : `alert-idx-${idx}`);
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  return (
    <div
      aria-live="assertive"
      className="fixed top-4 right-4 sm:top-5 sm:right-5 z-[99999] flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none"
    >
      {uniqueAlerts.map((alert, idx) => (
        <ToastCard
          key={`${alert.id || alert.bookingId || 'toast'}-${idx}`}
          alert={alert}
          onDismiss={() => onDismiss(alert.id)}
          onOpenAdminConsole={onOpenAdminConsole}
        />
      ))}
    </div>
  );
};

interface ToastCardProps {
  alert: BookingAlertItem;
  onDismiss: () => void;
  onOpenAdminConsole?: () => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ alert, onDismiss, onOpenAdminConsole }) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const onDismissRef = React.useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (isPaused) return;
    const duration = 20000; // 20s visible duration with pause on hover
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct <= 0) {
        clearInterval(interval);
        onDismissRef.current();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div
      id={`booking-alert-${alert.id}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="pointer-events-auto bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 sm:p-5 border-2 border-emerald-500/90 shadow-2xl shadow-emerald-500/20 animate-in slide-in-from-top-4 fade-in duration-300 transition-all hover:border-emerald-400"
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className="absolute -inset-1 rounded-xl bg-emerald-500/40 animate-ping"></span>
            <div className="relative w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md">
              <Bell className="w-5 h-5 text-emerald-100" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-1">
                <span>🔔 Slot {alert.slotNumber} was booked by {alert.userName}</span>
              </h4>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Live
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Live Real-Time Booking Telemetry & Notification (<strong className="text-emerald-400">&lt;1s</strong>)
            </p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Dismiss Notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Grid of Key Booking Details */}
      <div className="py-3 grid grid-cols-2 gap-2 text-xs">
        {/* User */}
        <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <User className="w-3 h-3 text-cyan-400" />
            <span>User:</span>
          </span>
          <p className="font-extrabold text-white text-xs truncate mt-0.5">
            {alert.userName || 'Driver'}
          </p>
        </div>

        {/* Vehicle Number */}
        <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <Car className="w-3 h-3 text-amber-400" />
            <span>Vehicle Number:</span>
          </span>
          <p className="font-mono font-black text-amber-300 text-xs truncate mt-0.5">
            {alert.vehicleNumber || 'APXX1234'}
          </p>
        </div>

        {/* Location */}
        <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <MapPin className="w-3 h-3 text-rose-400" />
            <span>Location:</span>
          </span>
          <p className="font-bold text-slate-200 text-xs truncate mt-0.5">
            {alert.locationName || 'Central Facility'}
          </p>
        </div>

        {/* Floor */}
        <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <Layers className="w-3 h-3 text-purple-400" />
            <span>Floor:</span>
          </span>
          <p className="font-extrabold text-purple-300 text-xs truncate mt-0.5">
            {alert.floor || 'Floor 2'}
          </p>
        </div>

        {/* Slot */}
        <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Slot:</span>
          </span>
          <p className="font-extrabold text-emerald-400 text-xs truncate mt-0.5 font-mono">
            {alert.slotNumber || 'P-205'}
          </p>
        </div>

        {/* Booking Time */}
        <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60 col-span-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] text-slate-400">Booking Time:</span>
            <span className="font-bold text-white text-xs">{alert.bookingTime || 'Just now'}</span>
          </div>
          {alert.amount && (
            <span className="text-[11px] font-extrabold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/60">
              ₹{alert.amount}.00 Paid
            </span>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800">
        <span className="text-[10px] text-slate-400 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Committed to MySQL</span>
        </span>

        {onOpenAdminConsole && (
          <button
            onClick={() => {
              onOpenAdminConsole();
              onDismiss();
            }}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
          >
            <span>View in Console</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Auto-Dismiss Progress Bar */}
      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-2.5">
        <div
          className="bg-emerald-500 h-full transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
