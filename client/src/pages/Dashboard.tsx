import { useAuth } from '../lib/auth';
import AdminDashboard from './AdminDashboard';
import CitizenDashboard from './CitizenDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  return user?.role === 'ADMIN' ? <AdminDashboard /> : <CitizenDashboard />;
}
