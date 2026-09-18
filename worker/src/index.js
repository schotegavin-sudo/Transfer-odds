/* Matriculate entitlement API — Cloudflare Worker.
 *
 * The whole reason this exists: everything the site ships to a browser is
 * readable in view-source, so a paywall implemented as an if-statement in the
 * bundle is decoration. The paid tables are not in the bundle at all. They are
 * here, and they are returned only to a request carrying a live licence.
 *
 * Routes
 *   GET  /v1/health              is it up, and which build of the data
 *   POST /v1/activate            { key } -> { ok, tier, since }
 *   GET  /v1/data                Authorization: Bearer <key> -> the paid tables
 *   POST /v1/checkout            { price } -> { url }   Stripe Checkout
 *   POST /v1/stripe              Stripe webhook: mints and revokes licences
 *
 * Bindings (see wrangler.toml)
 *   LICENCES        KV namespace, licence key -> record
 *   STRIPE_SECRET   secret, sk_...
 *   STRIPE_WEBHOOK  secret, whsec_...
 *   PRICE_ID        the Stripe price to sell
 *   SITE            the site origin, for CORS and Checkout redirects
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

/* ------------------------------------------------------------------- stripe */

const form = (o) => new URLSearchParams(o).toString();

async function stripe(env, path, body, method = "POST") {
  const r = await fetch("https://api.stripe.com/v1/" + path, {
    method,
    headers: {
      authorization: "Bearer " + env.STRIPE_SECRET,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: body ? form(body) : undefined,
  });
  const out = await r.json();
  if (!r.ok) throw new Error(out?.error?.message || "stripe " + r.status);
  return out;
}

/* Stripe signs webhooks with HMAC-SHA256 over "<timestamp>.<raw body>". The
   SDK is not available in a Worker, so this verifies by hand — including the
   timestamp window, without which a captured delivery could be replayed
   forever, and a constant-time compare, because a fast string compare on a
   signature leaks it a byte at a time. */
async function verifyStripe(env, raw, header) {
  const parts = Object.fromEntries(
    String(header || "").split(",").map((p) => p.split("=").map((s) => s.trim())));
  if (!parts.t || !parts.v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return false;

  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey(
    "raw", enc.encode(env.STRIPE_WEBHOOK), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(parts.t + "." + raw)));
  const want = parts.v1.match(/.{2}/g)?.map((h) => parseInt(h, 16)) || [];
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

      /* ---- checkout ---- */
      if (url.pathname === "/v1/checkout" && req.method === "POST") {
        const site = (env.SITE || "").split(",")[0].trim();
        const session = await stripe(env, "checkout/sessions", {
          mode: "payment",
          "line_items[0][price]": env.PRICE_ID,
          "line_items[0][quantity]": "1",
          success_url: site + "/?paid=1&session={CHECKOUT_SESSION_ID}",
          cancel_url: site + "/?paid=0",
          /* Stripe Tax computes the sales tax and VAT owed. It does not file
             it. Whoever runs this owes the returns. */
          "automatic_tax[enabled]": "true",
        });
        return json({ url: session.url }, 200, head);
      }

      /* ---- webhook ---- */
      if (url.pathname === "/v1/stripe" && req.method === "POST") {
        const raw = await req.text();
        if (!(await verifyStripe(env, raw, req.headers.get("stripe-signature"))))
          return json({ ok: false, error: "bad_signature" }, 400);

        const evt = JSON.parse(raw);
        const o = evt.data?.object || {};

        if (evt.type === "checkout.session.completed") {
          /* Stripe retries a delivery it did not hear back from, so minting
             must be idempotent: the session id is the identity of the
             purchase, and a second delivery returns the first key. */
          const existing = await env.LICENCES.get("s:" + o.id);
          if (existing) return json({ ok: true, key: existing });

          const key = mintKey();
          const rec = {
            status: "active",
            created: new Date().toISOString().slice(0, 10),
            email: o.customer_details?.email || null,
            session: o.id,
            customer: o.customer || null,
          };
          await env.LICENCES.put("k:" + key.replace(/^MTRC-/, ""), JSON.stringify(rec));
          await env.LICENCES.put("s:" + o.id, key);
          /* The key reaches the buyer on the success page, which carries the
             session id; email delivery is a later addition, not a dependency. */
          return json({ ok: true });
        }

        if (evt.type === "charge.refunded" || evt.type === "charge.dispute.created") {
          const key = o.payment_intent && await env.LICENCES.get("p:" + o.payment_intent);
          if (key) {
            const id = key.replace(/^MTRC-/, "");
            const rec = await env.LICENCES.get("k:" + id, "json");
            if (rec) await env.LICENCES.put("k:" + id, JSON.stringify({ ...rec, status: "revoked" }));
          }
          return json({ ok: true });
        }

        return json({ ok: true, ignored: evt.type });
      }

      /* ---- claim: exchange a completed checkout session for its key ---- */
      if (url.pathname === "/v1/claim" && req.method === "POST") {
        const { session } = await req.json().catch(() => ({}));
        if (!/^cs_[A-Za-z0-9_]+$/.test(String(session || "")))
          return json({ ok: false, error: "bad_session" }, 400, head);
        const key = await env.LICENCES.get("s:" + session);
        if (!key) return json({ ok: false, error: "not_ready" }, 404, head);
        return json({ ok: true, key }, 200, head);
      }

      return json({ ok: false, error: "not_found" }, 404, head);
    } catch (err) {
      return json({ ok: false, error: "server_error" }, 500, head);
    }
  },
};
