import type {SQLiteDatabase} from "expo-sqlite";
import dayjs from "dayjs";
import {getSetting, setSetting} from "@/lib/db";
import {formatCurrency} from "@/lib/utils";
import {getRenewalDatesBetween, isCharged, isTrialEnding} from "@/lib/subscriptions";

// Emails go out at 9:00 local time on the due date.
const SEND_HOUR = 9;
// Resend can schedule at most 30 days ahead; later renewals get booked on a later app open.
const LOOKAHEAD_DAYS = 29;
const STORE_KEY = 'email_reminders_scheduled';

// Relative URL: the dev server in development, the `origin` in app.json in production.
const ENDPOINT = '/api/email-reminders';

type GetToken = () => Promise<string | null>;

// One booked email. `key` changes whenever anything in the email would change,
// so an edited subscription cancels the old email and books a new one.
interface ScheduledEmail {
    key: string;
    id: string;
    date: string;
}

interface DesiredEmail {
    key: string;
    date: string;
    reminder: {name: string; amount: string; date: string; sendAt: string | null; isTrialEnd: boolean};
}

const callApi = async <T>(getToken: GetToken, body: object): Promise<T> => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'},
        body: JSON.stringify(body),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json.error ?? `Email request failed (${response.status})`);
    return json as T;
};

// Sends one email right away to the signed-in user. Resolves to the address it went to.
export const sendTestEmail = async (getToken: GetToken): Promise<string> =>
    (await callApi<{sentTo: string}>(getToken, {action: 'test'})).sentTo;

const getDesiredEmails = (subscriptions: Subscription[]): DesiredEmail[] => {
    const now = dayjs();
    return subscriptions
        .filter(isCharged)
        .flatMap((subscription) =>
            getRenewalDatesBetween(subscription, now, now.add(LOOKAHEAD_DAYS, 'day')).map((date) => {
                const sendAt = date.hour(SEND_HOUR).minute(0).second(0).millisecond(0);
                const reminder = {
                    name: subscription.name,
                    amount: formatCurrency(subscription.price, subscription.currency),
                    date: date.format('MMM D'),
                    // Due today and already past 9:00: send straight away.
                    sendAt: sendAt.isAfter(now) ? sendAt.format() : null,
                    isTrialEnd: isTrialEnding(subscription, date),
                };
                const day = date.format('YYYY-MM-DD');
                const key = [subscription.id, day, reminder.name, reminder.amount, reminder.isTrialEnd].join('|');
                return {key, date: day, reminder};
            }),
        );
};

const loadScheduled = async (db: SQLiteDatabase): Promise<ScheduledEmail[]> => {
    try {
        return JSON.parse((await getSetting(db, STORE_KEY)) ?? '[]');
    } catch {
        return [];
    }
};

// Brings the booked emails in line with the subscriptions: books new due dates and cancels
// ones that changed or were removed. Only the differences are sent to the server.
export const syncEmailReminders = async (
    db: SQLiteDatabase,
    subscriptions: Subscription[],
    {enabled, getToken}: {enabled: boolean; getToken: GetToken},
) => {
    const today = dayjs().format('YYYY-MM-DD');
    // Emails for past days have already gone out; just forget them.
    let scheduled = (await loadScheduled(db)).filter((email) => email.date >= today);

    const desired = enabled ? getDesiredEmails(subscriptions) : [];
    const desiredKeys = new Set(desired.map((email) => email.key));
    const scheduledKeys = new Set(scheduled.map((email) => email.key));

    const toCancel = scheduled.filter((email) => !desiredKeys.has(email.key));
    const toBook = desired.filter((email) => !scheduledKeys.has(email.key));

    if (toCancel.length > 0) {
        await callApi(getToken, {action: 'cancel', ids: toCancel.map((email) => email.id)});
        scheduled = scheduled.filter((email) => desiredKeys.has(email.key));
        await setSetting(db, STORE_KEY, JSON.stringify(scheduled));
    }

    if (toBook.length > 0) {
        const {ids} = await callApi<{ids: string[]}>(getToken, {
            action: 'schedule',
            reminders: toBook.map((email) => email.reminder),
        });
        scheduled = [...scheduled, ...toBook.map((email, index) => ({key: email.key, id: ids[index], date: email.date}))];
    }

    await setSetting(db, STORE_KEY, JSON.stringify(scheduled));
};
