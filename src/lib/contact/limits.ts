// In-memory abuse limits. They reset when the server restarts, which is fine for a single small instance;
// the reverse proxy enforces its own per-IP limit in front of this.

export interface RateLimiter {
    /** Counts one attempt for `key`; returns false when the limit for the current window is exceeded. */
    attempt(key: string): boolean;
}

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }): RateLimiter {
    const windows = new Map<string, { count: number; resetAt: number }>();

    return {
        attempt(key) {
            const now = Date.now();
            if (windows.size > 10_000) {
                for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
            }
            const window = windows.get(key);
            if (!window || window.resetAt <= now) {
                windows.set(key, { count: 1, resetAt: now + windowMs });
                return true;
            }
            window.count++;
            return window.count <= limit;
        },
    };
}

/** A cap on emails sent per calendar day, so spam that gets through can't flood the mailbox. */
export function createDailyCap(): { take(limit: number): boolean } {
    let day = "";
    let sent = 0;

    return {
        take(limit) {
            const today = new Date().toISOString().slice(0, 10);
            if (today !== day) {
                day = today;
                sent = 0;
            }
            if (sent >= limit) return false;
            sent++;
            return true;
        },
    };
}
