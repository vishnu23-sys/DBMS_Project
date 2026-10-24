// Computes AI embeddings for every item that has none, then refreshes matches.
// Usage: npm run embed   (also run automatically by npm run db:setup)
import { config } from 'dotenv';
import pg from 'pg';
import { embed, itemText } from '../lib/embeddings.js';

config({ path: '.env.local', quiet: true });

export async function embedAll(client) {
  const { rows } = await client.query(
    'SELECT item_id, title, brand, color, description FROM items WHERE embedding IS NULL');
  let done = 0;
  for (const item of rows) {
    const vector = await embed(itemText(item));
    if (!vector) break;
    await client.query('UPDATE items SET embedding = $1 WHERE item_id = $2', [vector, item.item_id]);
    done++;
  }
  console.log(`Embedded ${done}/${rows.length} items`);

  const open = await client.query(
    `SELECT item_id FROM items WHERE status IN ('open', 'matched') AND report_type = 'lost'`);
  for (const { item_id } of open.rows) await client.query('CALL sp_refresh_matches($1)', [item_id]);
}

if (import.meta.main) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await embedAll(client);
  await client.end();
}
