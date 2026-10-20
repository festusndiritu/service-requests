import type { ReactNode } from 'react';

/** A grey placeholder block with a moving highlight. Size it with Tailwind classes. */
export const Skeleton = ({ className = '' }: { className?: string }) => <div aria-hidden className={`skeleton ${className}`} />;

/** Wraps a skeleton so assistive technology announces that content is loading. */
export function Loading({ label = 'Loading', children }: { label?: string; children: ReactNode }) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{label}…</span>
      {children}
    </div>
  );
}

export function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="card flex items-center gap-4 p-4 sm:p-5">
          <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
          <div className="flex-1">
            <div className="flex h-5 items-center">
              <Skeleton className="h-3.5 w-20" />
            </div>
            <div className="flex h-8 items-center">
              <Skeleton className="h-6 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function OpenVsResolvedSkeleton() {
  return (
    <section className="card mt-6 p-5" aria-hidden>
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="flex h-7 items-center">
            <Skeleton className="h-5 w-36" />
          </div>
          <div className="flex h-5 items-center">
            <Skeleton className="h-3.5 w-28" />
          </div>
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="mt-4 h-3 w-full rounded-full" />
      <div className="mt-3 flex h-4 items-center">
        <Skeleton className="h-3 w-64 max-w-full" />
      </div>
    </section>
  );
}

/** Rows shaped like `RequestRow`. Place inside a `card divide-y` container. */
export function RowsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4" aria-hidden>
          <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-40 max-w-full" />
            <Skeleton className="h-3.5 w-56 max-w-full" />
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
      ))}
    </>
  );
}

export function RequestListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Loading label="Loading requests">
      <div className="card divide-y divide-slate-100 overflow-hidden">
        <RowsSkeleton count={count} />
      </div>
    </Loading>
  );
}

export function DonutSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row" aria-hidden>
      <Skeleton className="h-44 w-44 shrink-0 rounded-full" />
      <div className="w-full space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3.5 w-6" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function NotificationsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="flex items-start gap-4 px-4 py-4 sm:px-5" aria-hidden>
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-56 max-w-full" />
            <Skeleton className="h-3.5 w-full max-w-md" />
          </div>
          <Skeleton className="h-3 w-12" />
        </li>
      ))}
    </>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Loading label="Loading users">
      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3" aria-hidden>
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="h-3 w-52 max-w-full" />
              </div>
              <Skeleton className="hidden h-4 w-20 sm:block" />
              <Skeleton className="hidden h-4 w-24 sm:block" />
              <Skeleton className="h-4 w-14" />
            </div>
          ))}
        </div>
      </div>
    </Loading>
  );
}

export function RequestDetailSkeleton() {
  return (
    <Loading label="Loading request">
      <Skeleton className="mb-4 h-4 w-36" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5 sm:p-6" aria-hidden>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-7 w-48" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="mt-4 flex gap-6">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="mt-6 border-t border-slate-100 pt-6">
              <Skeleton className="h-12 w-full" />
            </div>
            <div className="mt-6 space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-11/12" />
              <Skeleton className="h-3.5 w-2/3" />
            </div>
          </section>
          <section className="card space-y-4 p-5 sm:p-6" aria-hidden>
            <Skeleton className="h-5 w-24" />
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3.5 w-56 max-w-full" />
                </div>
              </div>
            ))}
          </section>
        </div>
        <section className="card h-fit space-y-4 p-5 sm:p-6" aria-hidden>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </section>
      </div>
    </Loading>
  );
}

export function AnalyticsSkeleton() {
  return (
    <Loading label="Loading analytics">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card space-y-2 p-5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      <section className="card mt-6 p-5" aria-hidden>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mb-4 mt-2 h-3 w-44" />
        <Skeleton className="h-72 w-full" />
      </section>
      <section className="card mt-6 space-y-4 p-5" aria-hidden>
        <Skeleton className="h-5 w-32" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </section>
    </Loading>
  );
}

/** Generic content placeholder used while a lazily loaded screen downloads. */
export function PageSkeleton() {
  return (
    <Loading>
      <div className="mb-6 space-y-2" aria-hidden>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <StatsGridSkeleton />
      <div className="card mt-6 divide-y divide-slate-100 overflow-hidden">
        <RowsSkeleton count={3} />
      </div>
    </Loading>
  );
}

/** App frame placeholder shown while the session is being checked. */
export function ShellSkeleton() {
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-60 bg-navy-900 p-4 md:block" aria-hidden>
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="h-10 w-10 rounded-xl bg-white/10" />
          <div className="space-y-2">
            <div className="h-3.5 w-24 rounded bg-white/10" />
            <div className="h-3 w-16 rounded bg-white/10" />
          </div>
        </div>
        <div className="mt-6 space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-white/5" />
          ))}
        </div>
      </aside>
      <div className="md:pl-60">
        <header className="flex h-16 items-center justify-end border-b border-slate-200 bg-white px-4 md:px-8" aria-hidden>
          <Skeleton className="h-9 w-9 rounded-full" />
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8">
          <PageSkeleton />
        </main>
      </div>
    </div>
  );
}
