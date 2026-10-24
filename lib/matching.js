// Runs after an item becomes visible: store its AI embedding, look for
// matching reports, and notify the owners of the lost items involved.
import { query, queryOne } from './db';
import { embed, itemText } from './embeddings';
import { notify } from './mongo';

export async function ensureEmbedding(itemId) {
  const item = await queryOne(
    'SELECT title, brand, color, description, embedding IS NOT NULL AS has FROM items WHERE item_id = $1',
    [itemId],
  );
  if (!item || item.has) return;
  const vector = await embed(itemText(item));
  if (vector) await query('UPDATE items SET embedding = $1 WHERE item_id = $2', [vector, itemId]);
}

export async function refreshMatchesAndNotify(itemId) {
  const before = await query(
    'SELECT match_id FROM matches WHERE $1 IN (lost_item_id, found_item_id)',
    [itemId],
  );
  await query('CALL sp_refresh_matches($1)', [itemId]);

  const fresh = await query(
    `SELECT m.match_id, m.score, l.item_id AS lost_id, l.title AS lost_title, l.reporter_id,
            f.item_id AS found_id, f.title AS found_title
       FROM matches m
       JOIN items l ON l.item_id = m.lost_item_id
       JOIN items f ON f.item_id = m.found_item_id
      WHERE $1 IN (m.lost_item_id, m.found_item_id)
        AND m.status = 'suggested'
        AND NOT (m.match_id = ANY($2::int[]))`,
    [itemId, before.map((b) => b.match_id)],
  );

  for (const m of fresh) {
    await notify(
      m.reporter_id,
      'match_found',
      `Possible match for "${m.lost_title}"`,
      `"${m.found_title}" was handed in and looks ${Math.round(m.score * 100)}% similar.`,
      `/items/${m.found_id}`,
      { lostItemId: m.lost_id, foundItemId: m.found_id, score: m.score },
    );
  }
  return fresh.length;
}
