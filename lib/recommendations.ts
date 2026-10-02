import {CATALOG, CATEGORIES, findService, type CatalogService, type SubscriptionCategory} from "@/lib/catalog";
import {getMonthlySpend, isCharged} from "@/lib/subscriptions";
import {formatCurrency} from "@/lib/utils";

export type Recommendation =
    // A way to pay less for what the user already has.
    | {kind: 'save'; id: string; title: string; body: string}
    // A popular service in a category the user has nothing in yet.
    | {kind: 'discover'; id: string; service: CatalogService};

const MAX_DISCOVER = 3;
// Categories where paying for two services is usually overlap rather than variety.
const OVERLAP_CATEGORIES: SubscriptionCategory[] = ['Music', 'AI Tools', 'Cloud'];

const listNames = (names: string[]) =>
    names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

// Simple, explainable rules over the built-in catalog: no network, nothing leaves the phone.
export const getRecommendations = (subscriptions: Subscription[]): Recommendation[] => {
    const owned = subscriptions
        .filter(isCharged)
        .map((subscription) => ({subscription, service: findService(subscription.name)}));
    const ownedIds = new Set(owned.flatMap(({service}) => (service ? [service.id] : [])));
    const has = (id: string) => ownedIds.has(id);
    const namesOf = (ids: string[]) =>
        owned.filter(({service}) => service && ids.includes(service.id)).map(({subscription}) => subscription.name);

    const tips: Recommendation[] = [];
    // Categories already explained by a specific tip, so the generic overlap tip doesn't repeat them.
    const covered = new Set<SubscriptionCategory>();

    const otherMusic = namesOf(['spotify', 'applemusic', 'youtubemusic', 'deezer', 'amazonmusic', 'tidal', 'soundcloud', 'boomplay', 'audiomack']);
    if (has('youtubepremium') && otherMusic.length > 0) {
        covered.add('Music');
        tips.push({
            kind: 'save', id: 'youtube-music',
            title: 'YouTube Premium already includes music',
            body: `It comes with YouTube Music, so you may not need ${listNames(otherMusic)} as well.`,
        });
    }

    const appleServices = namesOf(['applemusic', 'appletv', 'icloud']);
    if (appleServices.length >= 2) {
        tips.push({
            kind: 'save', id: 'apple-one',
            title: 'Apple One could cost less',
            body: `You pay for ${listNames(appleServices)} separately. Apple One bundles them with Apple Arcade in one plan.`,
        });
    }

    if (has('disneyplus') && has('hulu')) {
        tips.push({
            kind: 'save', id: 'disney-bundle',
            title: 'Bundle Disney+ and Hulu',
            body: 'Disney sells both together, which is usually cheaper than two separate plans.',
        });
    }

    const otherCloud = namesOf(['icloud', 'googleone', 'dropbox', 'onedrive', 'pcloud', 'mega']);
    if (has('microsoft365') && otherCloud.length > 0) {
        covered.add('Cloud');
        tips.push({
            kind: 'save', id: 'onedrive',
            title: 'Microsoft 365 includes 1 TB of storage',
            body: `Its OneDrive storage might replace ${listNames(otherCloud)}.`,
        });
    }

    for (const category of OVERLAP_CATEGORIES) {
        if (covered.has(category)) continue;
        const inCategory = owned.filter(({subscription, service}) =>
            (service?.category ?? subscription.category) === category);
        if (inCategory.length < 2) continue;
        const monthly = getMonthlySpend(inCategory.map(({subscription}) => subscription));
        tips.push({
            kind: 'save', id: `overlap-${category}`,
            title: `${inCategory.length} ${category} subscriptions`,
            body: `${listNames(inCategory.map(({subscription}) => subscription.name))} cost about `
                + `${formatCurrency(monthly)} a month together. Do you use all of them?`,
        });
    }

    // Only suggest yearly billing where the saving is worth the effort.
    const priciestMonthly = owned
        .map(({subscription}) => subscription)
        .filter((subscription) => subscription.status === 'active' && subscription.frequency === 'Monthly')
        .sort((a, b) => b.price - a.price)[0];
    if (priciestMonthly && priciestMonthly.price >= 8) {
        tips.push({
            kind: 'save', id: 'yearly',
            title: `Pay yearly for ${priciestMonthly.name}?`,
            body: `Yearly plans are often 15–20% cheaper. At ${formatCurrency(priciestMonthly.price, priciestMonthly.currency)} `
                + `a month that could save around ${formatCurrency(priciestMonthly.price * 12 * 0.15, priciestMonthly.currency)} a year.`,
        });
    }

    const ownedCategories = new Set(owned.map(({subscription, service}) => service?.category ?? subscription.category));
    const discover: Recommendation[] = CATEGORIES
        .filter((category) => category !== 'Other' && !ownedCategories.has(category))
        // The first catalog entry per category is its most popular service.
        .flatMap((category) => CATALOG.find((service) => service.category === category && !has(service.id)) ?? [])
        .slice(0, MAX_DISCOVER)
        .map((service) => ({kind: 'discover', id: `discover-${service.id}`, service}));

    return [...tips, ...discover];
};
