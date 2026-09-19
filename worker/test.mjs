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

/* 2. A forged webhook is rejected, and mints nothing. */
const body = JSON.stringify({ event_type: "transaction.completed",
  data: { id: "txn_01abc", customer: { email: "buyer@example.com" } } });
r = await hook(body, "ts=" + Math.floor(Date.now()/1000) + ";h1=deadbeef");
ok(r.status === 400, `forged signature accepted (${r.status})`);
ok(store.size === 0, "a forged webhook wrote to the store");

/* 3. A replayed (old) delivery is rejected even with a valid signature. */
const oldTs = Math.floor(Date.now() / 1000) - 600;
r = await hook(body, await sign(body, oldTs));
ok(r.status === 400, `a 10-minute-old delivery was accepted (${r.status})`);
ok(store.size === 0, "a replayed webhook wrote to the store");

/* 4. A genuine delivery mints a licence. */
r = await hook(body, await sign(body));
ok(r.status === 200, `genuine webhook gave ${r.status}`);
const key = store.get("t:txn_01abc");
ok(/^MTRC-[0-9A-Z]{5}-[0-9A-Z]{5}-[0-9A-Z]{5}$/.test(key || ""), `bad key format: ${key}`);

/* 5. Re-delivery is idempotent — the same key, not a second licence. */
const before = store.size;
r = await hook(body, await sign(body));
ok(store.get("t:txn_01abc") === key, "a retry minted a different key");
ok(store.size === before, "a retry created extra records");

/* 6. The key now buys the data. */
r = await worker.fetch(new Request("https://api/v1/data",
  { headers: { ...ORIGIN, authorization: "Bearer " + key } }), env);
ok(r.status === 200, `entitled /v1/data gave ${r.status}`);
const payload = await r.json();
ok(payload.costs.length > 10000 && payload.earnings.length > 10000, "the payload came back thin");
ok((r.headers.get("cache-control") || "").includes("private"), "the paid body is not marked private");

/* 7. Claim returns the key for that transaction. */
r = await worker.fetch(new Request("https://api/v1/claim", { method: "POST", headers: ORIGIN,
  body: JSON.stringify({ txn: "txn_01abc" }) }), env);
ok((await r.json()).key === key, "claim did not return the minted key");

/* 8. A refund revokes it. */
const refund = JSON.stringify({ event_type: "adjustment.created",
  data: { action: "refund", transaction_id: "txn_01abc" } });
await hook(refund, await sign(refund));
r = await worker.fetch(new Request("https://api/v1/data",
  { headers: { ...ORIGIN, authorization: "Bearer " + key } }), env);
ok(r.status === 402, `a refunded licence still bought data (${r.status})`);

/* 9. A stranger's origin is not given the CORS grant. */
r = await worker.fetch(new Request("https://api/v1/health", { headers: { Origin: "https://evil.example" } }), env);
ok(r.headers.get("access-control-allow-origin") !== "https://evil.example", "CORS allowed an unknown origin");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
