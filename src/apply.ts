/**
 * Applies the colour settings to the running app.
 *
 * Everything goes into one injected stylesheet rather than inline styles on
 * `<html>`: the host ships two sets of values (`:root` for light, `.dark` for
 * dark), and inline declarations cannot be scoped to a theme — they would pin
 * one theme's colours into both. A stylesheet can hold both scopes at once, so
 * switching the app theme needs no re-apply and no listener.
 *
 * Specificity alone is not enough to win. Written against `html` the rules beat
 * the host's `:root` / `.dark` blocks on specificity (0,1,1 vs 0,1,0), but a
 * `color` rule also has to survive stylesheets that arrive *after* this one —
 * the dev server re-injects the Tailwind sheet on every hot update, and the
 * host injects the code-highlight theme at render time. Both land at the end of
 * `<head>`, i.e. after this sheet, and an equally specific later rule wins. The
 * declarations are therefore marked `!important`; `!important` on a custom
 * property is valid CSS and settles the same race for the theme variables.
 */

import { contrastForegroundTriple, hexToHslTriple } from './color.js';
import { loadPrefs, SETTINGS_CHANGED_EVENT, type Prefs } from './prefs.js';
import { THEMES, TOKENS, type ThemeName } from './tokens.js';

/** Id of the injected sheet; also the marker that says overrides are active. */
export const OVERRIDES_STYLE_ID = 'wuic-overrides';

/** Builds the `--var: value` declarations for one token in one theme. */
function declarationsFor(token: (typeof TOKENS)[number], theme: ThemeName, hex: string): string[] {
  const triple = hexToHslTriple(hex);
  // A hex that never reached the color input would leave `hsl(var(--x))`
  // invalid and the whole declaration dropped; skipping is the safe failure.
  if (!triple) return [];

  if (token.kind !== 'var') return [];

  const declarations = [`${token.cssVar}: ${triple} !important`];
  for (const companion of token.also ?? []) {
    if (companion.mode === 'same') {
      declarations.push(`${companion.cssVar}: ${triple} !important`);
    } else if (companion.mode === 'contrast') {
      declarations.push(`${companion.cssVar}: ${contrastForegroundTriple(hex)} !important`);
    } else {
      declarations.push(`${companion.cssVar}: ${triple} / ${companion.alpha ?? 1} !important`);
    }
  }

  return declarations;
}

/** Builds every CSS rule the given settings imply, in one pass. */
export function buildCss(prefs: Prefs): string {
  const blocks: string[] = [];

  for (const theme of THEMES) {
    const scope = theme === 'dark' ? 'html.dark' : 'html:not(.dark)';
    const variableDeclarations: string[] = [];
    const colorDeclarations: string[] = [];

    for (const token of TOKENS) {
      const hex = prefs.colors[token.id]?.[theme];
      if (!hex) continue;

      if (token.kind === 'var') {
        variableDeclarations.push(...declarationsFor(token, theme, hex));
      } else {
        // A class-based colour: only touch it when the user actually set one,
        // so untouched parts of the command block keep the host's exact colour.
        colorDeclarations.push(`${scope} ${token.selector} { color: ${hex} !important; }`);
      }
    }

    if (variableDeclarations.length > 0) {
      blocks.push(`${scope} {\n  ${variableDeclarations.join(';\n  ')};\n}`);
    }
    blocks.push(...colorDeclarations);
  }

  return blocks.join('\n');
}

/**
 * Writes (or removes) the override sheet for these settings.
 *
 * With nothing overridden the sheet is removed outright: the app then renders
 * exactly as it does without this plugin installed.
 */
export function applyAppearance(prefs: Prefs): void {
  const existing = document.getElementById(OVERRIDES_STYLE_ID);
  const css = buildCss(prefs);

  if (!css) {
    existing?.remove();
    return;
  }

  const style = (existing instanceof HTMLStyleElement)
    ? existing
    : document.createElement('style');

  if (style.textContent !== css) style.textContent = css;
  if (!existing) {
    style.id = OVERRIDES_STYLE_ID;
    document.head.appendChild(style);
  }
}

/**
 * Keeps the document in sync with stored settings for as long as the plugin is
 * mounted. Both surfaces call this: the resident one owns the lifetime, while
 * the settings page's panel calls `applyAppearance` itself after each edit so
 * the change is visible even if the resident layer were disabled in the host.
 */
export function watchAppearance(): () => void {
  applyAppearance(loadPrefs());

  const onChanged = (): void => { applyAppearance(loadPrefs()); };
  window.addEventListener(SETTINGS_CHANGED_EVENT, onChanged);

  return () => {
    window.removeEventListener(SETTINGS_CHANGED_EVENT, onChanged);
  };
}

/** Removes every override, restoring the stock look. */
export function clearAppearance(): void {
  document.getElementById(OVERRIDES_STYLE_ID)?.remove();
}
