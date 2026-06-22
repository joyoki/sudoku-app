#!/bin/bash
set -e

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 设置 JAVA_HOME（如果未设置）
if [ -z "$JAVA_HOME" ]; then
    # macOS Homebrew 路径
    if [ -d "/opt/homebrew/opt/openjdk@17" ]; then
        export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
    # Linux 路径
    elif [ -d "/usr/lib/jvm/java-17-openjdk-amd64" ]; then
        export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
    else
        echo "错误: 未找到 JDK 17，请设置 JAVA_HOME 环境变量"
        echo "安装方式: brew install openjdk@17 (macOS) 或 sudo apt install openjdk-17-jdk (Linux)"
        exit 1
    fi
    echo "✓ JAVA_HOME 设置完成: $JAVA_HOME"
else
    echo "✓ JAVA_HOME 已设置: $JAVA_HOME"
fi

# 检查 Android SDK
if [ ! -f "android-webview/local.properties" ]; then
    echo "错误: 未找到 android-webview/local.properties 文件"
    echo "请创建该文件并设置 SDK 路径，例如："
    echo "  echo 'sdk.dir=/opt/homebrew/share/android-commandlinetools' > android-webview/local.properties"
    exit 1
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "错误: 未找到 Node.js，请先安装 Node.js (>= 18)"
    echo "安装方式: brew install node (macOS) 或 https://nodejs.org/"
    exit 1
fi

# 同步网页文件
echo "正在同步网页文件..."
node scripts/sync-www.js
echo "✓ 网页文件同步完成"

# 复制到 assets
echo "正在复制文件到 Android assets..."
mkdir -p android-webview/app/src/main/assets
cp www/index.html www/app.js www/styles.css android-webview/app/src/main/assets/
echo "✓ 文件复制完成"

# 进入 android-webview 目录并构建 release APK
echo "正在构建 Release APK..."
cd android-webview
./gradlew --no-daemon assembleRelease
echo "✓ Release APK 构建完成"

# 检查构建产物
echo ""
echo "构建产物:"
ls -la app/build/outputs/apk/release/

# 复制 APK 到项目根目录
APK_FILE=$(ls app/build/outputs/apk/release/*.apk 2>/dev/null | head -1)
if [ -n "$APK_FILE" ]; then
    # 从 package.json 读取版本号
    VERSION=$(node -p "require('../package.json').version" 2>/dev/null || echo "0.1.1")
    cp "$APK_FILE" "$SCRIPT_DIR/Sudoku-v${VERSION}.apk"
    echo ""
    echo "========================================="
    echo "构建完成！APK 位于:"
    echo "$SCRIPT_DIR/Sudoku-v${VERSION}.apk"
    echo "========================================="
else
    echo "✗ 未找到 APK 文件"
    exit 1
fi
