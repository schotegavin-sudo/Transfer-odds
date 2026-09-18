/* What this browser is allowed to see.
 *
 * Free covers the thing the app is for: admission estimates, the fits slate,
 * how big a programme is, deadlines, and the transfer guarantees. Paid covers
 * the money and the outcomes — net price by income band, graduation and
 * retention, graduate earnings and debt — plus an unlimited list, CSV export
 * and share links.
 *
 * The important property is that this module cannot be lied to in a way that
 * matters. It holds no copy of the paid tables and no flag that unlocks them;
 * setting isPaid() true in a console buys an empty table and a card that says
 * so, because the figures are not in this bundle. They arrive over the wire
 * from the entitlement API or they do not arrive.
 *
 * A licence key is stored in this browser, like the record it sits beside, and
 * is sent to the API and nowhere else. There is no account and no password.
 * When accounts arrive, they replace activate() and restore() and nothing
 * else: the rest of the app asks this module questions, never the network.
 */

export const API = "https://matriculate-api.schotegavin.workers.dev";
export const FREE_LIST_LIMIT = 5;

const STORE = "matriculate:licence:v1";

let key = null;
let tier = "free";
let rows = null;                    /* { costs, earnings } once fetched */
const listeners = new Set();

const read = () => { try { return localStorage.getItem(STORE); } catch { return null; } };
const write = (v) => { try { v ? localStorage.setItem(STORE, v) : localStorage.removeItem(STORE); } catch {} };

export const isPaid = () => tier === "paid";
export const paidRows = () => rows;
export const licenceKey = () => key;
export const onEntitlementChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const announce = () => listeners.forEach((f) => { try { f(); } catch {} });

/* The list cap is the one limit that is enforced in the browser, because it
   is about this browser's own saved list rather than about data it should not
   hold. It is a product limit, not a secret. */
export const listLimit = () => (isPaid() ? Infinity : FREE_LIST_LIMIT);

async function fetchRows(k) {
  const r = await fetch(API + "/v1/data", { headers: { authorization: "Bearer " + k } });
  if (r.status === 402) return { ok: false, error: "not_entitled" };
  if (!r.ok) return { ok: false, error: "unreachable" };
  const body = await r.json();
  return { ok: true, costs: body.costs, earnings: body.earnings };
}

/* Called once at boot. A network failure must never downgrade someone who has
   paid into a browser that silently hides what they bought — so a key that is
   present but unverifiable leaves the tier alone and reports the reason, and
   the interface says the figures could not be loaded rather than pretending
   they do not exist. */
export async function restoreEntitlement() {
  const stored = read();
  if (!stored) return { ok: false, error: "no_licence" };
  key = stored;
  const got = await fetchRows(stored).catch(() => ({ ok: false, error: "unreachable" }));
  if (got.ok) {
    rows = { costs: got.costs, earnings: got.earnings };
    tier = "paid";
    announce();
    return { ok: true };
  }
  if (got.error === "not_entitled") { key = null; write(null); }
  announce();
  return got;
}

export async function activate(candidate) {
  const k = String(candidate || "").trim().toUpperCase();
  if (!k) return { ok: false, error: "empty" };
  const got = await fetchRows(k).catch(() => ({ ok: false, error: "unreachable" }));
  if (!got.ok) return got;
  key = k;
  rows = { costs: got.costs, earnings: got.earnings };
  tier = "paid";
  write(k);
  announce();
  return { ok: true };
}

export function deactivate() {
  key = null; rows = null; tier = "free";
  write(null);
  announce();
}

/* After Stripe sends the buyer back, the success URL carries the session id;
   the key is exchanged for it once and then lives in this browser. */
export async function claimFromSession(session) {
  const r = await fetch(API + "/v1/claim", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ session }),
  }).catch(() => null);
  if (!r || !r.ok) return { ok: false, error: r ? "not_ready" : "unreachable" };
  const body = await r.json();
  return body.key ? activate(body.key) : { ok: false, error: "not_ready" };
}

export async function beginCheckout() {
  const r = await fetch(API + "/v1/checkout", { method: "POST" }).catch(() => null);
  if (!r || !r.ok) return { ok: false, error: "unreachable" };
  const body = await r.json();
  if (!body.url) return { ok: false, error: "unreachable" };
  location.href = body.url;
  return { ok: true };
}
