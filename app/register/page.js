import AuthForm from '@/components/AuthForm';
import { getLookups } from '@/lib/data';

export default async function RegisterPage() {
  const { departments } = await getLookups();
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="display mb-2 text-4xl">Create an account</h1>
      <p className="mb-6 text-muted">Use your SRN so staff can confirm who you are when you collect an item.</p>
      <AuthForm mode="register" departments={departments} />
    </div>
  );
}
