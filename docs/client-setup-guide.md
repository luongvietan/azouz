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

**Deep green** is what the theme puts behind body-size white text. It is a
darker shade of the primary green precisely so that combination clears the
WCAG AA contrast minimum. Set it to something lighter and buttons, links and
the green band become legally non-compliant and genuinely hard to read for
anyone with low vision. The primary green is for fills and large headings only.

---

## 3. Create the pages

Online Store → Pages → Add page, four times. **The handles must match exactly** —
they are what the buttons across the site link to.

| Page title | Handle (must be exact) | Template to select |
|---|---|---|
| Private Label | `private-label` | `page.private-label` |
| Wholesale | `wholesale` | `page.wholesale` |
| Our Brands | `our-brands` | `page.our-brands` |
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
| Private Label | Hero | Hero image |
| Wholesale | Hero | Hero image |
| Our Brands | Hero | Hero image |
| Our Brands | Brand feature | Feature image |
| Request a Sample | Hero | Hero image |
| Get a Quote | Hero | Hero image |

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
  Wholesale, Our Brands, Shop, Journal.
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
  default page template will carry it, or a purpose-built one can be added.

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

---

## Reference

| Path | What it is |
|---|---|
| `dist/azouz-theme-1.0.0.zip` | The uploadable theme, from `npm run package` |
| `dist/products.csv` | The product import file you edit |
| `npm run preview` | Local preview of the real theme at `localhost:4321` |
| `npm test` | The theme's own test suite |
| `npm run check` | Shopify's theme linter |
