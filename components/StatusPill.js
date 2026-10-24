import { statusText } from '@/lib/format';

const tone = {
  pending: 'bg-warn/15 text-warn',
  matched: 'bg-found/15 text-found',
  suggested: 'bg-found/15 text-found',
  claimed: 'bg-ink/10 text-ink',
  approved: 'bg-found/15 text-found',
  confirmed: 'bg-found/15 text-found',
  returned: 'bg-found text-paper',
  rejected: 'bg-lost/15 text-lost',
  dismissed: 'bg-ink/10 text-muted',
  withdrawn: 'bg-ink/10 text-muted',
  closed: 'bg-ink/10 text-muted',
};

export default function StatusPill({ status, label }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${tone[status] ?? 'bg-ink/10 text-ink'}`}>
      {label ?? statusText[status] ?? status}
    </span>
  );
}
