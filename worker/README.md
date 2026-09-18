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
wrangler secret put PADDLE_API_KEY        # pdl_sdbx_apikey_... then pdl_live_apikey_...
wrangler secret put PADDLE_WEBHOOK        # pdl_ntfset_... from the notification destination
wrangler deploy
```

Then set `PRICE_ID`, `CHECKOUT_URL`, `PADDLE_API` and `SITE` in
`wrangler.toml`, and point `API` in `../entitlement.js` at the deployed worker.

## Paddle

Paddle is the **merchant of record**: they are the seller, and registering
for, collecting and filing sales tax and VAT is theirs, not ours. That is why
they are here rather than a payment processor.

1. **Approve the domain.** Paddle > Checkout > Website approval. The hosted
   checkout will not open on a domain Paddle has not approved.
2. **Create the product and a one-off price.** Put the price id (`pri_...`)
   into `PRICE_ID`.
3. **Set the default payment link** to `https://<site>/checkout.html`
   (Paddle > Checkout > Checkout settings), and put the same URL in
   `CHECKOUT_URL`. That page is the only page on the site that loads Paddle.js.
4. **Add a notification destination** at `https://<worker>/v1/paddle`,
   subscribed to `transaction.completed` and `adjustment.created`. Its secret
   (`pdl_ntfset_...`) is `PADDLE_WEBHOOK`.
5. **Client token.** Paddle > Authentication > Client-side tokens. It is a
   public value, but it differs between sandbox and live, so the site build
   reads it from the environment:

   ```sh
   PADDLE_ENV=sandbox PADDLE_TOKEN=test_xxx npm run build
   PADDLE_ENV=live    PADDLE_TOKEN=live_xxx npm run build
   ```

Work in the sandbox first: set `PADDLE_API` to `https://sandbox-api.paddle.com`
and use sandbox keys throughout. Nothing charges anyone until live keys are in.

## Tests

`node worker/test.mjs` runs the real handler against a stub KV. It covers the
things that would be expensive to get wrong: data refused without a licence, a
forged signature rejected and writing nothing, a replayed delivery rejected, a
retry returning the same key rather than a second licence, a refund revoking
access, and CORS refusing an unknown origin.

## Regenerating the data

`data/costs.txt` and `data/earnings.txt` are produced by
`node tools/split-paid.mjs` at the repository root, which also strips the money
columns out of the free `programs.js`. Run it after regenerating either federal
table, and deploy the worker and the site together: the free bundle and the
paid tables come from the same split and are not independently versioned.

## What this does not handle

- **Tax.** Paddle handles it, which is the reason they were chosen. Nothing in
  this codebase computes, collects or files tax, and nothing should start.
- **Email delivery of keys.** The buyer gets their key on the success page,
  which carries the Paddle transaction id. There is no mail sender wired up, so a
  buyer who closes that tab before copying the key needs it looked up by hand
  (`wrangler kv key get --binding=LICENCES "t:<transaction id>"`). Wiring a sender
  is the first thing to add.
- **Device limits.** A key works anywhere it is pasted. That is deliberate for
  now — someone who bought this should be able to use it on their phone and
  their laptop — but it also means a key posted publicly works for everyone who
  finds it.
