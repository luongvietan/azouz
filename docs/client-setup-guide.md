# Azouz Coffee — theme setup guide

Everything needed to take the Azouz theme from a file to a live storefront, in
the order that keeps the store working at every step.

Each step names what breaks if it is skipped. That is deliberate: most of these
are silent failures — the page still loads, it is just wrong.

**Time:** about two hours for the whole guide, most of it in step 6.
**You need:** Shopify admin access with the *Themes*, *Products* and *Settings*
permissions.

---

## 1. Install the theme

Two routes. Pick one — do not do both, they will fight over the same theme.

### Route A — connect the GitHub repository (recommended)

Online Store → Themes → Add theme → **Connect from GitHub**, then pick the
repository and the `main` branch.

Edits pushed to `main` reach the store automatically. This is why the theme
files sit at the repository root rather than in a subfolder: Shopify's GitHub
integration only accepts a branch whose `assets/`, `sections/`, `templates/`
and so on are at the top level. It ignores `preview/`, `scripts/`, `tests/`,
`docs/` and the artwork files sitting beside them.

### Route B — upload a zip

```bash
npm run package
```

That writes `dist/azouz-theme-1.0.0.zip`. Upload it at Online Store → Themes →
Add theme → **Upload zip file**.

The zip contains only the eight Shopify directories. Do not zip the folder by
hand — a zip carrying `node_modules/` or the brand-guidelines PDF is rejected on
upload, and the failure message does not say which file caused it.

**Either way:** the theme installs as a draft. Leave it as a draft until step 11.
Preview it from Themes → **⋯** → Preview.

---

## 2. Brand settings

Theme editor → **Theme settings**.

| Setting | What to put there |
|---|---|
| Brand → Logo | The full lockup, SVG preferred |
| Brand → Logo height | 64 px default. **Never below 57 px** — that is the brand-guidelines minimum, and the slider will not let you |
| Brand → Favicon | The logomark, square, at least 96 × 96 px |
| Social → Instagram / Facebook | Full URLs. Leave blank to hide the icon |
| Social → WhatsApp | International format, no `+` or spaces: `962790000000` |

Leave the logo unset and the header falls back to the packaged logo file, so
nothing looks broken — but the store then ships whatever was in the repository
rather than the file you control.

The Header section has a logo picker of its own, and it wins over this one. If
the header shows an old logo after you change it here, that is why.

### About the colours

The five colour settings default to the brand palette and are safe to leave
alone. If you change them, one rule matters more than the rest:

The two colour settings that carry the brand pull in opposite directions, and
each breaks if it is moved toward the other:

**Light sage** (`#DFE5D9`) is a *surface*. It fills the green band, the
announcement bar and the chips, and everything written on it is dark. Darken it
and that dark text stops clearing the WCAG AA minimum.

**Graphite** (`#3E423C`) is what *acts*: button fills, links and the focus
ring, all of them carrying white or sitting as type on the page. Lighten it and
buttons, links and the focus ring become non-compliant and genuinely hard to
read for anyone with low vision.

Two colours from the brand board are deliberately **not** in these settings,
because they are not safe to hand to a picker:

- **Silver** (`#B7B7B3`) is 1.9:1 on the page background. It is a hairline and
  rule colour, and a pale label fill that takes dark ink. It is never text.
- **Burnt Orange** (`#C65B32`) fails in both directions — 3.9:1 as text, 4.3:1
  behind white. Where an orange has to carry words the theme uses a deepened
  `#B3522D` instead. Use the board orange for large type and small marks only.

---

## 3. Create the pages

Online Store → Pages → Add page, six times. **The handles must match exactly** —
they are what the buttons across the site link to.

| Page title | Handle (must be exact) | Template to select |
|---|---|---|
| Private Label | `private-label` | `page.private-label` |
| Wholesale | `wholesale` | `page.wholesale` |
| Our Brands | `our-brands` | `page.our-brands` |
| Own an Azouz Coffee | `own-an-azouz-coffee` | `page.own-an-azouz-coffee` |
| Request a Sample | `request-a-sample` | `page.enquiry` |
| Get a Quote | `get-a-quote` | `page.get-a-quote` |

The handle is under **Search engine listing → Edit** at the bottom of the page
editor. The template is the **Theme template** dropdown in the right sidebar.

Leave the page body empty. These templates build the page from sections; the
body content is not rendered on any of them.

**If a handle is wrong:** the page still exists and still works, but every
"Request a Sample" and "Get a Quote" button on the rest of the site 404s. There
are six links to each of those two pages. Nothing warns you.

---

## 4. Upload the section images

The templates ship with every image slot **empty on purpose**. An image setting
in a Shopify theme has to reference a file in your own media library, and a
theme that ships a file path there fails validation — Shopify then discards the
whole template, and the page 404s. So the images are yours to set once.

Upload the photography first at **Content → Files**, then set each slot in the
theme editor:

| Page | Section | Image slot |
|---|---|---|
| Home | Hero | Hero image |
| Home | Service cards → each of the four cards | Photograph |
| Home | Brand feature (*Roasted in Jordan*) | Feature image |
| Private Label | Hero | Hero image |
| Wholesale | Hero | Hero image |
| Our Brands | Hero | Hero image |
| Our Brands | Brand feature | Feature image |
| Own an Azouz Coffee | Hero | Hero image |
| Own an Azouz Coffee | Brand feature | Feature image |
| Request a Sample | Hero | Hero image |
| Get a Quote | Hero | Hero image |

The four homepage service cards are the ones that change the page most. Each
card shows a coloured label panel until its **Photograph** slot is filled, and
switches to a photo-led card — picture, detail line, title, one sentence,
button — the moment it is. Set all four or none: a row that mixes photographs
with coloured panels looks unfinished.

What to shoot for each slot is in
[the photography brief](#the-photography-brief) below.

Set the **Image alt** text beside each one. It is what a screen reader announces
and what shows if the image fails to load. Describe the picture, do not repeat
the heading above it.

**If a slot is left empty:** the section renders without the image rather than
breaking, so it is easy to miss. The homepage hero is also the largest element
on the page — leaving it empty is the most visible gap on the site.

---

## 5. Navigation

Online Store → Navigation.

- **Main menu** (handle `main-menu`) — the header. Suggested: Private Label,
  Wholesale, Own an Azouz Coffee, Our Brands, Shop, Journal. That is six items,
  which is the measured ceiling — see below. If the Journal is not launching
  with the site, leave it out.
- **Footer menu** (handle `footer`) — the footer service links.

Both are set per-section in the theme editor (Header → Menu, Footer → Menu), so
a differently-named menu works — you just have to pick it there.

Keep the header menu to **six items or fewer**. Measured across 768, 900, 1024,
1280 and 1440 px, six sit on a single row at every width. A seventh wraps onto a
second line on a tablet — the page never scrolls sideways, but the header gets
taller and it looks unintended.

The footer also has a Tagline, Phone and Address, and a switch to hide the
contact block entirely.

---

## 6. Products

The longest step. Do it in this order — the metafields have to exist before the
import, or the values arrive with nowhere to live.

### 6a. Create the metafield definitions

Settings → **Custom data** → **Products** → Add definition. Seven of them, all
in the `custom` namespace:

| Name | Namespace and key | Type | Notes |
|---|---|---|---|
| Roast level | `custom.roast_level` | Integer | 1–5. Drives the roast dot meter |
| Tasting notes | `custom.tasting_notes` | Single line text, **list of values** | e.g. Dark Chocolate, Caramel, Spice |
| Origin | `custom.origin` | Single line text | e.g. Blend, Colombia |
| Process | `custom.process` | Single line text | e.g. Washed, Natural |
| Altitude | `custom.altitude` | Single line text | e.g. 1,400–1,900 masl |
| Brew methods | `custom.brew_methods` | Single line text, **list of values** | e.g. Espresso, Moka Pot |
| Label colour | `custom.label_color` | Colour | The packaging label colour for that blend |

The namespace and key must be exactly as written. `custom.roast_level` works;
`custom.roastLevel` or `azouz.roast_level` silently renders nothing.

Tick **Storefronts** on every definition so the theme can read it.

Every one of these is optional at render time — a product missing all seven
still shows correctly, just as a plain card. That is by design, so the store is
never broken mid-setup. It also means a missing definition never announces
itself.

### 6b. Import the products

`dist/products.csv` is the file you edit — titles, prices, stock and SKUs live
there, not in the theme. Open it in Excel or Google Sheets, set the real prices,
then import at Products → **Import**.

Prices in the shipped file are placeholders. Everything else — the option
structure (Weight × Grind), the metafield columns and the tasting notes — is
already correct and matches what the theme reads.

To regenerate the file after changing the catalogue:

```bash
npm run products
```

### 6c. Product images

The CSV's `Image Src` column needs URLs Shopify can fetch; local file paths do
not work. The shipped file already points at files uploaded to the store. If you
re-upload the photography, regenerate with the new base URL:

```bash
node scripts/generate-products-csv.js --image-base https://your-store.myshopify.com/cdn/shop/files/
```

Or leave the column empty and add the images by hand in the product editor after
importing.

---

## 7. Collections

The theme's shop link points at `/collections/all`, which Shopify maintains for
you — nothing to create.

If you add your own collections, the homepage **Featured collection** section
has a collection picker; it currently shows all products.

---

## 8. The journal

Online Store → Blog posts → **Manage blogs** → Add blog.

The blog and post templates apply automatically — there is nothing to select.
Add a menu link to the blog in the main menu (step 5).

Comments are off by default. Turning them on in the blog's settings makes the
comment form appear on posts; leaving them off removes it entirely, which is the
right choice unless someone is going to moderate them.

---

## 9. Gift cards

Products → **Gift cards** to issue one. The issued-card page is served by
Shopify automatically at its own URL and needs no setup.

That URL is a bearer token: anyone holding the link can spend the balance. The
page tells search engines not to index it and sends no referrer, but treat the
link itself as you would a password.

---

## 10. Enquiry forms

Both enquiry forms — Request a Sample and Get a Quote — post through Shopify's
own contact form. Submissions arrive at the **store sender email**, set at
Settings → **Notifications**. Set that to a mailbox someone actually reads
before launch; there is no other copy of an enquiry.

**Test both forms before launch.** Submit each one, confirm the email arrives,
and check the reply-to address is the enquirer's.

Each form's dropdowns are editable in the theme editor as comma-separated lists:

- **Business types** — Coffee Shop, Restaurant, Hotel, Office, Retailer, …
- **Coffee types** — Espresso, Turkish, Arabic, Specialty, …
- **Pre-selected business type** — sets the dropdown's starting value
- **Require expected volume** — off on the sample form, on for quotes

---

## 11. Before you publish

- [ ] Settings → **Policies**: privacy, terms, refund. The footer only shows the
      ones you have written
- [ ] Online Store → Preferences: store title and meta description
- [ ] Preferences → **Password page** is on until you are ready; the theme has a
      styled password page
- [ ] Walk the site on a phone: home, private label, wholesale, a product, the
      cart, both enquiry forms
- [ ] Submit both enquiry forms and confirm the emails arrive
- [ ] Check a product page shows the roast meter and the tasting notes — that is
      the fastest way to confirm step 6a worked

Then Online Store → Themes → **Publish**.

Once the store is live, set up the affiliate program and the marketing apps:
[affiliate-and-ai-apps.md](affiliate-and-ai-apps.md). Affiliate tracking only
works on a published theme, which is why it comes after this step and not
before.

---

## The photography brief

The homepage now leads with photographs rather than coloured rectangles, which
only works if the pictures do the explaining. The brief below is the client's
own shot list, written as something a photographer can work from.

House style throughout: bright, clean, almost architectural. Real production,
not lifestyle. Plenty of empty space. Silver foil on off-white or light
concrete. No burlap, no wood grain, no steam, no latte art.

| Where it goes | The shot |
|---|---|
| **Home → Hero** | Close-up of the roasting operation: stainless steel, roasted coffee falling into the cooling tray, one or two silver Azouz bags positioned nearby |
| **Home → Private Label card** | Three or four silver bags standing together, each carrying a different fictional brand label. It says *we manufacture coffee for your brand* without a word of copy |
| **Home → Wholesale card** | A café counter: espresso machine, grinder, and a 1 kg coffee bag beside it. B2B, not lifestyle |
| **Home → Specialty card** | Top-down: green beans, roasted beans, cupping bowls, origin cards. Very clean, plenty of empty space |
| **Home → Own an Azouz Coffee card** | The counter of an Azouz location — signage, cups and the bag in one frame |
| **Home → Roasted in Jordan** | A wider shot of the actual roaster, sacks and production area, or somebody working at the machine. Real manufacturing is what carries credibility |
| **Our Brands** | The Amman, Downtown, Dead Sea, Petra and Wadi Rum bags photographed individually against off-white or light concrete |

Two practical notes:

- **The homepage hero is the current weak point.** The cup-in-hand photograph is
  a nice picture, but it reads as a café rather than as a roaster, a wholesaler
  or a manufacturer. It is the one image worth reshooting first — everything
  else on the page is already telling a B2B story.
- **Shoot the service cards to a landscape crop.** They are displayed at 4:3 and
  centre-cropped, so anything critical at the top or bottom edge is at risk.

---

## Still to come from you

These are content gaps rather than defects. The pages are built and waiting for
the material:

- **Minimum order quantity and lead time.** No page states either, although the
  enquiry form asks the customer for their expected monthly volume. This is the
  first question a wholesale buyer asks.
- **Trust signals.** No food-safety, HACCP or halal certification, no founding
  year, no roastery capacity, no reference customers. For a B2B audience this
  carries more weight than any of the design work.
- **An About / Our Roastery page.** There is no template for one yet; the
  default page template will carry it, or a purpose-built one can be added. The
  homepage *Roasted in Jordan* band currently points at Our Brands.
- **The terms of a coffee-shop deal.** The Own an Azouz Coffee page describes
  what a location opens with and how to enquire, but states no investment
  range, no fee structure and no territory rules. Whatever of that is decided
  belongs on the page before it is promoted.

---

## When something looks wrong

| What you see | Why | Fix |
|---|---|---|
| A hero has no image | The image slot was never set | Step 4 |
| A page shows plain text instead of the designed layout | Wrong theme template selected | Step 3, the Theme template dropdown |
| "Request a Sample" 404s | The page handle does not match | Step 3, the handle must be `request-a-sample` |
| Product cards show a title and price but no colour, notes or roast dots | The metafield definitions are missing, wrongly named, or not exposed to storefronts | Step 6a |
| Product images are missing after import | `Image Src` was empty or unreachable | Step 6c |
| No enquiry emails | The sender email is unset or unmonitored | Step 10 |
| The footer shows no policies | None have been written | Step 11 |
| A menu item does nothing | The menu link points at a page that does not exist | Step 5 |
| The homepage services show coloured panels, not photographs | Those cards have no image set | Step 4, and the photography brief |
| "Explore Opportunities" 404s | The coffee-shop page handle does not match | Step 3, the handle must be `own-an-azouz-coffee` |

---

## Reference

| Path | What it is |
|---|---|
| `dist/azouz-theme-1.0.0.zip` | The uploadable theme, from `npm run package` |
| `dist/products.csv` | The product import file you edit |
| [`docs/affiliate-and-ai-apps.md`](affiliate-and-ai-apps.md) | The affiliate program and the marketing apps — do this after step 11 |
| `npm run preview` | Local preview of the real theme at `localhost:4321` |
| `npm test` | The theme's own test suite |
| `npm run check` | Shopify's theme linter |
