// Read queries used by the pages (server-side only).
import { query, queryOne } from './db';
import { embed } from './embeddings';

export async function getLookups() {
  const [categories, locations, departments] = await Promise.all([
    query('SELECT category_id, name, is_high_value FROM categories ORDER BY name'),
    query('SELECT location_id, building, area, is_collection_point FROM locations ORDER BY building, area'),
    query('SELECT dept_id, code, name FROM departments ORDER BY name'),
  ]);
  return { categories, locations, departments };
}

export async function getHomeStats() {
  return queryOne(`
    SELECT (SELECT COUNT(*) FROM items WHERE report_type = 'found' AND status IN ('open', 'matched')) AS waiting,
           (SELECT COUNT(*) FROM handovers) AS returned,
           (SELECT COUNT(*) FROM matches WHERE status = 'suggested') AS suggested,
           (SELECT ROUND(AVG(avg_days_to_recover), 1) FROM v_department_stats) AS avg_days`);
}

export function getRecentItems(type, limit = 6) {
  return query(
    `SELECT * FROM v_item_details
      WHERE report_type = $1 AND status IN ('open', 'matched')
      ORDER BY created_at DESC LIMIT $2`,
    [type, limit],
  );
}

// Browse + search. mode = 'semantic' (AI embeddings) or 'keyword'
// (full-text search + trigram fuzzy match).
export async function searchItems({ q, mode, type, category, location, status }) {
  const params = [];
  const where = [];
  const add = (sql, value) => {
    params.push(value);
    where.push(sql.replace('?', `$${params.length}`));
  };

  if (type === 'lost' || type === 'found') add('v.report_type = ?', type);
  if (category) add('v.category_id = ?', Number(category));
  if (location) add('v.location_id = ?', Number(location));
  if (status === 'resolved') where.push("v.status IN ('claimed', 'returned')");
  else if (status === 'all') where.push("v.status NOT IN ('pending', 'rejected')");
  else where.push("v.status IN ('open', 'matched')");

  let relevance = 'NULL::numeric';
  let order = 'v.created_at DESC';
  let usedMode = null;

  if (q) {
    const vector = mode !== 'keyword' ? await embed(q) : null;
    if (vector) {
      usedMode = 'semantic';
      params.push(vector);
      relevance = `round(cosine_similarity(i.embedding, $${params.length}::real[])::numeric, 3)`;
      where.push(`i.embedding IS NOT NULL AND cosine_similarity(i.embedding, $${params.length}::real[]) > 0.3`);
    } else {
      usedMode = 'keyword';
      params.push(q);
      const p = `$${params.length}`;
      relevance = `round((ts_rank(i.search_doc, websearch_to_tsquery('english', ${p}))
                          + similarity(i.title, ${p}))::numeric, 3)`;
      where.push(`(i.search_doc @@ websearch_to_tsquery('english', ${p}) OR i.title % ${p})`);
    }
    order = 'relevance DESC';
  }

  const rows = await query(
    `SELECT v.*, ${relevance} AS relevance
       FROM v_item_details v JOIN items i ON i.item_id = v.item_id
      WHERE ${where.join(' AND ')}
      ORDER BY ${order}
      LIMIT 40`,
    params,
  );
  return { rows, mode: usedMode };
}

export async function getItem(itemId) {
  const item = await queryOne(
    `SELECT v.*, vq.question, vq.expected_answer
       FROM v_item_details v
       LEFT JOIN verification_questions vq ON vq.item_id = v.item_id
      WHERE v.item_id = $1`,
    [itemId],
  );
  if (!item) return null;

  const [images, matches, claims] = await Promise.all([
    query('SELECT image_url FROM item_images WHERE item_id = $1 ORDER BY image_id', [itemId]),
    query(
      `SELECT m.match_id, m.score, m.text_score, m.semantic_score, m.status,
              o.item_id, o.title, o.report_type, o.status AS item_status, o.building, o.area,
              o.event_date, o.reporter_id
         FROM matches m
         JOIN v_item_details o
           ON o.item_id = CASE WHEN m.lost_item_id = $1 THEN m.found_item_id ELSE m.lost_item_id END
        WHERE $1 IN (m.lost_item_id, m.found_item_id) AND m.status <> 'dismissed'
        ORDER BY m.score DESC`,
      [itemId],
    ),
    query(
      `SELECT c.claim_id, c.claimant_id, u.name AS claimant_name, u.srn, c.proof_details, c.answer,
              c.verification_score, c.status, c.review_note, c.created_at, c.reviewed_at,
              c.lost_item_id, r.name AS reviewer_name, h.handed_over_at
         FROM claims c
         JOIN users u ON u.user_id = c.claimant_id
         LEFT JOIN users r ON r.user_id = c.reviewed_by
         LEFT JOIN handovers h ON h.claim_id = c.claim_id
        WHERE c.item_id = $1
        ORDER BY c.created_at`,
      [itemId],
    ),
  ]);
  return { ...item, images, matches, claims };
}

export function getMyOpenLostItems(userId) {
  return query(
    `SELECT item_id, title FROM items
      WHERE reporter_id = $1 AND report_type = 'lost' AND status IN ('open', 'matched', 'pending')
      ORDER BY created_at DESC`,
    [userId],
  );
}

export async function getDashboard(userId) {
  const [items, claims, matches, user] = await Promise.all([
    query(
      `SELECT v.*, (SELECT COUNT(*) FROM claims c WHERE c.item_id = v.item_id AND c.status = 'pending') AS pending_claims
         FROM v_item_details v WHERE v.reporter_id = $1 ORDER BY v.created_at DESC`,
      [userId],
    ),
    query(
      `SELECT c.claim_id, c.status, c.created_at, c.review_note, i.item_id, i.title,
              s.building || ' - ' || s.area AS stored_at, h.handed_over_at
         FROM claims c
         JOIN items i ON i.item_id = c.item_id
         LEFT JOIN locations s ON s.location_id = i.storage_location_id
         LEFT JOIN handovers h ON h.claim_id = c.claim_id
        WHERE c.claimant_id = $1
        ORDER BY c.created_at DESC`,
      [userId],
    ),
    query(
      `SELECT m.match_id, m.score, l.item_id AS lost_id, l.title AS lost_title,
              f.item_id AS found_id, f.title AS found_title, f.building, f.area
         FROM matches m
         JOIN items li ON li.item_id = m.lost_item_id
         JOIN v_item_details l ON l.item_id = m.lost_item_id
         JOIN v_item_details f ON f.item_id = m.found_item_id
        WHERE li.reporter_id = $1 AND m.status = 'suggested' AND f.status IN ('open', 'matched')
        ORDER BY m.score DESC`,
      [userId],
    ),
    queryOne(
      `SELECT u.name, u.email, u.srn, u.role, u.reputation, d.name AS department
         FROM users u LEFT JOIN departments d ON d.dept_id = u.dept_id WHERE u.user_id = $1`,
      [userId],
    ),
  ]);
  return { items, claims, matches, user };
}

export async function getDesk() {
  const [pendingItems, pendingClaims, awaitingHandover, counts] = await Promise.all([
    query(`SELECT * FROM v_item_details WHERE status = 'pending' ORDER BY created_at`),
    query(
      `SELECT c.claim_id, c.item_id, i.title, c.proof_details, c.answer, c.verification_score,
              c.created_at, u.name AS claimant_name, u.srn, vq.question, vq.expected_answer,
              (SELECT COUNT(*) FROM claims x WHERE x.claimant_id = c.claimant_id AND x.status = 'rejected')
                AS claimant_rejections,
              (SELECT COUNT(*) FROM claims y WHERE y.item_id = c.item_id AND y.status = 'pending')
                AS competing
         FROM claims c
         JOIN items i ON i.item_id = c.item_id
         JOIN users u ON u.user_id = c.claimant_id
         LEFT JOIN verification_questions vq ON vq.item_id = c.item_id
        WHERE c.status = 'pending'
        ORDER BY c.item_id, c.verification_score DESC NULLS LAST`,
    ),
    query(
      `SELECT c.claim_id, i.item_id, i.title, u.name AS claimant_name, c.reviewed_at,
              i.storage_location_id, s.building || ' - ' || s.area AS stored_at
         FROM claims c
         JOIN items i ON i.item_id = c.item_id
         JOIN users u ON u.user_id = c.claimant_id
         LEFT JOIN locations s ON s.location_id = i.storage_location_id
         LEFT JOIN handovers h ON h.claim_id = c.claim_id
        WHERE c.status = 'approved' AND h.handover_id IS NULL
        ORDER BY c.reviewed_at`,
    ),
    queryOne(
      `SELECT COUNT(*) FILTER (WHERE status IN ('open', 'matched')) AS open_items,
              COUNT(*) FILTER (WHERE status IN ('open', 'matched')
                                 AND event_date < CURRENT_DATE - (SELECT MIN(retention_days) FROM categories)) AS ageing
         FROM items`,
    ),
  ]);
  return { pendingItems, pendingClaims, awaitingHandover, counts };
}

export function getUsers() {
  return query(
    `SELECT u.user_id, u.name, u.email, u.srn, u.role, u.is_active, u.reputation, u.last_login_at,
            d.code AS dept,
            COUNT(DISTINCT i.item_id) AS reports,
            COUNT(DISTINCT c.claim_id) AS claims
       FROM users u
       LEFT JOIN departments d ON d.dept_id = u.dept_id
       LEFT JOIN items i ON i.reporter_id = u.user_id
       LEFT JOIN claims c ON c.claimant_id = u.user_id
      GROUP BY u.user_id, d.code
      ORDER BY CASE u.role WHEN 'admin' THEN 0 WHEN 'staff' THEN 1 ELSE 2 END, u.name`,
  );
}

export function getAuditLog(limit = 60) {
  return query(
    `SELECT a.log_id, a.table_name, a.record_id, a.action, a.changed_at, u.name AS changed_by,
            a.old_data ->> 'status' AS old_status, a.new_data ->> 'status' AS new_status
       FROM audit_log a LEFT JOIN users u ON u.user_id = a.changed_by
      ORDER BY a.log_id DESC LIMIT $1`,
    [limit],
  );
}
