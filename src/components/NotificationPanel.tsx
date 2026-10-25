import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  Car,
  Trash2,
  CheckCheck,
  X,
  Sparkles,
  ExternalLink,
  Volume2
} from 'lucide-react';
import { SmartNotification } from '../types';
import { soundManager } from '../utils/sound';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SmartNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onViewBooking?: (bookingId: string) => void;
  onSimulateReminder?: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onViewBooking,
  onSimulateReminder,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const getIconForType = (type: SmartNotification['type']) => {
    switch (type) {
      case 'registration':
      case 'booking_confirm':
      case 'booking_success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'time_reminder':
      case 'upcoming_reminder':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'expiry':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'payment':
        return <Receipt className="w-4 h-4 text-blue-600" />;
      case 'session_completed':
        return <Car className="w-4 h-4 text-indigo-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const getBadgeColor = (type: SmartNotification['type']) => {
    switch (type) {
      case 'time_reminder':
      case 'upcoming_reminder':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'expiry':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'payment':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'booking_confirm':
      case 'registration':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-tight">Smart Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Real-time driver alerts & booking reminders</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar & Actions */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredNotifications.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-400">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-600">No notifications found</p>
              <p className="text-xs max-w-xs">
                You will receive alerts here for booking confirmations, parking countdown reminders, and payment receipts.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => onMarkAsRead(notif.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                  notif.read
                    ? 'bg-white border-slate-200 text-slate-600'
                    : 'bg-blue-50/60 border-blue-200 text-slate-900 shadow-xs'
                }`}
              >
                {!notif.read && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-600"></span>
                )}

                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 p-1.5 rounded-lg bg-white shadow-xs border border-slate-100">
                    {getIconForType(notif.type)}
                  </div>

                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xs">{notif.title}</span>
                      <span
                        className={`text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded-sm border ${getBadgeColor(
                          notif.type
                        )}`}
                      >
                        {notif.type.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-[11px] leading-relaxed text-slate-600">{notif.message}</p>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.createdAt).toLocaleDateString()}</span>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {notif.bookingId && onViewBooking && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewBooking(notif.bookingId!);
                              onClose();
                            }}
                            className="text-blue-600 font-bold hover:underline flex items-center gap-0.5"
                          >
                            <span>Pass</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNotification(notif.id);
                          }}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Demo trigger footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2">
          <button
            onClick={() => {
              soundManager.play('success');
              soundManager.showDesktopNotification('🔔 Test Smart Notification', {
                body: 'Reservation PK-9988 Confirmed for Slot P-101. Arrive on time!',
              });
              if (onSimulateReminder) onSimulateReminder();
            }}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Test Notification & Audio Chime</span>
          </button>

          {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
            <button
              onClick={async () => {
                const p = await soundManager.requestNotificationPermission();
                if (p === 'granted') {
                  soundManager.showDesktopNotification('Desktop Notifications Enabled!', {
                    body: 'You will receive notifications on this laptop for all booking and slot events.',
                  });
                }
              }}
              className="w-full py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Enable Browser Desktop Alerts</span>
            </button>
          )}

          {onSimulateReminder && (
            <button
              onClick={onSimulateReminder}
              className="w-full py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Simulate Parking Expiry Reminder</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
