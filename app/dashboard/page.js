import Link from 'next/link';
import ActionButton from '@/components/ActionButton';
import ItemTag from '@/components/ItemTag';
import StatusPill from '@/components/StatusPill';
import { requireUser } from '@/lib/auth';
import { getDashboard } from '@/lib/data';
import { fmtDate, fmtDateTime, pct } from '@/lib/format';
import { getNotifications } from '@/lib/mongo';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await requireUser();
  const [{ items, claims, matches, user }, notifications] = await Promise.all([
    getDashboard(session.userId),
    getNotifications(session.userId),
  ]);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <h1 className="display text-4xl sm:text-5xl">Hi, {user.name.split(' ')[0]}</h1>
      <p className="mt-2 text-muted">
        {user.srn ?? user.email}
        {user.department && `, ${user.department}`}.{' '}
        {user.reputation > 0
          ? `You have ${user.reputation} reputation points for handing in ${user.reputation / 10} item${user.reputation === 10 ? '' : 's'}.`
          : 'Hand in a found item to earn reputation points.'}
      </p>

      {matches.length > 0 && (
        <section className="mt-8">
          <h2 className="heading mb-3 text-2xl">Possible matches for your lost items</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {matches.map((m) => (
              <li key={m.match_id} className="panel border-found/50 p-4">
                <p className="text-sm text-muted">For your report &ldquo;{m.lost_title}&rdquo;</p>
                <div className="mt-1 flex items-baseline justify-between gap-3">
                  <Link href={`/items/${m.found_id}`} className="heading text-lg underline-offset-4 hover:underline">{m.found_title}</Link>
                  <span className="heading text-lg text-found">{pct(m.score)}</span>
                </div>
                <p className="text-sm text-muted">Found at {m.building}, {m.area}</p>
                <Link href={`/items/${m.found_id}`} className="btn btn-found btn-sm mt-3">View and claim</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid content-start gap-10">
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="heading text-2xl">Your reports</h2>
              <Link href="/items/new" className="text-sm underline">Report an item</Link>
            </div>
            {items.length === 0 ? (
              <p className="panel p-4 text-muted">You have not reported anything yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((item) => (
                  <div key={item.item_id}>
                    <ItemTag item={item} />
                    {item.pending_claims > 0 && (
                      <p className="mt-1 text-sm text-found">{item.pending_claims} claim(s) waiting for staff review</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="heading mb-3 text-2xl">Your claims</h2>
            {claims.length === 0 ? (
              <p className="panel p-4 text-muted">When you claim a found item it shows up here.</p>
            ) : (
              <div className="panel overflow-x-auto">
                <table className="table">
                  <thead><tr><th>Item</th><th>Filed</th><th>Status</th><th>Next step</th></tr></thead>
                  <tbody>
                    {claims.map((c) => (
                      <tr key={c.claim_id}>
                        <td><Link href={`/items/${c.item_id}`} className="font-semibold underline-offset-4 hover:underline">{c.title}</Link></td>
                        <td className="whitespace-nowrap">{fmtDate(c.created_at)}</td>
                        <td><StatusPill status={c.handed_over_at ? 'returned' : c.status} /></td>
                        <td className="text-sm">
                          {c.status === 'pending' && 'Staff are checking your proof'}
                          {c.status === 'approved' && !c.handed_over_at && `Collect from ${c.stored_at}`}
                          {c.handed_over_at && `Collected ${fmtDate(c.handed_over_at)}`}
                          {c.status === 'rejected' && (c.review_note || 'Proof did not match')}
                          {c.status === 'withdrawn' && 'You withdrew this claim'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="heading text-2xl">Notifications</h2>
            {unread > 0 && (
              <ActionButton url="/api/notifications" method="POST" label="Mark all read" className="btn btn-quiet btn-sm" />
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="panel p-4 text-sm text-muted">Nothing yet. You will hear from us when a report matches yours.</p>
          ) : (
            <ul className="panel divide-y divide-line">
              {notifications.map((n) => (
                <li key={String(n._id)} className="p-4">
                  <Link href={n.link || '#'} className={`block ${n.read ? '' : 'font-semibold'}`}>
                    {!n.read && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-found align-middle" aria-label="New" />}
                    {n.title}
                  </Link>
                  {n.body && <p className="mt-1 text-sm text-muted">{n.body}</p>}
                  <p className="mt-1 text-xs text-muted">{fmtDateTime(n.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
