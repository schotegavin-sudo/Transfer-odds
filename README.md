# Transfer Odds Worksheet

A single-page tool that estimates transfer-admission odds at 588 US institutions,
including primarily-online campuses, from one saved student record.

- `index.html` — app shell markup
- `styles.css` — the glass and clay material system
- `data.js` — the institution reference table (pipe-delimited, one row per school)
- `majors.js` — 154 majors and what each does to transfer competition
- `aliases.js` — nicknames, generated acronyms and search relevance
- `deadlines.js` — deadline resolution and the official-link lookup
- `links.js` — admissions and application URLs from the federal directory
- `tools/refresh-links.mjs` — regenerates `links.js` from a fresh IPEDS release
- `share.js` — packs a record into a link, and unpacks one
- `model.js` — the applicant-pool model
- `test-model.mjs` — regression tests (`npm test`)
- `build-site.mjs` — wraps the artifact source into a deployable `dist/`
- `make-images.mjs` — renders the icons and the social card
- `site/` — icons, social card, self-hosted fonts, legal page bodies
- `fetch-fonts.mjs` — downloads the webfonts so no third party is contacted
- `LICENSE`, `NOTICE.md` — MIT for the code, attributions for everything else
- `app.js` — form, list, database browser

Open `index.html` over HTTP (`python3 -m http.server`), not `file://`; the page
loads `app.js` as an ES module.

## The interface

Two material systems, kept apart on purpose. **Glass** is what you look
through — panels, the top bar, school cards: lightly frosted, a hairline edge,
one soft shadow. **Clay** is what you push — buttons, chips, tiles, the odds
core: opaque, gently raised, pressing down on `:active`. A control is never
both; that single rule is what keeps the two readable side by side.

The palette is deliberately neutral. Warm greys carry the whole interface and
the only saturated colour on the page is the four tier colours, which mean
something — nothing decorative competes with them.

**Sizing is fluid, not stepped.** The page is as wide as the monitor usefully
allows and the type scales with it (`html` carries a `clamp()` and every font
size is in `rem`). Below 1000px the record panel is a drawer section; above it
the record stays beside the results; past 1500px the search panel leaves the
drawer and takes its own column, so a wide monitor shows the whole tool at once
with no navigation at all. Past 1900px things get roomier rather than wider,
and past 2400px the page stops growing and the margins are margins.

The drawer and its handle are one object. `#sidebar` is a shell parked one full
width off the right edge of the screen; the handle is absolutely positioned at
`left: -46px` inside it, so when the shell is parked the handle is the only part
still on screen, flush against the edge with its right corners square — that
side is a cut, not an edge, because the object continues past it. Opening
translates the shell, and the handle travels with it because it is part of it.
Nothing has to be kept in sync, because nothing is separate.

The shell is parked rather than hidden: flipping `visibility` makes the browser
defer the first frame, which is precisely the frame where the movement has to
read. `inert` sits on the inner body so the handle stays clickable while the
rest of the drawer is out of the tab order, and the body is opaque rather than
frosted because blurring a full-height panel costs those same frames.

Motion is rationed by how often you trigger it. The odds core animates on every
keystroke because a dial sliding to a new value *is* the feedback. The form and
the 588-row search do not animate at all — they are touched constantly, and
motion there is friction. Cards animate in only when the list itself changes,
never on a keystroke. Everything moving is `transform`, `opacity`, or `filter`,
and every animation has a `prefers-reduced-motion` path that removes it.

## The model

The question is not how selective a school is but where you stand in the pool
competing for the same seats.

**The pool is reconstructed, not assumed.** Admitting the top slice of a normal
pool lifts the admitted mean by `sigma * w * lambda`, where lambda is the inverse
Mills ratio of the admitted tail. Running that backwards from the published
transfer admit rate and the admitted-transfer GPA recovers the mean applicant.

**The major sets the real rate.** Each major carries a multiplier on the
university's transfer rate and a shift in the pool's GPA, so nursing at a 65%
school is an 18% admit against a stronger pool. Schools tagged `imp` admit to
the major, which sharpens the multiplier further.

**The file is measured against the typical applicant there**, not against an
empty page (`typicalApplicant()` in `model.js`). In-state residency at a state
flagship is worth nothing when most of the pool is in-state too.

**One input, one line.** Each field on the record — hours, prerequisites,
associate degree, agreement, residency, origin, record, essays, activities,
background, term, GPA floor — resolves to a single value, and what it is worth
is the distance between your value and the typical applicant's. An earlier
version summed factors and matched them by label, which let "associate degree
complete" and "associate degree in progress" both fire on one record. The tests
lock this down: every field is checked for monotonicity (a better answer never
scores worse) and for contributing exactly one ledger line.

Your GPA becomes a z-score in that pool, your file a second z-score, and the two
combine under a school-specific weight. Admission sits at the percentile where
the seats run out, calibrated so the pool-wide mean equals the admit rate. What
the model cannot see — essays as written, department need, the reader on the day
— enters as residual noise, wider at schools that read files holistically.

Schools tagged `open` bypass the model and resolve on the transcript alone.

Every row carries a confidence marker: `P` for a published transfer admit rate,
`E` for one estimated from overall selectivity and peer institutions. Both are
planning estimates. Verify against a school's Common Data Set, section D, before
relying on any of them.

## The walkthrough

Four questions on a first visit — GPA and transferable hours, where you are
transferring from and your residency, your major and entry term — then straight
to **Best fits**, which is built from exactly those answers. It is skippable at
every step and re-runnable from a link in the Record pane.

It opens unprompted only when you have not seen it before **and** your list is
empty. Having seen it is the one permanent answer: it is setup, not a feature.
An empty list is somebody who never got started, which is who it is for; a list
with schools on it is work in progress, and a dialog over the top of that is an
interruption.

Merely *having a saved record* used to suppress it too, which was wrong in a way
that took a bug report to notice: everyone who had used the app before the
walkthrough shipped had a record, so they were treated as already onboarded
having never seen it. A record tells you whether somebody is mid-task, not
whether they have been shown around.

### Previewing the first run

Add `?fresh` to the URL and the page behaves as though this browser had never
been here: the walkthrough opens on every load, the answers start blank, and
nothing is written to storage, so an existing record survives being previewed
over. It is there so the first-run experience can be looked at repeatedly
without clearing site data between goes, and it costs an ordinary visitor
nothing — no build flag, no revert, no behaviour change for anyone who does not
type it.

```
https://schotegavin-sudo.github.io/transfer-odds/?fresh
```

## Best fits

Where the walkthrough ends. The odds model knows what you can get into and the
program tables know what is worth getting into; `fit.js` is the only place the
two meet, and it exists because the first build of this app opened on eight
California schools that belonged to nobody.

The recipe is the whole recipe — there is no hidden score, and every row states
its reasons in plain sentences:

1. **Who runs the program.** Only schools that reported bachelor's degrees in
   the major last year. A school that graduated nobody in it is not a fit.
2. **What the program is worth.** Graduate earnings against the field, measured
   against the school's own state wherever that baseline exists. Where earnings
   are unpublished, department size and campus focus stand in — and they cannot
   carry a school as high as a measured result can, so a school never outranks
   one with real evidence purely by having none.
3. **What it costs to carry.** Median debt at graduation per dollar of
   first-year pay.
4. **Where you can go.** Three settings, because whether you can leave your
   state is not something this app can work out for you.

   | | what it does |
   | --- | --- |
   | **Only schools in my state** (default) | offers nothing outside it, however strong |
   | **Prefer my state, but show others** | holds half the list for it; the rest of the country competes for what is left |
   | **Anywhere in the country** | stops counting residency rather than counting it against you |

   In-state publics rank above in-state privates under all three, since cost is
   the difference left once residency is settled, and the bands and the ranking
   are identical throughout — the setting decides who is eligible, not how they
   are ordered.

   The held places under *prefer* are counted across the whole list rather than
   per band, because a state's programs do not spread evenly across your odds:
   Idaho's four computer science departments are all safeties, and a per-band
   quota of two handed the other two places away while two Idaho options sat
   unused. It is a floor rather than a ceiling — the ordinary ranking adds more
   wherever they earn it, and an Ohio nursing list comes out three quarters Ohio.

   Residency began as a ranking weight, which cannot be trusted to do what a
   label promises: at 0.22 against a national field it showed an Oregon
   applicant one of their eight Oregon programs.

5. **A spread, not a pile.** Odds sort candidates into bands and the list is
   filled from each — four you should get into, four live chances, a few
   reaches — because twelve reaches is a bad list however strong the programs.
6. **Caps.** At most two primarily-online universities, and three from any one
   state other than yours.

Two of those came out of watching it fail.

Ranking on the *national* earnings
index put California at the top of every nursing slate and left an Ohio
applicant with no Ohio schools at all, because in a regionally paid field the
national figure is mostly a statement about the state — hence the local
baseline winning outright rather than being averaged in. And open-admission
online universities swept all four safety places on odds, debt and reported
earnings together, leaving a student with no campus they could drive to — hence
the cap.

Nothing is added to your list until you add it. The list then keeps itself:
losing twelve deliberate additions to a closed tab because a Save button went
unpressed is not a reasonable thing to ask of anybody. The one exception is
while you are viewing somebody else's shared record, where writing it down
would overwrite your own.

## Programs

The odds model answers "can I get in". The Programs pane answers "is the
program worth getting into" — and it answers it with measured federal data
rather than a ranking, because no reusable ranking of program quality exists.
The magazine tables are copyrighted opinion surveys, and a quality score
invented here would be exactly the kind of made-up number the rest of this
project refuses to print.

So `programs.js` reports four things per school per major and lets you sort on
any of them:

| | what it is | what it is not |
| --- | --- | --- |
| **Size** | bachelor's degrees the school awarded in the field last year | quality — but it does separate a staffed department from a line in the catalogue |
| **Focus** | degrees in this field per degree the campus awards, against the same ratio nationally | prestige — Embry-Riddle is 141× the national share in aviation, which is a fact about the campus, not a verdict |
| **Outcome** | median earnings one year out, against the national median for the same field | a measure of teaching — it reads who enrolled as much as what was taught |
| **Burden** | median debt at graduation per dollar of first-year earnings | a full cost picture — it covers federal loans for aided students |

Earnings are nominal, so a school in an expensive city sits higher for that
reason alone. Ranked on the national median, "the best nursing programs" comes
out as a list of California, which is a fact about nurses' wages rather than
about schools. Each field therefore also carries **its own state's median**, and
the pane can rank against that instead — the comparison that is about the school
rather than the state. Schools that teach primarily online are left out of that
comparison, since their state is where they are incorporated and not where their
graduates take jobs.

Roughly a third of programs publish no earnings at all: the Department
suppresses any figure drawn from too few graduates to report without
identifying them. Those carry a size and an explicit *not published* — never an
estimate.

The table is 370 KB, which nobody should pay for on a page they may never open,
so it is fetched the first time the Programs pane is opened or a school card is
expanded. It is left out of the service worker's precache for the same reason.

Regenerate it when a new Scorecard release lands:

```
node tools/build-programs.mjs Most-Recent-Cohorts-Field-of-Study.csv 06102026 HD2023.csv
```

The mapping from this project's 154 majors to federal CIP fields lives in
`tools/cip-map.json`. Seven majors have no bachelor-level federal field of their
own — undeclared, honors, and five trades taught below the bachelor's level —
and the pane says so rather than inventing a category for them.

## Deadlines

A wrong deadline is worse than no deadline, so `deadlines.js` keeps two kinds of
claim apart and the interface never blurs them. **Verified** means a date
published for a whole system and stable year to year — only the UC and CSU
filing periods qualify, because they are system-wide rather than per campus.
Everything else is **typical**: a period ("Typically early March"), never a
date, and never with a countdown. Open-admission and online schools are
**rolling**. Every deadline sits beside links to the school's own admissions office, its
application page and its federal record, so the file is a starting point
rather than an authority.

Those links are not guesses and not searches. They come from IPEDS HD2023, the
US Department of Education's institutional directory, matched to the school
table by exact name, by an alias the directory itself records, or by a campus
suffix — never fuzzily, because a link to the wrong campus is worse than no
link. Every URL was then fetched to confirm it resolves: 526 answered, 41 more
are real but refuse automated requests, and anything that failed was dropped.
567 of 588 schools carry at least one official link; the rest fall through to
College Navigator, the same federal directory with a search box.

## Sharing

Nothing leaves the browser, so sharing cannot mean uploading. **Share link**
packs the record into the URL's hash — deflate where the browser has it, plain
base64 where it does not — and the recipient's page unpacks it. A full record
with eight schools comes to about 320 characters.

Opening a shared link never touches what the recipient has saved. They see a
notice saying they are looking at someone else's record, they can change any
field to try their own numbers on it, and nothing is written to their storage
until they press Save. "Open my own record instead" restores theirs and clears
the hash. A mangled link lands on the ordinary page rather than an error.

## Tests

```bash
npm test     # ~46,000 checks over all 588 schools
```

Covers: no broken numbers across every school and major, one ledger line per
input, monotonicity for every field, fields firing only where they apply,
competitive majors never easier than open ones, the pool reconstruction staying
consistent with the admitted GPA it came from, levers never advertising a gain
the model does not deliver, the normal-distribution helpers against known
values, and edge cases from a 0.4 GPA to an unparseable major.

## What is and is not grounded

The model's arithmetic is checked. Its inputs are estimates: `data.js` carries
one transfer admit rate and one admitted-transfer GPA per school, marked `P`
where a published transfer figure was available and `E` where it was inferred
from overall selectivity. The weights on the file fields are judgment calibrated
against those rates, not fitted to admission outcomes, because no public dataset
publishes transfer decisions at the applicant level. Verify any school that
matters against its Common Data Set, section D.

The program figures are the exception: they are measured, not modelled. Degrees
awarded, graduate earnings and graduate debt come straight from the College
Scorecard field-of-study file, and a figure the Department suppressed is carried
as absent rather than filled in. What they cannot tell you is how much of a
program's earnings advantage was taught and how much walked in the door.

The record is kept in the browser's local storage only.

## Publishing it

`index.html` here is the artifact source: a body fragment, because claude.ai
supplies the document around it. A public page needs the whole document, so the
build wraps the same markup in a real `<head>`.

```bash
npm run build                      # -> dist/
SITE_URL=https://yourdomain.com npm run build
npx serve dist                     # or: cd dist && python3 -m http.server
```

`dist/transfer-odds-offline.html` is the whole app in one file — stylesheet
inlined, the four modules concatenated into one classic script — so it opens by
double-clicking, with no server. ES modules refuse to load over `file://`, which
is why that build exists separately.

`dist/` is a plain static folder — no framework, no server, no API keys. It
carries the page, the four modules, a web app manifest, a service worker, icons,
a social card, `robots.txt`, `sitemap.xml` and a 404 page. It will deploy to
anything that serves files.

`SITE_URL` sets the canonical link, the social card URL and the sitemap entry.
It defaults to the GitHub Pages project URL.

### GitHub Pages

`.github/workflows/deploy.yml` runs the model tests, builds, and
deploys on every push to `main`. Enable it once under
**Settings → Pages → Source: GitHub Actions**. To publish under your own domain,
set a repository variable `SITE_URL` to it and add the domain under Settings →
Pages → Custom domain.

### Anywhere else

Cloudflare Pages, Netlify and Vercel all take the same two settings:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |

### Before it goes public

- The estimates are modelled, not measured. The About section on the page says
  so; keep it there.
- School names identify institutions and nothing more. Do not add logos,
  crests, or wordmarks — that is where nominative use ends.
- Nothing is collected. If analytics are added later, use a cookieless
  provider so the privacy note stays true, and update that note.

## Legal

**Code** is MIT (`LICENSE`). Anyone may reuse it; the warranty disclaimer in the
license is what protects you when they do.

**The reference tables** are compilations of facts — admit rates, GPAs, credit
caps — and facts are not copyrightable in the US (*Feist*, 499 U.S. 340).
Nothing was taken from a licensed database. IPEDS, the US Department of
Education's postsecondary dataset, is public domain and is the right source for
verification.

**Institution names** are nominative use: they identify the schools the
estimates describe. No logos, crests, seals or mascots, no implication of
endorsement, and no domain name containing a school's name.

**Fonts** are SIL Open Font License 1.1 and are redistributed with the notice
they require (`NOTICE.md`). They are served from this site's own origin rather
than a CDN — loading them from Google's servers would send every visitor's IP
address to a third party on page load, which a German court held breached the
GDPR (LG Muenchen I, 3 O 17493/20). Self-hosting removes the request, which is
what lets the privacy page say truthfully that the site contacts no one.

**Terms of use** (`site/terms.body.html`) and **privacy** (`site/privacy.body.html`)
build into `terms.html` and `privacy.html`. Neither is legally mandated for a
free static site that collects nothing, but the terms carry the disclaimer of
warranty, the limitation of liability and the "this is not advice" statement
that matter for a tool people make decisions with.

Both files contain `REPLACE@EXAMPLE.COM` and a hosting-provider placeholder.
Fill those in before publishing.

This is not legal advice. For anything with money, ads, or user accounts
attached, talk to a lawyer.
