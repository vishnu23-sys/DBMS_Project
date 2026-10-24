import Link from 'next/link';
import ItemTag from '@/components/ItemTag';
import { getHomeStats, getRecentItems } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [stats, found, lost] = await Promise.all([
    getHomeStats(),
    getRecentItems('found'),
    getRecentItems('lost'),
  ]);

  return (
    <>
      <section className="pb-10 pt-6">
        <h1 className="display max-w-3xl text-5xl sm:text-7xl">What did you lose?</h1>
        <form action="/items" className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
          <label htmlFor="q" className="sr-only">Describe the item</label>
          <input
            id="q"
            name="q"
            className="input flex-1 py-3 text-lg"
            placeholder="black headphones near the library"
            autoComplete="off"
          />
          <button className="btn px-6 py-3 text-base">Search</button>
        </form>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Describe it the way you would to a friend. Search understands meaning, so &ldquo;earphones&rdquo; finds
          &ldquo;AirPods&rdquo; too.
        </p>
        <p className="mt-8 max-w-2xl text-lg">
          {stats.waiting} found items are waiting at collection points right now. {stats.returned} have gone back to
          their owners, usually within {stats.avg_days ?? '-'} days.{' '}
          <Link href="/items/new?type=found" className="font-semibold text-found underline underline-offset-4">
            Found something? Hand it in
          </Link>
        </p>
      </section>

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="heading text-2xl">Just handed in</h2>
            <Link href="/items?type=found" className="text-sm underline">All found items</Link>
          </div>
          <div className="grid gap-3">
            {found.map((item) => <ItemTag key={item.item_id} item={item} />)}
          </div>
        </section>
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="heading text-2xl">Still looking for</h2>
            <Link href="/items?type=lost" className="text-sm underline">All lost reports</Link>
          </div>
          <div className="grid gap-3">
            {lost.map((item) => <ItemTag key={item.item_id} item={item} />)}
          </div>
        </section>
      </div>
    </>
  );
}
