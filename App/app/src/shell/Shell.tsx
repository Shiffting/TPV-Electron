import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getToken } from '../state/auth';

export default function Shell(){
  const nav = useNavigate();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) nav('/login');
    else setOk(true);
  }, []);

  if (!ok) return null;

  return (
    <div className="h-screen flex">
      <aside className="w-56 border-r p-4 space-y-3">
        <h1 className="text-xl font-bold">TPV</h1>
        <nav className="flex flex-col gap-2">
          <Link to="/" className="hover:underline">Dashboard</Link>
          <Link to="/mesas" className="hover:underline">Mesas</Link>
        </nav>
      </aside>
      <main className="flex-1 p-6 overflow-auto bg-gray-50">
        <Outlet/>
      </main>
    </div>
  );
}
