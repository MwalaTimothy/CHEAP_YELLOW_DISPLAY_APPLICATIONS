// Builds the deployable site into dist/: copies static assets as-is and
// replaces app.js with a minified/mangled build so the readable source
// never reaches the published GitHub Pages site.
const fs = require("fs");
const path = require("path");
const { minify } = require("terser");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");

const COPY_FILES = ["index.html", "apps.html", "styles.css"];
const COPY_DIRS = ["manifests", "firmware"];

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

async function build() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  for (const file of COPY_FILES) {
    copyRecursive(path.join(ROOT, file), path.join(DIST, file));
  }
  for (const dir of COPY_DIRS) {
    copyRecursive(path.join(ROOT, dir), path.join(DIST, dir));
  }

  const source = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
  const result = await minify(source, { mangle: true, compress: true });
  if (result.error) throw result.error;
  fs.writeFileSync(path.join(DIST, "app.js"), result.code);

  console.log("Build complete -> dist/");
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
