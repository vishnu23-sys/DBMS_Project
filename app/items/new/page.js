import ReportForm from '@/components/ReportForm';
import { requireUser } from '@/lib/auth';
import { getLookups } from '@/lib/data';

export default async function NewItemPage({ searchParams }) {
  const session = await requireUser();
  const { type } = await searchParams;
  const { categories, locations } = await getLookups();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="display mb-2 text-4xl sm:text-5xl">Report an item</h1>
      <p className="mb-6 max-w-2xl text-muted">
        {session.role === 'student'
          ? 'Staff check each report before it is listed, usually within a few hours. Matching reports are found automatically.'
          : 'Reports filed by staff are listed immediately.'}
      </p>
      <ReportForm categories={categories} locations={locations} initialType={type} />
    </div>
  );
}
