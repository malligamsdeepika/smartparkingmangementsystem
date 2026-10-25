import React, { useState } from 'react';
import {
  Wrench,
  User,
  ShieldCheck,
  Calculator,
  GraduationCap,
  RotateCcw,
  Sparkles,
  ChevronUp,
  ChevronDown,
  X,
  FileCheck2,
  Share2,
  Bell,
  Volume2
} from 'lucide-react';
import { User as UserType } from '../types';
import { StorageService } from '../utils/storage';
import { soundManager } from '../utils/sound';
import { RealtimeSync } from '../services/realtimeSync';

interface TestingHelperWidgetProps {
  currentUser: UserType | null;
  onLoginAs: (role: 'user' | 'admin') => void;
  onOpenFeeCalc: () => void;
  onOpenDocs: () => void;
  onOpenMultiDevice?: () => void;
  onResetData: () => void;
}

export const TestingHelperWidget: React.FC<TestingHelperWidgetProps> = ({
  currentUser,
  onLoginAs,
  onOpenFeeCalc,
  onOpenDocs,
  onOpenMultiDevice,
  onResetData,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const handleTriggerLiveAlert = async () => {
    // Only play sound and show desktop alert on the admin screen
    if (currentUser?.role === 'admin') {
      soundManager.play('admin');
      soundManager.showDesktopNotification('🔔 Live Slot Booking Alert', {
        body: 'Bay: G-05 | Vehicle: DL 08 CC 9999 | Driver: Vikram Malhotra | Status: Confirmed',
      });
    }

    const bId = `BK-${Date.now().toString().slice(-5)}`;
    const currentTimeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const payload = {
      bookingId: bId,
      userName: 'Vikram Malhotra',
      vehicleNumber: 'DL 08 CC 9999',
      locationName: 'Central Parking Facility',
      floor: 'Ground Floor',
      slotId: 'slot-loc1-5',
      slotNumber: 'G-05',
      bookingTime: currentTimeFormatted,
      paymentStatus: 'Paid',
      amount: 40,
      status: 'Confirmed',
    };

    // Save to storage
    StorageService.addAdminNotification({
      title: 'New Parking Booking Received',
      message: `User: Vikram Malhotra | Vehicle: DL 08 CC 9999 | Location: Central Parking Facility | Floor: Ground Floor | Slot: G-05 | Time: ${currentTimeFormatted} | Payment: Paid`,
      type: 'new_booking',
      relatedEntityId: bId,
      metadata: payload,
    });

    // Broadcast across network to Admin Console on Laptop B
    try {
      await RealtimeSync.broadcast('NEW_BOOKING', payload);
    } catch {}

    // Dispatch locally only if admin is logged in
    if (currentUser?.role === 'admin') {
      window.dispatchEvent(
        new CustomEvent('smartparking:admin-notification', { detail: payload })
      );
    }

    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {isOpen ? (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 w-80 space-y-3 animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
              <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                <Wrench className="w-3.5 h-3.5" />
              </div>
              <span>Testing & Evaluation Hub</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              title="Close widget"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-500 leading-tight">
            Use these shortcuts to test driver reservations, admin management, fee estimation, and test cases.
          </p>

          {/* 1-Click Persona Switcher */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Account Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onLoginAs('user');
                }}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  currentUser && currentUser.role === 'user'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Driver Login</span>
              </button>

              <button
                onClick={() => {
                  onLoginAs('admin');
                }}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  currentUser && currentUser.role === 'admin'
                    ? 'bg-slate-900 text-amber-300 shadow-sm'
                    : 'bg-slate-800 text-amber-300 hover:bg-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Login</span>
              </button>
            </div>
            {currentUser && (
              <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 pt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Active: {currentUser.name} ({currentUser.role})</span>
              </p>
            )}
          </div>

          {/* Quick Tool Links */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Alerts & Verification
            </span>
            <div className="space-y-1.5">
              <button
                onClick={handleTriggerLiveAlert}
                className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs flex items-center justify-between transition-all cursor-pointer shadow-md shadow-orange-500/20 active:scale-95"
              >
                <span className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 fill-slate-950" />
                  <span>{testSent ? 'Alert Dispatched!' : 'Ring & Test Alert Notification'}</span>
                </span>
                <span className="text-[10px] text-white font-black bg-slate-900 px-1.5 py-0.5 rounded">
                  Chime + Toast
                </span>
              </button>

              {onOpenMultiDevice && (
                <button
                  onClick={onOpenMultiDevice}
                  className="w-full py-1.5 px-2.5 rounded-xl bg-blue-50/80 hover:bg-blue-100 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Open on 2nd PC / Mobile</span>
                  </span>
                  <span className="text-[10px] text-blue-700 font-bold bg-white px-1.5 py-0.5 rounded shadow-2xs">
                    Link & Wi-Fi
                  </span>
                </button>
              )}

              <button
                onClick={onOpenFeeCalc}
                className="w-full py-1.5 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tariff Calculator (₹20/hr)</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                  Live
                </span>
              </button>

              <button
                onClick={onOpenDocs}
                className="w-full py-1.5 px-2.5 rounded-xl bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200 text-indigo-900 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Test Cases & MySQL/Java</span>
                </span>
                <span className="text-[10px] text-indigo-700 font-bold bg-white px-1.5 py-0.5 rounded">
                  7 Tests
                </span>
              </button>

              <button
                onClick={onResetData}
                className="w-full py-1.5 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 text-rose-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span>Reset Demo State (Seed Data)</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-xl border border-slate-700 text-xs font-bold transition-all hover:scale-105 cursor-pointer"
          title="Open Testing Helper Tools"
        >
          <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
            <Wrench className="w-3 h-3" />
          </div>
          <span>Testing Helper Tools</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
        </button>
      )}
    </div>
  );
};
