import { handle } from '@/lib/api';
import { apiUser } from '@/lib/auth';
import { getNotifications, markAllRead } from '@/lib/mongo';

export const GET = handle(async () => {
  const session = await apiUser();
  return Response.json(await getNotifications(session.userId));
});

export const POST = handle(async () => {
  const session = await apiUser();
  await markAllRead(session.userId);
  return Response.json({ ok: true });
});
