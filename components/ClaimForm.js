'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ClaimForm({ itemId, question, myLostItems }) {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/items/${itemId}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error || 'Could not submit the claim');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="panel grid gap-4 p-5">
      <h2 className="heading text-xl">Is this yours?</h2>
      {question && (
        <div className="field">
          <label htmlFor="answer">{question}</label>
          <input id="answer" name="answer" className="input" required maxLength={200} />
          <p className="hint">The finder set this question. Only the owner should know the answer.</p>
        </div>
      )}
      <div className="field">
        <label htmlFor="proofDetails">How can you prove it is yours?</label>
        <textarea id="proofDetails" name="proofDetails" className="input min-h-24" required minLength={10}
                  placeholder="Marks, contents, where and when you lost it, a photo you can show at the desk." />
      </div>
      {myLostItems.length > 0 && (
        <div className="field">
          <label htmlFor="lostItemId">Link to your lost report</label>
          <select id="lostItemId" name="lostItemId" className="input" defaultValue="">
            <option value="">None</option>
            {myLostItems.map((i) => <option key={i.item_id} value={i.item_id}>{i.title}</option>)}
          </select>
        </div>
      )}
      {error && <p role="alert" className="text-sm font-medium text-lost">{error}</p>}
      <div>
        <button className="btn btn-found" disabled={busy}>{busy ? 'Sending...' : 'Submit claim'}</button>
      </div>
    </form>
  );
}
