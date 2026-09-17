/* Rebuilds links.js from the federal directory.
 *
 * IPEDS publishes one row per institution with its web address, admissions
 * office and application page. This downloads that directory, matches it to
 * the school table by name (never fuzzily — a link to the wrong campus is
 * worse than no link), fetches every URL to confirm it resolves, and writes
 * only the survivors.
 *
 *   node tools/refresh-links.mjs            # newest year it can find
 *   node tools/refresh-links.mjs 2024       # a specific year
 *
 * Needs `unzip` on the path. Takes about five minutes, mostly waiting on
 * several hundred university web servers.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SCHOOLS } from "../model.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const year = process.argv[2] || new Date().getFullYear() - 2;

const work = mkdtempSync(join(tmpdir(), "ipeds-"));
const zip = join(work, `HD${year}.zip`);
console.log(`downloading HD${year} …`);
const res = await fetch(`https://nces.ed.gov/ipeds/datacenter/data/HD${year}.zip`);
if (!res.ok) { console.error(`HD${year} is not published (${res.status}). Try an earlier year.`); process.exit(1); }
writeFileSync(zip, Buffer.from(await res.arrayBuffer()));
execFileSync("unzip", ["-o", "-q", zip, "-d", work]);
const csv = readFileSync(join(work, `HD${year}.csv`), "latin1");

/* IPEDS ships CSV with quoted fields and the odd embedded comma. */
function parse(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells = []; let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
      else if (c === "," && !q) { cells.push(cur); cur = ""; }
      else cur += c;
    }
    cells.push(cur);
    rows.push(cells);
  }
  const head = rows.shift().map((h) => h.replace(/^﻿/, "").toUpperCase());
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
}

const norm = (s) => s.toLowerCase()
  .replace(/&/g, " and ").replace(/[-–]/g, " ").replace(/\([^)]*\)/g, " ")
  .replace(/[^a-z0-9\s]/g, " ").replace(/\b(the|of|at|and|a)\b/g, " ")
  .replace(/\bsaint\b/g, "st").replace(/\s+/g, " ").trim();

const dir = parse(csv);
const byState = new Map();
for (const r of dir) {
  if (!byState.has(r.STABBR)) byState.set(r.STABBR, []);
  byState.get(r.STABBR).push(r);
}

const MAIN = new Set(["main campus", "campus", "seattle campus", "university park", "ann arbor",
  "twin cities", "tempe", "raleigh", "chapel hill", "columbia", "bloomington", "west lafayette",
  "knoxville", "college park", "new brunswick", "amherst", "boulder", "lincoln", "norman",
  "fayetteville", "eugene", "corvallis", "madison", "urbana champaign", "athens", "gainesville",
  "austin", "oxford", "starkville", "baton rouge", "lawrence", "manhattan", "laramie", "reno",
  "las vegas", "manoa", "orono", "durham", "burlington", "storrs", "newark", "columbus", "main"]);
const ONLINE = ["digital immersion", "online", "skysong", "global campus", "world campus", "ecampus"];

/* Hand-mapped where IPEDS names an institution differently. Each was read out
   of the directory, not guessed; see the commit that introduced them. */
const HAND = JSON.parse(readFileSync(join(root, "tools", "ipeds-overrides.json"), "utf8"));

const matches = new Map();
for (const s of SCHOOLS) {
  if (HAND[s.name]) {
    const hit = dir.find((r) => r.INSTNM === HAND[s.name]);
    if (hit) { matches.set(s.name, hit); continue; }
  }
  const cands = byState.get(s.state) || [];
  const n = norm(s.name);
  let hit = cands.find((r) => norm(r.INSTNM) === n)
    || cands.find((r) => (r.IALIAS || "").split(/[|;,]/).map(norm).includes(n));
  if (!hit) {
    const starts = cands.filter((r) => norm(r.INSTNM).startsWith(n + " "));
    const wantsOnline = s.online === 2 || /\b(online|global campus|world campus|ecampus)\b/i.test(s.name);
    const pick = starts.filter((r) => {
      const tail = norm(r.INSTNM).slice(n.length + 1);
      return wantsOnline ? ONLINE.some((o) => tail.includes(o)) : MAIN.has(tail);
    });
    if (pick.length === 1) hit = pick[0];
    else if (!pick.length && starts.length === 1) hit = starts[0];
  }
  if (hit) matches.set(s.name, hit);
}
console.log(`matched ${matches.size} of ${SCHOOLS.length} schools`);

const tidy = (u) => {
  if (!u) return "";
  u = u.trim().replace(/^"+|"+$/g, "");
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try { return new URL(u).href; } catch { return ""; }
};
async function alive(url) {
  if (!url) return "";
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 20000);
  try {
    const r = await fetch(url, { redirect: "follow", signal: c.signal, headers: { "User-Agent": UA } });
    /* 401/403/429 mean the server is there and dislikes robots, which a real
       browser will not trigger. Anything else, we drop the link. */
    return (r.status >= 200 && r.status < 400) ? (r.url || url)
      : [401, 403, 429].includes(r.status) ? url : "";
  } catch { return ""; } finally { clearTimeout(t); }
}

const queue = [...matches];
const rows = [];
let done = 0;
await Promise.all(Array.from({ length: 12 }, async () => {
  while (queue.length) {
    const [name, r] = queue.pop();
    const admissions = await alive(tidy(r.ADMINURL)) || await alive(tidy(r.WEBADDR));
    const apply = await alive(tidy(r.APPLURL));
    if (admissions || apply) rows.push(`${name}|${r.UNITID}|${admissions}|${apply}`);
    if (++done % 60 === 0) console.log(`  checked ${done}/${matches.size}`);
  }
}));
rows.sort();
console.log(`${rows.length} schools have at least one working official link`);

const head = readFileSync(join(root, "links.js"), "utf8").split("export const LINK_ROWS = `")[0];
writeFileSync(join(root, "links.js"), `${head}export const LINK_ROWS = \`\n${rows.join("\n")}\n\`.trim();\n`);
console.log("links.js rewritten — run `npm test` before committing");
