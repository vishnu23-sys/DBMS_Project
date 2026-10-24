import bcrypt from 'bcryptjs';
import { handle } from '@/lib/api';
import { createSession } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { logActivity } from '@/lib/mongo';
import { registerSchema } from '@/lib/validators';

export const POST = handle(async (req) => {
  const data = registerSchema.parse(await req.json());
  const hash = await bcrypt.hash(data.password, 10);

  const user = await queryOne(
    `INSERT INTO users (srn, name, email, phone, password_hash, role, dept_id)
     VALUES ($1, $2, $3, $4, $5, 'student', $6)
     RETURNING user_id, name, role`,
    [data.srn, data.name, data.email, data.phone ?? null, hash, data.deptId],
  );

  await createSession(user);
  await logActivity({ userId: user.user_id, role: user.role }, 'register');
  return Response.json({ ok: true });
});
