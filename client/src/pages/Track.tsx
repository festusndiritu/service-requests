import { ArrowLeft, Hash, Phone, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { IconInput } from '../components/IconInput';
import { Logo } from '../components/Logo';
import { StatusBadge } from '../components/StatusBadge';
import { ErrorMessage, Field } from '../components/ui';
import { api } from '../lib/api';
import { CATEGORY } from '../lib/constants';
import { formatDateTime } from '../lib/format';
import { useDocumentTitle } from '../lib/hooks';
import type { Category, Status } from '../lib/types';

interface Tracked {
  reference: string;
  category: Category;
  status: Status;
  createdAt: string;
  history: { id: string; status: Status; note: string | null; createdAt: string }[];
}

export default function Track() {
  const [params] = useSearchParams();
  const [result, setResult] = useState<Tracked | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useDocumentTitle('Track a request');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const query = new URLSearchParams({ reference: String(form.get('reference')).trim(), phone: String(form.get('phone')).trim() });
    setBusy(true);
    setError('');
    setResult(null);
    try {
      setResult(await api<Tracked>(`/requests/track?${query}`));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const category = result && CATEGORY[result.category];

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link to="/" aria-label="Murang'a County Service Requests home">
            <Logo />
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
            <ArrowLeft size={16} aria-hidden /> Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <h1 className="text-3xl font-bold text-slate-900">Track a request</h1>
        <p className="mt-2 text-slate-600">No account needed. Enter the reference number you were given and the last 4 digits of the phone number used to submit the request.</p>

        <form onSubmit={onSubmit} className="card mt-8 grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Reference number">
            <IconInput icon={Hash} name="reference" required defaultValue={params.get('ref') ?? ''} autoCapitalize="characters" autoComplete="off" placeholder="PRS-2026-0012" />
          </Field>
          <Field label="Last 4 digits of phone">
            <IconInput icon={Phone} name="phone" required inputMode="numeric" pattern="\d{4}" maxLength={4} autoComplete="off" title="4 digits" placeholder="5678" />
          </Field>
          <button type="submit" disabled={busy} className="btn-primary py-2.5 sm:mb-px">
            <Search size={16} aria-hidden /> {busy ? 'Looking…' : 'Track'}
          </button>
        </form>

        <div className="mt-4" aria-live="polite">
          <ErrorMessage>{error}</ErrorMessage>
        </div>

        {result && category && (
          <section className="card mt-6 p-6 shadow-md">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full" style={{ backgroundColor: `${category.color}1a`, color: category.color }}>
                  <category.icon size={20} aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-500">{result.reference}</p>
                  <h2 className="font-semibold text-slate-900">{category.label}</h2>
                  <p className="text-xs text-slate-400">Submitted {formatDateTime(result.createdAt)}</p>
                </div>
              </div>
              <StatusBadge status={result.status} />
            </div>

            <ol className="mt-6 space-y-5 border-l-2 border-slate-100 pl-6">
              {result.history.map((h) => (
                <li key={h.id} className="relative">
                  <span className="absolute -left-[33px] top-1 h-3 w-3 rounded-full bg-brand-600 ring-4 ring-white" />
                  <StatusBadge status={h.status} />
                  {h.note && <p className="mt-1.5 text-sm text-slate-700">{h.note}</p>}
                  <p className="text-xs text-slate-400">{formatDateTime(h.createdAt)}</p>
                </li>
              ))}
            </ol>

            <p className="mt-6 text-sm text-slate-500">
              Want updates as they happen?{' '}
              <Link to="/register" className="font-semibold text-brand-700 hover:underline">
                Create an account
              </Link>{' '}
              to get notified.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
