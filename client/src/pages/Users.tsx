import { TableSkeleton } from '../components/Skeletons';
import { ErrorMessage, PageHeader } from '../components/ui';
import { formatDate } from '../lib/format';
import { useApi } from '../lib/hooks';
import type { UserRow } from '../lib/types';

export default function Users() {
  const { data, error } = useApi<UserRow[]>('/users');

  if (error && !data) return <ErrorMessage>{error}</ErrorMessage>;

  return (
    <>
      <PageHeader title="Users" subtitle={data ? `${data.length} registered accounts` : 'Registered accounts'} />
      {!data ? (
        <TableSkeleton />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">ID number</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 text-right font-semibold">Requests</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{u.fullName}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.idNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{u.phone}</td>
                  <td className="px-4 py-3 text-slate-600">{u.role === 'ADMIN' ? 'Admin' : 'Citizen'}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">{u.requestCount}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
