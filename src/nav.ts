/**
 * Localises this plugin's entry in the settings dialog's sidebar.
 *
 * The host renders the nav label straight from the manifest's `displayName`
 * (Settings.tsx: `label: plugin.displayName`), and the manifest is a single
 * string — there is no per-language name the host could pick. Rather than
 * leave every Chinese user a permanent English entry (or the reverse), the
 * resident surface rewrites that one text node as the host language changes.
 *
 * The rewrite is a text-node assignment only. It never touches attributes,
 * classes or listeners. If React re-renders the sidebar it writes the manifest
 * string back and this module rewrites it again; if the plugin is removed the
 * next render simply restores the manifest text, so nothing is left broken.
 */

import { createI18n, type I18n } from './i18n/index.js';
import type { PluginHostApi } from './types.js';

/** The exact string the host renders from the manifest's `displayName`. */
const MANIFEST_LABEL = 'Web UI Customizer';

/**
 * Rewrites the label in every matching nav row, both layouts.
 *
 * The desktop row (`[data-cloudcli-settings-nav]`) and the mobile pill render
 * `{page.label}` the same way: an icon span followed by a bare text node, so
 * the label is always the button's last child. Matching on that shape plus the
 * exact manifest string keeps the scan cheap and the false positives nil; a
 * future host that wraps the label simply stops being rewritten, which is the
 * safe failure. Nodes rewritten earlier are remembered so a language switch is
 * picked up even though the node no longer holds the manifest string.
 */
function rewriteLabels(label: string, seen: WeakSet<Text>): void {
  for (const button of document.querySelectorAll('button')) {
    const last = button.lastChild;
    if (!last || last.nodeType !== Node.TEXT_NODE) continue;

    const text = last as Text;
    const value = text.nodeValue;
    if (value !== MANIFEST_LABEL && !seen.has(text)) continue;
    if (value === label) continue;

    text.nodeValue = label;
    seen.add(text);
  }
}

/**
 * Keeps the sidebar label following the host language while the plugin runs.
 *
 * The sidebar only exists while the settings dialog is open, so an observer
 * watches the document: it sees the dialog appear, re-renders after a language
 * switch (React writes the manifest string back), and theme flips. A language
 * change without a re-render is covered by the i18n subscription. Mutation
 * bursts are coalesced to one scan per frame, so chat streaming cannot make
 * this hot.
 */
export function mountNavLocalizer(host: PluginHostApi): () => void {
  const i18n: I18n = createI18n();
  const seen = new WeakSet<Text>();

  let frame = 0;
  const schedule = (): void => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      rewriteLabels(i18n.t('nav.label'), seen);
    });
  };

  rewriteLabels(i18n.t('nav.label'), seen);

  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });

  const stopLanguage = i18n.onChange(schedule);

  return () => {
    observer.disconnect();
    stopLanguage();
    i18n.dispose();
    if (frame) cancelAnimationFrame(frame);
  };
}
