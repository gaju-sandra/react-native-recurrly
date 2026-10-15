import dayjs, {type Dayjs} from "dayjs";
import {getNextRenewalDate, getRenewalDatesBetween, isCharged} from "@/lib/subscriptions";

// An unpaid renewal shows as overdue for this many days, then the next one takes over.
// Many subscriptions charge the card automatically, so older unconfirmed ones aren't nagged about.
export const OVERDUE_DAYS = 7;

export const toDueDate = (date: Dayjs) => date.format('YYYY-MM-DD');

export type BillState = 'overdue' | 'due-today' | 'upcoming' | 'paid';

export interface Bill {
    state: BillState;
    // The renewal this bill is for (YYYY-MM-DD).
    dueDate: string;
    daysOverdue: number;
    // Set when state is 'paid'.
    payment?: Payment;
    // The renewal after this one, shown once this bill is paid.
    nextDueDate: string;
}

export const findPayment = (payments: Payment[], subscriptionId: string, dueDate: string) =>
    payments.find((payment) => payment.subscriptionId === subscriptionId && payment.dueDate === dueDate);

// The bill to show for a subscription right now: an unpaid renewal from the last
// OVERDUE_DAYS days (today included), otherwise the next one. null when nothing is charged.
export const getBill = (subscription: Subscription, payments: Payment[], today: Dayjs = dayjs()): Bill | null => {
    if (!isCharged(subscription)) return null;
    const day = today.startOf('day');
    const nextAfterToday = toDueDate(getNextRenewalDate(subscription, day.add(1, 'day')));

    const recent = getRenewalDatesBetween(subscription, day.subtract(OVERDUE_DAYS, 'day'), day);
    const lastDue = recent.length > 0 ? recent[recent.length - 1] : null;

    if (lastDue) {
        const dueDate = toDueDate(lastDue);
        const payment = findPayment(payments, subscription.id, dueDate);
        const daysOverdue = day.diff(lastDue.startOf('day'), 'day');
        if (!payment) {
            return {state: daysOverdue > 0 ? 'overdue' : 'due-today', dueDate, daysOverdue, nextDueDate: nextAfterToday};
        }
        // Paid: keep showing it until the next renewal is paid early.
        const nextPayment = findPayment(payments, subscription.id, nextAfterToday);
        if (!nextPayment) return {state: 'paid', dueDate, daysOverdue: 0, payment, nextDueDate: nextAfterToday};
    }

    const nextPayment = findPayment(payments, subscription.id, nextAfterToday);
    if (nextPayment) {
        const following = toDueDate(getNextRenewalDate(subscription, dayjs(nextAfterToday).add(1, 'day')));
        return {state: 'paid', dueDate: nextAfterToday, daysOverdue: 0, payment: nextPayment, nextDueDate: following};
    }
    return {state: 'upcoming', dueDate: nextAfterToday, daysOverdue: 0, nextDueDate: nextAfterToday};
};

export const billLabel = (bill: Bill): string => {
    const due = dayjs(bill.dueDate).format('MMM D');
    switch (bill.state) {
        case 'overdue':
            return `Overdue · ${bill.daysOverdue} ${bill.daysOverdue === 1 ? 'day' : 'days'} (${due})`;
        case 'due-today':
            return `Due today (${due})`;
        case 'paid':
            return `Paid ✓ (${due})`;
        case 'upcoming':
            return `Next due ${due}`;
    }
};
