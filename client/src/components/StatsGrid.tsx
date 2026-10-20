import { CheckCircle2, ClipboardList, Clock, Loader } from 'lucide-react';
import { Link } from 'react-router';
import { STATUS } from '../lib/constants';
import type { Stats } from '../lib/types';

export function StatsGrid({ stats }: { stats: Stats }) {
  const cards = [
    { label: 'Total Requests', value: stats.total, icon: ClipboardList, tone: 'bg-blue-50 text-blue-600', to: '/requests' },
    { label: 'Pending', value: stats.pending, icon: Clock, tone: 'bg-amber-50 text-amber-600', to: '/requests?status=PENDING' },
    { label: 'In Progress', value: stats.inProgress, icon: Loader, tone: 'bg-violet-50 text-violet-600', to: '/requests?status=IN_PROGRESS' },
    { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600', to: '/requests?status=RESOLVED' },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, tone, to }) => (
        <Link key={label} to={to} className="card flex items-center gap-4 p-4 transition hover:border-slate-300 hover:shadow sm:p-5">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
            <Icon size={22} aria-hidden />
          </span>
          <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function OpenVsResolved({ stats }: { stats: Stats }) {
  const open = stats.pending + stats.inProgress;
  const rate = stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0;
  const segments = [
    { key: 'PENDING', count: stats.pending, bar: 'bg-amber-400' },
    { key: 'IN_PROGRESS', count: stats.inProgress, bar: 'bg-blue-500' },
    { key: 'RESOLVED', count: stats.resolved, bar: 'bg-emerald-500' },
  ] as const;

  return (
    <section className="card mt-6 p-5" aria-label="Open versus resolved requests">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Open vs resolved</h2>
          <p className="text-sm text-slate-500">
            {open} open · {stats.resolved} resolved
          </p>
        </div>
        <p className="text-sm text-slate-600">
          <span className="text-2xl font-bold text-slate-900">{rate}%</span> resolved
        </p>
      </div>
      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${stats.pending} pending, ${stats.inProgress} in progress, ${stats.resolved} resolved`}>
        {segments.map((s) => (
          <div key={s.key} className={s.bar} style={{ width: `${stats.total ? (s.count / stats.total) * 100 : 0}%` }} />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${s.bar}`} aria-hidden />
            {STATUS[s.key].label} · {s.count}
          </li>
        ))}
      </ul>
    </section>
  );
}
