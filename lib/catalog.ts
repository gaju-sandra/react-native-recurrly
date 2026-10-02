import {Platform} from "react-native";
import {nameCandidates} from "@/lib/brandIcons";

export const CATEGORIES = [
    'Entertainment',
    'AI Tools',
    'Developer Tools',
    'Design',
    'Productivity',
    'Cloud',
    'Music',
    'Other',
] as const;

export type SubscriptionCategory = typeof CATEGORIES[number];

export interface CatalogService {
    id: string;
    name: string;
    category: SubscriptionCategory;
    // Approximate entry-level US price per month, only used to give suggestions a ballpark.
    fromPrice: number;
    // The service's public homepage, opened from suggestions.
    website: string;
    // The provider's own page for managing or cancelling the plan. Missing when there is
    // no stable public link; cancelling then falls back to a web search.
    cancelUrl?: string;
    // Normalized names users type for this service (see `normalize` in lib/brandIcons).
    aliases: string[];
}

const APPLE_SUBSCRIPTIONS = 'https://apps.apple.com/account/subscriptions';

export const CATALOG: CatalogService[] = [
    // Entertainment
    {id: 'netflix', name: 'Netflix', category: 'Entertainment', fromPrice: 7.99,
        website: 'https://www.netflix.com',
        cancelUrl: 'https://www.netflix.com/cancelplan', aliases: ['netflix']},
    {id: 'disneyplus', name: 'Disney+', category: 'Entertainment', fromPrice: 9.99,
        website: 'https://www.disneyplus.com',
        cancelUrl: 'https://www.disneyplus.com/account/subscription', aliases: ['disneyplus', 'disney']},
    {id: 'hulu', name: 'Hulu', category: 'Entertainment', fromPrice: 9.99,
        website: 'https://www.hulu.com',
        cancelUrl: 'https://secure.hulu.com/account', aliases: ['hulu']},
    {id: 'youtubepremium', name: 'YouTube Premium', category: 'Entertainment', fromPrice: 13.99,
        website: 'https://www.youtube.com/premium',
        cancelUrl: 'https://www.youtube.com/paid_memberships', aliases: ['youtubepremium', 'youtube']},
    {id: 'amazonprime', name: 'Amazon Prime', category: 'Entertainment', fromPrice: 14.99,
        website: 'https://www.amazon.com/prime',
        cancelUrl: 'https://www.amazon.com/mc', aliases: ['amazonprime', 'primevideo', 'amazon', 'prime']},
    {id: 'appletv', name: 'Apple TV+', category: 'Entertainment', fromPrice: 9.99,
        website: 'https://tv.apple.com',
        cancelUrl: APPLE_SUBSCRIPTIONS, aliases: ['appletvplus', 'appletv']},
    {id: 'max', name: 'Max', category: 'Entertainment', fromPrice: 9.99,
        website: 'https://www.max.com', aliases: ['hbomax', 'max', 'hbo']},
    {id: 'paramountplus', name: 'Paramount+', category: 'Entertainment', fromPrice: 7.99,
        website: 'https://www.paramountplus.com',
        cancelUrl: 'https://www.paramountplus.com/account/', aliases: ['paramountplus', 'paramount']},
    {id: 'peacock', name: 'Peacock', category: 'Entertainment', fromPrice: 7.99,
        website: 'https://www.peacocktv.com', aliases: ['peacock', 'peacocktv']},
    {id: 'crunchyroll', name: 'Crunchyroll', category: 'Entertainment', fromPrice: 7.99,
        website: 'https://www.crunchyroll.com',
        cancelUrl: 'https://www.crunchyroll.com/account/membership', aliases: ['crunchyroll']},
    {id: 'showmax', name: 'Showmax', category: 'Entertainment', fromPrice: 3.99,
        website: 'https://www.showmax.com', aliases: ['showmax']},
    {id: 'dstv', name: 'DStv', category: 'Entertainment', fromPrice: 10,
        website: 'https://www.dstv.com', aliases: ['dstv', 'dstvnow', 'dstvstream']},
    {id: 'canalplus', name: 'Canal+', category: 'Entertainment', fromPrice: 10,
        website: 'https://www.canalplus.com', aliases: ['canalplus', 'canal']},
    {id: 'xboxgamepass', name: 'Xbox Game Pass', category: 'Entertainment', fromPrice: 9.99,
        website: 'https://www.xbox.com/xbox-game-pass',
        cancelUrl: 'https://account.microsoft.com/services', aliases: ['xboxgamepass', 'gamepass', 'xbox']},
    {id: 'psplus', name: 'PlayStation Plus', category: 'Entertainment', fromPrice: 9.99,
        website: 'https://www.playstation.com/ps-plus/',
        aliases: ['playstationplus', 'psplus', 'playstation', 'psn']},
    {id: 'nintendo', name: 'Nintendo Switch Online', category: 'Entertainment', fromPrice: 3.99,
        website: 'https://www.nintendo.com/switch/online/',
        aliases: ['nintendoswitchonline', 'nintendo']},
    {id: 'applearcade', name: 'Apple Arcade', category: 'Entertainment', fromPrice: 6.99,
        website: 'https://www.apple.com/apple-arcade/',
        cancelUrl: APPLE_SUBSCRIPTIONS, aliases: ['applearcade']},
    {id: 'kindleunlimited', name: 'Kindle Unlimited', category: 'Entertainment', fromPrice: 11.99,
        website: 'https://www.amazon.com/kindle-dbs/hz/subscribe/ku',
        cancelUrl: 'https://www.amazon.com/kindle-dbs/ku/ku-central', aliases: ['kindleunlimited', 'kindle']},
    {id: 'audible', name: 'Audible', category: 'Entertainment', fromPrice: 7.95,
        website: 'https://www.audible.com',
        cancelUrl: 'https://www.audible.com/account/overview', aliases: ['audible']},

    // Music
    {id: 'spotify', name: 'Spotify', category: 'Music', fromPrice: 11.99,
        website: 'https://www.spotify.com/premium/',
        cancelUrl: 'https://www.spotify.com/account/subscription/', aliases: ['spotify', 'spotifypremium']},
    {id: 'applemusic', name: 'Apple Music', category: 'Music', fromPrice: 10.99,
        website: 'https://www.apple.com/apple-music/',
        cancelUrl: APPLE_SUBSCRIPTIONS, aliases: ['applemusic']},
    {id: 'youtubemusic', name: 'YouTube Music', category: 'Music', fromPrice: 10.99,
        website: 'https://music.youtube.com',
        cancelUrl: 'https://www.youtube.com/paid_memberships', aliases: ['youtubemusic']},
    {id: 'deezer', name: 'Deezer', category: 'Music', fromPrice: 11.99,
        website: 'https://www.deezer.com',
        cancelUrl: 'https://www.deezer.com/account/subscription', aliases: ['deezer']},
    {id: 'amazonmusic', name: 'Amazon Music Unlimited', category: 'Music', fromPrice: 10.99,
        website: 'https://www.amazon.com/music/unlimited',
        cancelUrl: 'https://www.amazon.com/music/settings', aliases: ['amazonmusicunlimited', 'amazonmusic']},
    {id: 'tidal', name: 'Tidal', category: 'Music', fromPrice: 10.99,
        website: 'https://tidal.com',
        cancelUrl: 'https://account.tidal.com/subscription', aliases: ['tidal']},
    {id: 'soundcloud', name: 'SoundCloud Go+', category: 'Music', fromPrice: 4.99,
        website: 'https://soundcloud.com/go',
        cancelUrl: 'https://soundcloud.com/settings/subscriptions', aliases: ['soundcloudgoplus', 'soundcloudgo', 'soundcloud']},
    {id: 'boomplay', name: 'Boomplay', category: 'Music', fromPrice: 2,
        website: 'https://www.boomplay.com', aliases: ['boomplay']},
    {id: 'audiomack', name: 'Audiomack', category: 'Music', fromPrice: 4.99,
        website: 'https://audiomack.com', aliases: ['audiomack']},

    // AI Tools
    {id: 'chatgpt', name: 'ChatGPT Plus', category: 'AI Tools', fromPrice: 20,
        website: 'https://chatgpt.com',
        cancelUrl: 'https://chatgpt.com/#settings/Subscription', aliases: ['chatgptplus', 'chatgpt', 'openai']},
    {id: 'claude', name: 'Claude Pro', category: 'AI Tools', fromPrice: 20,
        website: 'https://claude.ai',
        cancelUrl: 'https://claude.ai/settings/billing', aliases: ['claudepro', 'claude']},
    {id: 'perplexity', name: 'Perplexity Pro', category: 'AI Tools', fromPrice: 20,
        website: 'https://www.perplexity.ai',
        aliases: ['perplexitypro', 'perplexity']},
    // Gemini plans are billed through Google One.
    {id: 'gemini', name: 'Google AI Pro', category: 'AI Tools', fromPrice: 19.99,
        website: 'https://gemini.google.com',
        cancelUrl: 'https://one.google.com/settings', aliases: ['googleaipro', 'googleai', 'geminiadvanced', 'gemini']},
    {id: 'midjourney', name: 'Midjourney', category: 'AI Tools', fromPrice: 10,
        website: 'https://www.midjourney.com',
        cancelUrl: 'https://www.midjourney.com/account', aliases: ['midjourney']},
    {id: 'cursor', name: 'Cursor Pro', category: 'AI Tools', fromPrice: 20,
        website: 'https://cursor.com',
        cancelUrl: 'https://cursor.com/settings', aliases: ['cursorpro', 'cursor']},
    {id: 'grammarly', name: 'Grammarly Premium', category: 'Productivity', fromPrice: 12,
        website: 'https://www.grammarly.com',
        cancelUrl: 'https://account.grammarly.com/subscription', aliases: ['grammarlypremium', 'grammarlypro', 'grammarly']},

    // Developer Tools
    {id: 'githubcopilot', name: 'GitHub Copilot', category: 'Developer Tools', fromPrice: 10,
        website: 'https://github.com/features/copilot',
        cancelUrl: 'https://github.com/settings/billing', aliases: ['githubcopilot', 'copilot']},
    {id: 'github', name: 'GitHub Pro', category: 'Developer Tools', fromPrice: 4,
        website: 'https://github.com',
        cancelUrl: 'https://github.com/settings/billing', aliases: ['githubpro', 'github']},
    {id: 'jetbrains', name: 'JetBrains', category: 'Developer Tools', fromPrice: 9.9,
        website: 'https://www.jetbrains.com',
        cancelUrl: 'https://account.jetbrains.com/licenses', aliases: ['jetbrains', 'intellij', 'webstorm', 'pycharm']},
    {id: 'digitalocean', name: 'DigitalOcean', category: 'Developer Tools', fromPrice: 4,
        website: 'https://www.digitalocean.com',
        cancelUrl: 'https://cloud.digitalocean.com/account/billing', aliases: ['digitalocean']},
    {id: 'vercel', name: 'Vercel Pro', category: 'Developer Tools', fromPrice: 20,
        website: 'https://vercel.com', aliases: ['vercelpro', 'vercel']},
    {id: 'replit', name: 'Replit Core', category: 'Developer Tools', fromPrice: 20,
        website: 'https://replit.com', aliases: ['replitcore', 'replit']},
    {id: 'frontendmasters', name: 'Frontend Masters', category: 'Developer Tools', fromPrice: 39,
        website: 'https://frontendmasters.com',
        aliases: ['frontendmasters']},

    // Design
    {id: 'canva', name: 'Canva Pro', category: 'Design', fromPrice: 15,
        website: 'https://www.canva.com',
        cancelUrl: 'https://www.canva.com/settings/billing-and-plans', aliases: ['canvapro', 'canva']},
    {id: 'figma', name: 'Figma', category: 'Design', fromPrice: 16,
        website: 'https://www.figma.com', aliases: ['figma']},
    {id: 'adobe', name: 'Adobe Creative Cloud', category: 'Design', fromPrice: 59.99,
        website: 'https://www.adobe.com/creativecloud.html',
        cancelUrl: 'https://account.adobe.com/plans', aliases: ['adobecreativecloud', 'adobe', 'photoshop', 'creativecloud']},
    {id: 'framer', name: 'Framer', category: 'Design', fromPrice: 10,
        website: 'https://www.framer.com', aliases: ['framer']},
    {id: 'envato', name: 'Envato Elements', category: 'Design', fromPrice: 16.5,
        website: 'https://elements.envato.com', aliases: ['envatoelements', 'envato']},
    {id: 'capcut', name: 'CapCut Pro', category: 'Design', fromPrice: 7.99,
        website: 'https://www.capcut.com', aliases: ['capcutpro', 'capcut']},

    // Productivity
    {id: 'notion', name: 'Notion Plus', category: 'Productivity', fromPrice: 12,
        website: 'https://www.notion.so', aliases: ['notionplus', 'notion']},
    {id: 'microsoft365', name: 'Microsoft 365', category: 'Productivity', fromPrice: 9.99,
        website: 'https://www.microsoft.com/microsoft-365',
        cancelUrl: 'https://account.microsoft.com/services', aliases: ['microsoft365', 'office365', 'office', 'microsoft']},
    {id: 'medium', name: 'Medium', category: 'Productivity', fromPrice: 5,
        website: 'https://medium.com',
        cancelUrl: 'https://medium.com/me/settings/membership', aliases: ['medium']},
    {id: 'zoom', name: 'Zoom Pro', category: 'Productivity', fromPrice: 13.33,
        website: 'https://zoom.us',
        cancelUrl: 'https://zoom.us/billing', aliases: ['zoompro', 'zoom']},
    {id: 'todoist', name: 'Todoist Pro', category: 'Productivity', fromPrice: 5,
        website: 'https://todoist.com',
        cancelUrl: 'https://todoist.com/app/settings/subscription', aliases: ['todoistpro', 'todoist']},
    {id: 'linkedinpremium', name: 'LinkedIn Premium', category: 'Productivity', fromPrice: 29.99,
        website: 'https://premium.linkedin.com',
        aliases: ['linkedinpremium', 'linkedin']},
    {id: 'duolingo', name: 'Duolingo Super', category: 'Productivity', fromPrice: 12.99,
        website: 'https://www.duolingo.com',
        aliases: ['duolingosuper', 'duolingomax', 'duolingo']},
    {id: 'coursera', name: 'Coursera Plus', category: 'Productivity', fromPrice: 59,
        website: 'https://www.coursera.org/courseraplus',
        cancelUrl: 'https://www.coursera.org/my-purchases', aliases: ['courseraplus', 'coursera']},
    {id: 'nordvpn', name: 'NordVPN', category: 'Productivity', fromPrice: 3.99,
        website: 'https://nordvpn.com',
        cancelUrl: 'https://my.nordaccount.com/dashboard/nordvpn/', aliases: ['nordvpn', 'nord']},
    {id: 'expressvpn', name: 'ExpressVPN', category: 'Productivity', fromPrice: 6.67,
        website: 'https://www.expressvpn.com', aliases: ['expressvpn']},
    {id: '1password', name: '1Password', category: 'Productivity', fromPrice: 2.99,
        website: 'https://1password.com', aliases: ['1password', 'onepassword']},

    // Other
    {id: 'strava', name: 'Strava', category: 'Other', fromPrice: 11.99,
        website: 'https://www.strava.com',
        cancelUrl: 'https://www.strava.com/account', aliases: ['stravasubscription', 'strava']},
    {id: 'headspace', name: 'Headspace', category: 'Other', fromPrice: 12.99,
        website: 'https://www.headspace.com', aliases: ['headspace']},
    {id: 'calm', name: 'Calm', category: 'Other', fromPrice: 14.99,
        website: 'https://www.calm.com', aliases: ['calm']},
    {id: 'nytimes', name: 'The New York Times', category: 'Other', fromPrice: 4,
        website: 'https://www.nytimes.com',
        cancelUrl: 'https://myaccount.nytimes.com/seg/subscription',
        aliases: ['thenewyorktimes', 'newyorktimes', 'nytimes', 'nyt']},

    // Cloud
    {id: 'icloud', name: 'iCloud+', category: 'Cloud', fromPrice: 0.99,
        website: 'https://www.icloud.com',
        cancelUrl: APPLE_SUBSCRIPTIONS, aliases: ['icloudplus', 'icloud']},
    {id: 'googleone', name: 'Google One', category: 'Cloud', fromPrice: 1.99,
        website: 'https://one.google.com',
        cancelUrl: 'https://one.google.com/settings', aliases: ['googleone', 'googledrive']},
    {id: 'dropbox', name: 'Dropbox Plus', category: 'Cloud', fromPrice: 11.99,
        website: 'https://www.dropbox.com',
        cancelUrl: 'https://www.dropbox.com/account/plan', aliases: ['dropboxplus', 'dropbox']},
    {id: 'onedrive', name: 'OneDrive', category: 'Cloud', fromPrice: 1.99,
        website: 'https://www.microsoft.com/microsoft-365/onedrive/online-cloud-storage',
        cancelUrl: 'https://account.microsoft.com/services', aliases: ['onedrive', 'microsoftonedrive']},
    {id: 'pcloud', name: 'pCloud', category: 'Cloud', fromPrice: 4.99,
        website: 'https://www.pcloud.com', aliases: ['pcloud']},
    {id: 'mega', name: 'MEGA', category: 'Cloud', fromPrice: 5.49,
        website: 'https://mega.io', aliases: ['mega', 'meganz']},
];

const byAlias = new Map<string, CatalogService>();
for (const service of CATALOG) {
    for (const alias of service.aliases) byAlias.set(alias, service);
}

// "Netflix Premium" -> Netflix, "GitHub Copilot" -> GitHub Copilot (longest name match wins).
export const findService = (name: string): CatalogService | null => {
    for (const candidate of nameCandidates(name)) {
        const service = byAlias.get(candidate);
        if (service) return service;
    }
    return null;
};

// Subscriptions bought inside an app are billed (and must be cancelled) by the store.
export const STORE_SUBSCRIPTIONS = Platform.select({
    ios: {label: 'App Store', url: APPLE_SUBSCRIPTIONS},
    default: {label: 'Google Play', url: 'https://play.google.com/store/account/subscriptions'},
});

// Where to send someone who wants to cancel: the provider's page, or a search for it.
export const getCancelLink = (name: string): {url: string; known: boolean} => {
    const url = findService(name)?.cancelUrl;
    if (url) return {url, known: true};
    const query = encodeURIComponent(`how to cancel ${name} subscription`);
    return {url: `https://www.google.com/search?q=${query}`, known: false};
};
