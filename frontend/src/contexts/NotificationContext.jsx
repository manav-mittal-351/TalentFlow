// ─── contexts/NotificationContext.jsx ─────────────────────────────────────────
// Global In-app notifications context. Retrieves unread counters, notification lists,
// and maps events to react-hot-toast popups.

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import api from '../services/api.js';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const pollIntervalRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.data?.count ?? 0);
    } catch (err) {
      console.error('Failed to fetch unread notifications count:', err);
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.data?.notifications ?? []);
    } catch (err) {
      console.error('Failed to fetch notifications list:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      // Update local state for immediate feedback
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      toast.success('Notification marked as read');
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      toast.error('Failed to update notification state');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Start polling when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      fetchNotifications();

      // Poll every 30 seconds for new alerts
      pollIntervalRef.current = setInterval(() => {
        fetchUnreadCount();
        fetchNotifications();
      }, 30000);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isAuthenticated, fetchNotifications, fetchUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        refetchNotifications: () => {
          fetchUnreadCount();
          fetchNotifications();
        },
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
