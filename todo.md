# HomeTrace — Master build prompt & living specification

> **Product name:** HomeTrace (internal codename ancestry: Nyumba‑KE roadmap from `prompt house.txt`, rebranded per product direction.)  
> **Primary goal:** A Kenya‑oriented housing discovery platform where **customers see enough to shortlist**, but **precise placements and direct owner contact stay behind your operations**. **Admins** run the realistic map layer and ingest listings end‑to‑end.  
> **Repository root (this machine):** `Downloads/Telegram Desktop/hometrace`  
> **Audience for this doc:** Humans + AI coding agents continuing the build. Update this file when scope changes.

---

## 1. Vision & non‑negotiables

### 1.1 One‑sentence pitch
HomeTrace helps renters and buyers **browse real, available homes** with **transparent price signals** and **honest area context**, while **protecting exact addresses and map pins from the public web** so your team remains the routing layer for serious leads.

### 1.2 Business rules derived from stakeholder input

| Actor | Allowed to see | Not allowed to see (public UX) |
|-------|-----------------|--------------------------------|
| **Customer / anonymous visitor** | Availability, headline, curated photos, specs (bed/bath/type), amenity tags, price + cadence (`/mo`, `/sale`), **broad geography** (`county`, `town`, optional fuzzy `area_label` like "Northern Kiambu" **without street/estate/pin**), furnished status, size (m²), area price insights | Exact `latitude/longitude`, `estate`, `address`, landlord/agent **phone**, internal notes, draft listings |
| **Admin (authenticated, role=admin)** | Full property row, coordinates, map markers, contact phone(s), internal fields, upload paths, AI drafts, inquiry/lead submissions | N/A (subject to future super‑admin splits) |

**Contact model (default):** Public detail pages show a **"Call HomeTrace"** call‑to‑action with your **business number** and/or **WhatsApp business link** (configured in app env), not the owner's private line. Admin records `owner_phone` for internal follow‑up.

### 1.3 "Realistic map" interpretation
- **Customer experience:** No street‑level pin map for individual listings. Optional future: **choropleth / region cards** only.  
- **Admin experience:** **Leaflet + OSM** (or similar) with **true coordinates**, satellite toggle later, marker clustering at scale.

---

## 2. Tech stack decisions

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Web SPA | **React 18 + TypeScript + Vite** | Faster dev loop than CRA; aligns with modern deploy targets |
| Styling | **Tailwind CSS** | Rapid iteration; easy theming for "cool" marketing surfaces |
| Data | **Supabase** (Postgres + Auth + Storage + RLS) | Free tier friendly; RLS for column‑level privacy patterns |
| Serverless AI | **Gemini** via `fetch` (optional) | Listing copy assist; never blocks core CRUD |
| Client data | **TanStack Query** | Cache + optimistic patterns for admin |
| Routing | **React Router v6** | Split `/` public vs `/admin/*` |
| Maps | **react‑leaflet + leaflet** | Admin map; keep dynamic import if SSR ever added |
| State | **localStorage** (favorites, compare) | No auth required for save/compare features |

**Explicit non‑goals for v1:** Flutter app (spec preserved below as Phase 2), native push, payments, KYC, automated voice IVR.

---

## 3. Data model (Supabase / Postgres)

### 3.1 Extensions
- `postgis` optional for radius queries later; v1 can use `numeric` lat/lng.

### 3.2 Tables

**`profiles`** (1:1 with `auth.users`)
- `id uuid PK references auth.users`
- `full_name text`
- `role text check in ('customer','admin') default 'customer'`
- `created_at timestamptz default now()`
- *Bootstrap first admin via SQL or Supabase dashboard insert after first signup.*

**`properties`**
- `id uuid PK default gen_random_uuid()`
- `title text not null`
- `slug text unique` (optional, for pretty URLs)
- `description text`
- `ai_generated_description text`
- `price numeric not null`
- `price_type text default 'monthly'` — enum‑like: `monthly | sale | negotiable`
- `bedrooms int`, `bathrooms int`
- `property_type text` — `apartment | bedsitter | bungalow | maisonette | studio | townhouse | land | commercial`
- `furnished boolean default false`
- `size_sqm numeric`
- **Public geography (broad):** `county text`, `town text`, `area_label text` *(marketing zone, still not street level)*
- **Hidden from public:** `estate text`, `address text`, `latitude numeric`, `longitude numeric`
- **Contacts:** `owner_phone text` *(admin only)*, `listing_reference text` *(public ref code like HT‑2026‑00017)*
- `is_available boolean default true`
- `is_published boolean default false` *(admin marks ready for public)*
- `cover_image_url text` *(denormalized cache optional)*
- `created_at`, `updated_at`

**`property_images`**
- `id`, `property_id FK`, `image_url`, `is_cover`, `sort_order int default 0`, `created_at`

**`amenities`**
- `id`, `property_id FK`, `name text`

**`property_inquiries`**
- `id uuid PK default gen_random_uuid()`
- `property_id uuid FK references properties (id) on delete cascade`
- `name text not null`
- `phone text not null`
- `message text`
- `created_at timestamptz not null default now()`

### 3.3 Storage bucket
- `property-images` — **public read** OK (images are marketing); **write** restricted to admin policies.

### 3.4 RLS strategy (summary)
- Enable RLS on all tables.
- **`properties`**
  - `SELECT` **anon + authenticated**: rows where `is_published = true AND is_available = true` **returning only safe columns** → implement via `fetch_public_properties()` function.
  - `INSERT/UPDATE/DELETE`: **admin only** (`profiles.role = 'admin'`).
- **`property_images` / `amenities`**: public `SELECT` only for images tied to published properties; writes admin only.
- **`profiles`**: users manage own row; `role` changes only by service role / SQL.
- **`property_inquiries`**: admin only (insert via `submit_inquiry()` RPC from public).

**Public function `fetch_public_properties` columns:**  
`id, title, description, ai_generated_description, price, price_type, bedrooms, bathrooms, property_type, county, town, area_label, listing_reference, cover_image_url, image_urls, amenity_names, furnished, size_sqm, created_at`  
*No lat/lng/estate/address/owner_phone.*

Admin app uses direct table for full CRUD.

### 3.5 Indexes
- `(is_published, is_available, county, town)`
- `listing_reference` unique

---

## 4. Application routes & UX

### 4.1 Public site (`/`)
- **Landing:** bold hero, value props ("See what's available — we'll place you"), quick links to Saved/Compare/Budget, featured listings with area insights.
- **Browse:** responsive card grid, **advanced filters** (price range, furnished, county, type, keyword search), **sort** (price low/high, newest/oldest), pagination, **area insights panel**. Save ♡ and compare ✓ buttons on every card.
- **Saved (`/saved`):** localStorage-backed favorites list with empty state and clear all.
- **Compare (`/compare`):** side-by-side comparison table (2-4 listings). Sticky bottom bar on browse page to manage compare selection.
- **Listing detail:** photo carousel, specs, amenities, furnished/size indicators, **broad location line only**, **no map embed**. Save, Share (WhatsApp + link copy), Budget Calculator, **Inquiry form** (name + phone → `property_inquiries` table), Area insights sidebar.
- **Budget Calculator:** modal based on income → safe rent (30% rule), max rent (50% rule), deposit estimate, monthly total.

### 4.2 Admin (`/admin/*`)
- **Login** (Supabase email + password).
- **Dashboard:** stats cards (total pipeline, live blurbs, map pins, avg listing quality %, inquiry count), searchable table with **inline publish/draft toggle**, **listing quality bar** (completeness %), edit/delete actions.
- **Map:** Leaflet full screen split with list; markers from `properties` where coords present.
- **Add / Edit property:** form with furnished checkbox, size (m²) field, geocode helper, image multi‑upload to storage, amenity chips, AI description button (Gemini), publish/available toggles.

### 4.3 Design direction ("cool & open‑minded")
- **Aesthetic:** dark graphite base (`#0B0D10`), **trace line** accent gradient (`#22D3EE → #A78BFA`), glassy cards, generous radius `rounded-2xl`, micro‑border `white/10`.
- **Typography:** `Outfit` (headings) + `DM Sans` (body) via Google Fonts.
- **Motion:** subtle Framer‑less CSS transitions (150–250ms) on hover.
- **Brand motif:** faint map grid background on hero; "signal" pulse on primary CTA.

---

## 5. AI (Gemini) guardrails

- Prompt includes **no PII** beyond high‑level location names present in public fields.
- If API key missing, UI hides AI button and uses template fallback.
- Rate‑limit client calls; ideally move to Edge Function with server key later.

---

## 6. Environment variables (`.env`)

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_API_KEY=            # optional
VITE_HOMETRACE_PUBLIC_PHONE=    # e.g. +2547xxxxxxxx
VITE_HOMETRACE_WHATSAPP_URL=    # optional wa.me link
```

---

## 7. Security checklist

- [x] No service role key in frontend.
- [x] Admin routes gated by auth + `role === 'admin'` (client) **and** enforced by RLS (server).
- [x] Storage policies: only admin can upload.
- [x] Validate image MIME types & size limits client‑side; add server policy when possible.
- [ ] SQL migrations reviewed before prod.

---

## 8. Delivery phases (execution order)

### Phase A — Foundation
- [x] Scaffold Vite app + Tailwind + router + query client
- [x] Supabase schema + RLS + public functions + RPCs
- [x] Public pages: Home, Browse, Detail with save/compare/share/inquiry
- [x] Admin: login, dashboard (stats + quality + quick toggle + search), map, CRUD form (with furnished/size)
- [x] Favorites (localStorage) + Saved page
- [x] Compare (localStorage, 2-4 listings) + Compare page + sticky bar
- [x] Budget calculator (modal)
- [x] Area insights (county/town price stats)
- [x] Share via WhatsApp + copy link
- [x] Inquiry form → `property_inquiries` table
- [x] Advanced filtering (price range, furnished, sort, county, type, keyword)
- [x] Loading skeletons, toast notifications, fade-in animations, mobile nav
- [x] Nairobi-specific seed data (30+ estates with coordinates, security ratings, transport, nearby amenities)
- [x] Fixed SQL column-order bug in `fetch_public_properties()` function
- [x] Admin inquiries page with lead management, call action, expand/collapse

### Phase B — Hardening
- [x] SEO meta + OG images (dynamic per-page via `usePageMeta` hook)
- [x] Area insights with real Nairobi context (security, transport, schools, hospitals, shopping from `nairobi_areas` seed data)
- [x] Admin inquiry/lead management dashboard (`/admin/inquiries`)
- [x] Admin dashboard now shows inquiry count + link
- [x] Admin property form uses county/town dropdowns with full Kenya coverage
- [ ] Edge Function for AI + rate limits
- [ ] Customer auth + saved favourites (server-side)
- [ ] Analytics (Plausible/PostHog)

### Phase C — Mobile
- [ ] Flutter client (reuse schema) OR Capacitor wrapper

### Phase D — Deploy
- [ ] Vercel/Netlify static build
- [ ] Supabase prod project + migration apply
- [ ] Custom domain + TLS

---

## 9. Open questions (ask when unblocking)

1. **Business phone + WhatsApp** you want printed on every listing?
2. **Photos:** any listings that must be **private** until call? (would change `is_published` workflow)
3. **Exact definition of `area_label`:** marketing copy only vs tied to ward?
4. **Multi‑agency:** will multiple admins need separate orgs? (impacts schema tenancy)

---

## 10. Agent instructions (for future sessions)

1. Read `README.md` and `supabase/schema.sql` before editing.  
2. Never expose `latitude`, `longitude`, `estate`, `address`, or `owner_phone` in public components or the `properties_public` view.  
3. Prefer small PR‑sized commits with clear messages.  
4. When changing RLS, include **policy tests** (SQL) in comments.  
5. After structural edits, update this `todo.md` §8 checkboxes.

---

## 11. Original roadmap appendix (from source prompt — reference only)

The source document included CRA setup, raw SQL, MapView sample, Gemini sample, AddProperty sample, Flutter map sample, and Vercel deploy. This repository **intentionally modernizes** the web stack to Vite+TS and **narrows v1 scope** to the privacy model in §1.2. Flutter remains Phase C.

---

**End of `todo.md` v1 — maintain as living document.**
