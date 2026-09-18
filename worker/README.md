# Matriculate entitlement API

The paywall is server-side or it does not exist. Everything the site ships to a
browser is readable in view-source, so the paid tables are not in the bundle:
they are here, and they are returned only to a request carrying a live licence.

## Deploy

```sh
npm install -g wrangler        # once
wrangler login

cd worker
wrangler kv namespace create LICENCES     # put the id into wrangler.toml
wrangler secret put STRIPE_SECRET         # sk_live_... or sk_test_...
wrangler secret put STRIPE_WEBHOOK        # whsec_... from the webhook endpoint
wrangler deploy
```

Then set `PRICE_ID` and `SITE` in `wrangler.toml`, and point
`API` in `../entitlement.js` at the deployed worker.

## Stripe

1. Create a one-off Price for Matriculate Plus. Put its id in `PRICE_ID`.
2. Add a webhook endpoint at `https://<worker>/v1/stripe` subscribed to
   `checkout.session.completed`, `charge.refunded` and `charge.dispute.created`.
   Its signing secret is `STRIPE_WEBHOOK`.
3. Turn on Stripe Tax if you want the tax calculated. **It is calculated, not
   filed** — see below.

## Regenerating the data

`data/costs.txt` and `data/earnings.txt` are produced by
`node tools/split-paid.mjs` at the repository root, which also strips the money
columns out of the free `programs.js`. Run it after regenerating either federal
table, and deploy the worker and the site together: the free bundle and the
paid tables come from the same split and are not independently versioned.

## What this does not handle

- **Tax filing.** Stripe Tax computes what is owed. Registering in each
  jurisdiction and filing the returns is the publisher's, and there is no code
  here that helps with it.
- **Email delivery of keys.** The buyer gets their key on the success page,
  which carries the Checkout session id. There is no mail sender wired up, so a
  buyer who closes that tab before copying the key needs it looked up by hand
  (`wrangler kv key get --binding=LICENCES "s:<session id>"`). Wiring a sender
  is the first thing to add.
- **Device limits.** A key works anywhere it is pasted. That is deliberate for
  now — someone who bought this should be able to use it on their phone and
  their laptop — but it also means a key posted publicly works for everyone who
  finds it.
