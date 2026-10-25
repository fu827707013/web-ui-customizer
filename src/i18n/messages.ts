/**
 * Every user-visible string of this plugin, per language.
 *
 * `en` is the reference locale: its key set defines `MessageKey`, so a locale
 * that misses one key fails `npm run typecheck` instead of silently rendering
 * `undefined`. `zh-CN` and `zh-TW` are complete; any other CloudCLI language
 * falls back to `en` (see index.ts), which is also what the host does.
 *
 * Placeholders are `{name}` and are filled by `format()` in index.ts. The
 * token and group sections are keyed by the ids in tokens.ts, so a new colour
 * token needs one label and one hint here and nothing else.
 */

const en = {
  'panel.title': 'Web UI Customizer',
  'panel.subtitle': 'Fine-tune the CloudCLI interface: the workspace hover card, theme colours, and the command line\'s keyword colours. Settings stay in this browser and apply immediately.',

  'panel.feature.section': 'Feature',
  'panel.status.on': 'On: hovering a workspace row shows its info card.',
  'panel.status.off': 'Off: the workspace list behaves exactly like stock CloudCLI and shows no card.',
  'panel.toggle.label': 'Show workspace info card on hover',
  'panel.toggle.desc1': 'When on, resting the pointer on a workspace row for about 0.15s opens its card; moving away closes it.',
  'panel.toggle.desc2': 'Clicking anywhere on the card copies that workspace\'s full path, and the footer confirms it.',
  'panel.toggle.desc3': 'When off, nothing listens to the workspace rows and no card is ever rendered; the colours below are unaffected.',

  'panel.appearance.section': 'Appearance',
  'panel.theme.group': 'Theme being edited',
  'panel.resetAll': 'Reset all',
  'panel.badge.otherTheme': 'other theme customised',
  'panel.reset.one': 'Reset',
  'panel.reset.oneTitle': 'Restore this item\'s CloudCLI default',
  'panel.colors.summaryNone': 'Using CloudCLI\'s default colours.',
  'panel.colors.summaryCount': '{count} colour(s) customised, everything else keeps its default.',
  'panel.note.title': 'Note: ',
  'panel.note.body': 'The feature switch is off by default and every colour starts at CloudCLI\'s own value. Settings are stored in this browser (localStorage) and apply immediately without a reload; "Reset" restores one colour and "Reset all" clears every custom colour.',
  'panel.preview.muted': 'Hints and timestamps',
  'panel.preview.accent': 'Accent',
  'panel.picker.colorAria': '{label} colour',
  'panel.picker.hexAria': '{label} hex value',

  'theme.light': 'Light',
  'theme.dark': 'Dark',

  'groups.theme.title': 'Theme colours',
  'groups.theme.hint': 'One set per theme, following the app\'s light/dark switch.',
  'groups.text.title': 'Text colours',
  'groups.text.hint': 'Body and secondary text; the command block follows both.',
  'groups.command.title': 'Command line',
  'groups.command.hint': 'Keyword colours inside a command block, overriding the Tailwind values the component hard-codes.',

  'tokens.primary.label': 'Accent',
  'tokens.primary.hint': 'Buttons, links, selection and focus rings',
  'tokens.background.label': 'Page background',
  'tokens.background.hint': 'Main content area and sidebar surface',
  'tokens.card.label': 'Cards and popovers',
  'tokens.card.hint': 'Settings cards, dialogs and dropdown panels',
  'tokens.border.label': 'Dividers',
  'tokens.border.hint': 'Card outlines and input borders',
  'tokens.foreground.label': 'Body text',
  'tokens.foreground.hint': 'Headings, message text, command text',
  'tokens.muted.label': 'Secondary text',
  'tokens.muted.hint': 'Hints, timestamps, command output',
  'tokens.command-prompt.label': 'Prompt $',
  'tokens.command-prompt.hint': 'The $ at the left of a command block',
  'tokens.command-text.label': 'Command text',
  'tokens.command-text.hint': 'The command line that was executed',
  'tokens.command-output.label': 'Successful output',
  'tokens.command-output.hint': 'Text a command prints when it succeeds',
  'tokens.command-error.label': 'Error output',
  'tokens.command-error.hint': 'Text a command prints when it fails',

  'card.ariaLabel': 'Workspace info',
  'card.action.idle': 'Click to copy the path',
  'card.action.copied': 'Path copied',
  'card.action.failed': 'Copy failed, select the path manually',
  'card.meta.loading': 'Reading creation time…',
  'card.meta.created': 'Created {time}',
  'card.meta.modified': 'Modified {time}',
};

/** The key set every locale must provide. */
export type MessageKey = keyof typeof en;

const zhCN: Record<MessageKey, string> = {
  'panel.title': 'Web 界面定制',
  'panel.subtitle': '调整 CloudCLI 的界面细节：工作区悬浮信息卡、主题配色与命令行的关键字颜色。所有设置只保存在本机浏览器，改动即时生效。',

  'panel.feature.section': '功能开关',
  'panel.status.on': '当前已开启：悬浮工作区行会弹出信息卡。',
  'panel.status.off': '当前已关闭：工作区列表保持 CloudCLI 原始行为，不会弹出任何卡片。',
  'panel.toggle.label': '悬浮显示工作区信息卡',
  'panel.toggle.desc1': '开启后，鼠标停在任意工作区行上约 0.15 秒会弹出信息卡；移开指针卡片自动消失。',
  'panel.toggle.desc2': '点击卡片任意位置即复制该工作区的完整路径，卡片底部会显示「已复制路径」作为反馈。',
  'panel.toggle.desc3': '关闭后不再监听工作区行的悬浮事件，也不会渲染卡片；下面的配色设置不受影响。',

  'panel.appearance.section': '外观',
  'panel.theme.group': '正在编辑的主题',
  'panel.resetAll': '全部恢复默认',
  'panel.badge.otherTheme': '另一主题已自定义',
  'panel.reset.one': '默认',
  'panel.reset.oneTitle': '恢复该项的 CloudCLI 默认颜色',
  'panel.colors.summaryNone': '当前使用 CloudCLI 默认配色。',
  'panel.colors.summaryCount': '已自定义 {count} 处颜色，其余沿用默认值。',
  'panel.note.title': '说明：',
  'panel.note.body': '功能开关默认关闭，颜色默认沿用 CloudCLI 自带配色。设置保存在本机浏览器（localStorage），切换后立即生效，无需刷新页面；「默认」按钮把单个颜色还原，「全部恢复默认」清除所有自定义颜色。',
  'panel.preview.muted': '说明与时间戳',
  'panel.preview.accent': '强调色',
  'panel.picker.colorAria': '{label}颜色',
  'panel.picker.hexAria': '{label}色值',

  'theme.light': '浅色',
  'theme.dark': '深色',

  'groups.theme.title': '主题色',
  'groups.theme.hint': '浅色与深色主题各存一套，跟随右上角的主题切换。',
  'groups.text.title': '字体颜色',
  'groups.text.hint': '正文与辅助文字；命令块的文字也跟随这两项。',
  'groups.command.title': '命令行配色',
  'groups.command.hint': '命令块里的关键字颜色，覆盖组件写死的 Tailwind 色值。',

  'tokens.primary.label': '强调色',
  'tokens.primary.hint': '按钮、链接、选中态与聚焦环',
  'tokens.background.label': '页面背景',
  'tokens.background.hint': '主内容区与侧边栏底色',
  'tokens.card.label': '卡片与浮层',
  'tokens.card.hint': '设置卡片、弹窗与下拉面板',
  'tokens.border.label': '分割线',
  'tokens.border.hint': '卡片描边、输入框边界',
  'tokens.foreground.label': '正文文字',
  'tokens.foreground.hint': '标题、消息正文、命令文本',
  'tokens.muted.label': '次要文字',
  'tokens.muted.hint': '说明、时间戳、命令输出',
  'tokens.command-prompt.label': '提示符 $',
  'tokens.command-prompt.hint': '命令块最左侧的 $ 符号',
  'tokens.command-text.label': '命令文本',
  'tokens.command-text.hint': '命令块里被执行的命令本身',
  'tokens.command-output.label': '正常输出',
  'tokens.command-output.hint': '命令成功时输出的文字',
  'tokens.command-error.label': '报错输出',
  'tokens.command-error.hint': '命令失败时输出文字的颜色',

  'card.ariaLabel': '工作区信息',
  'card.action.idle': '点击复制路径',
  'card.action.copied': '已复制路径',
  'card.action.failed': '复制失败，请手动选择路径',
  'card.meta.loading': '创建时间读取中…',
  'card.meta.created': '创建于 {time}',
  'card.meta.modified': '最近修改 {time}',
};

const zhTW: Record<MessageKey, string> = {
  'panel.title': 'Web 介面客製',
  'panel.subtitle': '調整 CloudCLI 的介面細節：工作區懸浮資訊卡、主題配色與指令列的關鍵字顏色。所有設定只保存在本機瀏覽器，變更即時生效。',

  'panel.feature.section': '功能開關',
  'panel.status.on': '目前已開啟：懸浮工作區列會彈出資訊卡。',
  'panel.status.off': '目前已關閉：工作區列表保持 CloudCLI 原始行為，不會彈出任何卡片。',
  'panel.toggle.label': '懸浮顯示工作區資訊卡',
  'panel.toggle.desc1': '開啟後，滑鼠停在任一工作區列上約 0.15 秒會彈出資訊卡；移開指標卡片自動消失。',
  'panel.toggle.desc2': '點擊卡片任意位置即複製該工作區的完整路徑，卡片底部會顯示「已複製路徑」作為回饋。',
  'panel.toggle.desc3': '關閉後不再監聽工作區列的懸浮事件，也不會渲染卡片；下方的配色設定不受影響。',

  'panel.appearance.section': '外觀',
  'panel.theme.group': '正在編輯的主題',
  'panel.resetAll': '全部恢復預設',
  'panel.badge.otherTheme': '另一主題已自訂',
  'panel.reset.one': '預設',
  'panel.reset.oneTitle': '恢復該項的 CloudCLI 預設顏色',
  'panel.colors.summaryNone': '目前使用 CloudCLI 預設配色。',
  'panel.colors.summaryCount': '已自訂 {count} 處顏色，其餘沿用預設值。',
  'panel.note.title': '說明：',
  'panel.note.body': '功能開關預設關閉，顏色預設沿用 CloudCLI 自帶配色。設定保存在本機瀏覽器（localStorage），切換後立即生效，無需重新整理頁面；「預設」按鈕把單一顏色還原，「全部恢復預設」清除所有自訂顏色。',
  'panel.preview.muted': '說明與時間戳',
  'panel.preview.accent': '強調色',
  'panel.picker.colorAria': '{label}顏色',
  'panel.picker.hexAria': '{label}色值',

  'theme.light': '淺色',
  'theme.dark': '深色',

  'groups.theme.title': '主題色',
  'groups.theme.hint': '淺色與深色主題各存一套，跟隨右上角的主題切換。',
  'groups.text.title': '字體顏色',
  'groups.text.hint': '正文與輔助文字；指令區塊的文字也跟隨這兩項。',
  'groups.command.title': '指令列配色',
  'groups.command.hint': '指令區塊裡的關鍵字顏色，覆蓋元件寫死的 Tailwind 色值。',

  'tokens.primary.label': '強調色',
  'tokens.primary.hint': '按鈕、連結、選取態與聚焦環',
  'tokens.background.label': '頁面背景',
  'tokens.background.hint': '主內容區與側邊欄底色',
  'tokens.card.label': '卡片與浮層',
  'tokens.card.hint': '設定卡片、彈窗與下拉面板',
  'tokens.border.label': '分隔線',
  'tokens.border.hint': '卡片描邊、輸入框邊界',
  'tokens.foreground.label': '正文文字',
  'tokens.foreground.hint': '標題、訊息正文、指令文字',
  'tokens.muted.label': '次要文字',
  'tokens.muted.hint': '說明、時間戳、指令輸出',
  'tokens.command-prompt.label': '提示符 $',
  'tokens.command-prompt.hint': '指令區塊最左側的 $ 符號',
  'tokens.command-text.label': '指令文字',
  'tokens.command-text.hint': '指令區塊裡被執行的指令本身',
  'tokens.command-output.label': '正常輸出',
  'tokens.command-output.hint': '指令成功時輸出的文字',
  'tokens.command-error.label': '錯誤輸出',
  'tokens.command-error.hint': '指令失敗時輸出文字的顏色',

  'card.ariaLabel': '工作區資訊',
  'card.action.idle': '點擊複製路徑',
  'card.action.copied': '已複製路徑',
  'card.action.failed': '複製失敗，請手動選取路徑',
  'card.meta.loading': '建立時間讀取中…',
  'card.meta.created': '建立於 {time}',
  'card.meta.modified': '最近修改 {time}',
};

export const MESSAGES = {
  en,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
} as const;

/** A locale this build actually ships strings for. */
export type Locale = keyof typeof MESSAGES;

export const SUPPORTED_LOCALES = Object.keys(MESSAGES) as Locale[];
