import ActionButton from '@/components/ActionButton';
import { requireUser } from '@/lib/auth';
import { getUsers } from '@/lib/data';
import { fmtDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const session = await requireUser(['admin']);
  const users = await getUsers();

  return (
    <>
      <h1 className="display text-4xl sm:text-5xl">Users</h1>
      <p className="mt-2 text-muted">{users.length} accounts. Promote security or library staff so they can review claims.</p>
      <div className="panel mt-6 overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Role</th><th>Dept</th><th className="num">Reports</th><th className="num">Claims</th>
                <th className="num">Reputation</th><th>Last sign-in</th><th></th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id} className={u.is_active ? '' : 'opacity-50'}>
                <td><div className="font-semibold">{u.name}</div><div className="text-xs text-muted">{u.email} {u.srn}</div></td>
                <td className="capitalize">{u.role}{!u.is_active && ' (deactivated)'}</td>
                <td>{u.dept ?? '-'}</td>
                <td className="num">{u.reports}</td>
                <td className="num">{u.claims}</td>
                <td className="num">{u.reputation}</td>
                <td className="whitespace-nowrap text-sm">{u.last_login_at ? fmtDateTime(u.last_login_at) : 'Never'}</td>
                <td className="whitespace-nowrap">
                  {u.user_id !== session.userId && (
                    <div className="flex gap-2">
                      {u.role === 'student' && (
                        <ActionButton url={`/api/admin/users/${u.user_id}`} body={{ role: 'staff' }} label="Make staff" className="btn btn-quiet btn-sm" />
                      )}
                      {u.role === 'staff' && (
                        <ActionButton url={`/api/admin/users/${u.user_id}`} body={{ role: 'student' }} label="Remove staff" className="btn btn-quiet btn-sm" />
                      )}
                      <ActionButton url={`/api/admin/users/${u.user_id}`} body={{ isActive: !u.is_active }}
                                    label={u.is_active ? 'Deactivate' : 'Reactivate'} className="btn btn-quiet btn-sm"
                                    confirm={u.is_active ? `Deactivate ${u.name}? They will not be able to sign in.` : undefined} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
