/**
 * Follows the language the user picked in CloudCLI.
 *
 * The host does not publish its i18next instance to plugins, so the language is
 * read from the same source the host itself reads: the `user-preferences`
 * localStorage mirror, under `userLanguage`. That mirror is rewritten *before*
 * the host dispatches `user-preferences:changed`, so re-reading on that event
 * always sees the new value — which is what makes the plugin follow a live
 * language switch instead of only picking it up on reload.
 *
 * Two things this deliberately does not do:
 *   - read `navigator.language`, because a Chinese browser with an English host
 *     UI is a normal setup and the plugin has to match the host, not the OS;
 *   - ship every host language. `en`, `zh-CN` and `zh-TW` are complete; every
 *     other host language falls back to `en`, exactly like the host's own
 *     `fallbackLng`, so a French user sees English rather than Chinese.
 */

import { MESSAGES, SUPPORTED_LOCALES, type Locale, type MessageKey } from './messages.js';

/** The key the host keeps its preference mirror under (see shared/userSettings.ts). */
const HOST_PREFS_KEY = 'user-preferences';

/** Fired on `window` by the host after any preference change. */
const HOST_PREFS_CHANGED_EVENT = 'user-preferences:changed';

/** Per-language `{ createdAt }` formatting, so dates read naturally in each locale. */
const DATE_LOCALES: Record<Locale, string> = {
  en: 'en-US',
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
};

function isSupported(value: string): value is Locale {
  return (SUPPORTED_LOCALES as string[]).includes(value);
}

/** Maps any BCP 47 tag the host may hold onto a locale this build ships. */
export function resolveLocale(raw: string | null | undefined): Locale {
  if (!raw) return 'en';

  const value = raw.trim();
  if (isSupported(value)) return value;

  const lower = value.toLowerCase();
  if (lower === 'zh' || lower === 'zh-cn' || lower === 'zh-hans' || lower.startsWith('zh-hans')) return 'zh-CN';
  if (lower === 'zh-tw' || lower === 'zh-hk' || lower === 'zh-mo' || lower === 'zh-hant' || lower.startsWith('zh-hant')) return 'zh-TW';

  const base = lower.split('-')[0];
  if (isSupported(base)) return base;

  return 'en';
}

/**
 * Reads the language the host is currently using.
 *
 * The host resolves it as `readUserPreference('userLanguage')` against its
 * in-memory copy of the `user-preferences` mirror, defaulting to `en`. This
 * reads that same mirror key and nothing else, so the plugin cannot disagree
 * with the host: no `navigator.language` (a Chinese browser showing an English
 * UI is a real, supported case) and no legacy `userLanguage` key (the host only
 * consults that during the one-time migration, so reading it here would make the
 * plugin Chinese while the host stayed English on an install whose migration
 * never completed).
 *
 * Returns null when nothing is stored, which `resolveLocale` turns into `en` —
 * the host's own default.
 */
export function readHostLanguage(): string | null {
  try {
    const raw = localStorage.getItem(HOST_PREFS_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const value = (parsed as Record<string, unknown>).userLanguage;
      if (typeof value === 'string' && value) return value;
    }
  } catch {
    // Corrupt mirror or storage disabled: the host default applies.
  }

  return null;
}

export type I18n = {
  /** The locale currently in use. */
  readonly locale: Locale;
  /** Looks a key up, filling `{placeholders}` from `params`. */
  t(key: MessageKey, params?: Record<string, string | number>): string;
  /** Formats an ISO instant the way this locale writes dates. */
  formatDateTime(iso: string): string;
  /** Subscribes to host language changes; returns the unsubscribe function. */
  onChange(callback: (locale: Locale) => void): () => void;
  /** Drops the listeners this instance attached. */
  dispose(): void;
};

/**
 * Creates an instance bound to the host language.
 *
 * One instance per mount: the host imports the bundle once per surface, so a
 * module-level singleton would be shared across surfaces that never unmount
 * together.
 */
export function createI18n(): I18n {
  let locale = resolveLocale(readHostLanguage());
  const listeners = new Set<(locale: Locale) => void>();

  const applyLanguage = (): void => {
    const next = resolveLocale(readHostLanguage());
    if (next === locale) return;
    locale = next;
    for (const listener of listeners) listener(locale);
  };

  const t = (key: MessageKey, params?: Record<string, string | number>): string => {
    const template = MESSAGES[locale][key] ?? MESSAGES.en[key] ?? String(key);
    if (!params) return template;

    return template.replace(/\{(\w+)\}/g, (match, name: string) => (
      name in params ? String(params[name]) : match
    ));
  };

  const formatDateTime = (iso: string): string => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';

    try {
      // Date and time only: these are "created"/"modified" stamps, and seconds
      // would only add noise to a two-line card.
      return new Intl.DateTimeFormat(DATE_LOCALES[locale], {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
    } catch {
      return date.toISOString().slice(0, 16).replace('T', ' ');
    }
  };

  // The host's own event is the reliable signal; the `storage` event covers a
  // second tab changing the language in the same browser.
  const onHostEvent = (): void => { applyLanguage(); };
  const onStorage = (event: StorageEvent): void => {
    if (event.key === HOST_PREFS_KEY) applyLanguage();
  };

  window.addEventListener(HOST_PREFS_CHANGED_EVENT, onHostEvent);
  window.addEventListener('storage', onStorage);

  return {
    get locale() { return locale; },
    t,
    formatDateTime,
    onChange(callback) {
      listeners.add(callback);
      return () => { listeners.delete(callback); };
    },
    dispose() {
      window.removeEventListener(HOST_PREFS_CHANGED_EVENT, onHostEvent);
      window.removeEventListener('storage', onStorage);
      listeners.clear();
    },
  };
}
