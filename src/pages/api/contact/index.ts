// POST /api/contact: validates a contact form submission and emails it to the site owner.
// Checks run cheapest first; nothing about the visitor or their message is logged or stored.
import type { APIRoute } from "astro";
import { verifyContactPayload } from "../../../lib/contact/altcha";
import { getContactConfig } from "../../../lib/contact/config";
import { validateSubmission } from "../../../lib/contact/fields";
import { clientIp, fail, json } from "../../../lib/contact/http";
import { createDailyCap, createRateLimiter } from "../../../lib/contact/limits";
import { sendContactMail } from "../../../lib/contact/mailer";

export const prerender = false;

const MAX_BODY_BYTES = 32 * 1024;
const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });
const dailyCap = createDailyCap();

export const POST: APIRoute = async ({ request, clientAddress }) => {
    const config = getContactConfig();
    if (!config) return fail(503, "unavailable");

    // Only our own pages may submit (blocks other sites posting into the form)
    const origin = request.headers.get("origin");
    if (!origin || !config.allowedOrigins.includes(origin)) return fail(403, "forbidden");

    if (!request.headers.get("content-type")?.startsWith("application/json")) return fail(415, "unsupported");
    if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return fail(413, "too_large");

    if (!limiter.attempt(clientIp(request, clientAddress))) return fail(429, "rate_limited");

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return fail(413, "too_large");

    let input: unknown;
    try {
        input = JSON.parse(raw);
    } catch {
        return fail(400, "invalid_request");
    }
    if (!input || typeof input !== "object" || Array.isArray(input)) return fail(400, "invalid_request");
    const body = input as Record<string, unknown>;

    // Honeypot: a field people never see. Bots that fill it get a normal success and their message is dropped.
    if (typeof body.website === "string" && body.website !== "") return json(200, { ok: true });

    if (!(await verifyContactPayload(body.altcha, config.altchaSecret))) return fail(400, "verification_failed");

    const result = validateSubmission(body);
    if (!result.ok) return fail(400, "invalid_fields", { fields: result.fields });

    if (!dailyCap.take(config.dailyLimit)) return fail(503, "unavailable");

    try {
        await sendContactMail(result.submission, config);
    } catch (error) {
        // The error code only, never the submission
        console.error("contact: sending failed", (error as { code?: string })?.code ?? "unknown");
        return fail(502, "unavailable");
    }

    return json(200, { ok: true });
};
