import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, ImageOff, MapPin } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import { Dialog } from '../components/Dialog';
import { Select } from '../components/Select';
import { StatusBadge } from '../components/StatusBadge';
import { StatusStepper } from '../components/StatusStepper';
import { useToast } from '../components/Toast';
import { RequestDetailSkeleton } from '../components/Skeletons';
import { ErrorMessage, Field } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { CATEGORY, STATUS, STATUS_ORDER } from '../lib/constants';
import { formatDateTime } from '../lib/format';
import { useApi, useDocumentTitle } from '../lib/hooks';
import type { RequestDetail as Detail, Status } from '../lib/types';

function StatusPanel({ request, onUpdated }: { request: Detail; onUpdated: (updated: Detail) => void }) {
  const next = STATUS_ORDER.slice(STATUS_ORDER.indexOf(request.status) + 1);
  const [status, setStatus] = useState<Status>(next[0]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const toast = useToast();

  if (next.length === 0) {
    return <p className="card p-5 text-sm text-slate-500">This request is resolved. No further updates are needed.</p>;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setConfirming(true);
  }

  async function confirm() {
    setBusy(true);
    try {
      onUpdated(await api<Detail>(`/requests/${request.id}/status`, { method: 'PATCH', json: { status, note } }));
      toast(`Request #${request.reference} marked ${STATUS[status].label}.`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-5">
      <h2 className="font-semibold text-slate-900">Update status</h2>
      <Select label="New status" value={status} onChange={setStatus} options={next.map((s) => ({ value: s, label: STATUS[s].label }))} />
      <Field label="Note (shown to the citizen)">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3} placeholder="e.g. Assigned to the roads team" className="input resize-y" />
      </Field>
      <ErrorMessage>{error}</ErrorMessage>
      <button type="submit" className="btn-primary w-full">
        Update status
      </button>

      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title={`Mark as ${STATUS[status].label}?`}
        description="The citizen will see this change and your note. Status can only move forward, so this can't be undone."
      >
        {note.trim() && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">“{note.trim()}”</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setConfirming(false)} disabled={busy} className="btn-outline">
            Cancel
          </button>
          <button type="button" onClick={confirm} disabled={busy} className="btn-primary">
            {busy ? 'Saving…' : 'Confirm'}
          </button>
        </div>
      </Dialog>
    </form>
  );
}

export default function RequestDetail() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const { data, setData, error } = useApi<Detail>(`/requests/${id}`);
  const request = data?.id === id ? data : undefined;
  const [zoomed, setZoomed] = useState<number | null>(null);
  const [failed, setFailed] = useState<number[]>([]);
  useDocumentTitle(request ? `Request #${request.reference}` : 'Request');

  if (error && !request) return <ErrorMessage>{error}</ErrorMessage>;
  if (!request) return <RequestDetailSkeleton />;

  const isAdmin = user?.role === 'ADMIN';
  const { label } = CATEGORY[request.category];

  return (
    <>
      <Link to="/requests" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} /> Back to requests
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-400">#{request.reference}</p>
                <h1 className="text-2xl font-bold text-slate-900">{label}</h1>
              </div>
              <StatusBadge status={request.status} />
            </div>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <MapPin size={16} className="text-slate-400" /> {request.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={16} className="text-slate-400" /> {formatDateTime(request.createdAt)}
              </span>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-6">
              <StatusStepper status={request.status} history={request.history} />
            </div>

            {request.imageUrls.length > 0 && (
              <>
                <ul className={`mt-6 grid gap-3 ${['', '', 'grid-cols-2', 'grid-cols-3'][request.imageUrls.length]}`}>
                  {request.imageUrls.map((url, i) => (
                    <li key={url}>
                      {failed.includes(i) ? (
                        <p className="flex h-full min-h-24 items-center justify-center gap-2 rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">
                          <ImageOff size={18} aria-hidden /> Photo {i + 1} couldn't be loaded. Refresh to try again.
                        </p>
                      ) : (
                        <button type="button" onClick={() => setZoomed(i)} aria-label={`View photo ${i + 1} of ${request.imageUrls.length} full size`} className="block w-full cursor-zoom-in">
                          <img
                            src={url}
                            alt={`Photo ${i + 1} attached to this request`}
                            onError={() => setFailed((f) => [...f, i])}
                            className={`w-full rounded-lg border border-slate-200 object-cover ${request.imageUrls.length === 1 ? 'max-h-96' : 'h-40'}`}
                          />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                <Dialog open={zoomed !== null} onClose={() => setZoomed(null)} title={`Photo ${(zoomed ?? 0) + 1} of ${request.imageUrls.length}`} size="wide">
                  {zoomed !== null && (
                    <div className="relative mt-4">
                      <img src={request.imageUrls[zoomed]} alt={`Photo ${zoomed + 1} attached to this request, full size`} className="max-h-[70vh] w-full rounded-lg object-contain" />
                      {request.imageUrls.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setZoomed((zoomed + request.imageUrls.length - 1) % request.imageUrls.length)}
                            aria-label="Previous photo"
                            className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setZoomed((zoomed + 1) % request.imageUrls.length)}
                            aria-label="Next photo"
                            className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
                          >
                            <ChevronRight size={20} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </Dialog>
              </>
            )}

            <h2 className="mt-6 text-sm font-semibold text-slate-900">Description</h2>
            <p className="mt-1 whitespace-pre-line text-slate-600">{request.description}</p>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="font-semibold text-slate-900">Status history</h2>
            <ol className="mt-4 space-y-5 border-l-2 border-slate-200 pl-6">
              {request.history.map((h) => (
                <li key={h.id} className="relative">
                  <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-brand-600 ring-4 ring-white" />
                  <p className="text-sm font-semibold text-slate-900">{STATUS[h.status].label}</p>
                  {h.note && <p className="text-sm text-slate-600">{h.note}</p>}
                  <p className="text-xs text-slate-400">
                    {formatDateTime(h.createdAt)}
                    {isAdmin && ` · ${h.by}`}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {isAdmin && (
          <aside className="space-y-6">
            <StatusPanel key={request.status} request={request} onUpdated={setData} />
            <section className="card p-5 text-sm">
              <h2 className="mb-3 font-semibold text-slate-900">Submitted by</h2>
              <p className="font-medium text-slate-900">{request.submittedBy.fullName}</p>
              <p className="text-slate-600">{request.submittedBy.phone}</p>
              <p className="break-all text-slate-600">{request.submittedBy.email}</p>
            </section>
          </aside>
        )}
      </div>
    </>
  );
}
