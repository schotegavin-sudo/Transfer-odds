/* Model regression tests. Run: npm test
 *
 * These exist because the first version of the scorer matched factors by
 * label, which let one input contribute two lines that disagreed with each
 * other. Every property below is something a user would notice if it broke.
 */
import { readFileSync, readdirSync } from "fs";
import { SCHOOLS, MAJORS, MAJOR_BY_ID, BY_NAME, score, levers, poolFor, majorRate, Phi, probit } from "./model.js";
import { ALIASES, acronym, searchIndex, matches, relevance } from "./aliases.js";
import { deadlineFor, daysUntil, verifyLinks, LINKS } from "./deadlines.js";
import { encodeProfile, decodeProfile } from "./share.js";
import { loadPrograms, PROGRAM_SORTS } from "./program-model.js";
import { buildSlate } from "./fit.js";
import { costFor, INCOME_BANDS, costCount } from "./cost-model.js";
import { MAJOR_CIP, MAJOR_CIP_ALSO, CIP_ROWS, PROGRAM_ROWS } from "./programs.js";
import { POLICIES, POLICY_STATES, VERIFIED, policyFor, assistLink, matchSendingCollege } from "./transfer-policy.js";
import { ASSIST_YEAR, ASSIST_RECEIVING, ASSIST_SENDING } from "./assist.js";
import { activate, deactivate, isPaid, paidRows, listLimit, FREE_LIST_LIMIT } from "./entitlement.js";

/* The paid tables are not in this bundle any more, so the tests that read them
   have to get them the way a browser does. This stands in for the entitlement
   API, serving the very files the Worker bundles, so the tests exercise the
   real activate() path — parsing, joining and all — rather than a shortcut
   around it. A bad licence gets the same 402 the Worker gives. */
const PAID_BODY = JSON.stringify({
  version: "test",
  costs: readFileSync(new URL("./worker/data/costs.txt", import.meta.url), "utf8").trim(),
  earnings: readFileSync(new URL("./worker/data/earnings.txt", import.meta.url), "utf8").trim(),
});
const GOOD_KEY = "MTRC-TEST0-TEST0-TEST0";
globalThis.localStorage ??= (() => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) };
})();
globalThis.fetch = async (url, init) => {
  const auth = (init?.headers?.authorization || "").replace(/^Bearer\s+/i, "");
  if (String(url).endsWith("/v1/data"))
    return auth === GOOD_KEY
      ? { ok: true, status: 200, json: async () => JSON.parse(PAID_BODY) }
      : { ok: false, status: 402, json: async () => ({ error: "not_entitled" }) };
  return { ok: false, status: 404, json: async () => ({}) };
};

/* Most sections describe the app as a paying reader sees it, so the licence is
   activated up front; the paywall section at the end takes it away again. */
await activate(GOOD_KEY);

let failures = 0, checks = 0;
const fail = (msg) => { failures++; console.log("  FAIL  " + msg); };
const ok = (cond, msg) => { checks++; if (!cond) fail(msg); };

const BASE = {
  gpa: 3.2, credits: 45, prereqs: "most", blemish: 0, current: "Some College",
  curtype: "cc", state: "CA", assoc: "prog", agreement: false,
  majorId: "psych", term: "fall", essay: 3, activity: 3, context: [], list: [],
};
const probeMajors = ["psych", "cs", "nursing", "english", "mecheng", "undeclared", "genstudies"];
const probeStates = ["CA", "NY", "TX", "OH"];
const sample = SCHOOLS.filter((_, i) => i % 7 === 0);           // 85 schools, every kind
const withProfile = (o) => ({ ...BASE, ...o });
const P = (s, o) => score(s, withProfile(o)).prob;

async function section(name, fn) {
  console.log("\n" + name);
  const before = failures;
  await fn();
  if (failures === before) console.log("  all clear");
}

/* 1. Nothing produces a broken number, anywhere in the table. */
await section("Every school × major × state returns a usable number", () => {
  for (const s of SCHOOLS) {
    for (const m of probeMajors) {
      const r = score(s, withProfile({ majorId: m }));
      ok(Number.isFinite(r.prob) && r.prob > 0 && r.prob <= 0.96, `${s.name} / ${m}: prob ${r.prob}`);
      ok(Number.isFinite(r.pool.mu) && r.pool.mu > 1 && r.pool.mu < 4.2, `${s.name} / ${m}: pool ${r.pool.mu}`);
      ok(Number.isFinite(r.evenOdds), `${s.name} / ${m}: even-odds GPA is not a number`);
      for (const f of r.factors) {
        ok(Number.isFinite(f.pp), `${s.name} / ${m}: "${f.label}" has a broken contribution`);
        ok(typeof f.note === "string" && !/undefined|NaN/.test(f.note), `${s.name} / ${m}: "${f.label}" note reads "${f.note}"`);
      }
    }
  }
});

/* 2. One input, one line. This is the bug that started the rewrite. */
await section("No input is counted twice in the ledger", () => {
  for (const s of sample) {
    for (const assoc of ["no", "prog", "yes"]) {
      for (const prereqs of ["all", "most", "few"]) {
        const r = score(s, withProfile({ assoc, prereqs, credits: 14, blemish: 1, term: "spring", context: ["vet", "honors"] }));
        const keys = r.factors.map((f) => f.key);
        ok(new Set(keys).size === keys.length, `${s.name}: duplicate ledger line (${keys.join(", ")})`);
        const labels = r.factors.map((f) => f.label);
        ok(new Set(labels).size === labels.length, `${s.name}: duplicate label (${labels.join(", ")})`);
      }
    }
  }
});

/* 3. A better answer never scores worse. */
const monotone = (label, values, mutate) => {
  for (const s of sample) {
    for (const m of ["psych", "cs", "nursing"]) {
      let prev = -1, prevV = null;
      for (const v of values) {
        const p = P(s, { ...mutate(v), majorId: m });
        ok(p >= prev - 1e-9, `${label}: ${s.name} / ${m} — "${v}" gives ${(p * 100).toFixed(1)}% but "${prevV}" gave ${(prev * 100).toFixed(1)}%`);
        prev = p; prevV = v;
      }
    }
  }
};

await section("Better inputs never lower the number", () => {
  monotone("associate degree", ["no", "prog", "yes"], (v) => ({ assoc: v }));
  monotone("prerequisites", ["few", "most", "all"], (v) => ({ prereqs: v }));
  monotone("GPA", [2.0, 2.5, 3.0, 3.4, 3.8, 4.0], (v) => ({ gpa: v }));
  monotone("hours", [6, 18, 30, 45, 60], (v) => ({ credits: v }));
  monotone("essays", [1, 2, 3, 4, 5], (v) => ({ essay: v }));
  monotone("activities", [1, 2, 3, 4, 5], (v) => ({ activity: v }));
  monotone("clean record", [3, 2, 1, 0], (v) => ({ blemish: v }));
  monotone("term", ["spring", "fall"], (v) => ({ term: v }));
  monotone("signed agreement", [false, true], (v) => ({ agreement: v }));
});

/* 4. Fields only fire where they apply. */
await section("Fields apply only where they are real", () => {
  for (const s of sample) {
    const priv = s.control !== "pub";
    const pathwaySchool = s.tags.includes("artic") || s.tags.includes("catag");
    const a = P(s, { state: s.state }), b = P(s, { state: s.state === "NY" ? "CA" : "NY" });
    const residencyLines = score(s, withProfile({ state: "NY" })).factors.filter((f) => f.key === "residency");
    if (priv) {
      ok(residencyLines.length === 0, `${s.name} is private but charges a residency line`);
      /* A private in a state articulation network may still move on residency,
         because the transfer-degree pathway itself is a residency pathway. */
      if (!pathwaySchool) ok(Math.abs(a - b) < 1e-9, `${s.name} is private and outside any pathway, but residency moved the number`);
    } else {
      ok(a >= b - 1e-9, `${s.name}: out-of-state scored above in-state`);
    }

    const pathway = s.tags.includes("artic") || s.tags.includes("catag");
    const signed = P(s, { state: s.state, agreement: true }), unsigned = P(s, { state: s.state, agreement: false });
    if (!pathway) ok(Math.abs(signed - unsigned) < 1e-9, `${s.name} has no articulation network but an agreement moved the number`);
    else ok(signed >= unsigned - 1e-9, `${s.name}: signing an agreement lowered the number`);

    if (s.tags.includes("open")) {
      ok(P(s, { gpa: 2.6 }) > 0.8, `${s.name} is open admission but scored ${(P(s, { gpa: 2.6 }) * 100).toFixed(0)}% at a 2.6`);
      ok(Math.abs(P(s, { majorId: "cs" }) - P(s, { majorId: "english" })) < 1e-9, `${s.name} is open admission but the major moved the number`);
    }
    if (s.tags.includes("nospr")) ok(P(s, { term: "spring" }) <= 0.01, `${s.name} takes no spring transfers but scored one`);
  }
});

/* 5. A tighter major is never easier than a loose one at the same school. */
await section("Competitive majors are harder than open ones", () => {
  for (const s of sample) {
    if (s.tags.includes("open")) continue;
    const easy = P(s, { majorId: "genstudies" }), hard = P(s, { majorId: "nursing" }), cs = P(s, { majorId: "cs" });
    ok(easy >= hard - 1e-9, `${s.name}: nursing scored above general studies`);
    ok(easy >= cs - 1e-9, `${s.name}: computer science scored above general studies`);
    ok(majorRate(s, MAJOR_BY_ID.get("nursing")) <= s.rate / 100, `${s.name}: nursing admits above the university rate`);
  }
});

/* 6. Selectivity still orders the world. */
await section("A harder school is harder", () => {
  for (const m of probeMajors) {
    const ranked = [...sample].sort((a, b) => a.rate - b.rate).map((s) => ({ s, p: P(s, { majorId: m }) }));
    const open = ranked.filter((x) => !x.s.tags.includes("open"));
    const worst = open[0], best = open[open.length - 1];
    ok(worst.p <= best.p, `${m}: ${worst.s.name} (${worst.s.rate}%) outscored ${best.s.name} (${best.s.rate}%)`);
  }
});

/* 7. The pool reconstruction keeps its own arithmetic. */
await section("The reconstructed pool is consistent", () => {
  for (const s of SCHOOLS) {
    const pool = poolFor(s, null);
    ok(pool.mu <= s.gpa + 1e-9, `${s.name}: pool average ${pool.mu.toFixed(2)} sits above its admitted average ${s.gpa.toFixed(2)}`);
    ok(pool.mu >= 1.9, `${s.name}: pool average collapsed to ${pool.mu.toFixed(2)}`);
  }
  /* An applicant who IS the typical applicant should land near the admit rate. */
  for (const s of sample) {
    if (s.tags.includes("open")) continue;
    const pool = poolFor(s, MAJOR_BY_ID.get("psych"));
    const r = score(s, withProfile({ gpa: Number(pool.mu.toFixed(2)), state: s.state, credits: 45 }));
    const expected = r.cutPercentile;            /* 1 - major admit rate */
    ok(r.prob < 1 - expected + 0.28, `${s.name}: the average applicant scores ${(r.prob * 100).toFixed(0)}% against a ${((1 - expected) * 100).toFixed(0)}% admit rate`);
  }
});

/* 8. The advice never contradicts the number. */
await section("Levers are real gains", () => {
  for (const s of sample) {
    for (const prof of [{ gpa: 2.9, prereqs: "few", assoc: "no" }, { gpa: 3.7, prereqs: "all", assoc: "yes" }]) {
      const p = withProfile(prof);
      const now = score(s, p).prob;
      for (const l of levers(s, p)) {
        ok(l.gain > 0, `${s.name}: "${l.label}" is offered as advice but gains ${(l.gain * 100).toFixed(1)} points`);
        ok(now + l.gain <= 0.9601, `${s.name}: "${l.label}" pushes past the ceiling`);
      }
    }
  }
});

/* 9. The normal-distribution helpers are actually correct. */
await section("Normal math", () => {
  const cases = [[0, 0.5], [1, 0.841345], [-1, 0.158655], [1.959964, 0.975], [2.5, 0.993790], [-3, 0.001350]];
  for (const [z, want] of cases) ok(Math.abs(Phi(z) - want) < 1e-5, `Phi(${z}) = ${Phi(z)}, expected ${want}`);
  for (const q of [0.001, 0.01, 0.25, 0.5, 0.75, 0.99, 0.999]) {
    ok(Math.abs(Phi(probit(q)) - q) < 1e-6, `probit/Phi round trip broke at ${q}`);
  }
});

/* 10. Every major and school row parses into something usable. */
await section("Reference tables", () => {
  ok(SCHOOLS.length > 500, `only ${SCHOOLS.length} schools loaded`);
  ok(MAJORS.length > 150, `only ${MAJORS.length} majors loaded`);
  const names = new Set();
  for (const s of SCHOOLS) {
    ok(!names.has(s.name), `duplicate school row: ${s.name}`);
    names.add(s.name);
    ok(s.rate > 0 && s.rate <= 100, `${s.name}: admit rate ${s.rate}`);
    ok(s.gpa >= 2.0 && s.gpa <= 4.0, `${s.name}: admitted GPA ${s.gpa}`);
    ok(s.maxCr >= 30 && s.maxCr <= 150, `${s.name}: credit cap ${s.maxCr}`);
  }
  const ids = new Set();
  for (const m of MAJORS) {
    ok(!ids.has(m.id), `duplicate major id: ${m.id}`);
    ids.add(m.id);
    ok(m.mult > 0.2 && m.mult < 1.4, `${m.name}: multiplier ${m.mult}`);
    ok(Math.abs(m.shift) <= 0.3, `${m.name}: pool shift ${m.shift}`);
  }
});


/* 11. Nonsense and extremes do not produce nonsense. */
await section("Edge cases", () => {
  const weird = [
    { label: "major not in the table", o: { majorId: "underwater basket weaving" } },
    { label: "empty major", o: { majorId: "" } },
    { label: "zero GPA", o: { gpa: 0 } },
    { label: "4.3 GPA", o: { gpa: 4.3 } },
    { label: "no hours", o: { credits: 0 } },
    { label: "200 hours", o: { credits: 200 } },
    { label: "every context flag", o: { context: Object.keys({ vet: 1, firstgen: 1, honors: 1, work: 1, athlete: 1, legacy: 1, intl: 1 }) } },
    { label: "unknown context flag", o: { context: ["not-a-real-flag"] } },
    { label: "worst case", o: { gpa: 0.4, credits: 3, prereqs: "few", blemish: 3, assoc: "no", term: "spring", essay: 1, activity: 1, context: ["intl"] } },
    { label: "best case", o: { gpa: 4.0, credits: 60, prereqs: "all", blemish: 0, assoc: "yes", agreement: true, essay: 5, activity: 5, context: ["vet", "honors", "work"] } },
  ];
  for (const s of sample) {
    for (const { label, o } of weird) {
      const r = score(s, withProfile(o));
      ok(Number.isFinite(r.prob) && r.prob >= 0.004 && r.prob <= 0.96, `${label} at ${s.name}: ${r.prob}`);
      ok(r.factors.every((f) => Number.isFinite(f.pp)), `${label} at ${s.name}: broken ledger`);
    }
    const worst = score(s, withProfile(weird[8].o)).prob;
    const best = score(s, withProfile(weird[9].o)).prob;
    ok(best >= worst, `${s.name}: the worst possible record outscored the best`);
  }
});

/* 12. Search: every nickname points at a school that exists, and finds it. */
await section("Search aliases", () => {
  const names = new Set(SCHOOLS.map((s) => s.name));
  const index = new Map(SCHOOLS.map((s) => [s.name, searchIndex(s)]));

  for (const [alias, target] of Object.entries(ALIASES)) {
    ok(names.has(target), `alias "${alias}" points at "${target}", which is not in the table`);
    if (!names.has(target)) continue;
    const school = SCHOOLS.find((s) => s.name === target);
    ok(matches(index.get(target), alias), `"${alias}" does not match ${target}`);
    /* And it must come first: nobody typing "cal" wants Caltech. */
    const ranked = SCHOOLS.filter((s) => matches(index.get(s.name), alias))
      .sort((a, b) => relevance(a, index.get(a.name), alias) - relevance(b, index.get(b.name), alias));
    ok(ranked[0]?.name === target, `"${alias}" ranks ${ranked[0]?.name} above ${target}`);
    ok(relevance(school, index.get(target), alias) === 0, `"${alias}" is not scored as an exact nickname`);
  }

  for (const [name, want] of [
    ["University of California, Los Angeles", "UCLA"],
    ["California State University, Northridge", "CSUN"],
    ["New York University", "NYU"],
    ["Massachusetts Institute of Technology", "MIT"],
  ]) ok(acronym(name) === want, `acronym("${name}") = ${acronym(name)}, expected ${want}`);

  /* Multi-word searches, in any order. */
  for (const [q, target] of [
    ["michigan ann arbor", "University of Michigan, Ann Arbor"],
    ["cal state northridge", "California State University, Northridge"],
    ["austin texas", "University of Texas at Austin"],
    ["santa cruz", "University of California, Santa Cruz"],
  ]) {
    const hit = SCHOOLS.filter((s) => matches(index.get(s.name), q));
    ok(hit.some((s) => s.name === target), `"${q}" does not find ${target}`);
  }
});

/* 13. Deadlines: precise only where a date is genuinely published. */
await section("Deadlines", () => {
  const CA_SYSTEM = /^(University of California, |California State University|California State Polytechnic|California Polytechnic|San Diego State|San Jose State|San Francisco State|Sonoma State|California Maritime)/;
  for (const s of SCHOOLS) {
    for (const term of ["fall", "spring"]) {
      const d = deadlineFor(s, term);
      ok(["verified", "typical", "rolling", "none"].includes(d.kind), `${s.name}: unknown deadline kind ${d.kind}`);
      ok(typeof d.label === "string" && d.label.length > 0, `${s.name}: empty deadline label`);
      if (d.kind === "verified") {
        ok(CA_SYSTEM.test(s.name), `${s.name} claims a verified deadline but is outside the CA systems`);
        ok(/^\d{2}-\d{2}$/.test(d.date), `${s.name}: malformed date ${d.date}`);
        const { days, when } = daysUntil(d.date);
        ok(days >= 0 && days <= 366, `${s.name}: countdown of ${days} days`);
        ok(when instanceof Date && !isNaN(when), `${s.name}: broken date object`);
      } else {
        ok(!d.date, `${s.name}: a ${d.kind} deadline must not carry a date`);
      }
      /* A period must never read as a day. */
      if (d.kind === "typical") ok(/^Typically/.test(d.short), `${s.name}: "${d.short}" reads like a fixed date`);
    }
  }
  /* Rollover: a date already past this year counts to next year, not backwards. */
  const jan = daysUntil("01-15", new Date(2026, 5, 1));
  ok(jan.days > 180 && jan.when.getFullYear() === 2027, `rollover broke: ${jan.days} days to ${jan.when}`);
  const soon = daysUntil("06-10", new Date(2026, 5, 1));
  ok(soon.days === 9, `expected 9 days, got ${soon.days}`);
  ok(daysUntil("06-01", new Date(2026, 5, 1)).days === 0, "today should count as 0 days");
});

/* 14. Source links are official, and no link is ever guessed. */
await section("Source links", () => {
  const names = new Set(SCHOOLS.map((s) => s.name));
  ok(LINKS.size > 500, `only ${LINKS.size} schools carry an official link`);

  for (const [name, l] of LINKS) {
    ok(names.has(name), `links.js has "${name}", which is not in the school table`);
    ok(/^\d{6}$/.test(l.id), `${name}: "${l.id}" is not an IPEDS unit id`);
    for (const [label, url] of [["admissions", l.admissions], ["apply", l.apply]]) {
      if (!url) continue;
      ok(url.startsWith("https://") || url.startsWith("http://"), `${name}: ${label} is not a URL`);
      ok(!/undefined|NaN|example\.com/.test(url), `${name}: ${label} looks broken — ${url}`);
    }
  }

  for (const s of SCHOOLS) {
    const links = verifyLinks(s);
    ok(links.length >= 1 && links.length <= 3, `${s.name}: ${links.length} links`);
    for (const l of links) {
      ok(l.href.startsWith("https://"), `${s.name}: ${l.label} is not https — ${l.href}`);
      ok(l.label && l.note, `${s.name}: a link is missing its label or note`);
      /* The whole point of this change: no third-party search engines. */
      ok(!/duckduckgo|google\.com\/search|bing\.com/.test(l.href), `${s.name}: ${l.label} still goes to a search engine`);
    }
    const federal = links.filter((l) => l.href.includes("nces.ed.gov"));
    ok(federal.length === 1, `${s.name}: expected exactly one federal link, got ${federal.length}`);
    /* A school with a verified address never falls back to the search page. */
    if (LINKS.has(s.name)) {
      ok(links.some((l) => l.label === "Admissions office" || l.label === "Apply"),
        `${s.name} has an official link but none is offered`);
      ok(!links.some((l) => l.href.includes("collegenavigator/?q=")),
        `${s.name} has an official link but still falls back to search`);
    }
  }
});

/* 15. A record survives the round trip into a link and back. */
await section("Share links", async () => {
  const cases = [
    ["the example record", withProfile({ list: SCHOOLS.slice(0, 8).map((s) => s.name) })],
    ["everything set", withProfile({ gpa: 3.97, credits: 71, prereqs: "all", blemish: 2, assoc: "yes",
      agreement: true, majorId: "nursing", term: "spring", essay: 5, activity: 4,
      context: ["vet", "honors", "work"], current: "Hé Côllege & Co.", list: SCHOOLS.slice(0, 25).map((s) => s.name) })],
    ["nothing set", { gpa: 0, credits: 0, prereqs: "few", blemish: 0, curtype: "cc", state: "CA",
      assoc: "no", agreement: false, majorId: "", term: "fall", essay: 1, activity: 1, context: [], list: [] }],
  ];

  for (const [label, p] of cases) {
    const code = await encodeProfile(p);
    const back = await decodeProfile(code);
    ok(back !== null, `${label}: did not decode`);
    if (!back) continue;
    for (const key of ["gpa", "credits", "prereqs", "blemish", "curtype", "state", "assoc", "agreement", "majorId", "term", "essay", "activity"]) {
      ok(JSON.stringify(back[key]) === JSON.stringify(p[key]), `${label}: ${key} came back as ${JSON.stringify(back[key])}, sent ${JSON.stringify(p[key])}`);
    }
    ok(JSON.stringify(back.list) === JSON.stringify(p.list), `${label}: the school list changed`);
    ok(JSON.stringify(back.context) === JSON.stringify(p.context), `${label}: the context flags changed`);
    /* A link nobody can paste is not a link. */
    ok(code.length < 1800, `${label}: ${code.length} characters is too long for a URL`);
  }

  /* Schools the table no longer carries are dropped, not crashed on. */
  const stale = await decodeProfile(
    await encodeProfile(withProfile({ list: ["Harvard University", "Hogwarts School of Witchcraft"] })),
    (name) => SCHOOLS.some((s) => s.name === name));
  ok(stale.list.length === 1 && stale.list[0] === "Harvard University", `stale link kept ${JSON.stringify(stale?.list)}`);

  /* Anything malformed lands on the ordinary page, never an error. */
  for (const junk of ["", "x", "1z", "9zabc", "1znot-base64!!", "1u" + btoa("{not json"), "1u" + btoa('{"g":"not a number"}')]) {
    ok(await decodeProfile(junk) === null, `"${junk.slice(0, 16)}" should decode to null`);
  }
});


await section("Program data", async () => {
  const PROG = await loadPrograms();

  /* Every major in the table is a major the app actually has, and every CIP
     the map points at exists in the data. A typo in either file would
     otherwise show up as a major that silently has no programs. */
  for (const [majorId, cips] of Object.entries(MAJOR_CIP)) {
    ok(MAJOR_BY_ID.has(majorId), `cip map names "${majorId}", which is not a major`);
    for (const cip of cips) ok(PROG.fields.has(cip), `${majorId}: CIP ${cip} is not in the field table`);
  }
  for (const m of MAJORS) ok(MAJOR_CIP[m.id] !== undefined, `${m.id} has no entry in the cip map`);

  /* Nothing invented. Every school in the program table is one of ours, and
     every money figure is a plausible amount rather than a parse artifact. */
  let money = 0, sizes = 0;
  for (const major of PROG.majors.values()) {
    for (const p of major.rows) {
      ok(SCHOOLS.includes(p.school), `${p.school?.name}: program row for a school not in the database`);
      ok(p.awards >= 0 && p.awards < 20000, `${p.school.name}/${major.id}: ${p.awards} degrees a year is not credible`);
      sizes++;
      if (p.earn1 !== null) {
        money++;
        ok(p.earn1 > 5000 && p.earn1 < 400000, `${p.school.name}/${major.id}: $${p.earn1} is not a credible median`);
        ok(p.index > 0.1 && p.index < 10, `${p.school.name}/${major.id}: index ${p.index} is out of range`);
      }
      /* Debt and earnings must travel together or not at all: a burden ratio
         computed from one of them would be meaningless. */
      ok(p.burden === null || (p.debt !== null && p.earn1 !== null), `${p.school.name}/${major.id}: burden without both figures`);
      /* A suppressed figure is absent, never zero — the bug that would quietly
         rank every small program last. */
      ok(p.earn1 !== 0 && p.debt !== 0, `${p.school.name}/${major.id}: a suppressed figure came through as zero`);
    }
  }
  ok(money > 8000, `only ${money} programs carry earnings — the join is probably broken`);
  ok(sizes > 20000, `only ${sizes} programs total — the table is probably truncated`);

  /* An online school's state is where it is incorporated, so it never gets a
     local comparison. */
  for (const major of PROG.majors.values())
    for (const p of major.rows)
      if (p.school.online === 2) ok(p.localIndex === null, `${p.school.name}: an online school was compared to its state`);

  /* The pooled national median has to sit among the fields it pools, or the
     weighting is wrong. */
  for (const major of PROG.majors.values()) {
    if (major.natEarn === null) continue;
    const ms = major.fields.map((f) => f.natEarn).filter((v) => v !== null);
    ok(major.natEarn >= Math.min(...ms) && major.natEarn <= Math.max(...ms),
      `${major.id}: pooled median ${major.natEarn} sits outside its fields ${ms.join()}`);
  }

  /* Every sort produces an order, and a descending sort really descends. */
  for (const [key, sort] of Object.entries(PROGRAM_SORTS)) {
    const rows = PROG.schoolsForMajor("cs", { minAwards: 15, earningsOnly: sort.needsEarnings })
      .filter((p) => !sort.needsState || p.localIndex !== null)
      .sort(sort.cmp);
    ok(rows.length > 20, `sort "${key}" left only ${rows.length} computer science programs`);
    for (let i = 1; i < rows.length; i++) ok(sort.cmp(rows[i - 1], rows[i]) <= 0, `sort "${key}" is not ordered at row ${i}`);
  }

  /* The headline claim of the pane: a major that spans two federal fields is
     read against both, not against whichever one a school happened to file
     under. Computer Science spans two, and its pooled national figure must
     differ from at least one of them. */
  const cs = PROG.major("cs");
  ok(cs.fields.length === 2, `computer science should span two federal fields, spans ${cs.fields.length}`);
  ok(cs.natAwards === cs.fields.reduce((t, f) => t + f.natAwards, 0), "pooled awards do not add up");

  /* A school that runs no such program says so instead of returning zeros. */
  const noProgram = SCHOOLS.find((s) => PROG.at(s, "petro") === null);
  ok(noProgram !== undefined, "every school appears to run petroleum engineering, which cannot be right");

  /* The majors with no federal field are handled, not crashed on. */
  for (const majorId of ["undeclared", "honors", "hvac"]) {
    ok(!PROG.covered(majorId), `${majorId} should have no federal field`);
    ok(PROG.schoolsForMajor(majorId).length === 0, `${majorId} returned programs it should not have`);
    ok(PROG.at(SCHOOLS[0], majorId) === null, `${majorId} returned a program for ${SCHOOLS[0].name}`);
  }

  /* Two schools that award the same number of degrees must still be distinct
     records — the join is by unit id, not by any number that can collide. */
  const rowsPerSchool = new Map();
  for (const line of PROGRAM_ROWS.split("\n")) rowsPerSchool.set(line.split(",")[0], (rowsPerSchool.get(line.split(",")[0]) || 0) + 1);
  for (const [unitid, n] of rowsPerSchool) ok(n === 1, `unit id ${unitid} appears in ${n} rows`);

  /* Field titles survived the CSV's quoted commas intact. */
  for (const f of PROG.fields.values()) {
    ok(f.title.length > 3 && !/^\d|\|/.test(f.title), `CIP ${f.cip} has a mangled title: ${JSON.stringify(f.title)}`);
    ok(f.natAwards >= 0, `CIP ${f.cip} has negative awards`);
  }
  ok(CIP_ROWS.split("\n").length === PROG.fields.size, "field rows and parsed fields disagree");
});


await section("Best fits", async () => {
  const PROG = await loadPrograms();
  const profiles = [];
  for (const state of ["CA", "NY", "TX", "OH", "FL", "WY"])
    for (const majorId of ["nursing", "cs", "bizadmin", "english", "mecheng", "crimjust"])
      for (const gpa of [2.4, 3.0, 3.6, 4.0])
        profiles.push(withProfile({ state, majorId, gpa }));

  /* Every filter holds under every combination, not just on its own. */
  for (const scope of ["state", "prefer", "any"]) {
    for (const includeOnline of [true, false]) {
      for (const majorId of ["nursing", "cs", "psych"]) {
        const p = withProfile({ state: "OH", majorId, gpa: 3.3 });
        const s = buildSlate(p, PROG, { scope, includeOnline });
        const rows = s.bands.flatMap((b) => b.rows);
        const where = `${scope}/${includeOnline ? "with" : "without"} online/${majorId}`;
        if (scope === "state") for (const c of rows) ok(c.school.state === "OH", `${where}: ${c.school.name} is not in OH`);
        if (!includeOnline) for (const c of rows) ok(c.school.online !== 2, `${where}: ${c.school.name} is online`);
        for (const c of rows) {
          ok(!c.r.blocked, `${where}: ${c.school.name} cannot admit for the term`);
          if (s.covered) ok(c.program && c.program.awards >= 5, `${where}: ${c.school.name} runs no such program`);
        }
      }
    }
  }

  for (const p of profiles) {
    const s = buildSlate(p, PROG);
    const rows = s.bands.flatMap((b) => b.rows);
    const where = `${p.state}/${p.majorId}/${p.gpa}`;

    ok(rows.length > 0, `${where}: produced an empty slate`);
    ok(rows.length <= 12, `${where}: produced ${rows.length} rows, more than asked for`);

    /* A suggestion offered twice is a bug you would notice immediately. */
    const names = rows.map((c) => c.school.name);
    ok(new Set(names).size === names.length, `${where}: the same school appears twice`);

    for (const c of rows) {
      /* Nothing is suggested that does not run the major, when the federal
         data knows which schools do. */
      if (s.covered) ok(c.program && c.program.awards >= 5, `${where}: ${c.school.name} was suggested without a program in the major`);
      /* Nothing is suggested that cannot take you in the term you asked for. */
      ok(!c.r.blocked, `${where}: ${c.school.name} does not admit for ${p.term}`);
      /* Every row explains itself. A suggestion with no stated reason is the
         black box this pane exists not to be. */
      ok(c.why.length > 0, `${where}: ${c.school.name} was suggested with no reason given`);
      ok(c.rank > 0 && c.rank <= 1, `${where}: ${c.school.name} has rank ${c.rank}`);
    }

    /* The caps: a slate that is all online schools, or all one state, is the
       failure mode the bands exist to prevent. */
    ok(rows.filter((c) => c.school.online === 2).length <= 2, `${where}: more than two online universities`);
    const byState = new Map();
    for (const c of rows) byState.set(c.school.state, (byState.get(c.school.state) || 0) + 1);
    for (const [st, n] of byState)
      ok(st === p.state || n <= 3, `${where}: ${n} schools from ${st}, which is not the applicant's state`);

    /* The bands really are ordered by odds, and each row sits in its own. */
    for (const band of s.bands)
      for (const c of band.rows)
        ok(c.r.prob >= band.min && c.r.prob < band.max, `${where}: ${c.school.name} at ${c.r.prob} is in the ${band.key} band`);
  }

  /* Residency, across every state and several majors. Three settings, each
     asserted against what its own label promises. */
  const states = [...new Set(SCHOOLS.map((s) => s.state))];
  for (const state of states) {
    for (const majorId of ["nursing", "cs", "bizadmin"]) {
      const p = withProfile({ state, majorId, gpa: 3.3 });
      const where = `${state}/${majorId}`;

      /* "Only" admits no exception at any size, and drops nothing it could
         have shown. */
      const inState = buildSlate(p, PROG, { scope: "state" });
      for (const c of inState.bands.flatMap((b) => b.rows))
        ok(c.school.state === state, `${where}: "only" offered ${c.school.name} in ${c.school.state}`);
      ok(inState.homeShown === inState.total, `${where}: ${inState.homeShown} in state of ${inState.total}`);
      ok(inState.total === Math.min(inState.homeAvailable, 12),
        `${where}: "only" showed ${inState.total} of ${inState.homeAvailable} in-state candidates`);

      /* "Prefer" reaches its floor — half the list, or everything the band
         shape can hold, whichever is smaller — and never does worse than not
         preferring at all. */
      const prefer = buildSlate(p, PROG, { scope: "prefer" });
      const floor = Math.min(prefer.homeReachable, Math.ceil(12 / 2));
      ok(prefer.homeShown >= floor,
        `${where}: "prefer" showed ${prefer.homeShown} in state, but ${floor} were reachable (${prefer.homeAvailable} available)`);

      const any = buildSlate(p, PROG, { scope: "any" });
      ok(prefer.homeShown >= any.homeShown,
        `${where}: preferring gave ${prefer.homeShown} in state, not preferring gave ${any.homeShown}`);
      /* The three sit in the order their labels imply. */
      ok(inState.homeShown >= prefer.homeShown || inState.total < prefer.total,
        `${where}: "only" showed fewer in-state than "prefer" without returning a shorter list`);

      /* Under every setting the bands still sort the way they claim, and the
         count the pane prints is the count on the page. */
      for (const s2 of [inState, prefer, any]) {
        for (const band of s2.bands)
          for (const c of band.rows)
            ok(c.r.prob >= band.min && c.r.prob < band.max,
              `${where}: ${c.school.name} at ${c.r.prob} sits outside the ${band.key} band`);
        ok(s2.homeShown === s2.bands.flatMap((b) => b.rows).filter((c) => c.school.state === state).length,
          `${where}: the in-state count disagrees with the rows`);
        ok(s2.total === new Set(s2.bands.flatMap((b) => b.rows).map((c) => c.school.name)).size,
          `${where}: a school appears twice`);
      }
    }
  }

  /* Turning online off really removes them rather than reordering them. */
  const ohio = withProfile({ state: "OH", majorId: "nursing", gpa: 3.42 });
  const campus = buildSlate(ohio, PROG, { includeOnline: false }).bands.flatMap((b) => b.rows);
  ok(campus.every((c) => c.school.online !== 2), "campus-only still suggested an online university");
  ok(campus.length > 0, "campus-only produced nothing at all");

  /* A major with no federal field cannot say which schools run it, so it says
     so rather than suggesting all 588. */
  for (const majorId of ["undeclared", "honors"]) {
    const s = buildSlate(withProfile({ majorId }), PROG);
    ok(s.covered === false, `${majorId} should not be covered`);
    ok(s.total > 0, `${majorId} should still suggest something, on odds and cost alone`);
  }

  /* Without the program tables at all, the pane degrades rather than breaking. */
  const noData = buildSlate(withProfile({ majorId: "cs" }), null);
  ok(noData.total > 0, "a slate built with no program data came out empty");
  ok(noData.covered === false, "a slate built with no program data claimed coverage");

  /* A stronger applicant should not be offered a weaker list: the top band of
     a 4.0 should be at least as likely as the top band of a 2.4. */
  const strong = buildSlate(withProfile({ majorId: "cs", gpa: 4.0 }), PROG).bands[0].rows;
  const weak = buildSlate(withProfile({ majorId: "cs", gpa: 2.4 }), PROG).bands[0].rows;
  const mean = (rows) => rows.reduce((t, c) => t + c.r.prob, 0) / rows.length;
  ok(mean(strong) >= mean(weak) - 0.02, `a 4.0's safety band (${mean(strong).toFixed(2)}) is below a 2.4's (${mean(weak).toFixed(2)})`);
});


await section("Does a school run the major", async () => {
  const PROG = await loadPrograms();

  /* Every equivalence points at a real major and a real field, and never
     duplicates a primary code — a silent typo here would quietly widen or
     narrow what counts as offering a subject. */
  for (const [majorId, cips] of Object.entries(MAJOR_CIP_ALSO)) {
    ok(MAJOR_BY_ID.has(majorId), `equivalents name "${majorId}", which is not a major`);
    ok(MAJOR_CIP[majorId] !== undefined, `${majorId} has equivalents but no primary mapping`);
    for (const cip of cips) {
      ok(PROG.fields.has(cip), `${majorId}: equivalent CIP ${cip} is not in the field table`);
      ok(!(MAJOR_CIP[majorId] || []).includes(cip), `${majorId}: ${cip} is listed as both primary and equivalent`);
    }
  }

  /* The equivalences must never leak into the figures. A major's pooled
     national awards come from its primary fields alone, so adding an
     equivalent cannot move a single number in the Programs pane. */
  for (const [majorId, cips] of Object.entries(MAJOR_CIP_ALSO)) {
    const major = PROG.major(majorId);
    if (!major) continue;
    const primary = new Set(MAJOR_CIP[majorId]);
    for (const f of major.fields)
      ok(primary.has(f.cip), `${majorId}: field ${f.cip} reached the statistics but is only an equivalent`);
    ok(major.natAwards === major.fields.reduce((t, f) => t + f.natAwards, 0),
      `${majorId}: pooled awards no longer add up`);
  }

  /* A school with no federal program record at all is unknown, never absent —
     hiding it would be asserting something the data does not say. */
  let unknown = 0;
  for (const s2 of SCHOOLS) if (PROG.runsMajor(s2, "cs") === null) unknown++;
  ok(unknown > 0 && unknown < 60, `${unknown} schools have no program record — expected a small handful`);

  /* A major with no federal field cannot be asked about, so nothing is hidden
     on its account. */
  for (const majorId of ["undeclared", "honors"])
    for (const s2 of SCHOOLS.slice(0, 20))
      ok(PROG.runsMajor(s2, majorId) === null, `${majorId} should answer "unknown" for every school`);

  /* The bug this was built for: sport management is filed under 3105, beside
     kinesiology, so mapping it to 3103 alone hid it nearly everywhere. */
  const sport = SCHOOLS.filter((s2) => PROG.runsMajor(s2, "sportmgmt") === true).length;
  ok(sport > 300, `only ${sport} schools register as running sport management — the mapping is too narrow again`);
  /* ...but its figures must still come from 3103 alone, unblended. */
  ok(PROG.major("sportmgmt").fields.every((f) => f.cip === "3103"),
    "sport management's statistics picked up a field beyond its primary mapping");

  /* Anything runsMajor says yes to on primary evidence, at() must also find. */
  for (const majorId of ["nursing", "cs", "mecheng"]) {
    for (const s2 of SCHOOLS.slice(0, 80)) {
      if (PROG.at(s2, majorId)) ok(PROG.runsMajor(s2, majorId) === true,
        `${s2.name}/${majorId}: at() has a program but runsMajor says no`);
    }
  }
});

await section("Best fits ordering", async () => {
  const PROG = await loadPrograms();
  for (const state of ["OH", "CA", "TX", "WY", "OR"]) {
    for (const majorId of ["nursing", "cs", "bizadmin"]) {
      for (const scope of ["state", "prefer", "any"]) {
        const s2 = buildSlate(withProfile({ state, majorId, gpa: 3.3 }), PROG, { scope });
        for (const band of s2.bands) {
          const odds = band.rows.map((c) => c.r.prob);
          for (let i = 1; i < odds.length; i++)
            ok(odds[i - 1] >= odds[i],
              `${state}/${majorId}/${scope}: band "${band.key}" lists ${(odds[i-1]*100).toFixed(0)}% above ${(odds[i]*100).toFixed(0)}%`);
        }
      }
    }
  }
});


await section("Cost and completion", async () => {
  ok(costCount() > 500, `only ${costCount()} schools carry cost data`);
  ok(INCOME_BANDS.length === 5, `expected five income bands, got ${INCOME_BANDS.length}`);

  let net = 0, grads = 0, banded = 0;
  for (const school of SCHOOLS) {
    const c = costFor(school, "48to75");
    if (!c) continue;

    if (c.net !== null) {
      net++;
      /* A year of college is not $40 and not $400,000. A parse slipping a
         factor of a hundred is exactly the bug the hundreds encoding invites. */
      /* Negative is real — aid can exceed cost — but only to a point, and the
         upper bound still catches a hundreds-encoding slip. */
      ok(c.net > -20000 && c.net < 120000, `${school.name}: net price ${c.net} is not credible`);
      ok(c.aidExceedsCost === (c.net < 0), `${school.name}: aidExceedsCost disagrees with a net price of ${c.net}`);
      ok(c.basis === "band" || c.basis === "average", `${school.name}: net price with no stated basis`);
      if (c.basis === "band") banded++;
    } else {
      ok(c.basis === null, `${school.name}: no net price but a basis of ${c.basis}`);
    }

    for (const [k, v] of [["gradRate", c.gradRate], ["retention", c.retention]]) {
      if (v === null) continue;
      if (k === "gradRate") grads++;
      ok(v >= 0 && v <= 100, `${school.name}: ${k} of ${v}% is out of range`);
    }
    for (const t of [c.tuitionIn, c.tuitionOut]) {
      if (t === null) continue;
      ok(t > 500 && t < 120000, `${school.name}: tuition ${t} is not credible`);
    }
    /* Out-of-state is never cheaper than in-state, so a positive gap or none. */
    ok(c.nonResidentGap === null || c.nonResidentGap > 0, `${school.name}: non-resident gap of ${c.nonResidentGap}`);
  }
  ok(net > 500, `only ${net} schools priced`);
  ok(grads > 500, `only ${grads} schools carry a graduation rate`);
  ok(banded > 450, `only ${banded} schools carry the $48-75k band specifically`);

  /* The band actually changes the answer — if every band returned the same
     figure the input would be decoration. Harvard is the extreme case. */
  const harvard = BY_NAME.get("Harvard University");
  if (harvard) {
    const low = costFor(harvard, "48to75").net;
    const high = costFor(harvard, "over110").net;
    ok(high > low * 3, `Harvard: $${low} at 48-75k vs $${high} over 110k — the bands are not being read`);
  }

  /* Saying nothing falls back to the average and admits it. */
  for (const school of SCHOOLS.slice(0, 40)) {
    const c = costFor(school, "");
    if (c && c.net !== null) ok(c.basis === "average", `${school.name}: an empty band claimed basis "${c.basis}"`);
  }

  /* An unknown band must not throw or silently read as band one. */
  const probe = BY_NAME.get("The Ohio State University");
  if (probe) {
    const bogus = costFor(probe, "not-a-band");
    ok(bogus.basis === "average", `an unrecognised band gave basis "${bogus.basis}"`);
    ok(bogus.net === costFor(probe, "").net, "an unrecognised band disagreed with saying nothing");
  }

  /* Income must never travel in a shared link. */
  const code = await encodeProfile(withProfile({ income: "over110" }));
  const back = await decodeProfile(code);
  ok(!back.income, `a shared link carried income back as ${JSON.stringify(back.income)}`);
});

/* 17. Transfer guarantees: a citation, or nothing at all.
 *
 * This is the section where a wrong answer costs someone a year, so the tests
 * are about restraint rather than coverage: every claim carries a live-looking
 * primary source, and the function refuses to speak outside the three
 * conditions the policies actually cover. */
await section("Transfer guarantees", () => {
  ok(/^\d{4}-\d{2}-\d{2}$/.test(VERIFIED), `VERIFIED is malformed: ${VERIFIED}`);
  ok(POLICY_STATES.length > 0, "no policies at all");

  for (const st of POLICY_STATES) {
    const p = POLICIES[st];
    ok(/^[A-Z]{2}$/.test(st), `"${st}" is not a state code`);
    for (const k of ["name", "scope", "admission", "credits", "source", "authority"])
      ok(typeof p[k] === "string" && p[k].length > 0, `${st}: missing ${k}`);
    /* Every source must be a government or system domain — no blogs, no
       aggregators, no search results. */
    const host = new URL(p.source).host;
    ok(p.source.startsWith("https://"), `${st}: source is not https`);
    ok(/\.(gov|edu|org)$/.test(host), `${st}: source host ${host} is not an official domain`);
    ok(["public", "csu", "suny", "unc", "participating", "agreement"].includes(p.scope),
      `${st}: unknown scope ${p.scope}`);
  }

  const inState = (st) => SCHOOLS.find((s) => s.state === st && s.control === "pub");

  /* The three refusals. */
  const osu = BY_NAME.get("The Ohio State University");
  if (osu) {
    ok(policyFor(osu, withProfile({ state: "OH" })) !== null, "Ohio: a covered school returned nothing");
    ok(policyFor(osu, withProfile({ state: "OH", curtype: "four" })) === null,
      "Ohio: a four-year origin was told the community college guarantee applies");
    ok(policyFor(osu, withProfile({ state: "CA" })) === null,
      "a Californian was told Ohio's guarantee reaches Ohio State");
  }
  for (const st of ["WY", "MT", "ND"]) {
    const s = inState(st);
    if (s) ok(policyFor(s, withProfile({ state: st })) === null, `${st} has no policy on record but answered anyway`);
  }

  /* Scope has to bite: a private school in a public-scope state is outside it. */
  const xavier = SCHOOLS.find((s) => s.state === "OH" && s.control !== "pub");
  if (xavier) {
    const r = policyFor(xavier, withProfile({ state: "OH" }));
    ok(r && r.binds === false, `${xavier.name}: a private Ohio school read as covered by Ohio Transfer 36`);
  }
  const csulb = BY_NAME.get("California State University, Long Beach");
  if (csulb) ok(policyFor(csulb, withProfile({ state: "CA" }))?.binds === true, "CSU Long Beach is not reading as an ADT campus");
  const usc = BY_NAME.get("University of Southern California");
  if (usc) ok(policyFor(usc, withProfile({ state: "CA" }))?.binds === false, "USC read as bound by the CSU ADT");

  /* Where participation is a choice, the app must say "check", never "yes". */
  for (const st of POLICY_STATES) {
    if (!["participating", "agreement"].includes(POLICIES[st].scope)) continue;
    const s = inState(st);
    if (s) ok(policyFor(s, withProfile({ state: st }))?.binds === null,
      `${st}: an opt-in policy asserted coverage instead of asking the reader to check`);
  }
});

/* 18. ASSIST: a link, never a copy.
 *
 * ASSIST's articulation content belongs to the Regents and is revised every
 * catalogue year, so the only safe thing to ship is a way in. These tests keep
 * it that way: identifiers only, every link on assist.org, and never a link
 * offered for a school that does not take part. */
await section("ASSIST links", () => {
  ok(Number.isInteger(ASSIST_YEAR) && ASSIST_YEAR > 0, `bad academic year id ${ASSIST_YEAR}`);
  ok(ASSIST_RECEIVING.size > 40, `only ${ASSIST_RECEIVING.size} receiving institutions`);
  ok(ASSIST_SENDING.size > 100, `only ${ASSIST_SENDING.size} community colleges`);

  for (const [name, id] of ASSIST_RECEIVING) {
    ok(BY_NAME.has(name), `ASSIST receiving "${name}" is not a school in this app`);
    ok(BY_NAME.get(name).state === "CA", `${name} is not in California but carries an ASSIST id`);
    ok(Number.isInteger(id) && id > 0, `${name}: bad ASSIST id ${id}`);
  }

  const cc = (o) => withProfile({ state: "CA", curtype: "cc", current: "Los Angeles City College", ...o });
  const ucla = BY_NAME.get("University of California, Los Angeles");
  if (ucla) {
    const a = assistLink(ucla, cc());
    ok(a && a.from === "Los Angeles City College", "UCLA: the sending college was not matched");
    ok(a.href.startsWith("https://assist.org/transfer/results?"), `UCLA: unexpected href ${a.href}`);
    ok(a.href.includes(`year=${ASSIST_YEAR}`), "UCLA: the link does not carry the live catalogue year");
    /* Both institutions must appear, or the reader lands on a chooser. */
    ok(/institution=\d+/.test(a.href) && /agreement=\d+/.test(a.href), "UCLA: link is missing an institution");
    /* No college named means the chooser, not a guessed agreement. */
    const bare = assistLink(ucla, cc({ current: "" }));
    ok(bare.from === null && bare.href === "https://assist.org/", `an unnamed college produced ${bare.href}`);
  }

  /* Schools outside ASSIST must never be linked into it. */
  for (const n of ["Stanford University", "University of Southern California", "The Ohio State University"]) {
    const s = BY_NAME.get(n);
    if (s) ok(assistLink(s, cc()) === null, `${n} was offered an ASSIST link`);
  }

  /* Every link points at assist.org and nowhere else. */
  for (const [name] of ASSIST_RECEIVING) {
    const a = assistLink(BY_NAME.get(name), cc());
    ok(new URL(a.href).host === "assist.org", `${name}: link leaves assist.org`);
  }

  /* Matching is generous but never reckless: a stray word must not bind. */
  ok(matchSendingCollege("") === null, "an empty college matched something");
  ok(matchSendingCollege("xyz") === null, "a three-letter string matched a college");
  for (const [name] of ASSIST_SENDING) {
    const m = matchSendingCollege(name);
    ok(m && m.name === name, `"${name}" did not match itself`);
  }
});

/* 19. The legal documents describe the site that exists.
 *
 * Terms and privacy pages rot silently: a feature ships, the document still
 * describes the old behaviour, and nobody notices until it matters. These
 * assertions tie the prose to things the code can actually check. */
await section("Terms, privacy and notices", () => {
  const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
  /* Every module, not just app.js: the licence key is written by
     entitlement.js, and scoping this to one file let it go unmentioned. */
  const appjs = readdirSync(new URL(".", import.meta.url))
    .filter((f) => f.endsWith(".js"))
    .map((f) => readFileSync(new URL("./" + f, import.meta.url), "utf8")).join("\n");
  const doc = (id) => {
    const a = html.indexOf(`<article class="legaldoc" id="${id}"`);
    ok(a > 0, `no #${id} article in index.html`);
    return html.slice(a, html.indexOf("</article>", a));
  };
  const terms = doc("terms"), privacy = doc("privacy"), notices = doc("notices");

  /* No placeholder may ever reach a published page. */
  ok(!/REPLACE@|EXAMPLE\.COM|TODO|FIXME|Lorem ipsum/i.test(html), "a placeholder survived into index.html");
  for (const [name, d] of [["terms", terms], ["privacy", privacy], ["notices", notices]])
    ok(/mailto:[^"]+@[^"]+\.[a-z]{2,}/.test(d), `${name} carries no contact address`);

  /* Every storage key the app writes must be named in the privacy document,
     and the document must not name keys the app no longer uses. */
  const keysInApp = [...appjs.matchAll(/"((?:matriculate|transfer-odds):[a-z0-9:]+)"/g)].map((m) => m[1]);
  ok(keysInApp.length >= 2, `found only ${keysInApp.length} storage keys in app.js`);
  for (const k of new Set(keysInApp))
    ok(privacy.includes(k), `privacy does not mention the storage key ${k}`);
  for (const m of privacy.matchAll(/<code>((?:matriculate|transfer-odds):[a-z0-9:]+)<\/code>/g))
    ok(keysInApp.includes(m[1]), `privacy names ${m[1]}, which app.js no longer uses`);

  /* Terms must name every substantive thing the app now does. Each of these
     shipped after the first draft of the document. */
  for (const claim of ["Net price", "graduation", "earnings", "Deadlines", "Transfer guarantees", "ASSIST", "College Scorecard"])
    ok(terms.includes(claim), `terms never mention ${claim}`);

  /* The reverse: a claim the app outgrew. It now reads the federal program
     tables and hides schools that report no degrees in the chosen major. */
  ok(!/does not know which majors/i.test(html), "a page still claims the app cannot tell which majors a campus offers");

  /* ASSIST content is linked, never copied — the notices must say so. */
  ok(/not reproduced here|no ASSIST content/i.test(notices), "notices do not state that ASSIST content is not reproduced");
  ok(notices.includes("Regents"), "notices do not attribute ASSIST to the Regents");

  /* The rebrand must be complete on every generated page. */
  ok(!/>TO</.test(html), "the pre-rebrand TO mark is still in index.html");

  /* Selling requires saying who is selling. Paddle asks for a sole
     proprietor's legal name to be clearly accessible before they will approve
     the site, and a buyer is entitled to know who took their money — so this
     is load-bearing, not decoration, and it is asserted rather than trusted. */
  for (const [name, d] of [["terms", terms], ["privacy", privacy], ["notices", notices]])
    ok(/Gavin Schote/.test(d), `${name} does not name the publisher`);
  ok(/sole proprietor/i.test(terms), "terms do not state the trading status");
  ok(/Paddle/.test(terms) && /merchant of record/i.test(terms),
    "terms do not identify Paddle as the merchant of record");
  ok(/refund/i.test(terms), "terms carry no refund policy");
  /* A subscription has disclosures a one-off purchase does not, and they are
     the ones people litigate over: that it renews, how to stop it, and what
     happens to the period already paid for. */
  for (const [what, re] of [
    ["that it renews automatically", /renews automatically/i],
    ["how to cancel", /cancel at any time/i],
    ["what happens to the paid period", /until the end of the period/i],
    ["both billing periods", /monthly or yearly|yearly plan renews once a year/i],
  ]) ok(re.test(terms), `terms do not state ${what}`);
  /* The footer is on every page, which is where somebody skimming will look. */
  ok(/Published by Gavin Schote/.test(html), "the footer does not name the publisher");
});

/* 20. The paywall: absent, not hidden.
 *
 * The property the whole design rests on is that a free browser does not hold
 * the paid figures — so flipping a flag in a console buys an empty table, not
 * a free ride. These assertions run last because they take the entitlement
 * away, and they put it back before finishing. */
await section("The paywall", async () => {
  deactivate();
  ok(!isPaid(), "deactivating left the tier paid");
  ok(paidRows() === null, "paid rows survived deactivation");
  ok(costCount() === 0, `a free browser holds cost data for ${costCount()} schools`);
  ok(costFor(BY_NAME.get("Harvard University"), "48to75") === null, "costFor answered without a licence");
  ok(listLimit() === FREE_LIST_LIMIT, `free list limit is ${listLimit()}`);

  /* The free bundle itself must not contain the paid tables. This reads the
     shipped files rather than the objects, because the question is what a
     browser can see in view-source. */
  const freeProg = readFileSync(new URL("./programs.js", import.meta.url), "utf8");
  ok(!/,\d+,\d*,\d*,\d*;/.test(freeProg), "programs.js still carries money columns");
  for (const f of ["costs.js"]) {
    const shipped = readFileSync(new URL("./build-site.mjs", import.meta.url), "utf8");
    ok(!new RegExp(`"${f}"`).test(shipped.split("const ASSETS")[1].split("]")[0]),
      `${f} is still shipped to the browser`);
  }

  /* Programs keep their free half and lose only the money. */
  const free = await loadPrograms();
  const osu = BY_NAME.get("The Ohio State University");
  const fp = free.at(osu, "psych");
  ok(fp && fp.awards > 0, "degree counts vanished along with the paid figures");
  ok(fp && fp.earn1 === null, "earnings survived without a licence");

  /* A bad key is refused and changes nothing. */
  ok((await activate("MTRC-WRONG-WRONG-WRONG")).ok === false, "a bad licence activated");
  ok(costCount() === 0, "a rejected licence populated the table");

  /* And it all comes back. */
  ok((await activate(GOOD_KEY)).ok, "re-activating a good licence failed");
  ok(costCount() > 500, "the table did not come back after re-activating");
  ok(listLimit() === Infinity, "a paid licence still caps the list");
  const back = await loadPrograms();
  ok(back.at(osu, "psych").earn1 !== null, "earnings did not return after re-activating");
});

/* 21. Every named import resolves.
 *
 * A misspelled or renamed export is a module-level failure: the browser
 * refuses the whole script and the page is simply blank, with nothing on fire
 * in any of these tests because none of them import that name. It happened —
 * app.js asked entitlement.js for claimFromTransaction while the file still
 * exported claimFromSession, and the site booted to an empty shell. Node's
 * resolver answers this question exactly, so ask it about every module. */
await section("Imports resolve", async () => {
  /* The entitlement API's address is a guess until somebody deploys the
     Worker, and a wrong one fails silently in the worst way: the site loads,
     the licence check fails, and a paying reader is quietly shown the free
     tier. So it is asserted to be a real https URL under the account that
     actually owns the Worker, rather than left to be noticed in production. */
  const ent = readFileSync(new URL("./entitlement.js", import.meta.url), "utf8");
  const api = ent.match(/export const API = "([^"]+)"/)?.[1];
  ok(api && /^https:\/\//.test(api), `the entitlement API is not an https URL: ${api}`);
  ok(!/REPLACE|example\.com|localhost/.test(api || ""), `the entitlement API is still a placeholder: ${api}`);
  const wrangler = readFileSync(new URL("./worker/wrangler.toml", import.meta.url), "utf8");
  const workerName = wrangler.match(/^name\s*=\s*"([^"]+)"/m)?.[1];
  ok(api?.includes(workerName), `the API host does not name the worker "${workerName}": ${api}`);

  const files = readdirSync(new URL(".", import.meta.url))
    .filter((f) => f.endsWith(".js") && f !== "programs.js" && f !== "costs.js");
  for (const file of files) {
    const src = readFileSync(new URL("./" + file, import.meta.url), "utf8");
    for (const m of src.matchAll(/import\s*\{([^}]+)\}\s*from\s*"\.\/([^"]+)"/g)) {
      const names = m[1].split(",").map((x) => x.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
      const target = await import("./" + m[2]);
      for (const n of names)
        ok(n in target, `${file} imports { ${n} } from ./${m[2]}, which does not export it`);
    }
  }
});

console.log(`\n${checks} checks, ${failures} failed`);
process.exit(failures ? 1 : 0);
