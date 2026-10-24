import { handle, idParam } from '@/lib/api';
import { apiUser } from '@/lib/auth';
import { queryOne, withTransaction } from '@/lib/db';
import { logActivity, notify } from '@/lib/mongo';
import { claimSchema } from '@/lib/validators';

// Claim a found item. The claims_validate trigger checks the rules
// (found item, still open, not your own report) and scores the answer.
export const POST = handle(async (req, ctx) => {
  const itemId = await idParam(ctx);
  const session = await apiUser();
  const data = claimSchema.parse(await req.json());

  const claim = await withTransaction(session.userId, async (db) => {
    const { rows: [row] } = await db.query(
      `INSERT INTO claims (item_id, claimant_id, lost_item_id, proof_details, answer)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING claim_id`,
      [itemId, session.userId, data.lostItemId, data.proofDetails, data.answer],
    );
    return row;
  });

  const item = await queryOne('SELECT reporter_id, title FROM items WHERE item_id = $1', [itemId]);
  await notify(
    item.reporter_id,
    'claim_received',
    `Someone claimed "${item.title}"`,
    'Staff will verify the claim before the item is handed over.',
    `/items/${itemId}`,
    { itemId, claimId: claim.claim_id },
  );
  await logActivity(session, 'submit_claim', { itemId, claimId: claim.claim_id });
  return Response.json({ claimId: claim.claim_id });
});
