# Plan Completion Record — Plans A, B and C

> **Historical record, superseded in part.** This note describes the repository
> as it stood on 2026-08-16. Its *Still open* section has since been overtaken —
> Plan D shipped, and `npm run package` works. Read
> [2026-08-22-delivery-status.md](2026-08-22-delivery-status.md) for the current
> state. Everything above that section is still accurate and is left unedited.

**Date:** 2026-08-16
**Branch:** `main` (the only branch; `plan-a-foundation` and `plan-b-marketing` were deleted after verifying both were fully contained in `main`)
**HEAD at time of writing:** `4cb01a1`

---

## Why this file exists

The three implementation plans under `docs/superpowers/plans/` shipped, but none
of their checkboxes were ever ticked — 0 of 121, 0 of 154 and 0 of 191. Anyone
opening those files later would read them as untouched work.

The checkboxes have now been set to done. This note records **what was actually
verified before ticking them**, so the tick marks mean something. They were not
ticked because the files exist; they were ticked because each plan's own
Definition of Done was re-run and held.

Ticking was done with `scripts/tick-plan.js`, which only rewrites `- [ ]` to
`- [x]`. It makes no judgement of its own — do not run it against a plan whose
Definition of Done has not been checked.

---

## What was verified

### Shared baseline

| Check | Result |
|---|---|
| `npm test` | 613 pass, 0 fail, 0 skipped, 0 todo, 0 cancelled |
| `npm run validate` | `Theme validation passed.` |
| `npm run check` | 72 files, **0 errors**, 1 warning |

The single warning is `AssetPreload` on `layout/theme.liquid` — theme check
prefers the `preload_tag` filter over a hand-written `<link rel="preload">`.
It predates this work and is a style preference, not an error. All three plans
require zero *errors*, which is met.

### Deliverables

Every file path each plan names under `azouz-theme/`, `preview/`, `tests/` and
`scripts/` exists. Nothing is missing in any of the three.

### Plan A — Foundation

| Definition of Done | Evidence |
|---|---|
| `npm test` passes | 613/613 |
| `npm run validate` | passed |
| `theme check` no error-level findings | 0 errors |
| Preview serves a styled document with brand fonts, colours, skip link, favicon | verified in browser; skip link and `<main tabindex="-1">` present on every route |
| Contrast guard green | `tests/contrast.test.js` passes; the measured ratios are documented at the top of `assets/tokens.css` |
| Four vector logo variants, normalised to `#67985E` | `tests/logo.test.js` passes, including the monochrome and green-normalisation assertions |
| Commits on the branch | absorbed into `main` |

### Plan B — Marketing

| Definition of Done | Evidence |
|---|---|
| `npm test` / `validate` / `check` | see baseline |
| Five marketing routes render completely | 6 routes checked (`/`, private-label, wholesale, our-brands, request-a-sample, get-a-quote) |
| One `<h1>`, no empty `href`, no `translation missing`, no unresolved section | all six: `h1=1`, `href=""`=0, `translation missing`=0, unresolved section=0, no Liquid leaked into output |
| No horizontal overflow at 375 / 768 / 1280 / 1440 | none at any width on any route; nav hidden and mobile toggle shown at 375, reversed from 768 up |
| JavaScript disabled: content visible, mobile menu opens | measured in a `sandbox="allow-same-origin"` iframe with scripts fully blocked — 16 `.reveal` elements, **0 invisible**, 1926 characters of body text, mobile menu is a `<details>` |
| `dir="rtl"` mirrors without breakage | logo x 32 → 774; nav links `[222, 352, 462, 578]` → `[565, 455, 339, 269]`; cards `[32, 316, 601]` → `[601, 316, 32]`; no overflow |

The no-JS check is the one Plan B flags as "do not skip", because a `.reveal`
defect at the end of Plan A had hidden content when scripting was off. It holds.

### Plan C — Commerce

| Definition of Done | Evidence |
|---|---|
| `npm test` passes with **nothing skipped** | 613 pass, skipped 0, todo 0 |
| `validate` / `check` | passed / 0 errors |
| Every commerce route renders completely | 11 routes: collections, collection, product, cart, search, 404, and five account routes |
| One `<h1>`, no empty `href`, no `translation missing`, no unresolved section | all 11 clean |
| Variant picker updates price, availability and URL, disables unavailable combinations | on `dead-sea-blend`: the sold-out 1kg/Espresso combination gives `disabled=true`, label "Sold out", URL `?variant=dead-sea-blend-1kg-esp`; switching to 1kg/Whole Bean gives `disabled=false`, "Add to cart", "Price JOD 26.000", and the hidden `id` input follows |
| Drawer opens on add, refreshes contents and header count, traps focus, closes on Escape and backdrop | opens on add; `dialog.matches(':modal')` true, so focus is trapped by the UA; focus lands on the close button; header count 0 → 1 and the screen-reader count reads "1 items in cart"; backdrop click closes; on close the element carries `hidden`, `inert` and `aria-hidden` |
| JavaScript disabled: readable, `<noscript>` select is the only variant control, add-to-cart posts natively, quantities still editable | scripts blocked: exactly **one** field named `id` (`SELECT#VariantFallback-dead-sea-blend`, the `<noscript>` one), the two option selects carry no name, form posts `method=post` to `/cart/add`, the number input is editable, and the script-only steppers are hidden |
| No overflow at 375 / 768 / 1280 / 1440 | none, across collection, product, cart, search, 404, login and order routes |
| `dir="rtl"` mirrors without breakage | product and cart: logo x 32 → 1169, no overflow |

**One note on method.** Escape could not be proven by dispatching a synthetic
`KeyboardEvent` — browsers close a modal `<dialog>` at the UA level and a
scripted key event does not reach that path. It was verified indirectly instead:
the theme registers no `cancel` handler and does not call `preventDefault` on
it, which is the only way a page can suppress native Escape. Backdrop close was
verified directly.

---

## Work done after the plans

A full-site review ran over all 20 routes and the whole theme after Plan C. It
found defects the plans' own criteria did not cover, fixed across three commits:

| Commit | Scope |
|---|---|
| `5b339b1` | Blockers and high-severity findings |
| `4cbed22` | Medium-severity findings |
| `4cb01a1` | Cart line layout |

The substantive ones: the theme editor's five colour pickers were inert because
`tokens.css` is a static asset; only the first business type could ever be
pre-selected on the enquiry form; search rendered pages and articles as empty
product cards and truncated without pagination; JSON-LD carried relative URLs;
the cart remove control was an 18×18 tap target; screen readers announced a
stale cart total after an ajax change; and every image declared a constant
aspect ratio, so the homepage hero reserved a box about 127px short and the LCP
element jumped on every cold load, with no `srcset` anywhere.

The test suite grew from 544 to 613 over that work.

---

## Repository layout changed after the plans were written

**The theme moved from `azouz-theme/` to the repository root.** Every plan
document still refers to `azouz-theme/assets/…`, `azouz-theme/sections/…` and
so on. Those paths were correct when the plans were executed; read them as
root-relative now. The plans were left untouched rather than rewritten, because
they are a record of what was done, not a current map.

The move was made so the theme can be connected through Shopify's GitHub
integration, which only accepts a branch whose theme directories sit at the
repository root — it cannot be pointed at a subdirectory, and ignores every
folder that is not part of the theme structure.

That last part is what makes this work: `preview/`, `scripts/`, `tests/`,
`docs/`, `package.json` and the client's source artwork all sit beside the
theme at the root and Shopify simply ignores them.

Three pieces of tooling had to follow:

- `scripts/theme-paths.js` — `THEME_DIR` is now `ROOT`. It gained
  `PROJECT_ENTRIES` and `isSourceAsset()`, which name what legitimately shares
  the root.
- `scripts/validate-json.js` — walks only `THEME_SUBDIRS` now. Walking the root
  wholesale descended into `node_modules`, where `tsconfig.json` files carry
  comments and were reported as broken theme JSON.
- `scripts/validate-structure.js` — `findDisallowedTopLevelEntries` can no
  longer reject everything that is not a Shopify directory. It skips known
  project entries and still catches what matters: a directory meant to ship but
  invisible to Shopify, such as `styles/` or a mis-cased `Assets/`.

`.theme-check.yml` was added at the same time. Without it, theme check inspected
74 files instead of 72, having wandered into `package.json` and
`package-lock.json`. The ignore list keeps its scope equal to what actually
ships.

`npm run check` is now `shopify theme check --path .`.

---

## Still open

> **As of 2026-08-22 this section is out of date.** The three content gaps below
> still stand. The packaging claim does not: `scripts/package-theme.js` was
> written in `ffd1f5c` and `npm run package` produces `dist/azouz-theme-1.0.0.zip`.
> Plan D has since shipped in full. See
> [2026-08-22-delivery-status.md](2026-08-22-delivery-status.md).

These are not defects. They are content gaps for the primary B2B audience, and
they need material from the client rather than code:

- No page states a minimum order quantity or a lead time, although the enquiry
  form asks the customer for their expected monthly volume
- No trust signals: no food-safety, HACCP or halal certification, no founding
  year, no roastery capacity, no reference customers
- No About / Our Roastery page

**`npm run package` is broken.** `package.json` declares it, `archiver` is
installed for it, but `scripts/package-theme.js` was never written and `dist/`
is empty. Until it exists there is no zip to upload. It is Plan D scope ("the
delivery zip"), and it matters more now the theme root is the repository root:
the zip must contain `THEME_SUBDIRS` and nothing else, so it cannot simply
archive the theme directory the way it could before.

Two review findings were deliberately left alone, with reasons:

- **Five render-blocking stylesheets.** Merging them needs a build step and
  breaks the per-file structure the CSS tests rely on, for thin gains over
  HTTP/2.
- **The cart-change link is a state-changing GET.** This is the standard Dawn
  pattern and cannot become a POST without nesting a form inside the cart form,
  which is invalid HTML.

**Next per Plan C:** Plan D — blog and article templates, `gift_card.liquid`, the
client setup guide, `products.csv`, the affiliate-app comparison, and the
delivery zip.
