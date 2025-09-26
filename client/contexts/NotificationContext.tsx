import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import type { Database } from '@/lib/supabase';

type Notification = {
  id: string;
  type: 'message' | 'follow' | 'like' | 'comment';
  title: string;
  message: string;
  userId?: string;
  userName?: string;
  timestamp: Date;
  read: boolean;
};

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const realtimeSubscription = useRef<any>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep only last 10
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Set up real-time subscriptions for notifications
  useEffect(() => {
    if (!user) return;

    // Per-user channel with server-side filter: only messages where I'm the receiver
    realtimeSubscription.current = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const newMessage = payload.new as any;

          // Skip self messages (shouldn't happen due to filter, but safe)
          if (newMessage.sender_id === user.id) return;

          // Fetch sender display name for notification
          supabase
            .from('profiles')
            .select('name')
            .eq('user_id', newMessage.sender_id)
            .single()
            .then(({ data: profile }) => {
              addNotification({
                type: 'message',
                title: 'New Message',
                message: `${profile?.name || 'Someone'} sent you a message`,
                userId: newMessage.sender_id,
                userName: profile?.name,
              });
            });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'follows',
        },
        (payload) => {
          const newFollow = payload.new as any;
          
          // Only show notification if someone followed the current user
          if (newFollow.following_id === user.id) {
            supabase
              .from('profiles')
              .select('name')
              .eq('user_id', newFollow.follower_id)
              .single()
              .then(({ data: profile }) => {
                addNotification({
                  type: 'follow',
                  title: 'New Follower',
                  message: `${profile?.name || 'Someone'} started following you`,
                  userId: newFollow.follower_id,
                  userName: profile?.name,
                });
              });
          }
        }
      )
      .subscribe();

    return () => {
      if (realtimeSubscription.current) {
        supabase.removeChannel(realtimeSubscription.current);
        realtimeSubscription.current = null;
      }
    };
  }, [user]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    addNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
