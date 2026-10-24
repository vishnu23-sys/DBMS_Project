'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ReportForm({ categories, locations, initialType }) {
  const router = useRouter();
  const [type, setType] = useState(initialType === 'found' ? 'found' : 'lost');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const today = new Date().toLocaleDateString('en-CA');
  const collectionPoints = locations.filter((l) => l.is_collection_point);
  const found = type === 'found';

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch('/api/items', { method: 'POST', body: new FormData(e.currentTarget) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error || 'Could not save the report');
    router.push(`/items/${data.itemId}?new=1`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <fieldset className="flex gap-2">
        <legend className="sr-only">Report type</legend>
        {['lost', 'found'].map((t) => (
          <label key={t}
                 className={`btn cursor-pointer ${type === t ? (t === 'lost' ? 'btn-lost' : 'btn-found') : 'btn-quiet'}`}>
            <input type="radio" name="reportType" value={t} checked={type === t}
                   onChange={() => setType(t)} className="sr-only" />
            {t === 'lost' ? 'I lost something' : 'I found something'}
          </label>
        ))}
      </fieldset>

      <div className="panel grid gap-4 p-5 sm:grid-cols-2">
        <div className="field sm:col-span-2">
          <label htmlFor="title">What is it?</label>
          <input id="title" name="title" className="input" required minLength={3} maxLength={120}
                 placeholder={found ? 'Black JBL headphones' : 'Grey Wildcraft backpack'} />
        </div>
        <div className="field sm:col-span-2">
          <label htmlFor="description">Describe it</label>
          <textarea id="description" name="description" className="input min-h-28" required minLength={10}
                    placeholder="Colour, marks, stickers, what was inside. More detail means better matches." />
          {found && <p className="hint">Leave out details only the owner would know. Use the question below for those.</p>}
        </div>
        <div className="field">
          <label htmlFor="categoryId">Category</label>
          <select id="categoryId" name="categoryId" className="input" required defaultValue="">
            <option value="" disabled>Choose</option>
            {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="eventDate">{found ? 'Date found' : 'Date lost'}</label>
          <input id="eventDate" name="eventDate" type="date" className="input" required max={today} defaultValue={today} />
        </div>
        <div className="field">
          <label htmlFor="locationId">{found ? 'Where you found it' : 'Where you last had it'}</label>
          <select id="locationId" name="locationId" className="input" required defaultValue="">
            <option value="" disabled>Choose</option>
            {locations.map((l) => (
              <option key={l.location_id} value={l.location_id}>{l.building} &ndash; {l.area}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="field">
            <label htmlFor="color">Colour</label>
            <input id="color" name="color" className="input" maxLength={30} />
          </div>
          <div className="field">
            <label htmlFor="brand">Brand</label>
            <input id="brand" name="brand" className="input" maxLength={50} />
          </div>
        </div>
        <div className="field sm:col-span-2">
          <label htmlFor="image">Photo (optional)</label>
          <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" className="input" />
        </div>
      </div>

      {found && (
        <div className="panel grid gap-4 p-5 sm:grid-cols-2">
          <div className="field sm:col-span-2">
            <label htmlFor="storageLocationId">Where did you hand it in?</label>
            <select id="storageLocationId" name="storageLocationId" className="input" required defaultValue="">
              <option value="" disabled>Choose a collection point</option>
              {collectionPoints.map((l) => (
                <option key={l.location_id} value={l.location_id}>{l.building} &ndash; {l.area}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="question">Ownership question (optional)</label>
            <input id="question" name="question" className="input" maxLength={200}
                   placeholder="What sticker is on the back?" />
            <p className="hint">Claimants must answer this. Staff see how close their answer is to yours.</p>
          </div>
          <div className="field">
            <label htmlFor="answer">Answer only the owner would know</label>
            <input id="answer" name="answer" className="input" maxLength={200} placeholder="hackathon sticker" />
            <p className="hint">Keep it short: just the key words.</p>
          </div>
        </div>
      )}

      {error && <p role="alert" className="font-medium text-lost">{error}</p>}
      <div>
        <button className={`btn ${found ? 'btn-found' : 'btn-lost'}`} disabled={busy}>
          {busy ? 'Saving...' : found ? 'Submit found item' : 'Submit lost report'}
        </button>
      </div>
    </form>
  );
}
