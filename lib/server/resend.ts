// Server-only helpers for sending email through Resend's REST API.
// Imported by API routes; never bundled into the app.

const RESEND_API = 'https://api.resend.com';
// Resend's free plan allows 2 requests per second.
const REQUEST_GAP_MS = 600;

const resendKey = () => {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error('RESEND_API_KEY is not set');
    return key;
};

const sender = () => process.env.EMAIL_FROM ?? 'Recurly <onboarding@resend.dev>';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const resendFetch = async (path: string, init: RequestInit = {}) => {
    const response = await fetch(`${RESEND_API}${path}`, {
        ...init,
        headers: {Authorization: `Bearer ${resendKey()}`, 'Content-Type': 'application/json'},
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Resend ${response.status}: ${body?.message ?? 'request failed'}`);
    return body;
};

const escapeHtml = (value: string) =>
    value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

export interface EmailContent {
    subject: string;
    text: string;
}

const html = ({text}: EmailContent) =>
    `<div style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.5;color:#081126">`
    + text.split('\n').map((line) => `<p style="margin:0 0 12px">${escapeHtml(line)}</p>`).join('')
    + `</div>`;

// Sends now, or at `sendAt` (ISO 8601, up to 30 days ahead). Returns the Resend email id.
export const sendEmail = async (to: string, content: EmailContent, sendAt?: string): Promise<string> => {
    const body = await resendFetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            from: sender(),
            to: [to],
            subject: content.subject,
            text: content.text,
            html: html(content),
            ...(sendAt ? {scheduled_at: sendAt} : {}),
        }),
    });
    return body.id as string;
};

// Cancels a scheduled email, but only one addressed to `owner`, so a user can't cancel
// someone else's emails by guessing ids. Already-sent or unknown emails are skipped.
export const cancelEmail = async (owner: string, id: string) => {
    try {
        const email = await resendFetch(`/emails/${encodeURIComponent(id)}`);
        const recipients: string[] = Array.isArray(email.to) ? email.to : [email.to];
        if (!recipients.includes(owner) || email.last_event !== 'scheduled') return;
        await wait(REQUEST_GAP_MS);
        await resendFetch(`/emails/${encodeURIComponent(id)}/cancel`, {method: 'POST'});
    } catch (error) {
        console.warn('Could not cancel email', id, error);
    }
};

// Runs `task` for each item one at a time, spaced out to respect Resend's rate limit.
export const throttled = async <T, R>(items: T[], task: (item: T) => Promise<R>): Promise<R[]> => {
    const results: R[] = [];
    for (const [index, item] of items.entries()) {
        if (index > 0) await wait(REQUEST_GAP_MS);
        results.push(await task(item));
    }
    return results;
};
