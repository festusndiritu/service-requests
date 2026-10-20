import { ChevronLeft, ChevronRight, ClipboardList, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { RequestRow } from '../components/RequestRow';
import { Select, type SelectOption } from '../components/Select';
import { RequestListSkeleton } from '../components/Skeletons';
import { EmptyState, ErrorMessage, PageHeader } from '../components/ui';
import { useAuth } from '../lib/auth';
import { CATEGORY, CATEGORY_KEYS, STATUS, STATUS_ORDER } from '../lib/constants';
import { useApi, useDebounced } from '../lib/hooks';
import type { Category, Page, RequestSummary, Status } from '../lib/types';

const CATEGORY_FILTER_OPTIONS: SelectOption<Category | ''>[] = [
  { value: '', label: 'All categories' },
  ...CATEGORY_KEYS.map((value) => ({ value, ...CATEGORY[value] })),
];

export default function Requests() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('status');
  const status: Status | '' = STATUS_ORDER.includes(requested as Status) ? (requested as Status) : '';
  const setStatus = (value: Status | '') => setSearchParams(value ? { status: value } : {}, { replace: true });
  const [category, setCategory] = useState<Category | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounced(search.trim(), 300);

  useEffect(() => setPage(1), [status]);

  const params = new URLSearchParams({ page: String(page) });
  if (status) params.set('status', status);
  if (category) params.set('category', category);
  if (q) params.set('q', q);
  const { data, loading, error } = useApi<Page<RequestSummary>>(`/requests?${params}`);

  const hasFilters = Boolean(status || category || search);
  const clearFilters = () => {
    setStatus('');
    setCategory('');
    setSearch('');
    setPage(1);
  };
  const goToPage = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0 });
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const tabs: { value: Status | ''; label: string }[] = [
    { value: '', label: 'All' },
    ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS[s].label })),
  ];

  return (
    <>
      <PageHeader
        title={isAdmin ? 'All requests' : 'My requests'}
        subtitle={isAdmin ? 'Review citizen requests and update their status.' : 'Track the status of your service requests.'}
      />

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            aria-pressed={status === tab.value}
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              status === tab.value ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by reference, location or description"
            aria-label="Search requests"
            className="input pl-9"
          />
        </div>
        <Select
          ariaLabel="Filter by category"
          value={category}
          onChange={(value) => {
            setCategory(value);
            setPage(1);
          }}
          options={CATEGORY_FILTER_OPTIONS}
          className="sm:w-64"
        />
        {hasFilters && (
          <button type="button" onClick={clearFilters} className="btn-outline">
            <X size={16} /> Clear filters
          </button>
        )}
      </div>

      <ErrorMessage>{error}</ErrorMessage>
      {!data && loading && <RequestListSkeleton count={8} />}
      {data && (
        <>
          <div className={`card divide-y divide-slate-100 overflow-hidden transition-opacity ${loading ? 'opacity-60' : ''}`}>
            {data.items.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No requests found"
                text={hasFilters ? 'No requests match your filters.' : undefined}
                action={
                  hasFilters ? (
                    <button type="button" onClick={clearFilters} className="btn-outline">
                      Clear filters
                    </button>
                  ) : !isAdmin ? (
                    <Link to="/requests/new" className="btn-primary">
                      Submit a request
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              data.items.map((r) => <RequestRow key={r.id} request={r} showSubmitter={isAdmin} />)
            )}
          </div>

          {data.total > data.pageSize && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
              <span>
                Page {data.page} of {totalPages} · {data.total} requests
              </span>
              <div className="flex gap-2">
                <button className="btn-outline" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                  <ChevronLeft size={16} /> Previous
                </button>
                <button className="btn-outline" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
