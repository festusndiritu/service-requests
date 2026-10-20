import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../lib/auth';
import type { Role } from '../lib/types';
import { AppLayout } from './AppLayout';
import { PageSkeleton, ShellSkeleton } from './Skeletons';

export function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <ShellSkeleton />;
  return user ? <AppLayout /> : <Navigate to="/login" replace />;
}

export function GuestOnly() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <PageSkeleton />
      </div>
    );
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

export function RequireRole({ role }: { role: Role }) {
  const { user } = useAuth();
  return user?.role === role ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
