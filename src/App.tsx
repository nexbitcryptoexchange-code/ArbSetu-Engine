import {useEffect, useState} from 'react';
import {AuthProvider, useAuth} from '@/context/AuthContext';
import AuthPage from '@/pages/AuthPage';
import DashboardPage from '@/pages/DashboardPage';
import GamePage from '@/pages/GamePage';
import AdminPage from '@/pages/AdminPage';

export type Route = 'login' | 'dashboard' | 'play' | 'admin';

function currentRoute(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash === 'login') return 'login';
  if (hash === 'play') return 'play';
  if (hash === 'admin') return 'admin';
  return 'dashboard';
}

function Router() {
  const {user, loading} = useAuth();
  const [route, setRoute] = useState<Route>(currentRoute);

  useEffect(() => {
    const onHash = () => setRoute(currentRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-arcade-bg">
        <p className="font-retro text-sm text-arcade-gold animate-pulse">LOADING…</p>
      </div>
    );
  }

  // Signed out users always land on the auth page.
  if (!user) {
    return <AuthPage />;
  }

  if (route === 'login') {
    return <DashboardPage />;
  }

  if (route === 'play') return <GamePage />;
  if (route === 'admin') {
    return user.role === 'admin' ? <AdminPage /> : <DashboardPage />;
  }
  return <DashboardPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
