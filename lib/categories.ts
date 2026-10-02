import {CATEGORIES, findService, type SubscriptionCategory} from "@/lib/catalog";
import {isCharged} from "@/lib/subscriptions";

export interface CategoryCount {
    category: SubscriptionCategory;
    count: number;
    share: number;
}

const isCategory = (value: string | undefined): value is SubscriptionCategory =>
    !!value && (CATEGORIES as readonly string[]).includes(value);

// The category the user picked, else the catalog's, else Other.
export const getCategory = (subscription: Subscription): SubscriptionCategory => {
    if (isCategory(subscription.category)) return subscription.category;
    return findService(subscription.name)?.category ?? 'Other';
};

// How many current (active or trial) subscriptions fall in each category, most first.
// Categories with nothing in them are left out.
export const getSubscriptionsByCategory = (subscriptions: Subscription[]): CategoryCount[] => {
    const current = subscriptions.filter(isCharged);
    if (current.length === 0) return [];
    return CATEGORIES
        .map((category) => {
            const count = current.filter((subscription) => getCategory(subscription) === category).length;
            return {category, count, share: count / current.length};
        })
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count);
};
