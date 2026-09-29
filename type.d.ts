import type { ImageSourcePropType } from "react-native";

declare global {
    interface AppTab {
        name: string;
        title: string;
        icon: ImageSourcePropType;
    }

    interface TabIconProps {
        focused: boolean;
        icon: ImageSourcePropType;
    }

    type SubscriptionFrequency = "Weekly" | "Monthly" | "Quarterly" | "Yearly";

    type SubscriptionStatus = "active" | "trial" | "paused" | "cancelled";

    // What is stored in the database. Renewal dates are derived from
    // startDate + frequency (see lib/subscriptions.ts), so they never go stale.
    interface Subscription {
        id: string;
        name: string;
        plan?: string;
        category?: string;
        paymentMethod?: string;
        status: SubscriptionStatus;
        startDate: string;
        price: number;
        currency?: string;
        frequency: SubscriptionFrequency;
        trialEndsAt?: string;
        notes?: string;
        color?: string;
    }

    interface SubscriptionCardProps extends Omit<Subscription, "id"> {
        expanded: boolean;
        onPress: () => void;
        onManagePress?: () => void;
    }

    interface UpcomingSubscription {
        id: string;
        name: string;
        price: number;
        currency?: string;
        daysLeft: number;
    }

    interface UpcomingSubscriptionCardProps
        extends Omit<UpcomingSubscription, "id"> {}

    interface ListHeadingProps {
        title: string;
        onViewAll?: () => void;
    }

    interface DailySpending {
        day: string;
        amount: number;
    }

    interface CreateSubscriptionModalProps {
        visible: boolean;
        onClose: () => void;
        onSubmit: (subscription: Subscription) => Promise<void>;
        // When set, the modal edits this subscription instead of creating a new one.
        initialValue?: Subscription;
    }

    interface SearchBarProps {
        value: string;
        onChangeText: (value: string) => void;
        placeholder?: string;
    }
}

export {};