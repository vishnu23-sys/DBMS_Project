import { handle, idParam } from '@/lib/api';
import { HttpError, apiUser, isStaff } from '@/lib/auth';
import { query, queryOne, withTransaction } from '@/lib/db';
import { logActivity, notify } from '@/lib/mongo';
import { reviewSchema } from '@/lib/validators';

// approve / reject -> staff, via stored procedures (one transaction)
// withdraw         -> the claimant takes back a pending claim
export const PATCH = handle(async (req, ctx) => {
  const claimId = await idParam(ctx);
  const session = await apiUser();
  const { action, note } = reviewSchema.parse(await req.json());

  const claim = await queryOne(
    `SELECT c.claimant_id, c.item_id, i.title FROM claims c JOIN items i ON i.item_id = c.item_id
      WHERE c.claim_id = $1`,
    [claimId],
  );
  if (!claim) throw new HttpError(404, 'This claim no longer exists');

  if (action === 'withdraw') {
    if (claim.claimant_id !== session.userId) throw new HttpError(403, 'You can only withdraw your own claim');
    const rows = await withTransaction(session.userId, (db) =>
      db.query(`UPDATE claims SET status = 'withdrawn' WHERE claim_id = $1 AND status = 'pending' RETURNING 1`, [claimId]),
    );
    if (!rows.rowCount) throw new HttpError(400, 'Only pending claims can be withdrawn');
    await logActivity(session, 'claim_withdraw', { claimId });
    return Response.json({ ok: true });
  }

  if (!isStaff(session)) throw new HttpError(403, 'Only staff can review claims');

  // other pending claims that approval will auto-reject
  const competing = action === 'approve'
    ? await query(`SELECT claimant_id FROM claims WHERE item_id = $1 AND claim_id <> $2 AND status = 'pending'`,
                  [claim.item_id, claimId])
    : [];

  await withTransaction(session.userId, (db) =>
    db.query(action === 'approve' ? 'CALL sp_approve_claim($1, $2, $3)' : 'CALL sp_reject_claim($1, $2, $3)',
             [claimId, session.userId, note]),
  );

  if (action === 'approve') {
    await notify(claim.claimant_id, 'claim_approved', `Your claim for "${claim.title}" was approved`,
      'Collect it from the collection point shown on the item page. Bring your ID.', `/items/${claim.item_id}`,
      { claimId });
    for (const c of competing) {
      await notify(c.claimant_id, 'claim_rejected', `Your claim for "${claim.title}" was not approved`,
        'Another claim for this item was verified.', `/items/${claim.item_id}`, { itemId: claim.item_id });
    }
  } else {
    await notify(claim.claimant_id, 'claim_rejected', `Your claim for "${claim.title}" was not approved`,
      note || 'The proof did not match the item.', `/items/${claim.item_id}`, { claimId });
  }
  await logActivity(session, `claim_${action}`, { claimId });
  return Response.json({ ok: true });
});
