# Deploying Matriculate

Two things ship, and they ship together: the static site, and the entitlement
Worker that holds the paid tables. They are built from the same split (see
`tools/split-paid.mjs`) and are not independently versioned, so a deploy of one
without the other can leave the free bundle and the paid tables disagreeing.

## The site — Cloudflare Pages

Cloudflare Pages builds straight from the repository. In the dashboard:

**Workers & Pages → Create → Pages → Connect to Git**, pick this repo, then:

| Setting | Value |
| --- | --- |
| Project name | `matriculate` — this decides the hostname |
| Production branch | `main` |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |

Then set these environment variables, for Production:

| Variable | Value | Why |
| --- | --- | --- |
| `SITE_URL` | `https://matriculate.pages.dev` | canonical link, sitemap, social card |
| `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` | `1` | see below — set this one first |
| `CLEAN_URLS` | `1` | see below — Pages serves `/terms`, not `/terms.html` |
| `PADDLE_ENV` | `sandbox`, later `live` | which Paddle the checkout page talks to |
| `PADDLE_TOKEN` | the Paddle client-side token | public value, but it differs per environment |

`NODE_VERSION` does not need setting: the current Pages build image ships
Node 22. Set it to `22` anyway if a future image default moves under you.

### Why PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD

The build itself needs **nothing** — `build-site.mjs` imports only Node
builtins and runs from a clean clone with no `node_modules` at all. But Pages
sees a `package.json` and runs `npm install` before the build command, which
installs Playwright, whose postinstall then tries to download a browser. That
is a slow, large, failure-prone step for a build that does not use it. The
variable tells Playwright to skip the download; the install still succeeds and
the build never touches it.

### Why CLEAN_URLS

Cloudflare Pages serves `/terms` and permanently redirects `/terms.html` to
it. GitHub Pages does the opposite: only `/terms.html` exists. Same files,
different addresses — and the address is what goes into a canonical link, a
sitemap entry, and Paddle's default payment link. Without this variable all
three point at a URL that redirects, which search engines treat as a mistake
and which makes the Paddle payment link disagree with the page it opens.

Set it on Cloudflare. Leave it unset for a GitHub Pages build. The files on
disk are named `.html` either way, so nothing else has to change.

`PADDLE_TOKEN` can be left unset for the first deploy. The checkout page will
carry its placeholder and will not open a checkout, which is correct — there is
no Paddle product yet. Everything else works.

The project name decides the subdomain: name it `matriculate` and the site is
served at `matriculate.pages.dev`. If that name is taken, Cloudflare will give
you something else — put whatever you actually get into `SITE_URL`, into
`SITE` and `CHECKOUT_URL` in `worker/wrangler.toml`, and into the Paddle
dashboard, because those four have to agree.

### Turning off GitHub Pages

`.github/workflows/deploy.yml` still publishes to GitHub Pages, and still runs
the tests on every push, which is worth keeping. Once Cloudflare Pages is
serving, the github.io copy is a second live version of the same site with a
different address, which is bad for search and confusing for anyone who finds
it. Either turn it off (Settings → Pages → Source: None) or leave the workflow
running for its tests and accept the duplicate; do not leave it serving a
checkout page, because Paddle approves a specific domain and this is not it.

## The API — Cloudflare Workers

See `worker/README.md`. In short:

```sh
cd worker
wrangler kv namespace create LICENCES     # id goes into wrangler.toml
wrangler secret put PADDLE_API_KEY
wrangler secret put PADDLE_WEBHOOK
wrangler deploy
```

Then put the deployed Worker's URL into `API` in `../entitlement.js` and
rebuild the site. The default there is a guess at the name and will not
resolve until the Worker exists.

## Order of operations

The pieces reference each other, so there is one order that avoids chasing
your own tail:

1. Create the Pages project. Note the real `*.pages.dev` address.
2. Deploy the Worker. Note its real `*.workers.dev` address.
3. Put the Worker address into `entitlement.js`; put the Pages address into
   `worker/wrangler.toml` (`SITE`, `CHECKOUT_URL`) and redeploy the Worker.
4. In Paddle: submit the Pages domain for website approval, create the
   product and price, set the default payment link to
   `https://<pages address>/checkout.html`, and add a notification destination
   at `https://<worker address>/v1/paddle`.
5. Put the price id into `PRICE_ID`, the client token into the Pages
   environment, and rebuild.

Work in Paddle's sandbox throughout. `PADDLE_API` in `wrangler.toml` defaults
to the sandbox host, and nothing charges anyone until it and the keys are
changed to live.
