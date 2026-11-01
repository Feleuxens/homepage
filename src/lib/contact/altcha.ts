// Self-hosted ALTCHA proof-of-work: no third party, no cookies, no personal data.
// The browser solves a small computation while the visitor fills in the form; the server checks it.
import { CappedMap, createChallenge, randomInt, type Challenge } from "altcha-lib";
import { deriveKey } from "altcha-lib/algorithms/pbkdf2";
import { deriveHmacKeySecret, verify } from "altcha-lib/frameworks/shared";

const ALGORITHM = "PBKDF2/SHA-256";
// About 0.5-1s on one CPU thread; the widget spreads it over several workers while the visitor types
const COST = 2_000;
const COUNTER_RANGE = [2_000, 5_000] as const;
const CHALLENGE_LIFETIME_MS = 10 * 60 * 1000;

// Each solved challenge is accepted once. Expired ones fail anyway, so the cap only has to cover their lifetime.
const usedChallenges = new CappedMap<string, boolean>({ maxSize: 10_000 });

export async function createContactChallenge(secret: string): Promise<Challenge> {
    return createChallenge({
        algorithm: ALGORITHM,
        cost: COST,
        counter: randomInt(...COUNTER_RANGE),
        deriveKey,
        expiresAt: new Date(Date.now() + CHALLENGE_LIFETIME_MS),
        hmacSignatureSecret: secret,
        hmacKeySignatureSecret: await deriveHmacKeySecret(secret),
    });
}

/** True when the payload is a valid, unexpired, not yet used solution to one of our challenges. */
export async function verifyContactPayload(payload: unknown, secret: string): Promise<boolean> {
    if (typeof payload !== "string" || payload.length > 10_000) return false;
    const { error } = await verify(payload, deriveKey, secret, await deriveHmacKeySecret(secret), usedChallenges);
    return error === null;
}
