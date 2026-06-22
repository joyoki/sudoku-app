const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.resolve(__dirname, "..");
process.chdir(root);

const pad = (n) => String(n).padStart(2, "0");
const d = new Date();
const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}`;

const defaultJdk = path.join(root, ".tools", "jdk-17.0.18+8", "Contents", "Home");
const env = { ...process.env };
if (!env.JAVA_HOME && fs.existsSync(path.join(defaultJdk, "bin", "java"))) {
  env.JAVA_HOME = defaultJdk;
  env.PATH = `${path.join(defaultJdk, "bin")}${path.delimiter}${env.PATH || ""}`;
}

execSync("node scripts/sync-www.js", { stdio: "inherit", env });

const assetsDir = path.join(root, "android-webview", "app", "src", "main", "assets");
fs.mkdirSync(assetsDir, { recursive: true });
for (const name of ["index.html", "app.js", "styles.css"]) {
  fs.copyFileSync(path.join(root, "www", name), path.join(assetsDir, name));
}

const androidDir = path.join(root, "android-webview");
execSync("./gradlew --no-daemon assembleDebug", { cwd: androidDir, stdio: "inherit", env });

const builtApk = path.join(androidDir, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
const releasesDir = path.join(androidDir, "releases");
fs.mkdirSync(releasesDir, { recursive: true });
const outName = `Sudoku-debug-${stamp}.apk`;
const outPath = path.join(releasesDir, outName);
fs.copyFileSync(builtApk, outPath);

process.stdout.write(
  `\n已生成（Gradle 默认路径，便于对比旧构建）:\n  ${builtApk}\n\n已复制为带时间戳版本（不删除历史文件）:\n  ${outPath}\n`,
);
