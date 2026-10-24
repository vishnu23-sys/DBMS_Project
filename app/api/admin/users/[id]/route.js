import { handle, idParam } from '@/lib/api';
import { HttpError, apiUser } from '@/lib/auth';
import { withTransaction } from '@/lib/db';
import { logActivity } from '@/lib/mongo';
import { userUpdateSchema } from '@/lib/validators';

export const PATCH = handle(async (req, ctx) => {
  const userId = await idParam(ctx);
  const session = await apiUser(['admin']);
  if (userId === session.userId) throw new HttpError(400, 'You cannot change your own account here');
  const { role, isActive } = userUpdateSchema.parse(await req.json());

  const result = await withTransaction(session.userId, (db) =>
    db.query(
      `UPDATE users SET role = COALESCE($1, role), is_active = COALESCE($2, is_active)
        WHERE user_id = $3`,
      [role ?? null, isActive ?? null, userId],
    ),
  );
  if (!result.rowCount) throw new HttpError(404, 'User not found');
  await logActivity(session, 'user_update', { userId, role, isActive });
  return Response.json({ ok: true });
});
