import { ClipboardList } from 'lucide-react';
import { lazy, Suspense, useEffect } from 'react';
import { Link } from 'react-router';
import { RequestRow } from '../components/RequestRow';
import { DonutSkeleton, OpenVsResolvedSkeleton, RequestListSkeleton, StatsGridSkeleton } from '../components/Skeletons';
import { OpenVsResolved, StatsGrid } from '../components/StatsGrid';
import { EmptyState, ErrorMessage, PageHeader } from '../components/ui';
import { useApi } from '../lib/hooks';
import type { DashboardData } from '../lib/types';

// The chart library is large, so it loads in its own file, in parallel with the data
const loadDonut = () => import('../components/CategoryDonut').then((m) => ({ default: m.CategoryDonut }));
const CategoryDonut = lazy(loadDonut);

export default function AdminDashboard() {
  const { data, error } = useApi<DashboardData>('/requests/dashboard');
  useEffect(() => void loadDonut(), []);

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of service requests" />
      {error && !data && <ErrorMessage>{error}</ErrorMessage>}

      {data ? <StatsGrid stats={data.stats} /> : <StatsGridSkeleton />}
      {data ? <OpenVsResolved stats={data.stats} /> : <OpenVsResolvedSkeleton />}

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <section className="card p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">Requests by category</h2>
          <p className="mb-4 text-xs text-slate-500">Last 30 days</p>
          <Suspense fallback={<DonutSkeleton />}>{data ? <CategoryDonut data={data.byCategory} /> : <DonutSkeleton />}</Suspense>
        </section>

        <section className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Latest requests</h2>
            <Link to="/requests" className="text-sm font-semibold text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          {data ? (
            <div className="card divide-y divide-slate-100 overflow-hidden">
              {data.recent.length === 0 ? (
                <EmptyState icon={ClipboardList} title="No requests yet" text="New citizen requests will show up here." />
              ) : (
                data.recent.map((r) => <RequestRow key={r.id} request={r} showSubmitter />)
              )}
            </div>
          ) : (
            <RequestListSkeleton count={6} />
          )}
        </section>
      </div>
    </>
  );
}
