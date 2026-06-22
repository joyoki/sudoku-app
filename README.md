# Sudoku - 数独游戏

[English](#english) | [中文](#中文)

---

# 中文

一款纯前端数独游戏，支持网页直接运行和 Android APK 两种使用方式。

## 功能

- 9x9 数独棋盘（支持点击选中、同行/列/宫高亮）
- 难度切换：简单 / 中等 / 困难
- 模式切换：经典模式 / 每日挑战（基于日期种子，同一天题目固定）
- 计时器
- 生命值机制（共 3 条命，填错扣命，归零失败）
- 数字键盘输入 + 物理键盘输入（1-9）
- 笔记模式（候选数标记）
- 提示、检查、撤销、清空单元格
- 完成时通关提示 + 成就系统
- 本地自动存档（刷新后继续游戏）
- 本地排行榜（经典模式最佳 / 每日挑战记录）

## 项目架构

```
sudoku-app/
├── index.html              # 网页入口 (HTML 结构)
├── app.js                  # 核心游戏逻辑 (约 580 行)
├── styles.css              # 样式 (响应式，移动端优先)
├── package.json            # Node.js 配置与构建脚本
├── build-apk.sh            # APK 构建脚本
│
├── scripts/
│   ├── sync-www.js         # 同步网页源文件到 www/
│   └── build-apk-dated.js  # 一键构建带时间戳的 APK
│
└── android-webview/        # Android WebView 工程
    ├── build.gradle        # Gradle 顶层配置 (AGP 8.5.2)
    ├── variables.gradle    # SDK 版本 (compileSdk 34, minSdk 24)
    └── app/
        ├── build.gradle
        └── src/main/
            ├── AndroidManifest.xml
            ├── assets/         # 网页文件打包至此
            └── java/.../
                └── MainActivity.java   # WebView 入口 Activity
```

### 技术栈

| 层面 | 技术 |
|------|------|
| 网页前端 | 原生 HTML + CSS + JavaScript（无框架依赖） |
| 数据存储 | localStorage（存档 / 统计 / 成就） |
| 数独算法 | 回溯法生成 + Mulberry32 伪随机（支持种子） |
| Android | 原生 WebView + 手动打包 assets（轻量方案） |
| 构建工具 | Gradle、Node.js 脚本 |

### 核心模块 (`app.js`)

| 模块 | 说明 |
|------|------|
| 数独生成 | `solve()` 回溯算法生成完整解，`makePuzzle()` 按难度挖空 |
| 每日挑战 | 日期字符串 → FNV-1a hash → Mulberry32 PRNG，确保同日同题 |
| 渲染 | `render()` / `renderCell()` 更新 DOM，高亮同行列宫和相同数字 |
| 存档 | `saveCurrentGame()` / `loadCurrentGame()` 读写 localStorage |
| 成就 | `unlockAchievement()` 解锁并持久化成就记录 |
| 事件 | 键盘 + 数字键盘 + 按钮事件绑定 |

## 环境要求

| 工具 | 用途 | 是否必需 |
|------|------|---------|
| **浏览器** | 运行网页版 | 网页版必需 |
| **Node.js** (>= 18) | 执行构建脚本 | 构建 APK 时必需 |
| **JDK 17** | Gradle 构建 Android | 构建 APK 时必需 |
| **Android SDK** | 编译 Android 应用 | 构建 APK 时必需 |

## 编译与运行

### 1. 网页版（零配置）

```bash
# 方式一：直接浏览器打开
open index.html

# 方式二：本地 HTTP 服务
python3 -m http.server 8090
# 访问 http://localhost:8090/
```

### 2. Android APK

此方案不依赖 Capacitor，直接用原生 WebView 加载本地 HTML，APK 体积极小。

```bash
# 安装依赖
npm install

# 一键构建 Release APK
./build-apk.sh

# 或者使用 npm 脚本
npm run apk:release
```

构建完成后，APK 将位于项目根目录：`Sudoku-v0.1.1.apk`

## 操作快捷键

| 按键 | 功能 |
|------|------|
| `1` - `9` | 填入数字 |
| `Backspace` / `Delete` / `0` | 清空当前格 |
| `N` | 切换笔记模式 |
| `Cmd/Ctrl + Z` | 撤销 |
| 方向键 `↑↓←→` | 移动选中格 |

---

# English

A pure front-end Sudoku game that runs directly in the browser or as an Android APK.

## Features

- 9x9 Sudoku board with cell selection and row/column/box highlighting
- Difficulty levels: Easy / Medium / Hard
- Game modes: Classic / Daily Challenge (seeded by date, same puzzle for everyone on the same day)
- Timer
- Lives system (3 lives; wrong answers cost a life, game over at zero)
- On-screen keypad + physical keyboard input (1-9)
- Notes mode (pencil marks / candidate numbers)
- Hint, Check, Undo, Clear cell
- Win celebration + achievements
- Auto-save to localStorage (resume after refresh)
- Local leaderboard (best Classic times / Daily Challenge records)

## Project Structure

```
sudoku-app/
├── index.html              # Web entry point (HTML structure)
├── app.js                  # Core game logic (~580 lines)
├── styles.css              # Styles (responsive, mobile-first)
├── package.json            # Node.js config & build scripts
├── build-apk.sh            # APK build script
│
├── scripts/
│   ├── sync-www.js         # Sync web source files to www/
│   └── build-apk-dated.js  # One-click build with timestamped APK
│
└── android-webview/        # Android WebView project
    ├── build.gradle        # Top-level Gradle (AGP 8.5.2)
    ├── variables.gradle    # SDK versions (compileSdk 34, minSdk 24)
    └── app/
        ├── build.gradle
        └── src/main/
            ├── AndroidManifest.xml
            ├── assets/         # Web files packaged here
            └── java/.../
                └── MainActivity.java   # WebView entry Activity
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Web Frontend | Vanilla HTML + CSS + JavaScript (no framework) |
| Data Storage | localStorage (save / stats / achievements) |
| Sudoku Algorithm | Backtracking generation + Mulberry32 PRNG (seeded) |
| Android | Native WebView + manual asset bundling (lightweight) |
| Build Tools | Gradle, Node.js scripts |

### Core Modules (`app.js`)

| Module | Description |
|--------|-------------|
| Sudoku Generation | `solve()` backtracking fills a complete board; `makePuzzle()` removes cells by difficulty |
| Daily Challenge | Date string → FNV-1a hash → Mulberry32 PRNG ensures same puzzle per day |
| Rendering | `render()` / `renderCell()` updates DOM with highlights for peers and matching numbers |
| Persistence | `saveCurrentGame()` / `loadCurrentGame()` via localStorage |
| Achievements | `unlockAchievement()` persists unlock events |
| Events | Keyboard + keypad + button event bindings |

## Prerequisites

| Tool | Purpose | Required For |
|------|---------|-------------|
| **Browser** | Run web version | Web only |
| **Node.js** (>= 18) | Run build scripts | APK builds |
| **JDK 17** | Gradle build | APK builds |
| **Android SDK** | Compile Android app | APK builds |

## Build & Run

### 1. Web Version (Zero Config)

```bash
# Option A: Open directly in browser
open index.html

# Option B: Local HTTP server
python3 -m http.server 8090
# Visit http://localhost:8090/
```

### 2. Android APK

This approach does not depend on Capacitor. It uses a native WebView to load local HTML, resulting in a minimal APK size.

```bash
# Install dependencies
npm install

# One-click build Release APK
./build-apk.sh

# Or use npm script
npm run apk:release
```

After building, the APK will be located at the project root: `Sudoku-v0.1.1.apk`

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1` - `9` | Enter number |
| `Backspace` / `Delete` / `0` | Clear current cell |
| `N` | Toggle notes mode |
| `Cmd/Ctrl + Z` | Undo |
| Arrow keys `↑↓←→` | Move selection |

## License

ISC
