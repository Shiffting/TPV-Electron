import { useState, useEffect } from 'react';
import { login } from '../api/endpoints';
import { setToken, setBaseURL, getBaseURL, isTPVReady } from '../state/auth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setU] = useState('admin');
  const [password, setP] = useState('admin123');
  const [baseURL, setB] = useState(getBaseURL());
  const [err, setErr] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const nav = useNavigate();

  // Esperar a que window.tpv esté completamente listo
  useEffect(() => {
    const init = () => {
      if (isTPVReady()) {
        setB(getBaseURL());
        setReady(true);
      } else {
        setTimeout(init, 50);
      }
    };
    init();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!ready) {
    setErr('Esperando inicialización...');
    return;
  }

  setLoading(true);
  setErr(undefined);

  console.log('🔄 Intentando login con URL:', baseURL);   // ← debug

  try {
    setBaseURL(baseURL);

    const data = await login(username, password);
    
    console.log('✅ Login exitoso:', data);   // ← debug
    setToken(data.token);
    nav('/');
  } catch (error: any) {
    console.error('❌ Login error completo:', error);   // ← debug importante
    setErr(
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'No se pudo conectar con el servidor'
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="h-screen grid place-items-center bg-gray-50">
      <form onSubmit={onSubmit} className="w-[380px] bg-white p-6 rounded-2xl shadow space-y-4">
        <h1 className="text-2xl font-bold">Iniciar sesión</h1>
        
        <label className="block text-sm">
          Servidor
          <input 
            className="mt-1 w-full border p-2 rounded" 
            value={baseURL} 
            onChange={e => setB(e.target.value)} 
            disabled={!ready}
          />
        </label>

        <label className="block text-sm">Usuario
          <input 
            className="mt-1 w-full border p-2 rounded" 
            value={username} 
            onChange={e => setU(e.target.value)} 
          />
        </label>

        <label className="block text-sm">Contraseña
          <input 
            type="password" 
            className="mt-1 w-full border p-2 rounded" 
            value={password} 
            onChange={e => setP(e.target.value)} 
          />
        </label>

        {err && <div className="text-red-600 text-sm">{err}</div>}

        <button 
          type="submit" 
          disabled={loading || !ready}
          className="w-full py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {loading ? 'Conectando...' : !ready ? 'Cargando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}