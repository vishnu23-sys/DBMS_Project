import Link from 'next/link';
import { notFound } from 'next/navigation';
import ActionButton from '@/components/ActionButton';
import ClaimForm from '@/components/ClaimForm';
import HandoverForm from '@/components/HandoverForm';
import StatusPill from '@/components/StatusPill';
import { getSession, isStaff } from '@/lib/auth';
import { getItem, getLookups, getMyOpenLostItems } from '@/lib/data';
import { daysAgo, fmtDate, fmtDateTime, pct, statusText, tagNumber } from '@/lib/format';
import { logActivity } from '@/lib/mongo';

export const dynamic = 'force-dynamic';

export default async function ItemPage({ params, searchParams }) {
  const id = Number((await params).id);
  const { new: justCreated } = await searchParams;
  const [item, session] = await Promise.all([Number.isInteger(id) ? getItem(id) : null, getSession()]);
  if (!item) notFound();

  const staff = isStaff(session);
  const mine = session?.userId === item.reporter_id;
  if (['pending', 'rejected'].includes(item.status) && !mine && !staff) notFound();

  await logActivity(session, 'view_item', { itemId: id });

  const lost = item.report_type === 'lost';
  const claimable = !lost && ['open', 'matched'].includes(item.status);
  const myClaim = session && item.claims.find((c) => c.claimant_id === session.userId);
  const visibleClaims = staff ? item.claims : mine ? item.claims : item.claims.filter((c) => c === myClaim);
  const [myLostItems, lookups] = await Promise.all([
    session && claimable && !mine && !myClaim ? getMyOpenLostItems(session.userId) : [],
    staff ? getLookups() : null,
  ]);
  const collectionPoints = lookups?.locations.filter((l) => l.is_collection_point) ?? [];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div>
        {justCreated && (
          <p className="panel mb-6 border-found/40 p-4 text-sm" role="status">
            Report saved.{' '}
            {item.status === 'pending' ? 'Staff will review it shortly.' : 'It is now listed.'}{' '}
            We will notify you when a matching report appears.
          </p>
        )}

        <div className={`tag ${lost ? 'tag-lost' : 'tag-found'} py-6`}>
          <div className="flex items-baseline justify-between gap-3">
            <span className={`font-semibold ${lost ? 'text-lost' : 'text-found'}`}>{lost ? 'Lost' : 'Found'}</span>
            <span className="tag-no text-lg text-ink/70">{tagNumber(item.item_id)}</span>
          </div>
          <h1 className="display mt-2 text-3xl sm:text-5xl">{item.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusPill status={item.status} label={statusText[item.status]} />
            <span className="text-sm">{item.category}</span>
          </div>
        </div>

        <dl className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <div><dt className="text-sm text-muted">{lost ? 'Last seen' : 'Found at'}</dt><dd>{item.building}, {item.area}</dd></div>
          <div><dt className="text-sm text-muted">Date</dt><dd>{fmtDate(item.event_date)} ({daysAgo(item.event_date)})</dd></div>
          {item.color && <div><dt className="text-sm text-muted">Colour</dt><dd className="capitalize">{item.color}</dd></div>}
          {item.brand && <div><dt className="text-sm text-muted">Brand</dt><dd>{item.brand}</dd></div>}
          {item.stored_at && <div><dt className="text-sm text-muted">Collect from</dt><dd className="font-semibold">{item.stored_at}</dd></div>}
          <div><dt className="text-sm text-muted">Reported by</dt><dd>{item.reporter_name}</dd></div>
        </dl>

        <p className="mt-6 max-w-[70ch] whitespace-pre-line text-lg">{item.description}</p>

        {item.images.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3">
            {item.images.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={img.image_url} src={img.image_url} alt={item.title}
                   className="h-48 rounded-md border border-line bg-surface object-contain p-2" />
            ))}
          </div>
        )}

        {(mine || staff) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {staff && item.status === 'pending' && (
              <>
                <ActionButton url={`/api/items/${id}`} body={{ action: 'approve' }} label="Approve and list" className="btn btn-found btn-sm" />
                <ActionButton url={`/api/items/${id}`} body={{ action: 'reject' }} label="Reject report" className="btn btn-lost btn-sm"
                              confirm="Reject this report? The reporter will be notified." />
              </>
            )}
            {['open', 'matched'].includes(item.status) && (
              <ActionButton url={`/api/items/${id}`} body={{ action: 'close' }}
                            label={lost ? 'I found it myself, close report' : 'Close report'} className="btn btn-quiet btn-sm"
                            confirm="Close this report? It will no longer be matched." />
            )}
            {item.status === 'closed' && (
              <ActionButton url={`/api/items/${id}`} body={{ action: 'reopen' }} label="Reopen report" className="btn btn-quiet btn-sm" />
            )}
            {((mine && item.status === 'pending') || session.role === 'admin') && (
              <ActionButton url={`/api/items/${id}`} method="DELETE" label="Delete report" className="btn btn-quiet btn-sm"
                            confirm="Delete this report permanently?" redirectTo="/dashboard" />
            )}
          </div>
        )}

        {visibleClaims.length > 0 && (
          <section className="mt-10">
            <h2 className="heading mb-3 text-2xl">Claims</h2>
            {staff && item.question && (
              <p className="mb-3 text-sm text-muted">
                Question: {item.question} Expected answer: <span className="font-semibold text-ink">{item.expected_answer}</span>
              </p>
            )}
            <div className="panel overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Claimant</th><th>Proof</th>{staff && <th className="num">Answer match</th>}<th>Status</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleClaims.map((c) => (
                    <tr key={c.claim_id}>
                      <td>
                        <div className="font-semibold">{c.claimant_name}</div>
                        {staff && <div className="text-xs text-muted">{c.srn}</div>}
                        <div className="text-xs text-muted">{fmtDateTime(c.created_at)}</div>
                      </td>
                      <td className="max-w-xs">
                        {(staff || c === myClaim) ? c.proof_details : 'Hidden'}
                        {staff && c.answer && <div className="mt-1 text-xs text-muted">Answered: &ldquo;{c.answer}&rdquo;</div>}
                      </td>
                      {staff && (
                        <td className="num font-semibold">
                          <span className={c.verification_score >= 0.6 ? 'text-found' : c.verification_score != null ? 'text-lost' : ''}>
                            {pct(c.verification_score)}
                          </span>
                        </td>
                      )}
                      <td>
                        <StatusPill status={c.status} />
                        {c.review_note && <div className="mt-1 text-xs text-muted">{c.review_note}</div>}
                        {c.handed_over_at && <div className="mt-1 text-xs text-muted">Collected {fmtDateTime(c.handed_over_at)}</div>}
                      </td>
                      <td className="whitespace-nowrap">
                        {staff && c.status === 'pending' && (
                          <div className="flex gap-2">
                            <ActionButton url={`/api/claims/${c.claim_id}`} body={{ action: 'approve' }} label="Approve" className="btn btn-found btn-sm"
                                          confirm="Approve this claim? Other pending claims for this item will be rejected." />
                            <ActionButton url={`/api/claims/${c.claim_id}`} body={{ action: 'reject', note: 'Proof did not match' }} label="Reject" className="btn btn-quiet btn-sm" />
                          </div>
                        )}
                        {staff && c.status === 'approved' && !c.handed_over_at && (
                          <HandoverForm claimId={c.claim_id} collectionPoints={collectionPoints} />
                        )}
                        {c === myClaim && c.status === 'pending' && (
                          <ActionButton url={`/api/claims/${c.claim_id}`} body={{ action: 'withdraw' }} label="Withdraw" className="btn btn-quiet btn-sm" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      <aside className="grid content-start gap-6">
        {claimable && !mine && !myClaim && (
          session ? (
            <ClaimForm itemId={id} question={item.question} myLostItems={myLostItems} />
          ) : (
            <div className="panel p-5">
              <p className="font-semibold">Is this yours?</p>
              <p className="mt-1 text-sm text-muted">Sign in to claim it. You will need to prove it is yours.</p>
              <Link href="/login" className="btn mt-4">Sign in to claim</Link>
            </div>
          )
        )}
        {myClaim && (
          <div className="panel p-5">
            <p className="font-semibold">Your claim: {statusText[myClaim.status]}</p>
            <p className="mt-1 text-sm text-muted">
              {myClaim.status === 'pending' && 'Staff are checking your proof. You will be notified.'}
              {myClaim.status === 'approved' && !myClaim.handed_over_at && `Collect it from ${item.stored_at}. Bring your college ID.`}
              {myClaim.handed_over_at && `Collected on ${fmtDate(myClaim.handed_over_at)}.`}
              {myClaim.status === 'rejected' && (myClaim.review_note || 'Your proof did not match.')}
            </p>
          </div>
        )}

        <section>
          <h2 className="heading mb-1 text-xl">{lost ? 'Found items that look similar' : 'Lost reports that look similar'}</h2>
          <p className="mb-3 text-sm text-muted">
            Matched on the same category and dates, using wording and AI meaning.
          </p>
          {item.matches.length === 0 ? (
            <p className="panel p-4 text-sm text-muted">No similar reports yet. New reports are checked automatically.</p>
          ) : (
            <ul className="grid gap-3">
              {item.matches.map((m) => (
                <li key={m.match_id} className="panel p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <Link href={`/items/${m.item_id}`} className="font-semibold underline-offset-4 hover:underline">{m.title}</Link>
                    <span className="heading text-lg">{pct(m.score)}</span>
                  </div>
                  <p className="text-sm text-muted">{m.building}, {m.area} &ndash; {fmtDate(m.event_date)}</p>
                  <p className="mt-1 text-xs text-muted">
                    Wording {pct(m.text_score)}, meaning {pct(m.semantic_score)}
                    {m.status === 'confirmed' && ', confirmed by staff'}
                  </p>
                  {m.status === 'suggested' && lost && (mine || staff) && (
                    <div className="mt-2">
                      <ActionButton url={`/api/matches/${m.match_id}`} method="DELETE" label="Not mine, hide this"
                                    className="btn btn-quiet btn-sm" />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}
