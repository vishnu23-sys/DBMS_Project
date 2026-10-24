'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Sends a JSON request to the API, then refreshes the page's server data.
export default function ActionButton({
  url, method = 'PATCH', body, label, busyLabel, confirm, className = 'btn btn-sm', redirectTo,
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function run() {
    if (confirm && !window.confirm(confirm)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Request failed');
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" className={className} onClick={run} disabled={busy}>
        {busy ? busyLabel ?? label : label}
      </button>
      {error && <span role="alert" className="text-xs text-lost">{error}</span>}
    </span>
  );
}
