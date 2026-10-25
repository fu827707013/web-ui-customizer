/**
 * Settings panel — one page of the settings dialog (`slot: "settings"`).
 *
 * The resident layer cannot render UI the user can reach (its container is
 * empty and zero-sized), so everything the user configures lives here, in the
 * page the host adds to the settings sidebar:
 *
 * - the workspace hover card, on or off;
 * - the accent and surface colours;
 * - the text colours, including the command block's `$` and failed output.
 *
 * Every edit is applied immediately (no Save button) because the preview is the
 * app itself: the panel writes the same overrides the resident layer would.
 *
 * All copy goes through the plugin's own i18n instance, which follows the
 * language chosen in the host (see i18n/index.ts); switching language re-renders
 * this panel in place rather than remounting it.
 */

import { applyAppearance } from './apply.js';
import { contrastTextHex, normalizeHex } from './color.js';
import { createI18n, type I18n } from './i18n/index.js';
import {
  clearColor,
  countOverrides,
  loadPrefs,
  savePrefs,
  setColor,
  SETTINGS_CHANGED_EVENT,
  type Prefs,
} from './prefs.js';
import {
  defaultHex,
  THEMES,
  THEME_LABEL_KEYS,
  TOKEN_GROUPS,
  TOKENS,
  type ThemeName,
  type Token,
} from './tokens.js';

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

type ToggleRow = {
  root: HTMLElement;
  label: HTMLElement;
  /** Rewrites the label and description from the current locale. */
  retranslate: () => void;
};

/** One labelled setting row with a switch on the right. */
function buildToggleRow(options: {
  label: () => string;
  description: () => string[];
  checked: boolean;
  onChange: (checked: boolean) => void;
}): ToggleRow {
  const row = element('div', 'wuic-row');
  const body = element('div', 'wuic-row-body');

  const label = element('div', 'wuic-row-label');
  body.appendChild(label);

  const description = element('div');
  body.appendChild(description);

  const switchLabel = element('label', 'wuic-switch');
  const input = element('input');
  input.type = 'checkbox';
  input.checked = options.checked;
  input.addEventListener('change', () => options.onChange(input.checked));

  const track = element('span', 'wuic-switch-track');
  switchLabel.append(input, track);

  const retranslate = (): void => {
    label.textContent = options.label();
    input.setAttribute('aria-label', options.label());

    // The description is authored here as plain text (*not* HTML from a user or
    // a server), so `textContent` is both sufficient and safer.
    description.replaceChildren();
    for (const line of options.description()) {
      description.appendChild(element('div', 'wuic-row-description', line));
    }
  };

  row.append(body, switchLabel);
  return { root: row, label, retranslate };
}

/** Re-reads `input` with its concrete element type, so `.checked` is not `unknown` on a bare HTMLElement. */
function findCheckbox(root: HTMLElement): HTMLInputElement | null {
  return root.querySelector('input[type="checkbox"]');
}

/** Persists and applies a change, then lets the panel's own listener re-sync. */
function commit(prefs: Prefs): void {
  savePrefs(prefs);
  applyAppearance(prefs);
}

/** The value a token currently renders with, override included. */
function currentHex(prefs: Prefs, token: Token, theme: ThemeName): string {
  return prefs.colors[token.id]?.[theme] ?? defaultHex(token, theme);
}

/**
 * A live sample of the accent, background and command colours, so the user sees
 * the effect before leaving the panel. Painted inline from the settings, not
 * from the host variables, so it is correct even before the sheet is applied.
 */
type PreviewParts = {
  /** Page surface, painted with the background token. */
  root: HTMLElement;
  /** A card sitting on that surface, painted with the card and border tokens. */
  card: HTMLElement;
  prompt: HTMLElement;
  command: HTMLElement;
  muted: HTMLElement;
  output: HTMLElement;
  error: HTMLElement;
  /** Chip that carries the accent, with text that has to stay readable on it. */
  accent: HTMLElement;
};

/**
 * A miniature of the two places these colours actually show up: a card on the
 * page surface, and a command block inside it.
 *
 * Every part is painted from the stored settings rather than from the host
 * variables, so the sample is already correct before the override sheet exists.
 */
function buildPreview(): PreviewParts {
  const root = element('div', 'wuic-preview');

  const card = element('div', 'wuic-preview-card');

  const commandLine = element('div', 'wuic-preview-line');
  const prompt = element('span', 'wuic-preview-prompt', '$');
  const command = element('span', 'wuic-preview-command', 'npm run build');
  commandLine.append(prompt, command);

  const outputLine = element('div', 'wuic-preview-line');
  const output = element('span', 'wuic-preview-muted', 'built in 2.1s');
  const error = element('span', 'wuic-preview-error', 'error: exit 1');
  outputLine.append(output, error);

  const mutedLine = element('div', 'wuic-preview-line');
  const muted = element('span', 'wuic-preview-muted');
  mutedLine.append(muted);

  const accentLine = element('div', 'wuic-preview-line');
  const accent = element('span', 'wuic-preview-accent');
  accentLine.append(accent);

  card.append(commandLine, outputLine, mutedLine, accentLine);
  root.append(card);

  return { root, card, prompt, command, muted, output, error, accent };
}

function paintPreview(parts: PreviewParts, prefs: Prefs, theme: ThemeName): void {
  const accent = currentHex(prefs, byId('primary'), theme);

  parts.root.style.background = currentHex(prefs, byId('background'), theme);
  parts.card.style.background = currentHex(prefs, byId('card'), theme);
  parts.card.style.borderColor = currentHex(prefs, byId('border'), theme);
  // The command block is painted from its own four colours, not from the text
  // tokens: those two happen to start at the same values, but they are separate
  // settings and the sample has to follow the one the user is editing.
  parts.command.style.color = currentHex(prefs, byId('command-text'), theme);
  parts.output.style.color = currentHex(prefs, byId('command-output'), theme);
  parts.muted.style.color = currentHex(prefs, byId('muted'), theme);
  parts.prompt.style.color = currentHex(prefs, byId('command-prompt'), theme);
  parts.error.style.color = currentHex(prefs, byId('command-error'), theme);

  parts.accent.style.background = accent;
  // White on a pale accent would be unreadable, so the label follows the swatch.
  parts.accent.style.color = contrastTextHex(accent);
}

function byId(id: string): Token {
  const token = TOKENS.find((candidate) => candidate.id === id);
  if (!token) throw new Error(`unknown token: ${id}`);
  return token;
}

type ColorRow = {
  token: Token;
  /** The row element, so the caller can append it without re-querying the DOM. */
  root: HTMLElement;
  /** Re-reads settings for the theme being edited and updates every control. */
  sync: (prefs: Prefs, theme: ThemeName) => void;
  /** Rewrites this row's copy from the current locale. */
  retranslate: () => void;
};

/** One colour row: label, hint, swatch, hex field and a per-theme reset. */
function buildColorRow(
  token: Token,
  i18n: I18n,
  themeRef: () => ThemeName,
  onChange: (next: Prefs) => void,
): ColorRow {
  const row = element('div', 'wuic-color-row');

  const body = element('div', 'wuic-color-body');
  const labelLine = element('div', 'wuic-color-label');
  const label = element('span');
  const badge = element('span', 'wuic-color-badge');
  labelLine.append(label, badge);

  const hint = element('div', 'wuic-color-hint');
  body.append(labelLine, hint);

  const controls = element('div', 'wuic-color-controls');

  // The swatch is the native picker, made invisible on top of a painted tile:
  // the browser's own chrome cannot be themed, and 26px is what the row needs.
  const swatch = element('label', 'wuic-swatch');
  const paint = element('span', 'wuic-swatch-paint');
  const picker = element('input');
  picker.type = 'color';
  swatch.append(paint, picker);

  const hexField = element('input', 'wuic-hex');
  hexField.type = 'text';
  hexField.spellcheck = false;
  hexField.maxLength = 7;

  const reset = element('button', 'wuic-link-button');
  reset.type = 'button';

  controls.append(swatch, hexField, reset);
  row.append(body, controls);

  const retranslate = (): void => {
    label.textContent = i18n.t(token.labelKey);
    hint.textContent = i18n.t(token.hintKey);
    badge.textContent = i18n.t('panel.badge.otherTheme');
    reset.textContent = i18n.t('panel.reset.one');
    reset.title = i18n.t('panel.reset.oneTitle');
    picker.setAttribute('aria-label', i18n.t('panel.picker.colorAria', { label: i18n.t(token.labelKey) }));
    hexField.setAttribute('aria-label', i18n.t('panel.picker.hexAria', { label: i18n.t(token.labelKey) }));
  };

  const write = (hex: string): void => {
    const theme = themeRef();
    const next = setColor(loadPrefs(), token.id, theme, hex);
    onChange(next);
  };

  picker.addEventListener('input', () => { write(picker.value); });

  const commitTyped = (): void => {
    const normalized = normalizeHex(hexField.value);
    if (!normalized) {
      // Not a colour: put the current value back rather than storing garbage.
      const theme = themeRef();
      hexField.value = currentHex(loadPrefs(), token, theme);
      return;
    }
    hexField.value = normalized;
    write(normalized);
  };
  hexField.addEventListener('blur', commitTyped);
  hexField.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { event.preventDefault(); commitTyped(); }
  });

  reset.addEventListener('click', () => {
    onChange(clearColor(loadPrefs(), token.id, themeRef()));
  });

  return {
    token,
    root: row,
    retranslate,
    sync: (prefs, theme) => {
      const value = currentHex(prefs, token, theme);
      const overridden = prefs.colors[token.id]?.[theme] !== undefined;
      const otherTheme: ThemeName = theme === 'dark' ? 'light' : 'dark';

      paint.style.background = value;
      // Ring the swatch in a readable edge, so a white or black swatch still
      // shows where it ends.
      swatch.style.outlineColor = contrastTextHex(value);

      if (document.activeElement !== picker) picker.value = value;
      if (document.activeElement !== hexField) hexField.value = value.toLowerCase();

      reset.disabled = !overridden;
      badge.hidden = prefs.colors[token.id]?.[otherTheme] === undefined;
    },
  };
}

/**
 * Mounts the settings panel into the container the host hands the settings
 * surface, and returns its teardown.
 */
export function mountSettingsPanel(container: HTMLElement): () => void {
  const i18n = createI18n();
  const panel = element('div', 'wuic-panel');

  const title = element('h2', 'wuic-panel-title');
  const subtitle = element('p', 'wuic-panel-subtitle');
  panel.append(title, subtitle);

  // ── Feature switch ────────────────────────────────────────────────────────

  const featureSection = element('div', 'wuic-section');
  const featureHeading = element('p', 'wuic-section-heading');
  featureSection.appendChild(featureHeading);

  const status = element('div', 'wuic-status');
  const statusDot = element('span', 'wuic-status-dot');
  const statusLabel = element('span');
  status.append(statusDot, statusLabel);

  const renderStatus = (enabled: boolean): void => {
    status.dataset.active = String(enabled);
    statusLabel.textContent = i18n.t(enabled ? 'panel.status.on' : 'panel.status.off');
  };

  const initial = loadPrefs();
  renderStatus(initial.hoverCard);

  const toggleRow = buildToggleRow({
    label: () => i18n.t('panel.toggle.label'),
    description: () => [
      i18n.t('panel.toggle.desc1'),
      i18n.t('panel.toggle.desc2'),
      i18n.t('panel.toggle.desc3'),
    ],
    checked: initial.hoverCard,
    onChange: (checked) => {
      const next = { ...loadPrefs(), hoverCard: checked };
      commit(next);
      renderStatus(checked);
    },
  });

  featureSection.append(toggleRow.root, status);
  panel.appendChild(featureSection);

  // ── Appearance ────────────────────────────────────────────────────────────

  const appearanceSection = element('div', 'wuic-section');
  const appearanceHead = element('div', 'wuic-section-head');
  const appearanceHeading = element('p', 'wuic-section-heading');
  appearanceHead.appendChild(appearanceHeading);

  // The panel edits one theme at a time; start on whichever the app currently
  // shows. The host toggles `dark` on the document element.
  let editingTheme: ThemeName = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

  const segmented = element('div', 'wuic-segmented');
  segmented.setAttribute('role', 'group');

  const themeButtons = THEMES.map((theme) => {
    const button = element('button', 'wuic-segment');
    button.type = 'button';
    button.dataset.theme = theme;
    button.addEventListener('click', () => {
      if (editingTheme === theme) return;
      editingTheme = theme;
      renderAll();
    });
    return { theme, button };
  });
  for (const { button } of themeButtons) segmented.appendChild(button);

  const resetAll = element('button', 'wuic-link-button');
  resetAll.type = 'button';
  appearanceHead.append(segmented, resetAll);
  appearanceSection.appendChild(appearanceHead);

  const preview = buildPreview();
  appearanceSection.appendChild(preview.root);

  const rows: ColorRow[] = [];
  const groupSections: Array<{ heading: HTMLElement; group: (typeof TOKEN_GROUPS)[number] }> = [];

  for (const group of TOKEN_GROUPS) {
    const groupTokens = TOKENS.filter((token) => token.group === group.id);
    if (groupTokens.length === 0) continue;

    const groupSection = element('div', 'wuic-color-group');
    const groupHeading = element('p', 'wuic-section-hint');
    groupSection.appendChild(groupHeading);
    groupSections.push({ heading: groupHeading, group });

    const list = element('div', 'wuic-colors');
    for (const token of groupTokens) {
      const row = buildColorRow(token, i18n, () => editingTheme, (next) => {
        commit(next);
        renderAll();
      });
      rows.push(row);
      list.appendChild(row.root);
    }
    groupSection.appendChild(list);
    appearanceSection.appendChild(groupSection);
  }

  panel.appendChild(appearanceSection);

  const colorSummary = element('div', 'wuic-status');
  const colorSummaryDot = element('span', 'wuic-status-dot');
  const colorSummaryLabel = element('span');
  colorSummary.append(colorSummaryDot, colorSummaryLabel);
  appearanceSection.appendChild(colorSummary);

  const note = element('div', 'wuic-note');
  const noteStrong = element('strong');
  const noteBody = document.createTextNode('');
  note.append(noteStrong, noteBody);
  panel.appendChild(note);

  resetAll.addEventListener('click', () => {
    const current = loadPrefs();
    commit({ ...current, colors: {} });
    renderAll();
  });

  /** Rewrites every fixed string; called on mount and on every language change. */
  function retranslate(): void {
    title.textContent = i18n.t('panel.title');
    subtitle.textContent = i18n.t('panel.subtitle');

    featureHeading.textContent = i18n.t('panel.feature.section');
    toggleRow.retranslate();
    renderStatus(findCheckbox(toggleRow.root)?.checked ?? loadPrefs().hoverCard);

    appearanceHeading.textContent = i18n.t('panel.appearance.section');
    segmented.setAttribute('aria-label', i18n.t('panel.theme.group'));
    for (const { theme, button } of themeButtons) {
      button.textContent = i18n.t(THEME_LABEL_KEYS[theme]);
    }
    resetAll.textContent = i18n.t('panel.resetAll');

    preview.muted.textContent = i18n.t('panel.preview.muted');
    preview.accent.textContent = i18n.t('panel.preview.accent');

    for (const { heading, group } of groupSections) {
      heading.textContent = `${i18n.t(group.titleKey)} · ${i18n.t(group.hintKey)}`;
    }

    for (const row of rows) row.retranslate();

    noteStrong.textContent = i18n.t('panel.note.title');
    noteBody.textContent = i18n.t('panel.note.body');
  }

  function renderAll(): void {
    const prefs = loadPrefs();

    for (const { theme, button } of themeButtons) {
      button.setAttribute('aria-pressed', String(theme === editingTheme));
    }

    for (const row of rows) row.sync(prefs, editingTheme);

    paintPreview(preview, prefs, editingTheme);

    const count = countOverrides(prefs);
    colorSummary.dataset.active = String(count > 0);
    colorSummaryLabel.textContent = count === 0
      ? i18n.t('panel.colors.summaryNone')
      : i18n.t('panel.colors.summaryCount', { count });
    resetAll.disabled = count === 0;
  }

  container.appendChild(panel);
  retranslate();
  renderAll();

  // Another surface (or another window) changed the settings: keep this panel
  // truthful instead of letting it drift.
  const onSettingsChanged = (): void => {
    const prefs = loadPrefs();
    const checkbox = findCheckbox(toggleRow.root);
    if (checkbox) checkbox.checked = prefs.hoverCard;
    renderStatus(prefs.hoverCard);
    renderAll();
  };
  window.addEventListener(SETTINGS_CHANGED_EVENT, onSettingsChanged);

  // The user picked another language in the host: redraw in place.
  const stopLanguage = i18n.onChange(() => {
    retranslate();
    renderAll();
  });

  return () => {
    window.removeEventListener(SETTINGS_CHANGED_EVENT, onSettingsChanged);
    stopLanguage();
    i18n.dispose();
    panel.remove();
  };
}
