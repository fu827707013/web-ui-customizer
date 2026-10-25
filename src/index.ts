/**
 * web-ui-customizer — appearance settings for the CloudCLI web app.
 *
 * The manifest sets `alwaysMount`, so the host mounts this bundle in its
 * resident plugin layer as soon as the app starts. That surface owns two jobs:
 * it paints the stored colour overrides onto the document, and it runs the
 * workspace hover card. Without it, the settings page alone would only be able
 * to recolour the app while that page is open.
 *
 * The manifest also sets `slot: "settings"`, so the panel is a page inside the
 * settings dialog rather than a workspace tab — this plugin configures the app
 * and has no reason to occupy a workspace view.
 *
 * Each surface is a separate module instance of the same bundle, so shared
 * state travels through localStorage plus SETTINGS_CHANGED_EVENT (see
 * prefs.ts); the host re-imports the bundle from a fresh Blob URL for every
 * mount, so module scope is not a safe place for state.
 */

import { watchAppearance } from './apply.js';
import { mountWorkspaceInfoCard } from './card.js';
import { mountNavLocalizer } from './nav.js';
import { mountSettingsPanel } from './panel.js';
import { injectStyles } from './ui/styles.js';
import type { PluginHostApi } from './types.js';

/**
 * Teardown per mount target.
 *
 * A host may mount twice into the same node without unmounting first (leaving
 * the settings page tears down through the returned cleanup, but a re-import
 * does not), so the previous teardown is looked up by container rather than
 * assumed.
 */
const containerTeardowns = new WeakMap<HTMLElement, () => void>();

/** Closes over both surfaces: the card plus colour sheet, or the settings panel. */
function mountFor(container: HTMLElement, host: PluginHostApi): () => void {
  if (host.context.surface === 'resident') {
    // The colour overrides belong to the whole document, so the surface that is
    // always mounted owns their lifetime. The card is a second, independent job,
    // and so is the settings sidebar label, which the host renders from the
    // manifest's single-string displayName and therefore cannot translate.
    const stopWatching = watchAppearance();
    const stopCard = mountWorkspaceInfoCard(host);
    const stopNav = mountNavLocalizer(host);
    return () => {
      stopNav();
      stopCard();
      stopWatching();
    };
  }

  // 'settings' (and a legacy 'tab' mount of an older manifest) both render the panel.
  return mountSettingsPanel(container);
}

/**
 * Mounts the surface the host asked for.
 *
 * A resident mount renders the hover card only: its container is empty and
 * zero-sized, so it is the wrong place for anything the user has to see.
 */
export function mount(container: HTMLElement, host: PluginHostApi): void {
  containerTeardowns.get(container)?.();

  // Every surface renders DOM of its own, and the resident one may mount before
  // the settings page has ever been opened, so the sheet is injected here.
  injectStyles();

  containerTeardowns.set(container, mountFor(container, host));
}

/** Releases everything this mount attached; the host calls it when the page closes and on shutdown. */
export function unmount(container: HTMLElement): void {
  containerTeardowns.get(container)?.();
  containerTeardowns.delete(container);
  container.replaceChildren();
}
