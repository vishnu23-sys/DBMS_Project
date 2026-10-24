-- =====================================================================
-- Campus Lost & Found  |  06_demo_queries.sql
-- Statements to run live in psql during the demo. Each one shows a
-- specific DBMS concept. Run after npm run db:setup.
--   psql -U lostfound -d lostfound -h localhost
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. DML: INSERT / UPDATE / DELETE / SELECT
-- ---------------------------------------------------------------------
INSERT INTO locations (building, area) VALUES ('Hostel', 'Common Room') RETURNING *;
UPDATE locations SET area = 'TV Room' WHERE building = 'Hostel' AND area = 'Common Room' RETURNING *;
DELETE FROM locations WHERE building = 'Hostel' RETURNING *;

-- ---------------------------------------------------------------------
-- 2. JOIN across four tables
-- ---------------------------------------------------------------------
SELECT i.item_id, i.report_type, i.title, u.name AS reporter, c.name AS category,
       l.building || ' - ' || l.area AS place
FROM items i
JOIN users u      ON u.user_id = i.reporter_id
JOIN categories c ON c.category_id = i.category_id
JOIN locations l  ON l.location_id = i.location_id
WHERE i.status IN ('open', 'matched')
ORDER BY i.event_date DESC;

-- ---------------------------------------------------------------------
-- 3. GROUP BY + HAVING + ORDER BY + aggregates
--    ("average ... of every department" style report)
-- ---------------------------------------------------------------------
SELECT d.name AS department,
       COUNT(i.item_id) AS lost_reports,
       ROUND(AVG(CURRENT_DATE - i.event_date), 1) AS avg_age_days
FROM departments d
JOIN users u ON u.dept_id = d.dept_id
JOIN items i ON i.reporter_id = u.user_id AND i.report_type = 'lost'
GROUP BY d.name
HAVING COUNT(i.item_id) >= 2
ORDER BY lost_reports DESC;

-- ---------------------------------------------------------------------
-- 4. Subqueries: correlated + IN + EXISTS
-- ---------------------------------------------------------------------
-- students who have reported more items than the average student
SELECT u.name, (SELECT COUNT(*) FROM items i WHERE i.reporter_id = u.user_id) AS reports
FROM users u
WHERE u.role = 'student'
  AND (SELECT COUNT(*) FROM items i WHERE i.reporter_id = u.user_id) >
      (SELECT AVG(cnt) FROM (SELECT COUNT(*) AS cnt FROM items GROUP BY reporter_id) t);

-- found items that nobody has claimed yet
SELECT item_id, title FROM items f
WHERE f.report_type = 'found' AND f.status IN ('open', 'matched')
  AND NOT EXISTS (SELECT 1 FROM claims c WHERE c.item_id = f.item_id);

-- ---------------------------------------------------------------------
-- 5. Views
-- ---------------------------------------------------------------------
SELECT * FROM v_category_stats ORDER BY recovery_rate_pct DESC NULLS LAST;
SELECT * FROM v_location_hotspots ORDER BY total_reports DESC LIMIT 5;
REFRESH MATERIALIZED VIEW mv_monthly_trends;
SELECT * FROM mv_monthly_trends;

-- ---------------------------------------------------------------------
-- 6. Full-text search and fuzzy (trigram) search, both index-backed
-- ---------------------------------------------------------------------
SELECT item_id, title, ts_rank(search_doc, q) AS rank
FROM items, websearch_to_tsquery('english', 'black headphones') q
WHERE search_doc @@ q
ORDER BY rank DESC;

SELECT item_id, title, similarity(title, 'samsng fone') AS sim     -- typo-tolerant
FROM items
WHERE title % 'samsng fone' OR similarity(title, 'samsng fone') > 0.15
ORDER BY sim DESC;

-- the table is small, so force the planner to show the GIN index being used
SET enable_seqscan = off;
EXPLAIN SELECT * FROM items WHERE search_doc @@ websearch_to_tsquery('english', 'wallet');
RESET enable_seqscan;

-- ---------------------------------------------------------------------
-- 7. Matching function (hybrid text + AI embedding similarity)
-- ---------------------------------------------------------------------
SELECT * FROM fn_find_matches(17);          -- lost: Grey Wildcraft backpack
SELECT * FROM fn_find_matches(24);          -- lost: Aadhaar and college ID

-- ---------------------------------------------------------------------
-- 8. Triggers enforcing integrity (each statement FAILS on purpose)
-- ---------------------------------------------------------------------
-- future date
INSERT INTO items (reporter_id, category_id, location_id, report_type, title, description, event_date)
VALUES (4, 1, 1, 'lost', 'Time machine', 'Lost it next week apparently', CURRENT_DATE + 7);

-- illegal status jump (returned -> open)
UPDATE items SET status = 'open' WHERE item_id = 2;

-- claiming an item you reported yourself (item 18 was reported by user 19)
INSERT INTO claims (item_id, claimant_id, proof_details) VALUES (18, 19, 'I found it so it is mine');

-- CHECK constraint
INSERT INTO users (name, email, password_hash, role) VALUES ('Xavier', 'not-an-email', 'h', 'staff');   -- fails chk_user_email

-- ---------------------------------------------------------------------
-- 9. Transaction + stored procedure, with ROLLBACK
-- ---------------------------------------------------------------------
BEGIN;
  SELECT set_config('app.user_id', '2', true);       -- acting staff member, for the audit log
  CALL sp_approve_claim(13, 2, 'Demo approval');     -- approves claim 13
  SELECT claim_id, status FROM claims WHERE item_id = 18;
  SELECT item_id, status FROM items WHERE item_id IN (17, 18);
ROLLBACK;                                            -- nothing was saved
SELECT claim_id, status FROM claims WHERE item_id = 18;

-- a procedure that fails part-way leaves no partial changes
BEGIN;
  CALL sp_approve_claim(1, 2);                       -- claim 1 is already approved -> error
ROLLBACK;

-- ---------------------------------------------------------------------
-- 10. Audit trail written by triggers
-- ---------------------------------------------------------------------
SELECT log_id, table_name, record_id, action, changed_by,
       old_data ->> 'status' AS old_status, new_data ->> 'status' AS new_status, changed_at
FROM audit_log ORDER BY log_id DESC LIMIT 10;

-- ---------------------------------------------------------------------
-- 11. DDL: ALTER and DROP
-- ---------------------------------------------------------------------
ALTER TABLE locations ADD COLUMN floor_no INT CHECK (floor_no BETWEEN -2 AND 20);
ALTER TABLE locations DROP COLUMN floor_no;
CREATE INDEX idx_demo ON items (brand);
DROP INDEX idx_demo;
