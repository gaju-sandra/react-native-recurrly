import type {SQLiteDatabase} from "expo-sqlite";
import dayjs, {type Dayjs} from "dayjs";
import {getSetting, setSetting} from "@/lib/db";
import {formatCurrency} from "@/lib/utils";
import {getRenewalDatesBetween, isCharged, isTrialEnding} from "@/lib/subscriptions";
import {findPayment, toDueDate} from "@/lib/payments";

// Emails go out at 9:00 local time, DAYS_BEFORE days ahead of the due date.
const SEND_HOUR = 9;
const DAYS_BEFORE = 2;
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
    // Forgotten after this day (YYYY-MM-DD): the later of its send day and the due date.
    date: string;
}

interface DesiredEmail {
    key: string;
    date: string;
    reminder: {name: string; amount: string; date: string; sendAt: string | null; kind: EmailKind};
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

// 'due' DAYS_BEFORE days before the due date; 'overdue' the morning after, if it still isn't marked as paid.
type EmailKind = 'due' | 'trial' | 'overdue';

const getDesiredEmails = (subscriptions: Subscription[], payments: Payment[]): DesiredEmail[] => {
    const now = dayjs();
    // From yesterday, so an unpaid renewal from yesterday still gets its overdue email today.
    const from = now.subtract(1, 'day');
    return subscriptions
        .filter(isCharged)
        .flatMap((subscription) =>
            getRenewalDatesBetween(subscription, from, now.add(LOOKAHEAD_DAYS, 'day')).flatMap((date) => {
                // A paid bill needs no reminder at all.
                if (findPayment(payments, subscription.id, toDueDate(date))) return [];
                const isTrialEnd = isTrialEnding(subscription, date);
                const reminderDay = date.subtract(DAYS_BEFORE, 'day');
                // Too late to remind DAYS_BEFORE days ahead (e.g. it renews tomorrow): remind today instead.
                // A renewal from yesterday keeps its past reminder day, so the filter below drops it.
                const isLate = reminderDay.isBefore(now, 'day') && !date.isBefore(now, 'day');
                const dueSendDay = isLate ? now.startOf('day') : reminderDay;
                const emails: {kind: EmailKind; sendDay: Dayjs}[] = [
                    {kind: isTrialEnd ? 'trial' : 'due', sendDay: dueSendDay},
                    {kind: 'overdue', sendDay: date.add(1, 'day')},
                ];
                return emails
                    // An email whose send day is in the past has already gone out.
                    .filter(({sendDay}) => !sendDay.isBefore(now, 'day'))
                    .map(({kind, sendDay}) => {
                        const sendAt = sendDay.hour(SEND_HOUR).minute(0).second(0).millisecond(0);
                        const reminder = {
                            name: subscription.name,
                            amount: formatCurrency(subscription.price, subscription.currency),
                            date: date.format('MMM D'),
                            // Send day is today and already past 9:00: send straight away.
                            sendAt: sendAt.isAfter(now) ? sendAt.format() : null,
                            kind,
                        };
                        const key = [subscription.id, toDueDate(date), kind, DAYS_BEFORE, reminder.name, reminder.amount].join('|');
                        // Remember the booking until the due date has passed, not just its send day,
                        // so a reminder moved to today isn't booked a second time tomorrow.
                        const keepUntil = sendDay.isAfter(date) ? sendDay : date;
                        return {key, date: toDueDate(keepUntil), reminder};
                    });
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

// Brings the booked emails in line with the subscriptions and payments: books new ones and
// cancels ones that changed, were removed or got paid. Only the differences reach the server.
export const syncEmailReminders = async (
    db: SQLiteDatabase,
    subscriptions: Subscription[],
    payments: Payment[],
    {enabled, getToken}: {enabled: boolean; getToken: GetToken},
) => {
    const today = dayjs().format('YYYY-MM-DD');
    // Emails for past days have already gone out; just forget them.
    let scheduled = (await loadScheduled(db)).filter((email) => email.date >= today);

    const desired = enabled ? getDesiredEmails(subscriptions, payments) : [];
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
