import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import dayjs from "dayjs";
import { formatCurrency } from "@/lib/utils";
import { getRenewalDatesBetween } from "@/lib/subscriptions";

const CHANNEL_ID = "renewals";
const REMINDER_HOUR = 9; // Reminders fire at 9:00 local time.
const LOOKAHEAD_DAYS = 60;
// iOS keeps at most 64 scheduled notifications per app; stay safely under it.
const MAX_SCHEDULED = 60;

// Show reminders as a banner even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Android 13+ needs the channel to exist before asking for permission.
const ensureChannel = async () => {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Renewal reminders",
    importance: Notifications.AndroidImportance.HIGH,
  });
};

// Returns true when notifications are allowed. Only shows the system prompt
// if the user has never answered it; after a "no", the OS won't ask again.
export const requestReminderPermission = async (): Promise<boolean> => {
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
};

const whenLabel = (daysBefore: number) => {
  if (daysBefore === 0) return "today";
  if (daysBefore === 1) return "tomorrow";
  return `in ${daysBefore} days`;
};

// Rebuilds the whole reminder schedule from scratch. Recomputing everything on each
// change is simpler and safer than tracking which notification belongs to which edit.
export const syncRenewalReminders = async (
  subscriptions: Subscription[],
  { enabled, daysBefore }: { enabled: boolean; daysBefore: number },
) => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled) return;

  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;
  await ensureChannel();

  const now = dayjs();
  const reminders = subscriptions
    .filter((subscription) => subscription.status === "active")
    .flatMap((subscription) =>
      getRenewalDatesBetween(subscription, now, now.add(LOOKAHEAD_DAYS, "day")).map((renewal) => ({
        subscription,
        renewal,
        fireAt: renewal.subtract(daysBefore, "day").hour(REMINDER_HOUR).minute(0).second(0),
      })),
    )
    .filter(({ fireAt }) => fireAt.isAfter(now))
    .sort((a, b) => a.fireAt.valueOf() - b.fireAt.valueOf())
    .slice(0, MAX_SCHEDULED);

  await Promise.all(
    reminders.map(({ subscription, renewal, fireAt }) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: `${subscription.name} renews ${whenLabel(daysBefore)}`,
          body: `${formatCurrency(subscription.price, subscription.currency)} will be charged on ${renewal.format("MMM D")}.`,
          // Read by useReminderNavigation to open the subscription when tapped.
          data: { url: `/subscriptions/${subscription.id}` },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fireAt.toDate(),
          channelId: CHANNEL_ID,
        },
      }),
    ),
  );
};

// Used on sign-out so the next person on this phone doesn't get someone else's reminders.
export const cancelAllReminders = () => Notifications.cancelAllScheduledNotificationsAsync();
