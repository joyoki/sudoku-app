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
| 构建工具 | Gradle 8.7、Node.js 脚本 |

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

| 工具 | 版本 | 用途 |
|------|------|------|
| **浏览器** | 任意现代浏览器 | 运行网页版 |
| **Node.js** | >= 18 | 执行构建脚本 |
| **JDK** | 17 | Gradle 构建 Android |
| **Android SDK** | API 34 | 编译 Android 应用 |

## 前置配置（构建 APK 必需）

### macOS 配置步骤

#### 1. 安装 JDK 17

```bash
# 使用 Homebrew 安装
brew install openjdk@17

# 验证安装
/opt/homebrew/opt/openjdk@17/bin/java -version
# 输出: openjdk version "17.0.x" ...
```

#### 2. 安装 Android SDK 命令行工具

```bash
# 安装 Android 命令行工具
brew install android-commandlinetools

# 接受 SDK 许可协议
yes | sdkmanager --licenses

# 安装必要的 SDK 组件
sdkmanager "platforms;android-34" "build-tools;34.0.0"
```

#### 3. 配置 SDK 路径

在项目 `android-webview/` 目录下创建 `local.properties` 文件：

```bash
# 创建 local.properties
echo "sdk.dir=/opt/homebrew/share/android-commandlinetools" > android-webview/local.properties
```

#### 4. 验证环境

```bash
# 检查 Java
java -version

# 检查 SDK 组件
sdkmanager --list_installed

# 检查 Node.js
node --version
```

### Linux 配置步骤

```bash
# 安装 JDK 17
sudo apt install openjdk-17-jdk

# 下载 Android SDK 命令行工具
# 从 https://developer.android.com/studio#command-line-tools-only 下载
# 解压到 ~/Android/sdk/

# 设置环境变量
export ANDROID_HOME=~/Android/sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin

# 安装 SDK 组件
yes | sdkmanager --licenses
sdkmanager "platforms;android-34" "build-tools;34.0.0"

# 创建 local.properties
echo "sdk.dir=$HOME/Android/sdk" > android-webview/local.properties
```

### Windows 配置步骤

```powershell
# 安装 JDK 17（从 https://adoptium.net/ 下载）

# 安装 Android Studio（自动安装 SDK）
# 或手动下载 SDK 命令行工具

# 设置环境变量
set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\cmdline-tools\latest\bin

# 安装 SDK 组件
sdkmanager --licenses
sdkmanager "platforms;android-34" "build-tools;34.0.0"

# 创建 local.properties
echo sdk.dir=C:\\Users\\%USERNAME%\\AppData\\Local\\Android\\Sdk > android-webview\\local.properties
```

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

确保已完成上述前置配置后：

```bash
# 安装 Node.js 依赖
npm install

# 一键构建 Release APK
./build-apk.sh

# 或者使用 npm 脚本
npm run apk:release
```

构建完成后，APK 将位于项目根目录：`Sudoku-v0.1.1.apk`

### 常见问题

#### Q: 报错 "SDK location not found"

A: 需要创建 `android-webview/local.properties` 文件，内容为 SDK 路径：
```
sdk.dir=/path/to/your/Android/sdk
```

#### Q: 报错 "Could not determine a usable local IP"

A: 这是 Gradle 网络权限问题，确保在本地终端执行，不要在受限环境中运行。

#### Q: 报错 "JAVA_HOME is not set"

A: 设置 JAVA_HOME 环境变量：
```bash
# macOS (Homebrew)
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home

# Linux
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

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
| Build Tools | Gradle 8.7, Node.js scripts |

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

| Tool | Version | Purpose |
|------|---------|---------|
| **Browser** | Any modern browser | Run web version |
| **Node.js** | >= 18 | Run build scripts |
| **JDK** | 17 | Gradle build for Android |
| **Android SDK** | API 34 | Compile Android app |

## Setup (Required for APK Build)

### macOS Setup

#### 1. Install JDK 17

```bash
# Install using Homebrew
brew install openjdk@17

# Verify installation
/opt/homebrew/opt/openjdk@17/bin/java -version
# Output: openjdk version "17.0.x" ...
```

#### 2. Install Android SDK Command Line Tools

```bash
# Install Android command line tools
brew install android-commandlinetools

# Accept SDK licenses
yes | sdkmanager --licenses

# Install required SDK components
sdkmanager "platforms;android-34" "build-tools;34.0.0"
```

#### 3. Configure SDK Path

Create `local.properties` file in the `android-webview/` directory:

```bash
# Create local.properties
echo "sdk.dir=/opt/homebrew/share/android-commandlinetools" > android-webview/local.properties
```

#### 4. Verify Environment

```bash
# Check Java
java -version

# Check SDK components
sdkmanager --list_installed

# Check Node.js
node --version
```

### Linux Setup

```bash
# Install JDK 17
sudo apt install openjdk-17-jdk

# Download Android SDK command line tools
# From https://developer.android.com/studio#command-line-tools-only
# Extract to ~/Android/sdk/

# Set environment variables
export ANDROID_HOME=~/Android/sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin

# Install SDK components
yes | sdkmanager --licenses
sdkmanager "platforms;android-34" "build-tools;34.0.0"

# Create local.properties
echo "sdk.dir=$HOME/Android/sdk" > android-webview/local.properties
```

### Windows Setup

```powershell
# Install JDK 17 (from https://adoptium.net/)

# Install Android Studio (includes SDK)
# Or manually download SDK command line tools

# Set environment variables
set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\cmdline-tools\latest\bin

# Install SDK components
sdkmanager --licenses
sdkmanager "platforms;android-34" "build-tools;34.0.0"

# Create local.properties
echo sdk.dir=C:\\Users\\%USERNAME%\\AppData\\Local\\Android\\Sdk > android-webview\\local.properties
```

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

After completing the setup above:

```bash
# Install Node.js dependencies
npm install

# One-click build Release APK
./build-apk.sh

# Or use npm script
npm run apk:release
```

After building, the APK will be located at the project root: `Sudoku-v0.1.1.apk`

### Troubleshooting

#### Q: Error "SDK location not found"

A: Create `android-webview/local.properties` file with SDK path:
```
sdk.dir=/path/to/your/Android/sdk
```

#### Q: Error "Could not determine a usable local IP"

A: This is a Gradle network permission issue. Run in local terminal, not in restricted environments.

#### Q: Error "JAVA_HOME is not set"

A: Set the JAVA_HOME environment variable:
```bash
# macOS (Homebrew)
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home

# Linux
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

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
