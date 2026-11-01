// Sends a validated submission to the site owner. Only ever to the configured recipient:
// the visitor's address goes into Reply-To, never into To or From, and nothing is sent back to them.
import nodemailer, { type Transporter } from "nodemailer";
import type { ContactConfig } from "./config";
import { SERVICES, type ContactSubmission } from "./fields";

let transporter: Transporter | null = null;

function getTransporter({ smtp }: ContactConfig): Transporter {
    transporter ??= nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        // Without implicit TLS, STARTTLS is mandatory: credentials and messages never travel in plain text
        requireTLS: !smtp.secure,
        auth: smtp.user ? { user: smtp.user, pass: smtp.password } : undefined,
        tls: { minVersion: "TLSv1.2" },
    });
    return transporter;
}

export function buildMessage(submission: ContactSubmission, config: ContactConfig) {
    const name = `${submission.firstName} ${submission.lastName}`;
    const service = SERVICES[submission.service];

    const text = [
        "Neue Anfrage über das Kontaktformular auf feleuxens.de",
        "",
        `Name:     ${name}`,
        `E-Mail:   ${submission.email}`,
        `Telefon:  ${submission.phone ?? "–"}`,
        `Thema:    ${service}`,
        `Termin:   ${submission.eventDate ?? "–"}`,
        "",
        "Nachricht:",
        submission.message,
    ].join("\n");

    return {
        from: config.mailFrom,
        to: config.mailTo,
        // Field values were checked for line breaks; nodemailer additionally encodes every header
        replyTo: { name, address: submission.email },
        subject: `[Kontakt] ${service} – ${name}`,
        text,
    };
}

export async function sendContactMail(submission: ContactSubmission, config: ContactConfig): Promise<void> {
    await getTransporter(config).sendMail(buildMessage(submission, config));
}
