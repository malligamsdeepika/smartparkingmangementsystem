import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Car,
  MapPin,
  Clock,
  QrCode,
  X,
  CreditCard,
  ChevronRight,
  Bell
} from 'lucide-react';
import { Booking } from '../types';

export interface UserAlertNotification {
  id: string;
  booking: Booking;
  createdAt: Date;
}

interface UserBookingAlertToastProps {
  alerts: UserAlertNotification[];
  onDismiss: (id: string) => void;
  onViewPass: (booking: Booking) => void;
  onViewMyBookings: () => void;
}

export const UserBookingAlertToast: React.FC<UserBookingAlertToastProps> = ({
  alerts,
  onDismiss,
  onViewPass,
  onViewMyBookings,
}) => {
  if (!alerts || alerts.length === 0) return null;

  // Defensive deduplication to guarantee React never sees duplicate keys
  const seenKeys = new Set<string>();
  const uniqueAlerts = alerts.filter((item, idx) => {
    const key = item.id || (item.booking?.id ? `user-alert-${item.booking.id}` : `user-alert-idx-${idx}`);
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  return (
    <div
      aria-live="assertive"
      className="fixed top-4 left-4 sm:top-5 sm:left-5 z-[99999] flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none"
    >
      {uniqueAlerts.map((item, idx) => (
        <UserToastCard
          key={`${item.id || item.booking?.id || 'user-alert'}-${idx}`}
          alert={item}
          onDismiss={() => onDismiss(item.id)}
          onViewPass={() => onViewPass(item.booking)}
          onViewMyBookings={onViewMyBookings}
        />
      ))}
    </div>
  );
};

interface UserToastCardProps {
  alert: UserAlertNotification;
  onDismiss: () => void;
  onViewPass: () => void;
  onViewMyBookings: () => void;
}

const UserToastCard: React.FC<UserToastCardProps> = ({
  alert,
  onDismiss,
  onViewPass,
  onViewMyBookings,
}) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const onDismissRef = React.useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (isPaused) return;
    const duration = 12000;
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

  const { booking } = alert;

  return (
    <div
      id={`user-alert-${alert.id}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="pointer-events-auto bg-gradient-to-br from-slate-900/98 via-slate-900/95 to-blue-950/95 backdrop-blur-md text-white rounded-2xl p-4 sm:p-5 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/25 animate-in slide-in-from-top-4 fade-in duration-300 transition-all hover:border-emerald-400"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className="absolute -inset-1 rounded-xl bg-emerald-500/40 animate-ping"></span>
            <div className="relative w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md">
              <CheckCircle2 className="w-5 h-5 text-emerald-100" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-1">
                <span>🎉 BOOKING CONFIRMED!</span>
              </h4>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Active
              </span>
            </div>
            <p className="text-[10px] text-slate-300">
              Your parking slot is reserved & locked in the system.
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

      {/* Booking Overview Grid */}
      <div className="py-3 grid grid-cols-2 gap-2 text-xs">
        {/* Reserved Slot */}
        <div className="bg-slate-800/90 p-2.5 rounded-xl border border-emerald-500/30">
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Reserved Bay:</span>
          </span>
          <p className="font-mono font-black text-emerald-400 text-base mt-0.5">
            {booking.slotNumber || 'P-101'}
          </p>
          <p className="text-[10px] text-slate-400">{booking.floor || 'Ground Floor'}</p>
        </div>

        {/* Vehicle */}
        <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/60">
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <Car className="w-3 h-3 text-amber-400" />
            <span>Vehicle Plate:</span>
          </span>
          <p className="font-mono font-black text-amber-300 text-sm truncate mt-0.5">
            {booking.vehicleNumber || 'APXX1234'}
          </p>
          <p className="text-[10px] text-slate-400 capitalize">{booking.vehicleType || 'Car'}</p>
        </div>

        {/* Location & Time */}
        <div className="bg-slate-800/90 p-2 rounded-xl border border-slate-700/60 col-span-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate text-slate-200 text-xs font-semibold">
              {booking.locationName || 'Central Parking Facility'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50 shrink-0">
            <Clock className="w-3 h-3 text-blue-400" />
            <span>{booking.entryTime}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800">
        <button
          onClick={() => {
            onViewMyBookings();
            onDismiss();
          }}
          className="text-xs text-slate-300 hover:text-white font-medium flex items-center gap-0.5 hover:underline cursor-pointer"
        >
          <span>My Bookings</span>
          <ChevronRight className="w-3 h-3" />
        </button>

        <button
          onClick={() => {
            onViewPass();
            onDismiss();
          }}
          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-600/30"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>View QR Pass</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-2.5">
        <div
          className="bg-emerald-500 h-full transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
