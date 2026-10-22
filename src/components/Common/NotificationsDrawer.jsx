import React, { useState } from 'react';
import { 
  Bell, X, Trophy, UserCheck, Users, Building, ShieldCheck, 
  CheckCheck, Trash2, ArrowRight, Sparkles, Check, Clock, 
  Calendar, Zap, AlertCircle, RefreshCw 
} from 'lucide-react';

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'Just now';
  const timestamp = new Date(dateStr).getTime();
  if (isNaN(timestamp)) return 'Just now';
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const getNotificationMeta = (type) => {
  switch (type) {
    case 'tournament_request':
      return {
        icon: Trophy,
        bg: 'bg-amber-50 border-amber-200 text-amber-800',
        iconColor: 'text-amber-600',
        badge: 'Tournament Request',
        hint: 'View Pending Tournaments'
      };
    case 'player_request':
    case 'player_status':
      return {
        icon: UserCheck,
        bg: 'bg-blue-50 border-blue-200 text-blue-800',
        iconColor: 'text-blue-600',
        badge: 'Player ID Proof',
        hint: 'Review Player Proof'
      };
    case 'organizer_request':
    case 'organizer_status':
      return {
        icon: Building,
        bg: 'bg-purple-50 border-purple-200 text-purple-800',
        iconColor: 'text-purple-600',
        badge: 'Organizer Admission',
        hint: 'Review Organizer'
      };
    case 'tournament_status':
      return {
        icon: Trophy,
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        iconColor: 'text-emerald-600',
        badge: 'Tournament Status',
        hint: 'View My Tournaments'
      };
    case 'registration_status':
      return {
        icon: ShieldCheck,
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        iconColor: 'text-emerald-600',
        badge: 'Registration Update',
        hint: 'View My Teams'
      };
    case 'team_invitation':
      return {
        icon: Users,
        bg: 'bg-indigo-50 border-indigo-200 text-indigo-800',
        iconColor: 'text-indigo-600',
        badge: 'Roster Invitation',
        hint: 'View Invitations'
      };
    case 'match_fixtures':
      return {
        icon: Zap,
        bg: 'bg-rose-50 border-rose-200 text-rose-800',
        iconColor: 'text-[#8B0000]',
        badge: 'Match Fixtures',
        hint: 'Open Match Center'
      };
    default:
      return {
        icon: Bell,
        bg: 'bg-slate-50 border-slate-200 text-slate-800',
        iconColor: 'text-[#8B0000]',
        badge: 'System Alert',
        hint: 'Open Dashboard'
      };
  }
};

export default function NotificationsDrawer({
  isOpen,
  onClose,
  notifications = [],
  unreadCount = 0,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  onNavigate,
  onRefresh,
  loading = false
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  if (!isOpen) return null;

  const displayedNotifications = filter === 'unread'
    ? notifications.filter(n => n.unread)
    : notifications;

  const handleCardClick = (notification) => {
    if (notification.unread && onMarkRead) {
      onMarkRead(notification.id || notification._id);
    }
    if (notification.actionNav && onNavigate) {
      onNavigate(notification.actionNav);
      if (onClose) onClose();
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/40 z-50 backdrop-blur-[2px] transition-opacity duration-300"
      />

      {/* Slide-in Drawer */}
      <aside 
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#FFFFFF] border-l border-[#E5E7EB] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 ease-out"
        aria-label="Notifications panel"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] bg-[#FAF8F5]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#8B0000]/10 border border-[#8B0000]/20 flex items-center justify-center text-[#8B0000]">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-sm font-black text-[#1F2937]">Notifications</h2>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#8B0000] text-white text-[10px] font-black tracking-wide">
                      {unreadCount} NEW
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#6B7280]">Real-time tournament & player activity alerts</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#8B0000] hover:bg-[#8B0000]/5 transition-colors"
                  title="Refresh Notifications"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#8B0000]' : ''}`} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#8B0000] hover:bg-[#8B0000]/5 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter & Bulk Actions Bar */}
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#E5E7EB]/60">
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filter === 'all'
                    ? 'bg-[#8B0000] text-white shadow-xs'
                    : 'text-[#4B5563] hover:bg-[#E5E7EB]/60'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filter === 'unread'
                    ? 'bg-[#8B0000] text-white shadow-xs'
                    : 'text-[#4B5563] hover:bg-[#E5E7EB]/60'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {unreadCount > 0 && onMarkAllRead && (
                <button
                  onClick={onMarkAllRead}
                  className="text-[11px] font-bold text-[#8B0000] hover:text-[#6B0000] flex items-center space-x-1"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              {notifications.length > 0 && onClearAll && (
                <button
                  onClick={onClearAll}
                  className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 flex items-center space-x-1 ml-2"
                  title="Clear notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Notification Cards List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-transparent">
          {displayedNotifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 my-auto">
              <div className="w-14 h-14 rounded-2xl bg-[#8B0000]/8 border border-[#8B0000]/15 flex items-center justify-center text-[#8B0000]/60">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#1F2937]">You're all caught up!</h3>
                <p className="text-xs text-[#6B7280] max-w-[220px] mt-1 leading-relaxed">
                  {filter === 'unread' 
                    ? 'No unread notifications right now.' 
                    : 'Activity on tournaments, player proofs, and registrations will appear here.'}
                </p>
              </div>
            </div>
          ) : (
            displayedNotifications.map((n) => {
              const meta = getNotificationMeta(n.type);
              const IconComponent = meta.icon;

              return (
                <div
                  key={n.id || n._id}
                  onClick={() => handleCardClick(n)}
                  className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    n.unread
                      ? 'bg-[#FFF7F7] border-[#8B0000]/40 shadow-xs hover:border-[#8B0000] hover:shadow-md'
                      : 'bg-[#FFFFFF] border-[#E5E7EB] hover:border-slate-300 opacity-85 hover:opacity-100'
                  }`}
                >
                  {/* Unread dot indicator */}
                  {n.unread && (
                    <span 
                      className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-[#8B0000] ring-4 ring-[#8B0000]/15 animate-pulse" 
                      title="Unread" 
                    />
                  )}

                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${meta.bg}`}>
                      <IconComponent className={`w-4 h-4 ${meta.iconColor}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#8B0000]">
                          {meta.badge}
                        </span>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="text-[10px] text-slate-400 font-medium flex items-center">
                          <Clock className="w-2.5 h-2.5 mr-0.5 inline" />
                          {formatTimeAgo(n.createdAt)}
                        </span>
                      </div>

                      <h4 className="text-xs font-black text-[#1F2937] mt-0.5 leading-snug">
                        {n.title}
                      </h4>

                      <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                        {n.message}
                      </p>

                      {/* Navigation CTA button / hint */}
                      {n.actionNav && (
                        <div className="mt-2.5 flex items-center space-x-1.5 text-[11px] font-bold text-[#8B0000] group-hover:underline">
                          <span>{meta.hint}</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Individual Mark as Read quick trigger */}
                  {n.unread && onMarkRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkRead(n.id || n._id);
                      }}
                      className="absolute bottom-3 right-3 p-1 rounded-md text-slate-400 hover:text-[#8B0000] hover:bg-[#8B0000]/10 transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#E5E7EB] bg-[#FAF8F5] flex items-center justify-between text-xs">
          <span className="text-[11px] text-[#6B7280]">
            ArenaX Real-time Notification Feed
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold text-[#4B5563] hover:text-[#8B0000] hover:border-[#8B0000]/30 transition-all shadow-2xs"
          >
            Close Panel
          </button>
        </div>
      </aside>
    </>
  );
}
