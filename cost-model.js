/* Cost and completion, per school.
 *
 * Small enough (25 KB) to load with everything else, unlike the program
 * tables — so cost is available the moment a card renders, with nothing to
 * wait for.
 *
 * The two figures answer different questions and carry different weight:
 *
 *   NET PRICE is what a household at your income actually paid, after grants.
 *   It is the honest price, and it is nothing like the sticker: Harvard costs
 *   $2,091 a year at $48-75k and $53,337 above $110k. Reporting one average
 *   would mislead almost everyone, so the band is asked for and the average is
 *   only a fallback for people who would rather not say.
 *
 *   GRADUATION RATE is the federal first-time, full-time figure, which
 *   excludes transfer students by construction. Every reader of this app is a
 *   transfer student, so the number describes the campus they are joining
 *   rather than people like them, and it is labelled that way everywhere it
 *   is shown. It is still worth knowing — a campus where a third of freshmen
 *   finish is telling you something real — but it is not their rate.
 */

import { COST_ROWS, INCOME_BANDS } from "./costs.js";
import { BY_NAME } from "./model.js";
import { LINK_ROWS } from "./links.js";

export { INCOME_BANDS };

const BAND_INDEX = Object.fromEntries(INCOME_BANDS.map(([k], i) => [k, i]));

/* unitid -> school, the same join the program tables use. Named apart from
   the program table's map because the offline build concatenates every module
   into one scope, where two top-level consts of the same name collide. */
const COST_BY_UNITID = new Map();
for (const line of LINK_ROWS.split("\n")) {
  const [name, unitid] = line.split("|");
  const school = BY_NAME.get((name || "").trim());
  if (school && unitid && unitid.trim()) COST_BY_UNITID.set(unitid.trim(), school);
}

/* Local to this module; app.js has its own `money` for formatting, and the
   offline build shares one scope. */
const dollars = (v) => (v === "" || v === undefined ? null : Number(v) * 100);
const percent = (v) => (v === "" || v === undefined ? null : Number(v));

const BY_SCHOOL = new Map();
for (const line of COST_ROWS.split("\n")) {
  const f = line.split("|");
  const school = COST_BY_UNITID.get(f[0]);
  if (!school) continue;
  BY_SCHOOL.set(school.name, {
    net: dollars(f[1]),
    byBand: [dollars(f[2]), dollars(f[3]), dollars(f[4]), dollars(f[5]), dollars(f[6])],
    tuitionIn: dollars(f[7]),
    tuitionOut: dollars(f[8]),
    gradRate: percent(f[9]),
    retention: percent(f[10]),
  });
}

/* What this school costs a household in the given band.
 *
 * Falls back to the all-incomes average when the band is unknown or the
 * Department did not publish that band, and says which it gave back so the
 * page can label it honestly rather than passing an average off as personal. */
export function costFor(school, band) {
  const row = BY_SCHOOL.get(school.name);
  if (!row) return null;

  const i = BAND_INDEX[band];
  const banded = i === undefined ? null : row.byBand[i];
  const net = banded ?? row.net;

  return {
    ...row,
    net,
    /* "band" — the figure is for this household's income.
       "average" — it is the all-incomes average, standing in.
       null — nothing published. */
    basis: net === null ? null : banded !== null ? "band" : "average",
    /* Out-of-state students pay the higher tuition at a public university, and
       the net price above is a blend of both, so the gap is worth naming. */
    /* True where grant aid exceeds the cost of attendance and the student is
       paid to attend. Rare, real, and worth saying outright rather than
       printing a negative dollar amount and leaving it to be puzzled over. */
    aidExceedsCost: net !== null && net < 0,
    nonResidentGap:
      row.tuitionIn !== null && row.tuitionOut !== null && row.tuitionOut > row.tuitionIn
        ? row.tuitionOut - row.tuitionIn
        : null,
  };
}

export const hasCost = (school) => BY_SCHOOL.has(school.name);
export const costCount = BY_SCHOOL.size;
