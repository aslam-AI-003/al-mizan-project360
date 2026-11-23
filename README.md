# Al-Mizan Project360

Construction project tracking for **Al-Mizan Building Consortium**. Two roles:

- **Owner (Admin):** sees every project, ongoing vs completed, and how much of each budget is left day by day.
- **Site Supervisor:** records daily labour attendance, material purchases, material usage, site expenses and daily work updates for assigned projects.

Built with Next.js 16 (App Router, Server Actions), TypeScript, Tailwind CSS v4, and Prisma + PostgreSQL.

## Getting started

Requires Node.js 20.9+ and a PostgreSQL database.

```bash
npm install
# .env needs DATABASE_URL (Postgres) and AUTH_SECRET
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`.

Clean slate (drops all data, re-applies migrations, re-seeds):

```bash
npm run db:reset
```

## Demo accounts

All demo accounts use the password **`Almizan@123`**.

| Role | Email | Who |
|---|---|---|
| Owner (Admin) | `admin@almizan.demo` | Ibrahim Al-Mizan |
| Site Supervisor | `supervisor@almizan.demo` | Abdul Rahman — Ayyampettai Residence & Coimbatore Tech Park Annex |

Three more supervisors exist in `prisma/seed.ts`, on the same password.

## What each role sees

**Owner**
- **Dashboard:** project counts (total, ongoing, completed, delayed), today's spending across all sites (labour, material, other), and ongoing/completed project tables with budget, spent and remaining.
- **Project → tabs:** Overview, Progress (construction stages), Daily Updates, Labour, Materials (stock), Material Purchases, Expenses, **Budget Ledger**.
- **Budget Ledger:** one row per day with labour, material, other, day total and budget remaining after that day. CSV export.
- **Workers:** worker master and daily wages.

**Supervisor**
- Daily Update (work done, progress %, optional photo URL) — progress updates the project immediately.
- Labour Attendance — wage is calculated from each worker's daily rate.
- Material Purchase — material, quantity, rate, date, optional shop name; adds to site stock.
- Material Usage — reduces site stock.
- Expense — transport, food, tools, etc.

There is no approval step: supervisor entries count as soon as they are saved.

## How spending is calculated

All screens use `src/lib/project-costs.ts`, so the numbers always match:

- **Labour** = wages earned from daily attendance
- **Material** = material purchases (quantity × rate)
- **Other** = site expenses
- **Budget remaining** = project budget − (labour + material + other)

## Architecture notes

- **Auth:** signed HttpOnly JWT session cookie (`src/lib/auth.ts`, via `jose`), role-based route protection in `src/proxy.ts`. Every Server Action re-checks the session and, for supervisors, project assignment.
- **Mutations:** Next.js Server Actions colocated with each route; they validate, check auth, write via Prisma, then `revalidatePath`.
- **Photos/bills:** stored as URLs; no file upload backend is wired up yet.
