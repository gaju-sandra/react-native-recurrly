import dayjs, { type Dayjs, type ManipulateType } from "dayjs";

// How far one billing period moves the calendar.
const PERIOD: Record<SubscriptionFrequency, [amount: number, unit: ManipulateType]> = {
  Weekly: [1, "week"],
  Monthly: [1, "month"],
  Quarterly: [3, "month"],
  Yearly: [1, "year"],
};

// How many times a subscription is charged in one month, on average.
const CHARGES_PER_MONTH: Record<SubscriptionFrequency, number> = {
  Weekly: 52 / 12,
  Monthly: 1,
  Quarterly: 1 / 3,
  Yearly: 1 / 12,
};

export const FREQUENCY_LABEL: Record<SubscriptionFrequency, string> = {
  Weekly: "per week",
  Monthly: "per month",
  Quarterly: "per quarter",
  Yearly: "per year",
};

// Charge number n is always start + n periods, computed from the *start date* instead of
// from the previous charge: Jan 31 + 1 month = Feb 28, and Feb 28 + 1 month would give
// Mar 28, whereas Jan 31 + 2 months correctly gives Mar 31.
const chargeDate = (start: Dayjs, frequency: SubscriptionFrequency, n: number): Dayjs => {
  const [amount, unit] = PERIOD[frequency];
  return start.add(n * amount, unit);
};

// Index of the first charge on or after `from` (0 = the start date itself).
const firstChargeIndex = (start: Dayjs, frequency: SubscriptionFrequency, from: Dayjs): number => {
  let n = 0;
  while (chargeDate(start, frequency, n).isBefore(from, "day")) n += 1;
  return n;
};

// First charge date on or after `from`. A renewal today counts as upcoming.
export const getNextRenewalDate = (
  startDate: string,
  frequency: SubscriptionFrequency,
  from: Dayjs = dayjs(),
): Dayjs => {
  const start = dayjs(startDate);
  return chargeDate(start, frequency, firstChargeIndex(start, frequency, from));
};

// Every charge date of one subscription between `from` and `to` (both inclusive, by day).
// Powers the weekly chart, the month-over-month change and, later, the calendar view.
export const getRenewalDatesBetween = (subscription: Subscription, from: Dayjs, to: Dayjs): Dayjs[] => {
  const start = dayjs(subscription.startDate);
  const dates: Dayjs[] = [];
  for (let n = firstChargeIndex(start, subscription.frequency, from); ; n += 1) {
    const date = chargeDate(start, subscription.frequency, n);
    if (date.isAfter(to, "day")) return dates;
    dates.push(date);
  }
};

// Only active subscriptions are charged. Trials become paid in Phase 2 (trialEndsAt).
const isCharged = (subscription: Subscription) => subscription.status === "active";

// Monthly cost of active subscriptions, with every frequency converted to a monthly amount.
export const getMonthlySpend = (subscriptions: Subscription[]): number =>
  subscriptions
    .filter(isCharged)
    .reduce(
      (total, subscription) => total + subscription.price * CHARGES_PER_MONTH[subscription.frequency],
      0,
    );

// Total actually charged between two dates.
export const getSpendBetween = (subscriptions: Subscription[], from: Dayjs, to: Dayjs): number =>
  subscriptions
    .filter(isCharged)
    .reduce(
      (total, subscription) =>
        total + getRenewalDatesBetween(subscription, from, to).length * subscription.price,
      0,
    );

// Renewals in the next `days` days (today included), soonest first.
export const getUpcoming = (
  subscriptions: Subscription[],
  days = 7,
  from: Dayjs = dayjs(),
): UpcomingSubscription[] =>
  subscriptions
    .filter(isCharged)
    .map((subscription) => ({
      id: subscription.id,
      name: subscription.name,
      price: subscription.price,
      currency: subscription.currency,
      daysLeft: getNextRenewalDate(subscription.startDate, subscription.frequency, from)
        .startOf("day")
        .diff(from.startOf("day"), "day"),
    }))
    .filter((item) => item.daysLeft <= days)
    .sort((a, b) => a.daysLeft - b.daysLeft);

// Soonest renewal across all charged subscriptions, or null when there are none.
export const getNextRenewal = (subscriptions: Subscription[], from: Dayjs = dayjs()): Dayjs | null =>
  subscriptions
    .filter(isCharged)
    .map((subscription) => getNextRenewalDate(subscription.startDate, subscription.frequency, from))
    .reduce<Dayjs | null>((soonest, date) => (!soonest || date.isBefore(soonest) ? date : soonest), null);

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Amount charged on each day of the current week, Monday to Sunday.
export const getWeeklySpending = (subscriptions: Subscription[], from: Dayjs = dayjs()): DailySpending[] => {
  // dayjs weeks start on Sunday (day() === 0), so shift back to Monday.
  const monday = from.startOf("day").subtract((from.day() + 6) % 7, "day");
  return WEEK_DAYS.map((day, index) => {
    const date = monday.add(index, "day");
    return { day, amount: getSpendBetween(subscriptions, date, date) };
  });
};

// Percent change of this month's charges compared with last month's.
// null when last month had no charges, since a change from 0 has no meaningful percentage.
export const getMonthOverMonthChange = (subscriptions: Subscription[], from: Dayjs = dayjs()): number | null => {
  const lastMonth = from.subtract(1, "month");
  const thisTotal = getSpendBetween(subscriptions, from.startOf("month"), from.endOf("month"));
  const lastTotal = getSpendBetween(subscriptions, lastMonth.startOf("month"), lastMonth.endOf("month"));
  if (lastTotal === 0) return null;
  return Math.round(((thisTotal - lastTotal) / lastTotal) * 100);
};
