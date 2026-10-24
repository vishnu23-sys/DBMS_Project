import { handle, idParam } from '@/lib/api';
import { apiUser } from '@/lib/auth';
import { queryOne, withTransaction } from '@/lib/db';
import { logActivity, notify } from '@/lib/mongo';
import { handoverSchema } from '@/lib/validators';

// Staff record that the owner collected the item (sp_record_handover).
export const POST = handle(async (req, ctx) => {
  const claimId = await idParam(ctx);
  const session = await apiUser(['staff', 'admin']);
  const { locationId, notes } = handoverSchema.parse(await req.json());

  await withTransaction(session.userId, (db) =>
    db.query('CALL sp_record_handover($1, $2, $3, $4)', [claimId, session.userId, locationId, notes]),
  );

  const info = await queryOne(
    `SELECT c.claimant_id, i.item_id, i.title, i.reporter_id
       FROM claims c JOIN items i ON i.item_id = c.item_id WHERE c.claim_id = $1`,
    [claimId],
  );
  await notify(info.claimant_id, 'handover_done', `You collected "${info.title}"`,
    'Glad you got it back.', `/items/${info.item_id}`, { claimId });
  await notify(info.reporter_id, 'handover_done', `"${info.title}" is back with its owner`,
    'You earned 10 reputation points for handing it in.', `/items/${info.item_id}`, { claimId });
  await logActivity(session, 'handover', { claimId });
  return Response.json({ ok: true });
});
