# Al-Mizan Project360

Construction management system for **Al-Mizan Building Consortium** — connects Admin/Owner, Site Supervisors, and Clients around live project data: progress, labour, materials, purchases, expenses, approvals, and payments.

Built with Next.js 16 (App Router, Server Actions), TypeScript, Tailwind CSS v4, and Prisma + SQLite (swap to Postgres for production — see below).

## Getting started

```bash
npm install
npm run db:seed     # creates dev.db, runs migrations implicitly via prisma, then seeds demo data
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`.

If you ever want a completely clean slate:

```bash
npm run db:reset    # drops dev.db, re-applies migrations, re-runs the seed
```

## Demo accounts

All demo accounts use the password **`Almizan@123`**.

| Role | Email | Who |
|---|---|---|
| Admin / Owner | `admin@almizan.demo` | Ibrahim Al-Mizan |
| Site Supervisor | `supervisor@almizan.demo` | Abdul Rahman — assigned to Ayyampettai Residence & Coimbatore Tech Park Annex |
| Client | `client@almizan.demo` | Rajesh Kumar — client for Ayyampettai Residence |

Three more supervisors and four more clients exist in the seed data (see `prisma/seed.ts`) for a fuller multi-project demo, all on the same password.

## Suggested live demo script (end-to-end)

This walks through the flow the product spec calls out explicitly — a purchase and a daily report moving from the field to the office and back out to the client, live.

1. **Log in as Admin** → dashboard shows today's business summary, pending approvals, low stock, supplier outstanding.
2. Open **Ayyampettai Residence** (Projects → first card) → browse the tabs (Progress, Labour, Materials, Payments, Reports/BOQ + profitability).
3. **Log in as Supervisor** (`supervisor@almizan.demo`) in a second browser/incognito window.
4. From the Supervisor home, open **Ayyampettai Residence** → mark today's **Labour Attendance** (wages compute automatically) → log a **Material Usage** entry → raise a **Purchase Request** for cement → submit a **Daily Update** with a work description and photos.
5. Switch back to **Admin** → **Approval Centre** now shows the new purchase request and daily report pending review → approve both (add an optional comment).
6. Back in the project's **Purchases** tab, the request is now `APPROVED`; the project's overall progress reflects the approved daily report.
7. **Log in as Client** (`client@almizan.demo`) → home feed shows the new approved update with photos, progress %, and stage list.
8. As **Admin**, go to the project's **Payments** tab and record a client payment against a milestone → switch to the **Client** payments page to see it reflected, and check the Admin dashboard's "Pending Client Payments" figure update.

## Architecture notes

- **Auth**: signed HttpOnly JWT session cookie (`src/lib/auth.ts`, via `jose`), role-based route protection in `src/proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts`). Every Server Action independently re-checks `getSession()` and role/ownership — route guarding alone is not treated as the security boundary.
- **Data**: Prisma ORM against SQLite (`prisma/dev.db`) for a zero-setup local demo. To move to Postgres for production, change `datasource db { provider = "postgresql" }` in `prisma/schema.prisma`, point `DATABASE_URL` at a real Postgres instance, and re-run migrations — no application code changes needed.
- **Mutations**: Next.js Server Actions (`"use server"` files colocated with each route), not a separate REST API — forms POST directly to actions, which validate, check auth, write via Prisma, log to `AuditLog`, push a `Notification`, then `revalidatePath`.
- **Approvals**: a single generic `Approval` table (`type: DAILY_REPORT | PURCHASE | EXPENSE | ...`) feeds the Admin **Approval Centre** (`/admin/approvals`); approving/rejecting there updates both the `Approval` row and the underlying `Purchase`/`Expense`/`DailyReport` status in one transaction-like action, and notifies the original submitter.
- **File/photo storage**: no cloud storage backend is wired up for this demo — photos and documents are stored as URLs (seed data uses placeholder images from picsum.photos; supervisor uploads in the live app accept a URL). Swapping in real object storage (S3, etc.) only requires changing how those URL fields get populated.
- **Design system**: Tailwind v4 utility classes composed in `src/app/globals.css` (`.card`, `.btn-primary`, `.input`, `.badge`, etc.) plus shared components in `src/components/` (`StatusBadge`, `ProgressBar`, `StatTile`, `Sidebar`/`BottomNav` — sidebar on desktop, bottom nav on mobile per role).

## Known limitations (demo scope)

- SQLite instead of Postgres (see above for the one-line swap).
- No real file/photo upload pipeline — URL-based placeholders only.
- Some of the 12 report types in the Reports section are placeholders pending further build-out; the functional ones include real data and CSV export.
- In-app notifications only — no email/WhatsApp/push integration (the `Notification` model is structured so that could be added later without a schema change).
