import { BarChart3, Bell, ClipboardList, LayoutDashboard, LogOut, PlusCircle, User as UserIcon, Users, type LucideIcon } from 'lucide-react';
import { Suspense } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { useAuth } from '../lib/auth';
import { initials } from '../lib/format';
import { NotificationsProvider, useNotifications } from '../lib/notifications';
import type { Role } from '../lib/types';
import { Logo } from './Logo';
import { PageSkeleton } from './Skeletons';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV: Record<Role, NavItem[]> = {
  CITIZEN: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/requests/new', label: 'New Request', icon: PlusCircle },
    { to: '/requests', label: 'My Requests', icon: ClipboardList },
    { to: '/profile', label: 'Profile', icon: UserIcon },
  ],
  ADMIN: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/requests', label: 'Requests', icon: ClipboardList },
    { to: '/users', label: 'Users', icon: Users },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  ],
};

export function AppLayout() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <NotificationsProvider>
      <Shell />
    </NotificationsProvider>
  );
}

function NotificationBell() {
  const { unread } = useNotifications();
  const { pathname } = useLocation();
  return (
    <Link
      to="/notifications"
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
      aria-current={pathname === '/notifications' ? 'page' : undefined}
      className={`relative grid h-10 w-10 place-items-center rounded-full transition hover:bg-slate-100 ${pathname === '/notifications' ? 'bg-brand-50 text-brand-700' : 'text-slate-600'}`}
    >
      <Bell size={20} aria-hidden />
      {unread > 0 && (
        <span className="absolute right-1 top-1 grid min-w-[18px] place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-[18px] text-white ring-2 ring-white">{unread > 99 ? '99+' : unread}</span>
      )}
    </Link>
  );
}

function Shell() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  if (!user) return null;

  const nav = NAV[user.role];
  const isActive = (to: string) =>
    to === '/requests' ? pathname === to || (pathname.startsWith('/requests/') && pathname !== '/requests/new') : pathname === to;

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col bg-navy-900 p-4 md:flex">
        <div className="px-2 py-3">
          <Logo light />
        </div>
        <nav aria-label="Main" className="mt-6 flex flex-1 flex-col gap-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              aria-current={isActive(to) ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive(to) ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <button onClick={logout} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10">
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <div className="md:pl-60">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:justify-end md:px-8">
          <div className="md:hidden">
            <Logo />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
          <NotificationBell />
          <Link to="/profile" className="flex items-center gap-3">
            <span className="hidden text-right leading-tight sm:block">
              <span className="block text-sm font-semibold text-slate-900">{user.fullName}</span>
              <span className="block text-xs text-slate-500">{user.role === 'ADMIN' ? 'Administrator' : 'Citizen'}</span>
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">{initials(user.fullName)}</span>
          </Link>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 pb-28 md:px-8 md:pb-10">
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t border-slate-200 bg-white md:hidden">
        {nav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            aria-current={isActive(to) ? 'page' : undefined}
            className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${isActive(to) ? 'text-brand-600' : 'text-slate-500'}`}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
