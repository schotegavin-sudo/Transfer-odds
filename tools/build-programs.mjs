/* Build programs.js from the College Scorecard field-of-study file.
 *
 *   node tools/build-programs.mjs path/to/Most-Recent-Cohorts-Field-of-Study.csv
 *
 * The Scorecard reports, for every institution and every CIP 4-digit field, the
 * number of bachelor's degrees awarded and — where the cohort is large enough
 * to publish without identifying anyone — the median earnings of graduates one
 * and two years out and the median debt they finished with. Earnings come from
 * federal tax records, so they are measured, not surveyed.
 *
 * Two things this file deliberately does not do:
 *   - it invents no quality score. Every number here is reported by the school
 *     to the Department of Education or computed from tax data.
 *   - it drops nothing to make a school look better. A program with no
 *     published earnings is carried with its award count and a blank, and the
 *     app says the figure is suppressed rather than guessing at one.
 *
 * Public domain (17 U.S.C. § 105). https://collegescorecard.ed.gov/data/
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..");
const csvPath = process.argv[2];
const hdPath = process.argv[4];
if (!csvPath) {
  console.error("usage: node tools/build-programs.mjs <field-of-study.csv> [release] [HD<year>.csv]");
  console.error("  the third argument is the IPEDS directory file, which supplies each");
  console.error("  institution's state so per-state pay baselines can be computed.");
  process.exit(1);
}

/* ---------------------------------------------------------------- inputs */

const cipMap = JSON.parse(readFileSync(join(here, "cip-map.json"), "utf8"));
delete cipMap._comment;

/* Fields that only decide whether a school runs a major, never what the major's
   numbers are. Kept apart from cipMap for exactly that reason: pooling sport
   management into 3105 would blend its earnings with kinesiology's. */
const cipAlso = JSON.parse(readFileSync(join(here, "cip-equivalents.json"), "utf8"));
for (const k of Object.keys(cipAlso)) if (k.startsWith("_")) delete cipAlso[k];

const WANTED = new Set([...Object.values(cipMap).flat(), ...Object.values(cipAlso).flat()]);

const linkSrc = readFileSync(join(repo, "links.js"), "utf8");
const UNITS = new Map();   // unitid -> school name
for (const line of linkSrc.match(/export const LINK_ROWS = `\n([\s\S]*?)\n`/)[1].trim().split("\n")) {
  const [name, unitid] = line.split("|");
  if (unitid && unitid.trim()) UNITS.set(unitid.trim(), name.trim());
}

/* Institution states, for the per-state baselines. Without this file the
   national baselines are still built and the state ones are simply absent. */
const STATE_OF = new Map();
if (hdPath) {
  const hd = readFileSync(hdPath, "latin1");
  const lines = hd.split("\n");
  /* IPEDS ships latin-1 with a UTF-8 byte-order mark, so the three BOM bytes
     arrive as three separate characters rather than one \uFEFF. */
  const head = lines[0].replace(/^(?:\uFEFF|\u00EF\u00BB\u00BF)/, "")
    .split(",").map((h) => h.replace(/"/g, "").trim().toUpperCase());
  const iU = head.indexOf("UNITID"), iS = head.indexOf("STABBR");
  if (iU < 0 || iS < 0) throw new Error("HD file has no UNITID/STABBR column");
  for (const line of lines.slice(1)) {
    const cells = line.split(",");
    if (cells.length <= Math.max(iU, iS)) continue;
    const u = cells[iU].replace(/"/g, "").trim();
    const st = cells[iS].replace(/"/g, "").trim();
    if (u && st) STATE_OF.set(u, st);
  }
}

/* ------------------------------------------------------------- csv parse */

/* The file is quoted RFC 4180 with commas inside the program titles. */
function* rows(text) {
  let field = "", row = [], quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); yield row; row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); yield row; }
}

const num = (v) => (/^\d+(\.\d+)?$/.test(v) ? Number(v) : null);

const text = readFileSync(csvPath, "utf8");
const it = rows(text);
const header = it.next().value.map((h) => h.replace(/^﻿/, ""));
const col = Object.fromEntries(header.map((h, i) => [h, i]));
for (const need of ["UNITID", "CIPCODE", "CIPDESC", "CREDLEV", "IPEDSCOUNT1",
                    "EARN_MDN_HI_1YR", "EARN_MDN_HI_2YR", "DEBT_ALL_STGP_EVAL_MDN"]) {
  if (col[need] === undefined) throw new Error(`column ${need} missing — the Scorecard layout changed`);
}

/* --------------------------------------------------------------- gather */

const fieldName = new Map();          // cip -> federal title
const national = new Map();           // cip -> { awards, earners: [{earn, n}] }
const byState = new Map();            // cip -> state -> [{earn, n}]
const mine = new Map();               // unitid -> [{ cip, n, earn1, earn2, debt }]
const schoolTotal = new Map();        // unitid -> bachelor's awards across every field
let nationalTotal = 0;                // the same, for every institution in the file
let scanned = 0;

for (const r of it) {
  if (r.length < header.length) continue;
  if (r[col.CREDLEV] !== "3") continue;        // bachelor's degree only
  scanned++;
  const cip = r[col.CIPCODE];
  /* Counted before the filter: the denominator is the whole campus, not the
     part of it our majors table happens to cover. */
  const awards = num(r[col.IPEDSCOUNT1]) || 0;
  nationalTotal += awards;
  if (UNITS.has(r[col.UNITID])) schoolTotal.set(r[col.UNITID], (schoolTotal.get(r[col.UNITID]) || 0) + awards);
  if (!WANTED.has(cip)) continue;
  fieldName.set(cip, r[col.CIPDESC].trim().replace(/\.$/, ""));

  const n = awards;
  const earn1 = num(r[col.EARN_MDN_HI_1YR]);
  const earn2 = num(r[col.EARN_MDN_HI_2YR]);
  const debt = num(r[col.DEBT_ALL_STGP_EVAL_MDN]);

  const nat = national.get(cip) || { awards: 0, earners: [] };
  nat.awards += n;
  if (earn1 !== null && n > 0) nat.earners.push({ earn: earn1, n });
  national.set(cip, nat);

  const st = STATE_OF.get(r[col.UNITID]);
  if (st && earn1 !== null && n > 0) {
    const states = byState.get(cip) || new Map();
    states.set(st, [...(states.get(st) || []), { earn: earn1, n }]);
    byState.set(cip, states);
  }

  if (!UNITS.has(r[col.UNITID])) continue;
  /* Two or three completers a year is a concentration, not a program, and its
     median earnings are one or two people's salaries. */
  if (n < 4 && earn1 === null) continue;
  const list = mine.get(r[col.UNITID]) || [];
  list.push({ cip, n, earn1, earn2, debt });
  mine.set(r[col.UNITID], list);
}

/* The national reference is the award-weighted median of the school-level
   medians: the earnings of the middle graduate of a typical program in the
   field, which is what a school's own figure should be read against. */
function weightedMedian(points) {
  if (!points.length) return null;
  const sorted = [...points].sort((a, b) => a.earn - b.earn);
  const half = sorted.reduce((t, p) => t + p.n, 0) / 2;
  let run = 0;
  for (const p of sorted) { run += p.n; if (run >= half) return p.earn; }
  return sorted[sorted.length - 1].earn;
}

/* ---------------------------------------------------------------- encode */

const h = (v) => (v === null ? "" : Math.round(v / 100));   // dollars -> hundreds

/* A state baseline is only worth publishing where enough programs stand behind
   it. Below that the "typical graduate of this field in this state" is one or
   two campuses, and comparing a school to itself proves nothing. */
const MIN_STATE_PROGRAMS = 4;
const stateRows = [...fieldName.keys()].sort().map((cip) => {
  const states = byState.get(cip);
  if (!states) return null;
  const parts = [...states.entries()]
    .filter(([, pts]) => pts.length >= MIN_STATE_PROGRAMS)
    .sort()
    .map(([st, pts]) => `${st},${h(weightedMedian(pts))},${pts.length}`);
  return parts.length ? `${cip}:${parts.join(";")}` : null;
}).filter(Boolean);

const fieldRows = [...fieldName.keys()].sort().map((cip) => {
  const nat = national.get(cip);
  return [cip, fieldName.get(cip), nat.awards, h(weightedMedian(nat.earners)), nat.earners.length].join("|");
});

const programRows = [...mine.keys()].sort().map((unitid) => {
  const progs = mine.get(unitid)
    .sort((a, b) => b.n - a.n)
    .map((p) => [p.cip, p.n, h(p.earn1), h(p.earn2), h(p.debt)].join(",").replace(/,+$/, ""));
  return `${unitid},${schoolTotal.get(unitid) || 0}:${progs.join(";")}`;
});

const release = process.argv[3] || (csvPath.match(/_(\d{8})/) || [, "unknown"])[1];
const out = `/* Program scale and outcomes, by school and field of study.
 *
 * Generated by tools/build-programs.mjs from the U.S. Department of Education
 * College Scorecard field-of-study file, release ${release}. Public domain.
 * Do not edit by hand — regenerate instead.
 *
 * MAJOR_CIP_ALSO  extra fields that count only toward "does this school run
 *             this major", never toward its figures. See tools/cip-equivalents.json.
 *
 * CIP_ROWS    cip | federal field title | bachelor's awards nationally |
 *             national median earnings one year out, in hundreds of dollars |
 *             number of programs that median is drawn from
 *
 * STATE_ROWS  cip : state,median earnings in hundreds,programs behind it ; ...
 *             Only states with at least ${MIN_STATE_PROGRAMS} programs in the field appear. Earnings
 *             are nominal, so a state baseline is the fair thing to read a
 *             school against when the field's pay is set regionally.
 *
 * PROGRAM_ROWS  unitid , the school's bachelor's awards in every field
 *             : cip,awards,earn1yr,earn2yr,debt ; cip,...
 *             All three money figures are in hundreds of dollars and any of
 *             them may be empty, which means the Department suppressed it
 *             because the cohort was too small to publish. Trailing empties
 *             are dropped. Awards are a one-year count.
 */

export const NATIONAL_AWARDS = ${nationalTotal};

/* Which federal field each of our majors falls in. Kept beside the data it
   indexes so the two cannot drift apart. Source: tools/cip-map.json. */
export const MAJOR_CIP_ALSO = ${JSON.stringify(
  Object.fromEntries(Object.entries(cipAlso).map(([k, v]) => [k, v.filter((c) => fieldName.has(c))]).filter(([, v]) => v.length)),
  null, 0).replace(/","/g, '", "').replace(/\],"/g, '],\n  "').replace(/^\{/, "{\n  ").replace(/\}$/, ",\n}")};

export const MAJOR_CIP = ${JSON.stringify(
  Object.fromEntries(Object.entries(cipMap).map(([k, v]) => [k, v.filter((c) => fieldName.has(c))])),
  null, 0).replace(/","/g, '", "').replace(/\],"/g, '],\n  "').replace(/^\{/, "{\n  ").replace(/\}$/, ",\n}").replace(/,\n\}$/, ",\n}")};

export const CIP_ROWS = \`
${fieldRows.join("\n")}
\`.trim();

export const STATE_ROWS = \`
${stateRows.join("\n")}
\`.trim();

export const PROGRAM_ROWS = \`
${programRows.join("\n")}
\`.trim();
`;

writeFileSync(join(repo, "programs.js"), out);

const progCount = [...mine.values()].reduce((t, l) => t + l.length, 0);
const withEarn = [...mine.values()].flat().filter((p) => p.earn1 !== null).length;
console.log(`scanned ${scanned.toLocaleString()} bachelor rows`);
console.log(`${fieldRows.length} federal fields, ${mine.size} schools, ${progCount.toLocaleString()} programs`);
console.log(`  ${withEarn.toLocaleString()} carry published earnings (${Math.round((withEarn / progCount) * 100)}%)`);
console.log(`${stateRows.length} fields carry state baselines${hdPath ? "" : " (no directory file given — skipped)"}`);
console.log(`programs.js — ${(out.length / 1024).toFixed(0)} KB`);
