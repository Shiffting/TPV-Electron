import { useState, useEffect } from 'react';
import { login } from '../api/endpoints';
import { setToken, setBaseURL, getBaseURL, isTPVReady } from '../state/auth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const nav = useNavigate();

  const [username, setU] = useState('admin');
  const [password, setP] = useState('1234');
  const [baseURL, setB] = useState<string>(''); // empezamos vacío
  const [err, setErr] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // Cargar baseURL solo una vez cuando tpv esté listo
  useEffect(() => {
    const init = () => {
      if (isTPVReady()) {
        const url = getBaseURL();
        setB(url);
        setReady(true);
      } else {
        setTimeout(init, 50);
      }
    };
    init();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;

    setLoading(true);
    setErr(undefined);

    try {
      // Solo guardamos si cambió
      if (baseURL !== getBaseURL()) {
        setBaseURL(baseURL);
      }

      const data = await login(username, password);
      
      console.log('✅ Login exitoso');
      setToken(data.token);           // ya no hace falta await

      console.log('🔄 Navegando a /');
      nav('/', { replace: true });

    } catch (error: any) {
      console.error(error);
      setErr(error?.response?.data?.error || error?.message || 'Error desconocido');
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