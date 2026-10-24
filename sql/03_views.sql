-- =====================================================================
-- Campus Lost & Found  |  03_views.sql
-- Views used by the app and by the report pages.
-- =====================================================================

-- one denormalised row per item, for listing pages
CREATE OR REPLACE VIEW v_item_details AS
SELECT i.item_id, i.report_type, i.title, i.description, i.color, i.brand,
       i.event_date, i.status, i.created_at, i.updated_at,
       i.reporter_id, u.name AS reporter_name, u.role AS reporter_role,
       c.category_id, c.name AS category, c.is_high_value,
       l.location_id, l.building, l.area,
       s.building || ' - ' || s.area AS stored_at,
       (SELECT image_url FROM item_images im
         WHERE im.item_id = i.item_id ORDER BY image_id LIMIT 1) AS cover_image,
       (i.embedding IS NOT NULL) AS has_embedding
FROM items i
JOIN users u      ON u.user_id = i.reporter_id
JOIN categories c ON c.category_id = i.category_id
JOIN locations l  ON l.location_id = i.location_id
LEFT JOIN locations s ON s.location_id = i.storage_location_id;

-- recovery rate per category
CREATE OR REPLACE VIEW v_category_stats AS
SELECT c.category_id, c.name AS category,
       COUNT(i.item_id) FILTER (WHERE i.report_type = 'lost')  AS lost_reports,
       COUNT(i.item_id) FILTER (WHERE i.report_type = 'found') AS found_reports,
       COUNT(i.item_id) FILTER (WHERE i.report_type = 'lost' AND i.status = 'returned') AS recovered,
       ROUND(100.0 * COUNT(i.item_id) FILTER (WHERE i.report_type = 'lost' AND i.status = 'returned')
             / NULLIF(COUNT(i.item_id) FILTER (WHERE i.report_type = 'lost'), 0), 1) AS recovery_rate_pct
FROM categories c
LEFT JOIN items i ON i.category_id = c.category_id AND i.status NOT IN ('pending', 'rejected')
GROUP BY c.category_id, c.name;

-- where things get lost / found most
CREATE OR REPLACE VIEW v_location_hotspots AS
SELECT l.location_id, l.building, l.area,
       COUNT(*) FILTER (WHERE i.report_type = 'lost')  AS lost_count,
       COUNT(*) FILTER (WHERE i.report_type = 'found') AS found_count,
       COUNT(*) AS total_reports
FROM locations l
JOIN items i ON i.location_id = l.location_id AND i.status NOT IN ('pending', 'rejected')
GROUP BY l.location_id, l.building, l.area;

-- per department: how many students lose things, how fast they get them back
CREATE OR REPLACE VIEW v_department_stats AS
SELECT d.dept_id, d.code, d.name AS department,
       COUNT(DISTINCT u.user_id) AS students,
       COUNT(i.item_id) AS lost_reports,
       COUNT(h.handover_id) AS recovered,
       ROUND(AVG(EXTRACT(EPOCH FROM (h.handed_over_at - i.created_at)) / 86400)::numeric, 1)
           AS avg_days_to_recover
FROM departments d
LEFT JOIN users u  ON u.dept_id = d.dept_id AND u.role = 'student'
LEFT JOIN items i  ON i.reporter_id = u.user_id AND i.report_type = 'lost'
                  AND i.status NOT IN ('pending', 'rejected')
LEFT JOIN claims cl ON cl.lost_item_id = i.item_id AND cl.status = 'approved'
LEFT JOIN handovers h ON h.claim_id = cl.claim_id
GROUP BY d.dept_id, d.code, d.name;

-- time between a claim being filed and being decided
CREATE OR REPLACE VIEW v_claim_turnaround AS
SELECT cl.claim_id, cl.status, c.name AS category,
       cl.created_at, cl.reviewed_at,
       ROUND((EXTRACT(EPOCH FROM (cl.reviewed_at - cl.created_at)) / 3600)::numeric, 1) AS hours_to_decision
FROM claims cl
JOIN items i      ON i.item_id = cl.item_id
JOIN categories c ON c.category_id = i.category_id
WHERE cl.reviewed_at IS NOT NULL;

-- monthly lost vs found trend (materialised: refresh with
-- REFRESH MATERIALIZED VIEW mv_monthly_trends;)
CREATE MATERIALIZED VIEW mv_monthly_trends AS
SELECT date_trunc('month', event_date)::date AS month,
       COUNT(*) FILTER (WHERE report_type = 'lost')  AS lost,
       COUNT(*) FILTER (WHERE report_type = 'found') AS found,
       COUNT(*) FILTER (WHERE status = 'returned')   AS returned
FROM items
WHERE status NOT IN ('pending', 'rejected')
GROUP BY 1
ORDER BY 1;
