# Campus Lost & Found

A campus lost-and-found desk that **matches lost reports to found items automatically**, using wording and AI meaning. Claims are verified with secret ownership questions, and every handover is tracked.

**PES University, DBMS Experiential Learning Level 3 Project**
Pravith Mohandas (PES1UG24AM202), Vishnu Patruni (PES1UG24AM187)

| Layer | Technology |
|---|---|
| Web app | Next.js 16 (App Router, Route Handlers), React 19, Tailwind CSS 4 |
| SQL database | PostgreSQL 18 (11 tables, triggers, procedures, views, full-text + trigram search) |
| NoSQL database | MongoDB 8 (activity logs, search logs, notifications, aggregation pipelines) |
| AI | `all-MiniLM-L6-v2` sentence embeddings run locally (no API key), cosine similarity in SQL |
| Auth | bcrypt password hashes, JWT session cookie, 3 roles: student, staff, admin |

Full documentation, including the ER diagram, relational schema, data dictionary, NoSQL model, architecture and test results, is in **[docs/PROJECT_REPORT.md](docs/PROJECT_REPORT.md)**. The ER diagram is also saved as an image: [docs/ER_Diagram.svg](docs/ER_Diagram.svg).

---

## What makes it different

1. **Automatic matching.** When a report is approved, `fn_find_matches` scores it against every open report of the opposite type in the same category and date window. It blends trigram similarity, a full-text rank and the cosine similarity of AI embeddings. The owner is notified with a match percentage. "AirPods Pro case" matches "White Apple earbuds case" even though the two share almost no words.
2. **Verified claims.** The finder sets a secret question ("What initials are engraved on the case?"). A trigger scores each claimant's answer against it, and staff see that score next to the claimant's history of rejected claims.
3. **Accountable workflow.** Approving a claim is one stored procedure in one transaction: approve, reject competing claims, update both items, confirm the match. Database triggers write an audit log of who changed what.
4. **Search by meaning.** Students can search the way they talk. Searches that return nothing are logged in MongoDB and reported as unmet demand.
5. **Reputation.** Finders earn points when an item they handed in gets back to its owner.

## Lab checklist (26 Oct)

| Requirement | Where |
|---|---|
| At least 5 tables in the ER diagram | **11 tables**: departments, users, categories, locations, items, item_images, verification_questions, claims, matches, handovers, audit_log ([ER diagram](docs/ER_Diagram.svg)) |
| RDBMS + NoSQL | PostgreSQL ([sql/](sql/)) + MongoDB ([lib/mongo.js](lib/mongo.js), [scripts/mongo-seed.mjs](scripts/mongo-seed.mjs)) |
| Reports in the demo | **Reports** page: 9 SQL reports with charts and CSV export, plus 4 MongoDB aggregation reports. Queries in [sql/05_reports.sql](sql/05_reports.sql) |
| Novelty | AI + text hybrid matching, ownership verification scoring, audit trail, reputation |

## Setup (Windows)

Requirements: Node.js 20+, PostgreSQL 14+ (with `pg_trgm`, included by default). MongoDB is optional to install: `npm run mongo:dev` downloads and runs a local MongoDB for you.

**1. Install dependencies**

```bash
npm install
```

**2. Create the database user and database** (one time, as the `postgres` superuser). Pick your own password:

```sql
CREATE ROLE lostfound LOGIN PASSWORD 'choose-a-password';
CREATE DATABASE lostfound OWNER lostfound;
```

**3. Configure environment.** Copy `.env.example` to `.env.local` and fill in `DATABASE_URL` and `JWT_SECRET`.

**4. Start MongoDB** in its own terminal and leave it running:

```bash
npm run mongo:dev
```

**5. Create tables, load sample data and compute embeddings.** This takes about a minute the first time, while the AI model downloads (~23 MB):

```bash
npm run db:setup
```

**6. Run the app** and open http://localhost:3000:

```bash
npm run dev
```

### Demo accounts

All seeded accounts use the password **`Demo@1234`**.

| Email | Role |
|---|---|
| admin@campus.edu | admin (everything, plus users and audit log) |
| security@campus.edu | staff (desk: moderation, claims, handovers, reports) |
| vishnu@campus.edu, pravith@campus.edu, ananya@campus.edu | students |

### Demo script

1. Sign in as **vishnu@campus.edu**. *My reports* shows a suggested match for the grey backpack.
2. Search **"earphones"** on Browse: semantic search finds the AirPods case.
3. Sign in as **security@campus.edu** and open **Desk**. Compare the answer-match scores on the two AirPods claims (Ananya 100%, Rahul 0% with 3 earlier rejected claims). Approve Ananya's claim, then record the handover.
4. Open **Reports** to see the charts, the SQL behind each one, and the MongoDB search reports.
5. Sign in as **admin@campus.edu** and open **Audit log** to see every change you just made, written by triggers.
6. In `psql`, run the statements in [sql/06_demo_queries.sql](sql/06_demo_queries.sql): joins, subqueries, views, full-text search, triggers rejecting bad data, and a transaction with ROLLBACK.

## Project structure

```
app/                 Next.js pages and API route handlers (app/api/*)
components/          UI components (item tag, forms, charts)
lib/
  db.js              PostgreSQL pool + transaction helper
  mongo.js           MongoDB logging, notifications, aggregation pipelines
  auth.js            JWT sessions and role checks
  validators.js      zod input validation
  data.js            read queries used by pages
  matching.js        embedding + match refresh + notifications
  embeddings.js      local sentence-embedding model
  reports.js         loads report SQL from sql/05_reports.sql
sql/
  01_schema.sql      DDL: tables, constraints, indexes, ALTER
  02_functions.sql   functions, stored procedures, triggers
  03_views.sql       views + materialised view
  04_seed.sql        sample data (runs the procedures)
  05_reports.sql     report queries used by the app
  06_demo_queries.sql  statements to run live in psql
scripts/             db-setup, mongo-dev, mongo-seed, embed-items
docs/                project report, ER diagram
```

## Useful commands

| Command | What it does |
|---|---|
| `npm run db:setup` | Rebuild PostgreSQL from `sql/`, compute embeddings, reseed MongoDB (`--no-mongo`, `--no-ai` to skip) |
| `npm run embed` | Compute embeddings for items that have none and refresh matches |
| `npm run mongo:dev` | Local MongoDB on port 27017 (data in `~/.campus-lost-found/mongo`) |
| `npm run build` | Production build |

## Team contributions

| Member | Work |
|---|---|
| Pravith Mohandas | Problem statement, initial design and README |
| Vishnu Patruni | Database schema, procedures, triggers, reports, MongoDB layer, Next.js app |

Update this table as you both work on the project. The commit history should show each member's commits.
