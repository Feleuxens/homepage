// Contact form settings, read from server-only environment variables (see astro.config.mjs).
import {
    CONTACT_ALLOWED_ORIGINS,
    CONTACT_ALTCHA_SECRET,
    CONTACT_DAILY_LIMIT,
    CONTACT_MAIL_FROM,
    CONTACT_MAIL_TO,
    CONTACT_SMTP_HOST,
    CONTACT_SMTP_PASSWORD,
    CONTACT_SMTP_PORT,
    CONTACT_SMTP_SECURE,
    CONTACT_SMTP_USER,
} from "astro:env/server";

export interface ContactConfig {
    smtp: { host: string; port: number; secure: boolean; user?: string; password?: string };
    mailFrom: string;
    mailTo: string;
    altchaSecret: string;
    allowedOrigins: string[];
    dailyLimit: number;
}

/** The complete configuration, or null when a required setting is missing (the form is then unavailable). */
export function getContactConfig(): ContactConfig | null {
    if (!CONTACT_SMTP_HOST || !CONTACT_MAIL_FROM || !CONTACT_MAIL_TO || !CONTACT_ALTCHA_SECRET) return null;

    return {
        smtp: {
            host: CONTACT_SMTP_HOST,
            port: CONTACT_SMTP_PORT,
            secure: CONTACT_SMTP_SECURE,
            user: CONTACT_SMTP_USER,
            password: CONTACT_SMTP_PASSWORD,
        },
        mailFrom: CONTACT_MAIL_FROM,
        mailTo: CONTACT_MAIL_TO,
        altchaSecret: CONTACT_ALTCHA_SECRET,
        allowedOrigins: (CONTACT_ALLOWED_ORIGINS ?? "")
            .split(",")
            .map(origin => origin.trim())
            .filter(Boolean),
        dailyLimit: CONTACT_DAILY_LIMIT,
    };
}
