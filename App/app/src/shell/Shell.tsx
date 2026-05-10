import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getToken } from '../state/auth';

export default function Shell() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    console.log('Shell check token:', !!token);

    if (!token) {
      console.log('❌ No token → redirigiendo a /login');
      nav('/login', { replace: true });
    } else {
      console.log('✅ Token válido → mostrando Shell');
      setReady(true);
    }
  }, [nav]);

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-900 text-white text-xl">
        Cargando aplicación...
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      <aside className="w-64 bg-zinc-800 p-4 border-r border-zinc-700">
        <h1 className="text-2xl font-bold mb-6">TPV</h1>
        <nav className="space-y-2">
          <Link to="/" className="block px-4 py-2 rounded hover:bg-zinc-700">Dashboard</Link>
          <Link to="/mesas" className="block px-4 py-2 rounded hover:bg-zinc-700">Mesas</Link>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto bg-zinc-900 p-6">
        <Outlet />
      </main>
    </div>
  );
}