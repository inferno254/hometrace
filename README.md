# HomeTrace

Kenya-focused housing explorer: customers see **broad geography + pricing + visuals** while **pins, estates, addresses, and owner phones stay admin-side**. Operational staff manage the **truth map** privately.

Detailed product spec lives in **`todo.md`** (living document).

## Quick start

```bash
cd "Telegram Desktop/hometrace"
cp .env.example .env          # PowerShell: copy .env.example .env
# Fill VITE_* keys (see Environment)
npm install
npm run dev
```

## Environment

| Key | Purpose |
|-----|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (frontend safe) |
| `VITE_GEMINI_API_KEY` | Optional: AI listing blurbs |
| `VITE_HOMETRACE_PUBLIC_PHONE` | Customer-facing bureau line shown on listings |
| `VITE_HOMETRACE_WHATSAPP_URL` | Optional WhatsApp deeplink |

## Supabase checklist

1. **Create project** (EU/US closest to your users).
2. Run **`supabase/schema.sql`** inside the SQL editor (full script).
3. **Storage bucket** named exactly `property-images` — toggle **Public** read for marketing photos.
4. Add storage policies (bottom of schema file includes commented snippets) so **admin only** uploads, **anon** reads.
5. **Auth**: enable Email signups (or invites only in prod).
6. Create your operator account → confirm email → run:

```sql
update profiles
set role = 'admin'
where id = '<your-auth-user-id>';
```

7. Sanity test:
   - `fetch_public_properties` RPC should return rows **only when** `is_published=true` and `is_available=true`.

## Routes

| Path | Audience |
|------|----------|
| `/`, `/browse`, `/listing/:id` | Public / customers |
| `/admin/login` | Operators |
| `/admin`, `/admin/map`, `/admin/new` | Admin console + map ingest |

## Initialize git & GitHub

```bash
git init
git add .
git commit -m "chore: bootstrap HomeTrace"
gh repo create hometrace --private --source=. --push    # GitHub CLI, optional
```

## Build

```bash
npm run build     # emits dist/ for Vercel/Netlify
```

## Licensing

Template code for HomeTrace MVP — adapt for your tenancy & compliance regime.
