import {
  SCHOOLS, BY_NAME, MAJORS, MAJOR_GROUPS, findMajor,
  score, levers, minGpaOf, TAG_LABEL, clamp,
} from "./model.js";
import { searchIndex, matches, relevance } from "./aliases.js";
import { deadlineFor, daysUntil, verifyLinks } from "./deadlines.js";
import { shareLink, decodeProfile, readHash } from "./share.js";

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

const EXAMPLE = {
  gpa: 3.42, credits: 48, prereqs: "most", blemish: 0,
  current: "Santa Monica College", curtype: "cc", state: "CA", assoc: "prog",
  agreement: false, majorId: "psych", term: "fall", essay: 3, activity: 3, context: [],
  list: [
    "University of California, Los Angeles",
    "University of California, Irvine",
    "University of California, Santa Cruz",
    "California State University, Long Beach",
    "California State University, Northridge",
    "University of Southern California",
    "Arizona State University",
    "Western Governors University",
  ],
  example: true,
};

/* Built once: everything each school can be found by. */
const INDEX = new Map(SCHOOLS.map((s) => [s.name, searchIndex(s, STATE_NAMES[s.state])]));

const KEY = "transfer-odds:v1";
let profile = load() || structuredClone(EXAMPLE);
let viewingShared = false;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p.majorId && p.major) p.majorId = LEGACY_MAJOR[p.major] || "undeclared";
    return { ...structuredClone(EXAMPLE), ...p, example: false };
  } catch { return null; }
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
    el("savedstate").textContent = "saved " + new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    el("savedstate").textContent = "storage unavailable";
  }
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
  el("q").placeholder = `Search ${SCHOOLS.length} schools by name, state, or “online”`;

  const opts = STATES.map((s) => `<option value="${s}">${STATE_NAMES[s] || s}</option>`).join("");
  el("state").innerHTML = opts;
  el("fstate").innerHTML = `<option value="">All states</option>` + opts;
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
  el("agreement").checked = profile.agreement;
  const major = findMajor(profile.majorId);
  setField("major", major ? major.name : profile.majorId || "");
  setField("term", profile.term);
  for (const id of ["essay", "activity"]) {
    el(id).querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.value) === profile[id])));
  }
  el("context").querySelectorAll("[data-ctx]").forEach((i) => (i.checked = profile.context.includes(i.value)));
  /* The shared-record notice outranks the example notice and stays put. */
  if (!viewingShared) el("banner").hidden = !profile.example;
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

function touched() {
  profile.example = false;
  if (!viewingShared) el("banner").hidden = true;
  render();
}

/* ------------------------------------------------------------- sharing */

async function adoptSharedRecord() {
  const code = readHash();
  if (!code) return false;
  const shared = await decodeProfile(code, (name) => BY_NAME.has(name));
  if (!shared) return false;
  profile = { ...structuredClone(EXAMPLE), ...shared, example: false };
  viewingShared = true;
  el("banner").hidden = false;
  el("banner").className = "hint shared";
  el("banner").innerHTML = `You are looking at a <b>shared record</b>, not your own. Change anything to try your numbers on it —
    nothing here is saved until you press Save record.
    <button type="button" class="linky" id="mine">Open my own record instead</button>`;
  el("mine").addEventListener("click", () => {
    viewingShared = false;
    history.replaceState(null, "", location.pathname + location.search);
    profile = load() || { ...structuredClone(EXAMPLE), example: true };
    el("banner").className = "hint";
    el("banner").textContent = "Loaded with an example record. Change anything and it becomes yours.";
    el("banner").hidden = !profile.example;
    render();
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
    el("cards").innerHTML = `<p class="empty glass" style="padding:40px 20px">No schools yet. Open <b>Explore</b> and add a few.</p>`;
    return;
  }
  el("cards").innerHTML = results.map((r, i) => cardHtml(r, i, fresh)).join("");
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

  return `<details class="card glass${fresh ? " enter" : ""}" style="--i:${i}">
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

      <h4>Check it at the source</h4>
      <p class="sources">${verifyLinks(s).map((l) =>
        `<a href="${l.href}" target="_blank" rel="noopener noreferrer">${esc(l.label)}<small>${esc(l.note)}</small></a>`).join("")}</p>

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

  const hits = SCHOOLS.filter((s) => {
    if (fs && s.state !== fs) return false;
    if (fc && s.control !== fc) return false;
    if (fo !== "" && String(s.online) !== fo) return false;
    if (band && (s.rate < band[0] || s.rate >= band[1])) return false;
    if (!q) return true;
    return matches(INDEX.get(s.name), q);
  }).map((s) => ({ s, r: score(s, profile, false), rank: relevance(s, INDEX.get(s.name), q) }));

  const chosen =
    sort === "chance" ? (a, b) => b.r.prob - a.r.prob || a.s.rate - b.s.rate
    : sort === "selective" ? (a, b) => a.s.rate - b.s.rate
    : sort === "state" ? (a, b) => a.s.state.localeCompare(b.s.state) || a.s.name.localeCompare(b.s.name)
    : (a, b) => a.s.name.localeCompare(b.s.name);
  /* What you typed wins over how you sorted: a search for "cal" puts Berkeley
     first even under "best odds for me". */
  hits.sort(q ? (a, b) => a.rank - b.rank || chosen(a, b) : chosen);

  el("dbshown").textContent = `${hits.length} of ${SCHOOLS.length} schools`;
  const shown = hits.slice(0, 150);
  el("results").innerHTML = shown.length === 0
    ? `<li class="empty">Nothing matches those filters.</li>`
    : shown.map(({ s, r }) => {
        const added = profile.list.includes(s.name);
        return `<li class="result">
          <div>
            <div class="name">${esc(s.name)}</div>
            <div class="meta">${s.state} · ${controlOf(s)}${s.online === 2 ? " · primarily online" : s.online === 1 ? " · online division" : ""} · ${s.rate}%${s.published ? "" : " est."}</div>
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

const PANES = { record: "pane-record", list: "pane-list", explore: "pane-explore", method: "pane-method", legal: "pane-legal" };
let currentTab = "list";

function setTab(name, { animate = true, focus = false } = {}) {
  if (!PANES[name]) return;
  currentTab = name;
  const wide = window.matchMedia("(min-width: 1001px)").matches;
  for (const [key, id] of Object.entries(PANES)) {
    const node = el(id);
    /* The record rail is always up beside the results on a wide screen, so
       asking for it there just means "look left", not "swap the view". */
    const show = key === name || (wide && key === "record") || (wide && name === "record" && key === "list");
    node.hidden = !show;
    if (show && animate && !reduced.matches) {
      node.style.animation = "none";
      void node.offsetWidth;
      node.style.animation = "";
    }
  }
  document.querySelectorAll(".navitem").forEach((b) =>
    b.setAttribute("aria-current", b.dataset.tab === name ? "page" : "false"));
  if (focus) {
    const pane = el(PANES[name]);
    pane.setAttribute("tabindex", "-1");
    pane.focus({ preventScroll: true });
    pane.scrollIntoView({ behavior: reduced.matches ? "auto" : "smooth", block: "start" });
  }
}

const sidebar = el("sidebar"), scrim = el("scrim"), menubtn = el("menubtn");
let drawerOpen = false;

function openDrawer() {
  drawerOpen = true;
  scrim.hidden = false;
  requestAnimationFrame(() => scrim.classList.add("open"));
  sidebar.classList.add("open");
  sidebar.removeAttribute("inert");
  menubtn.setAttribute("aria-expanded", "true");
  (sidebar.querySelector('.navitem[aria-current="page"]') || sidebar.querySelector(".navitem"))?.focus();
}

function closeDrawer({ restoreFocus = true } = {}) {
  if (!drawerOpen) return;
  drawerOpen = false;
  scrim.classList.remove("open");
  sidebar.classList.remove("open");
  sidebar.setAttribute("inert", "");
  menubtn.setAttribute("aria-expanded", "false");
  const hide = () => { if (!drawerOpen) scrim.hidden = true; };
  reduced.matches ? hide() : setTimeout(hide, 560);
  if (restoreFocus) menubtn.focus();
}

menubtn.addEventListener("click", () => (drawerOpen ? closeDrawer() : openDrawer()));
el("closebtn").addEventListener("click", () => closeDrawer());
scrim.addEventListener("click", () => closeDrawer());
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && drawerOpen) closeDrawer();
});
/* Keep the tab key inside the drawer while it covers the page. */
sidebar.addEventListener("keydown", (e) => {
  if (e.key !== "Tab" || !drawerOpen) return;
  const items = [...sidebar.querySelectorAll("button")];
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

/* ------------------------------------------------------------------ wire */

buildStatic();
initMotion();
render();
adoptSharedRecord().then((adopted) => { if (adopted) render(); });
/* A link that differs only by its hash does not reload the page, so a shared
   record pasted into an open tab has to be picked up here. */
window.addEventListener("hashchange", () => adoptSharedRecord().then((adopted) => { if (adopted) render(); }));
setTab("list", { animate: false });
window.addEventListener("resize", () => setTab(currentTab, { animate: false }));

document.querySelectorAll(".navitem").forEach((b) =>
  b.addEventListener("click", () => { setTab(b.dataset.tab, { focus: true }); closeDrawer({ restoreFocus: false }); }));
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

el("save").addEventListener("click", () => { readForm(); profile.example = false; save(); render(); });
el("reset").addEventListener("click", () => {
  if (!confirm("Clear the saved record and start from an empty list?")) return;
  try { localStorage.removeItem(KEY); } catch {}
  profile = { ...structuredClone(EXAMPLE), list: [], example: false };
  el("savedstate").textContent = "unsaved";
  render();
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

  const filename = `transfer-odds-${major ? major.id : "list"}.csv`;

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

if (!profile.example) el("savedstate").textContent = "record loaded";
