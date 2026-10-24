import ItemTag from '@/components/ItemTag';
import { getSession } from '@/lib/auth';
import { getLookups, searchItems } from '@/lib/data';
import { logSearch } from '@/lib/mongo';

export const dynamic = 'force-dynamic';

export default async function BrowsePage({ searchParams }) {
  const sp = await searchParams;
  const filters = {
    q: (sp.q ?? '').trim().slice(0, 200),
    mode: sp.mode === 'keyword' ? 'keyword' : 'semantic',
    type: sp.type ?? '',
    category: sp.category ?? '',
    location: sp.location ?? '',
    status: sp.status ?? '',
  };

  const [{ categories, locations }, { rows, mode }, session] = await Promise.all([
    getLookups(),
    searchItems(filters),
    getSession(),
  ]);

  if (filters.q) {
    await logSearch(session, {
      query: filters.q,
      mode,
      filters: { type: filters.type, category: filters.category, location: filters.location },
      resultCount: rows.length,
      topScore: rows[0]?.relevance ?? null,
    });
  }

  return (
    <>
      <h1 className="display text-4xl sm:text-5xl">
        {filters.type === 'lost' ? 'Lost reports' : filters.type === 'found' ? 'Found items' : 'Browse reports'}
      </h1>

      <form className="panel mt-6 grid gap-3 p-4 md:grid-cols-6">
        <div className="field md:col-span-3">
          <label htmlFor="q">Search</label>
          <input id="q" name="q" defaultValue={filters.q} className="input" placeholder="blue water bottle" />
        </div>
        <div className="field md:col-span-1">
          <label htmlFor="mode">Search by</label>
          <select id="mode" name="mode" defaultValue={filters.mode} className="input">
            <option value="semantic">Meaning (AI)</option>
            <option value="keyword">Exact words</option>
          </select>
        </div>
        <div className="field md:col-span-2">
          <label htmlFor="type">Show</label>
          <select id="type" name="type" defaultValue={filters.type} className="input">
            <option value="">Lost and found</option>
            <option value="lost">Lost reports only</option>
            <option value="found">Found items only</option>
          </select>
        </div>
        <div className="field md:col-span-2">
          <label htmlFor="category">Category</label>
          <select id="category" name="category" defaultValue={filters.category} className="input">
            <option value="">Any category</option>
            {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field md:col-span-2">
          <label htmlFor="location">Place</label>
          <select id="location" name="location" defaultValue={filters.location} className="input">
            <option value="">Anywhere on campus</option>
            {locations.map((l) => (
              <option key={l.location_id} value={l.location_id}>{l.building} &ndash; {l.area}</option>
            ))}
          </select>
        </div>
        <div className="field md:col-span-1">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={filters.status} className="input">
            <option value="">Still open</option>
            <option value="resolved">Resolved</option>
            <option value="all">All</option>
          </select>
        </div>
        <div className="flex items-end md:col-span-1">
          <button className="btn w-full">Apply</button>
        </div>
      </form>

      <p className="mt-6 text-sm text-muted">
        {rows.length} {rows.length === 1 ? 'result' : 'results'}
        {mode === 'semantic' && ', ranked by how close the meaning is'}
        {mode === 'keyword' && ', ranked by matching words'}
      </p>

      {rows.length === 0 ? (
        <div className="panel mt-4 p-6">
          <p className="font-semibold">Nothing matches yet.</p>
          <p className="mt-1 text-muted">
            Try fewer words, or report it as lost so you are notified the moment someone hands it in.
          </p>
          <a href="/items/new?type=lost" className="btn btn-lost mt-4">Report a lost item</a>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((item) => <ItemTag key={item.item_id} item={item} showRelevance={Boolean(filters.q)} />)}
        </div>
      )}
    </>
  );
}
