# Azouz Coffee — affiliate and AI apps guide

The contract includes an affiliate program. No affiliate program can ship
inside a theme: tracking is a script the app injects, and commissions are
records the app stores. This guide picks the app, sets it up, and lists the AI
marketing apps worth installing beside it — with what each one actually costs.

**Prices checked 22 August 2026** on the Shopify App Store. App pricing moves.
Re-read the pricing panel on the listing before you approve a charge.

**Read the [theme setup guide](client-setup-guide.md) first.** Nothing here
works until products exist and the theme is published.

---

## Before anything: what the affiliate program can and cannot cover

The store has two surfaces and the affiliate program only reaches one of them.

| Surface | Pages | Affiliate app sees it? |
|---|---|---|
| D2C shop | Collection, product, cart, checkout | **Yes.** Tracks the click and pays on the order |
| B2B enquiry | Private Label, Wholesale, Request a Sample, Get a Quote | **No.** A form submission is not an order. No app can attribute it |

So an affiliate who sends a café that later signs a wholesale contract earns
nothing automatically. If you want to reward that, handle it outside the app —
the Get a Quote form has a message field, and a referrer's name typed into it
is the only trace you will have. Decide the wholesale referral fee separately
and pay it manually.

---

## 1. The affiliate apps

Three apps have a genuine free tier or a low entry price. All three do the same
core job: give each affiliate a link and a discount code, track the orders,
show them a dashboard, and tell you what to pay.

| | **UpPromote** | **Goaffpro** | **Refersion** |
|---|---|---|---|
| Rating | 4.9 (3,641 reviews) | 4.6 (886 reviews) | 4.8 (462 reviews) |
| Free plan | Yes | Yes | In name only |
| What the free plan allows | Up to **$3,000/month** in referral sales reviewed. Link and coupon tracking, manual payouts, fraud protection, analytics | **Unlimited** affiliates and revenue. Branded portal, welcome emails, analytics, post-checkout popup | Marketplace listing only — no tracking of your own program |
| First paid tier | Growth **$29.99/mo + 2%** of referral sales | Premium **$49/mo flat** | Launch **$39/mo + 3%** of referral sales |
| Next tier | Professional $89.99/mo + 1.5% | — | Growth $199/mo + 2% |
| Free trial on paid | 14 days | 15 days | — |

### The verdict for this store

**Install UpPromote, on the free plan.**

It is the most-reviewed of the three by a wide margin, its free plan tracks by
both link *and* discount code, and $3,000/month of referral sales is well above
where a new program starts. Nothing is paid until the program works.

**When you outgrow the free plan, switch to Goaffpro Premium, not UpPromote
Growth.** The reason is the revenue share. UpPromote's paid tiers add a
percentage of referral sales on top of the monthly fee; Goaffpro's $49 is flat.

| Monthly referral sales | UpPromote Growth | Goaffpro Premium |
|---|---|---|
| $3,000 | $89.99 | $49 |
| $6,000 | $149.99 | $49 |
| $10,000 | $229.99 | $49 |

The two cross at about **$950/month in referral sales** — above that, the flat
fee is cheaper, and the gap only widens. The one thing that buys back the
difference is UpPromote's anti-leak discount protection and auto-tiered
commissions, which arrive on the $89.99 Professional tier. Those matter when
affiliates start leaking codes to coupon sites, which is not a day-one problem.

**Refersion is out.** $39/month *plus* 3% of referral sales before any free
allowance, for a store whose whole theme cost $450. Its free plan does not run
your program — it only lists your offer in their marketplace.

---

## 2. Install and configure UpPromote

Apps → search **UpPromote Affiliate Marketing** → Install → accept the free
plan. It asks no billing details on the free tier.

### 2a. The app embed — do this or nothing tracks

Online Store → Themes → **⋯** → Customize → **App embeds** (bottom of the left
panel) → turn on UpPromote's embed → **Save**.

This is the step people skip. Without it the app's script never loads on the
storefront, affiliate links resolve to an ordinary product page, and every
referral is silently lost. There is no error message — the dashboard just stays
at zero.

**Do it on the published theme.** An embed turned on in a draft does not follow
the theme when you publish a different copy.

### 2b. Commission rules

UpPromote → Programs → the default program.

| Setting | Suggested for Azouz | Why |
|---|---|---|
| Commission type | Percentage of order | Bag prices vary; a flat fee over- or under-pays |
| Rate | 10% to start | Room to raise it for a performer without renegotiating everyone |
| Applies to | Whole order | Per-SKU rules are a paid feature elsewhere and not worth the complexity yet |
| Cookie duration | 30 days | The default. Coffee is a considered first purchase and a fast repeat one |
| Commission on shipping | Off | You do not margin the courier |
| Auto-approve referrals | **Off** | See the COD section below. This is the important one |
| Auto-approve affiliate signups | Off at first | Read the applications until you know who is applying |

Set the program's terms in the same screen: what is not allowed (bidding on
"Azouz" in paid search, coupon-site posting, spam), when commissions are paid,
and the minimum payout. Affiliates accept these at signup, and they are what
you point at when a code leaks.

### 2c. Cash on Delivery changes the payout rule

This store takes COD. A COD order is not revenue until the courier hands over
the money, and refused deliveries are ordinary in Jordan.

If referrals auto-approve, you owe commission on parcels that came back. So:

- **Auto-approve off**, as above
- Approve commissions **after the order is fulfilled and paid**, not when it is
  placed — UpPromote's referral list shows the order's payment status
- Pay out on a cycle, monthly is normal, not per order
- Set a minimum payout — 20 JOD is reasonable — so you are not sending
  three-dinar transfers

Say the payout cycle in the program terms. Affiliates chase payments they were
not told to expect later.

### 2d. Referral links and discount codes

Each affiliate gets a tracked link automatically. The link works, but in Jordan
the **discount code is the one that gets used** — referrals travel through
WhatsApp and Instagram DMs, where a link is often stripped or re-shared without
its parameter, and a code survives being retyped.

In the affiliate's profile → **Coupon** → generate one. Use their own name
(`SARA10`), and give the customer something — 10% off, or free delivery. A code
with no customer-side benefit gets no use.

The code and the link both credit the same affiliate, so an affiliate can hand
out either.

### 2e. Their dashboard, and recruiting

The affiliate portal lives at a URL the app generates, shown in the app under
Settings → Affiliate portal. Affiliates register there, then see their link,
their code, their clicks, orders, and unpaid balance.

Link it from somewhere. The theme has no affiliate page — add one at Pages →
Add page, title *Affiliate Program*, template `page`, and put the portal link
and the headline terms on it. Then add it to the footer menu (setup guide,
step 5). An affiliate program nobody can find recruits nobody.

Turn on the **post-checkout popup** in the app: it invites a customer who just
bought to become an affiliate. It is the cheapest recruitment there is, and it
is on the free plan.

### 2f. Paying affiliates from Jordan

PayPal supports **send, receive and withdraw** for Jordan, per PayPal's own
country-feature table, so PayPal payouts work in principle. In practice most
Jordanian affiliates will not have a funded PayPal account.

Plan for manual payout as the default:

1. Filter the referral list to approved-and-unpaid, for the month
2. Pay by bank transfer or CliQ
3. Mark them paid in the app, so the balance clears and the affiliate's
   dashboard agrees with reality

UpPromote's automatic PayPal payout is a Professional-tier ($89.99) feature
anyway. Manual is not a downgrade at this size — it is one bank session a
month.

Keep the record: commissions are a business expense, and the app's export is
the only evidence of what was owed and when it was paid.

---

## 3. AI marketing apps

Everything recommended here is free. The paid options are listed so you know
what you are declining, not because the store needs them.

| Need | App | Cost | Verdict |
|---|---|---|---|
| Product descriptions, emails, social copy | **Sidekick** (Shopify's built-in AI, formerly Shopify Magic) | Included in your Shopify plan; usage limits vary by plan | Already there. Nothing to install |
| Email marketing | **Shopify Email** | First **10,000 emails/month free**, then **$1 per 1,000** | Install |
| Customer chat | **Shopify Inbox** | Free | Install |
| SEO | **SearchPie** | Free tier: daily monitoring, 50 image compressions, basic schema, bulk meta tags, 50 AI SEO tags. Premium $39/mo | Install the free tier — and see the caution below |
| SEO (alternative) | **Yoast SEO** | $19/mo, 14-day trial, no free plan | Skip |

### Sidekick

Admin → the Sidekick button. Ask it for a product description in the brand's
voice and it writes one against your actual catalogue. Useful for the product
descriptions in `dist/products.csv` — but read every one before it ships. It
does not know that Azouz roasts in Jordan or what the bags look like unless you
tell it, and it writes rustic coffee copy by default, which is exactly what the
brand guidelines rule out.

### Shopify Email

Marketing → Campaigns. 10,000 emails a month is far more than this list will
need for a long time; both a B2B nurture sequence and a D2C launch fit inside
it. It sends from your store sender address — the same one the enquiry forms
use, so authenticate the domain once (setup guide, step 10) and both work.

### Shopify Inbox

Free, made by Shopify, and its AI agent answers from your real catalogue,
inventory and policies. For a B2B visitor asking about minimum order quantity
it is only as good as what the site says — which is currently nothing. Write
the MOQ and lead time down first (see *Still to come from you* in the setup
guide) or the agent will decline to answer the most common question you get.

Set the agent's tone in the app to match the brand voice: direct and
commercial, no warmth theatre.

### SEO: install the free tier, but keep the theme's own SEO

The theme already emits meta tags, Open Graph, Twitter cards, and JSON-LD for
Organization, Product and BreadcrumbList. An SEO app adds monitoring, bulk meta
editing and image compression on top of that.

**Two cautions.** Some SEO apps inject their own structured data, which then
duplicates the theme's — check Google's Rich Results Test after install and
turn the app's schema off if you see a product listed twice. And any app that
offers to "optimise" or "fix" theme code should be refused: Yoast's listing
carries a review from a merchant whose theme settings were wiped by exactly
that kind of write. Let apps read the theme. Do not let them write to it.

---

## 4. Order of work, and what it costs

1. Publish the theme and import products — the setup guide
2. Install UpPromote, free plan
3. **Turn on the app embed on the published theme**
4. Set the commission rate, cookie window, terms, and auto-approve **off**
5. Create the Affiliate Program page and link it from the footer
6. Recruit the first affiliates; turn on the post-checkout popup
7. Install Shopify Email, Shopify Inbox, SearchPie free
8. Approve and pay the first month's commissions manually

**Running cost: $0/month**, until referral sales pass $3,000/month or the email
list passes 10,000 sends a month. Both are good problems.

---

## 5. Check it works before you recruit anybody

Do this on the published store, not a preview — the app embed only exists on
the published theme.

- [ ] Create a test affiliate account through the portal, and approve it
- [ ] Open its referral link in a **private window**, then buy a cheap product
- [ ] The order appears in UpPromote → Referrals within a few minutes, against
      that affiliate, with the right commission
- [ ] It is **pending**, not approved — that proves auto-approve is off
- [ ] Repeat with the discount code instead of the link. Same result
- [ ] Cancel the test order and confirm the commission does not become payable
- [ ] The affiliate's dashboard shows the same numbers you see in admin
- [ ] The Affiliate Program page is reachable from the footer on a phone

If the referral never appears, it is the app embed. It is almost always the app
embed.

---

## Sources

| App | Listing |
|---|---|
| UpPromote | https://apps.shopify.com/affliate-by-secomapp |
| Goaffpro | https://apps.shopify.com/goaffpro |
| Refersion | https://apps.shopify.com/refersion |
| Shopify Email | https://apps.shopify.com/shopify-email |
| Shopify Inbox | https://apps.shopify.com/inbox |
| SearchPie | https://apps.shopify.com/seo-booster |
| Yoast SEO | https://apps.shopify.com/yoast-seo |
| PayPal country features | https://developer.paypal.com/docs/payouts/standard/reference/country-feature/ |
