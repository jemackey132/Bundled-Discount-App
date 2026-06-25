# Super Bundle — Product Roadmap & Developer Reference

> Last updated: June 25, 2026  
> Status: Active development — Fixed Bundles, Volume Discounts, and Buy X Get Y functional; analytics charts shipped

---

## Table of Contents

1. [App Overview](#1-app-overview)
2. [Technical Architecture](#2-technical-architecture)
3. [Current State of the Codebase](#3-current-state-of-the-codebase)
4. [Competitor Landscape](#4-competitor-landscape)
5. [UI Scaffolding Audit](#5-ui-scaffolding-audit)
6. [Work Queue — Quick Fixes](#6-work-queue--quick-fixes)
7. [Work Queue — Phase 2: Core Feature Parity](#7-work-queue--phase-2-core-feature-parity)
8. [Work Queue — Phase 3: Growth Features](#8-work-queue--phase-3-growth-features)
9. [Shopify App Store Strategy](#9-shopify-app-store-strategy)
10. [Infrastructure & Ops](#10-infrastructure--ops)

---

## 1. App Overview

**App name:** super-bundle  
**Shopify partner account:** Klax Holdings LLC  
**Client ID:** f2ba8fb09ad4efddc394c334eefa997a  
**Dev store:** bundle-discount-app-staging.myshopify.com  
**App URL (dev):** Cloudflare tunnel (changes each `npm run dev` session; auto-updated in shopify.app.toml)

### What it does

Super Bundle is a Shopify embedded app that allows merchants to create product bundles with automatic discounts. When customers add bundled products to cart, a Shopify Function (Cart Transform) detects the complete set and merges them into a grouped bundle with the configured discount applied. This is the technically superior approach — native Shopify Functions rather than legacy line item scripts or draft order hacks.

### What's built and working (as of June 2026)

- **"Fixed Bundle" type** — Fixed product bundles with percentage or fixed-dollar discounts. Merchant picks N products, sets a discount, creates a Shopify product representing the bundle. When customer adds all component products to cart, the Cart Transform Function merges them and applies the discount.
- **Bundle CRUD** — Create, read, update, delete bundles via the admin UI. Delete archives the Shopify product and removes the DB record.
- **Bundle Settings** — Persisted per-shop settings: subscriptions toggle, inventory tracking, button action (cart/checkout), variant selector type, product pricing display, and discount combination rules.
- **Analytics with charts** — Per-bundle tracking of views, clicks, orders, and sales revenue. KPI cards on the home dashboard. Analytics tab has Recharts-powered charts: 30-day sales + orders time-series (area chart), top bundles by revenue (horizontal bar), engagement breakdown by bundle (grouped bar), and a per-bundle data table. Time-series data is backed by a `BundleEvent` table written on every view, click, and order.
- **Webhooks** — ORDERS_CREATE (increments bundle_orders/bundle_sales, writes BundleEvent), APP_SUBSCRIPTIONS_UPDATE (stores subscription status in AppSetting), APP_UNINSTALLED, and three GDPR compliance webhooks.
- **Dev environment** — Railway MySQL database, Shopify CLI tunnel, hot reloading.
- **Volume Discount / Quantity Breaks** — Fully functional. Merchants create per-product tiered discounts (e.g. 2+ → 10% off, 5+ → 20% off). Tiers stored as a JSON metafield on the Shopify product (`custom.volume_tiers`). A `product_discounts` Shopify Function (`purchase.product-discount.run`) reads the metafield at checkout and applies the highest qualifying tier automatically. One global automatic discount is registered per shop via `discountAutomaticAppCreate` and cached in the `AppSetting` table.
- **Volume Discount storefront badge** — Theme app extension block (`volume-discount-badge.liquid`) that reads the `custom.volume_tiers` metafield on a product and renders a styled tier breakdown on the product page. Fully hidden on products with no volume tiers (no blank space).
- **Buy X Get Y / BOGO** — Fully functional. Merchant selects a "buy" product + quantity and a "get" product + quantity with a percentage discount. Rules stored in the `BuyXGetY` table and synced as a `custom.bogo_rules` JSON metafield on each buy product. The `product_discounts` Shopify Function reads the metafield at checkout and applies the discount when the cart qualifies.
- **Billing (Shopify Billing API)** — "Super Bundle Pro" plan at $9.99/mo with a 14-day free trial. Free plan allows 1 Fixed Bundle; Pro unlocks unlimited bundles, volume discounts, and BOGO. Plan page at `/app/plan`. Subscription cancellation/expiry handled via APP_SUBSCRIPTIONS_UPDATE webhook.
- **Unified "Offers" dashboard** — All three offer types (Fixed Bundle, Volume Discount, Buy X Get Y) appear in a single merged list with type badges, status, and edit/delete actions. Getting Started welcome screen shows only on first install; returning merchants land on the Offers list directly.
- **Post-save navigation fix** — All form saves use `window.shopify.navigate()` (App Bridge) instead of `window.location.href` to preserve the Shopify embedded session context.

---

## 2. Technical Architecture

### Stack

| Layer | Technology |
|---|---|
| Framework | Remix v1 (Shopify App Remix) |
| UI | Shopify Polaris v11 + polaris-icons v8 |
| Database | Prisma ORM + MySQL (hosted on Railway) |
| Auth | @shopify/shopify-app-remix (session-based) |
| Shopify Extensions | Theme App Extension (Liquid) + 2× Shopify Functions |
| Deployment | Shopify CLI deploy → Cloudflare (app) + Railway (DB) |

### Shopify Extensions

**1. Theme App Extension** (`extensions/super-bundle-theme-ext/`)  
Injects the bundle widget into the storefront (product pages, bundle landing pages). Liquid + JS + CSS. This is what customers see — critical path for conversion.

**2. Cart Expansion Function** (`extensions/super-bundle-cart-expansion/`)  
A Shopify Function that expands bundle products into their components when added to cart.

**3. Cart Transform Function** (`extensions/super-customize-bundle-ext/src/index.js`)  
The core discount engine. Reads `component_parents`, `component_quantities`, and `price_adjustment` metafields on cart line variants. When all components of a bundle are present in sufficient quantity, it emits a `merge` operation with a `percentageDecrease` price adjustment. This groups lines visually in the cart and applies the discount natively at Shopify's checkout level.

### Database Schema (Prisma)

```prisma
model Session { ... }          // Shopify session management

model Bundle {
  id                    Int
  shop                  String
  bundle_name           String
  bundle_items          Json           // array of {id, name, image, variantId, gid, quantity}
  bundle_discount_type  String         // "percentage" | "fixed"
  bundle_discount_value Float
  bundle_status         Boolean        // active/draft
  bundle_product_gid    String?        // Shopify product GID for the bundle product
  bundle_media          String?        // @db.Text — uploaded image URL
  bundle_title          String?        // customer-facing title
  bundle_start_date     DateTime?
  bundle_start_time     String?
  bundle_end_date       DateTime?
  bundle_end_time       String?
  bundle_views          Int            // incremented by theme ext proxy
  bundle_clicks         Int            // incremented by theme ext proxy
  bundle_orders         Int            // incremented by ORDERS_CREATE webhook
  bundle_sales          Float          // incremented by ORDERS_CREATE webhook
}

model VolumeDiscount {
  id            Int
  shop          String
  title         String
  status        Boolean
  product_id    String         // Shopify product GID
  product_title String
  product_image String?
  discount_gid  String?        // Shopify automatic discount GID
  views         Int
  orders        Int
  revenue       Float
  tiers         VolumeTier[]
}

model VolumeTier {
  id                 Int
  volume_discount_id Int
  min_quantity       Int
  discount_type      String    // "percentage" | "fixed"
  discount_value     Float
  label              String?
}

model BuyXGetY {
  id                Int
  shop              String
  title             String
  status            Boolean
  buy_product_id    String
  buy_product_title String
  buy_product_image String?
  buy_quantity      Int
  get_product_id    String
  get_product_title String
  get_product_image String?
  get_quantity      Int
  discount_value    Float     // percentage off (100 = free)
}

model BundleEvent {
  id         Int
  bundle_id  Int            // references Bundle.id (Fixed Bundle only for now)
  shop       String
  event_type String         // "view" | "click" | "order"
  value      Float          // sale amount for orders, 0 for view/click
  created_at DateTime
  // Indexes: [shop, event_type, created_at], [bundle_id]
}

model AppSetting {
  shop  String
  key   String             // e.g. "hasSeenOnboarding", "subscriptionStatus", "volumeDiscountId"
  value String  @db.Text
  // @@unique([shop, key])
}

model BundleSettings {
  shop                  String  @unique
  subscriptions_enabled Boolean
  track_inventory       Boolean
  track_inventory_mode  String   // "disabled" | "show_badge"
  button_action         String   // "cart" | "checkout"
  variant_selector      String   // "color_swatch" | "dropdown"
  product_pricing       String   // "final_price" | "compare_at_price"
  discount_application  String   // "when_click" | "always"
  discount_combination  String   // "when_click" | "never"
}
```

### Key Files

```
app/
  bundle.server.js              # Fixed Bundle CRUD + Shopify product ops
  volume_discount.server.js     # Volume Discount CRUD + metafield sync
  bogo.server.js                # Buy X Get Y CRUD + per-product metafield sync
  billing.server.js             # checkBillingStatus(), requestProPlan()
  shopify.server.js             # Shopify app config, auth, webhook registration
  db.server.js                  # Prisma client singleton
  routes/
    app._index.jsx              # Welcome screen (first install only; returning → /app/additional)
    app.additional.jsx          # Unified Offers list + Analytics charts (tabs: Home/Offers/Customization/Analytics/Settings)
    app.create_bundle_form.$id.jsx   # Fixed Bundle create/edit form
    app.volume_discount_form.$id.jsx # Volume Discount create/edit form
    app.bogo_form.$id.jsx            # Buy X Get Y create/edit form
    app.bundle_settings.jsx     # Bundle settings page
    app.plan.jsx                # Plan page (Free vs Pro feature comparison + upgrade CTA)
    app.volume_discounts.jsx    # Redirects GET to /app/additional; handles POST delete/save
    webhooks.jsx                # Webhook handler (ORDERS_CREATE, APP_SUBSCRIPTIONS_UPDATE, APP_UNINSTALLED, GDPR)
    api.proxy.jsx               # Storefront proxy — HMAC-verified view/click tracking + BundleEvent writes
    api.form.jsx                # Form submission from storefront
extensions/
  super-bundle-ext/             # Theme App Extension
    blocks/
      volume-discount-badge.liquid  # Storefront badge reading custom.volume_tiers metafield
  super-customize-bundle-ext/   # Cart Transform Function (Fixed Bundle merge + discount)
  super-bundle-cart-expansion/  # Cart Expansion Function
  volume-discount-function/     # product_discounts Function (volume tiers + BOGO rules from metafields)
prisma/
  schema.prisma                 # DB schema (see above)
```

### Environment Variables (`.env` — not in git)

```
DATABASE_URL=mysql://root:PASSWORD@thomas.proxy.rlwy.net:55511/railway
SHOPIFY_API_KEY=f2ba8fb09ad4efddc394c334eefa997a
SHOPIFY_API_SECRET=46c5e8b9d450043a7093c8b255db549a
SCOPES=write_products,write_files,write_publications,write_cart_transforms,read_orders
```

### Running Locally

```bash
npm run dev
# Opens Shopify CLI tunnel, starts Remix on localhost:PORT
# Access app via: https://bundle-discount-app-staging.myshopify.com/admin/apps/super-bundle
```

### Deploying Extensions

```bash
npm run deploy
# Required to push Shopify Function builds and assign UIDs
# Must run before first `npm run dev` on a fresh clone
```

### Database Migrations

```bash
./node_modules/.bin/prisma migrate dev --name "migration_name"
# Use local binary (v4.16.2), NOT `npx prisma` which installs v7 (incompatible)
```

---

## 3. Current State of the Codebase

### What's Complete ✅

- [x] App authentication & session management
- [x] Fixed Bundle type — full create/edit/delete with Shopify product creation
- [x] Cart Transform Function — merge + percentageDecrease for fixed bundles
- [x] Bundle Settings page with DB persistence
- [x] Analytics tracking — views, clicks, orders, sales (KPI cards + Recharts charts: time-series area chart, top bundles bar, engagement bar, per-bundle table)
- [x] BundleEvent table — time-series event logging (view/click/order) for Fixed Bundles
- [x] ORDERS_CREATE webhook → bundle_orders/bundle_sales increment + BundleEvent write
- [x] APP_SUBSCRIPTIONS_UPDATE webhook → subscription status stored in AppSetting
- [x] GDPR compliance webhooks
- [x] File upload for bundle images (via Shopify Files API)
- [x] Storefront proxy API — HMAC-verified view/click tracking + BundleEvent writes
- [x] Delete bundle (archives Shopify product, removes DB record)
- [x] Volume Discount / Quantity Breaks — UI, DB, Shopify Function, automatic discount registration
- [x] Volume Discount storefront badge — theme extension block reads `custom.volume_tiers` metafield
- [x] Buy X Get Y / BOGO — UI, DB, per-product metafield sync, Shopify Function discount at checkout
- [x] Shopify Billing — "Super Bundle Pro" at $9.99/mo, 14-day trial, plan page, gating on bundle + volume discount creation
- [x] Unified "Offers" dashboard — Fixed Bundle + Volume Discount + BOGO in one merged list with type badges
- [x] "Offers" rebrand — renamed from "Bundles" throughout; merged Volume Discounts nav item removed
- [x] First-install onboarding — Getting Started screen shows once; returning merchants land on Offers list
- [x] Post-save App Bridge navigation — all forms use `window.shopify.navigate()` instead of `window.location.href`
- [x] QF-1: Dead links and buttons fixed
- [x] QF-2: Placeholder icons replaced with Polaris icons
- [x] QF-3: Bundle table product images
- [x] QF-4: Welcome screen rebuilt (clean value prop card, no fake wizard)
- [x] QF-5: Coming Soon badges on unbuilt offer types
- [x] P2-5: Offers tab — working search, type filter (All / Fixed Bundle / Volume Discount / Buy X Get Y), Active/Draft tab filtering, 10-per-page pagination; dead filter dropdowns removed
- [x] P2-6: Restore Pages — `/app/restore_pages` route checks page existence via Admin API, creates "Bundles" and "Bundle Builder" pages with `pageCreate` mutation; Settings card wired
- [x] P2-7: Translation page — `/app/translation` route; three overridable storefront labels (Add to cart, Bundle discount, Save badge); stored as JSON in `BundleSettings.translations`; proxy GET exposes translations to theme extension
- [x] P2-8: Analytics event tracking for Volume Discounts and BOGO — `BundleEvent` extended with `offer_type` + `offer_id`; ORDERS_CREATE webhook detects VD/BOGO products via metafield query and writes order events; proxy accepts VD/BOGO view/click events; Analytics tab adds "Orders by offer type" breakdown table

### Known Issues / Open Items 🐛

- The "Based on order" tab in Analytics doesn't load order-level data (renders same bundle data)
- Customization → Design "Customize" button still dead (needs theme editor URL from shop domain)
- Settings → Featured Apps still a dead link
- Volume Discount storefront badge does not yet fire view/click events to the proxy (requires theme extension re-deploy with a `fetch` call to `api.proxy` on render)

---

## 4. Competitor Landscape

### The Four Reference Apps

#### BOGOS: Free Gift Bundle Upsell
- **URL:** apps.shopify.com/freegifts
- **Rating:** 5.0★ (3,846 reviews)
- **Launched:** December 2014 — the most established player
- **Stores:** 87,000+
- **Pricing:** Free (30 lifetime orders) → $29.99/mo (300/mo) → $49.99/mo → $109.99/mo Shopify Plus
- **Strengths:** Decade of trust, POS support, headless/Hydrogen API, checkout upsell (Plus), AI assistant, progress bar widgets, "today offer" popups, gift thumbnail in cart, multi-currency, translation. The benchmark for feature completeness.
- **Bundle types:** BOGO, Buy X Get Y, free gift with purchase, classic bundle, mix & match, bundle builder (build a box), volume discount, cart discount, FBT, checkout upsell, thank you page upsell
- **Strategic takeaway:** Their free tier is very generous. They monetize on order volume (per-order fee model), not feature gating. We cannot compete head-on with them — differentiate on UX simplicity and modern Shopify Functions tech.

#### Bundler — Product Bundles
- **URL:** apps.shopify.com/bundler-product-bundles
- **Rating:** 4.9★ (2,285 reviews)
- **Launched:** July 2019
- **Pricing:** Free (unlimited orders/revenue) → $9.99/mo Premium → $19.99/mo Executive
- **Strengths:** Generous free tier (Buy X Get Y, volume discounts, product page upsells, POS, auto-apply all free). Clean UI. 16 languages. Integration with Seal Subscriptions, PageFly.
- **Bundle types:** Classic bundles, Mix & Match (paid), tiered Mix & Match (paid), quantity breaks, volume discounts, Buy X Get Y, subscription product bundles, cross-sell offers, bundle landing pages
- **Analytics:** Revenue graphs, AOV graphs, conversion graphs — all behind $19.99/mo tier
- **Strategic takeaway:** Most direct competitor to our current feature set. Their free tier already includes Volume Discount and Buy X Get Y. We need to match this minimum to be viable.

#### Unlimited Bundles & Discounts (Revy)
- **URL:** apps.shopify.com/product-bundles-discounts-by-revy
- **Rating:** 4.8★ (701 reviews)
- **Launched:** October 2018
- **Pricing:** Free (0-order stores only) → $13.99/mo Basic → $21.99/mo Grow → $29.99/mo Advanced
- **Strengths:** "Built for Shopify" badge, live preview editor, combinable discounts, very broad bundle type coverage, clean onboarding, explicit Shopify plan tier mapping in pricing.
- **Bundle types:** Fixed, multipacks, mix & match, variant bundles, build a box, sample packs, wholesale, upsell, cross-sell, custom
- **Strategic takeaway:** Live preview editor is a key UX differentiator. Their pricing tiers map directly to Shopify plans (Basic/Grow/Advanced) which is a clever positioning move.

#### SMART Automatic Discounts BOGO
- **URL:** apps.shopify.com/smart-automatic-discounts
- **Rating:** 5.0★ (139 reviews)
- **Launched:** December 2024 — very new, proof that new entrants can compete
- **Pricing:** Free
- **Strengths:** Fully free, conditions based on customer tags/segments/geolocation, run multiple promotions simultaneously without conflicts, discount code + automatic discount both supported, 17 languages
- **Bundle types:** BOGO, Buy X Get Y, volume discount, quantity breaks, tiered pricing, mix & match, bundles
- **Strategic takeaway:** Proof of concept that a new app launched in late 2024 can quickly get to 5.0★. Their differentiator is advanced condition targeting (customer segments, geo). This is achievable for us in Phase 3.

### Feature Matrix

| Feature | Our App | Bundler | Revy | BOGOS | SMART |
|---|---|---|---|---|---|
| Fixed Bundles | ✅ | ✅ | ✅ | ✅ | ✅ |
| Volume / Quantity Breaks | ✅ | ✅ Free | ✅ Paid | ✅ Free | ✅ Free |
| Buy X Get Y / BOGO | ✅ Pro | ✅ Free | ✅ | ✅ Free | ✅ Free |
| Mix & Match | ❌ | ✅ $9.99 | ✅ | ✅ | ✅ Free |
| FBT (Frequently Bought Together) | ❌ | ✅ | ✅ | ✅ | ❌ |
| Free Gift | ❌ | ✅ | ✅ | ✅ | ✅ |
| Bundle Landing Page | ❌ | ✅ | ✅ | ❌ | ❌ |
| Analytics (numbers) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Analytics (graphs) | ✅ | ✅ $19.99 | ✅ | ✅ | ❌ |
| Volume Discount Storefront Badge | ✅ | ❌ | ❌ | ❌ | ❌ |
| Storefront Widget Customization | ❌ | ✅ | ✅ | ✅ | ✅ |
| Translation / Multi-language | ❌ | ✅ | ❌ | ✅ | ✅ |
| Shopify Functions (native) | ✅ | ❌ | ❌ | ❌ | ✅ |
| Shopify Billing | ✅ | ✅ | ✅ | ✅ | Free |
| Progress Bar Widget | ❌ | ❌ | ❌ | ✅ | ❌ |
| Checkout Upsell | ❌ | ❌ | ❌ | ✅ Plus | ❌ |

### Our Technical Advantage

**Shopify Functions are the future.** Revy and Bundler both use older methods (line item scripts, draft order manipulation) that Shopify has been deprecating. Our Cart Transform Function approach is native, performant, and does not rely on JavaScript execution in the storefront — it runs server-side at Shopify's infrastructure level. This means no lag, no cart flicker, no theme compatibility issues. This is a genuine differentiator worth calling out in app store marketing copy.

---

## 5. UI Scaffolding Audit

This section maps every UI element to its current state and what it should do.

### Welcome Screen (`app._index.jsx`)

**Current:** Shows logo, "Welcome!", a 3-step grid (Step 1 preferences / Step 2 Brand info / Step 3 Install App), and a "Begin" button that links to `/app/additional`. None of the steps do anything.

**Problem:** Creates an impression of a wizard that doesn't exist. Merchants click Begin expecting to configure something and instead land on an empty dashboard.

**Fix:** Either (a) remove the fake wizard steps and make it a proper "get started" screen with a single clear CTA, or (b) build a real onboarding wizard. Option (a) is the quick fix.

---

### Home Tab (tab index 0 in `app.additional.jsx`)

**"Read now" button:** No `url` prop. Should link to an external help article or a docs page.

**Stats cards (Bundle views, Bundle clicks, Sold bundle quantity, Total sales):** Each uses `<img src={welcome} width="40" />` (the spinning logo) as the icon. These should have meaningful icons (eye, cursor/pointer, shopping bag, dollar sign). Use Polaris icons or SVG.

**Recent Bundle table:** Works correctly when bundles exist. Empty state ("No bundles yet!") is correct.

---

### Bundle Tab (tab index 1)

**Bundle table product images:** Uses `<Avatar customer name={item.name} />` which renders initials in a circle. Should render actual product images using `<Avatar source={item.image} />` when `item.image` exists, falling back to initials only when no image is available.

**Filter/Sort/Search:** The TextField, Popover filters (Type, Enable displays, Bundle as a products), Saved button, and Sort button are all rendered but have no backing state logic. Filter input does not filter the table. For the quick fix, these can remain as visual placeholders. For Phase 2, they need real logic.

**Pagination:** Hardcoded "Show page 1 of 1". Needs real pagination against the DB for Phase 2.

**"Active" and "Draft" tabs:** `tabletabs` is defined but only `tselected === 0` (All) renders content. Active/Draft tabs show nothing. For Phase 2, filter by `bundle_status`.

---

### Customization Tab (tab index 2)

**Design → "Customize" button:** Dead. Should open the Shopify Theme Editor for the current store. URL: `https://{shop}/admin/themes/current/editor`. This can be constructed in the loader and passed as a prop.

**Bundle priority → "Bundles page" Customize button:** Dead. Would need a drag-and-drop priority editor backed by a new `bundle_priority` field in the DB. Phase 2 feature.

**Bundle priority → "Products page" Customize button:** Dead. Would need a product-picker and per-product bundle ordering UI. Phase 3 feature.

---

### Analytics Tab (tab index 3)

**"Based on order" button:** Switches `activeAnalyticsButtonIndex` but both views render the same bundle-based data. Phase 2: add order-level analytics query.

**Date range filter:** The `Select` dropdown changes `filterSelected` state but has no effect on the data fetched. Phase 2: pass date range to the loader.

**No charts:** All four competitors show visual charts. Bundler gates this behind their $19.99/mo tier. For us: add a simple line chart using Recharts (already in the Shopify Polaris ecosystem) for Phase 2.

---

### Settings Tab (tab index 4)

| Card | Current | Fix |
|---|---|---|
| Bundle settings | ✅ Links to `/app/bundle_settings` — WORKS | None needed |
| Translation | Dead `<Link>` with no destination | Phase 2: build translation page or link to external translation app |
| Feature Request | Dead `<Link>` | Quick fix: link to a Google Form or Typeform |
| Plan | Dead `<Link>` | Phase 2: build billing/plan page using Shopify Billing API |
| Restore pages | Dead `<Link>` | Phase 2: functional page that recreates Shopify pages via Admin API |
| Featured apps | Dead `<Link>` | Quick fix: static page with partner app recommendations |

**Avatar icons:** All six cards use `<Avatar shape="square" customer name="Farrah" />` as the icon — renders a generic initials avatar. Each should have a contextual icon (gear, language globe, lightbulb, credit card, refresh, grid of apps).

---

### Create Bundle Form (`app.create_bundle_form.$id.jsx`)

**Currently working:**
- Product search and browse (ResourcePicker)
- Bundle name, title, image upload
- Status (Active/Draft)
- Discount type (Fixed/Percentage) + value
- Start/end date and time
- Save (create or update)
- Delete (with confirm dialog, archives Shopify product)

**Issues:**
- The `bundle_id` auto-increments as "Bundle #N" but if bundles are deleted, the counter doesn't reset (minor UX issue)
- No validation feedback on required fields before submit

---

### Bundle Settings (`app.bundle_settings.jsx`)

**Currently working:** Loads settings from DB, all radio/checkbox controls update state, "Save settings" button persists to DB.

**Issues:**
- "Always apply" discount application option shows a warning banner ("only available on the Fixed-cost plan") — this is placeholder copy from a pricing tier that doesn't exist yet. The radio is disabled. Once billing is added, this should unlock on a paid plan.
- "Cart drawer (mini cart)" button action option is also disabled with "contact Support to activate" message.

---

## 6. Work Queue — Quick Fixes ✅ ALL COMPLETE

All QF items shipped. See "What's Complete" above for details.

### QF-1: Fix dead links and dead buttons ✅

**`app.additional.jsx`**

1. **"Read now" button (Home tab):** Add `url="https://help.shopify.com/en/manual/products/bundles"` to the Button. Or link to our own future docs page.

2. **Bundle type picker modal — 5 dead types:** Add `onClick` to each card that either:
   - Shows a Polaris `Toast` saying "Coming soon — we're building this next!"
   - OR routes to a dedicated "coming soon" placeholder page

   Recommended: Toast approach — no new routes needed.

3. **Customization → Design "Customize":** Change to:
   ```jsx
   <Button url={`https://${shop}/admin/themes/current/editor`} external>Customize</Button>
   ```
   Requires passing `shop` from the loader.

4. **Customization → Bundle priority buttons:** Same as above — Toast "Coming soon".

5. **Settings → Feature Request:** Link to a Google Form or Typeform for feature requests.

6. **Settings → Translation, Plan, Restore Pages, Featured Apps:** Route each to a simple placeholder page at `/app/coming_soon` with a "This feature is coming soon" message, OR use Toasts.

---

### QF-2: Fix placeholder icons

**Home tab stats cards:** Replace `<img src={welcome} width="40" />` with Polaris icons:
```jsx
import { ViewIcon, CursorIcon, BagIcon, CashDollarIcon } from "@shopify/polaris-icons";
// Use <Icon source={ViewIcon} /> etc.
```
Verify exact icon names against polaris-icons v8 — name may differ slightly.

**Settings tab avatar cards:** Replace `<Avatar shape="square" customer name="Farrah" />` with icons:
- Bundle settings → SettingsIcon
- Translation → LanguageIcon  
- Feature Request → QuestionCircleIcon
- Plan → CreditCardIcon
- Restore Pages → RefreshIcon
- Featured Apps → AppsIcon

---

### QF-3: Fix bundle table product images

In the `useEffect` that maps bundle data to `orders` state and `rowMarkup`:

```jsx
// Current:
<Avatar customer key={item.id} name={item.name} />

// Fix:
<Avatar 
  customer 
  key={item.id} 
  name={item.name} 
  source={item.image || undefined}
/>
```

Polaris Avatar renders the image when `source` is provided, falls back to initials when it's null/undefined.

---

### QF-4: Fix the welcome screen

Remove the fake 3-step wizard. Replace with a clean welcome card:
- App logo
- Brief value proposition ("Create product bundles with automatic discounts")
- Single CTA button: "Create your first bundle" → opens bundle type picker or goes directly to `/app/create_bundle_form/new`
- Maybe 3 benefit bullet points (no steps, just features)

---

### QF-5: Add "Coming soon" badges to unbuilt bundle types in the picker

In the bundle type modal, the five non-functional types should visually communicate they're not available yet:
- Add a Polaris `Badge` with `status="info"` and content "Coming soon" to each unbuilt card
- Make them non-clickable (remove `Link` wrapper, add `cursor: not-allowed` style) OR keep them clickable to a toast

---

## 7. Work Queue — Phase 2: Core Feature Parity

These are the features needed to be viable in the Shopify App Store. Priority order listed.

### P2-1: Volume Discount / Quantity Breaks ✅ COMPLETE

Fully built. Per-product tiered discounts with percentage or fixed-amount values. Discounts apply at checkout via `product_discounts` Shopify Function. Automatic discount registered once per shop. Storefront badge theme extension block ships with the app.

**Remaining open items:**
- [ ] Collection-scoped volume discounts (per-product only today)
- [ ] Analytics event tracking for volume discount orders (see P2-8)

---

### P2-2: Shopify Billing Integration ✅ COMPLETE

All core billing shipped. "Super Bundle Pro" at $9.99/mo, 14-day trial. Free plan gates bundle #2+ and all volume discounts. APP_SUBSCRIPTIONS_UPDATE webhook handles cancellations. Plan page at `/app/plan`.

**Remaining open items:**
- [ ] Test billing approval flow end-to-end on a non-development store
- [ ] "Always apply" discount option should unlock on Pro (currently disabled in settings)
- [ ] Consider expanding to 3-tier structure (Basic / Pro / Plus) based on market feedback

---

### P2-3: Buy X Get Y / BOGO ✅ COMPLETE

Fully built. Merchant selects buy product + quantity, get product + quantity, and percentage discount. Rules stored in `BuyXGetY` table, synced as `custom.bogo_rules` JSON metafield on each buy product. Shopify Function (`volume-discount-function`) reads the metafield at checkout and applies the discount. Gated on Pro plan.

**Remaining open items:**
- [ ] Analytics event tracking for BOGO orders (see P2-8)
- [ ] Gate BOGO creation from the Offers list with upgrade modal (currently only the form loader gates it)

---

### P2-4: Analytics Charts ✅ COMPLETE

Recharts v2 charts shipped in the Analytics tab: 30-day sales + orders time-series (area chart), top bundles by revenue (horizontal bar), engagement breakdown (grouped bar), per-bundle data table. Backed by `BundleEvent` table populated on every view, click, and order for Fixed Bundles.

**Remaining open item:**
- [x] ~~Extend event tracking to Volume Discounts and BOGO~~ — completed as P2-8

---

### P2-8: Analytics Event Tracking for Volume Discounts and BOGO ✅ COMPLETE

`BundleEvent` extended with nullable `offer_type` (`"bundle"` | `"volume_discount"` | `"bogo"`) and `offer_id` columns. ORDERS_CREATE webhook queries each line item's product metafields — products with `custom.volume_tiers` write a VolumeDiscount order event; products with `custom.bogo_rules` write a BOGO order event. Proxy action accepts `offer_type` + `offer_id` for view/click events from the storefront. Analytics tab now shows an "Orders by offer type" breakdown table.

**Remaining open item:**
- [ ] Volume discount badge liquid block needs a `fetch` POST to the proxy on render to record view events (requires theme extension re-deploy)

---

### P2-5: Working Filter/Search/Pagination in Offers Tab ✅ COMPLETE

Client-side search by name, Type dropdown filter (All / Fixed Bundle / Volume Discount / Buy X Get Y), Active/Draft tab filtering, 10-per-page pagination with real page count. Dead "Enable displays" and "Bundle as products" dropdowns removed.

---

### P2-6: Restore Pages Feature ✅ COMPLETE

`/app/restore_pages` route checks whether "Bundles" and "Bundle Builder" pages exist via Admin API GraphQL, shows status badges, and creates missing pages via `pageCreate` mutation. Settings card wired.

---

### P2-7: Translation Page ✅ COMPLETE

`/app/translation` route with three overridable labels: Add to cart button, Bundle discount label, Save badge text. Stored as JSON in `BundleSettings.translations` (VARCHAR 2000). Proxy GET endpoint exposes current translations so the theme extension can read them via `fetch`. Settings card wired.

---

## 8. Work Queue — Phase 3: Growth Features

These are features to build after achieving core parity. Not time-sensitive.

### P3-1: Mix & Match / Build a Box

Allow customers to choose N products from a set (e.g., "pick any 3 from this collection, get 20% off"). This is Bundler's paid feature ($9.99/mo) and one of the most searched bundle types.

**Technical complexity:** High. Requires a custom storefront UI (not just a widget), cart quantity tracking across products, and a more sophisticated Cart Transform Function that handles variable compositions.

### P3-2: Collection-Based Bundles

Define a bundle by collection rather than specific products. "Buy 2 items from Collection X + 1 from Collection Y, get 15% off."

### P3-3: Frequently Bought Together

Show complementary product recommendations on product pages. Amazon-style "customers also bought."

**Technical note:** Requires either manual merchant configuration (simpler) or AI/ML-based recommendation (complex). Start with manual.

### P3-4: Progress Bar Widget

Show customers how close they are to unlocking a bundle deal: "Add 1 more item to get 20% off!"

### P3-5: Checkout Upsell (Shopify Plus only)

Show bundle offer at checkout. Requires Shopify Plus plan and Checkout Extensions.

### P3-6: Advanced Targeting

- Customer tag/segment targeting (e.g., VIP customers get an extra 5% on bundles)
- Geolocation-based offers
- New vs. returning customer differentiation

This is SMART Discounts' key differentiator. Building it would make us competitive with them.

### P3-7: Storefront Widget Visual Customizer

A live preview editor (like Revy has) where merchants can change colors, fonts, border radius, button text, and see a real-time preview of the widget. Currently "Customize" opens the Shopify theme editor which is powerful but not bundle-specific.

### P3-8: Discount Stacking / Combination Rules

Sophisticated rules for when bundle discounts can stack with other discounts (coupon codes, automatic discounts). Currently a basic setting (combine yes/no). Phase 3: build rule-based combination logic.

---

## 9. Shopify App Store Strategy

### Positioning

**"The modern bundle app built on Shopify's native infrastructure."**

Unlike legacy apps that use line item scripts (deprecated) or draft order hacks, we use Shopify Functions — the same technology Shopify themselves uses for native discounts. This means:
- No cart flicker or delay
- Works with all themes (no JavaScript injection)
- Compatible with Shopify's future checkout changes
- Faster checkout performance

### Pricing Strategy

- **Free tier must be generous** — all competitors have a free tier. Our free tier should include: 1-3 bundles, fixed bundle type, basic analytics.
- **Volume pricing not revenue-based** — BOGOS charges per-order which creates anxiety for high-volume stores. Our pricing should be flat monthly, unlimited orders and revenue.
- **Map to Shopify plan tiers like Revy** — merchants understand "Basic plan = X, Advanced plan = Y."

### App Store Listing Requirements

To get the "Built for Shopify" badge (which all top competitors have):
- Pass Shopify's app review
- Meet performance requirements (Lighthouse score, load time)
- Correct use of Polaris design system
- No deprecated API usage
- Proper billing implementation
- All required webhooks (✅ already have GDPR compliance webhooks)

### Support Strategy

Reviews consistently cite support quality as the #1 differentiator. Every competitor's top reviews mention fast, helpful support. This needs to be a priority from day one of public launch.

---

## 10. Infrastructure & Ops

### Database (Railway MySQL)

- **Connection string (public):** `mysql://root:PASSWORD@thomas.proxy.rlwy.net:55511/railway`
- **Note:** `mysql.railway.internal` only works from Railway-hosted services. From local dev, use the public proxy URL.
- **Backups:** Configure Railway automatic backups before launch.

### Deployment

Currently: Development mode only (local Cloudflare tunnel).

**For production:**
1. Host the Remix app (Railway, Fly.io, Render, or Vercel — all work with Remix)
2. Set `SHOPIFY_APP_URL` to the production URL in environment variables
3. Update `shopify.app.toml` with production URL and redirect URLs
4. Run `npm run deploy` to push extensions
5. Submit for Shopify App Review

### Monitoring

Not currently set up. Before launch:
- Error tracking: Sentry
- Uptime monitoring: BetterUptime or Shopify's built-in app health dashboard
- Logging: structured logging to Railway logs or a service like Logtail

### Security Notes

- `.env` file is gitignored and must be recreated manually on new environments
- API keys in `.env` are for the `Bandana` app under `Klax Holdings LLC` partner account
- The Storefront Proxy route (`api.proxy.jsx`) uses HMAC verification — do not remove this
- `archiveProduct` uses the Shopify Admin API to archive rather than delete products (intentional — prevents breaking order history)
