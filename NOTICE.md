# Notices and attributions

## This project

This code is © 2026 Gavin Schote, released under the MIT License
(see `LICENSE`).

The reference tables in `data.js` and `majors.js` are compilations of factual
figures — admit rates, grade point averages, credit caps. In the United States
facts are not copyrightable (*Feist Publications v. Rural Telephone Service*,
499 U.S. 340), so the numbers themselves are free for anyone to use; the
selection, arrangement and annotation are covered by the MIT License along with
the code. Nothing here was copied from a licensed database. Figures marked `P`
come from institutions' own published transfer statistics and Common Data Set
filings; figures marked `E` are estimates derived from overall selectivity.

For verification, the authoritative public source is IPEDS, the Integrated
Postsecondary Education Data System, published by the US Department of
Education and in the public domain: https://nces.ed.gov/ipeds/

`links.js` is derived from that directory (HD2023): every institution's unit
id, admissions office and application page comes from it, and every URL was
fetched to confirm it resolves before being included. Federal government works
carry no copyright, so the data is free to redistribute. Regenerate it with
`node tools/refresh-links.mjs`.

`programs.js` is generated from two federal sources, both public domain:
the College Scorecard field-of-study file (degrees awarded, graduate earnings
and graduate debt, by institution and CIP field) and the IPEDS directory
(institution states, used to build per-state pay baselines). Every figure in it
is the federal one; nothing is interpolated, smoothed or estimated, and figures
the Department suppresses for small cohorts are carried as absent rather than
filled in. The mapping from this app's majors to federal CIP fields is in
`tools/cip-map.json`. Regenerate with `node tools/build-programs.mjs`.
  - https://collegescorecard.ed.gov/data/
  - https://nces.ed.gov/ipeds/

## Institution names

College and university names appear solely to identify the institutions the
estimates describe. This is nominative use. No institution has reviewed,
endorsed, sponsored or supplied anything in this project, and no logos, crests,
seals, mascots or other marks are used or reproduced.

## Fonts

Bundled in `site/fonts/` and served from this site's own origin:

- **Poppins** — © Indian Type Foundry, Jonny Pinhorn
- **Plus Jakarta Sans** — © Tokotype
- **JetBrains Mono** — © JetBrains s.r.o.

All three are licensed under the SIL Open Font License, Version 1.1. The license
permits redistribution of the font files, bundled or otherwise, provided they are
not sold on their own and this notice travels with them. Full text:
https://openfontlicense.org/open-font-license-official-text/

## Development-only dependencies

Not distributed with the site, used only to build and test it:

- **Playwright** — Apache License 2.0 — renders the icons and social card
- **axe-core** — Mozilla Public License 2.0 — accessibility checking
