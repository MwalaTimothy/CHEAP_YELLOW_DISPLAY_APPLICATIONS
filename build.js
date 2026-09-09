// Builds the deployable site into dist/: copies static assets as-is and
// replaces every JS entry point with a minified/mangled build so the readable
// source never reaches the published GitHub Pages site.
const fs = require("fs");
const path = require("path");
const { minify } = require("terser");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");

const COPY_FILES = ["index.html", "apps.html", "airsense.html", "styles.css", "styles-airsense.css"];
const COPY_DIRS = ["manifests", "firmware", "assets"];

// Minified rather than copied. Anything a page loads with a <script src> must
// be listed here — a file that is neither in COPY_FILES nor here simply does
// not exist in dist/, and 404s on Pages while working perfectly in local dev.
const MINIFY_FILES = ["app.js", "airsense.js"];

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

  for (const file of MINIFY_FILES) {
    const source = fs.readFileSync(path.join(ROOT, file), "utf8");
    const result = await minify(source, { mangle: true, compress: true });
    if (result.error) throw result.error;
    fs.writeFileSync(path.join(DIST, file), result.code);
  }

  console.log(`Build complete -> dist/ (${MINIFY_FILES.length} scripts minified)`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
