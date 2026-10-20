import { Bell, CheckCheck, ClipboardCheck, FilePlus2, type LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../lib/api';
import { timeAgo } from '../lib/format';
import { useNotifications } from '../lib/notifications';
import type { NotificationItem, NotificationPage, NotificationType } from '../lib/types';
import { NotificationsSkeleton } from '../components/Skeletons';
import { EmptyState, ErrorMessage, PageHeader } from '../components/ui';

const PAGE_SIZE = 15;

const TYPE: Record<NotificationType, { icon: LucideIcon; tint: string }> = {
  REQUEST_SUBMITTED: { icon: FilePlus2, tint: 'bg-blue-50 text-blue-600' },
  STATUS_CHANGED: { icon: ClipboardCheck, tint: 'bg-brand-50 text-brand-600' },
};

export default function Notifications() {
  const navigate = useNavigate();
  const { unread, setUnread } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const fetchPage = useCallback((p: number, f: 'all' | 'unread') => api<NotificationPage>(`/notifications?page=${p}&pageSize=${PAGE_SIZE}&unreadOnly=${f === 'unread'}`), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPage(1, filter)
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setTotal(res.total);
        setPage(1);
        setUnread(res.unread);
        setError('');
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filter, fetchPage, setUnread]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const res = await fetchPage(page + 1, filter);
      setItems((all) => [...all, ...res.items.filter((n) => !all.some((a) => a.id === n.id))]);
      setPage(page + 1);
      setTotal(res.total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingMore(false);
    }
  }

  async function open(n: NotificationItem) {
    if (!n.readAt) {
      setItems((all) => all.map((a) => (a.id === n.id ? { ...a, readAt: new Date().toISOString() } : a)));
      api<{ unread: number }>(`/notifications/${n.id}/read`, { method: 'PATCH' })
        .then((res) => setUnread(res.unread))
        .catch(() => {});
    }
    if (n.requestId) navigate(`/requests/${n.requestId}`);
  }

  async function markAllRead() {
    try {
      const res = await api<{ unread: number }>('/notifications/read-all', { method: 'POST' });
      setUnread(res.unread);
      const now = new Date().toISOString();
      if (filter === 'unread') {
        setItems([]);
        setTotal(0);
      } else {
        setItems((all) => all.map((a) => ({ ...a, readAt: a.readAt ?? now })));
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <>
      <PageHeader title="Notifications" subtitle="Updates on your requests, as they happen." />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Filter notifications" className="inline-flex rounded-lg bg-slate-100 p-1 text-sm font-medium">
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-4 py-1.5 capitalize transition ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {f}
              {f === 'unread' && unread > 0 && <span className="ml-1.5 rounded-full bg-brand-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">{unread}</span>}
            </button>
          ))}
        </div>
        <button onClick={markAllRead} disabled={unread === 0} className="btn-outline px-3 py-2">
          <CheckCheck size={16} aria-hidden /> Mark all as read
        </button>
      </div>

      <ErrorMessage>{error}</ErrorMessage>

      <div className="card overflow-hidden">
        {loading ? (
          <ul className="divide-y divide-slate-100" role="status" aria-busy="true">
            <li className="sr-only">Loading notifications…</li>
            <NotificationsSkeleton />
          </ul>
        ) : items.length === 0 ? (
          <EmptyState icon={Bell} title={filter === 'unread' ? "You're all caught up" : 'No notifications yet'} text={filter === 'unread' ? 'Nothing unread right now.' : 'When a request is submitted or its status changes, you will see it here.'} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((n) => {
              const { icon: Icon, tint } = TYPE[n.type];
              return (
                <li key={n.id}>
                  <button onClick={() => open(n)} className={`flex w-full items-start gap-4 px-4 py-4 text-left transition hover:bg-slate-50 sm:px-5 ${n.readAt ? '' : 'bg-brand-50/40'}`}>
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tint}`}>
                      <Icon size={18} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className={`text-sm ${n.readAt ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>{n.title}</span>
                        <span className="flex shrink-0 items-center gap-2 text-xs text-slate-400">
                          {timeAgo(n.createdAt)}
                          {!n.readAt && <span className="h-2 w-2 rounded-full bg-brand-600" aria-label="Unread" />}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-sm text-slate-500">{n.body}</span>
                    </span>
                  </button>
                </li>
              );
            })}
            {loadingMore && <NotificationsSkeleton count={3} />}
          </ul>
        )}
      </div>

      {!loading && items.length < total && (
        <div className="mt-4 text-center">
          <button onClick={loadMore} disabled={loadingMore} className="btn-outline px-5">
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </>
  );
}
