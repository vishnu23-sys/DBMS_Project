import AuthForm from '@/components/AuthForm';

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="display mb-6 text-4xl">Sign in</h1>
      <AuthForm mode="login" />
      <details className="mt-6 text-sm text-muted">
        <summary className="cursor-pointer">Demo accounts</summary>
        <p className="mt-2">
          All seeded accounts share the password in the README. Try admin@campus.edu (admin),
          security@campus.edu (staff) or vishnu@campus.edu (student).
        </p>
      </details>
    </div>
  );
}
