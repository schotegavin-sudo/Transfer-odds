/* Exercises the Worker's real handler with a stub KV and a stub Paddle. */
import { readFileSync } from "fs";
const R = new URL(".", import.meta.url).pathname;
let src = readFileSync(R + "src/index.js", "utf8")
  .replace('import COSTS from "../data/costs.txt";', 'const COSTS = globalThis.__COSTS__;')
  .replace('import EARNINGS from "../data/earnings.txt";', 'const EARNINGS = globalThis.__EARNINGS__;');
globalThis.__COSTS__ = readFileSync(R + "data/costs.txt", "utf8");
globalThis.__EARNINGS__ = readFileSync(R + "data/earnings.txt", "utf8");
const mod = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
const worker = mod.default;

const store = new Map();
const env = {
  LICENCES: {
    get: async (k, t) => { const v = store.get(k); return v === undefined ? null : (t === "json" ? JSON.parse(v) : v); },
    put: async (k, v) => void store.set(k, v),
  },
  PADDLE_WEBHOOK: "pdl_ntfset_TESTSECRET",
  PRICE_YEARLY: "pri_yearly", PRICE_MONTHLY: "pri_monthly",
  SITE: "https://matriculate.pages.dev",
};
const ORIGIN = { Origin: "https://matriculate.pages.dev" };
let pass = 0, fail = 0;
const ok = (c, m) => c ? pass++ : (fail++, console.log("  FAIL " + m));

async function sign(body, ts = Math.floor(Date.now() / 1000)) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.PADDLE_WEBHOOK),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const s = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(ts + ":" + body)));
  return `ts=${ts};h1=` + [...s].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const hook = (body, sig) => worker.fetch(new Request("https://api/v1/paddle",
  { method: "POST", body, headers: { "paddle-signature": sig } }), env);

/* 1. Data is refused without a licence. */
let r = await worker.fetch(new Request("https://api/v1/data", { headers: ORIGIN }), env);
ok(r.status === 402, `unauthenticated /v1/data gave ${r.status}, expected 402`);

const SUB = "sub_01test";
const made = (status, txn) => JSON.stringify({
  event_type: "subscription.created",
  data: { id: SUB, status, transaction_id: txn, customer_id: "ctm_01test",
          items: [{ price: { id: env.PRICE_YEARLY } }] },
});
const changed = (status) => JSON.stringify({
  event_type: "subscription.updated",
  data: { id: SUB, status, items: [{ price: { id: env.PRICE_YEARLY } }] },
});

/* 2. A forged webhook is rejected, and mints nothing. */
r = await hook(made("active", "txn_01a"), "ts=" + Math.floor(Date.now()/1000) + ";h1=deadbeef");
ok(r.status === 400, `forged signature accepted (${r.status})`);
ok(store.size === 0, "a forged webhook wrote to the store");

/* 3. A replayed delivery is rejected even with a valid signature. */
const oldTs = Math.floor(Date.now() / 1000) - 600;
r = await hook(made("active", "txn_01a"), await sign(made("active", "txn_01a"), oldTs));
ok(r.status === 400, `a 10-minute-old delivery was accepted (${r.status})`);
ok(store.size === 0, "a replayed webhook wrote to the store");

/* 4. A genuine subscription mints a licence. */
r = await hook(made("active", "txn_01a"), await sign(made("active", "txn_01a")));
ok(r.status === 200, `genuine webhook gave ${r.status}`);
const key = store.get("s:" + SUB);
ok(/^MTRC-[0-9A-Z]{5}-[0-9A-Z]{5}-[0-9A-Z]{5}$/.test(key || ""), `bad key format: ${key}`);
ok(store.get("t:txn_01a") === key, "the transaction was not mapped to the key for claiming");

/* 5. Re-delivery is idempotent. */
const before = store.size;
r = await hook(made("active", "txn_01a"), await sign(made("active", "txn_01a")));
ok(store.get("s:" + SUB) === key, "a retry minted a different key");
ok(store.size === before, "a retry created extra records");

/* 6. The key buys the data, and the body is never shared-cacheable. */
const dataWith = (k) => worker.fetch(new Request("https://api/v1/data",
  { headers: { ...ORIGIN, authorization: "Bearer " + k } }), env);
r = await dataWith(key);
ok(r.status === 200, `entitled /v1/data gave ${r.status}`);
const payload = await r.json();
ok(payload.costs.length > 10000 && payload.earnings.length > 10000, "the payload came back thin");
ok((r.headers.get("cache-control") || "").includes("private"), "the paid body is not marked private");

/* 7. Claim returns the key for the transaction the browser came back with. */
r = await worker.fetch(new Request("https://api/v1/claim", { method: "POST", headers: ORIGIN,
  body: JSON.stringify({ txn: "txn_01a" }) }), env);
ok((await r.json()).key === key, "claim did not return the minted key");

/* 8. A RENEWAL must not mint a second licence.
   This is the bug that made the rewrite necessary: access used to be minted
   from transaction.completed, so every month's renewal would have handed the
   same person another key. */
const renewal = JSON.stringify({ event_type: "transaction.completed",
  data: { id: "txn_02renewal", subscription_id: SUB } });
const keysBefore = [...store.keys()].filter((k) => k.startsWith("k:")).length;
await hook(renewal, await sign(renewal));
const keysAfter = [...store.keys()].filter((k) => k.startsWith("k:")).length;
ok(keysAfter === keysBefore, `a renewal minted ${keysAfter - keysBefore} extra licence(s)`);

/* 9. A failed payment does NOT take access away — Paddle is still retrying. */
await hook(changed("past_due"), await sign(changed("past_due")));
ok((await dataWith(key)).status === 200, "a past_due subscription lost access while Paddle was still retrying");

/* 10. Recovery restores it. */
await hook(changed("active"), await sign(changed("active")));
ok((await dataWith(key)).status === 200, "a recovered subscription did not regain access");

/* 11. CANCELLATION revokes. The other half of the same bug: nothing used to
   listen for it, so a cancelled subscription would have kept working. */
await hook(changed("canceled"), await sign(changed("canceled")));
ok((await dataWith(key)).status === 402, "a cancelled subscription kept its access");

/* 12. A pause revokes too, and a resume brings it back. */
await hook(changed("paused"), await sign(changed("paused")));
ok((await dataWith(key)).status === 402, "a paused subscription kept its access");
await hook(changed("active"), await sign(changed("active")));
ok((await dataWith(key)).status === 200, "a resumed subscription did not regain access");

/* 13. A refund revokes regardless of subscription state. */
const refund = JSON.stringify({ event_type: "adjustment.created",
  data: { action: "refund", subscription_id: SUB } });
await hook(refund, await sign(refund));
ok((await dataWith(key)).status === 402, "a refunded licence still bought data");

/* 14. Checkout takes a plan name, never a price id — otherwise anyone could
   bill themselves against any price in the account. */
const checkout = (body) => worker.fetch(new Request("https://api/v1/checkout",
  { method: "POST", headers: ORIGIN, body: JSON.stringify(body) }), env);
ok((await checkout({ plan: "nonsense" })).status === 400, "an unknown plan was accepted");
ok((await checkout({})).status === 400, "a missing plan was accepted");
ok((await checkout({ price_id: "pri_someoneelses" })).status === 400,
  "a raw price id was accepted from the client");

/* 15. A stranger's origin is not given the CORS grant. */
r = await worker.fetch(new Request("https://api/v1/health", { headers: { Origin: "https://evil.example" } }), env);
ok(r.headers.get("access-control-allow-origin") !== "https://evil.example", "CORS allowed an unknown origin");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
