/**
 * Inline SVG icons.
 *
 * The plugin bundle has no icon dependency and the host does not expose one, so
 * the few glyphs the card and panel need are inlined here. Constant markup only
 * — never user data.
 */

const stroke = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

/** Copy glyph, shown in the card's action line. */
export const COPY_ICON = `<svg viewBox="0 0 24 24" ${stroke} aria-hidden="true">`
  + '<rect x="9" y="9" width="12" height="12" rx="2" ry="2" />'
  + '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />'
  + '</svg>';

/** Check glyph, shown once the path is on the clipboard. */
export const CHECK_ICON = `<svg viewBox="0 0 24 24" ${stroke} aria-hidden="true">`
  + '<path d="M20 6 9 17l-5-5" />'
  + '</svg>';

/** Warning glyph, shown when the browser refuses clipboard access and the user has to copy by hand. */
export const ALERT_ICON = `<svg viewBox="0 0 24 24" ${stroke} aria-hidden="true">`
  + '<circle cx="12" cy="12" r="10" />'
  + '<path d="M12 8v4M12 16h.01" />'
  + '</svg>';
