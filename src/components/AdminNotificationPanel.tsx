import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Car,
  Trash2,
  CheckCheck,
  X,
  Sparkles,
  CalendarCheck,
  UserPlus,
  AlertOctagon,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Filter
} from 'lucide-react';
import { AdminNotification, AdminNotificationType } from '../types';

interface AdminNotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AdminNotification[];
  unreadCount: number;
  isLoading?: boolean;
  errorMessage?: string | null;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onViewAllNotifications?: () => void;
  onViewBooking?: (bookingId: string) => void;
  onRefresh?: () => void;
}

export const AdminNotificationPanel: React.FC<AdminNotificationPanelProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  isLoading = false,
  errorMessage = null,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onViewAllNotifications,
  onViewBooking,
  onRefresh,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  if (!isOpen) return null;

  // Filter list
  let displayed = notifications;
  if (filter === 'unread') {
    displayed = displayed.filter((n) => !n.isRead && !n.read);
  }
  if (typeFilter !== 'all') {
    displayed = displayed.filter((n) => n.type === typeFilter);
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case 'new_booking':
        return <CalendarCheck className="w-4 h-4 text-emerald-600" />;
      case 'booking_cancellation':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'payment_update':
      case 'payment_success':
        return <Receipt className="w-4 h-4 text-blue-600" />;
      case 'slot_update':
        return <Car className="w-4 h-4 text-indigo-600" />;
      case 'user_registration':
        return <UserPlus className="w-4 h-4 text-purple-600" />;
      case 'capacity_alert':
        return <AlertOctagon className="w-4 h-4 text-rose-600" />;
      case 'system_alert':
        return <ShieldAlert className="w-4 h-4 text-red-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'new_booking':
        return { label: 'New Booking', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'booking_cancellation':
        return { label: 'Cancellation', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'payment_update':
      case 'payment_success':
        return { label: 'Payment', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'slot_update':
        return { label: 'Slot Update', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'user_registration':
        return { label: 'New User', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'capacity_alert':
        return { label: 'Capacity Alert', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'system_alert':
        return { label: 'System Alert', bg: 'bg-red-50 text-red-700 border-red-200' };
      default:
        return { label: 'Event', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const formatTimestamp = (dateStr: string): { relative: string; full: string } => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { relative: '', full: String(dateStr) };

      const now = Date.now();
      const diffSecs = Math.floor((now - d.getTime()) / 1000);

      let relative = '';
      if (diffSecs < 60) relative = 'Just now';
      else if (diffSecs < 3600) relative = `${Math.floor(diffSecs / 60)}m ago`;
      else if (diffSecs < 86400) relative = `${Math.floor(diffSecs / 3600)}h ago`;
      else relative = `${Math.floor(diffSecs / 86400)}d ago`;

      const formattedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const formattedDate = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

      return { relative, full: `${formattedDate} at ${formattedTime}` };
    } catch {
      return { relative: '', full: String(dateStr) };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Panel Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight text-white">Admin Console Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white shadow-xs">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Real-time alerts for bookings, payments, bays & system events</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onRefresh && (
              <button
                onClick={onRefresh}
                title="Refresh notifications"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors cursor-pointer border border-blue-200"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>

        {/* Category Pills Filter */}
        <div className="px-3 py-2 bg-white border-b border-slate-100 flex items-center gap-1 overflow-x-auto text-[11px]">
          {[
            { id: 'all', label: 'All Types' },
            { id: 'new_booking', label: 'Bookings' },
            { id: 'booking_cancellation', label: 'Cancellations' },
            { id: 'payment_update', label: 'Payments' },
            { id: 'slot_update', label: 'Slots' },
            { id: 'capacity_alert', label: 'Capacity' },
            { id: 'user_registration', label: 'Registrations' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setTypeFilter(cat.id)}
              className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                typeFilter === cat.id
                  ? 'bg-blue-100 text-blue-800 font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 mx-3 mt-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="font-bold underline text-rose-700 hover:text-rose-900 cursor-pointer text-xs"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {isLoading && displayed.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs font-semibold text-slate-500">Loading administrator notifications...</p>
            </div>
          ) : displayed.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <Bell className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700">No notifications found</p>
                <p className="text-xs text-slate-500 max-w-xs">
                  {filter === 'unread'
                    ? 'All caught up! There are no unread administrator alerts right now.'
                    : 'System alerts for bookings, cancellations, payments, and slot updates will appear here automatically.'}
                </p>
              </div>
            </div>
          ) : (
            displayed.map((notif) => {
              const isUnread = !notif.isRead && !notif.read;
              const badge = getTypeBadge(notif.type);
              const time = formatTimestamp(notif.createdAt);

              return (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-2xl border transition-all relative group ${
                    isUnread
                      ? 'bg-blue-50/70 border-blue-200/90 text-slate-900 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Event Type Icon */}
                    <div className="mt-0.5 p-2 rounded-xl bg-white shadow-xs border border-slate-200/80 shrink-0">
                      {getIconForType(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${badge.bg}`}
                          >
                            {badge.label}
                          </span>
                          {isUnread && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[9px] font-extrabold">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                              <span>Unread</span>
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap" title={time.full}>
                          {time.relative || time.full}
                        </span>
                      </div>

                      <h4 className={`text-xs font-bold leading-snug mb-1.5 ${isUnread ? 'text-slate-900' : 'text-slate-800'}`}>
                        {notif.title}
                      </h4>

                      {notif.message.includes(' | ') ? (
                        <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80 mb-2 space-y-1 text-[11px]">
                          {notif.message.split(' | ').map((part, pIdx) => {
                            const [k, ...v] = part.split(': ');
                            return (
                              <div key={pIdx} className="flex items-baseline justify-between gap-2">
                                <span className="text-slate-400 font-semibold">{k}:</span>
                                <span className="font-bold text-slate-800 text-right">{v.join(': ')}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[11px] leading-relaxed text-slate-600 mb-2">
                          {notif.message}
                        </p>
                      )}

                      {/* Metadata / Related Entity ID */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-[10px]">
                        <div className="flex items-center gap-2 text-slate-400">
                          {notif.relatedEntityId && (
                            <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                              Ref: {notif.relatedEntityId}
                            </span>
                          )}
                          <span>{time.full}</span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5">
                          {(notif.bookingId || notif.relatedEntityId) && onViewBooking && (
                            <button
                              onClick={() => {
                                onViewBooking(notif.bookingId || notif.relatedEntityId || '');
                                onClose();
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                              title="Inspect this booking in All Bookings"
                            >
                              <ExternalLink className="w-3 h-3 text-slate-500" />
                              <span>View Booking</span>
                            </button>
                          )}

                          {isUnread && (
                            <button
                              onClick={() => onMarkAsRead(notif.id)}
                              className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 rounded-md font-bold text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                              title="Mark this notification as read"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Mark Read</span>
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteNotification(notif.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete notification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Panel Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Real-time admin sync & polling active</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onViewAllNotifications && (
              <button
                onClick={() => {
                  onViewAllNotifications();
                  onClose();
                }}
                className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View All in Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
