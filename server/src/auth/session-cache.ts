const TTL_MS = 30_000;
const MAX_ENTRIES = 5_000;

const entries = new Map<string, { passwordChangedAt: number | null; checkedAt: number }>();

/** Short-lived memory of each user's `passwordChangedAt`, so most requests skip the session lookup in the database. */
export const sessionCache = {
  get(userId: string) {
    const hit = entries.get(userId);
    return hit && Date.now() - hit.checkedAt < TTL_MS ? hit : undefined;
  },
  set(userId: string, passwordChangedAt: Date | null) {
    if (entries.size >= MAX_ENTRIES) entries.clear();
    entries.set(userId, { passwordChangedAt: passwordChangedAt?.getTime() ?? null, checkedAt: Date.now() });
  },
  forget(userId: string) {
    entries.delete(userId);
  },
};
