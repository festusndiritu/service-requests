import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { GuestOnly, RequireAuth, RequireRole } from './components/guards';
import { PageSkeleton } from './components/Skeletons';
import { useAuth } from './lib/auth';
import Dashboard from './pages/Dashboard';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import RequestDetail from './pages/RequestDetail';
import Requests from './pages/Requests';
import Users from './pages/Users';

// Screens that are large (charts) or not needed right away download on demand
const loadAnalytics = () => import('./pages/Analytics');
const loadNewRequest = () => import('./pages/NewRequest');
const Analytics = lazy(loadAnalytics);
const NewRequest = lazy(loadNewRequest);
const Landing = lazy(() => import('./pages/Landing'));
const Auth = lazy(() => import('./pages/Auth'));
const Track = lazy(() => import('./pages/Track'));

export default function App() {
  const { user } = useAuth();

  // Once signed in, fetch the screen the person is most likely to open next while the browser is idle
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => void (user.role === 'ADMIN' ? loadAnalytics() : loadNewRequest()), 1500);
    return () => clearTimeout(timer);
  }, [user]);

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-16">
          <PageSkeleton />
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route element={<GuestOnly />}>
          <Route path="/track" element={<Track />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth />} />
          <Route path="/forgot-password" element={<Auth />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/requests/:id" element={<RequestDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />

          <Route element={<RequireRole role="CITIZEN" />}>
            <Route path="/requests/new" element={<NewRequest />} />
          </Route>

          <Route element={<RequireRole role="ADMIN" />}>
            <Route path="/users" element={<Users />} />
            <Route path="/analytics" element={<Analytics />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
