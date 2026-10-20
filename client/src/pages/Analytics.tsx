import { useState, type ReactNode } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Select } from '../components/Select';
import { AnalyticsSkeleton } from '../components/Skeletons';
import { ErrorMessage, PageHeader } from '../components/ui';
import { CATEGORY } from '../lib/constants';
import { formatDuration, shortDate } from '../lib/format';
import { useApi } from '../lib/hooks';
import type { Analytics as AnalyticsData, Stats } from '../lib/types';

const RANGES = [7, 30, 90];
const SUBMITTED_COLOR = '#2563eb';
const RESOLVED_COLOR = '#0d9488';

function Delta({ current, previous, days }: { current: number; previous: number; days: number }) {
  if (previous === 0) return <p className="mt-1 text-xs text-slate-400">No data for previous {days} days</p>;
  const pct = Math.round(((current - previous) / previous) * 100);
  return (
    <p className="mt-1 text-xs text-slate-500">
      {pct >= 0 ? '↑' : '↓'} {Math.abs(pct)}% vs previous {days} days
    </p>
  );
}

function Metric({ label, value, children }: { label: string; value: string | number; children?: ReactNode }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
      {children}
    </div>
  );
}

export default function Analytics() {
  const [days, setDays] = useState(30);
  const analytics = useApi<AnalyticsData>(`/analytics?days=${days}`);
  const stats = useApi<Stats>('/requests/stats');

  const a = analytics.data;
  const s = stats.data;
  const failure = (analytics.error || stats.error) && !(a && s);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title="Analytics" subtitle="Insights and statistics" />
        <Select
          ariaLabel="Date range"
          value={String(days)}
          onChange={(value) => setDays(Number(value))}
          options={RANGES.map((r) => ({ value: String(r), label: `Last ${r} days` }))}
          className="mb-6 w-44"
        />
      </div>

      {failure ? <ErrorMessage>{analytics.error || stats.error}</ErrorMessage> : a && s ? <AnalyticsContent a={a} stats={s} refreshing={analytics.loading} /> : <AnalyticsSkeleton />}
    </>
  );
}

function AnalyticsContent({ a, stats, refreshing }: { a: AnalyticsData; stats: Stats; refreshing: boolean }) {
  const open = stats.pending + stats.inProgress;
  const maxCategory = Math.max(1, ...a.byCategory.map((c) => c.count));

  return (
    <>
      <div className={`grid grid-cols-2 gap-4 lg:grid-cols-4 ${refreshing ? 'opacity-60' : ''}`}>
        <Metric label="Submitted" value={a.period.submitted}>
          <Delta current={a.period.submitted} previous={a.previous.submitted} days={a.days} />
        </Metric>
        <Metric label="Resolved" value={a.period.resolved}>
          <Delta current={a.period.resolved} previous={a.previous.resolved} days={a.days} />
        </Metric>
        <Metric label="Open now" value={open}>
          <p className="mt-1 text-xs text-slate-500">
            {stats.pending} pending · {stats.inProgress} in progress
          </p>
        </Metric>
        <Metric label="Avg. time to resolve" value={formatDuration(a.avgResolutionHours)} />
      </div>

      <section className="card mt-6 p-5">
        <h2 className="text-lg font-semibold text-slate-900">Requests trend</h2>
        <p className="mb-4 text-xs text-slate-500">Submitted and resolved per day</p>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={a.trend} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip labelFormatter={(d) => shortDate(String(d))} />
              <Legend iconType="plainline" />
              <Line type="monotone" dataKey="submitted" name="Submitted" stroke={SUBMITTED_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
              <Line type="monotone" dataKey="resolved" name="Resolved" stroke={RESOLVED_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-medium text-slate-600">View as table</summary>
          <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-slate-200">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2 text-right">Submitted</th>
                  <th className="px-3 py-2 text-right">Resolved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {a.trend.map((row) => (
                  <tr key={row.date}>
                    <td className="px-3 py-1.5">{shortDate(row.date)}</td>
                    <td className="px-3 py-1.5 text-right">{row.submitted}</td>
                    <td className="px-3 py-1.5 text-right">{row.resolved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section className="card mt-6 p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Top categories</h2>
        {a.byCategory.length === 0 ? (
          <p className="text-sm text-slate-500">No requests in this period.</p>
        ) : (
          <ul className="space-y-4">
            {a.byCategory.map(({ category, count }) => (
              <li key={category}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="text-slate-600">{CATEGORY[category].label}</span>
                  <span className="font-semibold text-slate-900">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full" style={{ width: `${(count / maxCategory) * 100}%`, backgroundColor: CATEGORY[category].color }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
