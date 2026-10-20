import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CATEGORY } from '../lib/constants';
import type { Analytics } from '../lib/types';

export function CategoryDonut({ data }: { data: Analytics['byCategory'] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const rows = data.map((d) => ({ ...d, name: CATEGORY[d.category].label, color: CATEGORY[d.category].color }));

  if (total === 0) return <p className="py-10 text-center text-sm text-slate-500">No requests in this period yet.</p>;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={rows} dataKey="count" nameKey="name" innerRadius={55} outerRadius={80} stroke="#fff" strokeWidth={2} isAnimationActive={false}>
              {rows.map((r) => (
                <Cell key={r.category} fill={r.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-2xl font-bold text-slate-900">{total}</p>
            <p className="text-xs text-slate-500">Total</p>
          </div>
        </div>
      </div>
      <ul className="w-full space-y-2.5 text-sm">
        {rows.map((r) => (
          <li key={r.category} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} />
              {r.name}
            </span>
            <span className="font-semibold text-slate-900">{r.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
