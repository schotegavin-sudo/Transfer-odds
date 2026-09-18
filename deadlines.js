/* Transfer application deadlines.
 *
 * A wrong deadline is worse than no deadline, so this file separates two
 * different kinds of claim and the interface never blurs them:
 *
 *   verified  A date published for the whole system, stable year to year, and
 *             checkable in one place. Only the California systems qualify: the
 *             UC and CSU filing periods are system-wide, not per campus.
 *   typical   What schools of this kind usually do. Shown as a period —
 *             "early March" — never as a date, and never with a countdown,
 *             because false precision here costs someone an application.
 *   rolling   Applications are read as they arrive.
 *
 * Every deadline in the interface sits next to a link that opens the school's
 * own page, because this file is a starting point, not an authority.
 */

import { LINK_ROWS } from "./links.js";

/* name -> { id, admissions, apply } */
export const LINKS = new Map(LINK_ROWS.split("\n").map((line) => {
  const [name, id, admissions, apply] = line.split("|");
  return [name, { id, admissions, apply }];
}));

const UC = /^University of California, /;
const CSU = /^(California State University|California State Polytechnic University|California Polytechnic State University|San Diego State|San Jose State|San Francisco State|Sonoma State|California Maritime)/;

export function deadlineFor(school, term = "fall") {
  const open = school.tags.includes("open");
  const spring = term === "spring";

  if (open || school.online === 2) {
    return { kind: "rolling", label: "Rolling — applications read as they arrive", short: "Rolling" };
  }

  if (UC.test(school.name)) {
    return spring
      ? { kind: "verified", date: "07-31", label: "Winter/spring filing period 1–31 July, at select campuses only", short: "31 Jul",
          source: "UC system-wide filing period — most campuses admit transfers for fall only" }
      : { kind: "verified", date: "11-30", label: "Filing period 1 October – 30 November", short: "30 Nov",
          source: "University of California system-wide filing period" };
  }

  if (CSU.test(school.name)) {
    return spring
      ? { kind: "typical", label: "Spring admission is limited and campus by campus — the window has opened in August in past cycles", short: "Typically Aug" }
      : { kind: "verified", date: "11-30", label: "Filing period 1 October – 30 November", short: "30 Nov",
          source: "Cal State Apply priority filing period" };
  }

  /* Everything else is a period, not a date. */
  const selective = school.rate < 40;
  if (school.control === "pub") {
    return spring
      ? { kind: "typical", label: "Typically October, and many state schools read on a rolling basis", short: "Typically Oct" }
      : { kind: "typical", label: selective ? "Typically February or March" : "Typically March through June, often rolling", short: selective ? "Typically Feb–Mar" : "Typically Mar–Jun" };
  }
  return spring
    ? { kind: "typical", label: "Typically late October or November", short: "Typically Oct–Nov" }
    : { kind: "typical", label: selective ? "Typically 1 March" : "Typically March through June", short: selective ? "Typically early Mar" : "Typically Mar–Jun" };
}

/* The next time an MM-DD falls, counted from today. */
export function daysUntil(mmdd, now = new Date()) {
  const [m, d] = mmdd.split("-").map(Number);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let when = new Date(today.getFullYear(), m - 1, d);
  if (when < today) when = new Date(today.getFullYear() + 1, m - 1, d);
  return { days: Math.round((when - today) / 86400000), when };
}

/* Where to check it — the school's own admissions office, its application
 * page, and the federal record behind the numbers. See links.js: every URL is
 * from the US Department of Education's directory and was fetched to confirm
 * it resolves. Where no verified URL exists, the fallback is College
 * Navigator's own search, which is that same federal directory — not a search
 * engine, and never a guessed address. */
export function verifyLinks(school) {
  const link = LINKS.get(school.name);
  const out = [];

  if (link && link.admissions) {
    out.push({ label: "Admissions office", href: link.admissions,
      note: `${hostOf(link.admissions)} — their requirements and dates` });
  }
  if (link && link.apply) {
    out.push({ label: "Apply", href: link.apply, note: `${hostOf(link.apply)} — the application itself` });
  }
  out.push(link
    ? { label: "Federal record", href: `https://nces.ed.gov/collegenavigator/?id=${link.id}`,
        note: "enrolment, cost and admissions, US Dept of Education" }
    : { label: "Find it on College Navigator", href: `https://nces.ed.gov/collegenavigator/?q=${encodeURIComponent(school.name)}&s=all`,
        note: "no verified address for this school — search the federal directory" });

  return out;
}

const hostOf = (url) => { try { return new URL(url).host.replace(/^www\./, ""); } catch { return url; } };
