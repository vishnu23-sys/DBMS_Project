# Campus Lost & Found

DBMS Level 3 project, PES University (Semester 5)

Pravith Mohandas (PES1UG24AM202) and Vishnu Patruni (PES1UG24AM187)

A lost-and-found website for our campus. Students post things they lost or found, the security and library staff check claims before giving anything back, and the site suggests which lost and found posts are probably the same item.

Built with Next.js, PostgreSQL and MongoDB.

## Why

Right now, lost items get posted in WhatsApp groups or reported at the security office. Posts get buried, the library and the main gate don't know what the other has, and staff have no easy way to check that the person asking for an ID card or a pair of earphones is really the owner.

## How it works

Someone who loses something files a lost report. Someone who finds something files a found report and hands the item in at one of the collection points (security office, library help desk or admin reception). A staff member approves each new report before it shows up publicly.

When a report is approved, the database compares it with the open reports of the opposite type in the same category and a sensible date range. It scores each pair using how similar the wording is and how similar the meaning is (using a small sentence-embedding model). Good matches are saved, and the owner of the lost item gets a notification.

The finder can add a question that only the real owner would know, like "what initials are engraved on the case?". When someone claims the item, a trigger compares their answer with the finder's answer and stores a score, so the staff member reviewing the claim can see it next to the claimant's past rejected claims. Approving a claim rejects any other claims on the same item. Once the owner collects the item, staff record the handover and the finder gets reputation points.

There are three roles: student, staff and admin. Admins can also manage users and see the audit log.

## Databases

**PostgreSQL** holds everything that needs to stay consistent: users, departments, categories, locations, items, images, verification questions, claims, matches, handovers and an audit log (11 tables). Most of the rules are enforced in the database itself through constraints, triggers and stored procedures, so bad data is rejected even if it doesn't come through the app. The SQL is in [`sql/`](sql/).

**MongoDB** holds activity logs, search logs and notifications. These are written often, their fields change from one event to the next, and they never need joins, so a document store fits them better than extra tables. The reports page uses aggregation pipelines on them, for example to show what people search for that nobody has handed in.

The embeddings for matching are 384-number vectors stored in a `REAL[]` column in Postgres, compared with a cosine similarity function written in SQL. The model (all-MiniLM-L6-v2) runs locally through transformers.js, so there's no API key.

The full write-up (ER diagram, schema, data dictionary, queries and test results) is in [`docs/PROJECT_REPORT.md`](docs/PROJECT_REPORT.md). The ER diagram is also in [`docs/ER_Diagram.svg`](docs/ER_Diagram.svg).

## Running it locally

You need Node.js 20 or newer and PostgreSQL 14 or newer. You don't have to install MongoDB; `npm run mongo:dev` downloads and runs one for you.

Install packages:

```bash
npm install
```

Create a database user and database. Run this once in `psql` as the `postgres` user, with your own password:

```sql
CREATE ROLE lostfound LOGIN PASSWORD 'pick-a-password';
CREATE DATABASE lostfound OWNER lostfound;
```

Copy `.env.example` to `.env.local` and fill in `DATABASE_URL` and `JWT_SECRET`.

Start MongoDB in a separate terminal and leave it running:

```bash
npm run mongo:dev
```

Create the tables, load the sample data and compute the embeddings. The first run takes about a minute because it downloads the model (around 23 MB):

```bash
npm run db:setup
```

Start the app and open http://localhost:3000:

```bash
npm run dev
```

## Sample accounts

Every sample account uses the password `Demo@1234`.

- `admin@campus.edu` is the admin
- `security@campus.edu` and `library@campus.edu` are staff
- `vishnu@campus.edu`, `pravith@campus.edu`, `ananya@campus.edu` and the rest are students

A quick walkthrough:

1. Sign in as `vishnu@campus.edu`. Under My reports there's a suggested match for the grey backpack.
2. Search for "earphones" under Browse. It finds the AirPods case even though the word "earphones" isn't in it.
3. Sign in as `security@campus.edu` and open Desk. There are two claims on the AirPods case: Ananya's answer matches 100%, and Rahul's matches 0% (he also has three rejected claims). Approve Ananya's, then record the handover.
4. Open Reports for the charts and the SQL behind each one.
5. Sign in as `admin@campus.edu` and open Audit log to see the changes you just made.

[`sql/06_demo_queries.sql`](sql/06_demo_queries.sql) has queries to run in `psql` during the demo: joins, subqueries, views, full-text search, statements the triggers reject on purpose, and a transaction that gets rolled back.

## Folders

```
app/          pages, plus the API routes under app/api
components/   React components
lib/          database access, auth, validation, matching, MongoDB code
sql/          schema, functions and triggers, views, sample data, reports, demo queries
scripts/      database setup and the local MongoDB runner
docs/         project report and ER diagram
```

## Scripts

- `npm run db:setup` rebuilds Postgres from `sql/`, computes embeddings and reloads MongoDB. Add `--no-mongo` or `--no-ai` to skip those parts.
- `npm run embed` computes embeddings for items that don't have one yet.
- `npm run mongo:dev` runs MongoDB on port 27017 and keeps its data in `~/.campus-lost-found/mongo`.
- `npm run build` makes a production build.

## Who did what

Pravith wrote the problem statement and the first design. Vishnu built the database (schema, procedures, triggers, reports), the MongoDB part and the web app. We'll keep this section updated as we go.
