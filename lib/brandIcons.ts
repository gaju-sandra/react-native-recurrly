import type {ImageSourcePropType} from "react-native";
import * as simpleIcons from "simple-icons";
import {icons} from "@/constants/icons";

export type BrandIcon =
    | {type: 'image'; source: ImageSourcePropType}
    | {type: 'svg'; xml: string};

// Same rules Simple Icons uses for its slugs, so "Disney+" matches "disneyplus".
const normalize = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/\+/g, 'plus')
        .replace(/\./g, 'dot')
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]/g, '');

// Hand-picked PNGs in assets/icons win over Simple Icons.
const LOCAL_ICONS: Record<string, ImageSourcePropType> = {
    adobe: icons.adobe,
    canva: icons.canva,
    claude: icons.claude,
    dropbox: icons.dropbox,
    figma: icons.figma,
    github: icons.github,
    medium: icons.medium,
    netflix: icons.netflix,
    notion: icons.notion,
    openai: icons.openai,
    chatgpt: icons.openai,
    spotify: icons.spotify,
};

type SimpleIcon = {title: string; slug: string; hex: string; path: string};

let simpleIconIndex: Map<string, SimpleIcon> | null = null;

const getSimpleIconIndex = () => {
    if (simpleIconIndex) return simpleIconIndex;

    simpleIconIndex = new Map();
    for (const icon of Object.values(simpleIcons) as SimpleIcon[]) {
        if (!icon?.path) continue;
        simpleIconIndex.set(icon.slug, icon);
        const titleKey = normalize(icon.title);
        if (!simpleIconIndex.has(titleKey)) simpleIconIndex.set(titleKey, icon);
    }
    return simpleIconIndex;
};

// Very light brand colors (e.g. white logos) would vanish on the card, so darken them.
const readableHex = (hex: string) => {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.85 ? '081126' : hex;
};

const toSvg = (icon: SimpleIcon) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#${readableHex(icon.hex)}" d="${icon.path}"/></svg>`;

// "GitHub Pro Plan" -> ["githubproplan", "githubpro", "github"]; "iCloud+" -> ["icloudplus", "icloud"]
export const nameCandidates = (name: string) => {
    const words = name.trim().split(/\s+/);
    const candidates: string[] = [];
    for (let length = words.length; length > 0; length--) {
        const phrase = words.slice(0, length).join(' ');
        for (const key of [normalize(phrase), normalize(phrase.replace(/\+/g, ''))]) {
            if (key.length >= 3 && !candidates.includes(key)) candidates.push(key);
        }
    }
    return candidates;
};

const cache = new Map<string, BrandIcon | null>();

export const findBrandIcon = (name: string): BrandIcon | null => {
    const cacheKey = normalize(name);
    if (cache.has(cacheKey)) return cache.get(cacheKey)!;

    let result: BrandIcon | null = null;
    for (const candidate of nameCandidates(name)) {
        const local = LOCAL_ICONS[candidate];
        if (local) {
            result = {type: 'image', source: local};
            break;
        }
        const simpleIcon = getSimpleIconIndex().get(candidate);
        if (simpleIcon) {
            result = {type: 'svg', xml: toSvg(simpleIcon)};
            break;
        }
    }

    cache.set(cacheKey, result);
    return result;
};
