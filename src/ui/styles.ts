/**
 * Styles for both surfaces.
 *
 * The host gives a plugin its own container but no styling, so this sheet is
 * injected once per document and every selector is namespaced with `wuic-`.
 *
 * Both surfaces are painted from the host's own custom properties
 * (`--popover`, `--border`, `--foreground`, `--muted-foreground`, `--primary`),
 * so the panel and the hover card follow the app theme — and the accent the
 * user picks in the panel — without a single hard-coded colour of their own.
 */

export const CARD_CLASS = 'wuic-card';

export const PANEL_CLASS = 'wuic-panel';

const STYLE_ID = 'wuic-styles';

const CSS = `
/* ── Hover card ─────────────────────────────────────────────────────────────── */

.wuic-card {
  position: fixed;
  z-index: 9750;
  box-sizing: border-box;
  /* A fixed width, clamped to the viewport: sizing to max-content would
     collapse to the narrowest breakable column, because the path allows a
     break anywhere. */
  width: min(340px, calc(100vw - 24px));
  padding: 11px 12px 0;
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  background: hsl(var(--popover, var(--card)));
  color: hsl(var(--foreground));
  font-family: "Encode Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 12.5px;
  line-height: 1.45;
  box-shadow: 0 18px 44px -16px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.14);
  cursor: pointer;
  user-select: none;
  animation: wuic-card-in 110ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes wuic-card-in {
  from { opacity: 0; transform: translateY(3px) scale(0.985); }
  to   { opacity: 1; transform: none; }
}

.wuic-card-head {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.wuic-card-dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: hsl(var(--primary));
  box-shadow: 0 0 0 3px hsl(var(--primary) / 0.16);
}

.wuic-card-name {
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: hsl(var(--foreground));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wuic-card-path {
  display: block;
  margin-top: 5px;
  font-family: ui-monospace, "Cascadia Mono", Consolas, "Liberation Mono", monospace;
  font-size: 11.5px;
  line-height: 1.5;
  color: hsl(var(--muted-foreground));
  overflow-wrap: anywhere;
}

.wuic-card-meta {
  display: block;
  margin-top: 7px;
  font-size: 11px;
  color: hsl(var(--muted-foreground) / 0.85);
}

.wuic-card-meta-line {
  display: block;
}

.wuic-card-meta-line + .wuic-card-meta-line {
  margin-top: 1px;
}

/* The action is a full-bleed footer, so the whole card stays clickable while
   the footer alone carries the affordance. */
.wuic-card-action {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 9px -12px 0;
  padding: 7px 12px;
  border-top: 1px solid hsl(var(--border));
  border-radius: 0 0 11px 11px;
  font-size: 11px;
  color: hsl(var(--muted-foreground));
  transition: color 120ms ease, background-color 120ms ease;
}

.wuic-card:hover .wuic-card-action {
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 0.07);
}

.wuic-card-action[data-state="copied"] {
  color: hsl(142 71% 40%);
  background: hsl(142 71% 45% / 0.1);
}

.wuic-card-action[data-state="failed"] {
  color: hsl(var(--destructive, 0 84% 60%));
  background: hsl(var(--destructive, 0 84% 60%) / 0.08);
}

.wuic-card-action svg {
  width: 11px;
  height: 11px;
  flex-shrink: 0;
}

/* ── Settings panel (the plugin's page in the settings dialog) ──────────────── */

.wuic-panel {
  box-sizing: border-box;
  max-width: 720px;
  padding: 4px 20px 40px;
  color: hsl(var(--foreground));
  font-family: "Encode Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 14px;
  line-height: 1.5;
}

.wuic-panel-title {
  margin: 16px 0 2px;
  font-size: 16px;
  font-weight: 600;
}

.wuic-panel-subtitle {
  margin: 0 0 16px;
  font-size: 13px;
  color: hsl(var(--muted-foreground));
}

.wuic-section {
  margin-top: 20px;
}

.wuic-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.wuic-section-heading {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: hsl(var(--muted-foreground));
}

.wuic-section-hint {
  margin: 0 0 9px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.wuic-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 12px 14px;
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
  background: hsl(var(--card));
}

.wuic-row + .wuic-row {
  margin-top: 8px;
}

.wuic-row-body {
  min-width: 0;
  flex: 1;
}

.wuic-row-label {
  font-size: 14px;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.wuic-row-description {
  margin-top: 3px;
  font-size: 12.5px;
  color: hsl(var(--muted-foreground));
}

.wuic-row-description code {
  padding: 1px 4px;
  border-radius: 4px;
  background: hsl(var(--muted) / 0.6);
  font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
  font-size: 11.5px;
}

/* ── Theme switch (which theme the colour rows below are editing) ─────────── */

.wuic-segmented {
  display: inline-flex;
  flex-shrink: 0;
  padding: 2px;
  border: 1px solid hsl(var(--border));
  border-radius: 999px;
  background: hsl(var(--muted) / 0.5);
}

.wuic-segment {
  padding: 3px 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: hsl(var(--muted-foreground));
  font-family: inherit;
  font-size: 12px;
  line-height: 1.4;
  cursor: pointer;
  transition: background-color 120ms ease, color 120ms ease;
}

.wuic-segment[aria-pressed="true"] {
  background: hsl(var(--card));
  color: hsl(var(--foreground));
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

.wuic-segment:focus-visible {
  outline: 2px solid hsl(var(--ring) / 0.6);
  outline-offset: 1px;
}

/* ── Live sample: a card on the page surface, with a command block inside ─── */

.wuic-preview {
  margin-bottom: 14px;
  padding: 14px;
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
  transition: background-color 120ms ease;
}

.wuic-preview-card {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 9px 11px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
  font-size: 11.5px;
  line-height: 1.55;
}

.wuic-preview-line {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.wuic-preview-prompt {
  font-weight: 600;
}

.wuic-preview-accent {
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
}

/* ── Colour rows ──────────────────────────────────────────────────────────── */

.wuic-color-group + .wuic-color-group {
  margin-top: 14px;
}

.wuic-colors {
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
  background: hsl(var(--card));
}

.wuic-color-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 14px;
}

.wuic-color-row + .wuic-color-row {
  border-top: 1px solid hsl(var(--border));
}

.wuic-color-body {
  min-width: 0;
}

.wuic-color-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13.5px;
  font-weight: 500;
}

.wuic-color-hint {
  margin-top: 2px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

/* Says at a glance that the other theme carries a different value too. */
.wuic-color-badge {
  padding: 1px 6px;
  border-radius: 999px;
  background: hsl(var(--primary) / 0.12);
  color: hsl(var(--primary));
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.wuic-color-controls {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
}

.wuic-swatch {
  position: relative;
  display: block;
  width: 26px;
  height: 26px;
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 7px;
  cursor: pointer;
}

.wuic-swatch-paint {
  position: absolute;
  inset: 0;
}

/* The native picker is the click target but stays invisible: its own chrome
   cannot be themed, and a 26px swatch is the affordance the row needs. */
.wuic-swatch input[type="color"] {
  position: absolute;
  inset: -4px;
  width: calc(100% + 8px);
  height: calc(100% + 8px);
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  opacity: 0;
}

.wuic-swatch:focus-within {
  outline: 2px solid hsl(var(--ring) / 0.6);
  outline-offset: 1px;
}

.wuic-hex {
  width: 88px;
  padding: 4px 7px;
  border: 1px solid hsl(var(--border));
  border-radius: 7px;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
  font-size: 11.5px;
  text-transform: lowercase;
}

.wuic-hex:focus-visible {
  outline: 2px solid hsl(var(--ring) / 0.6);
  outline-offset: 1px;
}

.wuic-link-button {
  padding: 3px 7px;
  border: 1px solid hsl(var(--border));
  border-radius: 7px;
  background: transparent;
  color: hsl(var(--muted-foreground));
  font-family: inherit;
  font-size: 11.5px;
  cursor: pointer;
  transition: color 120ms ease, border-color 120ms ease, background-color 120ms ease;
}

.wuic-link-button:hover:not(:disabled) {
  border-color: hsl(var(--primary) / 0.5);
  background: hsl(var(--primary) / 0.08);
  color: hsl(var(--primary));
}

.wuic-link-button:disabled {
  opacity: 0.5;
  cursor: default;
}

.wuic-link-button:focus-visible {
  outline: 2px solid hsl(var(--ring) / 0.6);
  outline-offset: 1px;
}

/* ── Toggle switch, matching the app's plugin switches ────────────────────── */

.wuic-switch {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  margin-top: 2px;
  cursor: pointer;
  user-select: none;
}

.wuic-switch input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

.wuic-switch-track {
  position: relative;
  display: block;
  width: 36px;
  height: 20px;
  border-radius: 999px;
  background: hsl(var(--muted-foreground) / 0.3);
  transition: background-color 160ms ease;
}

.wuic-switch-track::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  transition: transform 160ms ease;
}

.wuic-switch input:checked + .wuic-switch-track {
  background: hsl(142 71% 45%);
}

.wuic-switch input:checked + .wuic-switch-track::after {
  transform: translateX(16px);
}

.wuic-switch input:focus-visible + .wuic-switch-track {
  outline: 2px solid hsl(var(--ring) / 0.6);
  outline-offset: 2px;
}

/* ── Misc ─────────────────────────────────────────────────────────────────── */

.wuic-note {
  margin-top: 16px;
  padding: 10px 12px;
  border: 1px dashed hsl(var(--border));
  border-radius: 8px;
  font-size: 12.5px;
  color: hsl(var(--muted-foreground));
}

.wuic-note strong {
  font-weight: 600;
  color: hsl(var(--foreground));
}

.wuic-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 10px;
  font-size: 12.5px;
  color: hsl(var(--muted-foreground));
}

.wuic-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: hsl(var(--muted-foreground) / 0.5);
}

.wuic-status[data-active="true"] .wuic-status-dot {
  background: hsl(142 71% 45%);
}
`;

/** Injects the plugin stylesheet once per document. */
export function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}
