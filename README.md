# Campus Lost & Found

### Smart Campus-Based Lost and Found Management System

**DBMS Level 3 Project | PES University | Semester 5**

**Team Members:** Pravith Mohandas (PES1UG24AM202) and Vishnu Patruni (PES1UG24AM187)

A centralized campus platform that helps students report lost and found belongings, enables staff to verify ownership, and uses AI-powered semantic matching to identify potentially related items.

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Database Design](#database-design)
- [AI-Based Matching](#ai-based-matching)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Demo Login Credentials](#demo-login-credentials)
- [Demo Walkthrough](#demo-walkthrough)
- [DBMS Concepts](#dbms-concepts)
- [Documentation](#documentation)
- [Team Contributions](#team-contributions)

---

## Overview

Campus Lost & Found is a web application designed to simplify the process of reporting, locating and recovering lost belongings within a university campus.

Students can submit lost and found reports, search listings, receive potential matches and submit ownership claims. Security and library staff verify reports, review claims and manage item handovers. Administrators manage users and monitor system activity.

The application uses PostgreSQL for structured data, MongoDB for activity records and an AI-based matching mechanism.

## Problem Statement

Traditional campus lost-and-found systems rely on WhatsApp groups and physical reports at security offices. This makes it difficult to track items, coordinate between collection points and verify ownership.

Our solution provides a centralized platform with automated item matching, ownership verification and structured handover management.

## Key Features

### Student Portal

- Report lost and found items.
- Upload item descriptions and images.
- Search and browse listings.
- View potential AI-generated matches.
- Submit ownership claims.
- Track notifications and claim status.

### Staff Portal

- Review and approve reports.
- Verify ownership claims.
- View verification scores and claim history.
- Approve or reject claims.
- Record item handovers.

### Admin Portal

- Manage student and staff accounts.
- Monitor platform activity.
- Access audit logs.
- View reports and analytics.

### Intelligent Matching

- Text and semantic similarity.
- Sentence embedding generation.
- Category and date-based filtering.
- Automatic match generation and notifications.

## How It Works

1. **Report an item:** Students submit lost or found reports with descriptions, categories and relevant details.
2. **Staff approval:** Authorized staff review reports before they become publicly visible.
3. **AI matching:** The system compares approved reports using category, date, textual and semantic similarity.
4. **Notifications:** Potential matches are stored and relevant students are notified.
5. **Ownership claims:** Students submit claims and answer item-specific verification questions.
6. **Claim verification:** The system calculates answer similarity scores for staff review.
7. **Claim approval:** Staff approve legitimate claims and competing claims are rejected.
8. **Item handover:** Staff record collection, and the finder receives reputation points.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js, React.js |
| Backend | Next.js API Routes |
| Relational Database | PostgreSQL |
| NoSQL Database | MongoDB |
| AI / NLP | Transformers.js |
| Embedding Model | all-MiniLM-L6-v2 |
| Similarity Algorithm | Cosine Similarity |
| Authentication | JWT |
| Programming Language | JavaScript |
| Version Control | Git and GitHub |

## System Architecture

The application uses a hybrid database architecture.

### PostgreSQL

Stores structured data requiring relational integrity and transactional consistency:

- Users and roles
- Departments and categories
- Locations and collection points
- Lost and found items
- Item images
- Verification questions
- Claims and matches
- Handovers and audit records

Database constraints, triggers, functions and stored procedures enforce business rules.

### MongoDB

Stores flexible, frequently generated documents:

- User activity logs
- Search logs
- Notifications

Aggregation pipelines support analytical reports.

## Database Design

The PostgreSQL database contains 11 relational tables and implements:

- Primary and foreign keys.
- Unique and check constraints.
- Database triggers.
- Stored procedures and functions.
- Views and SQL reporting queries.
- Transaction management.
- Custom similarity functions.

MongoDB handles activity tracking, search history and notifications.

## AI-Based Matching

The application uses `all-MiniLM-L6-v2` through Transformers.js to identify potentially related lost and found reports.

The matching process:

1. Generate 384-dimensional sentence embeddings.
2. Store embeddings in PostgreSQL using `REAL[]`.
3. Calculate cosine similarity using an SQL function.
4. Filter candidate reports by category and date.
5. Store potential matches and notify relevant students.

For example, a search for "earphones" can identify an item described as an "AirPods charging case" through semantic similarity.

## Project Structure

```text
DBMS_Project/
│
├── app/
│   ├── pages/
│   └── api/
│
├── components/
│   └── React UI components
│
├── lib/
│   ├── database access
│   ├── authentication
│   ├── validation
│   ├── matching
│   └── MongoDB integration
│
├── sql/
│   ├── Database schema
│   ├── Functions and triggers
│   ├── Views
│   ├── Sample data
│   └── Demo queries
│
├── scripts/
│   ├── Database setup
│   └── Local MongoDB runner
│
├── docs/
│   ├── PROJECT_REPORT.md
│   └── ER_Diagram.svg
│
├── .env.example
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20 or newer
- PostgreSQL 14 or newer
- npm
- Git

MongoDB is started through the project's local runner.

### 1. Clone the Repository

```bash
git clone https://github.com/vishnu23-sys/DBMS_Project.git
cd DBMS_Project
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create the PostgreSQL Database

Open PostgreSQL:

```bash
psql -U postgres
```

Execute:

```sql
CREATE ROLE lostfound LOGIN PASSWORD 'your-password';
CREATE DATABASE lostfound OWNER lostfound;
```

Exit:

```sql
\q
```

### 4. Configure Environment Variables

```bash
cp .env.example .env.local
```

Configure `.env.local`:

```env
DATABASE_URL=postgresql://lostfound:your-password@localhost:5432/lostfound
JWT_SECRET=your-secure-secret
```

Add any other variables required by `.env.example`.

### 5. Start MongoDB

Open a separate terminal:

```bash
npm run mongo:dev
```

Keep it running.

### 6. Initialize the Database

```bash
npm run db:setup
```

This initializes PostgreSQL, loads sample data, computes embeddings and initializes MongoDB.

### 7. Start the Application

```bash
npm run dev
```

Open the application at:

http://localhost:3000

## Demo Login Credentials

Use the following sample accounts to explore the different portals.

**Common password for all demo accounts: `Demo@1234`**

| Role | Username / Email | Password |
|---|---|---|
| Admin | admin@campus.edu | Demo@1234 |
| Security Staff | security@campus.edu | Demo@1234 |
| Library Staff | library@campus.edu | Demo@1234 |
| Student | vishnu@campus.edu | Demo@1234 |
| Student | pravith@campus.edu | Demo@1234 |
| Student | ananya@campus.edu | Demo@1234 |

These credentials are intended for local demonstration only.

## Demo Walkthrough

### 1. Student Portal

Log in using:

- Username: `vishnu@campus.edu`
- Password: `Demo@1234`

Navigate to My Reports to view the suggested match for the grey backpack.

### 2. AI-Powered Search

Search for:

`earphones`

Navigate to Browse and observe how the system identifies the AirPods case even though the exact word "earphones" is not present in its description.

### 3. Staff Portal

Log in using:

- Username: `security@campus.edu`
- Password: `Demo@1234`

Open the Desk section and explore the two claims associated with the AirPods case:

- Ananya's verification answer matches 100%.
- Rahul's verification answer matches 0%, and he has three previous rejected claims.

Approve Ananya's claim.

### 4. Item Handover

Record the successful item handover through the staff portal.

Observe the corresponding status updates and finder reputation points.

### 5. Reports and Analytics

Open the Reports section to explore analytical dashboards and the SQL queries behind the reports.

### 6. Admin Portal

Log in using:

- Username: `admin@campus.edu`
- Password: `Demo@1234`

Open the Audit Log section to inspect the changes made during the demonstration.

## DBMS Concepts

| Concept | Implementation |
|---|---|
| Relational Database Design | PostgreSQL schema |
| NoSQL Database | MongoDB collections |
| Keys and Constraints | Data integrity |
| Normalization | Relational data organization |
| Triggers | Automatic database operations |
| Stored Procedures | Business logic |
| SQL Functions | Similarity calculations |
| Views | Reporting |
| Joins and Subqueries | Data retrieval |
| Transactions | Claim and handover operations |
| Indexing | Query optimization |
| Aggregation | MongoDB analytics |

### Demo SQL Queries

`sql/06_demo_queries.sql` demonstrates:

- Joins and subqueries.
- Database views.
- Full-text search.
- Trigger-based validation.
- Constraint enforcement.
- Transactions and rollbacks.

## Documentation

| Resource | Description |
|---|---|
| [Project Report](docs/PROJECT_REPORT.md) | Complete project documentation |
| [ER Diagram](docs/ER_Diagram.svg) | Entity Relationship Diagram |
| [SQL Scripts](sql/) | Schema, functions, triggers and queries |
| [Demo Queries](sql/06_demo_queries.sql) | SQL demonstrations |

## Team Contributions

### Pravith Mohandas

**PES1UG24AM202**

- Defined the problem statement, technical requirements and initial system architecture.
- Contributed to conceptual database design, entity identification and relational modeling.
- Designed workflows for student reporting, staff verification, ownership claims and item handovers.
- Defined role-based access requirements for students, staff and administrators.
- Contributed to the design of semantic item matching using sentence embeddings and similarity-based comparisons.
- Identified database integrity requirements and business rules for claim approval, item status and recovery.
- Contributed to technical documentation, system design, database requirements and project planning.

### Vishnu Patruni

**PES1UG24AM187**

- Designed and implemented the PostgreSQL database schema, tables, constraints and relationships.
- Developed stored procedures, SQL functions and triggers for database-level business logic.
- Implemented MongoDB integration for activity logs, search logs and notifications.
- Developed application components, backend API functionality and database connectivity.
- Implemented database views, reporting queries and analytics.
- Integrated the AI-based semantic matching mechanism with the application.
- Developed database initialization scripts, sample data and SQL demonstration queries.

---

## Project Objective

To develop a centralized and intelligent campus lost-and-found platform that improves item recovery through structured database management, automated matching, ownership verification and reliable handover tracking.

**Developed at PES University | DBMS Level 3 | Semester 5**
