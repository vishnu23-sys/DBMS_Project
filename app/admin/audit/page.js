import StatusPill from '@/components/StatusPill';
import { requireUser } from '@/lib/auth';
import { getAuditLog } from '@/lib/data';
import { fmtDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  await requireUser(['admin']);
  const rows = await getAuditLog();

  return (
    <>
      <h1 className="display text-4xl sm:text-5xl">Audit log</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Written by database triggers on items, claims and users, so every change is recorded even if it does not
        come through the app. The acting user comes from the transaction setting app.user_id.
      </p>
      <div className="panel mt-6 overflow-x-auto">
        <table className="table">
          <thead><tr><th>When</th><th>Table</th><th className="num">Record</th><th>Action</th><th>Status change</th><th>By</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.log_id}>
                <td className="whitespace-nowrap">{fmtDateTime(r.changed_at)}</td>
                <td>{r.table_name}</td>
                <td className="num">{r.record_id}</td>
                <td>{r.action}</td>
                <td>
                  {r.old_status && <StatusPill status={r.old_status} />}
                  {r.old_status && r.new_status && r.old_status !== r.new_status && <span className="mx-1">to</span>}
                  {r.new_status && r.new_status !== r.old_status && <StatusPill status={r.new_status} />}
                </td>
                <td>{r.changed_by ?? <span className="text-muted">system / seed</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
