-- =====================================================================
-- Campus Lost & Found  |  05_reports.sql
-- Report queries shown on the Admin -> Reports page.
-- The app reads this file directly: each block starts with
--   -- @report <key> | <title> | <what it shows>
-- =====================================================================

-- @report category_recovery | Recovery rate by category | GROUP BY + FILTER aggregates over the v_category_stats view
SELECT category, lost_reports, found_reports, recovered,
       COALESCE(recovery_rate_pct, 0) AS recovery_rate_pct
FROM v_category_stats
ORDER BY lost_reports DESC, category;

-- @report department_summary | Department-wise lost items and average recovery time | LEFT JOINs across departments, users, items, claims and handovers with AVG
SELECT code, department, students, lost_reports, recovered,
       COALESCE(avg_days_to_recover, 0) AS avg_days_to_recover
FROM v_department_stats
ORDER BY lost_reports DESC, code;

-- @report location_hotspots | Location hotspots (2+ reports) | GROUP BY with HAVING, ranked with a window function
SELECT RANK() OVER (ORDER BY COUNT(*) DESC) AS rank,
       l.building || ' - ' || l.area AS location,
       COUNT(*) FILTER (WHERE i.report_type = 'lost')  AS lost,
       COUNT(*) FILTER (WHERE i.report_type = 'found') AS found,
       COUNT(*) AS total
FROM items i
JOIN locations l ON l.location_id = i.location_id
WHERE i.status NOT IN ('pending', 'rejected')
GROUP BY l.location_id, l.building, l.area
HAVING COUNT(*) >= 2
ORDER BY total DESC, location;

-- @report monthly_trend | Monthly lost vs found trend | date_trunc grouping from the mv_monthly_trends materialised view
SELECT to_char(month, 'Mon YYYY') AS month, lost, found, returned
FROM mv_monthly_trends
ORDER BY mv_monthly_trends.month;

-- @report claim_turnaround | Average claim decision time by category | AVG / MIN / MAX over the v_claim_turnaround view
SELECT category,
       COUNT(*) AS decided_claims,
       COUNT(*) FILTER (WHERE status = 'approved') AS approved,
       ROUND(AVG(hours_to_decision), 1) AS avg_hours,
       MIN(hours_to_decision) AS fastest_hours,
       MAX(hours_to_decision) AS slowest_hours
FROM v_claim_turnaround
GROUP BY category
ORDER BY avg_hours;

-- @report top_finders | Most honest finders | Subquery count of returned items + reputation, ranked with DENSE_RANK
SELECT DENSE_RANK() OVER (ORDER BY u.reputation DESC) AS rank,
       u.name, d.code AS dept, u.reputation,
       (SELECT COUNT(*) FROM items i
         WHERE i.reporter_id = u.user_id AND i.report_type = 'found'
           AND i.status = 'returned') AS items_returned
FROM users u
LEFT JOIN departments d ON d.dept_id = u.dept_id
WHERE u.reputation > 0
ORDER BY u.reputation DESC, u.name;

-- @report unclaimed_high_value | High-value found items unclaimed for 7+ days | NOT EXISTS subquery + date arithmetic
SELECT i.item_id, i.title, c.name AS category,
       s.building || ' - ' || s.area AS stored_at,
       CURRENT_DATE - i.event_date AS days_waiting,
       c.retention_days - (CURRENT_DATE - i.event_date) AS days_left
FROM items i
JOIN categories c ON c.category_id = i.category_id
LEFT JOIN locations s ON s.location_id = i.storage_location_id
WHERE i.report_type = 'found'
  AND i.status IN ('open', 'matched')
  AND c.is_high_value
  AND CURRENT_DATE - i.event_date >= 7
  AND NOT EXISTS (SELECT 1 FROM claims cl
                   WHERE cl.item_id = i.item_id AND cl.status = 'pending')
ORDER BY days_waiting DESC;

-- @report suspicious_claimants | Users with repeatedly rejected claims | GROUP BY + HAVING on claim outcomes (fraud signal)
SELECT u.name, u.srn,
       COUNT(*) AS total_claims,
       COUNT(*) FILTER (WHERE cl.status = 'rejected') AS rejected,
       ROUND(AVG(cl.verification_score), 2) AS avg_verification_score
FROM claims cl
JOIN users u ON u.user_id = cl.claimant_id
GROUP BY u.user_id, u.name, u.srn
HAVING COUNT(*) FILTER (WHERE cl.status = 'rejected') >= 2
ORDER BY rejected DESC;

-- @report match_quality | How good are the automatic matches? | Compares suggested-match scores for confirmed vs dismissed vs open suggestions
SELECT status,
       COUNT(*) AS matches,
       ROUND(AVG(score), 3) AS avg_score,
       ROUND(AVG(text_score), 3) AS avg_text_score,
       ROUND(AVG(semantic_score), 3) AS avg_semantic_score
FROM matches
GROUP BY status
ORDER BY avg_score DESC;
