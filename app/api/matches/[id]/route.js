import { handle, idParam } from '@/lib/api';
import { HttpError, apiUser, isStaff } from '@/lib/auth';
import { withTransaction } from '@/lib/db';
import { logActivity } from '@/lib/mongo';

// The owner of the lost item says "this is not mine".
export const DELETE = handle(async (req, ctx) => {
  const matchId = await idParam(ctx);
  const session = await apiUser();

  const result = await withTransaction(session.userId, (db) =>
    db.query(
      `UPDATE matches m SET status = 'dismissed'
         FROM items l
        WHERE m.match_id = $1 AND l.item_id = m.lost_item_id AND m.status = 'suggested'
          AND (l.reporter_id = $2 OR $3)`,
      [matchId, session.userId, Boolean(isStaff(session))],
    ),
  );
  if (!result.rowCount) throw new HttpError(404, 'This suggestion is no longer available');
  await logActivity(session, 'dismiss_match', { matchId });
  return Response.json({ ok: true });
});
