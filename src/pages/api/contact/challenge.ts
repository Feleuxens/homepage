// GET /api/contact/challenge: a fresh ALTCHA challenge for the contact form widget.
import type { APIRoute } from "astro";
import { createContactChallenge } from "../../../lib/contact/altcha";
import { getContactConfig } from "../../../lib/contact/config";
import { clientIp, fail, json } from "../../../lib/contact/http";
import { createRateLimiter } from "../../../lib/contact/limits";

export const prerender = false;

const limiter = createRateLimiter({ limit: 30, windowMs: 10 * 60 * 1000 });

export const GET: APIRoute = async ({ request, clientAddress }) => {
    const config = getContactConfig();
    if (!config) return fail(503, "unavailable");
    if (!limiter.attempt(clientIp(request, clientAddress))) return fail(429, "rate_limited");

    return json(200, { ...(await createContactChallenge(config.altchaSecret)) });
};
