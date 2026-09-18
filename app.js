import {
  SCHOOLS, BY_NAME, MAJORS, MAJOR_GROUPS, findMajor,
  score, levers, minGpaOf, TAG_LABEL, clamp,
} from "./model.js";
import { searchIndex, matches, relevance } from "./aliases.js";
import { deadlineFor, daysUntil, verifyLinks } from "./deadlines.js";
import { shareLink, decodeProfile, readHash } from "./share.js";
import { loadPrograms, programsReady, PROGRAM_SORTS } from "./program-model.js";
import { buildSlate } from "./fit.js";
import { costFor, INCOME_BANDS } from "./cost-model.js";
import { policyFor } from "./transfer-policy.js";

/* ----------------------------------------------------------- reference */

const STATES = [...new Set(SCHOOLS.map((s) => s.state))].sort();
const STATE_NAMES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado",
  CT: "Connecticut", DE: "Delaware", DC: "Washington, DC", FL: "Florida", GA: "Georgia", GU: "Guam",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky",
  LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota",
  OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", PR: "Puerto Rico", RI: "Rhode Island",
  SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};
const CONTEXT_OPTIONS = [
  ["vet", "Veteran or active duty"],
  ["firstgen", "First-generation"],
  ["honors", "Honors / Phi Theta Kappa"],
  ["work", "Research or portfolio"],
  ["athlete", "Recruited athlete"],
  ["legacy", "Parent alumnus"],
  ["intl", "International applicant"],
];
const FLAG_NOTE = {
  port: "portfolio or audition carries real weight",
  clin: "clinical seats cap the cohort",
  dir: "usually admits to the major, not the university",
  seq: "locked prerequisite sequence",
};
const LEGACY_MAJOR = {
  cs: "cs", eng: "mecheng", bus: "bizadmin", nurs: "nursing", bio: "biology",
  soc: "socsci", hum: "arthum", art: "artstudio", edu: "elemed", und: "undeclared",
};

/* A new visitor starts from nothing: no schools, no borrowed numbers. The
   walkthrough below fills the four fields that matter before the first
   school is ever scored. Everything here is a neutral starting point for a
   control, not a claim about anybody. */
const BLANK = {
  gpa: 3.0, credits: 30, prereqs: "most", blemish: 0,
  current: "", curtype: "cc", state: "CA", assoc: "prog",
  agreement: false, majorId: "undeclared", term: "fall",
  essay: 3, activity: 3, context: [], list: [],
  /* Empty means "prefer not to say", and the average net price stands in.
     Deliberately absent from share.js's key map: a link you send a friend
     should not carry your household income. */
  income: "",
};

/* Built once: everything each school can be found by. */
const INDEX = new Map(SCHOOLS.map((s) => [s.name, searchIndex(s, STATE_NAMES[s.state])]));

const KEY = "matriculate:v1";
const SEEN_KEY = "matriculate:walkthrough:v1";
/* The site was called Transfer Odds when this key name was chosen. Read-only
   fallbacks so a record or a "seen the walkthrough" flag saved under the old
   name is not simply gone — the first save under either afterward moves it to
   the new key on its own, with nothing to run once and nothing to clean up. */
const OLD_KEY = "transfer-odds:v1";
const OLD_SEEN_KEY = "transfer-odds:walkthrough:v1";
/* ?fresh — the whole page behaves as though this browser had never been here:
   the walkthrough runs on every load, the answers start blank, and nothing is
   written to storage, so a real record survives being previewed over. It is
   for looking at the first-run experience repeatedly without clearing site
   data between goes, and it costs an ordinary visitor nothing. */
const PREVIEW = new URLSearchParams(location.search).has("fresh");
const saved = PREVIEW ? null : load();
let profile = saved || structuredClone(BLANK);
let viewingShared = false;

function load() {
  try {
    const raw = localStorage.getItem(KEY) || localStorage.getItem(OLD_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p.majorId && p.major) p.majorId = LEGACY_MAJOR[p.major] || "undeclared";
    return { ...structuredClone(BLANK), ...p };
  } catch { return null; }
}
function save() {
  if (PREVIEW) {
    el("savedstate").textContent = "preview — not saved";
    return;
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
    el("savedstate").textContent = "saved " + new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    el("savedstate").textContent = "storage unavailable";
  }
}


/* -------------------------------------------------------------- programs
 *
 * The program table is 370 KB and most visits never open it, so it is fetched
 * the first time something on screen needs it: the Programs pane, or a school
 * card being expanded. Until then every view renders without it and says so
 * rather than sitting blank.
 */

let PROG = null;
let progLoading = null;
/* Explore hides schools that report no degrees in your major. This is the way
   back for anyone who wants the full table anyway — a school filing a
   programme under a code we do not reach should not be unreachable. */
let showUnoffered = false;
/* The pane follows the record's major until you type another one into it, at
   which point the choice is yours and stops being overwritten. */
let programMajorPinned = false;

function ensurePrograms() {
  if (PROG) return Promise.resolve(PROG);
  if (progLoading) return progLoading;
  el("progstate").textContent = "loading…";
  progLoading = loadPrograms().then((p) => {
    PROG = p;
    el("progstate").textContent = `${p.programCount.toLocaleString()} programs`;
    render();
    return p;
  }).catch(() => {
    el("progstate").textContent = "unavailable";
    progLoading = null;
    return null;
  });
  return progLoading;
}

const money = (v) => (v === null || v === undefined ? "—" : "$" + Math.round(v).toLocaleString());
const mult = (v) => (v === null || v === undefined ? "—" : v.toFixed(2) + "×");

/* One shared vocabulary for the comparison numbers, so a figure means the same
   thing on a school card as it does in the ranked list. */
function indexWord(v) {
  if (v === null) return { word: "not published", key: "none" };
  if (v >= 1.25) return { word: "well above", key: "likely" };
  if (v >= 1.05) return { word: "above", key: "likely" };
  if (v >= 0.95) return { word: "about level with", key: "target" };
  if (v >= 0.8) return { word: "below", key: "reach" };
  return { word: "well below", key: "reach" };
}

function syncProgramMajor() {
  if (programMajorPinned) return;
  const m = findMajor(profile.majorId);
  el("pmajor").value = m ? m.name : "";
}

function progMajorId() {
  const typed = el("pmajor").value.trim();
  const m = findMajor(typed);
  return m ? m.id : profile.majorId;
}

function renderPrograms() {
  const node = el("progresults"), head = el("profield");
  syncProgramMajor();
  if (!PROG) {
    head.innerHTML = "";
    node.innerHTML = `<li class="empty glass" style="padding:28px 20px">Loading the federal program tables…</li>`;
    return;
  }

  const majorId = progMajorId();
  const major = findMajor(majorId);
  const data = PROG.major(majorId);
  const sortKey = el("psort").value || "outcome";
  const sort = PROGRAM_SORTS[sortKey];
  el("psortnote").textContent = sort.note;

  if (!data) {
    head.innerHTML = `<p class="empty glass" style="padding:28px 20px;margin:0 18px">
      <b>${esc(major ? major.name : majorId)}</b> has no bachelor's field of its own in the federal data, so there is
      nothing here to rank. Majors like this are usually recorded under a broader field, or are a pathway rather than
      a degree.</p>`;
    node.innerHTML = "";
    return;
  }

  const minAwards = Number(el("pmin").value);
  const fstate = el("pstate").value;
  const scope = el("pscope").value;

  let rows = PROG.schoolsForMajor(majorId, { minAwards, earningsOnly: sort.needsEarnings });
  if (sort.needsState) rows = rows.filter((p) => p.localIndex !== null);
  if (fstate) rows = rows.filter((p) => p.school.state === fstate);
  if (scope === "list") rows = rows.filter((p) => profile.list.includes(p.school.name));
  if (scope === "odds") rows = rows.filter((p) => score(p.school, profile, false).prob >= 0.2);
  rows = [...rows].sort(sort.cmp);

  head.innerHTML = `<div class="fieldcard clay">
    <div class="fc-main">
      <b>${esc(major ? major.name : majorId)}</b>
      <span>${data.natAwards.toLocaleString()} bachelor's degrees a year nationally${
        data.fields.length > 1
          ? `, recorded under ${data.fields.length} federal fields — ${data.fields.map((f) => esc(f.title)).join(", ")}`
          : `, federal field <i>${esc(data.fields[0].title)}</i>`}.</span>
    </div>
    <div class="fc-num">
      <b>${money(data.natEarn)}</b>
      <span>national median, one year out</span>
    </div>
  </div>`;

  if (rows.length === 0) {
    node.innerHTML = `<li class="empty glass" style="padding:28px 20px">Nothing matches those filters. ${
      sort.needsEarnings ? "This ranking needs published earnings, which the Department suppresses for small programs — try a smaller minimum size, or rank by program size instead." : "Try a smaller minimum size."}</li>`;
    return;
  }

  const shown = rows.slice(0, 100);
  node.innerHTML = shown.map((p, i) => progRow(p, i, sortKey)).join("")
    + (rows.length > shown.length ? `<li class="empty">${rows.length - shown.length} more match. Narrow it down to see them.</li>` : "");

  node.querySelectorAll("[data-add]").forEach((b) =>
    b.addEventListener("click", () => {
      if (profile.list.includes(b.dataset.add)) return;
      profile.list = [...profile.list, b.dataset.add];
      touched();
    }));
}

function progRow(p, i, sortKey) {
  const s = p.school;
  const r = score(s, profile, false);
  const added = profile.list.includes(s.name);
  const lead =
    sortKey === "size" ? { v: p.awards.toLocaleString(), u: "degrees a year" }
    : sortKey === "focus" ? { v: p.focus ? p.focus.toFixed(1) + "×" : "—", u: "the national share" }
    : sortKey === "burden" ? { v: p.burden ? p.burden.toFixed(2) : "—", u: "debt per dollar earned" }
    : sortKey === "local" ? { v: mult(p.localIndex), u: "of the " + s.state + " median" }
    : sortKey === "earnings" ? { v: money(p.earn1), u: "one year out" }
    : { v: mult(p.index), u: "of the national median" };

  const bits = [];
  bits.push(`${p.awards.toLocaleString()} degrees a year`);
  if (p.earn1) bits.push(`${money(p.earn1)} median`);
  if (p.index) bits.push(`${indexWord(p.index).word} the national median`);
  if (p.localIndex) bits.push(`${indexWord(p.localIndex).word} the ${s.state} median for the field`);
  if (p.focus && p.focus >= 2) bits.push(`${p.focus.toFixed(1)}× as central to this campus as to the average one`);
  if (p.burden) bits.push(`${p.burden.toFixed(2)} debt per dollar of first-year pay`);
  if (!p.earn1) bits.push(`earnings not published — the graduating cohort is too small to report safely`);
  if (p.split) bits.push(`the money covers the ${p.sourceAwards.toLocaleString()} in ${esc(p.source.title)}`);

  return `<li class="progrow">
    <span class="rank">${i + 1}</span>
    <div class="pr-main">
      <div class="name">${esc(s.name)}</div>
      <div class="meta">${s.state} · ${controlOf(s)}${s.online === 2 ? " · online" : ""}</div>
      <div class="pr-bits">${bits.map((b) => `<span>${b}</span>`).join("")}</div>
    </div>
    <div class="pr-lead"><b>${lead.v}</b><small>${esc(lead.u)}</small></div>
    <div class="pr-odds">
      <div class="odds t-${r.tier.key}">${pct(r.prob)}%<small>your odds</small></div>
      <button type="button" class="btn sm" data-add="${esc(s.name)}" ${added ? "disabled" : ""}>${added ? "added" : "Add"}</button>
    </div>
  </li>`;
}


/* Cost and completion: the two things the odds model is silent about.
 *
 * Net price leads, because it is the number a family decides on and the one
 * nobody quotes — sticker price is shown beside it only to make the gap
 * visible. The graduation rate is shown with its caveat attached rather than
 * in a footnote: it counts first-time, full-time students, so it excludes
 * every reader of this app by construction.
 */
function costSection(s) {
  const c = costFor(s, profile.income);
  if (!c || (c.net === null && c.gradRate === null)) return "";

  const band = INCOME_BANDS.find(([k]) => k === profile.income);
  const sticker = s.state === profile.state ? c.tuitionIn : c.tuitionOut;
  const stickerLabel = s.state === profile.state ? "in-state" : "out-of-state";

  const rows = [];

  if (c.net !== null) {
    rows.push(`<tr><td class="g">What it actually costs</td><td class="d">${
        c.aidExceedsCost ? "+" + money(Math.abs(c.net)) : money(c.net)}</td>
      <td class="n">${c.aidExceedsCost
        ? `grant aid here exceeds the whole cost of attendance, so a student in this band is <b>paid</b> roughly this much a year rather than charged. `
        : "a year after grant aid, "}${
        c.basis === "band"
          ? `for a household earning <b>${esc(band[1].toLowerCase())}</b>`
          : `averaged across every income — <button type="button" class="linky" data-tab="record">tell it your income</button> for the figure that applies to you`}${
        sticker !== null
          ? `. That is the <b>whole</b> cost of a year — housing, books and living included — against ${money(sticker)} of ${stickerLabel} tuition and fees alone, which is why it can be the larger number`
          : ""}</td></tr>`);
  }
  if (c.nonResidentGap !== null && s.state !== profile.state) {
    rows.push(`<tr><td class="g">Non-resident premium</td><td class="d">+${money(c.nonResidentGap)}</td>
      <td class="n">what this school charges out-of-state students above its own residents, before aid</td></tr>`);
  }
  if (c.gradRate !== null) {
    rows.push(`<tr><td class="g">Who finishes</td><td class="d">${c.gradRate}%</td>
      <td class="n">of first-time, full-time students graduate within six years. That count <b>excludes transfer students</b> — it describes the campus you would be joining, not people arriving the way you are</td></tr>`);
  }
  if (c.retention !== null) {
    rows.push(`<tr><td class="g">Who comes back</td><td class="d">${c.retention}%</td>
      <td class="n">of full-time students return for a second year${
        c.retention < 70 ? " — low enough to be worth asking the school about" : ""}</td></tr>`);
  }

  return `<h4>Cost and completion</h4><table class="ledger"><tbody>${rows.join("")}</tbody></table>`;
}

/* Will my credits transfer.
 *
 * Course-by-course articulation is not public data anywhere in the country, so
 * this section does not pretend to answer per course. What it answers is the
 * layer that IS in statute: whether your state guarantees admission, junior
 * standing, or a general education block, and whether this particular school is
 * bound by it. Where a state has no such policy on record, the section is not
 * rendered at all — an empty space being more honest than a hedge.
 */
function transferSection(s) {
  const p = policyFor(s, profile);
  if (!p) return "";

  const verdict =
    p.binds === true
      ? `<span class="flag good">this school is covered</span>`
      : p.binds === false
      ? `<span class="flag warn">this school is outside it</span>`
      : `<span class="flag">participation is per-institution — check</span>`;

  /* A definition list rather than the numeric ledger used elsewhere: here the
     prose IS the value, and the ledger drops its note column on phones. */
  const rows = [
    ["Admission", p.admission],
    ["Credit", p.credits],
    ...(p.note ? [["Note", p.note]] : []),
  ].map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("");

  return `<h4>Will my credits transfer</h4>
    <p class="policyline"><b>${esc(p.name)}</b> ${verdict}
      <small>${esc(p.authority)} · read ${esc(p.verified)}</small></p>
    <dl class="policy">${rows}</dl>
    <p class="sources"><a href="${p.source}" target="_blank" rel="noopener noreferrer">Read the policy itself<small>${
      esc(new URL(p.source).host.replace(/^www\./, ""))} — the wording that governs, not this summary</small></a></p>`;
}

/* The program block inside a school card: what this campus does in your major,
   and what it does best overall. */
function programSection(s, majorId) {
  if (!PROG) return `<h4>Program strength</h4><p class="sources"><i>loading the federal program tables…</i></p>`;
  const p = PROG.at(s, majorId);
  const major = findMajor(majorId);
  if (!p) {
    const strong = PROG.strongestAt(s).slice(0, 3);
    return `<h4>Program strength</h4>
      <p style="margin:0 0 8px;font-size:0.75rem;color:var(--ink-2);max-width:60ch">This school reported no bachelor's degrees in ${
        esc(major ? major.name : "your major")} to the Department of Education last year, so either it does not run the
        program or it records it under a field this table does not reach.</p>
      ${strong.length ? `<p class="sources" style="display:block;font-size:0.72rem;color:var(--ink-3)">Its graduates earn most against their field in: ${
        strong.map((x) => `${esc(findMajor(x.majorId)?.name || x.majorId)} (${mult(x.index)})`).join(", ")}.</p>` : ""}`;
  }

  const ranked = PROG.schoolsForMajor(majorId, { minAwards: 0, earningsOnly: true }).sort(PROGRAM_SORTS.outcome.cmp);
  const place = p.index === null ? null : ranked.findIndex((x) => x.school.name === s.name) + 1;

  return `<h4>Program strength</h4>
    <table class="ledger"><tbody>
      <tr><td class="g">Size of the program</td><td class="d">${p.awards.toLocaleString()}</td>
        <td class="n">bachelor's degrees awarded here last year in ${esc(p.major.fields.map((f) => f.title).join(" and "))}${
          p.focus ? `, which is ${p.focus.toFixed(1)}× as large a share of this campus as the field is nationally` : ""}</td></tr>
      ${p.earn1 ? `
      <tr><td class="g">Earnings, one year out</td><td class="d">${money(p.earn1)}</td>
        <td class="n">median for this program's graduates, ${indexWord(p.index).word} the ${money(p.major.natEarn)} national median for the field${
          p.split ? ` — measured on the ${p.sourceAwards.toLocaleString()} in ${esc(p.source.title)}` : ""}</td></tr>
      ${p.localIndex ? `
      <tr><td class="g">Against ${s.state}</td><td class="d">${mult(p.localIndex)}</td>
        <td class="n">the same figure against the ${money(p.stateEarn)} median for this field in ${s.state}, across ${p.statePrograms} programs — the comparison that is about the school rather than the state</td></tr>` : ""}
      ${p.earn2 ? `
      <tr><td class="g">Two years out</td><td class="d">${money(p.earn2)}</td>
        <td class="n">${p.earn2 > p.earn1 ? `up ${Math.round(((p.earn2 - p.earn1) / p.earn1) * 100)}%` : "little changed"} from the first year</td></tr>` : ""}
      ${p.debt ? `
      <tr><td class="g">Debt at graduation</td><td class="d">${money(p.debt)}</td>
        <td class="n">median federal loan debt for completers, ${p.burden.toFixed(2)} for every dollar of first-year pay${
          p.burden <= 1 ? " — generally considered manageable" : " — above the one-to-one line usually treated as the limit"}</td></tr>` : ""}
      ${place ? `
      <tr><td class="g">Among all ${SCHOOLS.length} schools here</td><td class="d">#${place}</td>
        <td class="n">of the ${ranked.length} in this database that publish earnings for this field</td></tr>` : ""}
      ` : `
      <tr><td class="g">Earnings</td><td class="d">—</td>
        <td class="n">not published. The Department suppresses any figure drawn from too few graduates to report without identifying them, so this is a statement about the cohort's size, not its outcome</td></tr>`}
    </tbody></table>`;
}


/* ------------------------------------------------------------- best fits
 *
 * The walkthrough ends here rather than on an empty list. Twelve schools that
 * run your major, spread across what you could actually get into, each one
 * saying why it is on the page. Nothing is added to the list until it is
 * added on purpose — the old build filled the list for you, which meant the
 * first thing anybody saw was eight schools that were nobody's.
 */

let slate = null;

function renderFits() {
  const node = el("fitresults");
  if (!PROG) {
    el("fitcount").textContent = "";
    node.innerHTML = `<p class="empty glass" style="padding:28px 20px;margin:12px 18px">Reading the federal program tables…</p>`;
    return;
  }

  const major = findMajor(profile.majorId);
  slate = buildSlate(profile, PROG, {
    scope: el("fitscope").value,
    includeOnline: el("fitonline").value === "yes",
  });
  renderScopeNote();

  el("fitcount").textContent = slate.total ? `${slate.total} of ${slate.considered} that run it` : "";

  if (!slate.total) {
    el("fitscopenote").textContent = "";
    /* An empty page is a dead end, and the two settings that produce one are
       both defaults, so the way out has to be on the page rather than in a
       dropdown the reader has to think to reopen. Which cause is named
       depends on which setting is actually doing the excluding. */
    const where = esc(STATE_NAMES[profile.state] || profile.state);
    const majorLabel = esc(major ? major.name : profile.majorId);
    const campusOnly = el("fitonline").value === "no";
    const wider = [];
    if (slate.scope === "state") wider.push(`<button type="button" class="btn sm" data-widen="scope">Look beyond ${where}</button>`);
    if (campusOnly) wider.push(`<button type="button" class="btn sm" data-widen="online">Include online universities</button>`);

    node.innerHTML = `<p class="empty glass" style="padding:28px 20px;margin:12px 18px">
      ${!slate.covered
        ? `<b>${majorLabel}</b> has no bachelor's field of its own in the federal data, so there is no way to tell which schools run it. Pick a nearer major in your record, or search all ${SCHOOLS.length} schools in <b>Explore</b>.`
        : slate.scope === "state"
          ? `No ${campusOnly ? "campus " : ""}school in ${where} reported bachelor's degrees in <b>${majorLabel}</b> last year.${
              campusOnly ? " It is a rare enough subject that few states have one." : ""}`
          : `No school matched <b>${majorLabel}</b> under these filters.`}
      ${wider.length ? `<span style="display:block;margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;justify-content:center">${wider.join("")}</span>` : ""}
    </p>`;

    node.querySelectorAll("[data-widen]").forEach((btn) =>
      btn.addEventListener("click", () => {
        if (btn.dataset.widen === "scope") el("fitscope").value = "prefer";
        else el("fitonline").value = "yes";
        renderFits();
      }));
    return;
  }

  const unadded = slate.bands.flatMap((b) => b.rows).filter((c) => !profile.list.includes(c.school.name));
  el("fitaddall").textContent = unadded.length ? `Add ${unadded.length} to my list` : "All added";
  el("fitaddall").disabled = unadded.length === 0;

  node.innerHTML = slate.bands.map((band) => `
    <section class="fitband">
      <h3><span class="dot t-${band.key}"></span>${esc(band.label)}
        <small>${band.key === "likely" ? "better than 3 in 5" : band.key === "target" ? "1 in 3 to 3 in 5" : band.key === "reach" ? "1 in 8 to 1 in 3" : "under 1 in 8"}</small></h3>
      <ul>${band.rows.map((c) => fitRow(c)).join("")}</ul>
    </section>`).join("");

  node.querySelectorAll("[data-add]").forEach((b) =>
    b.addEventListener("click", () => {
      if (profile.list.includes(b.dataset.add)) return;
      profile.list = [...profile.list, b.dataset.add];
      touched();
    }));
}

/* What the residency setting managed, in a sentence. A control that silently
   fails to do what its label says is worse than no control. */
function renderScopeNote() {
  const node = el("fitscopenote");
  const where = STATE_NAMES[profile.state] || profile.state;
  if (!slate || !slate.total) { node.textContent = ""; return; }
  if (slate.scope === "any") {
    node.textContent = `Ranked on the programs alone — residency is not being considered.`;
    return;
  }
  const n = slate.homeAvailable;
  const run = n === 1 ? "runs" : "run";
  if (slate.scope === "state") {
    node.textContent = `Showing ${where} only — ${slate.total} of the ${n} school${n === 1 ? "" : "s"} there that ${run} this major`
      + (slate.total < n ? `, the strongest at each level of reach.` : `.`)
      + (slate.total < 6 ? ` Switch to preferring ${where} above to fill the list out with schools elsewhere.` : "");
    return;
  }
  const away = slate.total - slate.homeShown;
  node.textContent = n === 0
    ? `No school in ${where} in this database runs this major, so every suggestion is from elsewhere.`
    : away === 0
      ? `All ${slate.total} are in ${where}.`
      : `${slate.homeShown} of ${slate.total} ${slate.homeShown === 1 ? "is" : "are"} in ${where}, from the ${n} there that ${run} this major. The other ${away} ${away === 1 ? "is" : "are"} from elsewhere because ${reasonAway(slate, where)}.`;
}

/* Why a preferred list is not entirely local. Three different things can be
   true and they are not interchangeable — saying the state had nothing more
   when it had thirty more would be a plain untruth. */
function reasonAway(slate, where) {
  if (slate.homeAvailable <= slate.homeShown) return `${where} has no more`;
  if (slate.homeShown >= slate.homeReachable) {
    return `the rest of ${where} sits at a level of reach this list is already full on`;
  }
  return `past the half held for ${where}, schools elsewhere ranked higher on the programs`;
}

function fitRow(c) {
  const s = c.school;
  const added = profile.list.includes(s.name);
  return `<li class="fitrow">
    <div class="fr-odds t-${c.r.tier.key}"><b>${pct(c.r.prob)}%</b><small>${esc(c.r.tier.label)}</small></div>
    <div class="fr-main">
      <div class="name">${esc(s.name)}</div>
      <div class="meta">${s.state} · ${controlOf(s)}${s.online === 2 ? " · primarily online" : ""} · ${s.rate}% transfer rate${s.published ? "" : " (est.)"}</div>
      <ul class="fr-why">${c.why.map((w) => `<li>${w}</li>`).join("")}</ul>
      ${c.caution.length ? `<ul class="fr-caution">${c.caution.map((w) => `<li>${w}</li>`).join("")}</ul>` : ""}
    </div>
    <button type="button" class="btn sm" data-add="${esc(s.name)}" ${added ? "disabled" : ""}>${added ? "added" : "Add"}</button>
  </li>`;
}

/* ---------------------------------------------------------------- utils */

const el = (id) => document.getElementById(id);
const pct = (v) => (v >= 0.095 ? Math.round(v * 100) : (v * 100).toFixed(1));
const ord = (v) => {
  const n = Math.max(1, Math.round(v * 100));
  const s = ["th", "st", "nd", "rd"][n % 100 > 10 && n % 100 < 14 ? 0 : Math.min(n % 10, 4) % 4] || "th";
  return n + s;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const controlOf = (s) => (s.control === "pub" ? "public" : s.control === "pri" ? "private" : "for-profit");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
const fine = window.matchMedia("(hover: hover) and (pointer: fine)");

/* ------------------------------------------------------------- build UI */

function buildStatic() {
  el("dbcount").textContent = SCHOOLS.length;
  el("majorcount").textContent = MAJORS.length;
  el("majorcount2").textContent = MAJORS.length;
  el("major").placeholder = `Search ${MAJORS.length} majors`;
  el("q").placeholder = "Search by name, nickname or state";

  const opts = STATES.map((s) => `<option value="${s}">${STATE_NAMES[s] || s}</option>`).join("");
  el("state").innerHTML = opts;
  el("fstate").innerHTML = `<option value="">All states</option>` + opts;
  el("pstate").innerHTML = `<option value="">All states</option>` + opts;
  el("income").innerHTML = `<option value="">Prefer not to say — show the average</option>`
    + INCOME_BANDS.map(([k, label]) => `<option value="${k}">${label}</option>`).join("");
  el("psort").innerHTML = Object.entries(PROGRAM_SORTS)
    .map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join("");
  el("majorlist").innerHTML = MAJOR_GROUPS.map((g) =>
    MAJORS.filter((m) => m.group === g).map((m) => `<option value="${esc(m.name)}">${esc(g)}</option>`).join("")).join("");

  for (const id of ["essay", "activity"]) {
    el(id).innerHTML = [1, 2, 3, 4, 5].map((n) => `<button type="button" value="${n}" aria-label="${n} of 5">${n}</button>`).join("");
    el(id).addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      profile[id] = Number(b.value);
      touched();
    });
  }
  el("context").innerHTML = CONTEXT_OPTIONS
    .map(([k, label]) => `<label class="chip"><input type="checkbox" value="${k}" data-ctx> ${label}</label>`).join("");
  el("context").addEventListener("change", () => {
    profile.context = [...el("context").querySelectorAll("[data-ctx]:checked")].map((i) => i.value);
    touched();
  });
}

/* Never write to the control the user is typing in. */
function setField(id, value) {
  const node = el(id);
  if (node !== document.activeElement && node.value !== String(value)) node.value = value;
}

function syncForm() {
  setField("gpa", profile.gpa);
  setField("credits", profile.credits);
  setField("prereqs", profile.prereqs);
  setField("blemish", String(profile.blemish));
  setField("current", profile.current);
  setField("curtype", profile.curtype);
  setField("state", profile.state);
  setField("assoc", profile.assoc);
  setField("income", profile.income || "");
  el("agreement").checked = profile.agreement;
  const major = findMajor(profile.majorId);
  setField("major", major ? major.name : profile.majorId || "");
  setField("term", profile.term);
  for (const id of ["essay", "activity"]) {
    el(id).querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.value) === profile[id])));
  }
  el("context").querySelectorAll("[data-ctx]").forEach((i) => (i.checked = profile.context.includes(i.value)));
  renderMajorNote(major);
}

function readForm() {
  profile.gpa = clamp(Number(el("gpa").value) || 0, 0, 4.3);
  profile.credits = Math.round(clamp(Number(el("credits").value) || 0, 0, 200));
  profile.prereqs = el("prereqs").value;
  profile.blemish = Number(el("blemish").value);
  profile.current = el("current").value;
  profile.curtype = el("curtype").value;
  profile.state = el("state").value;
  profile.assoc = el("assoc").value;
  profile.income = el("income").value;
  profile.agreement = el("agreement").checked;
  const m = findMajor(el("major").value);
  profile.majorId = m ? m.id : el("major").value;
  profile.term = el("term").value;
}

function renderMajorNote(major) {
  const node = el("majornote");
  if (!major) {
    node.innerHTML = el("major").value.trim()
      ? `<span class="warn">Not in the majors table — scored as a general major.</span>`
      : `Type to search the majors table.`;
    return;
  }
  const bits = [];
  const m = Math.round(major.mult * 100);
  bits.push(m < 95 ? `admits at roughly <b>${m}%</b> of the school's overall transfer rate`
    : m > 105 ? `admits at roughly <b>${m}%</b> of the overall rate` : `admits at about the university's own rate`);
  if (major.shift >= 0.05) bits.push(`its applicants run <b>${major.shift.toFixed(2)}</b> GPA points stronger`);
  if (major.shift <= -0.05) bits.push(`its applicants run <b>${Math.abs(major.shift).toFixed(2)}</b> GPA points weaker`);
  major.flags.forEach((f) => FLAG_NOTE[f] && bits.push(FLAG_NOTE[f]));
  node.innerHTML = `<b>${esc(major.group)}.</b> ${bits.join(" · ")}.`;
}

/* The record pane carries one line of standing advice. A shared record
   replaces it while you are looking at someone else's numbers. */
function resetBanner() {
  const b = el("banner");
  b.className = "hint";
  b.hidden = false;
  b.innerHTML = PREVIEW
    ? `<b>Preview mode.</b> This page is pretending you have never been here, and is saving nothing —
       your real record is untouched. Drop <code>?fresh</code> from the address to go back to it.
       <button type="button" class="linky" id="rewalk">Run the setup questions again</button>`
    : `This record saves itself in this browser as you change it, and never leaves it.
       <button type="button" class="linky" id="rewalk">Run the setup questions again</button>`;
  el("rewalk").addEventListener("click", () => startWalkthrough({ force: true }));
}

function touched() {
  /* Adding a school is a deliberate act, and losing twelve of them to a closed
     tab because a Save button went unpressed is not a reasonable thing to ask
     of anybody. So the record keeps itself — except while you are looking at
     somebody else's, where writing it down would overwrite your own. */
  if (!viewingShared) save();
  render();
}

/* ------------------------------------------------------------- sharing */

async function adoptSharedRecord() {
  const code = readHash();
  if (!code) return false;
  const shared = await decodeProfile(code, (name) => BY_NAME.has(name));
  if (!shared) return false;
  profile = { ...structuredClone(BLANK), ...shared };
  viewingShared = true;
  el("banner").hidden = false;
  el("banner").className = "hint shared";
  el("banner").innerHTML = `You are looking at a <b>shared record</b>, not your own. Change anything to try your numbers on it —
    nothing here is saved until you press Save record.
    <button type="button" class="linky" id="mine">Open my own record instead</button>`;
  el("mine").addEventListener("click", () => {
    viewingShared = false;
    history.replaceState(null, "", location.pathname + location.search);
    profile = load() || structuredClone(BLANK);
    resetBanner();
    render();
    /* Nothing of their own to fall back to — start them where a first-time
       visitor starts. It declines on its own if they have been here before. */
    startWalkthrough();
  });
  return true;
}

async function copyShareLink() {
  readForm();
  const { url, caveat } = await shareLink(profile);
  const box = el("sharebox");
  box.hidden = false;
  el("shareurl").value = url;
  el("shareurl").select();
  let said = "Copied — paste it to anyone.";
  try { await navigator.clipboard.writeText(url); }
  catch { said = "Select the link above and copy it."; }
  el("sharenote").textContent = caveat ? caveat : said;
}

/* ------------------------------------------------------------ rendering */

let lastSignature = "";

function render() {
  syncForm();
  renderList();
  renderResults();
  renderPrograms();
  renderFits();
}

function renderList() {
  const results = profile.list.map((n) => BY_NAME.get(n)).filter(Boolean)
    .map((s) => score(s, profile)).sort((a, b) => b.prob - a.prob);

  renderHero(results[0], results.length);
  renderTiles(results);
  renderDeadlines(results);

  const signature = profile.list.join("|");
  const fresh = signature !== lastSignature;
  lastSignature = signature;

  if (results.length === 0) {
    el("cards").innerHTML = `<p class="empty glass" style="padding:40px 20px">No schools yet. <b>Best fits</b> has suggestions built from your record, or search all ${SCHOOLS.length} in <b>Explore</b>.</p>`;
    return;
  }
  /* An expanded card stays expanded when the list is redrawn — a keystroke in
     the record should not close what you were reading. */
  const wasOpen = new Set([...el("cards").querySelectorAll("details[open]")].map((d) => d.dataset.school));
  el("cards").innerHTML = results.map((r, i) => cardHtml(r, i, fresh)).join("");
  el("cards").querySelectorAll("details").forEach((d) => {
    if (wasOpen.has(d.dataset.school)) d.open = true;
    /* The program tables are only worth fetching once somebody opens a card. */
    d.addEventListener("toggle", () => { if (d.open) ensurePrograms(); });
  });
  el("cards").querySelectorAll("[data-rm]").forEach((b) =>
    b.addEventListener("click", (e) => {
      e.preventDefault();
      profile.list = profile.list.filter((n) => n !== b.dataset.rm);
      touched();
    }));
}

const CIRC = 2 * Math.PI * 44;

function renderHero(top, count) {
  const arc = el("arc");
  if (!top) {
    arc.style.strokeDashoffset = CIRC;
    arc.style.stroke = "var(--longshot-fill)";
    el("corenum").textContent = "—";
    el("corelab").textContent = "no list";
    el("heroname").textContent = "Add a school to begin";
    el("herocopy").textContent = "Every school is scored against the pool you would actually compete with there: the transfer applicants to your major, at that campus, in that cycle.";
    return;
  }
  arc.style.strokeDashoffset = CIRC * (1 - top.prob);
  arc.style.stroke = `var(--${top.tier.key}-fill)`;
  el("corenum").textContent = pct(top.prob) + "%";
  el("corelab").textContent = top.tier.label;
  el("heroname").textContent = top.school.name;
  const majorName = top.major ? top.major.name : "your major";
  el("herocopy").textContent = top.open
    ? `Open admission. With your transcript in hand this is an evaluation of your credits, not a competition for seats. ${count - 1} other school${count === 2 ? "" : "s"} on your list are scored against their own pools.`
    : `${majorName} here admits about ${(top.rEff * 100).toFixed(0)}% of transfer applicants, roughly ${top.perSeat.toFixed(1)} of them per seat. You sit at the ${ord(top.standing)} percentile of that pool; admission sits near the ${ord(top.cutPercentile)}.`;
}

function renderTiles(results) {
  if (results.length === 0) { el("tiles").innerHTML = ""; return; }
  const counts = { likely: 0, target: 0, reach: 0, longshot: 0 };
  results.forEach((r) => counts[r.tier.key]++);
  const any = 1 - results.reduce((a, r) => a * (1 - r.prob), 1);
  el("tiles").innerHTML = `
    <div class="tile clay"><div class="k">Likely</div><div class="v t-likely">${counts.likely}</div><div class="s">70% and up</div></div>
    <div class="tile clay"><div class="k">Target</div><div class="v t-target">${counts.target}</div><div class="s">40 to 69%</div></div>
    <div class="tile clay"><div class="k">Reach</div><div class="v t-reach">${counts.reach + counts.longshot}</div><div class="s">under 40%</div></div>
    <div class="tile clay"><div class="k">At least one offer</div><div class="v">${any > 0.995 ? "&gt;99" : pct(any)}%</div><div class="s">treated independently</div></div>`;
}

const urgency = (days) => (days <= 14 ? "soon" : days <= 45 ? "near" : "far");

/* The soonest real dates on the list, with everything else honestly grouped. */
function renderDeadlines(results) {
  const node = el("deadlines");
  if (results.length === 0) { node.innerHTML = ""; node.hidden = true; return; }
  node.hidden = false;

  const dated = [], periods = [], rolling = [];
  for (const r of results) {
    const d = deadlineFor(r.school, profile.term);
    if (d.kind === "verified") dated.push({ r, d, c: daysUntil(d.date) });
    else if (d.kind === "typical") periods.push({ r, d });
    else rolling.push({ r, d });
  }
  dated.sort((a, b) => a.c.days - b.c.days);

  const fmt = (when) => when.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  node.innerHTML = `
    <h3>Deadlines for ${profile.term === "spring" ? "spring" : "fall"} entry</h3>
    ${dated.length ? `<ul class="dllist">${dated.slice(0, 5).map(({ r, d, c }) => `
      <li>
        <span class="dlname">${esc(r.school.name)}</span>
        <span class="dldate">${fmt(c.when)}</span>
        <span class="dldays ${urgency(c.days)}">${c.days} days</span>
      </li>`).join("")}</ul>` : ""}
    ${dated.length > 5 ? `<p class="dlnote">and ${dated.length - 5} more on the same filing period.</p>` : ""}
    ${periods.length ? `<p class="dlnote"><b>${periods.length} school${periods.length === 1 ? "" : "s"}</b> on your list publish no system-wide date. Each card carries the usual period and a link to the school's own page — confirm those yourself.</p>` : ""}
    ${rolling.length ? `<p class="dlnote"><b>${rolling.length}</b> read applications on a rolling basis.</p>` : ""}`;
}

function cardHtml(r, i, fresh) {
  const s = r.school;
  const flags = [];
  if (PROG && PROG.runsMajor(s, profile.majorId) === false)
    flags.push(`<span class="flag warn">reports no degrees in ${esc(findMajor(profile.majorId)?.name || "this major")}</span>`);
  if (!s.published) flags.push(`<span class="flag">rate estimated</span>`);
  if (r.blocked) flags.push(`<span class="flag warn">fall intake only</span>`);
  if (profile.credits > s.maxCr) flags.push(`<span class="flag warn">over the ${s.maxCr}-hour cap</span>`);
  if (profile.gpa < minGpaOf(s) && !r.open) flags.push(`<span class="flag warn">under the GPA floor</span>`);
  s.tags.filter((t) => t !== "nospr").forEach((t) => flags.push(`<span class="flag">${TAG_LABEL[t] || t}</span>`));

  const dl = deadlineFor(s, profile.term);
  const countdown = dl.date ? daysUntil(dl.date) : null;
  const lv = levers(s, profile);
  const ledger = [...r.factors].sort((a, b) => Math.abs(b.pp) - Math.abs(a.pp));
  const maxPp = Math.max(0.02, ...ledger.map((f) => Math.abs(f.pp)));
  const majorName = r.major ? r.major.name : "your major";

  const competition = r.open
    ? `<p style="margin:0;font-size:13px;color:var(--ink-2);max-width:60ch">Open admission. Admission here is an evaluation of your transcript, not a competition for seats. The question worth asking is how many of your ${profile.credits} hours actually transfer — this school takes about ${s.maxCr}.</p>`
    : `<table class="ledger"><tbody>
        <tr><td class="g">Who you are up against</td><td class="d">${r.pool.mu.toFixed(2)}</td><td class="n">average GPA of transfer applicants to ${esc(majorName)} here, inferred from the ${s.rate}% admit rate and the ${s.gpa.toFixed(2)} its admitted transfers carry</td></tr>
        <tr><td class="g">Applicants per seat</td><td class="d">${r.perSeat.toFixed(1)}:1</td><td class="n">in this major, against ${(100 / s.rate).toFixed(1)}:1 university-wide</td></tr>
        <tr><td class="g">Where you land</td><td class="d">${ord(r.standing)}</td><td class="n">percentile of that pool on everything the model can see; admission sits near the ${ord(r.cutPercentile)}</td></tr>
        <tr><td class="g">Even odds at</td><td class="d">${r.evenOdds > 4.3 ? "—" : r.evenOdds.toFixed(2)}</td><td class="n">${r.evenOdds > 4.3 ? "no GPA alone gets this to a coin flip; the rest of the file has to move" : "the GPA that would make this a coin flip, everything else unchanged"}</td></tr>
      </tbody></table>`;

  return `<details class="card glass${fresh ? " enter" : ""}" style="--i:${i}" data-school="${esc(s.name)}">
    <summary>
      <div>
        <div class="name">${esc(s.name)}</div>
        <div class="meta">${s.state} · ${controlOf(s)}${s.online === 2 ? " · online" : ""} · ${s.rate}% overall${r.open ? "" : ` · ${(r.rEff * 100).toFixed(0)}% in ${esc(majorName)}`}</div>
      </div>
      <span class="track" aria-hidden="true"><i class="f-${r.tier.key}" style="width:${(r.prob * 100).toFixed(1)}%"></i><u style="left:${(r.cutPercentile * 100).toFixed(0)}%"></u></span>
      <div class="pctwrap">
        <div class="pct t-${r.tier.key}">${pct(r.prob)}%</div>
        <div class="tier t-${r.tier.key}">${r.tier.label}</div>
      </div>
    </summary>
    <div class="detail">
      <div class="flags">${flags.join("")}</div>

      <h4>Deadline</h4>
      <p class="dlline ${dl.kind}">
        <b>${esc(dl.label)}</b>${countdown ? ` <span class="dldays ${urgency(countdown.days)}">${countdown.days} days</span>` : ""}
        ${dl.source ? `<small>${esc(dl.source)}</small>` : dl.kind === "typical" ? `<small>A period, not a date — this one is not published system-wide, so confirm it below.</small>` : ""}
      </p>

      <h4>Check with the school</h4>
      <p class="sources">${verifyLinks(s).map((l) =>
        `<a href="${l.href}" target="_blank" rel="noopener noreferrer">${esc(l.label)}<small>${esc(l.note)}</small></a>`).join("")}</p>

      ${costSection(s)}

      ${transferSection(s)}

      ${programSection(s, profile.majorId)}

      <h4>The competition</h4>
      ${competition}
      ${r.open || r.blocked ? "" : `
      <h4>What moved it, in percentage points</h4>
      ${ledger.length < 2 ? `<p style="margin:0 0 8px;font-size:12px;color:var(--ink-2);max-width:60ch">Everything else on your file reads the same as the typical applicant here, so the transcript carries the whole decision.</p>` : ""}
      <table class="ledger"><tbody>
        ${ledger.map((f) => `<tr>
          <td class="g">${esc(f.label)}<span class="gauge"><i class="${f.pp >= 0 ? "pos" : "neg"}" style="${f.pp >= 0 ? "left:50%;width:" + ((Math.abs(f.pp) / maxPp) * 50).toFixed(1) + "%" : "right:50%;width:" + ((Math.abs(f.pp) / maxPp) * 50).toFixed(1) + "%"}"></i></span></td>
          <td class="d ${f.pp >= 0 ? "pos" : "neg"}">${f.pp >= 0 ? "+" : "−"}${Math.abs(f.pp * 100).toFixed(1)}</td>
          <td class="n">${esc(f.note)}</td></tr>`).join("")}
      </tbody></table>`}
      ${lv.length ? `<h4>What moves it most</h4><ul class="levers">${lv.map((t) => `<li>${esc(t.label)} — <b>+${(t.gain * 100).toFixed(1)} pts</b></li>`).join("")}</ul>` : ""}
      <p style="margin:16px 0 0"><button type="button" class="btn sm" data-rm="${esc(s.name)}">Remove from list</button></p>
    </div>
  </details>`;
}

function renderResults() {
  const q = el("q").value.trim().toLowerCase();
  const fs = el("fstate").value, fc = el("fcontrol").value, fo = el("fonline").value, fsel = el("fsel").value;
  const sort = el("fsort").value;
  const band = { a: [0, 20], b: [20, 50], c: [50, 85], d: [85, 101] }[fsel];

  /* A school that reported no degrees in your major last year is not a place
     you can study it, and an admission probability for it is a number about
     nothing. Hidden rather than printed — but only where the federal data can
     actually answer the question: a school with no program record at all is
     unknown, not absent, and is always shown. */
  let hidden = 0;
  const offersMajor = (s) => {
    if (!PROG || showUnoffered) return true;
    const runs = PROG.runsMajor(s, profile.majorId);
    if (runs === false) { hidden++; return false; }
    return true;
  };

  const hits = SCHOOLS.filter((s) => {
    if (fs && s.state !== fs) return false;
    if (fc && s.control !== fc) return false;
    if (fo !== "" && String(s.online) !== fo) return false;
    if (band && (s.rate < band[0] || s.rate >= band[1])) return false;
    if (!q ? false : !matches(INDEX.get(s.name), q)) return false;
    return offersMajor(s);
  }).map((s) => ({ s, r: score(s, profile, false), rank: relevance(s, INDEX.get(s.name), q) }));

  const chosen =
    sort === "chance" ? (a, b) => b.r.prob - a.r.prob || a.s.rate - b.s.rate
    : sort === "price" ? (a, b) => {
        /* Schools with no published net price sort last rather than first —
           an absent figure is not a cheap one. */
        const pa = costFor(a.s, profile.income)?.net ?? Infinity;
        const pb = costFor(b.s, profile.income)?.net ?? Infinity;
        return pa - pb || a.s.name.localeCompare(b.s.name);
      }
    : sort === "selective" ? (a, b) => a.s.rate - b.s.rate
    : sort === "state" ? (a, b) => a.s.state.localeCompare(b.s.state) || a.s.name.localeCompare(b.s.name)
    : (a, b) => a.s.name.localeCompare(b.s.name);
  /* What you typed wins over how you sorted: a search for "cal" puts Berkeley
     first even under "best odds for me". */
  hits.sort(q ? (a, b) => a.rank - b.rank || chosen(a, b) : chosen);

  const majorName = findMajor(profile.majorId)?.name;
  el("dbshown").innerHTML = `${hits.length} of ${SCHOOLS.length} schools`
    + (hidden > 0
        ? ` — <b>${hidden}</b> hidden, none reporting degrees in ${esc(majorName || "your major")}.
            <button type="button" class="linky" id="showall">Show them anyway</button>`
        : showUnoffered && PROG && majorName
          ? ` — including schools that report no degrees in ${esc(majorName)}.
              <button type="button" class="linky" id="showall">Hide those again</button>`
          : "");
  const toggle = el("showall");
  if (toggle) toggle.addEventListener("click", () => { showUnoffered = !showUnoffered; renderResults(); });
  const shown = hits.slice(0, 150);
  el("results").innerHTML = shown.length === 0
    ? `<li class="empty">Nothing matches those filters.</li>`
    : shown.map(({ s, r }) => {
        const added = profile.list.includes(s.name);
        return `<li class="result">
          <div>
            <div class="name">${esc(s.name)}</div>
            <div class="meta">${s.state} · ${controlOf(s)}${s.online === 2 ? " · primarily online" : s.online === 1 ? " · online division" : ""} · ${s.rate}%${s.published ? "" : " est."}${
              (() => {
                const c = costFor(s, profile.income);
                if (!c || c.net === null) return "";
                return c.aidExceedsCost
                  ? ` · pays you ${money(Math.abs(c.net))}/yr`
                  : ` · ${money(c.net)}/yr net`;
              })()}</div>
          </div>
          <div class="odds t-${r.tier.key}">${pct(r.prob)}%<small>${r.tier.label}</small></div>
          <button type="button" class="btn sm" data-add="${esc(s.name)}" ${added ? "disabled" : ""}>${added ? "added" : "Add"}</button>
        </li>`;
      }).join("") + (hits.length > shown.length ? `<li class="empty">${hits.length - shown.length} more match. Narrow the search to see them.</li>` : "");

  el("results").querySelectorAll("[data-add]").forEach((b) =>
    b.addEventListener("click", () => {
      if (profile.list.includes(b.dataset.add)) return;
      profile.list = [...profile.list, b.dataset.add];
      touched();
    }));
}

/* --------------------------------------------------------------- motion
 *
 * Three moving parts, each with a job:
 *   the sheen   tells you which pane is live under the pointer
 *   the tilt    gives the glass a thickness to read against the aurora
 *   the dial    is the one thing that animates on a keystroke, because a
 *               number sliding to a new value reads as a change; the 588-row
 *               search and the form do not animate at all.
 */

function initMotion() {
  let frame = 0;
  const onMove = (e) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const pane = e.target instanceof Element ? e.target.closest(".glass") : null;
      if (pane) {
        const b = pane.getBoundingClientRect();
        pane.style.setProperty("--mx", `${((e.clientX - b.left) / b.width) * 100}%`);
        pane.style.setProperty("--my", `${((e.clientY - b.top) / b.height) * 100}%`);
      }
      if (fine.matches && !reduced.matches) {
        const card = e.target instanceof Element ? e.target.closest(".card") : null;
        if (card) {
          const b = card.getBoundingClientRect();
          card.style.setProperty("--ry", `${(((e.clientX - b.left) / b.width) - 0.5) * 5}deg`);
          card.style.setProperty("--rx", `${(0.5 - ((e.clientY - b.top) / b.height)) * 3}deg`);
        }
      }
    });
  };
  document.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerout", (e) => {
    const card = e.target instanceof Element ? e.target.closest(".card") : null;
    if (card && !card.contains(e.relatedTarget)) { card.style.removeProperty("--rx"); card.style.removeProperty("--ry"); }
  }, { passive: true });

  /* The odds core leans toward the pointer while it is over the hero. */
  const hero = el("hero"), core = el("core3d");
  if (hero && core) {
    hero.addEventListener("pointermove", (e) => {
      if (!fine.matches || reduced.matches) return;
      const b = hero.getBoundingClientRect();
      core.style.setProperty("--ry", `${(((e.clientX - b.left) / b.width) - 0.5) * 22}deg`);
      core.style.setProperty("--rx", `${(0.5 - ((e.clientY - b.top) / b.height)) * 16}deg`);
    }, { passive: true });
    hero.addEventListener("pointerleave", () => {
      core.style.removeProperty("--rx");
      core.style.removeProperty("--ry");
    }, { passive: true });
  }
}

/* ------------------------------------------------------------ navigation
 *
 * One nav for every width: a drawer. It swings out from the left, closes on
 * Escape, on the scrim, and on picking a section. Focus moves into it when it
 * opens and returns to the button when it closes, so it works from the
 * keyboard as well as the pointer.
 */

const PANES = { record: "pane-record", list: "pane-list", fits: "pane-fits", explore: "pane-explore", programs: "pane-programs", method: "pane-method", legal: "pane-legal" };
let currentTab = "list";

function setTab(name, { animate = true, focus = false } = {}) {
  if (!PANES[name]) return;
  currentTab = name;
  const wide = window.matchMedia("(min-width: 1000px)").matches;
  /* Past this width the search panel has its own column, so choosing either
     "My list" or "Explore" shows both — there is nothing to switch between. */
  const threeCol = window.matchMedia("(min-width: 1500px)").matches;
  const sideBySide = threeCol && (name === "list" || name === "explore");
  for (const [key, id] of Object.entries(PANES)) {
    const node = el(id);
    /* The record rail is always up beside the results on a wide screen, so
       asking for it there just means "look left", not "swap the view". */
    const show = key === name
      || (wide && key === "record")
      || (wide && name === "record" && key === "list")
      || (sideBySide && (key === "list" || key === "explore"));
    node.hidden = !show;
    if (show && animate && !reduced.matches) {
      node.style.animation = "none";
      void node.offsetWidth;
      node.style.animation = "";
    }
  }
  document.querySelectorAll(".navitem").forEach((b) =>
    b.setAttribute("aria-current", b.dataset.tab === name ? "page" : "false"));
  if (name === "programs" || name === "fits" || name === "explore") ensurePrograms();
  if (focus) {
    const pane = el(PANES[name]);
    pane.setAttribute("tabindex", "-1");
    pane.focus({ preventScroll: true });
    pane.scrollIntoView({ behavior: reduced.matches ? "auto" : "smooth", block: "start" });
  }
}

const sidebar = el("sidebar"), body = el("drawerbody"), scrim = el("scrim"), menubtn = el("menubtn");
let drawerOpen = false;

function openDrawer() {
  drawerOpen = true;
  scrim.hidden = false;
  requestAnimationFrame(() => scrim.classList.add("open"));
  sidebar.classList.add("open");
  body.removeAttribute("inert");
  menubtn.setAttribute("aria-expanded", "true");
  (body.querySelector('.navitem[aria-current="page"]') || body.querySelector(".navitem"))?.focus();
}

function closeDrawer({ restoreFocus = true } = {}) {
  if (!drawerOpen) return;
  drawerOpen = false;
  scrim.classList.remove("open");
  sidebar.classList.remove("open");
  body.setAttribute("inert", "");
  menubtn.setAttribute("aria-expanded", "false");
  const hide = () => { if (!drawerOpen) scrim.hidden = true; };
  reduced.matches ? hide() : setTimeout(hide, 560);
  if (restoreFocus) menubtn.focus();
}

menubtn.addEventListener("click", () => (drawerOpen ? closeDrawer() : openDrawer()));

scrim.addEventListener("click", () => closeDrawer());
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && drawerOpen) closeDrawer();
});
/* Keep the tab key inside the drawer while it covers the page. */
sidebar.addEventListener("keydown", (e) => {
  if (e.key !== "Tab" || !drawerOpen) return;
  const items = [menubtn, ...body.querySelectorAll("button")];
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});


/* ---------------------------------------------------------- walkthrough
 *
 * A new visitor lands on an empty list, which is honest but says nothing
 * about what to do. Four questions fix that: the two transcript numbers,
 * where you are transferring from, and what you intend to study — exactly
 * the fields every school's odds turn on. It runs once, is skippable at
 * every step, and is re-openable from the record pane.
 */

const WT_STEPS = [
  {
    title: "Let's size up your transfer",
    lede: "Four short questions, then you pick the schools you care about. Every answer lands in your record, where you can change it at any time.",
    note: "These are estimates built from published admit rates and admitted-transfer GPAs — useful for ranking your list, never a decision from an admissions office.",
    body: () => "",
  },
  {
    title: "Your transcript",
    lede: "The two numbers that carry the most weight.",
    note: "Cumulative GPA across every college course you have taken, and the hours a receiving school would actually accept.",
    body: () => `
      <div class="row2">
        <div class="field"><label for="wtgpa">Cumulative GPA</label>
          <input type="number" id="wtgpa" min="0" max="4.3" step="0.01" inputmode="decimal" placeholder="e.g. 3.40"></div>
        <div class="field"><label for="wtcredits">Transferable hours</label>
          <input type="number" id="wtcredits" min="0" max="200" step="1" inputmode="numeric" placeholder="e.g. 48"></div>
      </div>`,
    /* Blank on a first run: a prefilled number is one the visitor can click
       straight past and then read back as their own. */
    fill: () => {
      el("wtgpa").value = saved ? profile.gpa : "";
      el("wtcredits").value = saved ? profile.credits : "";
    },
    read: () => {
      const g = Number(el("wtgpa").value);
      if (!el("wtgpa").value.trim() || !(g > 0)) return "Enter your GPA to carry on — it drives every number after this.";
      if (!el("wtcredits").value.trim()) return "Enter how many hours you have, even if it is a rough count.";
      profile.gpa = clamp(g, 0, 4.3);
      profile.credits = Math.round(clamp(Number(el("wtcredits").value) || 0, 0, 200));
      return null;
    },
    focus: "wtgpa",
  },
  {
    title: "Where you are now",
    lede: "Residency decides which schools price you as in-state, and how many seats they hold for you.",
    note: "Public universities admit residents at a different rate than everyone else, so this moves the odds on its own.",
    body: () => `
      <div class="field"><label for="wtcurtype">You are transferring from</label>
        <select id="wtcurtype">
          <option value="cc">A community college</option>
          <option value="four">A four-year college</option>
          <option value="sel">A selective four-year college</option>
          <option value="online">An online or adult-serving college</option>
        </select></div>
      <div class="field"><label for="wtstate">Your state of residency</label><select id="wtstate"></select></div>`,
    fill: () => {
      el("wtstate").innerHTML = STATES.map((x) => `<option value="${x}">${STATE_NAMES[x] || x}</option>`).join("");
      el("wtcurtype").value = profile.curtype;
      el("wtstate").value = profile.state;
    },
    read: () => { profile.curtype = el("wtcurtype").value; profile.state = el("wtstate").value; return null; },
    focus: "wtcurtype",
  },
  {
    title: "Where you are going",
    lede: "Odds are scored against the applicants to your major at each campus, not the university as a whole.",
    note: "Not sure yet? Leave it undeclared — you can change it later and every school on your list rescores.",
    body: () => `
      <div class="field"><label for="wtmajor">Intended major</label>
        <input type="text" id="wtmajor" list="majorlist" spellcheck="false" autocomplete="off"></div>
      <div class="field"><label for="wtterm">Entry term</label>
        <select id="wtterm"><option value="fall">Fall</option><option value="spring">Spring</option></select></div>`,
    fill: () => {
      const m = findMajor(profile.majorId);
      el("wtmajor").value = m ? m.name : "";
      el("wtmajor").placeholder = `Search ${MAJORS.length} majors`;
      el("wtterm").value = profile.term;
    },
    read: () => {
      const m = findMajor(el("wtmajor").value);
      profile.majorId = m ? m.id : el("wtmajor").value.trim() ? el("wtmajor").value.trim() : "undeclared";
      profile.term = el("wtterm").value;
      return null;
    },
    focus: "wtmajor",
  },
];

const wt = el("wt"), wtScrim = el("wtscrim");
/* Everything the dialog covers, so it can be put out of reach while it is up. */
const wtBehind = [document.querySelector(".topbar"), el("sidebar"), document.querySelector(".shell")].filter(Boolean);
let wtStep = 0, wtReturn = null;

function renderStep() {
  const step = WT_STEPS[wtStep];
  el("wtstep").textContent = `Step ${wtStep + 1} of ${WT_STEPS.length}`;
  el("wtfill").style.width = `${((wtStep + 1) / WT_STEPS.length) * 100}%`;
  el("wttitle").textContent = step.title;
  el("wtlede").textContent = step.lede;
  el("wtbody").innerHTML = step.body();
  el("wtnote").textContent = step.note;
  step.fill?.();
  el("wtback").hidden = wtStep === 0;
  el("wtnext").textContent = wtStep === 0 ? "Start" : wtStep === WT_STEPS.length - 1 ? "Pick schools" : "Next";
  el("wterr").hidden = true;
  const target = step.focus ? el(step.focus) : el("wtnext");
  requestAnimationFrame(() => target?.focus({ preventScroll: true }));
}

function startWalkthrough({ force = false } = {}) {
  if (!force && !shouldOffer()) return;
  wtStep = 0;
  wtReturn = document.activeElement;
  wtScrim.hidden = false;
  wt.hidden = false;
  wtBehind.forEach((n) => n.setAttribute("inert", ""));
  requestAnimationFrame(() => { wtScrim.classList.add("open"); wt.classList.add("open"); });
  renderStep();
}

function endWalkthrough({ finished } = {}) {
  /* In preview the point is to see it again, so it is never marked as seen. */
  if (!PREVIEW) {
    try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* private mode — it just asks again */ }
  }
  wtScrim.classList.remove("open");
  wt.classList.remove("open");
  wtBehind.forEach((n) => n.removeAttribute("inert"));
  const hide = () => { wtScrim.hidden = true; wt.hidden = true; };
  reduced.matches ? hide() : setTimeout(hide, 320);
  render();
  if (finished) {
    save();
    /* Straight to the suggestions: the four answers just given are exactly
       what they are built from, so there is something waiting. */
    setTab("fits", { focus: true });
    ensurePrograms();
  } else if (wtReturn instanceof HTMLElement) {
    wtReturn.focus({ preventScroll: true });
  }
}

function seenWalkthrough() {
  if (PREVIEW) return false;
  try { return localStorage.getItem(SEEN_KEY) === "1" || localStorage.getItem(OLD_SEEN_KEY) === "1"; } catch { return true; }
}

/* Whether to open the questions unprompted.
 *
 * Having seen them once is the only permanent answer: they are setup, not a
 * feature, and nobody wants to be set up twice. Merely having a saved record
 * used to count as well, which quietly locked out every person who had used
 * this app before the walkthrough existed — they had a record, so they were
 * treated as onboarded, having never seen it. What a record actually tells you
 * is whether somebody is in the middle of something: a list with schools on it
 * is work in progress, and a dialog over the top of it is an interruption. An
 * empty one is somebody who never got started, which is exactly who this is
 * for. */
function shouldOffer() {
  if (viewingShared || seenWalkthrough()) return false;
  return !(saved && Array.isArray(saved.list) && saved.list.length > 0);
}

function advance() {
  const problem = WT_STEPS[wtStep].read?.();
  if (problem) {
    el("wterr").textContent = problem;
    el("wterr").hidden = false;
    el(WT_STEPS[wtStep].focus)?.focus();
    return;
  }
  if (wtStep === WT_STEPS.length - 1) { endWalkthrough({ finished: true }); return; }
  wtStep++;
  renderStep();
}

el("wtnext").addEventListener("click", advance);
el("wtback").addEventListener("click", () => { if (wtStep > 0) { wtStep--; renderStep(); } });
el("wtskip").addEventListener("click", () => endWalkthrough({ finished: false }));
wt.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { endWalkthrough({ finished: false }); return; }
  if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); advance(); return; }
  if (e.key !== "Tab") return;
  /* The dialog covers the page, so the tab key stays inside it. */
  const items = [...wt.querySelectorAll("button:not([hidden]), input, select")].filter((n) => !n.hidden);
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

/* ------------------------------------------------------------------ wire */

buildStatic();
initMotion();
resetBanner();
render();
adoptSharedRecord().then((adopted) => { if (adopted) render(); else startWalkthrough(); });
/* A link that differs only by its hash does not reload the page, so a shared
   record pasted into an open tab has to be picked up here. */
window.addEventListener("hashchange", () => adoptSharedRecord().then((adopted) => { if (adopted) render(); }));
setTab("list", { animate: false });
syncProgramMajor();
window.addEventListener("resize", () => setTab(currentTab, { animate: false }));

document.querySelectorAll(".navitem[data-tab]").forEach((b) =>
  b.addEventListener("click", () => { setTab(b.dataset.tab, { focus: true }); closeDrawer({ restoreFocus: false }); }));

/* The questions are setup, so they run once and then stay out of the way —
   which left no way back to them but a text link inside the record pane, and
   on a phone that pane is itself behind this drawer. One tap, from anywhere,
   in any state. */
el("navwalk").addEventListener("click", () => {
  closeDrawer({ restoreFocus: false });
  startWalkthrough({ force: true });
});
el("footlinks").addEventListener("click", (e) => {
  const b = e.target.closest("[data-tab]");
  if (b) setTab(b.dataset.tab, { focus: true });
});
el("dbcount2").textContent = SCHOOLS.length;
el("majorcount3").textContent = MAJORS.length;

const formChanged = (e) => {
  if (e.target.closest("#context")) return;
  readForm();
  touched();
};
el("pane-record").addEventListener("input", formChanged);
el("pane-record").addEventListener("change", formChanged);
for (const id of ["gpa", "credits"]) {
  el(id).addEventListener("blur", () => { readForm(); el(id).value = profile[id]; });
}
el("major").addEventListener("blur", () => {
  const m = findMajor(el("major").value);
  if (m) { profile.majorId = m.id; el("major").value = m.name; render(); }
});
for (const id of ["q", "fstate", "fcontrol", "fonline", "fsel", "fsort"]) {
  el(id).addEventListener("input", renderResults);
}
el("pmajor").addEventListener("input", () => { programMajorPinned = true; });
for (const id of ["fitscope", "fitonline"]) el(id).addEventListener("input", renderFits);
el("fitrefresh").addEventListener("click", () => { ensurePrograms(); renderFits(); });
el("fitwhy").addEventListener("click", () => {
  const box = el("fitrecipe");
  box.hidden = !box.hidden;
  el("fitwhy").textContent = box.hidden ? "How this is built" : "Hide";
});
el("fitaddall").addEventListener("click", () => {
  if (!slate) return;
  const names = slate.bands.flatMap((b) => b.rows.map((c) => c.school.name));
  profile.list = [...profile.list, ...names.filter((n) => !profile.list.includes(n))];
  touched();
});
for (const id of ["pmajor", "psort", "pstate", "pmin", "pscope"]) {
  el(id).addEventListener("input", () => { ensurePrograms(); renderPrograms(); });
}
el("pmajor").addEventListener("blur", () => {
  const m = findMajor(el("pmajor").value);
  if (m) el("pmajor").value = m.name;
});

el("save").addEventListener("click", () => { readForm(); save(); render(); });
el("reset").addEventListener("click", () => {
  if (!confirm("Clear the saved record and start from an empty list?")) return;
  try { localStorage.removeItem(KEY); } catch {}
  profile = structuredClone(BLANK);
  el("savedstate").textContent = "unsaved";
  render();
  startWalkthrough({ force: true });
});

el("share").addEventListener("click", copyShareLink);
el("shareurl").addEventListener("focus", (e) => e.target.select());

el("export").addEventListener("click", async () => {
  readForm();
  const rows = profile.list.map((n) => BY_NAME.get(n)).filter(Boolean)
    .map((s) => score(s, profile, false)).sort((a, b) => b.prob - a.prob);
  const major = findMajor(profile.majorId);
  const csv = [
    ["School", "State", "Control", "Overall transfer admit %", "Rate in your major %", "Rate source", "Applicant pool GPA", "Your percentile", "Your estimate %", "Tier"].join(","),
    ...rows.map((r) => [
      `"${r.school.name.replace(/"/g, '""')}"`, r.school.state, r.school.control, r.school.rate,
      (r.rEff * 100).toFixed(1), r.school.published ? "published" : "estimated",
      r.pool.mu.toFixed(2), Math.round(r.standing * 100), (r.prob * 100).toFixed(1), r.tier.label,
    ].join(",")),
  ].join("\n");

  const filename = `matriculate-${major ? major.id : "list"}.csv`;

  /* Inside a claude.ai artifact the viewer sandbox blocks ordinary downloads,
     so the runtime hands the file over instead. On the public site there is no
     runtime and a Blob link is the real download. */
  const downloads = await window.claude?.use?.("downloads").catch(() => null);
  if (downloads) {
    try {
      await downloads.save({ filename, data: csv });
      return;
    } catch { /* declined — fall through */ }
  }
  try {
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    flashExport("Downloaded");
  } catch {
    try {
      await navigator.clipboard.writeText(csv);
      flashExport("Copied");
    } catch {
      alert(csv);
    }
  }
});

function flashExport(word) {
  el("export").textContent = word;
  setTimeout(() => (el("export").textContent = "Export CSV"), 2000);
}

if (saved) el("savedstate").textContent = "record loaded";
if (PREVIEW) el("savedstate").textContent = "preview — not saved";
