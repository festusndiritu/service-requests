import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useToast } from '../components/Toast';
import { api } from './api';

interface NotificationsValue {
  unread: number;
  setUnread: (n: number) => void;
}

const NotificationsContext = createContext<NotificationsValue>({ unread: 0, setUnread: () => {} });

const POLL_MS = 30_000;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [unread, setCount] = useState(0);
  const last = useRef<number | null>(null);
  const toast = useToast();

  const setUnread = useCallback((n: number) => {
    last.current = n;
    setCount(n);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { unread: n } = await api<{ unread: number }>('/notifications/unread-count');
      if (last.current !== null && n > last.current) toast(n - last.current === 1 ? 'You have a new notification' : `You have ${n - last.current} new notifications`);
      setUnread(n);
    } catch {
      /* offline or signed out: try again next tick */
    }
  }, [toast, setUnread]);

  useEffect(() => {
    refresh();
    const tick = () => document.visibilityState === 'visible' && refresh();
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [refresh]);

  return <NotificationsContext.Provider value={{ unread, setUnread }}>{children}</NotificationsContext.Provider>;
}

export const useNotifications = () => useContext(NotificationsContext);
