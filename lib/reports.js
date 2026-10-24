import { readFileSync } from 'node:fs';
import path from 'node:path';
import { query } from './db';

// Report SQL lives in sql/05_reports.sql so the same queries are in the
// documentation and in the app. Each block starts with
//   -- @report key | title | description
export function loadReportDefinitions() {
  const file = readFileSync(path.join(process.cwd(), 'sql', '05_reports.sql'), 'utf8');
  return file
    .split(/^-- @report /m)
    .slice(1)
    .map((block) => {
      const [header, ...rest] = block.split('\n');
      const [key, title, description] = header.split('|').map((s) => s.trim());
      return { key, title, description, sql: rest.join('\n').trim().replace(/;\s*$/, '') };
    });
}

export async function runReports() {
  const defs = loadReportDefinitions();
  const results = await Promise.all(defs.map((d) => query(d.sql)));
  return Object.fromEntries(defs.map((d, i) => [d.key, { ...d, rows: results[i] }]));
}

export async function runReport(key) {
  const def = loadReportDefinitions().find((d) => d.key === key);
  if (!def) return null;
  return { ...def, rows: await query(def.sql) };
}

export function toCsv(rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const cell = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\n');
}
