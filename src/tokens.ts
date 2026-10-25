/**
 * What the appearance section can recolour, and how each item is applied.
 *
 * Two kinds of item exist:
 *
 * - `var` — a CloudCLI theme variable. The host stores every one of them as a
 *   bare HSL triple (`--primary: 221.2 83.2% 53.3%`) and reads it back through
 *   `hsl(var(--primary))`, so an override has to be written back in that same
 *   shape (see color.ts).
 * - `color` — a colour the host writes as a utility class rather than a
 *   variable (the `$` of a Bash command block, the colour of a failed command's
 *   output). Those are matched with a selector instead.
 *
 * Nothing here is user data: labels are constant strings and selectors are
 * constant class names taken from the host's own components.
 */

import { hslTripleToHex } from './color.js';

/** The two themes CloudCLI ships; every colour is configured once per theme. */
export type ThemeName = 'light' | 'dark';

export const THEMES: readonly ThemeName[] = ['light', 'dark'];

/** Chinese label for each theme, used by the panel's theme switch. */
export const THEME_LABELS: Record<ThemeName, string> = { light: '浅色', dark: '深色' };

export type TokenGroup = 'theme' | 'text' | 'command';

/** A second host variable that has to move with the token the user edited. */
export type CompanionVar = {
  /** Variable name including the leading `--`. */
  cssVar: string;
  /**
   * How the value is derived: `same` copies the triple, `contrast` picks a
   * readable foreground for it, `alpha` appends an alpha channel.
   */
  mode: 'same' | 'contrast' | 'alpha';
  /** Alpha channel for `mode: 'alpha'`. */
  alpha?: number;
};

type TokenBase = {
  /** Stable key in storage; never displayed. */
  id: string;
  group: TokenGroup;
  label: string;
  /** One short line under the label, so the row says what it actually changes. */
  hint: string;
  /** Host default, light theme. HSL triple for `var` tokens, hex for `color` tokens. */
  light: string;
  /** Host default, dark theme. Same shape as `light`. */
  dark: string;
};

/** An override of a CloudCLI theme variable. */
export type VarToken = TokenBase & {
  kind: 'var';
  /** Variable name including the leading `--`. */
  cssVar: string;
  /**
   * Net effect is what the row promises: the host derives several variables
   * from one (text on the accent, the focus ring, the nav glow), and leaving
   * those behind produces a half-recoloured app.
   */
  also?: readonly CompanionVar[];
};

/** An override of a colour the host hard-codes as a utility class. */
export type ColorToken = TokenBase & {
  kind: 'color';
  /** Selector whose `color` is replaced; the theme scope is added on top. */
  selector: string;
};

export type Token = VarToken | ColorToken;

/** Host values shared by more than one token, kept in one place. */
const FOREGROUND = { light: '36 25% 4%', dark: '40 8% 93%' };
const MUTED_FOREGROUND = { light: '40 5% 44%', dark: '0 0% 60%' };

/**
 * The command block is `<div class="group/cmd">` (BashCommandDisplay.tsx). It
 * carries no data attribute, so its parts are matched by the utility classes
 * the component sets on them; `[class~="…"]` keeps the `/` out of an escaped
 * selector. The `$` is the only span in the block that is both `select-none`
 * and `font-mono`; the output is the only `pre` inside the block.
 */
const COMMAND_SCOPE = '[class~="group/cmd"]';
const COMMAND_PROMPT_SELECTOR = `${COMMAND_SCOPE} span.select-none.font-mono`;
const COMMAND_OUTPUT_SELECTOR = `${COMMAND_SCOPE} pre[class~="text-muted-foreground"]`;
const COMMAND_ERROR_SELECTOR = `${COMMAND_SCOPE} pre[class~="text-red-600"]`;

/**
 * Two command colours are not new colours at all — the command text renders in
 * the body colour and the successful output in the muted one. Their defaults
 * are therefore derived from those triples rather than transcribed by hand, so
 * the two can never drift apart.
 */
const FOREGROUND_HEX = {
  light: hslTripleToHex(FOREGROUND.light) ?? '#0b0906',
  dark: hslTripleToHex(FOREGROUND.dark) ?? '#efece7',
};

const MUTED_OUTPUT_HEX = {
  light: hslTripleToHex(MUTED_FOREGROUND.light) ?? '#706c63',
  dark: hslTripleToHex(MUTED_FOREGROUND.dark) ?? '#999999',
};

export const TOKENS: readonly Token[] = [
  {
    kind: 'var',
    id: 'primary',
    group: 'theme',
    label: '强调色',
    hint: '按钮、链接、选中态与聚焦环',
    cssVar: '--primary',
    light: '221.2 83.2% 53.3%',
    dark: '217.2 91.2% 59.8%',
    also: [
      // Text stamped on the accent has to flip with it, or a pale accent gets
      // white-on-white labels.
      { cssVar: '--primary-foreground', mode: 'contrast' },
      { cssVar: '--ring', mode: 'same' },
      { cssVar: '--nav-tab-glow', mode: 'alpha', alpha: 0.22 },
      { cssVar: '--nav-input-focus-ring', mode: 'alpha', alpha: 0.22 },
    ],
  },
  {
    kind: 'var',
    id: 'background',
    group: 'theme',
    label: '页面背景',
    hint: '主内容区与侧边栏底色',
    cssVar: '--background',
    light: '44 22% 96%',
    dark: '0 0% 8%',
    also: [
      // The nav bar is a translucent sheet of the same colour.
      { cssVar: '--nav-glass-bg', mode: 'alpha', alpha: 0.7 },
    ],
  },
  {
    kind: 'var',
    id: 'card',
    group: 'theme',
    label: '卡片与浮层',
    hint: '设置卡片、弹窗与下拉面板',
    cssVar: '--card',
    light: '0 0% 100%',
    dark: '0 0% 12%',
    also: [
      // A popover that keeps the old card colour is the most visible way a
      // half-applied theme shows.
      { cssVar: '--popover', mode: 'same' },
    ],
  },
  {
    kind: 'var',
    id: 'border',
    group: 'theme',
    label: '分割线',
    hint: '卡片描边、输入框边界',
    cssVar: '--border',
    light: '44 14% 87%',
    dark: '0 0% 17%',
    also: [{ cssVar: '--input', mode: 'same' }],
  },
  {
    kind: 'var',
    id: 'foreground',
    group: 'text',
    label: '正文文字',
    hint: '标题、消息正文、命令文本',
    cssVar: '--foreground',
    ...FOREGROUND,
    also: [
      { cssVar: '--card-foreground', mode: 'same' },
      { cssVar: '--popover-foreground', mode: 'same' },
      { cssVar: '--secondary-foreground', mode: 'same' },
      { cssVar: '--accent-foreground', mode: 'same' },
    ],
  },
  {
    kind: 'var',
    id: 'muted',
    group: 'text',
    label: '次要文字',
    hint: '说明、时间戳、命令输出',
    cssVar: '--muted-foreground',
    ...MUTED_FOREGROUND,
  },
  {
    kind: 'color',
    id: 'command-prompt',
    group: 'command',
    label: '提示符 $',
    hint: '命令块最左侧的 $ 符号',
    selector: COMMAND_PROMPT_SELECTOR,
    light: '#10b981',
    dark: '#34d399',
  },
  {
    kind: 'color',
    id: 'command-text',
    group: 'command',
    label: '命令文本',
    hint: '命令块里被执行的命令本身',
    // The command text renders in the body colour; scoping the `text-foreground`
    // utility keeps the rule from repainting it anywhere else on the page.
    selector: `${COMMAND_SCOPE} span[class~="text-foreground"]`,
    ...FOREGROUND_HEX,
  },
  {
    kind: 'color',
    id: 'command-output',
    group: 'command',
    label: '正常输出',
    hint: '命令成功时输出的文字',
    selector: COMMAND_OUTPUT_SELECTOR,
    ...MUTED_OUTPUT_HEX,
  },
  {
    kind: 'color',
    id: 'command-error',
    group: 'command',
    label: '报错输出',
    hint: '命令失败时输出文字的颜色',
    selector: COMMAND_ERROR_SELECTOR,
    light: '#dc2626',
    dark: '#f87171',
  },
];

export type TokenGroupSpec = {
  id: TokenGroup;
  title: string;
  hint: string;
};

export const TOKEN_GROUPS: readonly TokenGroupSpec[] = [
  { id: 'theme', title: '主题色', hint: '浅色与深色主题各存一套，跟随右上角的主题切换。' },
  { id: 'text', title: '字体颜色', hint: '正文与辅助文字；命令块的文字也跟随这两项。' },
  { id: 'command', title: '命令行配色', hint: '命令块里的关键字颜色，覆盖组件写死的 Tailwind 色值。' },
];

const TOKENS_BY_ID = new Map(TOKENS.map((token) => [token.id, token]));

export function tokenById(id: string): Token | undefined {
  return TOKENS_BY_ID.get(id);
}

/** Every variable any token can write, so an apply pass can clear all of them first. */
export const MANAGED_VARS: readonly string[] = Array.from(new Set(
  TOKENS.flatMap((token) => {
    if (token.kind !== 'var') return [];
    return [token.cssVar, ...(token.also ?? []).map((companion) => companion.cssVar)];
  }),
));

/** The colour a token has when the user has not overridden it, as hex. */
export function defaultHex(token: Token, theme: ThemeName): string {
  const value = token[theme];
  if (token.kind !== 'var') return value;
  // The host ships HSL triples; the colour inputs need hex.
  return hslTripleToHex(value) ?? '#000000';
}
