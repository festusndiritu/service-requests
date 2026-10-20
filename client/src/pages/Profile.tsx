import { LogOut } from 'lucide-react';
import { PageHeader } from '../components/ui';
import { useAuth } from '../lib/auth';
import { initials } from '../lib/format';

export default function Profile() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const details = [
    ['Email', user.email],
    ['ID number', user.idNumber],
    ['Phone', user.phone],
    ['Account type', user.role === 'ADMIN' ? 'Administrator' : 'Citizen'],
  ];

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Profile" />
      <section className="card p-6">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">{initials(user.fullName)}</span>
          <p className="text-lg font-semibold text-slate-900">{user.fullName}</p>
        </div>
        <dl className="mt-6 divide-y divide-slate-100 text-sm">
          {details.map(([term, value]) => (
            <div key={term} className="flex justify-between gap-4 py-3">
              <dt className="text-slate-500">{term}</dt>
              <dd className="break-all text-right font-medium text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
        <button onClick={logout} className="btn-outline mt-6 w-full">
          <LogOut size={16} /> Log out
        </button>
      </section>
    </div>
  );
}
