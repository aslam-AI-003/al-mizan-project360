# Al-Mizan Project360

Simple construction project tracking for **Al-Mizan Building Consortium**. One person, the **Owner**, records each day's spending and sees how much of every project's budget is left.

Built with Next.js 16 (App Router, Server Actions), TypeScript, Tailwind CSS v4, and Prisma + PostgreSQL.

## Getting started

Requires Node.js 20.9+ and a PostgreSQL database.

```bash
npm install
# .env needs DATABASE_URL (Postgres) and AUTH_SECRET
npx prisma migrate deploy
npm run dev
```

Open http://localhost:3000.

- **Empty database:** you are sent to **/setup** to create the Owner account. `/setup` switches itself off once an Owner exists.
- Optional: set `SETUP_CODE` in the environment to require a code on the setup page.
- **Demo data:** `npm run db:seed` loads sample projects (Owner login `admin@almizan.demo` / `Almizan@123`). Set `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=true` to show these on the login page. Don't use the demo data in production.

Clean slate (drops all data, re-applies migrations, re-seeds): `npm run db:reset`

## Screens

- **Home:** ongoing and completed projects with budget, spent, balance, budget used %, work progress %, and today's labour and material cost. The figures at the top show today's spending across all sites and the total pending to suppliers.
- **Daily Entry:** pick a project and a date, then fill in:
  - **Labour:** number of workers and total amount (no worker names)
  - **Materials Bought:** material, quantity, unit, rate and supplier. Adds to site stock and counts as that day's cost.
  - **Materials Used:** takes quantity out of site stock
  - **Other Expenses:** transport, food, tools, etc.
  - **Project progress %**

  Opening a date that already has an entry loads it for editing. New material and supplier names are saved automatically.
- **Project:**
  - **Overview:** edit details, status, budget and progress.
  - **Day-by-Day:** one row per day with labour, material, other, total and balance left, plus CSV export. Click a date to edit that day.
  - **Materials:** bought, used, in stock and cost for each material.
  - **Suppliers:** what this project bought from each supplier.
- **Suppliers:** bought, paid and pending for each supplier. Record payments here.
- **Profile:** change name, login email, phone and password.

## How the numbers are calculated

All screens use `src/lib/project-costs.ts`:

- **Labour** = daily labour entries
- **Material** = materials bought (quantity × rate), counted on the day bought, paid or not
- **Other** = other expenses
- **Balance** = budget − (labour + material + other)
- **Supplier pending** = total bought from the supplier − payments to them
- **Stock** = bought − used, for each project and material

## Supervisor role (switched off)

The `SUPERVISOR` role and project assignments are still in the database, so supervisor logins can be brought back later. For now only Owner accounts can sign in. The old worker and attendance tables are also kept: when migrating, attendance was turned into daily labour totals, so past figures don't change.

## Architecture notes

- **Auth:** signed HttpOnly JWT session cookie (`src/lib/auth.ts`, via `jose`). `src/proxy.ts` protects `/admin`, and every Server Action re-checks the Owner session (`src/lib/owner-guard.ts`).
- **Mutations:** Server Actions colocated with each route. The Daily Entry saves the whole day in one database transaction (`src/app/admin/entry/actions.ts`).
- **Dates:** entries are stored as the calendar day (UTC midnight). "Today" means today in India (Asia/Kolkata).
