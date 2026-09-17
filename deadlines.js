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
      ? { kind: "none", label: "Most UC campuses admit transfers for fall only", short: "Fall only" }
      : { kind: "verified", date: "11-30", label: "Filing period 1–30 November", short: "30 Nov",
          source: "University of California system-wide filing period" };
  }

  if (CSU.test(school.name)) {
    return spring
      ? { kind: "verified", date: "08-31", label: "Spring filing period opens 1 August at participating campuses", short: "31 Aug",
          source: "Cal State Apply filing period" }
      : { kind: "verified", date: "11-30", label: "Filing period 1 October – 30 November", short: "30 Nov",
          source: "Cal State Apply filing period" };
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

/* Where to check it, and where the admit rate came from. Each opens a search
   rather than a page we assert is correct — a guessed URL that 404s, or lands
   on the wrong campus, is worse than an honest search. */
export function verifyLinks(school) {
  const q = encodeURIComponent(`"${school.name}"`);
  return [
    { label: "Transfer admissions", href: `https://duckduckgo.com/?q=${q}+transfer+admission+deadline+requirements`,
      note: "the school's own requirements and dates" },
    { label: "Common Data Set", href: `https://duckduckgo.com/?q=${q}+%22common+data+set%22`,
      note: "section D carries the transfer admit numbers" },
    { label: "College Navigator", href: `https://nces.ed.gov/collegenavigator/?q=${encodeURIComponent(school.name)}&s=all`,
      note: "IPEDS, US Department of Education, public domain" },
  ];
}
