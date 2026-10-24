// Creates the whole PostgreSQL database from sql/01..05 and seeds MongoDB.
// Usage: npm run db:setup            (flags: --no-mongo, --no-ai)
import { readFileSync } from 'node:fs';
import { config } from 'dotenv';
import pg from 'pg';
import { seedMongo } from './mongo-seed.mjs';
import { embedAll } from './embed-items.mjs';

config({ path: '.env.local', quiet: true });

const files = ['01_schema.sql', '02_functions.sql', '03_views.sql', '04_seed.sql'];
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

for (const f of files) {
  process.stdout.write(`Running sql/${f} ... `);
  await client.query(readFileSync(`sql/${f}`, 'utf8'));
  console.log('ok');
}

// AI embeddings + semantic matches (skippable with --no-ai)
if (!process.argv.includes('--no-ai')) await embedAll(client);

// smoke-test every report query
const reports = readFileSync('sql/05_reports.sql', 'utf8').split(/^-- @report /m).slice(1);
for (const block of reports) {
  const key = block.split('|')[0].trim();
  const { rowCount } = await client.query(block.slice(block.indexOf('\n')));
  console.log(`  report ${key}: ${rowCount} rows`);
}

const { rows } = await client.query(`
  SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM items) AS items,
         (SELECT COUNT(*) FROM claims) AS claims, (SELECT COUNT(*) FROM matches) AS matches`);
console.log('Postgres ready:', rows[0]);
await client.end();

if (!process.argv.includes('--no-mongo')) {
  try {
    await seedMongo();
  } catch (err) {
    console.warn(`MongoDB not seeded (${err.message}). Start it with "npm run mongo:dev" and re-run.`);
  }
}
