# Delivery Status — 2026-08-22

**HEAD:** `43d42ea`
**Branch:** `main` (the only branch)
**Supersedes:** the *Still open* section of
[2026-08-16-plan-completion.md](2026-08-16-plan-completion.md)

Plans A, B, C and D have all shipped. This note records what the repository
delivers today, what was verified to say so, and what is genuinely still open.

---

## Verified today

| Check | Command | Result |
|---|---|---|
| Test suite | `npm test` | **738 pass, 0 fail** (4.3 s) |
| Structure and JSON | `npm run validate` | Passed |
| Shopify linter | `npm run check` | 79 files, **0 errors**, 2 `AssetPreload` warnings |
| Delivery zip | `npm run package` | `dist/azouz-theme-1.0.0.zip`, 430 KB, 102 files |
| Zip structure | included in `npm run package` | Only the Shopify directories, at the zip root |

The two theme-check warnings are the font `<link rel="preload">` in
`layout/theme.liquid` and `templates/gift_card.liquid`. Shopify's linter prefers
the `preload_tag` filter. Both files preload a *theme asset* the layout already
knows the URL of, so the filter would change the generated markup and nothing
else. Left as they are.

---

## Deliverables against the spec

The spec's §9 table named six artefacts. Five shipped; two of them under
different paths than the spec guessed, because the theme moved to the
repository root in `8593924`.

| # | Spec artefact | Spec path | Actual | State |
|---|---|---|---|---|
| 1 | Theme zip | `dist/azouz-coffee-theme.zip` | `dist/azouz-theme-1.0.0.zip` | Shipped — version comes from `package.json` |
| 2 | Product import file | `dist/products.csv` | same | Shipped — 10 rows |
| 3 | Shopify admin setup guide | `docs/handover/01-shopify-setup.md` | `docs/client-setup-guide.md` | Shipped — 11 steps, photography brief, troubleshooting table |
| 4 | Affiliate + AI apps guide | `docs/handover/02-affiliate-and-ai-apps.md` | `docs/affiliate-and-ai-apps.md` | **Shipped today** |
| 5 | Post-upload test checklist | `docs/handover/03-post-upload-checklist.md` | No standalone file | **Partial** — see below |
| 6 | Preview harness, dev only | `preview/` | same | Shipped, excluded from the zip |

`docs/handover/` holds dated engineering records; the two client-facing guides
sit at `docs/` root. That is the split the repository already had, so the new
guide followed it rather than the spec's numbering.

### On deliverable 5

There is no separate post-upload checklist file. What the spec asked for is
split across the two guides:

- Setup guide §11 *Before you publish* — policies, meta description, password
  page, phone walkthrough, both enquiry forms, metafields
- Setup guide *When something looks wrong* — the failure-to-cause table
- Affiliate guide §5 — the referral tracking test, which can only run on the
  published store

What no document covers is the live-commerce path the spec §10.2 listed as
unverifiable locally: a real checkout, a real card authorisation, the COD flow,
shipping rate calculation, and customer account creation. Those need one pass on
the live store with a real order, and nobody has written that pass down. It is
half an hour of work and the last honest gap in the handover set.

---

## Written since the plans completed

| Commit | What |
|---|---|
| `8593924` | Theme moved to the repository root so Shopify's GitHub integration can read it |
| `ffd1f5c` | `scripts/package-theme.js` — the zip the previous note called broken |
| `3218ea0` | `dist/products.csv` |
| `f15221c` | Blog and article templates |
| `cab9fd8` | `templates/gift_card.liquid` |
| `044f253` | The client setup guide |
| `0b746ec` | JSON validator reads Shopify's commented template JSON |
| `b110549` | Preview image paths removed from templates — they 404'd six routes |
| `98f4061`, `9f641ba`, `01492cb`, `43d42ea` | Client copy restored, photography-led homepage, service-card row, stainless-steel repaint |
| — | `docs/affiliate-and-ai-apps.md` (this pass) |

---

## Still open

### Content the client owes

Unchanged from the previous note, and repeated in the setup guide under *Still
to come from you*:

- **No minimum order quantity, no lead time** on any page, although the enquiry
  form asks the buyer for their expected monthly volume. This is also what
  limits Shopify Inbox's AI agent — it can only answer from what the site says
- **No trust signals** — no food-safety, HACCP or halal certification, no
  founding year, no roastery capacity, no reference customers
- **No About / Our Roastery page.** The homepage *Roasted in Jordan* band points
  at Our Brands instead
- **No deal terms on Own an Azouz Coffee** — no investment range, no fee
  structure, no territory rules
- **Section photography.** `templates/index.json` points the hero at
  `shopify://shop_images/hero-azouz-coffee-cup.jpg`. Until a file of that exact
  name is uploaded at Content → Files, the hero renders without it. The
  photography brief in the setup guide lists the rest

### Admin configuration, outside the theme

Payment gateway, COD, shipping zones and rates, taxes, policies, sender email
authentication, domain, and the product metafield definitions. All covered by
the setup guide; none of it can ship in a zip.

### Deliberately not done

Both were review findings, both were left alone on purpose, and both still
stand:

- **Five render-blocking stylesheets.** Merging them needs a build step and
  breaks the per-file structure the CSS tests rely on, for thin gains over
  HTTP/2
- **The cart-change link is a state-changing GET.** The standard Dawn pattern.
  Making it a POST means nesting a form inside the cart form, which is invalid
  HTML

### Deferred by decision

- **Arabic.** `locales/` holds English only. The theme is RTL-*ready* — logical
  CSS properties throughout, direction derived from the locale, and a test
  covering both — so adding `locales/ar.json` needs no CSS work. It needs a
  translator
- **Predictive search**, a Shopify server-side API with no local equivalent

---

## Where to pick it up

1. Chase the client for MOQ, lead time, certifications and the hero photograph —
   these block more than they look like they do
2. Run the live-commerce pass (deliverable 5's gap) once the store is published
   with a real payment gateway, and write the result down
3. Everything else is content entry through the two guides
