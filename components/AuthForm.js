'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AuthForm({ mode, departments = [] }) {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const register = mode === 'register';

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch(`/api/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error || 'Request failed');
    router.push(data.role === 'staff' || data.role === 'admin' ? '/admin' : '/dashboard');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="panel grid gap-4 p-6">
      {register && (
        <>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" className="input" required minLength={2} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="srn">SRN</label>
              <input id="srn" name="srn" className="input uppercase" required placeholder="PES1UG24CS045" />
            </div>
            <div className="field">
              <label htmlFor="deptId">Department</label>
              <select id="deptId" name="deptId" className="input" required defaultValue="">
                <option value="" disabled>Choose</option>
                {departments.map((d) => <option key={d.dept_id} value={d.dept_id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="phone">Phone (optional)</label>
            <input id="phone" name="phone" className="input" inputMode="tel" />
          </div>
        </>
      )}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input" required autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" className="input" required
               minLength={register ? 8 : 1} autoComplete={register ? 'new-password' : 'current-password'} />
        {register && <p className="hint">At least 8 characters, including a number.</p>}
      </div>
      {error && <p role="alert" className="text-sm font-medium text-lost">{error}</p>}
      <button className="btn" disabled={busy}>{register ? 'Create account' : 'Sign in'}</button>
      <p className="text-sm text-muted">
        {register ? (
          <>Already have an account? <Link href="/login" className="underline">Sign in</Link></>
        ) : (
          <>New here? <Link href="/register" className="underline">Create an account</Link></>
        )}
      </p>
    </form>
  );
}
