# Web 界面定制（web-ui-customizer）

CloudCLI 插件：给 Web 界面加两件事——**工作区悬浮信息卡**（含一键复制路径）与**主题/命令行配色**。全部设置默认关闭或默认沿用原生配色，装上去不改任何现有行为。

插件最初叫 `workspace-info-card`，加入配色能力后改名。旧的 `localStorage` 键会被读一次，所以早期打开过悬浮卡的人升级后开关状态不会丢。

## 截图

悬浮工作区行 → 信息卡（点卡片复制路径）：

![工作区悬浮信息卡](docs/hover-card.png)

设置在**「设置」对话框**里，「插件」下面多出自己的一页（开关 + 双主题配色 + 实时预览），不占工作区标签页：

![设置页](docs/settings-page.png)

## 功能

### 一、工作区悬浮信息卡

| 能力 | 说明 |
| --- | --- |
| 悬浮显示 | 鼠标停在左侧工作区行上约 0.15 秒弹出，移开自动消失 |
| 卡片内容 | 工作区名称、完整路径、目录创建时间、最近修改时间 |
| 点击复制 | 点卡片任意位置复制完整路径，底部显示「已复制路径」反馈 |
| 开关 | 默认**关闭**；关闭后不再监听工作区行的悬浮事件、也不渲染卡片，配色设置不受影响 |

CloudCLI 原本没有「复制工作区路径」的入口，路径只能从侧边栏被截断的两行文字里看。这个功能补上这件事。

### 二、主题配色（浅色 / 深色各一套）

| 分组 | 可调项 | 说明 |
| --- | --- | --- |
| 主题色 | 强调色、页面背景、卡片与浮层、分割线 | 写入宿主的 CSS 变量（HSL 三元组），并联动派生变量 |
| 字体颜色 | 正文文字、次要文字 | 同时联动 `--card-foreground` / `--popover-foreground` 等 |

强调色会顺带重算 `--primary-foreground`（自动挑可读的黑或白）、`--ring`、导航高光；页面背景会同步 `--nav-glass-bg` 的透明度；卡片色会同步 `--popover`。这样不会出现「只改了一半」的花脸。

### 三、命令行配色

CloudCLI 的命令块（`$ npm run build` / 输出 / 报错）里关键字是写死的 Tailwind 色值，不是变量，所以单独一组按选择器覆盖：

| 可调项 | 对应元素 |
| --- | --- |
| 提示符 `$` | 命令块左侧的 `$` |
| 命令文本 | 被执行的命令本身 |
| 正常输出 | 命令成功时的输出行 |
| 报错输出 | 命令失败时的输出行 |

> 边界：xterm 终端（`Terminal` 标签页）的配色由 xterm 主题对象决定，不走 CSS 变量，**不在这组覆盖范围内**。

## 为什么需要宿主配合

CloudCLI 上游的插件系统只有一个挂载位：`slot: "tab"`——插件 UI 只在**用户点开它的标签页时**才被 `import()` 进浏览器。而「悬浮卡片」和「全局配色」都要求不打开标签页也生效、「设置项」又不该占一个工作区视图，纯插件做不到。

这个 fork 给宿主加了两种表面（[宿主改动说明](https://github.com/fu827707013/claudecodeui/blob/feat/plugin-resident-mount/docs/plugin-resident-mount.md)）：

| manifest 字段 | 效果 | 本插件用途 |
| --- | --- | --- |
| `"alwaysMount": true` | 应用启动即把 bundle 挂进常驻层（[PluginHostLayer](https://github.com/fu827707013/claudecodeui/blob/feat/plugin-resident-mount/src/modules/plugins/PluginHostLayer.tsx)），与当前打开哪个标签页无关 | 注入配色样式表、运行悬浮卡片 |
| `"slot": "settings"` | 插件 UI 变成「设置」对话框里的一页，左栏导航多一项 | 配置界面 |

同一个 bundle 用 `host.context.surface` 判别自己在哪个表面（`'resident' | 'settings' | 'tab'`），分别渲染卡片或面板。两处是**同一份 bundle 的两个模块实例**，模块作用域不共享，所以靠 `localStorage` + 事件同步。

装到上游版本上插件仍可用——只是要先点一次它的标签页，且「设置里的那一页」不会出现。

## 结构

```
web-ui-customizer/
├── manifest.json          插件清单（slot: settings + alwaysMount: true）
├── package.json           构建脚本与依赖
├── scripts/build.mjs      esbuild 打包（前端 + 后端）
└── src/
    ├── index.ts           入口：按 host.context.surface 分派——常驻区挂卡片，设置页挂面板
    ├── card.ts            悬浮卡片：行定位、显隐延时、点击复制、时间缓存
    ├── panel.ts           设置页：开关、主题切换、预览、颜色行
    ├── tokens.ts          可调项定义：每个 token 的宿主默认值、选择器、联动变量
    ├── apply.ts           把设置编译成一张注入的样式表（双主题作用域）
    ├── color.ts           hex ⇄ HSL 三元组、可读前景色、hex 归一化
    ├── clipboard.ts       剪贴板（含 http 页面的 execCommand 回退）
    ├── prefs.ts           设置持久化 + 跨表面变更事件
    ├── server.ts          后端：读目录创建/修改时间
    ├── types.ts           宿主 API 类型
    └── ui/                样式表与内联图标
```

## 开发

```bash
npm install
npm run build      # 产出 dist/index.js 与 dist/server.js
npm run typecheck
npm run dev        # 监听模式
```

## 安装

### 一、在界面里装（推荐）

CloudCLI 的插件安装器只做一件事：`git clone` → 找仓库**根目录**的 `manifest.json` → `npm install --ignore-scripts` → `npm run build`。所以本仓库根目录**就是插件本体**，直接填仓库地址即可：

```
https://github.com/fu827707013/web-ui-customizer
```

打开 **设置 → 插件**，在「从 Git 安装」里粘贴上面这行，等它构建完成 → 重启 CloudCLI → 在 **设置 → Web 界面定制** 里打开开关。

> 安装器不会并行处理「合集仓库」：它只 clone 一次、只看仓库根目录，所以一个仓库放多个插件是装不上的（会报 "Cloned repository does not contain a manifest.json"）。想发多个插件就发多个仓库。

### 二、本地开发装（改代码时用）

```powershell
npm run build
$target = "$env:USERPROFILE\.claude-code-ui\plugins\web-ui-customizer"
New-Item -ItemType Directory -Force $target | Out-Null
# 逐项复制：`Copy-Item -Recurse . $target` 会多套一层 web-ui-customizer\ 目录，
# 宿主按 plugins\<name>\manifest.json 找清单，套一层就扫不到。
Copy-Item -Path manifest.json, package.json, icon.svg -Destination $target -Force
Copy-Item -Path src, scripts, dist -Destination $target -Recurse -Force
```

然后重启 CloudCLI 宿主（插件清单只在启动/刷新插件列表时扫描），在 **设置 → Web 界面定制** 里打开开关即可。

## 实现要点（踩过的坑）

- **一个 bundle，三个表面**。宿主的常驻层与设置页各自 `import()` 一次，模块作用域不共享，所以设置只能走 `localStorage` + `SETTINGS_CHANGED_EVENT` 同步。
- **`slot: "settings"` 后标签页不再出现**。设置页只在它是当前视图时挂载，切走即卸载——插件代码不会停在后台。想同时要「常驻效果」和「设置界面」，就同时写 `alwaysMount: true` 与 `slot: "settings"`，用 `surface` 分流。
- **颜色必须写成样式表，不能写成内联 `style`**。宿主浅色在 `:root`、深色在 `.dark`，内联声明没法按主题分开，会把一套颜色钉死到两个主题上。注入的样式表可以同时持有 `html:not(.dark)` 与 `html.dark` 两块，切主题无需重新应用。
- **规则要带 `!important`**。选择器特异性够（0,1,1 vs 0,1,0），但 dev server 每次热更新都会把 Tailwind 样式表重新插到 `<head>` 末尾，宿主的代码高亮主题也是渲染时才注入——同样特异性、出现在后面的规则会赢。自定义属性和 `color` 都加 `!important` 才能稳住这个竞争。
- **命令块没有 data 属性**，只能按组件写死的 utility class 匹配，且 class 名里带 `/`，用 `[class~="group/cmd"]` 才能避开选择器转义。
- **行定位靠宿主的数据属性**：`data-cloudcli-project-path` / `data-cloudcli-project-name`，两种侧边栏布局的行上都有。插件用 `document` 级委托监听，后挂载的行也能命中。
- **卡片挂在 `document.body` 而不是自己的容器里**。常驻层的容器是零尺寸的，塞进去的东西看不见。
- **读时间走宿主 RPC 代理**，不是裸 `fetch`：`/api/plugins/*` 需要登录态，裸请求会 401。
- **创建时间来自文件系统**，由插件后端 `fs.stat` 得到；有些文件系统不报 creation time，此时卡片少显示一行，而不是显示 1970。
