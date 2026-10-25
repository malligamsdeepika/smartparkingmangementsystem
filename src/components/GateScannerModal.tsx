import React, { useState } from 'react';
import {
  X,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Car,
  ShieldCheck,
  Zap,
  RefreshCw,
  LogOut,
  LogIn,
  Receipt,
  FileText
} from 'lucide-react';
import { Booking, ParkingSession } from '../types';
import { StorageService } from '../utils/storage';

interface GateScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionUpdated: () => void;
  activeBookings: Booking[];
}

export const GateScannerModal: React.FC<GateScannerModalProps> = ({
  isOpen,
  onClose,
  onSessionUpdated,
  activeBookings,
}) => {
  const [mode, setMode] = useState<'ENTRY' | 'EXIT'>('ENTRY');
  const [qrInput, setQrInput] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'warning' | null;
    title: string;
    description: string;
    details?: any;
  }>({ type: null, title: '', description: '' });
  const [isScanning, setIsScanning] = useState(false);

  if (!isOpen) return null;

  const handleProcessScan = (codeToTest?: string) => {
    const targetCode = (codeToTest || qrInput).trim();
    if (!targetCode) return;

    setIsScanning(true);
    setStatusMessage({ type: null, title: '', description: '' });

    setTimeout(() => {
      setIsScanning(false);

      if (mode === 'ENTRY') {
        const res = StorageService.verifyGateCheckIn(targetCode);
        if (res.success) {
          setStatusMessage({
            type: 'success',
            title: 'Entry Gate Opened: Boom Barrier Raised',
            description: res.message,
            details: {
              slot: res.booking?.slotNumber,
              vehicle: res.booking?.vehicleNumber,
              entryTime: new Date().toLocaleTimeString(),
              facility: res.booking?.locationName,
            },
          });
          onSessionUpdated();
        } else {
          setStatusMessage({
            type: 'error',
            title: 'Gate Entry Denied',
            description: res.message,
          });
        }
      } else {
        // EXIT MODE
        const res = StorageService.verifyGateCheckOut(targetCode);
        if (res.success) {
          setStatusMessage({
            type: res.extraFee > 0 ? 'warning' : 'success',
            title: res.extraFee > 0 ? 'Exit Cleared (Overtime Billed)' : 'Exit Cleared: Safe Travels!',
            description: res.message,
            details: {
              slot: res.booking?.slotNumber,
              vehicle: res.booking?.vehicleNumber,
              overtimeMinutes: res.overtimeMinutes,
              extraFee: res.extraFee,
              totalFee: res.totalFee,
            },
          });
          onSessionUpdated();
        } else {
          setStatusMessage({
            type: 'error',
            title: 'Exit Gate Verification Failed',
            description: res.message,
          });
        }
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col">
        {/* Terminal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center">
              <QrCode className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">Smart Gate QR Entry & Exit Terminal</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400 text-slate-950">
                  Live Gate Scanner
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Automated optical pass verification, anti-duplicate entry, and overtime billing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs (Check-in vs Check-out) */}
        <div className="grid grid-cols-2 p-2 bg-slate-100 border-b border-slate-200">
          <button
            onClick={() => {
              setMode('ENTRY');
              setStatusMessage({ type: null, title: '', description: '' });
            }}
            className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'ENTRY'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-4 h-4 text-emerald-600" />
            <span>Gate Entry (Check-In)</span>
          </button>
          <button
            onClick={() => {
              setMode('EXIT');
              setStatusMessage({ type: null, title: '', description: '' });
            }}
            className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'EXIT'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Gate Exit (Check-Out)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* QR Scanner Simulation Area */}
          <div className="relative rounded-2xl bg-slate-900 border border-slate-700 p-6 flex flex-col items-center justify-center text-white overflow-hidden min-h-[200px]">
            {/* Target Reticle */}
            <div className="relative w-36 h-36 border-2 border-dashed border-cyan-400 rounded-2xl flex items-center justify-center p-3">
              <QrCode className="w-24 h-24 text-slate-600 animate-pulse" />
              {/* Corner brackets */}
              <span className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></span>
              <span className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></span>
              <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></span>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></span>

              {/* Laser scanning bar */}
              {isScanning && (
                <div className="absolute left-2 right-2 h-1 bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-bounce"></div>
              )}
            </div>

            <p className="text-xs text-slate-300 mt-3 font-medium">
              {mode === 'ENTRY'
                ? 'Point Driver QR Pass at Scanner Lens'
                : 'Scan Driver QR Pass for Exit Clearance'}
            </p>
          </div>

          {/* Quick Test Bar with Active Reservations */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Quick Test: Select from system reservations
            </label>
            <div className="flex flex-wrap gap-1.5">
              {activeBookings.slice(0, 4).map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setQrInput(b.id);
                    handleProcessScan(b.id);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 text-xs font-medium transition-all text-slate-700 cursor-pointer"
                >
                  <span className="font-bold">{b.id}</span> ({b.slotNumber} - {b.vehicleNumber})
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input Form */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Or enter Booking ID / QR string (e.g. PK-94281)"
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <button
              onClick={() => handleProcessScan()}
              disabled={isScanning || !qrInput.trim()}
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>Verify & Open Gate</span>
            </button>
          </div>

          {/* Result Status Box */}
          {statusMessage.type && (
            <div
              className={`p-4 rounded-xl border space-y-2 animate-in fade-in-50 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : statusMessage.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : statusMessage.type === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                )}
                <span className="font-bold text-sm">{statusMessage.title}</span>
              </div>
              <p className="text-xs leading-relaxed">{statusMessage.description}</p>

              {statusMessage.details && (
                <div className="mt-2 pt-2 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Assigned Bay:</span>
                    <span className="font-bold">{statusMessage.details.slot}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Vehicle:</span>
                    <span className="font-bold">{statusMessage.details.vehicle}</span>
                  </div>
                  {statusMessage.details.entryTime && (
                    <div>
                      <span className="text-slate-500 block">Entry Time:</span>
                      <span className="font-bold">{statusMessage.details.entryTime}</span>
                    </div>
                  )}
                  {statusMessage.details.extraFee !== undefined && (
                    <div>
                      <span className="text-slate-500 block">Overtime Tariff:</span>
                      <span className="font-bold text-rose-600">₹{statusMessage.details.extraFee}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Close Terminal
          </button>
        </div>
      </div>
    </div>
  );
};
