import { handle } from '@/lib/api';
import { apiUser } from '@/lib/auth';
import { withTransaction } from '@/lib/db';
import { logActivity } from '@/lib/mongo';

// Close reports past their category's retention period and refresh the
// materialised trend view used by the reports page.
export const POST = handle(async () => {
  const session = await apiUser(['staff', 'admin']);
  const closed = await withTransaction(session.userId, async (db) => {
    const { rows: [r] } = await db.query('SELECT fn_expire_stale_items() AS closed');
    await db.query('REFRESH MATERIALIZED VIEW mv_monthly_trends');
    return r.closed;
  });
  await logActivity(session, 'housekeeping', { closed });
  return Response.json({ closed });
});
