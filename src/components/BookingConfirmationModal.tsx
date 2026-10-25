import React, { useEffect } from 'react';
import {
  CheckCircle2,
  Calendar,
  Clock,
  Car,
  MapPin,
  QrCode,
  Download,
  Printer,
  Share2,
  ArrowRight,
  ShieldCheck,
  Building
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Booking } from '../types';

interface BookingConfirmationModalProps {
  booking: Booking | null;
  onClose: () => void;
  onViewMyBookings: () => void;
}

export const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  booking,
  onClose,
  onViewMyBookings,
}) => {
  useEffect(() => {
    if (booking) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [booking]);

  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center relative">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <span className="text-[11px] uppercase tracking-widest font-bold text-emerald-100">
            Booking Confirmed & Verified
          </span>
          <h2 className="text-2xl font-black mt-1">Smart Parking Pass</h2>
          <p className="text-xs text-emerald-100 mt-1">
            Slot reserved successfully. Show this QR Pass at the boom barrier gate.
          </p>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-sm font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Printable Ticket Pass Body */}
        <div id="parking-pass-printable" className="p-6 space-y-6">
          {/* Booking ID & Status Tag */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Booking ID Reference
              </span>
              <p className="text-lg font-mono font-extrabold text-blue-700">#{booking.id}</p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                Payment Completed (₹{booking.amount})
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">{booking.paymentMethod}</p>
            </div>
          </div>

          {/* Core Slot Highlight */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 p-4 rounded-2xl border border-blue-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Reserved Bay</span>
              <p className="text-3xl font-black text-slate-900">{booking.slotNumber}</p>
              <p className="text-xs text-slate-600 font-medium">{booking.floor}</p>
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Vehicle</span>
              <p className="text-base font-mono font-extrabold text-slate-900">{booking.vehicleNumber}</p>
              <p className="text-xs text-slate-600 capitalize">{booking.vehicleType} Category</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Facility</span>
              <span className="font-bold text-slate-800 line-clamp-1">{booking.locationName}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Driver</span>
              <span className="font-bold text-slate-800">{booking.userName}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Date</span>
              <span className="font-bold text-slate-800">{booking.bookingDate}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Time Window</span>
              <span className="font-bold text-slate-800">
                {booking.entryTime} — {booking.exitTime}
              </span>
            </div>
          </div>

          {/* Simulated QR Code Pass for Boom Barrier */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col items-center text-center space-y-2">
            <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200">
              {/* Clean SVG QR code graphic representation */}
              <svg className="w-28 h-28" viewBox="0 0 100 100" fill="none">
                <rect width="100" height="100" fill="white" />
                {/* Outer Markers */}
                <rect x="10" y="10" width="26" height="26" stroke="#0f172a" strokeWidth="6" fill="white" />
                <rect x="18" y="18" width="10" height="10" fill="#0f172a" />

                <rect x="64" y="10" width="26" height="26" stroke="#0f172a" strokeWidth="6" fill="white" />
                <rect x="72" y="18" width="10" height="10" fill="#0f172a" />

                <rect x="10" y="64" width="26" height="26" stroke="#0f172a" strokeWidth="6" fill="white" />
                <rect x="18" y="72" width="10" height="10" fill="#0f172a" />

                {/* Simulated Data matrix points */}
                <rect x="42" y="14" width="6" height="6" fill="#0f172a" />
                <rect x="52" y="20" width="6" height="6" fill="#0f172a" />
                <rect x="42" y="28" width="6" height="6" fill="#0f172a" />
                <rect x="48" y="44" width="6" height="6" fill="#0f172a" />
                <rect x="20" y="46" width="6" height="6" fill="#0f172a" />
                <rect x="32" y="48" width="6" height="6" fill="#0f172a" />
                <rect x="68" y="46" width="6" height="6" fill="#0f172a" />
                <rect x="80" y="52" width="6" height="6" fill="#0f172a" />
                <rect x="44" y="64" width="6" height="6" fill="#0f172a" />
                <rect x="54" y="74" width="6" height="6" fill="#0f172a" />
                <rect x="66" y="68" width="6" height="6" fill="#0f172a" />
                <rect x="76" y="80" width="6" height="6" fill="#0f172a" />
                <rect x="86" y="70" width="6" height="6" fill="#0f172a" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-slate-800 tracking-wider">
                {booking.transactionId}
              </p>
              <p className="text-[10px] text-slate-500">Scan at entrance scanner for contactless barrier lift</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handlePrint}
              className="py-2.5 px-3 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Pass</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onViewMyBookings();
              }}
              className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Go to My Bookings</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
