-- =====================================================================
-- Campus Lost & Found  |  01_schema.sql  (DDL)
-- Tables, keys, constraints and indexes.
-- Re-runnable: drops everything first.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- trigram similarity (fuzzy matching)

DROP VIEW IF EXISTS v_item_details, v_category_stats, v_location_hotspots,
                    v_department_stats, v_claim_turnaround CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_monthly_trends CASCADE;
DROP TABLE IF EXISTS audit_log, handovers, matches, claims, verification_questions,
                     item_images, items, locations, categories, users, departments CASCADE;

-- ---------------------------------------------------------------------
-- 1. departments
-- ---------------------------------------------------------------------
CREATE TABLE departments (
    dept_id     SERIAL       PRIMARY KEY,
    code        VARCHAR(10)  NOT NULL UNIQUE,
    name        VARCHAR(80)  NOT NULL UNIQUE
);

-- ---------------------------------------------------------------------
-- 2. users  (roles: student | staff | admin)
-- ---------------------------------------------------------------------
CREATE TABLE users (
    user_id        SERIAL        PRIMARY KEY,
    srn            VARCHAR(20)   UNIQUE,
    name           VARCHAR(100)  NOT NULL,
    email          VARCHAR(120)  NOT NULL UNIQUE,
    phone          VARCHAR(15),
    password_hash  TEXT          NOT NULL,
    role           VARCHAR(10)   NOT NULL DEFAULT 'student',
    dept_id        INT           REFERENCES departments(dept_id) ON DELETE SET NULL,
    reputation     INT           NOT NULL DEFAULT 0,
    is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT chk_user_name   CHECK (length(trim(name)) >= 2),
    CONSTRAINT chk_user_email  CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    CONSTRAINT chk_user_phone  CHECK (phone IS NULL OR phone ~ '^[0-9+ -]{7,15}$'),
    CONSTRAINT chk_user_role   CHECK (role IN ('student', 'staff', 'admin')),
    CONSTRAINT chk_reputation  CHECK (reputation >= 0),
    -- every student must have an SRN
    CONSTRAINT chk_student_srn CHECK (role <> 'student' OR srn IS NOT NULL)
);

-- ---------------------------------------------------------------------
-- 3. categories  (retention_days = how long an unclaimed report stays open)
-- ---------------------------------------------------------------------
CREATE TABLE categories (
    category_id     SERIAL       PRIMARY KEY,
    name            VARCHAR(50)  NOT NULL UNIQUE,
    is_high_value   BOOLEAN      NOT NULL DEFAULT FALSE,
    retention_days  INT          NOT NULL DEFAULT 30,
    CONSTRAINT chk_retention CHECK (retention_days BETWEEN 7 AND 365)
);

-- ---------------------------------------------------------------------
-- 4. locations  (collection points = where found items are stored)
-- ---------------------------------------------------------------------
CREATE TABLE locations (
    location_id          SERIAL       PRIMARY KEY,
    building             VARCHAR(60)  NOT NULL,
    area                 VARCHAR(60)  NOT NULL,
    is_collection_point  BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_location UNIQUE (building, area)
);

-- ---------------------------------------------------------------------
-- 5. items  (one row per lost OR found report)
--    status flow: pending -> open -> matched -> claimed -> returned
--                 (or rejected by moderator / closed after retention)
-- ---------------------------------------------------------------------
CREATE TABLE items (
    item_id              SERIAL        PRIMARY KEY,
    reporter_id          INT           NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    category_id          INT           NOT NULL REFERENCES categories(category_id),
    location_id          INT           NOT NULL REFERENCES locations(location_id),
    storage_location_id  INT           REFERENCES locations(location_id),
    report_type          VARCHAR(5)    NOT NULL,
    title                VARCHAR(120)  NOT NULL,
    description          TEXT          NOT NULL,
    color                VARCHAR(30),
    brand                VARCHAR(50),
    event_date           DATE          NOT NULL,
    status               VARCHAR(10)   NOT NULL DEFAULT 'pending',
    embedding            REAL[],                    -- 384-d sentence embedding
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),

    -- full-text search document, maintained by Postgres itself
    search_doc TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '') || ' ' ||
                                         coalesce(brand, '') || ' ' ||
                                         coalesce(color, '')), 'B')
    ) STORED,

    CONSTRAINT chk_item_type    CHECK (report_type IN ('lost', 'found')),
    CONSTRAINT chk_item_title   CHECK (length(trim(title)) >= 3),
    CONSTRAINT chk_item_desc    CHECK (length(trim(description)) >= 10),
    CONSTRAINT chk_item_status  CHECK (status IN ('pending', 'open', 'matched', 'claimed',
                                                  'returned', 'closed', 'rejected')),
    CONSTRAINT chk_item_storage CHECK (report_type = 'found' OR storage_location_id IS NULL),
    CONSTRAINT chk_embedding    CHECK (embedding IS NULL OR array_length(embedding, 1) = 384)
);

-- ---------------------------------------------------------------------
-- 6. item_images
-- ---------------------------------------------------------------------
CREATE TABLE item_images (
    image_id     SERIAL       PRIMARY KEY,
    item_id      INT          NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
    image_url    TEXT         NOT NULL,
    uploaded_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_image_url CHECK (image_url ~ '^(https?://|/)')
);

-- ---------------------------------------------------------------------
-- 7. verification_questions  (finder sets a secret question about a found item;
--    only the true owner should know the answer)
-- ---------------------------------------------------------------------
CREATE TABLE verification_questions (
    question_id      SERIAL        PRIMARY KEY,
    item_id          INT           NOT NULL UNIQUE REFERENCES items(item_id) ON DELETE CASCADE,
    question         VARCHAR(200)  NOT NULL,
    expected_answer  VARCHAR(200)  NOT NULL,
    CONSTRAINT chk_question CHECK (length(trim(question)) >= 5)
);

-- ---------------------------------------------------------------------
-- 8. claims  (a user claims a FOUND item as theirs)
-- ---------------------------------------------------------------------
CREATE TABLE claims (
    claim_id            SERIAL         PRIMARY KEY,
    item_id             INT            NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
    claimant_id         INT            NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    lost_item_id        INT            REFERENCES items(item_id) ON DELETE SET NULL,
    proof_details       TEXT           NOT NULL,
    answer              VARCHAR(200),
    verification_score  NUMERIC(4, 3),             -- auto-computed by trigger
    status              VARCHAR(10)    NOT NULL DEFAULT 'pending',
    reviewed_by         INT            REFERENCES users(user_id) ON DELETE SET NULL,
    review_note         TEXT,
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT now(),
    reviewed_at         TIMESTAMPTZ,

    CONSTRAINT uq_claim_once     UNIQUE (item_id, claimant_id),
    CONSTRAINT chk_claim_status  CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    CONSTRAINT chk_claim_proof   CHECK (length(trim(proof_details)) >= 10),
    CONSTRAINT chk_claim_score   CHECK (verification_score BETWEEN 0 AND 1),
    CONSTRAINT chk_claim_review  CHECK (status NOT IN ('approved', 'rejected')
                                        OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);

-- ---------------------------------------------------------------------
-- 9. matches  (system-suggested lost <-> found pairs)
-- ---------------------------------------------------------------------
CREATE TABLE matches (
    match_id        SERIAL         PRIMARY KEY,
    lost_item_id    INT            NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
    found_item_id   INT            NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
    score           NUMERIC(5, 4)  NOT NULL,
    text_score      NUMERIC(5, 4)  NOT NULL,
    semantic_score  NUMERIC(5, 4),
    status          VARCHAR(10)    NOT NULL DEFAULT 'suggested',
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT uq_match          UNIQUE (lost_item_id, found_item_id),
    CONSTRAINT chk_match_pair    CHECK (lost_item_id <> found_item_id),
    CONSTRAINT chk_match_score   CHECK (score BETWEEN 0 AND 1),
    CONSTRAINT chk_match_status  CHECK (status IN ('suggested', 'confirmed', 'dismissed'))
);

-- ---------------------------------------------------------------------
-- 10. handovers  (physical return of an item after an approved claim)
-- ---------------------------------------------------------------------
CREATE TABLE handovers (
    handover_id     SERIAL       PRIMARY KEY,
    claim_id        INT          NOT NULL UNIQUE REFERENCES claims(claim_id) ON DELETE CASCADE,
    handled_by      INT          NOT NULL REFERENCES users(user_id),
    location_id     INT          NOT NULL REFERENCES locations(location_id),
    handed_over_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    notes           TEXT
);

-- ---------------------------------------------------------------------
-- 11. audit_log  (filled automatically by triggers)
-- ---------------------------------------------------------------------
CREATE TABLE audit_log (
    log_id      BIGSERIAL    PRIMARY KEY,
    table_name  VARCHAR(40)  NOT NULL,
    record_id   INT          NOT NULL,
    action      VARCHAR(6)   NOT NULL,
    changed_by  INT,                                -- app user, from SET LOCAL app.user_id
    old_data    JSONB,
    new_data    JSONB,
    changed_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_audit_action CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------
CREATE INDEX idx_items_status_type   ON items (status, report_type);
CREATE INDEX idx_items_category      ON items (category_id);
CREATE INDEX idx_items_location      ON items (location_id);
CREATE INDEX idx_items_reporter      ON items (reporter_id);
CREATE INDEX idx_items_event_date    ON items (event_date DESC);
CREATE INDEX idx_items_search_doc    ON items USING GIN (search_doc);              -- full-text
CREATE INDEX idx_items_title_trgm    ON items USING GIN (title gin_trgm_ops);      -- fuzzy
CREATE INDEX idx_claims_item_status  ON claims (item_id, status);
CREATE INDEX idx_claims_claimant     ON claims (claimant_id);
CREATE INDEX idx_matches_found       ON matches (found_item_id);
CREATE INDEX idx_audit_record        ON audit_log (table_name, record_id);

-- at most ONE approved claim per item (partial unique index)
CREATE UNIQUE INDEX ux_one_approved_claim ON claims (item_id) WHERE status = 'approved';

-- ---------------------------------------------------------------------
-- ALTER demo: columns added after initial design
-- ---------------------------------------------------------------------
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMPTZ;
ALTER TABLE items ADD CONSTRAINT chk_item_color CHECK (color IS NULL OR length(color) <= 30);
