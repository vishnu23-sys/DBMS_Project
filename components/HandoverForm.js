'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function HandoverForm({ claimId, collectionPoints, defaultLocationId }) {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/claims/${claimId}/handover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error || 'Could not record the handover');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <div className="field">
        <label htmlFor={`loc-${claimId}`} className="sr-only">Handed over at</label>
        <select id={`loc-${claimId}`} name="locationId" className="input py-1.5 text-sm"
                defaultValue={defaultLocationId ?? ''} required>
          {collectionPoints.map((l) => (
            <option key={l.location_id} value={l.location_id}>{l.building} &ndash; {l.area}</option>
          ))}
        </select>
      </div>
      <input name="notes" className="input w-48 py-1.5 text-sm" placeholder="Notes (ID checked...)" />
      <button className="btn btn-found btn-sm" disabled={busy}>Record handover</button>
      {error && <p role="alert" className="w-full text-xs text-lost">{error}</p>}
    </form>
  );
}
