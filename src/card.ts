/**
 * Workspace info card.
 *
 * Attaches to the sidebar through the host's row contract — every workspace row
 * carries `data-cloudcli-project-path` and `data-cloudcli-project-name` — so
 * this module never reaches into React internals and keeps working when the
 * sidebar re-renders. One delegated listener on `document` replaces any per-row
 * wiring, which is what makes the card work for rows mounted after the plugin.
 *
 * The card is painted entirely from the host's theme variables, so it looks
 * native in both themes and picks up any accent the user sets in this plugin's
 * own settings panel.
 */

import { copyText } from './clipboard.js';
import { loadPrefs, SETTINGS_CHANGED_EVENT } from './prefs.js';
import { CARD_CLASS } from './ui/styles.js';
import { ALERT_ICON, CHECK_ICON, COPY_ICON } from './ui/icons.js';
import type { PluginHostApi } from './types.js';

/** The attribute the host puts on every workspace row, in both sidebar layouts. */
const ROW_ATTRIBUTE = 'data-cloudcli-project-path';
const NAME_ATTRIBUTE = 'data-cloudcli-project-name';

/** A short delay keeps the card from flashing while the pointer sweeps the list. */
const SHOW_DELAY_MS = 140;

/**
 * Long enough to travel from the row to the card across the gap between them,
 * short enough that the card does not linger after the pointer leaves.
 */
const HIDE_DELAY_MS = 260;

/** Gap between the row and the card, in pixels. */
const CARD_GAP = 8;

/** How long the action footer stays in its "copied" state before reverting. */
const COPY_FEEDBACK_MS = 1600;

/** On-disk times for one workspace, as reported by the plugin's own server. */
type WorkspaceTimes = {
  /** ISO instant the directory was created, or null when the filesystem does not report one. */
  createdAt: string | null;
  /** ISO instant of the directory's last modification. */
  modifiedAt: string | null;
};

type CardElements = {
  root: HTMLDivElement;
  name: HTMLElement;
  path: HTMLElement;
  meta: HTMLElement;
  action: HTMLButtonElement;
};

/**
 * Formats an ISO instant the way the card reads it: local time, no seconds, in
 * the `2026年10月25日 00:20` shape the rest of this panel uses. Built by hand
 * because `toLocaleString` renders a locale-dependent separator that would not
 * match the surrounding Chinese labels.
 */
function formatInstant(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${date.getFullYear()}年${pad(date.getMonth() + 1)}月${pad(date.getDate())}日 `
    + `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function buildCardElements(): CardElements {
  const root = element('div', CARD_CLASS);
  // A group rather than a dialog: the card is a hover affordance that never
  // takes focus, and `role="dialog"` would advertise a modal the host does not
  // manage (and would collide with the settings dialog in `[role="dialog"]`
  // lookups). The label still gives screen readers a name for the content.
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', '工作区信息');

  const head = element('div', `${CARD_CLASS}-head`);
  const name = element('span', `${CARD_CLASS}-name`);
  head.append(element('span', `${CARD_CLASS}-dot`), name);

  const path = element('span', `${CARD_CLASS}-path`);
  const meta = element('span', `${CARD_CLASS}-meta`);

  // A real button, so the copy action is reachable with the keyboard (the whole
  // card is clickable, the footer is just what announces the action).
  const action = element('button', `${CARD_CLASS}-action`);
  action.type = 'button';

  root.append(head, path, meta, action);
  return { root, name, path, meta, action };
}

/** Sets the action line to its idle, copied or failed state. */
function setAction(card: CardElements, state: 'idle' | 'copied' | 'failed'): void {
  const label = state === 'copied'
    ? '已复制路径'
    : state === 'failed'
      ? '复制失败，请手动选择路径'
      : '点击复制路径';
  const glyph = state === 'copied' ? CHECK_ICON : state === 'failed' ? ALERT_ICON : COPY_ICON;

  card.action.dataset.state = state;
  card.action.innerHTML = glyph;
  card.action.appendChild(document.createTextNode(label));
}

/**
 * Mounts the hover card and returns its teardown.
 *
 * Called from the resident surface: the plugin stays mounted for the whole app
 * session, so this teardown only runs when the plugin is disabled, uninstalled
 * or the host tears the layer down.
 */
export function mountWorkspaceInfoCard(host: PluginHostApi): () => void {
  const card = buildCardElements();
  let hoveredRow: HTMLElement | null = null;
  let hoveredPath = '';
  let visible = false;
  let showTimer: number | null = null;
  let hideTimer: number | null = null;
  let copyTimer: number | null = null;

  // Times are per-path and do not change while the directory exists, so one
  // lookup per workspace is enough for the session.
  const timesCache = new Map<string, WorkspaceTimes | null>();
  const pendingLookups = new Set<string>();

  const isEnabled = (): boolean => loadPrefs().hoverCard;

  const clearTimer = (timer: number | null): null => {
    if (timer !== null) window.clearTimeout(timer);
    return null;
  };

  const hideCard = (): void => {
    // Dropping the anchor is what lets the next hover re-open the card: while a
    // row stays marked as hovered, `pointerover` inside it is treated as "already
    // showing" and never schedules a new card.
    hoveredRow = null;
    if (!visible) return;
    visible = false;
    card.root.remove();
  };

  function positionCard(row: HTMLElement): void {
    const rowRect = row.getBoundingClientRect();
    const cardRect = card.root.getBoundingClientRect();

    // Right of the row by default, so the card never covers the workspace list
    // it describes; flip to the left when that would leave the window.
    let left = rowRect.right + CARD_GAP;
    if (left + cardRect.width > window.innerWidth - CARD_GAP) {
      left = Math.max(CARD_GAP, rowRect.left - cardRect.width - CARD_GAP);
    }

    const maxTop = window.innerHeight - cardRect.height - CARD_GAP;
    const top = Math.min(Math.max(CARD_GAP, rowRect.top), Math.max(CARD_GAP, maxTop));

    card.root.style.left = `${Math.round(left)}px`;
    card.root.style.top = `${Math.round(top)}px`;
  }

  function renderMeta(path: string): void {
    card.meta.replaceChildren();
    if (card.root.dataset.path !== path) return;

    const times = timesCache.get(path);
    if (times === undefined) {
      card.meta.appendChild(element('span', `${CARD_CLASS}-meta-line`, '创建时间读取中…'));
      return;
    }
    if (!times) return;

    if (times.createdAt) {
      card.meta.appendChild(
        element('span', `${CARD_CLASS}-meta-line`, `创建于 ${formatInstant(times.createdAt)}`),
      );
    }
    if (times.modifiedAt) {
      card.meta.appendChild(
        element('span', `${CARD_CLASS}-meta-line`, `最近修改 ${formatInstant(times.modifiedAt)}`),
      );
    }
  }

  function lookupTimes(path: string): void {
    if (timesCache.has(path) || pendingLookups.has(path)) return;
    pendingLookups.add(path);

    void (async () => {
      try {
        // Goes through the host proxy, so the request carries the session's auth
        // headers; a bare fetch from the plugin bundle would be rejected as
        // unauthenticated when the server requires a login.
        const times = await host.rpc('GET', `info?path=${encodeURIComponent(path)}`) as WorkspaceTimes;
        timesCache.set(path, { createdAt: times?.createdAt ?? null, modifiedAt: times?.modifiedAt ?? null });
      } catch {
        // No backend (installed without its server) or an unreadable path:
        // remember the failure so the card does not retry on every hover.
        timesCache.set(path, null);
      } finally {
        pendingLookups.delete(path);
        if (card.root.isConnected && card.root.dataset.path === path) renderMeta(path);
      }
    })();
  }

  function showCard(row: HTMLElement): void {
    const path = row.getAttribute(ROW_ATTRIBUTE) ?? '';
    if (!path) return;

    hoveredPath = path;
    card.root.dataset.path = path;
    card.name.textContent = row.getAttribute(NAME_ATTRIBUTE) ?? path;
    card.path.textContent = path;
    setAction(card, 'idle');

    if (!card.root.isConnected) {
      document.body.appendChild(card.root);
      visible = true;
    }

    renderMeta(path);
    lookupTimes(path);
    positionCard(row);
  }

  function scheduleShow(row: HTMLElement): void {
    hideTimer = clearTimer(hideTimer);
    showTimer = clearTimer(showTimer);
    showTimer = window.setTimeout(() => {
      showTimer = null;
      if (hoveredRow === row && isEnabled()) showCard(row);
    }, SHOW_DELAY_MS);
  }

  function scheduleHide(): void {
    showTimer = clearTimer(showTimer);
    hideTimer = clearTimer(hideTimer);
    hideTimer = window.setTimeout(() => {
      hideTimer = null;
      hideCard();
    }, HIDE_DELAY_MS);
  }

  const onPointerOver = (event: Event): void => {
    if (!isEnabled()) return;
    const target = event.target as Element | null;

    if (target?.closest(`.${CARD_CLASS}`)) {
      // Moving onto the card keeps it alive and cancels the pending hide.
      hideTimer = clearTimer(hideTimer);
      showTimer = clearTimer(showTimer);
      return;
    }

    const row = target?.closest<HTMLElement>(`[${ROW_ATTRIBUTE}]`) ?? null;
    if (!row) return;

    if (row === hoveredRow) {
      // Moving between children of the same row: the `pointerout` that came with
      // this event scheduled a hide, so cancel it instead of re-showing.
      hideTimer = clearTimer(hideTimer);
      return;
    }

    hoveredRow = row;
    scheduleShow(row);
  };

  const onPointerOut = (event: Event): void => {
    const target = event.target as Element | null;
    if (target?.closest(`.${CARD_CLASS}`)) {
      scheduleHide();
      return;
    }

    const row = target?.closest<HTMLElement>(`[${ROW_ATTRIBUTE}]`) ?? null;
    if (!row || row !== hoveredRow) return;

    // `relatedTarget` is where the pointer is heading. Staying inside the row or
    // moving onto the card must not dismiss it, so only a departure counts.
    const next = (event as PointerEvent).relatedTarget as Element | null;
    if (next && (next.closest(`[${ROW_ATTRIBUTE}]`) === row || next.closest(`.${CARD_CLASS}`))) {
      hideTimer = clearTimer(hideTimer);
      return;
    }

    scheduleHide();
  };

  function copyCardPath(): void {
    const path = card.root.dataset.path ?? hoveredPath;
    if (!path) return;

    void copyText(path).then((result) => {
      setAction(card, result);
      copyTimer = clearTimer(copyTimer);
      // Reverts the label so a second click reads as a fresh action.
      copyTimer = window.setTimeout(() => {
        copyTimer = null;
        setAction(card, 'idle');
      }, COPY_FEEDBACK_MS);
    });
  }

  const onCardClick = (event: MouseEvent): void => {
    if (!(event.target as Element | null)?.closest(`.${CARD_CLASS}`)) return;
    event.preventDefault();
    event.stopPropagation();
    copyCardPath();
  };

  // A workspace row being opened, the list scrolling under the pointer or the
  // window resizing all invalidate the card's anchor: drop it rather than
  // leaving it floating next to the wrong row.
  const onDocumentClick = (event: MouseEvent): void => {
    if ((event.target as Element | null)?.closest(`.${CARD_CLASS}`)) return;
    hideCard();
  };
  const onViewportChange = (): void => { hideCard(); };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || !visible) return;
    hideCard();
  };

  const onSettingsChanged = (): void => {
    if (isEnabled()) return;
    showTimer = clearTimer(showTimer);
    hideTimer = clearTimer(hideTimer);
    hideCard();
  };

  document.addEventListener('pointerover', onPointerOver, true);
  document.addEventListener('pointerout', onPointerOut, true);
  document.addEventListener('click', onCardClick, true);
  document.addEventListener('click', onDocumentClick, false);
  document.addEventListener('scroll', onViewportChange, true);
  document.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', onViewportChange);
  window.addEventListener(SETTINGS_CHANGED_EVENT, onSettingsChanged);

  return () => {
    document.removeEventListener('pointerover', onPointerOver, true);
    document.removeEventListener('pointerout', onPointerOut, true);
    document.removeEventListener('click', onCardClick, true);
    document.removeEventListener('click', onDocumentClick, false);
    document.removeEventListener('scroll', onViewportChange, true);
    document.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('resize', onViewportChange);
    window.removeEventListener(SETTINGS_CHANGED_EVENT, onSettingsChanged);

    showTimer = clearTimer(showTimer);
    hideTimer = clearTimer(hideTimer);
    copyTimer = clearTimer(copyTimer);
    card.root.remove();
  };
}
