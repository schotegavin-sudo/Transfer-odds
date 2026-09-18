/* What each school's programs actually look like, field by field.
 *
 * There is no public, reusable ranking of program quality. The magazine
 * rankings are copyrighted opinion surveys, and a quality score of my own
 * invention would be exactly the kind of made-up number the rest of this app
 * refuses to print. So this module ranks nothing on reputation. It reports
 * four measured things about a program and lets you sort on them:
 *
 *   scale     bachelor's degrees the school awarded in the field last year.
 *             Separates a staffed department from a line in the catalogue.
 *   focus     how much more of this campus's degrees go to this field than
 *             the national average. A campus built around a subject shows up
 *             here even when it is small.
 *   outcome   median earnings of that program's graduates one year out,
 *             against the national median for the same field. Federal tax
 *             records, so it is measured rather than surveyed — but it reads
 *             who enrolled as much as what was taught, and it is nominal, so
 *             an expensive city lifts it. Never read it alone.
 *   burden    median debt at graduation against those first-year earnings.
 *
 * The Department suppresses any figure drawn from too few graduates to publish
 * safely, so roughly a third of programs carry a scale and nothing else. Those
 * are shown as unpublished, never estimated.
 */

import { SCHOOLS, BY_NAME } from "./model.js";
import { LINK_ROWS } from "./links.js";

const CIP_BY_MAJOR = {};   /* filled by setCipMap, from the generated table */
/* Fields that count only toward "does this school run this major". Never used
   for a figure — see tools/cip-equivalents.json for why the two are separate. */
const ALSO_BY_MAJOR = {};

/* unitid -> school, so the federal rows can find their way back to a card. */
const BY_UNITID = new Map();
for (const line of LINK_ROWS.split("\n")) {
  const [name, unitid] = line.split("|");
  const school = BY_NAME.get((name || "").trim());
  if (school && unitid && unitid.trim()) BY_UNITID.set(unitid.trim(), school);
}

let cache = null;

/* The data table is 350 KB, which nobody should pay for on a page they may
   never open. It is fetched the first time a program view is asked for. In the
   offline single-file build there is nothing to fetch, so the bundle hands the
   rows over on globalThis instead. */
export async function loadPrograms() {
  if (cache) return cache;
  const mod = globalThis.__PROGRAM_DATA__ || await import("./programs.js");
  cache = build(mod);
  return cache;
}
export const programsReady = () => cache;

function build({ CIP_ROWS, STATE_ROWS, PROGRAM_ROWS, NATIONAL_AWARDS, MAJOR_CIP, MAJOR_CIP_ALSO }) {
  setCipMap(MAJOR_CIP, MAJOR_CIP_ALSO);

  const fields = new Map();
  for (const line of CIP_ROWS.split("\n")) {
    const [cip, title, awards, earn, programs] = line.split("|");
    fields.set(cip, {
      cip,
      title,
      natAwards: Number(awards),
      natEarn: earn ? Number(earn) * 100 : null,
      natPrograms: Number(programs),
      share: Number(awards) / NATIONAL_AWARDS,
    });
  }

  /* Earnings are nominal, and a nurse in California is paid half again what a
     nurse in Alabama is paid for the same work. Read against the national
     median alone, "the best nursing programs" comes out as a list of
     California, which is a fact about wages, not about teaching. So each field
     also carries the median for its own state, and a school can be read
     against the market it sits in. */
  for (const line of (STATE_ROWS || "").split("\n").filter(Boolean)) {
    const [cip, rest] = line.split(":");
    const field = fields.get(cip);
    if (!field) continue;
    field.states = new Map();
    for (const chunk of rest.split(";")) {
      const [st, earn, programs] = chunk.split(",");
      field.states.set(st, { earn: Number(earn) * 100, programs: Number(programs) });
    }
  }

  /* A major is measured against itself nationally, not against whichever
     federal field a particular school happened to file it under. Computer
     Science is reported under two codes, English under two more, and a school
     that uses the smaller code would otherwise be ranked against a national
     median drawn from a few hundred graduates instead of thirty thousand. So
     the fields a major spans are pooled first, and every school in that major
     is then read against the one pooled figure.

     The pooled earnings figure is the awards-weighted blend of those fields'
     national medians. A blend of medians is not itself a median; in practice
     one field carries almost all of the awards and the blend sits on it. */
  const majors = new Map();
  for (const [majorId, cips] of Object.entries(MAJOR_CIP)) {
    const list = cips.map((c) => fields.get(c)).filter(Boolean);
    if (!list.length) continue;
    const natAwards = list.reduce((t, f) => t + f.natAwards, 0);
    const earning = list.filter((f) => f.natEarn !== null && f.natAwards > 0);
    const weight = earning.reduce((t, f) => t + f.natAwards, 0);
    majors.set(majorId, {
      id: majorId,
      fields: list,
      natAwards,
      natShare: natAwards / NATIONAL_AWARDS,
      natEarn: weight ? Math.round(earning.reduce((t, f) => t + f.natEarn * f.natAwards, 0) / weight) : null,
      natPrograms: list.reduce((t, f) => t + f.natPrograms, 0),
      /* The same awards-weighted blend, per state. */
      stateEarn: (() => {
        const out = new Map();
        const states = new Set(list.flatMap((f) => [...(f.states?.keys() || [])]));
        for (const st of states) {
          let sum = 0, weight = 0, programs = 0;
          for (const f of list) {
            const row = f.states?.get(st);
            if (!row || !f.natAwards) continue;
            sum += row.earn * f.natAwards;
            weight += f.natAwards;
            programs += row.programs;
          }
          if (weight) out.set(st, { earn: Math.round(sum / weight), programs });
        }
        return out;
      })(),
      rows: [],
    });
  }

  /* Every school's raw rows, before they are folded into majors. */
  const rawBySchool = new Map();
  for (const line of PROGRAM_ROWS.split("\n")) {
    const [head, rest] = line.split(":");
    const [unitid, total] = head.split(",");
    const school = BY_UNITID.get(unitid);
    if (!school) continue;
    const campusAwards = Number(total);
    const list = [];
    for (const chunk of rest.split(";")) {
      const [cip, n, e1, e2, dbt] = chunk.split(",");
      const field = fields.get(cip);
      if (!field) continue;
      list.push({
        field, cip, campusAwards,
        awards: Number(n),
        earn1: e1 ? Number(e1) * 100 : null,
        earn2: e2 ? Number(e2) * 100 : null,
        debt: dbt ? Number(dbt) * 100 : null,
      });
    }
    rawBySchool.set(school.name, { school, campusAwards, list });
  }

  /* One record per school per major: the degrees add up across the fields the
     major spans, and the money comes from the largest single field that has a
     published figure — never an average of two medians. */
  const bySchool = new Map();
  for (const [name, { school, campusAwards, list }] of rawBySchool) {
    const out = [];
    for (const [majorId, major] of majors) {
      const wanted = new Set(major.fields.map((f) => f.cip));
      const rows = list.filter((r) => wanted.has(r.cip));
      if (!rows.length) continue;
      const awards = rows.reduce((t, r) => t + r.awards, 0);
      const measured = rows.filter((r) => r.earn1 !== null).sort((a, b) => b.awards - a.awards)[0] || null;
      const p = {
        school, major, majorId, campusAwards, awards,
        /* Which field the money below was actually measured on, and how many
           of the degrees above it covers. */
        source: measured ? measured.field : null,
        sourceAwards: measured ? measured.awards : 0,
        split: rows.length > 1,
        fields: rows,
        earn1: measured ? measured.earn1 : null,
        earn2: measured ? measured.earn2 : null,
        debt: measured ? measured.debt : null,
        index: measured && major.natEarn ? measured.earn1 / major.natEarn : null,
        focus: campusAwards > 0 && major.natShare > 0 ? (awards / campusAwards) / major.natShare : null,
      };
      p.burden = p.debt && p.earn1 ? p.debt / p.earn1 : null;
      /* The same comparison against the school's own state. Absent where too
         few programs in that state publish a figure to draw a line through,
         and absent for a school that teaches primarily online: its state is
         where it is incorporated, not where its graduates take jobs, so the
         local market says nothing about them. */
      const local = school.online === 2 ? null : major.stateEarn.get(school.state);
      p.stateEarn = local ? local.earn : null;
      p.statePrograms = local ? local.programs : 0;
      p.localIndex = measured && local ? measured.earn1 / local.earn : null;
      out.push(p);
      major.rows.push(p);
    }
    bySchool.set(name, out);
  }

  return {
    fields,
    majors,
    nationalAwards: NATIONAL_AWARDS,

    major: (majorId) => majors.get(majorId) || null,
    covered: (majorId) => majors.has(majorId),

    /* Does this school run this major at all?
     *
     * Deliberately more generous than at(): a school that files the programme
     * under a neighbouring code still counts, because the cost of wrongly
     * hiding a school from somebody is a lost option, while the cost of
     * wrongly showing one is a click. Answers null when the major has no
     * federal field of its own and the question cannot be asked. */
    runsMajor(school, majorId) {
      if (!majors.has(majorId)) return null;
      const rows = rawBySchool.get(school.name);
      if (!rows) return null;
      const wanted = new Set([
        ...(CIP_BY_MAJOR[majorId] || []),
        ...(ALSO_BY_MAJOR[majorId] || []),
      ]);
      return rows.list.some((r) => wanted.has(r.cip) && r.awards > 0);
    },

    /* What a given school offers in a given major. */
    at(school, majorId) {
      return (bySchool.get(school.name) || []).find((p) => p.majorId === majorId) || null;
    },

    /* Everything a school awards, strongest outcome first — what this campus
       is doing best by its graduates' first year of earnings. */
    strongestAt(school, { minAwards = 15 } = {}) {
      return (bySchool.get(school.name) || [])
        .filter((p) => p.index !== null && p.awards >= minAwards)
        .sort((a, b) => b.index - a.index);
    },

    /* Every school in the database that runs a program in this major. */
    schoolsForMajor(majorId, { minAwards = 0, earningsOnly = false } = {}) {
      const major = majors.get(majorId);
      if (!major) return [];
      return major.rows.filter((p) => p.awards >= minAwards && (!earningsOnly || p.index !== null));
    },

    schoolCount: bySchool.size,
    programCount: [...bySchool.values()].reduce((t, l) => t + l.length, 0),
  };
}

export function setCipMap(map, also = {}) {
  for (const k of Object.keys(CIP_BY_MAJOR)) delete CIP_BY_MAJOR[k];
  Object.assign(CIP_BY_MAJOR, map);
  for (const k of Object.keys(ALSO_BY_MAJOR)) delete ALSO_BY_MAJOR[k];
  Object.assign(ALSO_BY_MAJOR, also);
}

/* ------------------------------------------------------------------ sorts */

export const PROGRAM_SORTS = {
  outcome: {
    label: "Earnings against the national median",
    note: "Median pay one year out, as a multiple of the national median for the same field.",
    cmp: (a, b) => (b.index ?? -1) - (a.index ?? -1) || b.awards - a.awards,
    needsEarnings: true,
  },
  local: {
    label: "Earnings against the school's own state",
    note: "The same comparison, against graduates of the field in that state. In a field whose pay is set regionally — nursing, teaching, social work — this is the one that says something about the school rather than about the state.",
    cmp: (a, b) => (b.localIndex ?? -1) - (a.localIndex ?? -1) || b.awards - a.awards,
    needsEarnings: true,
    needsState: true,
  },
  earnings: {
    label: "Median earnings, one year out",
    note: "The raw figure, before any comparison. A city campus will sit above a rural one on cost of living alone.",
    cmp: (a, b) => (b.earn1 ?? -1) - (a.earn1 ?? -1),
    needsEarnings: true,
  },
  size: {
    label: "Size of the program",
    note: "Bachelor's degrees awarded in the field last year. Scale is not quality, but it does tell you a department exists.",
    cmp: (a, b) => b.awards - a.awards,
    needsEarnings: false,
  },
  focus: {
    label: "How central the field is to the campus",
    note: "Degrees in this field per degree the campus awards, against the national ratio.",
    cmp: (a, b) => (b.focus ?? -1) - (a.focus ?? -1),
    needsEarnings: false,
  },
  burden: {
    label: "Lowest debt against earnings",
    note: "Median debt at graduation divided by median earnings a year later. Under 1.0 is generally considered manageable.",
    cmp: (a, b) => (a.burden ?? 99) - (b.burden ?? 99),
    needsEarnings: true,
  },
};
