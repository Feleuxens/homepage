// Browser side of the contact form. ALTCHA solves its task in the background once the visitor
// focuses the form; on submit the form waits for it if needed and posts everything to /api/contact.
import "altcha";

type AltchaState = "unverified" | "verifying" | "verified" | "expired" | "error" | "code";

interface AltchaWidget extends HTMLElement {
    getState(): AltchaState;
    verify(): unknown;
    reset(): void;
}

const REQUEST_TIMEOUT_MS = 15_000;

export function initContactForm(form: HTMLFormElement): void {
    const widget = form.querySelector<AltchaWidget>("altcha-widget");
    const button = form.querySelector<HTMLButtonElement>("button[type=submit]");
    const status = form.querySelector<HTMLElement>("#form-message");
    if (!widget || !button || !status) return;

    const email = form.dataset.fallbackEmail ?? "";
    const messages: Record<string, string> = {
        sent: "Thank you! Your message has been sent. I'll usually get back to you within a day or two.",
        invalid_fields: "Please check the highlighted fields.",
        rate_limited: "Too many attempts. Please wait a few minutes and try again.",
        verification_failed: `The automatic spam check didn't complete. Please try again, or write to me directly at ${email}.`,
        fallback: `Sorry, your message couldn't be sent. Please write to me directly at ${email}.`,
    };

    const show = (text: string, tone: "success" | "error") => {
        status.textContent = text;
        status.className = tone;
    };

    const markInvalid = (fields: string[]) => {
        for (const element of form.querySelectorAll<HTMLElement>("[aria-invalid]")) element.removeAttribute("aria-invalid");
        for (const name of fields) {
            const field = form.elements.namedItem(name);
            // A radio group comes back as a list, so each of its buttons gets marked
            const elements = field instanceof RadioNodeList ? [...field] : [field];
            for (const element of elements) {
                if (element instanceof HTMLElement) element.setAttribute("aria-invalid", "true");
            }
        }
        form.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
    };

    form.addEventListener("submit", async event => {
        event.preventDefault();
        status.className = "hidden";
        button.disabled = true;
        button.textContent = "Sending…";

        try {
            try {
                await whenVerified(widget);
            } catch {
                show(messages.verification_failed, "error");
                return;
            }
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(Object.fromEntries(new FormData(form))),
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            });
            const result: { ok?: boolean; error?: string; fields?: string[] } = await response.json().catch(() => ({}));

            if (response.ok && result.ok) {
                form.reset();
                markInvalid([]);
                show(messages.sent, "success");
            } else {
                markInvalid(result.fields ?? []);
                show(messages[result.error ?? ""] ?? messages.fallback, "error");
            }
        } catch {
            // Timeout or no connection: the fallback already offers the email address
            show(messages.fallback, "error");
        } finally {
            // Every challenge is accepted once, so the next attempt needs a fresh one
            widget.reset();
            button.disabled = false;
            button.textContent = "Send Message";
        }
    });
}

/** Resolves once the widget has solved its challenge, starting it if it hasn't begun yet. */
function whenVerified(widget: AltchaWidget): Promise<void> {
    if (widget.getState() === "verified") return Promise.resolve();

    return new Promise((resolve, reject) => {
        const onChange = (event: Event) => {
            const state = (event as CustomEvent<{ state: AltchaState }>).detail.state;
            if (state === "verified") finish(resolve);
            else if (state === "error" || state === "expired") finish(() => reject(new Error(state)));
        };
        const finish = (done: () => void) => {
            widget.removeEventListener("statechange", onChange);
            done();
        };
        widget.addEventListener("statechange", onChange);
        if (widget.getState() !== "verifying") widget.verify();
    });
}
