import { ImagePlus, X } from 'lucide-react';
import { useEffect, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useToast } from '../components/Toast';
import { Select } from '../components/Select';
import { ErrorMessage, Field, PageHeader } from '../components/ui';
import { api } from '../lib/api';
import { CATEGORY, CATEGORY_KEYS } from '../lib/constants';
import type { Category, RequestDetail } from '../lib/types';

const CATEGORY_OPTIONS = CATEGORY_KEYS.map((value) => ({ value, ...CATEGORY[value] }));

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS = 3;
const fileSize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);
const IMAGE_EXTENSIONS: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif' };
const IMAGE_TYPES = new Set(Object.values(IMAGE_EXTENSIONS));
const ACCEPT = [...IMAGE_TYPES].join(',');

/** The browser's reported type, or one worked out from the extension when the OS reports none (common for newer formats). */
const imageType = (file: File) => (IMAGE_TYPES.has(file.type) ? file.type : (IMAGE_EXTENSIONS[file.name.split('.').pop()?.toLowerCase() ?? ''] ?? ''));

/** Uploads straight to R2 using a short-lived presigned URL and returns the object key. */
async function uploadPhoto(file: File) {
  const { uploadUrl, key } = await api<{ uploadUrl: string; key: string }>('/uploads/presign', {
    method: 'POST',
    json: { contentType: imageType(file), size: file.size },
  });
  const res = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': imageType(file) } });
  if (!res.ok) throw new Error('A photo failed to upload. Try again or submit without photos.');
  return key;
}

export default function NewRequest() {
  const navigate = useNavigate();
  const toast = useToast();
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'' | 'uploading' | 'submitting'>('');
  const [length, setLength] = useState(0);
  const [category, setCategory] = useState<Category | ''>('');
  const [categoryError, setCategoryError] = useState('');
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const urls = photos.map((p) => URL.createObjectURL(p));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);

  // A photo dropped just outside the drop zone would make the browser open it and discard the form
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    window.addEventListener('dragover', block);
    window.addEventListener('drop', block);
    return () => {
      window.removeEventListener('dragover', block);
      window.removeEventListener('drop', block);
    };
  }, []);

    function acceptPhotos(files: File[]) {
    if (files.length === 0) return;
    const added: File[] = [];
    let problem = '';
    for (const file of files) {
      const duplicate = [...photos, ...added].some((p) => p.name === file.name && p.size === file.size && p.lastModified === file.lastModified);
      if (duplicate) continue;
      if (!imageType(file)) {
        problem = /\.(heic|heif)$/i.test(file.name) || /hei[cf]/.test(file.type) ? 'HEIC photos are not supported. Choose a JPG or PNG, or set your camera to “Most Compatible”.' : 'Photos must be PNG, JPG, WebP, GIF or AVIF images.';
        continue;
      }
      if (file.size > MAX_BYTES) {
        problem = 'Each photo must be 5MB or smaller.';
        continue;
      }
      if (photos.length + added.length >= MAX_PHOTOS) {
        problem = `You can attach up to ${MAX_PHOTOS} photos.`;
        break;
      }
      added.push(file);
    }
    setError(problem);
    if (added.length) setPhotos([...photos, ...added]);
  }

  function onPhotoChange(e: ChangeEvent<HTMLInputElement>) {
    acceptPhotos(Array.from(e.target.files ?? []));
    e.target.value = '';
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    acceptPhotos(Array.from(e.dataTransfer.files));
  }

  function onDragLeave(e: DragEvent<HTMLLabelElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (!category) {
      setCategoryError('Choose the category that best fits your issue.');
      e.currentTarget.querySelector<HTMLButtonElement>('[role=combobox]')?.focus();
      return;
    }
    setError('');
    try {
      setBusy('uploading');
      const imageKeys = photos.length ? await Promise.all(photos.map(uploadPhoto)) : undefined;
      setBusy('submitting');
      const created = await api<RequestDetail>('/requests', {
        method: 'POST',
        json: {
          category,
          location: form.get('location'),
          description: form.get('description'),
          imageKeys,
        },
      });
      toast(`Request #${created.reference} submitted. We'll update you as it progresses.`);
      navigate(`/requests/${created.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy('');
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Submit a service request" subtitle="Fill in the details below to report an issue." />
      <form onSubmit={onSubmit} className="card space-y-5 p-5 sm:p-6">
        <Select
          label="Category"
          value={category}
          onChange={(value) => {
            setCategory(value);
            setCategoryError('');
          }}
          options={CATEGORY_OPTIONS}
          placeholder="Select a category"
          error={categoryError}
        />

        <Field label="Location" hint="Be as specific as you can so the team can find it: ward, road, nearest landmark.">
          <input name="location" required minLength={3} maxLength={200} autoComplete="street-address" placeholder="e.g. Kenol, near the Total petrol station" className="input" />
        </Field>

        <Field
          label="Description"
          hint={
            <span className="flex justify-between">
              <span>What is wrong, since when, and who it affects.</span>
              <span aria-hidden>{length}/2000</span>
            </span>
          }
        >
          <textarea
            onChange={(e) => setLength(e.target.value.length)}
            name="description"
            required
            minLength={10}
            maxLength={2000}
            rows={5}
            placeholder="Describe the issue in detail"
            className="input resize-y"
          />
        </Field>

        <div>
          <span className="label">
            Photos <span className="font-normal text-slate-400">(optional, up to {MAX_PHOTOS})</span>
          </span>
          {photos.length > 0 && (
            <ul className="mb-3 grid grid-cols-3 gap-3">
              {photos.map((photo, i) => (
                <li key={`${photo.name}-${photo.size}-${photo.lastModified}`} className="relative min-w-0">
                  <img src={previews[i]} alt={`Selected photo ${i + 1}`} className="h-28 w-full rounded-lg border border-slate-200 object-cover" />
                  <p className="mt-1.5 truncate text-xs text-slate-500">
                    {photo.name} · {fileSize(photo.size)}
                  </p>
                  <button
                    type="button"
                    onClick={() => setPhotos(photos.filter((_, n) => n !== i))}
                    aria-label={`Remove photo ${i + 1}`}
                    className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-slate-900 text-white shadow"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {photos.length < MAX_PHOTOS && (
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 text-center text-sm text-slate-500 transition focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/30 hover:border-brand-600 hover:bg-brand-50 ${
                photos.length ? 'py-5' : 'py-8'
              } ${dragging ? 'border-brand-600 bg-brand-50' : 'border-slate-300'}`}
            >
              <ImagePlus className="text-brand-600" />
              <span>
                {dragging ? (
                  <span className="font-semibold text-brand-600">Drop the photos here</span>
                ) : (
                  <>
                    <span className="font-semibold text-brand-600">{photos.length ? 'Add another photo' : 'Click to upload'}</span> or drag and drop
                  </>
                )}
              </span>
              <span className="text-xs text-slate-400">
                PNG, JPG, WebP, GIF or AVIF, up to 5MB each · {photos.length} of {MAX_PHOTOS} added
              </span>
              <input type="file" accept={ACCEPT} multiple onChange={onPhotoChange} className="sr-only" />
            </label>
          )}
        </div>

        <ErrorMessage>{error}</ErrorMessage>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link to="/requests" className="btn-outline" aria-disabled={Boolean(busy)}>
            Cancel
          </Link>
          <button type="submit" disabled={Boolean(busy)} className="btn-primary sm:min-w-44">
            {busy === 'uploading' ? (photos.length > 1 ? 'Uploading photos…' : 'Uploading photo…') : busy === 'submitting' ? 'Submitting…' : 'Submit request'}
          </button>
        </div>
      </form>
    </div>
  );
}
