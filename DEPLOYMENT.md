# Deploy to GitHub and Vercel

Your project already has a local Git history. Finish hosting with the steps below.

## 1. Create an empty repository on GitHub

1. Open [github.com/new](https://github.com/new).
2. **Repository name:** e.g. `student-learning-demo` (any name you like).
3. Choose **Public** (needed for free Vercel Git integration, unless you use a paid Vercel team with private repos).
4. **Do not** add a README, `.gitignore`, or license (this repo already has files).
5. Click **Create repository**.

## 2. Push this folder to GitHub

In **Terminal** (or Cursor’s terminal), go to your project folder and run (replace `YOUR_USER` and `YOUR_REPO`):

```bash
cd "/Users/fionalim/Desktop/Projects/Student Learning System"
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

- If GitHub asks you to log in, use a **Personal Access Token** as the password (GitHub → Settings → Developer settings → Personal access tokens), or use **SSH** instead:

```bash
git remote add origin git@github.com:YOUR_USER/YOUR_REPO.git
git push -u origin main
```

**Stuck on “authentication failed”?**

- Use HTTPS + a **fine-grained** or **classic** token with `repo` scope.
- Or install [GitHub Desktop](https://desktop.github.com/) and use **File → Add Local Repository** then **Publish repository**.

**Stuck on “remote origin already exists”?**

```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

## 3. Connect Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. **Add New…** → **Project** → **Import** the repository you pushed.
3. **Framework Preset:** Next.js (auto). Leave build/install commands default.
4. **Environment variables** — add these (same as your local `.env.local`):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API → `service_role` (secret) |
| `DASHBOARD_SECRET` | Same long random string you use locally for `?key=` |

Add them for **Production** and **Preview** so preview deployments work.

5. Click **Deploy**.

## 4. Test the live site

After deploy, Vercel shows a URL like `https://your-project.vercel.app`.

- Home: `https://YOUR_VERCEL_URL/`
- Student demo: `https://YOUR_VERCEL_URL/student?key=YOUR_DASHBOARD_SECRET&student=aspen`

**Build failed on Vercel?**

- Open the failed deployment → **Building** log and read the error.
- Often: missing env var → add in **Project → Settings → Environment Variables** → **Redeploy**.

**Page loads but “Not available” or Supabase errors?**

- Env vars in Vercel must match Supabase (no extra spaces; full URL including `https://`).
- Redeploy after changing env vars.

## Security (demo prototype)

- `DASHBOARD_SECRET` in the URL means anyone with the link can open the demo. Use a long random secret.
- Never commit `.env.local` or put `SUPABASE_SERVICE_ROLE_KEY` in `NEXT_PUBLIC_*` variables.
