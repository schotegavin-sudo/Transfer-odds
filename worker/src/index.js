/* Matriculate entitlement API — Cloudflare Worker.
 *
 * The whole reason this exists: everything the site ships to a browser is
 * readable in view-source, so a paywall implemented as an if-statement in the
 * bundle is decoration. The paid tables are not in the bundle at all. They are
 * here, and they are returned only to a request carrying a live licence.
 *
 * Payment runs through Paddle, which is a merchant of record rather than a
 * processor: Paddle is the seller, and registering for, collecting and filing
 * sales tax and VAT is theirs. That is the whole reason it is here. Selling
 * digital goods to an EU consumer creates a VAT obligation on the first sale,
 * with no threshold beneath it, which is not a thing one person should be
 * hand-rolling.
 *
 * Routes
 *   GET  /v1/health              is it up, and which build of the data
 *   POST /v1/activate            { key } -> { ok, tier, since }
 *   GET  /v1/data                Authorization: Bearer <key> -> the paid tables
 *   POST /v1/checkout            -> { url }  a Paddle-hosted checkout
 *   POST /v1/paddle              Paddle webhook: mints and revokes licences
 *   POST /v1/claim               { txn } -> { key } after a completed checkout
 *
 * Bindings (see wrangler.toml)
 *   LICENCES        KV namespace, licence key -> record
 *   PADDLE_API_KEY  secret, pdl_live_apikey_... (or pdl_sdbx_apikey_...)
 *   PADDLE_WEBHOOK  secret, pdl_ntfset_...
 *   PADDLE_API      https://api.paddle.com, or the sandbox host
 *   PRICE_ID        the Paddle price to sell, pri_...
 *   CHECKOUT_URL    the page on our own domain that carries Paddle.js
 *   SITE            allowed origins, comma separated
 */

import COSTS from "../data/costs.txt";
import EARNINGS from "../data/earnings.txt";

const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extra },
  });

/* The site and the API are different origins, so every browser-facing route
   answers preflight. Only the site's own origin is allowed — a licence key is
   a bearer credential and must not be readable by any page that asks. */
const cors = (env, req) => {
  const origin = req.headers.get("Origin") || "";
  const allowed = (env.SITE || "").split(",").map((s) => s.trim()).filter(Boolean);
  const ok = allowed.includes(origin);
  return {
    "access-control-allow-origin": ok ? origin : allowed[0] || "null",
    "access-control-allow-headers": "authorization, content-type",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
};

/* ------------------------------------------------------------------ licences */

/* Crockford base32 without the letters that get misread aloud or in a serif
   font. A key is copied off a screen by hand more often than anyone admits. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function mintKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(15));
  let out = "";
  for (let i = 0; i < 15; i++) {
    out += ALPHABET[bytes[i] % 32];
    if (i % 5 === 4 && i !== 14) out += "-";
  }
  return "MTRC-" + out;
}

const normaliseKey = (k) =>
  String(k || "").toUpperCase().replace(/[^0-9A-Z]/g, "")
    .replace(/^MTRC/, "").replace(/(.{5})/g, "$1-").replace(/-$/, "");

async function readLicence(env, key) {
  const id = normaliseKey(key);
  if (!/^[0-9A-Z]{5}-[0-9A-Z]{5}-[0-9A-Z]{5}$/.test(id)) return null;
  const rec = await env.LICENCES.get("k:" + id, "json");
  if (!rec || rec.status !== "active") return null;
  return { id, ...rec };
}

/* ------------------------------------------------------------------- paddle */

async function paddle(env, path, body) {
  const r = await fetch((env.PADDLE_API || "https://api.paddle.com") + path, {
    method: "POST",
    headers: {
      authorization: "Bearer " + env.PADDLE_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const out = await r.json();
  if (!r.ok) throw new Error(out?.error?.detail || "paddle " + r.status);
  return out.data;
}

/* Paddle signs with HMAC-SHA256 over "<ts>:<raw body>", hex, under the
   notification endpoint secret. Verified by hand because no SDK runs in a
   Worker — and with the same two properties that matter anywhere: a timestamp
   window, without which a captured delivery replays forever, and a
   constant-time compare, because a fast compare on a signature leaks it a byte
   at a time.

   Paddle's own SDKs allow five seconds. That is tight for a cross-internet
   delivery, and a rejected webhook means somebody who paid does not get their
   licence — but Paddle retries a non-2xx for three days, so a delivery lost to
   a latency spike comes back, whereas a window wide enough to be comfortable
   is a window wide enough to replay in. Five seconds stands. */
const SIGNATURE_TOLERANCE = 5;

async function verifyPaddle(env, raw, header) {
  const parts = Object.fromEntries(
    String(header || "").split(";").map((p) => p.split("=").map((x) => x.trim())));
  if (!parts.ts || !parts.h1) return false;
  if (Math.abs(Date.now() / 1000 - Number(parts.ts)) > SIGNATURE_TOLERANCE) return false;

  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey(
    "raw", enc.encode(env.PADDLE_WEBHOOK), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(parts.ts + ":" + raw)));
  const want = parts.h1.match(/.{2}/g)?.map((h) => parseInt(h, 16)) || [];
  if (want.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig[i] ^ want[i];
  return diff === 0;
}

/* --------------------------------------------------------------------- data */

/* One body, built once per isolate. The tables are static between deploys, so
   the expensive thing is not assembling them but shipping them: the response
   is immutable and cacheable at the edge, keyed by nothing but the path,
   because the licence check happens before the cache is consulted. */
let PAYLOAD = null;
const payload = () => (PAYLOAD ??= JSON.stringify({
  version: DATA_VERSION,
  costs: COSTS.trim(),
  earnings: EARNINGS.trim(),
}));

const DATA_VERSION = "2026-09-18";

/* -------------------------------------------------------------------- routes */

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const head = cors(env, req);

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: head });

    try {
      if (url.pathname === "/v1/health")
        return json({ ok: true, data: DATA_VERSION }, 200, head);

      /* ---- activate: does this key work, without handing over the data ---- */
      if (url.pathname === "/v1/activate" && req.method === "POST") {
        const { key } = await req.json().catch(() => ({}));
        const lic = await readLicence(env, key);
        if (!lic) return json({ ok: false, error: "no_such_licence" }, 404, head);
        return json({ ok: true, tier: "paid", since: lic.created }, 200, head);
      }

      /* ---- data: the paid tables, only with a live licence ---- */
      if (url.pathname === "/v1/data") {
        const key = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
        const lic = await readLicence(env, key);
        if (!lic) return json({ ok: false, error: "not_entitled" }, 402, head);
        return new Response(payload(), {
          headers: {
            ...head,
            "content-type": "application/json; charset=utf-8",
            /* Private: this body must never be held by a shared cache. */
            "cache-control": "private, max-age=3600",
          },
        });
      }

      /* ---- checkout ----
         Paddle's hosted checkout is a page on our own approved domain that
         carries Paddle.js; the API hands back its URL with the transaction id
         appended, and Paddle.js opens the overlay when the buyer lands. */
      if (url.pathname === "/v1/checkout" && req.method === "POST") {
        const txn = await paddle(env, "/transactions", {
          items: [{ price_id: env.PRICE_ID, quantity: 1 }],
          checkout: { url: env.CHECKOUT_URL },
        });
        return json({ url: txn.checkout?.url, txn: txn.id }, 200, head);
      }

      /* ---- webhook ---- */
      if (url.pathname === "/v1/paddle" && req.method === "POST") {
        const raw = await req.text();
        if (!(await verifyPaddle(env, raw, req.headers.get("paddle-signature"))))
          return json({ ok: false, error: "bad_signature" }, 400);

        const evt = JSON.parse(raw);
        const o = evt.data || {};

        if (evt.event_type === "transaction.completed") {
          /* Paddle retries a delivery it did not hear back from, so minting
             must be idempotent: the transaction id is the identity of the
             purchase, and a second delivery returns the first key rather than
             handing the same buyer a second licence. */
          const existing = await env.LICENCES.get("t:" + o.id);
          if (existing) return json({ ok: true, key: existing });

          const key = mintKey();
          const rec = {
            status: "active",
            created: new Date().toISOString().slice(0, 10),
            email: o.customer?.email || o.billing_details?.email || null,
            txn: o.id,
            customer: o.customer_id || null,
          };
          await env.LICENCES.put("k:" + key.replace(/^MTRC-/, ""), JSON.stringify(rec));
          await env.LICENCES.put("t:" + o.id, key);
          return json({ ok: true });
        }

        /* A refund or a chargeback ends the licence. Paddle models both as an
           adjustment against the original transaction, so the transaction id
           leads straight back to the key that was minted for it. */
        if (evt.event_type === "adjustment.created" &&
            ["refund", "chargeback", "chargeback_warning"].includes(o.action)) {
          const key = o.transaction_id && await env.LICENCES.get("t:" + o.transaction_id);
          if (key) {
            const id = key.replace(/^MTRC-/, "");
            const rec = await env.LICENCES.get("k:" + id, "json");
            if (rec) await env.LICENCES.put("k:" + id,
              JSON.stringify({ ...rec, status: "revoked", revoked: o.action }));
          }
          return json({ ok: true });
        }

        return json({ ok: true, ignored: evt.event_type });
      }

      /* ---- claim: exchange a completed transaction for its key ---- */
      if (url.pathname === "/v1/claim" && req.method === "POST") {
        const { txn } = await req.json().catch(() => ({}));
        if (!/^txn_[A-Za-z0-9]+$/.test(String(txn || "")))
          return json({ ok: false, error: "bad_transaction" }, 400, head);
        const key = await env.LICENCES.get("t:" + txn);
        /* The webhook may not have landed yet: "not ready" is a real state and
           the page retries, rather than telling a buyer their payment failed. */
        if (!key) return json({ ok: false, error: "not_ready" }, 404, head);
        return json({ ok: true, key }, 200, head);
      }

      return json({ ok: false, error: "not_found" }, 404, head);
    } catch (err) {
      return json({ ok: false, error: "server_error" }, 500, head);
    }
  },
};
