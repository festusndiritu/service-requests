import { Check } from 'lucide-react';
import { STATUS, STATUS_ORDER } from '../lib/constants';
import { formatDate } from '../lib/format';
import type { Status } from '../lib/types';

export function StatusStepper({ status, history }: { status: Status; history: { status: Status; createdAt: string }[] }) {
  const current = STATUS_ORDER.indexOf(status);
  return (
    <ol className="grid grid-cols-3" aria-label="Request progress">
      {STATUS_ORDER.map((s, i) => {
        const reached = i <= current;
        const when = history.find((h) => h.status === s)?.createdAt;
        return (
          <li key={s} aria-current={i === current ? 'step' : undefined} className="relative flex flex-col items-center text-center">
            {i > 0 && <span aria-hidden className={`absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 ${reached ? 'bg-brand-600' : 'bg-slate-200'}`} />}
            <span
              className={`relative z-10 grid h-8 w-8 place-items-center rounded-full text-sm font-semibold ring-4 ring-white ${
                reached ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {reached && i < current ? <Check size={16} aria-hidden /> : i + 1}
            </span>
            <span className={`mt-2 text-sm font-medium ${reached ? 'text-slate-900' : 'text-slate-400'}`}>{STATUS[s].label}</span>
            <span className="text-xs text-slate-400">{when ? formatDate(when) : 'Not yet'}</span>
          </li>
        );
      })}
    </ol>
  );
}
