import Link from 'next/link';
import ActionButton from '@/components/ActionButton';
import HandoverForm from '@/components/HandoverForm';
import { requireUser } from '@/lib/auth';
import { getDesk, getLookups } from '@/lib/data';
import { daysAgo, fmtDateTime, pct, tagNumber } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function DeskPage() {
  await requireUser(['staff', 'admin']);
  const [{ pendingItems, pendingClaims, awaitingHandover, counts }, { locations }] = await Promise.all([
    getDesk(),
    getLookups(),
  ]);
  const collectionPoints = locations.filter((l) => l.is_collection_point);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl sm:text-5xl">Desk</h1>
          <p className="mt-2 text-muted">
            {pendingItems.length} reports to review, {pendingClaims.length} claims to verify,{' '}
            {awaitingHandover.length} items waiting to be collected.
          </p>
        </div>
        <div className="text-right">
          <ActionButton url="/api/admin/housekeeping" method="POST" label="Close expired reports"
                        className="btn btn-quiet btn-sm"
                        confirm={`Close open reports older than their category's retention period? (${counts.open_items} open now)`} />
        </div>
      </div>

      <section className="mt-10">
        <h2 className="heading mb-3 text-2xl">Reports waiting for review</h2>
        {pendingItems.length === 0 ? (
          <p className="panel p-4 text-muted">All caught up.</p>
        ) : (
          <div className="panel overflow-x-auto">
            <table className="table">
              <thead><tr><th>Report</th><th>Type</th><th>Where</th><th>By</th><th></th></tr></thead>
              <tbody>
                {pendingItems.map((i) => (
                  <tr key={i.item_id}>
                    <td>
                      <Link href={`/items/${i.item_id}`} className="font-semibold underline-offset-4 hover:underline">{i.title}</Link>
                      <div className="max-w-md text-xs text-muted">{i.description}</div>
                    </td>
                    <td className={i.report_type === 'lost' ? 'text-lost' : 'text-found'}>{i.report_type === 'lost' ? 'Lost' : 'Found'}</td>
                    <td>{i.building}, {i.area}</td>
                    <td>{i.reporter_name}<div className="text-xs text-muted">{daysAgo(i.created_at)}</div></td>
                    <td className="whitespace-nowrap">
                      <div className="flex gap-2">
                        <ActionButton url={`/api/items/${i.item_id}`} body={{ action: 'approve' }} label="Approve" className="btn btn-found btn-sm" />
                        <ActionButton url={`/api/items/${i.item_id}`} body={{ action: 'reject' }} label="Reject" className="btn btn-quiet btn-sm"
                                      confirm="Reject this report?" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="heading mb-1 text-2xl">Claims to verify</h2>
        <p className="mb-3 text-sm text-muted">
          Answer match compares the claimant&rsquo;s answer with the finder&rsquo;s using trigram similarity.
          Approving a claim rejects the other claims for the same item.
        </p>
        {pendingClaims.length === 0 ? (
          <p className="panel p-4 text-muted">No claims waiting.</p>
        ) : (
          <div className="panel overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Item</th><th>Claimant</th><th>Their answer</th><th className="num">Answer match</th><th>Proof</th><th></th></tr>
              </thead>
              <tbody>
                {pendingClaims.map((c) => (
                  <tr key={c.claim_id}>
                    <td>
                      <Link href={`/items/${c.item_id}`} className="font-semibold underline-offset-4 hover:underline">{c.title}</Link>
                      <div className="tag-no text-xs text-muted">{tagNumber(c.item_id)}</div>
                      {c.competing > 1 && <div className="text-xs font-semibold text-warn">{c.competing} people claimed this</div>}
                    </td>
                    <td>
                      {c.claimant_name}
                      <div className="text-xs text-muted">{c.srn}</div>
                      {c.claimant_rejections > 0 && (
                        <div className="text-xs font-semibold text-lost">{c.claimant_rejections} rejected claim(s) before</div>
                      )}
                    </td>
                    <td className="text-sm">
                      {c.question ? (
                        <>
                          &ldquo;{c.answer ?? 'no answer'}&rdquo;
                          <div className="text-xs text-muted">Expected: {c.expected_answer}</div>
                        </>
                      ) : <span className="text-muted">No question set</span>}
                    </td>
                    <td className="num heading text-lg">
                      <span className={c.verification_score >= 0.6 ? 'text-found' : c.verification_score != null ? 'text-lost' : 'text-muted'}>
                        {pct(c.verification_score)}
                      </span>
                    </td>
                    <td className="max-w-xs text-sm">{c.proof_details}<div className="text-xs text-muted">{fmtDateTime(c.created_at)}</div></td>
                    <td className="whitespace-nowrap">
                      <div className="flex gap-2">
                        <ActionButton url={`/api/claims/${c.claim_id}`} body={{ action: 'approve' }} label="Approve" className="btn btn-found btn-sm" />
                        <ActionButton url={`/api/claims/${c.claim_id}`} body={{ action: 'reject', note: 'Proof did not match' }}
                                      label="Reject" className="btn btn-quiet btn-sm" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="heading mb-3 text-2xl">Waiting to be collected</h2>
        {awaitingHandover.length === 0 ? (
          <p className="panel p-4 text-muted">Nothing to hand over.</p>
        ) : (
          <div className="panel overflow-x-auto">
            <table className="table">
              <thead><tr><th>Item</th><th>Owner</th><th>Stored at</th><th>Approved</th><th>Hand over</th></tr></thead>
              <tbody>
                {awaitingHandover.map((h) => (
                  <tr key={h.claim_id}>
                    <td><Link href={`/items/${h.item_id}`} className="font-semibold underline-offset-4 hover:underline">{h.title}</Link></td>
                    <td>{h.claimant_name}</td>
                    <td>{h.stored_at}</td>
                    <td className="whitespace-nowrap">{fmtDateTime(h.reviewed_at)}</td>
                    <td><HandoverForm claimId={h.claim_id} collectionPoints={collectionPoints} defaultLocationId={h.storage_location_id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
