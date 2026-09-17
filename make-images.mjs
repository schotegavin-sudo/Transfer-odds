/* Renders the PNG icons and the social card from SVG/HTML, using the Chromium
 * that Playwright provides. The output is committed, so this only needs to run
 * when the mark or the card design changes.
 *
 *   npm i -D playwright && npm run images
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, "site");

let chromium;
try { ({ chromium } = await import("playwright")); }
catch { console.error("playwright is not installed: npm i -D playwright"); process.exit(1); }

const icon = readFileSync(join(site, "icon.svg"), "utf8");
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--no-sandbox"] });

async function shoot({ html, width, height, out, scale = 1 }) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  await page.setContent(html, { waitUntil: "load" });
  await page.waitForTimeout(350);
  await page.screenshot({ path: join(site, out), omitBackground: false });
  await page.close();
  console.log("  " + out);
}

const iconPage = (px) => `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;width:${px}px;height:${px}px;overflow:hidden}svg{width:${px}px;height:${px}px;display:block}</style>${icon}`;

for (const [px, out] of [[192, "icon-192.png"], [512, "icon-512.png"], [180, "apple-touch-icon.png"]]) {
  await shoot({ html: iconPage(px), width: px, height: px, out });
}

/* The social card: the same aurora, glass and clay the app is built from. */
await shoot({
  width: 1200, height: 630, out: "og.png",
  html: `<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Plus+Jakarta+Sans:wght@500;600;700&family=JetBrains+Mono:wght@500&display=swap">
<style>
  html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#080B1A;font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:#EEF2FF}
  .bg{position:absolute;inset:-120px;filter:blur(90px)}
  .bg b{position:absolute;display:block;width:760px;height:760px;border-radius:50%;opacity:.72}
  .b1{background:radial-gradient(circle,#4F46E5,transparent 66%);top:-180px;left:-120px}
  .b2{background:radial-gradient(circle,#0891B2,transparent 66%);bottom:-300px;right:-140px}
  .b3{background:radial-gradient(circle,#9333EA,transparent 68%);top:-80px;left:520px;opacity:.5}
  .card{position:absolute;inset:56px;border-radius:40px;background:rgba(30,39,78,.55);border:1px solid rgba(160,180,255,.26);
        box-shadow:0 40px 90px -30px rgba(0,0,0,.8);display:grid;grid-template-columns:330px 1fr;align-items:center;gap:46px;padding:0 56px}
  .dial{position:relative;width:250px;height:250px;justify-self:center}
  .dial svg{width:100%;height:100%;transform:rotate(-90deg)}
  .face{position:absolute;inset:44px;border-radius:50%;background:linear-gradient(160deg,#232C55,#1A2145);
        box-shadow:0 16px 30px -12px rgba(0,0,0,.65), inset 0 -5px 10px rgba(0,0,0,.45), inset 0 6px 12px rgba(150,170,255,.22);
        display:grid;place-content:center;text-align:center}
  .face .n{font-family:Poppins,sans-serif;font-weight:700;font-size:52px;letter-spacing:-.04em;line-height:1}
  .face .l{font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#8891BC;margin-top:6px}
  h1{font-family:Poppins,sans-serif;font-weight:700;font-size:62px;line-height:1.02;letter-spacing:-.035em;margin:0 0 16px}
  p{font-size:23px;line-height:1.42;color:#AFBAE2;margin:0;max-width:26ch}
  .tag{font-family:"JetBrains Mono",monospace;font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:#8891BC;margin-bottom:14px}
</style>
<div class="bg"><b class="b1"></b><b class="b2"></b><b class="b3"></b></div>
<div class="card">
  <div class="dial">
    <svg viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(8,12,30,.6)" stroke-width="9"/>
      <circle cx="50" cy="50" r="44" fill="none" stroke="#10B981" stroke-width="9" stroke-linecap="round"
              stroke-dasharray="276.5" stroke-dashoffset="88"/>
    </svg>
    <div class="face"><div class="n">68%</div><div class="l">target</div></div>
  </div>
  <div>
    <div class="tag">588 schools · 154 majors</div>
    <h1>Transfer Odds</h1>
    <p>Your chances at each school, scored against the transfer applicants you would actually compete with.</p>
  </div>
</div>`,
});

await browser.close();
console.log("images written to transfer-odds/site/");
