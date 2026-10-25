import React, { useState } from 'react';
import {
  Clock,
  Car,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  QrCode,
  ArrowRight,
  Printer,
  Ban,
  Building,
  CreditCard
} from 'lucide-react';
import { Booking, User } from '../types';
import { StorageService } from '../utils/storage';

interface MyBookingsProps {
  currentUser: User | null;
  bookings: Booking[];
  onOpenBooking: () => void;
  onOpenAuth: () => void;
  onViewPass: (booking: Booking) => void;
  onRefreshBookings: () => void;
}

export const MyBookings: React.FC<MyBookingsProps> = ({
  currentUser,
  bookings,
  onOpenBooking,
  onOpenAuth,
  onViewPass,
  onRefreshBookings,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelNotice, setCancelNotice] = useState<string>('');

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-xs max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Sign in to View Reservations</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Please log in or register with your credentials to access active parking passes and past receipts.
          </p>
          <button
            onClick={onOpenAuth}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
          >
            Sign In / Register
          </button>
        </div>
      </div>
    );
  }

  // Filter bookings for this user
  const userBookings = bookings.filter(
    (b) => b.userId === currentUser.id || b.userEmail.toLowerCase() === currentUser.email.toLowerCase()
  );

  const filteredBookings = userBookings.filter((b) => {
    if (filter === 'active') return b.status === 'confirmed' || b.status === 'active';
    if (filter === 'completed') return b.status === 'completed';
    if (filter === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  const handleConfirmCancel = () => {
    if (!cancelModalBooking) return;
    const res = StorageService.cancelBooking(cancelModalBooking.id);
    if (res.success) {
      setCancelNotice(res.message);
      onRefreshBookings();
    }
    setCancelModalBooking(null);
    setTimeout(() => setCancelNotice(''), 4000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Clock className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900">My Parking Bookings</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Registered under <span className="font-semibold text-slate-800">{currentUser.name}</span> ({currentUser.email})
          </p>
        </div>

        <button
          onClick={onOpenBooking}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Car className="w-4 h-4" />
          <span>Book New Slot</span>
        </button>
      </div>

      {cancelNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{cancelNotice}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'all', label: `All (${userBookings.length})` },
          {
            id: 'active',
            label: `Active / Confirmed (${
              userBookings.filter((b) => b.status === 'confirmed' || b.status === 'active').length
            })`,
          },
          {
            id: 'completed',
            label: `Completed (${userBookings.filter((b) => b.status === 'completed').length})`,
          },
          {
            id: 'cancelled',
            label: `Cancelled (${userBookings.filter((b) => b.status === 'cancelled').length})`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              filter === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
          <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Reservations Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You don't have any parking reservations matching this category.
          </p>
          <button
            onClick={onOpenBooking}
            className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 transition-all cursor-pointer"
          >
            Reserve Your First Slot
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const isActive = b.status === 'confirmed' || b.status === 'active';
            const isCompleted = b.status === 'completed';
            const isCancelled = b.status === 'cancelled';

            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
              >
                {/* Left Block: Slot badge + Facility info */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-bold shrink-0 border-2 ${
                      isActive
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : isCompleted
                        ? 'bg-slate-100 border-slate-200 text-slate-700'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    <span className="text-sm font-black">{b.slotNumber}</span>
                    <span className="text-[9px] uppercase font-semibold text-slate-500">{b.floor}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">{b.locationName}</span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : isCompleted
                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                            : 'bg-rose-100 text-rose-800 border-rose-200'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-3">
                      <span>Plate: <strong className="text-slate-800 font-mono">{b.vehicleNumber}</strong> ({b.vehicleType})</span>
                      <span>•</span>
                      <span>Ref: <strong className="text-blue-700 font-mono">#{b.id}</strong></span>
                    </p>

                    <p className="text-xs text-slate-600 flex items-center gap-1.5 pt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{b.bookingDate}</span>
                      <span className="text-slate-300">•</span>
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{b.entryTime} - {b.exitTime} ({b.durationHours} hrs)</span>
                    </p>
                  </div>
                </div>

                {/* Right Block: Amount & Action buttons */}
                <div className="flex sm:items-center justify-between md:justify-end w-full md:w-auto gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Paid</span>
                    <p className="text-xl font-extrabold text-blue-700">₹{b.amount}</p>
                    <span className="text-[10px] text-slate-500">{b.paymentMethod}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewPass(b)}
                      className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>View Pass</span>
                    </button>

                    {isActive && (
                      <button
                        onClick={() => setCancelModalBooking(b)}
                        className="px-3 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Cancel reservation & release slot"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Dialog */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Cancel Parking Reservation?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to cancel booking <strong>#{cancelModalBooking.id}</strong> for slot{' '}
                <strong>{cancelModalBooking.slotNumber}</strong>? The slot will immediately become available for other drivers.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={() => setCancelModalBooking(null)}
                className="py-2.5 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                onClick={handleConfirmCancel}
                className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-md cursor-pointer"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
