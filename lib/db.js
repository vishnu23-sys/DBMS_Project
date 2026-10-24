import pg from 'pg';

// NUMERIC -> number, BIGINT (COUNT) -> number, DATE -> 'YYYY-MM-DD' string
pg.types.setTypeParser(1700, (v) => parseFloat(v));
pg.types.setTypeParser(20, (v) => parseInt(v, 10));
pg.types.setTypeParser(1082, (v) => v);

// one pool per server process (survives hot reloads in dev)
const pool = globalThis.__pgPool ?? new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
globalThis.__pgPool = pool;

export async function query(text, params) {
  const { rows } = await pool.query(text, params);
  return rows;
}

export async function queryOne(text, params) {
  return (await query(text, params))[0] ?? null;
}

// Runs fn(client) inside BEGIN/COMMIT. The acting user is stored in
// app.user_id so the audit trigger can record who made each change.
export async function withTransaction(userId, fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (userId) await client.query("SELECT set_config('app.user_id', $1, true)", [String(userId)]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

const constraintMessages = {
  users_email_key: 'An account with this email already exists',
  users_srn_key: 'An account with this SRN already exists',
  uq_claim_once: 'You have already claimed this item',
  ux_one_approved_claim: 'This item already has an approved claim',
  handovers_claim_id_key: 'This handover has already been recorded',
  chk_item_title: 'Title must be at least 3 characters',
  chk_item_desc: 'Description must be at least 10 characters',
  chk_claim_proof: 'Describe your proof in at least 10 characters',
};

// Turns a PostgreSQL error into a message that is safe to show users.
export function dbErrorMessage(err) {
  if (err.code === 'P0001') return err.message;                     // RAISE EXCEPTION in our triggers/procedures
  if (constraintMessages[err.constraint]) return constraintMessages[err.constraint];
  if (err.code === '23505') return 'That record already exists';
  if (err.code === '23514') return `Value rejected by rule ${err.constraint}`;
  if (err.code === '23503') return 'A referenced record does not exist';
  return null;
}
