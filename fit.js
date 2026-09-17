/* Suggesting a starting list.
 *
 * Two questions decide whether a school belongs on a transfer list: can you
 * get in, and is the thing you would be getting into any good. The odds model
 * answers the first and the program tables answer the second, and this module
 * is the only place where the two meet.
 *
 * What it does NOT do is pick a winner. A slate of ten schools where every one
 * is a reach is a bad list however strong the programs are, so the suggestions
 * are built as a spread: a few you should get into, a few that are live, a few
 * worth the application fee anyway. Within each band the strongest programs in
 * your major come first. That is a real admissions strategy, and it is the
 * whole of the recipe — there is no hidden score, and every row says in plain
 * words why it is there.
 */

import { SCHOOLS, score, findMajor, minGpaOf, clamp } from "./model.js";

/* How many of each band a finished list should hold. Reaches are capped
   because they are the ones that cost money and produce nothing. */
const SHAPE = [
  { key: "likely", min: 0.62, max: 1.01, want: 4, label: "Should get in" },
  { key: "target", min: 0.33, max: 0.62, want: 4, label: "Live chance" },
  { key: "reach", min: 0.12, max: 0.33, want: 3, label: "Reach" },
  { key: "longshot", min: 0.0, max: 0.12, want: 1, label: "Long shot" },
];

/* Program strength on a 0–1 scale, from whichever evidence exists.
 *
 * Earnings against the field's own national median is the strongest signal
 * available, so it carries the band when it is published. When it is not — and
 * it is suppressed for about a third of programs — the fallback is scale and
 * focus, which say a department exists and that the campus is invested in it.
 * The fallback tops out lower than a measured programme can reach, so a school
 * never rises above one with real evidence purely because it has none. */
function programStrength(p) {
  if (!p) return { value: null, why: null };
  if (p.index !== null) {
    /* An index of 0.85 is the floor of the useful range and 1.6 the ceiling;
       past that the differences are cost of living, not programme.

       The local comparison wins outright where it exists. Averaging it with
       the national one sounded fair and was not: in a field whose pay is set
       regionally, the national figure is mostly a statement about the state,
       so blending it in put California at the top of every nursing slate and
       left an Ohio student with no Ohio schools to look at. */
    const ref = p.localIndex === null ? p.index : p.localIndex;
    return { value: clamp((ref - 0.85) / 0.75, 0, 1), why: p.localIndex === null ? "earnings" : "earnings-local" };
  }
  const scale = clamp(Math.log10(Math.max(1, p.awards)) / 2.7, 0, 1);
  const focus = p.focus === null ? 0 : clamp((p.focus - 0.8) / 3, 0, 1);
  return { value: 0.55 * (0.6 * scale + 0.4 * focus), why: "size" };
}

/* What a degree costs to carry, as a 0-1 preference. Debt against first-year
   earnings is the only cost figure in the data that accounts for what the
   degree earns, which is the comparison that matters to somebody choosing. */
function valueOf(p) {
  let v = 0.5;
  if (p && p.burden !== null) v = clamp(1 - (p.burden - 0.25) / 0.9, 0, 1);
  return v;
}

/* How practical a school is to actually attend, which for a transfer student
   is mostly a question of what it costs and whether the credits move. This is
   a stated preference, not a hidden thumb on the scale: the pane exposes it as
   a switch, and turning it off removes the term entirely. */
function practicalFit(school, profile) {
  if (school.online === 2) return 0.55;              // location is not the point
  if (school.state === profile.state) return school.control === "pub" ? 1 : 0.8;
  /* A public university out of state charges non-resident tuition and holds
     most of its transfer seats for its own residents. Both are real. */
  return school.control === "pub" ? 0.2 : 0.5;
}

export function buildSlate(profile, PROG, { size = 12, preferLocal = true, includeOnline = true } = {}) {
  const major = findMajor(profile.majorId);
  const majorId = major ? major.id : profile.majorId;
  const covered = Boolean(PROG && PROG.covered(majorId));
  const candidates = [];

  for (const school of SCHOOLS) {
    const r = score(school, profile, false);
    /* A school that does not run your term is not a fit, it is a dead end. */
    if (r.blocked) continue;

    if (!includeOnline && school.online === 2) continue;

    const p = PROG ? PROG.at(school, majorId) : null;
    /* When the major has federal coverage, a school that reported no degrees
       in it last year is dropped: either it does not run the programme or it
       is too small to have graduated anybody, and neither is a suggestion. */
    if (covered && (!p || p.awards < 5)) continue;

    const strength = programStrength(p);
    const value = valueOf(p);
    const why = [];

    if (p && p.index !== null) {
      /* Lead with whichever comparison did the ranking, or the row explains
         itself with a number that is not the one it was sorted on. */
      const against = (v, what) => {
        const d = Math.round((v - 1) * 100);
        return d >= 5 ? `graduates earn ${d}% above ${what}`
          : d <= -5 ? `graduates earn ${Math.abs(d)}% below ${what}`
          : `graduates earn about ${what}`;
      };
      const field = major ? major.name.toLowerCase() : "the field";
      if (p.localIndex !== null) {
        why.push(against(p.localIndex, `the ${school.state} median for ${field}`));
        /* The national figure still belongs on the row, but as context rather
           than as the verdict: in a regionally paid field it says more about
           the state's wages than about the school. */
        const nat = Math.round((p.index - 1) * 100);
        if (Math.abs(nat) >= 5) {
          why.push(`${Math.abs(nat)}% ${nat > 0 ? "above" : "below"} the national median, which in this field tracks what ${school.state} pays as much as anything`);
        }
      } else {
        why.push(against(p.index, `the national median for ${field}`));
      }
    }
    if (p) {
      why.push(`${p.awards.toLocaleString()} degrees a year in the field`
        + (p.focus !== null && p.focus >= 2.5 ? `, ${p.focus.toFixed(1)}× as central to this campus as to the average one` : ""));
    }
    if (p && p.burden !== null && p.burden <= 0.5) {
      why.push(`graduates owe ${p.burden.toFixed(2)} for every dollar of first-year pay`);
    }
    if (school.control === "pub" && school.state === profile.state) why.push(`an in-state public — resident tuition, and the credit agreements usually run your way`);
    else if (school.state === profile.state) why.push(`in your state`);
    if (r.open) why.push(`open admission — this is a transcript evaluation, not a competition`);
    /* The caveats travel with the row rather than being left for the card. */
    const caution = [];
    if (profile.credits > school.maxCr) caution.push(`takes ${school.maxCr} hours at most, and you have ${profile.credits}`);
    if (!r.open && profile.gpa < minGpaOf(school)) caution.push(`publishes a ${minGpaOf(school).toFixed(1)} GPA floor`);
    if (!school.published) caution.push(`its transfer rate is estimated, not published`);
    if (p && p.index === null) caution.push(`earnings for this programme are not published — too few graduates to report`);

    const practical = preferLocal ? practicalFit(school, profile) : 0.5;
    candidates.push({
      school, r, program: p, why, caution,
      strength: strength.value,
      evidence: strength.why,
      value, practical,
      /* Program first, because the odds have already decided which band this
         row competes in. Then what it costs to carry, then whether it is a
         realistic place to actually enrol. */
      rank: 0.44 * (strength.value ?? 0.35)
          + 0.24 * value
          + 0.22 * practical
          + 0.10 * r.prob,
    });
  }

  /* Caps, because a ranked list alone does not make a usable one.
     
     Open-admission online universities score near the top of every safety band
     — high odds, low debt, strong reported earnings — and unchecked they take
     all four places, leaving a student with no campus they can actually drive
     to. The same happens by state once one state's pay lifts its whole cohort.
     Neither cap changes what any school scores; they only stop one kind of
     school from being the entire answer. */
  const CAP_ONLINE = 2;
  const CAP_PER_STATE = 3;

  const used = new Set();
  let onlineTaken = 0;
  const perState = new Map();

  const allowed = (c) => {
    if (used.has(c.school.name)) return false;
    if (c.school.online === 2 && onlineTaken >= CAP_ONLINE) return false;
    /* Your own state is never capped: those are the schools you are most
       likely to actually attend. */
    if (c.school.state !== profile.state && (perState.get(c.school.state) || 0) >= CAP_PER_STATE) return false;
    return true;
  };
  const take = (c) => {
    used.add(c.school.name);
    if (c.school.online === 2) onlineTaken++;
    perState.set(c.school.state, (perState.get(c.school.state) || 0) + 1);
  };

  const bands = SHAPE.map((band) => {
    const pool = candidates
      .filter((c) => c.r.prob >= band.min && c.r.prob < band.max)
      .sort((a, b) => b.rank - a.rank);
    const rows = [];
    for (const c of pool) {
      if (rows.length >= band.want) break;
      if (!allowed(c)) continue;
      take(c);
      rows.push(c);
    }
    return { ...band, pool, rows };
  });

  /* Anything the shape could not fill is spent on the bands that had more to
     offer — a list of twelve is worth more than a shape held open. */
  let shortfall = size - bands.reduce((t, b) => t + b.rows.length, 0);
  for (const band of [...bands].sort((a, b) => b.pool.length - a.pool.length)) {
    while (shortfall > 0) {
      const next = band.pool.find(allowed);
      if (!next) break;
      take(next);
      band.rows.push(next);
      shortfall--;
    }
    if (shortfall <= 0) break;
  }
  for (const band of bands) band.rows.sort((a, b) => b.rank - a.rank);

  return {
    covered,
    major,
    bands: bands.filter((b) => b.rows.length),
    total: bands.reduce((t, b) => t + b.rows.length, 0),
    considered: candidates.length,
  };
}
