# Learning spine + coach demo (V1)

Plain English: **Next.js** reads from **Supabase** and shows a **staff dashboard** with a **“coach in your pocket”** block: topic snapshot + **what to do today** (rules only, no AI). The same coach UI appears on a thin **student demo** page. No login — only a **secret key** in the URL.

## What you do once (setup)

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier is fine).

2. **Run the SQL** in the Supabase **SQL Editor**:
   - **New project:** run `supabase/schema.sql`, then `supabase/seed.sql`.
   - **Already had old seed data:** run `supabase/reset_demo.sql`, then `supabase/seed.sql`.

3. **Copy API keys**: Supabase → **Project Settings** → **API**
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role** key (secret) → `SUPABASE_SERVICE_ROLE_KEY`

4. **Create `.env.local`** (copy from `.env.local.example`):
   - Fill in the two Supabase values
   - Set `DASHBOARD_SECRET` to a phrase you will use in the URL

5. **Install and run**

```bash
npm install
npm run dev
```

6. **Open in the browser** (replace `YOUR_SECRET` with `DASHBOARD_SECRET`)

| Page | URL |
|------|-----|
| Home | [http://localhost:3000](http://localhost:3000) |
| Staff dashboard | `http://localhost:3000/dashboard?key=YOUR_SECRET` |
| Walkthrough tabs | add `&student=aspen`, `&student=emery`, or `&student=jordan` |
| Student coach (demo) | `http://localhost:3000/student?key=YOUR_SECRET&student=emery` |

## Demo data story

- **Course:** Year 10 Maths Term 1  
- **Topics (modules):** Algebra, Trigonometry, Geometry  
- **Aspen Cruz** — strong scores, recent activity → next-step / habit actions  
- **Emery Walsh** — weak Trigonometry, revision lesson opened → strengthen topic + finish lesson  
- **Jordan Park** — quiet 7+ days, Geometry opened → re-engagement + resume  

## Files worth knowing about

| File | Plain English |
|------|----------------|
| `supabase/schema.sql` | Tables: students, courses, modules, lessons, quizzes, progress, events |
| `supabase/seed.sql` | Demo course + three personas + events |
| `supabase/reset_demo.sql` | Empty tables so you can re-seed safely |
| `lib/coach.ts` | Coach rules: topic lines + today actions (priority merge) |
| `lib/recommendations.ts` | Older “all student” rule list (still used in `<details>`) |
| `lib/dashboard-data.ts` | One place that loads Supabase rows for dashboards |
| `components/StudentCoaching.tsx` | Shared student coaching block (same on `/student` and `/dashboard`) |
| `app/dashboard/page.tsx` | Staff walkthrough + tables |
| `app/student/page.tsx` | Student-facing demo, same coach component |

## Quick demo checks (manual)

- Wrong or missing `?key=` → **Not available**  
- Correct key → dashboard loads  
- Switch **Aspen / Emery / Jordan** → coach copy changes  
- Edit a row in Supabase → refresh → expectations update  
- Empty tables → friendly message, no white-screen crash  

## Security note (demo only)

The **service_role** key bypasses database security rules. Keep it in `.env.local` only — never commit it or paste it into the browser.
