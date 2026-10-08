import {createClerkClient, verifyToken} from "@clerk/backend";
import {cancelEmail, sendEmail, throttled, type EmailContent} from "@/lib/server/resend";

// Emails are only ever sent to the signed-in user's own login email, taken from Clerk,
// never to an address the app sends in, so this route can't be used to email strangers.

const MAX_REMINDERS = 40;

interface ReminderInput {
    name: string;
    amount: string;
    date: string;
    sendAt: string | null;
    kind: 'due' | 'trial' | 'overdue';
}

type Body =
    | {action: 'schedule'; reminders: ReminderInput[]}
    | {action: 'cancel'; ids: string[]};

const secretKey = () => {
    const key = process.env.CLERK_SECRET_KEY;
    if (!key) throw new Error('CLERK_SECRET_KEY is not set');
    return key;
};

// The user's verified login email, or null when the request isn't signed in.
const getUserEmail = async (request: Request): Promise<{email: string; firstName: string | null} | null> => {
    const token = request.headers.get('Authorization')?.replace(/^Bearer /, '');
    if (!token) return null;
    try {
        const {sub} = await verifyToken(token, {secretKey: secretKey()});
        const user = await createClerkClient({secretKey: secretKey()}).users.getUser(sub);
        const email = user.primaryEmailAddress?.emailAddress;
        return email ? {email, firstName: user.firstName} : null;
    } catch {
        return null;
    }
};

const isString = (value: unknown, max = 200): value is string => typeof value === 'string' && value.length <= max;

const isReminder = (value: unknown): value is ReminderInput => {
    const item = value as ReminderInput;
    return !!item && isString(item.name, 100) && isString(item.amount, 40) && isString(item.date, 40)
        && (item.sendAt === null || isString(item.sendAt, 40)) && ['due', 'trial', 'overdue'].includes(item.kind);
};

const reminderEmail = (reminder: ReminderInput, firstName: string | null): EmailContent => {
    const greeting = `Hi ${firstName ?? 'there'},`;
    switch (reminder.kind) {
        case 'trial':
            return {
                subject: `Your ${reminder.name} free trial ends on ${reminder.date}`,
                text: `${greeting}\nYour ${reminder.name} free trial ends on ${reminder.date}. `
                    + `You'll be charged ${reminder.amount} unless you cancel.\n— Recurly`,
            };
        case 'overdue':
            return {
                subject: `${reminder.name} payment is overdue`,
                text: `${greeting}\nYour ${reminder.name} payment of ${reminder.amount} was due on ${reminder.date} `
                    + `and isn't marked as paid yet. Open Recurly to pay it or mark it as paid.\n— Recurly`,
            };
        case 'due':
            return {
                subject: `${reminder.name} renews on ${reminder.date}`,
                text: `${greeting}\nYour ${reminder.name} subscription (${reminder.amount}) renews on ${reminder.date}.\n— Recurly`,
            };
    }
};

export async function POST(request: Request) {
    const user = await getUserEmail(request);
    if (!user) return Response.json({error: 'Not signed in'}, {status: 401});

    let body: Body;
    try {
        body = await request.json();
    } catch {
        return Response.json({error: 'Invalid JSON'}, {status: 400});
    }

    try {
        switch (body.action) {
            case 'schedule': {
                const {reminders} = body;
                if (!Array.isArray(reminders) || reminders.length > MAX_REMINDERS || !reminders.every(isReminder)) {
                    return Response.json({error: 'Invalid reminders'}, {status: 400});
                }
                const ids = await throttled(reminders, (reminder) =>
                    sendEmail(user.email, reminderEmail(reminder, user.firstName), reminder.sendAt ?? undefined));
                return Response.json({ids});
            }
            case 'cancel': {
                const {ids} = body;
                if (!Array.isArray(ids) || ids.length > MAX_REMINDERS || !ids.every((id) => isString(id, 100))) {
                    return Response.json({error: 'Invalid ids'}, {status: 400});
                }
                await throttled(ids, (id) => cancelEmail(user.email, id));
                return Response.json({cancelled: ids.length});
            }
            default:
                return Response.json({error: 'Unknown action'}, {status: 400});
        }
    } catch (error) {
        console.error('email-reminders failed', error);
        return Response.json({error: error instanceof Error ? error.message : 'Email failed'}, {status: 502});
    }
}
