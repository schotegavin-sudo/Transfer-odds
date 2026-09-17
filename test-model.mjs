/* Model regression tests. Run: npm test
 *
 * These exist because the first version of the scorer matched factors by
 * label, which let one input contribute two lines that disagreed with each
 * other. Every property below is something a user would notice if it broke.
 */
import { SCHOOLS, MAJORS, MAJOR_BY_ID, score, levers, poolFor, majorRate, Phi, probit } from "./model.js";
import { ALIASES, acronym, searchIndex, matches, relevance } from "./aliases.js";
import { deadlineFor, daysUntil, verifyLinks } from "./deadlines.js";
import { encodeProfile, decodeProfile } from "./share.js";

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

/* 14. Source links go somewhere real and carry the school's name. */
await section("Source links", () => {
  for (const s of sample) {
    const links = verifyLinks(s);
    ok(links.length === 3, `${s.name}: ${links.length} source links`);
    for (const l of links) {
      ok(l.href.startsWith("https://"), `${s.name}: ${l.label} is not https`);
      ok(!/undefined|NaN/.test(l.href), `${s.name}: ${l.label} has a broken URL`);
      ok(decodeURIComponent(l.href).includes(s.name), `${s.name}: ${l.label} does not carry the school name`);
      ok(l.note && l.label, `${s.name}: a source link is missing its label or note`);
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

console.log(`\n${checks} checks, ${failures} failed`);
process.exit(failures ? 1 : 0);
