const fs = require("node:fs/promises");
const path = require("node:path");

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function copyFile(src, dest) {
  await ensureDir(path.dirname(dest));
  await fs.copyFile(src, dest);
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const wwwDir = path.join(root, "www");

  const files = ["index.html", "app.js", "styles.css"];
  await ensureDir(wwwDir);

  await Promise.all(
    files.map((name) => copyFile(path.join(root, name), path.join(wwwDir, name))),
  );

  process.stdout.write(`Synced ${files.length} files to ${path.relative(root, wwwDir)}/\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

