/* The scoring model.
 *
 * The question is not "how selective is this school" but "where do I stand in
 * the pool of people applying to transfer into this program". So each school's
 * applicant pool is reconstructed from two published-ish numbers — its transfer
 * admit rate and the GPA its admitted transfers carry — and your file is placed
 * inside that pool.
 */

import { SCHOOL_ROWS } from "./data.js";
import { MAJOR_ROWS } from "./majors.js";

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const round = (v, d = 0) => Math.round(v * 10 ** d) / 10 ** d;

/* ------------------------------------------------------------ normal math */

const SQRT2PI = Math.sqrt(2 * Math.PI);
const pdf = (z) => Math.exp(-0.5 * z * z) / SQRT2PI;

/* Normal CDF via the Numerical Recipes erfc approximation. */
export function Phi(z) {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.5 * x);
  const y = t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
    t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 +
    t * (-0.82215223 + t * 0.17087277)))))))));
  const erfc = z >= 0 ? y : 2 - y;
  return 1 - 0.5 * erfc;
}

/* Inverse normal CDF (Acklam), plenty accurate for a planning tool. */
export function probit(p) {
  p = clamp(p, 1e-9, 1 - 1e-9);
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  const pl = 0.02425;
  let q, r;
  if (p < pl) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - pl) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  q = p - 0.5; r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/* ---------------------------------------------------------------- schools */

export const TAG_LABEL = {
  catag: "CA transfer pathway (TAG / ADT)",
  artic: "statewide 2+2 articulation",
  imp: "admits to the major, not the university",
  nurs: "nursing admits on its own cycle",
  open: "open admission",
  nospr: "little or no spring intake",
  hol: "holistic file review",
};

function derivedGpa(rate) {
  const pts = [[1, 3.95], [10, 3.85], [20, 3.6], [30, 3.5], [40, 3.4], [50, 3.3], [60, 3.15], [70, 3.0], [80, 2.85], [90, 2.65], [100, 2.4]];
  for (let i = 1; i < pts.length; i++) {
    if (rate <= pts[i][0]) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      return round(y0 + ((rate - x0) / (x1 - x0)) * (y1 - y0), 2);
    }
  }
  return 2.4;
}

export const SCHOOLS = SCHOOL_ROWS.split("\n").map((line, i) => {
  const [name, state, control, online, rate, conf, gpa, maxCr, tags] = line.split("|");
  const r = Number(rate);
  return {
    id: i, name, state, control,
    online: Number(online),
    rate: r,
    published: conf === "P",
    gpa: gpa ? Number(gpa) : derivedGpa(r),
    maxCr: maxCr ? Number(maxCr) : 60,
    tags: tags ? tags.split(",") : [],
  };
});
export const BY_NAME = new Map(SCHOOLS.map((s) => [s.name, s]));
export const minGpaOf = (s) => (s.tags.includes("open") ? 2.0 : Math.max(2.0, round(s.gpa - 0.55, 2)));

/* ----------------------------------------------------------------- majors */

export const MAJORS = MAJOR_ROWS.split("\n").map((line) => {
  const [id, name, group, mult, shift, flags] = line.split("|");
  return { id, name, group, mult: Number(mult), shift: Number(shift), flags: flags ? flags.split(",") : [] };
});
export const MAJOR_BY_ID = new Map(MAJORS.map((m) => [m.id, m]));
export const MAJOR_GROUPS = [...new Set(MAJORS.map((m) => m.group))];

/* Accepts an id, an exact name, or something the user typed. */
export function findMajor(text) {
  if (!text) return null;
  if (MAJOR_BY_ID.has(text)) return MAJOR_BY_ID.get(text);
  const t = String(text).trim().toLowerCase();
  if (!t) return null;
  return MAJORS.find((m) => m.name.toLowerCase() === t)
    || MAJORS.find((m) => m.name.toLowerCase().startsWith(t))
    || MAJORS.find((m) => m.name.toLowerCase().includes(t))
    || null;
}

/* ------------------------------------------------------------ competition */

const SIGMA = 0.40;        // spread of transfer applicant GPAs within one school

/* How much of the decision the transcript carries at this school. */
function gpaWeight(s) {
  if (s.tags.includes("hol")) return s.control === "pub" ? 0.62 : 0.50;
  if (s.control === "pub") return 0.82;
  return 0.72;
}
/* How much of the file the model cannot see: essays as written, department
   need, the reader on the day. Wider at schools that read files closely. */
function unseen(s, major) {
  let t = s.tags.includes("hol") ? 0.95 : s.control === "pub" ? 0.72 : 0.80;
  if (major && major.flags.includes("port")) t += 0.15;
  return t;
}

/* Reconstruct the applicant pool from the admit rate and the admitted GPA.
   Admitting the top r of a normal pool lifts the admitted mean by sigma*w*lambda,
   so run that backwards to recover where the pool itself sits. */
export function poolFor(school, major) {
  const r = clamp(school.rate / 100, 0.005, 0.99);
  const w = gpaWeight(school);
  const lambda = pdf(probit(1 - r)) / r;
  const base = clamp(school.gpa - SIGMA * w * lambda, 1.9, 3.85);
  return {
    mu: clamp(base + (major ? major.shift : 0), 1.9, 3.95),
    overall: base,
    sigma: SIGMA,
    w,
    lambda,
  };
}

/* The rate that actually applies to your major at this school. */
export function majorRate(school, major) {
  let m = major ? major.mult : 1;
  if (major && m < 1 && school.tags.includes("imp")) m = Math.pow(m, 1.25);
  if (major && major.flags.includes("clin")) m *= 0.9;
  return clamp((school.rate / 100) * m, 0.002, 0.985);
}

/* ------------------------------------------------------- the file itself
 *
 * Every input is a FIELD with exactly one value, scored in standard
 * deviations of the non-transcript dimension. Your value is compared with the
 * value the typical applicant to this school carries, and the difference is
 * what the field is worth. One input, one line, always — an earlier version
 * matched factors by label, which let "associate degree complete" and
 * "associate degree in progress" both fire on the same record.
 */

const FIELDS = [
  "hours", "prereqs", "associate", "agreement", "residency",
  "origin", "record", "essays", "activities", "context", "term", "floor",
];

const FIELD_LABEL = {
  hours: "Transferable hours",
  prereqs: "Major prerequisites",
  associate: "Associate degree",
  agreement: "Transfer agreement",
  residency: "Residency",
  origin: "Where you are coming from",
  record: "Academic record",
  essays: "Essays and recommendations",
  activities: "Activities and work",
  context: "Background",
  term: "Entry term",
  floor: "Published GPA minimum",
};

const CONTEXT_WEIGHT = {
  vet: { z: 0.4, label: "veteran or active duty" },
  firstgen: { z: 0.3, label: "first-generation", holisticOnly: true },
  honors: { z: 0.35, label: "honors or Phi Theta Kappa" },
  work: { z: 0.45, label: "research or portfolio work" },
  athlete: { z: 1.5, label: "recruited athlete" },
  legacy: { z: 0.4, label: "parent alumnus", privateHolisticOnly: true },
  intl: { z: -0.8, label: "international applicant" },
};

const ASSOC_TEXT = { no: "none planned", prog: "in progress", yes: "completed" };
const PREREQ_TEXT = { all: "all complete", most: "most complete", few: "few or none" };
const RECORD_TEXT = { 0: "clean", 1: "one or two withdrawals or repeats", 2: "several withdrawals or repeats", 3: "probation or dismissal" };
const ORIGIN_TEXT = { cc: "community college", four: "four-year college", sel: "selective four-year", online: "online or adult-serving" };

/* One value per field. Monotone by construction: a better answer never scores
   below a worse one for the same field. */
function fieldValues(school, p, major) {
  const has = (t) => school.tags.includes(t);
  const pathway = has("artic") || has("catag");
  const isPublic = school.control === "pub";
  const inState = school.state === p.state;
  const holistic = has("hol") ? 1.25 : 1;
  const v = {};

  /* Completed hours, against this school's own credit cap. */
  if (p.credits > school.maxCr) v.hours = { z: -0.5, text: `${p.credits}, past the ${school.maxCr}-hour cap` };
  else if (p.credits < 12) v.hours = { z: -1.2, text: `${p.credits}, below transfer-only review` };
  else if (p.credits < 24) v.hours = { z: -0.6, text: `${p.credits}, short of the usual 24–30` };
  else if (p.credits <= 70) v.hours = { z: 0.3, text: `${p.credits}, ready for junior standing` };
  else v.hours = { z: 0.1, text: `${p.credits}, past junior standing` };

  /* Prerequisites, harder to recover from in a stacked major. */
  const seq = major && major.flags.includes("seq");
  const prereqZ = { all: 0.55 + (seq ? 0.15 : 0), most: 0, few: -0.7 - (seq ? 0.3 : 0) }[p.prereqs];
  v.prereqs = { z: prereqZ, text: PREREQ_TEXT[p.prereqs] + (seq && p.prereqs !== "all" ? " — this major stacks courses" : "") };

  /* Associate degree. One line, and completing it always beats not. */
  const assocZ = pathway && inState ? { no: 0, prog: 0.45, yes: 0.95 } : { no: 0, prog: 0.2, yes: 0.55 };
  v.associate = { z: assocZ[p.assoc], text: ASSOC_TEXT[p.assoc] + (pathway && inState && p.assoc === "yes" ? " — transfer-degree pathway applies" : "") };

  /* A signed agreement only counts where the school honours one. */
  v.agreement = p.agreement && pathway && inState
    ? { z: 0.8, text: has("catag") ? "signed, TAG / ADT priority" : "signed, state articulation guarantee" }
    : { z: 0, text: p.agreement ? "signed, but this school is outside that network" : "none" };

  v.residency = !isPublic
    ? { z: 0, text: "private — residency is not a factor" }
    : inState
      ? { z: 0.45, text: `in-state (${school.state})` }
      : { z: -0.35, text: `out-of-state (${p.state} to ${school.state})` };

  const originZ = isPublic && pathway
    ? { cc: 0.15, four: -0.12, sel: 0, online: -0.12 }
    : { cc: 0, four: 0, sel: 0.2, online: -0.1 };
  v.origin = { z: originZ[p.curtype] ?? 0, text: ORIGIN_TEXT[p.curtype] || "unknown" };

  v.record = { z: { 0: 0, 1: -0.35, 2: -0.8, 3: -1.5 }[p.blemish] ?? 0, text: RECORD_TEXT[p.blemish] };

  const portfolio = major && major.flags.includes("port");
  v.essays = {
    z: (p.essay - 3) * 0.3 * holistic,
    text: `${p.essay} of 5` + (portfolio ? " — a portfolio or audition carries this major" : holistic > 1 ? " — this school reads files closely" : ""),
  };
  v.activities = { z: (p.activity - 3) * 0.2 * holistic, text: `${p.activity} of 5` };

  let ctxZ = 0;
  const ctxNames = [];
  for (const key of p.context || []) {
    const c = CONTEXT_WEIGHT[key];
    if (!c) continue;
    if (c.holisticOnly && !has("hol")) continue;
    if (c.privateHolisticOnly && (isPublic || !has("hol"))) continue;
    ctxZ += c.z;
    ctxNames.push(c.label);
  }
  v.context = { z: ctxZ, text: ctxNames.length ? ctxNames.join(", ") : "nothing noted" };

  v.term = p.term === "spring" && !has("nospr")
    ? { z: school.rate < 40 ? -0.5 : -0.2, text: "spring — a fraction of the fall seats" }
    : { z: 0, text: p.term === "spring" ? "spring" : "fall" };

  const floor = minGpaOf(school);
  v.floor = !has("open") && p.gpa < floor
    ? { z: -1.2, text: `under the ${floor.toFixed(2)} this school works to` }
    : { z: 0, text: `clear of the ${floor.toFixed(2)} floor` };

  return v;
}

/* The applicant this school actually sees. Everything on your file is scored
   against this person, not against an empty page: being in-state at a state
   flagship is not an edge when most of the pool is in-state too. */
function typicalApplicant(school, p) {
  const pathway = school.tags.includes("artic") || school.tags.includes("catag");
  return {
    gpa: poolFor(school, findMajor(p.majorId)).mu,
    credits: 45,
    prereqs: "most",
    blemish: 0,
    curtype: pathway || school.control === "pub" ? "cc" : "four",
    state: school.control === "pub" ? school.state : "\u0000",
    assoc: "prog",
    agreement: false,
    majorId: p.majorId,
    term: "fall",
    essay: 3,
    activity: 3,
    context: [],
  };
}

/* What each field is worth: your value minus the typical applicant's. */
function fileDeltas(school, p, major) {
  const mine = fieldValues(school, p, major);
  const theirs = fieldValues(school, typicalApplicant(school, p), major);
  return FIELDS.map((key) => ({
    key,
    label: FIELD_LABEL[key],
    z: mine[key].z - theirs[key].z,
    note: `you: ${mine[key].text} · typical applicant here: ${theirs[key].text}`,
  })).filter((f) => Math.abs(f.z) > 1e-9);
}

/* ------------------------------------------------------------------ score */

export function score(school, p, withLedger = true) {
  const major = findMajor(p.majorId);
  const pool = poolFor(school, major);
  const rEff = majorRate(school, major);
  const tau = unseen(school, major);
  /* Calibrated so that averaging over the whole pool returns the admit rate. */
  const cut = probit(1 - rEff) * Math.sqrt(1 + tau * tau);
  const w = pool.w;
  const wFile = Math.sqrt(1 - w * w);

  const deltas = fileDeltas(school, p, major);
  const zFile = clamp(deltas.reduce((a, x) => a + x.z, 0), -2.5, 2.5);
  const zGpa = clamp((p.gpa - pool.mu) / pool.sigma, -4, 4);
  const open = school.tags.includes("open");
  const blocked = p.term === "spring" && school.tags.includes("nospr");

  const probOf = (zg, zf) => clamp(Phi((w * zg + wFile * clamp(zf, -2.5, 2.5) - cut) / tau), 0.004, 0.95);

  let prob;
  if (open) prob = p.gpa < 2.0 ? 0.82 : p.blemish === 3 ? 0.86 : 0.96;
  else if (blocked) prob = 0.004;
  else prob = probOf(zGpa, zFile);

  /* Attribution: what the number would be without this one line. */
  const flat = open || blocked;
  const ledger = !withLedger ? [] : [
    {
      key: "gpa",
      label: "GPA against this pool",
      z: zGpa,
      pp: flat ? 0 : prob - probOf(0, zFile),
      note: `you: ${p.gpa.toFixed(2)} · typical applicant here: ${pool.mu.toFixed(2)}`,
    },
    ...deltas.map((d) => ({ ...d, pp: flat ? 0 : prob - probOf(zGpa, zFile - d.z) })),
  ];

  /* The GPA that would put this at even odds, everything else unchanged. */
  const evenOdds = pool.mu + pool.sigma * ((cut - wFile * zFile) / w);

  return {
    school, major, prob, pool, rEff, tau, cut, zGpa, zFile,
    composite: w * zGpa + wFile * zFile,
    standing: Phi(w * zGpa + wFile * zFile),
    gpaPercentile: Phi(zGpa),
    cutPercentile: 1 - rEff,
    perSeat: 1 / rEff,
    evenOdds,
    open, blocked,
    factors: ledger,
    tier: tierOf(prob),
  };
}

export function tierOf(p) {
  if (p >= 0.7) return { key: "likely", label: "Likely" };
  if (p >= 0.4) return { key: "target", label: "Target" };
  if (p >= 0.15) return { key: "reach", label: "Reach" };
  return { key: "longshot", label: "Long shot" };
}

export function levers(school, p) {
  const now = score(school, p).prob;
  const out = [];
  const test = (label, mutate) => {
    const alt = structuredClone(p);
    mutate(alt);
    out.push({ label, gain: score(school, alt).prob - now });
  };
  if (p.gpa < 4.0) test(`Raise your GPA to ${Math.min(4, round(p.gpa + 0.25, 2)).toFixed(2)}`, (a) => (a.gpa = Math.min(4, a.gpa + 0.25)));
  if (p.prereqs !== "all") test("Finish every major prerequisite", (a) => (a.prereqs = "all"));
  if (p.assoc !== "yes") test("Complete the associate degree", (a) => (a.assoc = "yes"));
  if (!p.agreement) test("Sign the transfer agreement for this system", (a) => (a.agreement = true));
  if (p.credits < 30) test("Reach 30 transferable hours", (a) => (a.credits = 30));
  if (p.term === "spring") test("Apply for fall instead of spring", (a) => (a.term = "fall"));
  if (p.essay < 5) test("Bring the essays and letters up a level", (a) => (a.essay = Math.min(5, a.essay + 1)));
  const major = findMajor(p.majorId);
  if (major && major.mult < 0.85) test("Apply to a less impacted major at this school", (a) => (a.majorId = "undeclared"));
  return out.filter((t) => t.gain > 0.005).sort((a, b) => b.gain - a.gain).slice(0, 3);
}
