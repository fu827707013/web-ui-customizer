/** Persisted settings, plus the in-page event that makes a change live. */

import { normalizeHex } from './color.js';
import { THEMES, tokenById, type ThemeName } from './tokens.js';

const PREFS_KEY = 'web-ui-customizer-prefs';

/**
 * This plugin shipped earlier as `workspace-info-card`, which stored a single
 * `{ enabled }` record. That record is read once, when the current key is
 * absent, so the hover-card choice survives the rename instead of silently
 * reverting to "off" for anyone who had already turned it on.
 */
const LEGACY_PREFS_KEY = 'workspace-info-card-prefs';

/**
 * Fired on `window` by whichever surface changed the settings. Each plugin
 * surface is its own module instance (the host imports the bundle once per
 * mount), so the resident layer cannot observe the settings page's state
 * directly: it re-reads localStorage whenever this event arrives.
 */
export const SETTINGS_CHANGED_EVENT = 'web-ui-customizer:settings-changed';

/** `{ tokenId: { light?: '#rrggbb', dark?: '#rrggbb' } }` — only what the user changed. */
export type ColorOverrides = Record<string, Partial<Record<ThemeName, string>>>;

export type Prefs = {
  /** Shows the workspace hover card at all. Off by default, which leaves the sidebar exactly as shipped. */
  hoverCard: boolean;
  /** Colour overrides; an empty map means "the app looks exactly like stock". */
  colors: ColorOverrides;
};

/** Both features off, no colours touched: installing the plugin changes nothing. */
export const DEFAULT_PREFS: Prefs = {
  hoverCard: false,
  colors: {},
};

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as unknown : null;
  } catch {
    // Corrupt entry — the caller falls back to its defaults rather than throwing on mount.
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Keeps only overrides that name a token this build knows and carry a valid
 * hex colour, so a hand-edited or stale entry cannot inject arbitrary CSS.
 */
function readColors(value: unknown): ColorOverrides {
  if (!isRecord(value)) return {};

  const colors: ColorOverrides = {};
  for (const [id, perTheme] of Object.entries(value)) {
    if (!tokenById(id) || !isRecord(perTheme)) continue;

    for (const theme of THEMES) {
      const raw = perTheme[theme];
      if (typeof raw !== 'string') continue;

      const hex = normalizeHex(raw);
      if (!hex) continue;
      colors[id] = { ...colors[id], [theme]: hex };
    }
  }

  return colors;
}

/** Reads prefs, repairing anything a hand-edited or stale entry got wrong. */
export function loadPrefs(): Prefs {
  const stored = readJson(PREFS_KEY);
  if (isRecord(stored)) {
    return {
      hoverCard: stored.hoverCard === true,
      colors: readColors(stored.colors),
    };
  }

  const legacy = readJson(LEGACY_PREFS_KEY);
  if (isRecord(legacy)) {
    return { hoverCard: legacy.enabled === true, colors: {} };
  }

  return { hoverCard: DEFAULT_PREFS.hoverCard, colors: {} };
}

export function savePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Private mode or a full quota: the change still applies for this page.
  }
  window.dispatchEvent(new CustomEvent(SETTINGS_CHANGED_EVENT));
}

/** Returns a copy with one colour set, or the input unchanged when the hex is unusable. */
export function setColor(prefs: Prefs, tokenId: string, theme: ThemeName, hex: string): Prefs {
  const value = normalizeHex(hex);
  if (!value || !tokenById(tokenId)) return prefs;

  return {
    ...prefs,
    colors: {
      ...prefs.colors,
      [tokenId]: { ...prefs.colors[tokenId], [theme]: value },
    },
  };
}

/** Returns a copy with one colour back at the host default. */
export function clearColor(prefs: Prefs, tokenId: string, theme: ThemeName): Prefs {
  const current = prefs.colors[tokenId];
  if (!current || current[theme] === undefined) return prefs;

  const nextTheme = { ...current };
  delete nextTheme[theme];

  const colors = { ...prefs.colors };
  // Dropping the last theme of a token keeps the stored map free of empty objects.
  if (Object.keys(nextTheme).length === 0) delete colors[tokenId];
  else colors[tokenId] = nextTheme;

  return { ...prefs, colors };
}

/** How many individual colours are overridden, across both themes. */
export function countOverrides(prefs: Prefs): number {
  let count = 0;
  for (const perTheme of Object.values(prefs.colors)) count += Object.keys(perTheme).length;
  return count;
}
