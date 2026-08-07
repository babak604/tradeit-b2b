'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, Check, PackageCheck } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  deal_id: string;
}

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();

  // 1. Initial fetch & Real-time subscription
  useEffect(() => {
    // Fetch initial unread/recent notifications
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) setNotifications(data);
    };

    fetchNotifications();

    // Subscribe to incoming real-time notifications
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: NotificationItem }) => {
          const newNotif = payload.new as NotificationItem;
          setNotifications((prev) => [newNotif, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Mark a single notification as read
  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
  };

  // Mark all as read
  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
  };

  return (
    <div className="relative">
      {/* Bell Icon Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white p-4 shadow-xl z-50 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-indigo-500" /> Notifications
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-indigo-600 hover:underline dark:text-indigo-400 font-medium flex items-center gap-1"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2">
            {notifications.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && markAsRead(n.id)}
                  className={`p-3 rounded-lg text-xs cursor-pointer transition-colors border ${
                    n.read
                      ? 'bg-slate-50 border-slate-100 text-slate-600 dark:bg-slate-800/40 dark:border-slate-800 dark:text-slate-400'
                      : 'bg-indigo-50/50 border-indigo-100 text-slate-900 dark:bg-indigo-950/30 dark:border-indigo-900/50 dark:text-slate-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold mb-1 flex items-center gap-1.5">
                      <PackageCheck className="h-3.5 w-3.5 text-indigo-500" />
                      {n.title}
                    </p>
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-1">
                    {n.message}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    {new Date(n.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}