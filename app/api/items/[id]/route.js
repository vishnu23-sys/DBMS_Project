import { z } from 'zod';
import { handle, idParam } from '@/lib/api';
import { HttpError, apiUser, isStaff } from '@/lib/auth';
import { queryOne, withTransaction } from '@/lib/db';
import { refreshMatchesAndNotify } from '@/lib/matching';
import { logActivity, notify } from '@/lib/mongo';

const actionSchema = z.object({
  action: z.enum(['approve', 'reject', 'close', 'reopen']),
});

// approve / reject  -> staff moderation of a pending report
// close / reopen    -> the reporter withdraws or reopens their own report
export const PATCH = handle(async (req, ctx) => {
  const itemId = await idParam(ctx);
  const session = await apiUser();
  const { action } = actionSchema.parse(await req.json());

  const item = await queryOne('SELECT reporter_id, title, status FROM items WHERE item_id = $1', [itemId]);
  if (!item) throw new HttpError(404, 'This report no longer exists');

  const moderating = action === 'approve' || action === 'reject';
  if (moderating && !isStaff(session)) throw new HttpError(403, 'Only staff can moderate reports');
  if (!moderating && item.reporter_id !== session.userId && !isStaff(session)) {
    throw new HttpError(403, 'Only the person who reported this item can change it');
  }

  const next = { approve: 'open', reject: 'rejected', close: 'closed', reopen: 'open' }[action];
  await withTransaction(session.userId, (db) =>
    db.query('UPDATE items SET status = $1 WHERE item_id = $2', [next, itemId]),
  );

  let newMatches = 0;
  if (next === 'open') newMatches = await refreshMatchesAndNotify(itemId);
  if (moderating) {
    await notify(
      item.reporter_id,
      action === 'approve' ? 'item_approved' : 'item_rejected',
      action === 'approve' ? `"${item.title}" is now listed` : `"${item.title}" was not approved`,
      action === 'approve'
        ? 'Your report is visible to everyone on campus.'
        : 'A staff member rejected this report. Contact the security office if this is a mistake.',
      `/items/${itemId}`,
      { itemId },
    );
  }
  await logActivity(session, `item_${action}`, { itemId });
  return Response.json({ ok: true, status: next, newMatches });
});

// A reporter may delete a report that is still pending; admins may delete any.
export const DELETE = handle(async (req, ctx) => {
  const itemId = await idParam(ctx);
  const session = await apiUser();
  const item = await queryOne('SELECT reporter_id, status FROM items WHERE item_id = $1', [itemId]);
  if (!item) throw new HttpError(404, 'This report no longer exists');

  const ownPending = item.reporter_id === session.userId && item.status === 'pending';
  if (!ownPending && session.role !== 'admin') {
    throw new HttpError(403, 'Only pending reports can be deleted. Close the report instead.');
  }

  await withTransaction(session.userId, (db) => db.query('DELETE FROM items WHERE item_id = $1', [itemId]));
  await logActivity(session, 'item_delete', { itemId });
  return Response.json({ ok: true });
});
