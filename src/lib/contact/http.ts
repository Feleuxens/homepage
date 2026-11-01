// Small helpers shared by the contact API routes.

/** Machine-readable outcomes; the form turns them into messages. Deliberately coarse, so they reveal nothing. */
export type ContactError =
    | "forbidden"
    | "unsupported"
    | "too_large"
    | "rate_limited"
    | "invalid_request"
    | "verification_failed"
    | "invalid_fields"
    | "unavailable";

export function json(status: number, body: Record<string, unknown>): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
        },
    });
}

export const fail = (status: number, error: ContactError, extra: Record<string, unknown> = {}) =>
    json(status, { ok: false, error, ...extra });

/**
 * The visitor's IP, for rate limiting only (kept in memory, never logged or stored).
 * In production the reverse proxy overwrites X-Real-IP; the Node server is not reachable directly.
 */
export function clientIp(request: Request, clientAddress: string): string {
    return request.headers.get("x-real-ip")?.trim() || clientAddress;
}
