type Entry = { failures: number; first: number; lockedUntil: number };

export const MAX_FAILURES = 5;
export const WINDOW_MS = 15 * 60 * 1000;
export const LOCK_MS = 15 * 60 * 1000;

const store = new Map<string, Entry>();

/** Milliseconds the key is still locked out for, or 0. */
export function lockRemaining(key: string, now = Date.now()) {
  const e = store.get(key);
  if (!e) return 0;
  return Math.max(0, e.lockedUntil - now);
}

export function recordFailure(key: string, now = Date.now()) {
  let e = store.get(key);
  if (!e || now - e.first > WINDOW_MS) {
    e = { failures: 0, first: now, lockedUntil: 0 };
  }
  e.failures += 1;
  if (e.failures >= MAX_FAILURES) {
    e.lockedUntil = now + LOCK_MS;
    e.failures = 0;
    e.first = now;
  }
  store.set(key, e);
}

export function recordSuccess(key: string) {
  store.delete(key);
}

export function resetRateLimits() {
  store.clear();
}
