// What the contact form accepts. The server checks everything here; the browser's checks are only convenience.

/** Topic values sent by the form, and how they are named in the notification email. */
export const SERVICES = {
    it: "IT Services & Consulting",
    performance: "Piano/Trumpet Performance",
    arrangement: "Arrangement or Transcription",
    photography: "Photography",
    other: "Other",
} as const;

export type Service = keyof typeof SERVICES;

export const LIMITS = {
    name: 100,
    email: 254,
    phone: 30,
    messageMin: 10,
    messageMax: 5000,
    /** More links than this is treated as spam */
    messageLinks: 3,
} as const;

export interface ContactSubmission {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    service: Service;
    eventDate?: string;
    message: string;
}

export type ValidationResult =
    | { ok: true; submission: ContactSubmission }
    | { ok: false; fields: string[] };

// Control characters: none at all on single-line fields; the message may keep tabs and line breaks
const SINGLE_LINE_FORBIDDEN = /[\u0000-\u001F\u007F]/;
const MULTI_LINE_FORBIDDEN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
// Deliberately strict: no characters that carry meaning in mail headers
const EMAIL = /^[^\s@<>()",;:\\[\]]+@[^\s@<>()",;:\\[\]]+\.[^\s@<>()",;:\\[\].]{2,}$/;
const PHONE = /^[0-9+()\-/. ]{3,}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const LINK = /https?:\/\/|www\./gi;

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

export function validateSubmission(input: Record<string, unknown>): ValidationResult {
    const firstName = text(input.firstName);
    const lastName = text(input.lastName);
    const email = text(input.email);
    const phone = text(input.phone);
    const service = text(input.service);
    const eventDate = text(input.eventDate);
    const message = text(input.message);
    const invalid: string[] = [];

    const singleLine = (value: string, max: number) => value.length >= 1 && value.length <= max && !SINGLE_LINE_FORBIDDEN.test(value);

    if (!singleLine(firstName, LIMITS.name)) invalid.push("firstName");
    if (!singleLine(lastName, LIMITS.name)) invalid.push("lastName");
    if (!singleLine(email, LIMITS.email) || !EMAIL.test(email)) invalid.push("email");
    if (phone && (!singleLine(phone, LIMITS.phone) || !PHONE.test(phone))) invalid.push("phone");
    if (!Object.hasOwn(SERVICES, service)) invalid.push("service");
    if (eventDate && (!ISO_DATE.test(eventDate) || Number.isNaN(Date.parse(eventDate)))) invalid.push("eventDate");
    if (
        message.length < LIMITS.messageMin ||
        message.length > LIMITS.messageMax ||
        MULTI_LINE_FORBIDDEN.test(message) ||
        (message.match(LINK)?.length ?? 0) > LIMITS.messageLinks
    ) invalid.push("message");
    if (input.privacy !== "on" && input.privacy !== true) invalid.push("privacy");

    if (invalid.length) return { ok: false, fields: invalid };

    return {
        ok: true,
        submission: {
            firstName,
            lastName,
            email,
            phone: phone || undefined,
            service: service as Service,
            eventDate: eventDate || undefined,
            message,
        },
    };
}
