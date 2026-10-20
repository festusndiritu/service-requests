import { MapPin } from 'lucide-react';
import { Link } from 'react-router';
import { CATEGORY } from '../lib/constants';
import { formatDate } from '../lib/format';
import type { RequestSummary } from '../lib/types';
import { StatusBadge } from './StatusBadge';

export function RequestRow({ request, showSubmitter = false }: { request: RequestSummary; showSubmitter?: boolean }) {
  const { label, icon: Icon, color } = CATEGORY[request.category];
  return (
    <Link to={`/requests/${request.id}`} className="flex items-center gap-4 px-4 py-4 transition hover:bg-slate-50">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ backgroundColor: `${color}1a`, color }}>
        <Icon size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-400">#{request.reference}</p>
        <p className="truncate font-semibold text-slate-900">{label}</p>
        <p className="flex items-center gap-1 truncate text-sm text-slate-500">
          <MapPin size={14} className="shrink-0" />
          <span className="truncate">
            {request.location}
            {showSubmitter && ` · ${request.submittedBy}`}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <StatusBadge status={request.status} />
        <span className="text-xs text-slate-400">{formatDate(request.createdAt)}</span>
      </div>
    </Link>
  );
}
