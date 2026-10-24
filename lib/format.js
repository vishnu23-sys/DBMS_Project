export const tagNumber = (id) => `No. ${String(id).padStart(4, '0')}`;

export function fmtDate(value) {
  if (!value) return '';
  const d = typeof value === 'string' && value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export function daysAgo(value) {
  const d = new Date(typeof value === 'string' && value.length === 10 ? `${value}T00:00:00` : value);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

export const statusText = {
  pending: 'Waiting for review',
  open: 'Open',
  matched: 'Possible match',
  claimed: 'Claim approved',
  returned: 'Returned',
  closed: 'Closed',
  rejected: 'Rejected',
  approved: 'Approved',
  withdrawn: 'Withdrawn',
  suggested: 'Suggested',
  confirmed: 'Confirmed',
  dismissed: 'Dismissed',
};

export const pct = (v) => (v == null ? '-' : `${Math.round(v * 100)}%`);
