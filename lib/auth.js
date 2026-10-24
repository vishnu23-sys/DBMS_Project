import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { queryOne } from './db';

const COOKIE = 'lf_session';
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function createSession(user) {
  const token = await new SignJWT({ uid: user.user_id, name: user.name, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return { userId: payload.uid, name: payload.name, role: payload.role };
  } catch {
    return null;
  }
}

export const isStaff = (session) => session && ['staff', 'admin'].includes(session.role);

// For pages: redirect when signed out or not allowed.
export async function requireUser(roles) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (roles && !roles.includes(session.role)) redirect('/');
  return session;
}

// For API routes: throw 401/403, and re-check that the account is still active.
export async function apiUser(roles) {
  const session = await getSession();
  if (!session) throw new HttpError(401, 'Sign in to continue');
  const user = await queryOne('SELECT role, is_active FROM users WHERE user_id = $1', [session.userId]);
  if (!user?.is_active) throw new HttpError(403, 'This account has been deactivated');
  session.role = user.role;
  if (roles && !roles.includes(user.role)) throw new HttpError(403, 'You do not have access to this action');
  return session;
}
