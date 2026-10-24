import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="py-16">
      <h1 className="display text-5xl">Not here</h1>
      <p className="mt-3 text-muted">This page or report does not exist, or it has not been approved yet.</p>
      <Link href="/items" className="btn mt-6">Browse reports</Link>
    </div>
  );
}
