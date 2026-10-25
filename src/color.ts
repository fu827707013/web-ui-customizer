/**
 * Colour maths for the appearance section.
 *
 * The host stores every theme colour as a bare HSL triple — `--primary: 221.2
 * 83.2% 53.3%` — and reads it back through `hsl(var(--primary))`. A custom
 * colour therefore has to be rewritten into that same shape: assigning a hex
 * value to `--primary` makes every `hsl(var(--primary))` declaration invalid,
 * and the app silently keeps the cascade value it had before.
 */

export type Rgb = { r: number; g: number; b: number };

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Accepts `#abc`, `#aabbcc` and the same without the leading hash. */
export function normalizeHex(input: string): string | null {
  const match = input.trim().match(HEX_PATTERN);
  if (!match) return null;

  const digits = match[1].toLowerCase();
  const full = digits.length === 3
    ? `${digits[0]}${digits[0]}${digits[1]}${digits[1]}${digits[2]}${digits[2]}`
    : digits;
  return `#${full}`;
}

export function hexToRgb(hex: string): Rgb | null {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;

  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
}

export function rgbToHex(rgb: Rgb): string {
  const channel = (value: number): string =>
    Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, '0');
  return `#${channel(rgb.r)}${channel(rgb.g)}${channel(rgb.b)}`;
}

const round1 = (value: number): number => Math.round(value * 10) / 10;

/** `#3b82f6` → `221.2 83.2% 53.3%`, the shape the host's variables use. */
export function hexToHslTriple(hex: string): string | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;

  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    if (max === r) hue = (g - b) / delta + (g < b ? 6 : 0);
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;

    hue *= 60;
  }

  return `${round1(hue)} ${round1(saturation * 100)}% ${round1(lightness * 100)}%`;
}

/** `221.2 83.2% 53.3%` (optionally with `/ alpha`) → `#3b82f6`, for showing a host default. */
export function hslTripleToHex(triple: string): string | null {
  const match = triple.trim().match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  if (!match) return null;

  const hue = Number(match[1]) % 360;
  const saturation = Number(match[2]) / 100;
  const lightness = Number(match[3]) / 100;

  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const secondary = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const offset = lightness - chroma / 2;

  let channels: [number, number, number];
  if (hue < 60) channels = [chroma, secondary, 0];
  else if (hue < 120) channels = [secondary, chroma, 0];
  else if (hue < 180) channels = [0, chroma, secondary];
  else if (hue < 240) channels = [0, secondary, chroma];
  else if (hue < 300) channels = [secondary, 0, chroma];
  else channels = [chroma, 0, secondary];

  return rgbToHex({
    r: (channels[0] + offset) * 255,
    g: (channels[1] + offset) * 255,
    b: (channels[2] + offset) * 255,
  });
}

/** WCAG relative luminance, used only to decide whether text on this colour reads. */
export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const channel = (value: number): number => {
    const scaled = value / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

/**
 * Picks the `--primary-foreground` triple for a custom accent, so a light accent
 * does not get white text stamped on it (and vice versa).
 *
 * The two values are the light theme's `--primary-foreground` and the dark
 * theme's, so the result looks native in both.
 */
export function contrastForegroundTriple(hex: string): string {
  return relativeLuminance(hex) > 0.45 ? '0 0% 8%' : '210 40% 98%';
}

/** The same decision as a hex colour, for the panel's inline-styled preview. */
export function contrastTextHex(hex: string): string {
  return relativeLuminance(hex) > 0.45 ? '#141414' : '#f8fafc';
}
