/* Builds the deployable site into dist/.
 *
 * index.html in this folder is the artifact source: a body fragment, because
 * claude.ai supplies the document around it. A public page needs the whole
 * document, so this script wraps the same markup in a real <head> with the
 * metadata a site needs — title, description, social card, icons, manifest,
 * service worker — and copies the modules beside it unchanged.
 *
 *   npm run build
 *   SITE_URL=https://example.com npm run build
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "dist");
const site = join(here, "site");

const SITE_URL = (process.env.SITE_URL || "https://schotegavin-sudo.github.io/transfer-odds").replace(/\/$/, "");
const TITLE = "Matriculate — transfer admission chances at 588 US colleges";
const DESC = "Enter your GPA, credits, residency and major once. Every school is scored against the transfer applicant pool you would actually compete with there.";

const ASSETS = ["styles.css", "app.js", "model.js", "data.js", "majors.js", "aliases.js", "links.js", "deadlines.js", "share.js", "program-model.js", "programs.js", "fit.js", "cost-model.js", "income-bands.js", "entitlement.js", "assist.js", "transfer-policy.js"];
const SITE_FILES = ["icon.svg", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "og.png", "fonts.css", "legal.css"];

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const body = readFileSync(join(here, "index.html"), "utf8")
  /* The <title> and stylesheet links move into the real <head>. */
  .replace(/^<title>[\s\S]*?<\/title>\s*/m, "")
  .replace(/^<link [^>]*>\s*/gm, "")
  .trim();

const shipped = [];
for (const f of ASSETS) { copyFileSync(join(here, f), join(dist, f)); shipped.push(f); }
/* Fonts are served from our own origin, so the page makes no third-party
   request. See fetch-fonts.mjs for why that matters. */
if (existsSync(join(site, "fonts"))) {
  mkdirSync(join(dist, "fonts"), { recursive: true });
  for (const f of readdirSync(join(site, "fonts"))) {
    copyFileSync(join(site, "fonts", f), join(dist, "fonts", f));
    shipped.push(`fonts/${f}`);
  }
}
for (const f of SITE_FILES) {
  if (existsSync(join(site, f))) { copyFileSync(join(site, f), join(dist, f)); shipped.push(f); }
  else console.warn(`  note: ${f} missing — run \`npm run images\``);
}

const version = createHash("sha256")
  .update(shipped.map((f) => readFileSync(join(dist, f))).join("") + body)
  .digest("hex").slice(0, 10);

const head = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${TITLE}</title>
<meta name="description" content="${DESC}">
<link rel="canonical" href="${SITE_URL}/">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#EDF1FC" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#080B1A" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE_URL}/">
<meta property="og:title" content="Matriculate">
<meta property="og:description" content="${DESC}">
<meta property="og:image" content="${SITE_URL}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Matriculate">
<meta name="twitter:description" content="${DESC}">
<meta name="twitter:image" content="${SITE_URL}/og.png">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="manifest" href="manifest.webmanifest">
<link rel="stylesheet" href="fonts.css">
<link rel="stylesheet" href="styles.css">
<style>[hidden]{display:none!important}img{max-width:100%}</style>
<script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Matriculate",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any",
  url: SITE_URL + "/",
  description: DESC,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
})}</script>
</head>
<body>
`;

const tail = `
<script type="module" src="app.js"></script>
<script>
/* A deploy has to reach someone who already has the site cached, and the
   previous version of this could not: it registered sw.js through the HTTP
   cache, so a ten-minute max-age meant the new worker was often never even
   discovered, and nothing reloaded the page once it was. Three things fix it —
   updateViaCache so the worker script is always revalidated, an explicit
   update() on load, and a single reload when a new worker takes over. The
   reload is guarded on there having been a controller already, so a first
   visit does not bounce. */
if ("serviceWorker" in navigator) {
  addEventListener("load", async () => {
    const had = !!navigator.serviceWorker.controller;
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!had || reloading) return;
      reloading = true;
      location.reload();
    });
    try {
      const reg = await navigator.serviceWorker.register("sw.js", { updateViaCache: "none" });
      reg.update();
    } catch {}
  });
}
</script>
</body>
</html>
`;

const pageBody = body
  .replace(/<script type="module"[\s\S]*?<\/script>/, "")
  .replace(
    '<a href="#about">About</a> · <a href="#privacy">Privacy</a> · <a href="#data">Data</a>',
    '<a href="#about">About</a> · <a href="#data">Data</a> · <a href="terms.html">Terms</a> · <a href="privacy.html">Privacy</a>');
writeFileSync(join(dist, "index.html"), head + pageBody + tail);

writeFileSync(join(dist, "manifest.webmanifest"), JSON.stringify({
  name: "Matriculate",
  short_name: "Matriculate",
  description: DESC,
  start_url: "./",
  scope: "./",
  display: "standalone",
  background_color: "#080B1A",
  theme_color: "#080B1A",
  icons: [
    { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    { src: "icon.svg", sizes: "any", type: "image/svg+xml" },
  ],
}, null, 2));

/* Network-first throughout, so a deploy is live on the next load rather than
   whenever a cache happens to be evicted. */
writeFileSync(join(dist, "sw.js"), `const CACHE = "matriculate-${version}";
/* programs.js is deliberately not precached: it is 370 KB that most visits
   never ask for, and the fetch handler caches it the first time one does. */
const ASSETS = ${JSON.stringify(["./", "index.html", ...shipped.filter((f) => f !== "programs.js"), "manifest.webmanifest"])};

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  /* Network-first for everything this build produces. It used to be cache-first
     for the modules, on the theory that they were versioned with the build —
     they are not, they are plain styles.css and app.js, so a stale cache served
     an old look indefinitely. The cache is the offline copy here, not the
     source of truth; the browser's own HTTP cache still spares most of the
     round trips. */
  e.respondWith(fetch(req).then((r) => {
    const copy = r.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
    return r;
  }).catch(() => caches.match(req).then((r) =>
    r || (req.mode === "navigate" ? caches.match("index.html") : undefined))));
});
`);

/* A single file that opens by double-clicking, with no server at all.
   ES modules refuse to load over file://, so the four modules are concatenated
   into one classic script in dependency order and the stylesheet is inlined. */
const inline = (name) => {
  const src = readFileSync(join(here, name), "utf8")
    .replace(/^import\s+[^;]*?;\s*$/gms, "")                                    // drop the import statements
    .replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, "")                             // drop re-export lists
    .replace(/^export\s+(?=(?:async\s+)?(?:const|let|var|function|class)\b)/gm, ""); // unwrap declarations
  /* A missed keyword throws at parse time inside a <script> tag, which kills
     the whole offline file silently. Catch it here, where it is a build error. */
  const left = src.match(/^\s*(?:import|export)\b.*/m);
  if (left) throw new Error(`${name}: module syntax survived inlining — ${left[0].trim()}`);

  /* Every module lands in one shared scope here, so two files declaring the
     same top-level name is a SyntaxError that kills the whole offline file at
     parse time — silently, since nothing else imports it. Caught at build time
     instead. */
  for (const m of src.matchAll(/^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)) {
    const prior = topLevelNames.get(m[1]);
    if (prior && prior !== name) {
      throw new Error(`offline build: "${m[1]}" is declared at the top level of both ${prior} and ${name}. `
        + `They share one scope once concatenated — rename one.`);
    }
    topLevelNames.set(m[1], name);
  }
  return src;
};

/* name -> the file that declared it, across everything inlined so far. */
const topLevelNames = new Map();

const inlineFonts = existsSync(join(site, "fonts.css"))
  ? readFileSync(join(site, "fonts.css"), "utf8")
      .split("/* latin-ext */").join("/* skip */")     // latin subset only, to halve the file
      .split("@font-face")
      .filter((chunk, i) => i === 0 || /-latin\.woff2/.test(chunk))
      .join("@font-face")
      .replace(/url\(fonts\/([^)]+)\)/g, (_, f) =>
        `url(data:font/woff2;base64,${readFileSync(join(site, "fonts", f)).toString("base64")})`)
  : "";

const singleFile = head
    .replace('<link rel="stylesheet" href="fonts.css">', `<style>${inlineFonts}</style>`)
    .replace('<link rel="stylesheet" href="styles.css">', `<style>${readFileSync(join(here, "styles.css"), "utf8")}</style>`)
    .replace(/<link rel="manifest"[^>]*>\n?/, "")
    .replace(/<link rel="icon"[^>]*>\n?/, "")
    .replace(/<link rel="apple-touch-icon"[^>]*>\n?/, "")
    .replace(/<title>[^<]*<\/title>/, "<title>Matriculate (offline copy)</title>")
  + body.replace(/<script type="module"[\s\S]*?<\/script>/, "")
  + `\n<script>\n(function () {\n"use strict";\n`
  + ["data.js", "majors.js", "model.js", "aliases.js", "links.js", "deadlines.js", "share.js", "income-bands.js", "entitlement.js", "cost-model.js", "assist.js", "transfer-policy.js", "programs.js"].map(inline).join("\n")
  /* There is no second file to fetch here, so the program tables are handed to
     the loader directly instead of being imported. */
  + `\nglobalThis.__PROGRAM_DATA__ = { CIP_ROWS, STATE_ROWS, PROGRAM_ROWS, NATIONAL_AWARDS, MAJOR_CIP };\n`
  + ["program-model.js", "fit.js", "app.js"].map(inline).join("\n")
  + `\n})();\n</script>\n</body>\n</html>\n`;

writeFileSync(join(dist, "matriculate-offline.html"), singleFile);

/* Terms and privacy also exist as their own URLs, for crawlers and for anyone
   linking to them directly. They are extracted from the in-app legal pane, so
   there is one copy of the text and the two cannot drift apart. */
const legalHead = (title, desc, path) => head
  .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
  .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${desc}">`)
  .replace(`<link rel="canonical" href="${SITE_URL}/">`, `<link rel="canonical" href="${SITE_URL}/${path}">`)
  .replace("<style>[hidden]", '<link rel="stylesheet" href="legal.css">\n<style>[hidden]');

const legalDoc = (id) => {
  const open = body.indexOf(`<article class="legaldoc" id="${id}"`);
  if (open < 0) return null;
  const close = body.indexOf("</article>", open) + "</article>".length;
  return body.slice(open, close);
};

for (const [file, id, title, desc] of [
  ["terms.html", "terms", "Terms of use — Matriculate", "What Matriculate is, what it is not, and the terms it is offered under."],
  ["privacy.html", "privacy", "Privacy — Matriculate", "Matriculate collects nothing. Your record stays in your own browser."],
  ["notices.html", "notices", "Notices — Matriculate", "Licences, data sources and attributions for Matriculate."],
]) {
  const doc = legalDoc(id);
  if (!doc) { console.warn(`  note: no #${id} article in index.html`); continue; }
  writeFileSync(join(dist, file), legalHead(title, desc, file) + `<div class="aurora" aria-hidden="true"><b></b><b></b><b></b></div>
<header class="topbar glass">
  <div class="brand">
    <span class="mark" aria-hidden="true">M</span>
    <div><span class="brandname">Matriculate</span><p class="counts">${title.split(" — ")[0]}</p></div>
  </div>
</header>
<div class="doc"><div class="glass">
  <a class="back" href="./">&larr; Back to the calculator</a>
  ${doc.replace(/<h3>/, "<h1>").replace(/<\/h3>/, "</h1>").replace(/<h4>/g, "<h2>").replace(/<\/h4>/g, "</h2>")}
</div></div>
<footer class="siteft">
  <span>Matriculate — a planning tool, not a prediction.</span>
  <span><a href="./">Calculator</a> · <a href="terms.html">Terms</a> · <a href="privacy.html">Privacy</a> · <a href="notices.html">Notices</a></span>
</footer>
</body>
</html>
`);
}

writeFileSync(join(dist, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

/* GitHub Pages serves a custom domain once a CNAME file is present at the site
   root. Only written when SITE_URL actually names one — the default *.github.io
   fallback needs no such file, and writing one for it would point Pages at a
   domain it does not own. */
const siteHost = new URL(SITE_URL).hostname;
if (!/\.github\.io$/.test(siteHost)) {
  writeFileSync(join(dist, "CNAME"), siteHost + "\n");
  console.log(`  CNAME -> ${siteHost}`);
}
writeFileSync(join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod><changefreq>monthly</changefreq><priority>1.0</priority></url>
  <url><loc>${SITE_URL}/terms.html</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>${SITE_URL}/privacy.html</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>${SITE_URL}/notices.html</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod><changefreq>yearly</changefreq><priority>0.2</priority></url>
</urlset>
`);
writeFileSync(join(dist, "404.html"), head + `<div class="aurora" aria-hidden="true"><b></b><b></b><b></b></div>
<div class="shell" style="grid-template-columns:1fr;place-items:center;min-height:70vh">
  <div class="glass" style="padding:40px;text-align:center;max-width:44ch">
    <h1 style="font-family:var(--display);font-size:28px;margin-bottom:8px">Nothing here</h1>
    <p style="color:var(--ink-2);margin:0 0 20px">That page does not exist. The calculator is one page.</p>
    <a class="btn primary" href="./" style="display:inline-block;text-decoration:none">Open Matriculate</a>
  </div>
</div>
</body></html>`);
writeFileSync(join(dist, ".nojekyll"), "");

console.log(`built dist/ — ${SITE_URL} — cache ${version}`);
console.log(`  ${["index.html", "matriculate-offline.html", "manifest.webmanifest", "sw.js", "robots.txt", "sitemap.xml", "404.html", ...shipped].join(", ")}`);
