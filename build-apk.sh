#!/bin/bash
set -e

# 设置 JAVA_HOME（如果未设置）
if [ -z "$JAVA_HOME" ]; then
    export JAVA_HOME=/opt/homebrew/Cellar/openjdk@17/17.0.17/libexec/openjdk.jdk/Contents/Home
    echo "✓ JAVA_HOME 设置完成: $JAVA_HOME"
else
    echo "✓ JAVA_HOME 已设置: $JAVA_HOME"
fi

# 进入项目目录
cd /Users/siyongjie/Documents/01.tool/sudoku-app

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
    cp "$APK_FILE" /Users/siyongjie/Documents/01.tool/sudoku-app/Sudoku-v0.1.1.apk
    echo ""
    echo "========================================="
    echo "构建完成！APK 位于:"
    echo "/Users/siyongjie/Documents/01.tool/sudoku-app/Sudoku-v0.1.1.apk"
    echo "========================================="
else
    echo "✗ 未找到 APK 文件"
    exit 1
fi
