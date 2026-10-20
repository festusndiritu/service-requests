import { ClipboardList, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { RequestRow } from '../components/RequestRow';
import { StatsGrid } from '../components/StatsGrid';
import { RequestListSkeleton, StatsGridSkeleton } from '../components/Skeletons';
import { EmptyState, ErrorMessage } from '../components/ui';
import { useAuth } from '../lib/auth';
import { greeting } from '../lib/format';
import { useApi, useDocumentTitle } from '../lib/hooks';
import type { DashboardData } from '../lib/types';

export default function CitizenDashboard() {
  const { user } = useAuth();
  useDocumentTitle('Dashboard');
  const { data, error } = useApi<DashboardData>('/requests/dashboard');

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting()}, {user?.fullName.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Here's what's happening with your requests.</p>
        </div>
        <Link to="/requests/new" className="btn-primary">
          <Plus size={18} /> New request
        </Link>
      </div>

      {error && !data && <ErrorMessage>{error}</ErrorMessage>}
      {data ? <StatsGrid stats={data.stats} /> : <StatsGridSkeleton />}

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent requests</h2>
          <Link to="/requests" className="text-sm font-semibold text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        {data ? (
          <div className="card divide-y divide-slate-100 overflow-hidden">
            {data.recent.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No requests yet"
                text="Report a broken streetlight, water issue or missed garbage collection and track it here."
                action={
                  <Link to="/requests/new" className="btn-primary">
                    Submit your first request
                  </Link>
                }
              />
            ) : (
              data.recent.map((r) => <RequestRow key={r.id} request={r} />)
            )}
          </div>
        ) : (
          <RequestListSkeleton />
        )}
      </section>
    </>
  );
}
