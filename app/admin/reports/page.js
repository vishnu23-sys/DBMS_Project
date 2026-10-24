import { BarReport, LineReport } from '@/components/Charts';
import { requireUser } from '@/lib/auth';
import { mongoReports } from '@/lib/mongo';
import { runReports } from '@/lib/reports';

export const dynamic = 'force-dynamic';

const headers = (rows) => (rows.length ? Object.keys(rows[0]) : []);
const label = (col) => col.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
const isNum = (v) => typeof v === 'number';

function DataTable({ rows }) {
  if (!rows.length) return <p className="p-4 text-sm text-muted">No rows.</p>;
  const cols = headers(rows);
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>{cols.map((c) => <th key={c} className={isNum(rows[0][c]) ? 'num' : ''}>{label(c)}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {cols.map((c) => (
                <td key={c} className={isNum(r[c]) ? 'num' : ''}>
                  {r[c] !== null && typeof r[c] === 'object' ? JSON.stringify(r[c]) : String(r[c] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Report({ report, chart, source = 'PostgreSQL', csv = true }) {
  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-4">
        <div>
          <h2 className="heading text-xl">{report.title}</h2>
          <p className="text-sm text-muted">{report.description}</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs font-semibold">{source}</span>
          {csv && <a href={`/api/reports/${report.key}?csv=1`} className="underline">Download CSV</a>}
        </div>
      </div>
      <div className={chart ? 'lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start' : ''}>
        {chart && <div className="px-2 pt-4">{chart}</div>}
        <DataTable rows={report.rows} />
      </div>
      {report.sql && (
        <details className="border-t border-line text-sm">
          <summary className="cursor-pointer px-4 py-2 text-muted">Show SQL</summary>
          <pre className="overflow-x-auto bg-[var(--code-bg)] px-4 py-3 text-xs leading-relaxed text-[#e6ebf1]">{report.sql}</pre>
        </details>
      )}
    </section>
  );
}

export default async function ReportsPage() {
  await requireUser(['staff', 'admin']);
  const [r, m] = await Promise.all([runReports(), mongoReports()]);

  return (
    <>
      <h1 className="display text-4xl sm:text-5xl">Reports</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Live from the database. Structured reports come from PostgreSQL views and queries; search and activity
        reports come from MongoDB aggregation pipelines.
      </p>

      <div className="mt-8 grid gap-6">
        <Report report={r.category_recovery}
                chart={<BarReport data={r.category_recovery.rows} x="category" bars={['lost_reports', 'recovered']} />} />
        <Report report={r.department_summary}
                chart={<BarReport data={r.department_summary.rows} x="code" bars={['lost_reports', 'recovered']} />} />
        <Report report={r.monthly_trend}
                chart={<LineReport data={r.monthly_trend.rows} x="month" lines={['lost', 'found', 'returned']} />} />
        <Report report={r.location_hotspots}
                chart={<BarReport data={r.location_hotspots.rows} x="location" bars={['lost', 'found']} height={300} />} />
        <Report report={r.claim_turnaround} />
        <Report report={r.top_finders} />
        <Report report={r.unclaimed_high_value} />
        <Report report={r.suspicious_claimants} />
        <Report report={r.match_quality} />
      </div>

      <h2 className="display mt-14 text-3xl">Search and activity</h2>
      {!m ? (
        <p className="panel mt-4 p-4 text-muted">
          MongoDB is not reachable. Start it with <code>npm run mongo:dev</code> to see these reports.
        </p>
      ) : (
        <div className="mt-6 grid gap-6">
          <Report source="MongoDB" csv={false}
                  report={{ title: 'Most searched items (30 days)', description: '$match, $group, $sort and $limit on search_logs', rows: m.topSearches }} />
          <Report source="MongoDB" csv={false}
                  report={{ title: 'Searches with no results', description: 'What students look for that nobody has handed in', rows: m.unmetSearches }} />
          <Report source="MongoDB" csv={false}
                  report={{ title: 'Daily activity (14 days)', description: '$dateToString grouping with $addToSet for unique users', rows: m.dailyActivity }}
                  chart={<LineReport data={m.dailyActivity} x="day" lines={['events', 'activeUsers']} />} />
          <Report source="MongoDB" csv={false}
                  report={{ title: 'Activity by role', description: 'Two-stage $group with $arrayToObject', rows: m.actionsByRole }} />
        </div>
      )}
    </>
  );
}
