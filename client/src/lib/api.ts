export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

type Options = Omit<RequestInit, 'body'> & { json?: unknown };

/** Thin fetch wrapper. `/api` is proxied to the backend (Vite in dev, Vercel rewrite in prod) so cookies stay first-party. */
export async function api<T>(path: string, { json, ...init }: Options = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: json !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });

  const text = await res.text();
  const body = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
    throw new ApiError(message ?? 'Something went wrong. Please try again.', res.status);
  }
  return body as T;
}
