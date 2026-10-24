import Link from 'next/link';
import { getSession, isStaff } from '@/lib/auth';
import { countUnread } from '@/lib/mongo';
import ThemeToggle from './ThemeToggle';

export default async function Nav() {
  const session = await getSession();
  const unread = session ? await countUnread(session.userId) : 0;

  const links = [{ href: '/items', label: 'Browse' }, { href: '/items/new', label: 'Report an item' }];
  if (session) links.push({ href: '/dashboard', label: unread ? `My reports (${unread} new)` : 'My reports' });
  if (isStaff(session)) links.push({ href: '/admin', label: 'Desk' }, { href: '/admin/reports', label: 'Reports' });
  if (session?.role === 'admin') links.push({ href: '/admin/users', label: 'Users' }, { href: '/admin/audit', label: 'Audit log' });

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="display text-xl">Lost &amp; Found</Link>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-ink/80 hover:text-ink hover:underline">{l.label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <ThemeToggle />
          {session ? (
            <>
              <span className="text-muted">
                {session.name}
                {session.role !== 'student' && <span className="ml-1 text-xs">({session.role})</span>}
              </span>
              <form action="/api/auth/logout" method="post">
                <button className="btn btn-quiet btn-sm">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-quiet btn-sm">Sign in</Link>
              <Link href="/register" className="btn btn-sm">Create account</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
