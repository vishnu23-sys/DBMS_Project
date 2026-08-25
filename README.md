# 🎒 Campus Lost & Found with AI Semantic Search

An AI-powered campus lost and found platform built with **Next.js**, **PostgreSQL**, and **pgvector** that helps students report lost or found items, discover semantically similar reports, and securely claim belongings through role-based authentication and advanced database features.

> **PES University – DBMS Experiential Learning Level 3 Project**
>

# Members:

1.Pravith Mohandas, SRN : PES1UG24AM202  
2.Vishnu Patruni, SRN : PES1UG24AM187

---

# 📌 Problem Statement

Students often rely on WhatsApp groups or social media to report lost and found items on campus, making it difficult to search previous reports, detect duplicates, or verify ownership.

This project provides a centralized platform that combines structured database management with AI-powered semantic search to improve item recovery and administration.

---

# 🎯 Objectives

- Build a centralized lost and found platform for campus.
- Enable AI-powered semantic search for similar items.
- Implement secure authentication with role-based access.
- Demonstrate advanced SQL and database concepts.
- Integrate SQL and Vector Database technologies in a real-world application.

---

# ✨ Features

## 👨‍🎓 Student

- Register/Login
- Report Lost Items
- Report Found Items
- Upload Item Images
- AI-powered Semantic Search
- Submit Claim Requests
- Track Claim Status

## 👨‍💼 Admin

- Approve/Reject Reports
- Verify Ownership Claims
- Remove Spam/Duplicate Reports
- Dashboard & Analytics
- Manage Users

---

# 🛠 Tech Stack

| Layer | Technology |
|--------|------------|
| Frontend | Next.js |
| Backend | Next.js API Routes |
| SQL Database | PostgreSQL |
| Vector Database | pgvector |
| Authentication | NextAuth / JWT |
| Version Control | Git & GitHub |

---

# 🏗 System Architecture

```
Users
   │
   ▼
Next.js Frontend
   │
   ▼
Next.js API Routes
   │
   ├────────────► PostgreSQL
   │                 │
   │                 ├── Users
   │                 ├── Items
   │                 ├── Claims
   │                 └── Categories
   │
   └────────────► pgvector
                     │
                     └── Item Embeddings
```

---

# 🗄 Database Design

## SQL (PostgreSQL)

Stores structured data including:

- Users
- Items
- Categories
- Claims

### Why PostgreSQL?

- ACID Transactions
- Joins
- Constraints
- Stored Procedures
- Triggers
- Indexing

## Vector Database (pgvector)

Stores embeddings generated from:

- Item Title
- Item Description

This enables semantic search instead of relying only on exact keyword matching.

---

# 📊 ER Diagram

```
Users
 ├── user_id (PK)
 ├── name
 ├── email
 └── role
      │
      │ 1:M
      ▼
Items
 ├── item_id (PK)
 ├── title
 ├── description
 ├── status
 ├── location
 ├── category_id (FK)
 └── user_id (FK)
      │
      │ M:1
      ▼
Categories
 ├── category_id (PK)
 └── name

Items
 │
 │ 1:M
 ▼
Claims
 ├── claim_id (PK)
 ├── item_id (FK)
 ├── claimant_id (FK)
 └── status
```

---

# 📝 Relational Schema

### Users

```sql
CREATE TABLE Users(
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password_hash TEXT,
    role VARCHAR(20)
);
```

### Categories

```sql
CREATE TABLE Categories(
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(50)
);
```

### Items

```sql
CREATE TABLE Items(
    item_id SERIAL PRIMARY KEY,
    title VARCHAR(150),
    description TEXT,
    status VARCHAR(20),
    location TEXT,
    created_at TIMESTAMP,
    user_id INT REFERENCES Users(user_id),
    category_id INT REFERENCES Categories(category_id)
);
```

### Claims

```sql
CREATE TABLE Claims(
    claim_id SERIAL PRIMARY KEY,
    item_id INT REFERENCES Items(item_id),
    claimant_id INT REFERENCES Users(user_id),
    status VARCHAR(20),
    created_at TIMESTAMP
);
```

### Item Embeddings

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE ItemEmbeddings(
    item_id INT PRIMARY KEY REFERENCES Items(item_id),
    embedding VECTOR(384)
);
```

---

# 🔍 Semantic Search

Each item's title and description are converted into vector embeddings and stored in **pgvector**.

Example:

> "Black JBL headphones lost near library"

is converted into a 384-dimensional vector.

Similarity search:

```sql
SELECT title
FROM ItemEmbeddings e
JOIN Items i
ON e.item_id = i.item_id
ORDER BY embedding <=> query_embedding
LIMIT 5;
```

---

# 🚀 Advanced Database Features

This project demonstrates multiple advanced DBMS concepts.

## ✅ Transactions

```sql
BEGIN;

INSERT INTO Claims(...);

UPDATE Items
SET status='Claimed'
WHERE item_id=5;

COMMIT;
```

## ✅ Stored Procedure

```sql
CREATE PROCEDURE approve_claim(id INT)
LANGUAGE SQL
AS $$
UPDATE Claims
SET status='Approved'
WHERE claim_id=id;
$$;
```

## ✅ Trigger

```sql
CREATE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
NEW.created_at=NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## ✅ Views

```sql
CREATE VIEW RecentLostItems AS
SELECT *
FROM Items
WHERE status='Lost';
```

## ✅ Indexing

```sql
CREATE INDEX idx_item_status
ON Items(status);

CREATE INDEX idx_email
ON Users(email);
```

---

# 🔄 SQL Operations Demonstrated

## DDL

- CREATE
- ALTER
- DROP

## DML

- INSERT
- UPDATE
- DELETE
- SELECT

### Example JOIN

```sql
SELECT u.name, i.title
FROM Users u
JOIN Items i
ON u.user_id = i.user_id;
```

The project also demonstrates:

- GROUP BY
- HAVING
- ORDER BY
- Aggregate Functions
- Subqueries

---

# 🔐 Authentication & Authorization

## Student

- Report Items
- Search Items
- Submit Claims

## Admin

- Moderate Reports
- Approve Claims
- Manage Users
- View Dashboard

---

# 📂 Project Structure

```
campus-lost-found/
│
├── app/
├── components/
├── lib/
├── prisma/
├── public/
│   ├── screenshots/
│   └── images/
├── sql/
│   ├── schema.sql
│   ├── seed.sql
│   ├── triggers.sql
│   ├── procedures.sql
│   └── sample_queries.sql
├── vector/
│   └── embeddings.py
├── docs/
│   ├── ER_Diagram.png
│   ├── Architecture.png
│   └── Report.pdf
├── .env.example
└── README.md
```

---

# ⚙ Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/campus-lost-found.git
cd campus-lost-found
```

## Install Dependencies

```bash
npm install
```

## Configure Environment

Create a `.env.local` file.

```env
DATABASE_URL=postgresql://username:password@localhost:5432/lostfound
NEXTAUTH_SECRET=your_secret
OPENAI_API_KEY=your_api_key
```

## Enable pgvector

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Run SQL Schema

```bash
psql -d lostfound -f sql/schema.sql
```

## Start Development Server

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

# 🧪 Testing

| Test Case | Expected Result |
|------------|----------------|
| Student Login | Success |
| Invalid Login | Error |
| Report Lost Item | Saved |
| Report Found Item | Saved |
| Semantic Search | Similar Items Returned |
| Submit Claim | Claim Created |
| Admin Approval | Status Updated |

---

# 📸 Application Screenshots

> Screenshots will be added after implementation.

- Dashboard
- Report Item Page
- Search Page
- Claim Tracking
- Admin Dashboard

---

# 📈 Future Enhancements

- QR Code Verification
- OCR from Uploaded Images
- Email Notifications
- Real-time Chat
- Mobile Application
- Campus Heatmaps
- Image-based Similarity Search

---

# 👥 Team Contributions

## Member 1

- PostgreSQL Database Design
- ER Diagram
- SQL Implementation
- Stored Procedures
- Triggers

## Member 2

- Next.js Frontend
- Authentication
- API Integration
- pgvector Implementation
- Semantic Search

---

# 📚 Learning Outcomes

This project demonstrates practical implementation of:

- Relational Database Design
- ER Modeling
- SQL DDL & DML
- Transactions
- Stored Procedures
- Triggers
- Indexing
- Vector Databases
- Semantic Search
- Authentication
- Full-Stack Development

---

# ✅ Project Requirement Coverage

| Requirement | Status |
|-------------|--------|
| Next.js Web App | ✅ |
| PostgreSQL | ✅ |
| Vector Database | ✅ |
| ER Diagram | ✅ |
| Relational Schema | ✅ |
| DDL & DML | ✅ |
| Joins & Queries | ✅ |
| Transactions | ✅ |
| Stored Procedures | ✅ |
| Triggers | ✅ |
| Views | ✅ |
| Indexing | ✅ |
| Semantic Search | ✅ |
| Role-based Authentication | ✅ |
| Beyond CRUD | ✅ |

---

# 📜 License

This project is developed for **PES University DBMS Experiential Learning Level 3 Project** for academic purposes.
