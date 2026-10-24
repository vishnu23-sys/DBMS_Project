import Link from 'next/link';
import { daysAgo, statusText, tagNumber } from '@/lib/format';
import StatusPill from './StatusPill';

export default function ItemTag({ item, showRelevance = false }) {
  const lost = item.report_type === 'lost';
  return (
    <Link href={`/items/${item.item_id}`} className={`tag ${lost ? 'tag-lost' : 'tag-found'}`}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className={`font-semibold ${lost ? 'text-lost' : 'text-found'}`}>{lost ? 'Lost' : 'Found'}</span>
        <span className="tag-no text-ink/70">{tagNumber(item.item_id)}</span>
      </div>
      <h3 className="heading mt-1 text-lg">{item.title}</h3>
      <p className="mt-1 text-sm text-ink/80">
        {item.building}, {item.area} &ndash; {daysAgo(item.event_date)}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-ink/70">{item.category}</span>
        {item.status !== 'open' && <StatusPill status={item.status} label={statusText[item.status]} />}
        {showRelevance && item.relevance != null && (
          <span className="ml-auto font-semibold">{Math.round(item.relevance * 100)}% match</span>
        )}
      </div>
    </Link>
  );
}
