import bcrypt from 'bcryptjs';
import { handle } from '@/lib/api';
import { HttpError, createSession } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { logActivity } from '@/lib/mongo';
import { loginSchema } from '@/lib/validators';

export const POST = handle(async (req) => {
  const { email, password } = loginSchema.parse(await req.json());
  const user = await queryOne(
    'SELECT user_id, name, role, password_hash, is_active FROM users WHERE email = $1',
    [email],
  );

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new HttpError(401, 'Email or password is incorrect');
  }
  if (!user.is_active) throw new HttpError(403, 'This account has been deactivated. Contact the admin office.');

  await query('UPDATE users SET last_login_at = now() WHERE user_id = $1', [user.user_id]);
  await createSession(user);
  await logActivity({ userId: user.user_id, role: user.role }, 'login');
  return Response.json({ ok: true, role: user.role });
});
