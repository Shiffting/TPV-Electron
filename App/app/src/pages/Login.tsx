import { useState, useEffect } from "react";
import { login } from "../api/endpoints";
import { setToken, setBaseURL, getBaseURL, isTPVReady } from "../state/auth";
import { useNavigate } from "react-router-dom";
import { saveAuth } from "../lib/auth";
import "../styles/login.css";

export default function Login() {
  const nav = useNavigate();

  const [username, setU] = useState("admin");
  const [password, setP] = useState("1234");
  const [baseURL, setB] = useState<string>(""); // empezamos vacío
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

      console.log("✅ Login exitoso");
      saveAuth(data);

      // Login principal, me lleva a x sitio segun sea necesario tras el login
      console.log("🔄 Navegando a /");
      if (data.features.includes("dashboard")) {
        nav("/app/dashboard", { replace: true });
      } else if (data.features.includes("kitchen")) {
        nav("/app/cocina", { replace: true });
      } else {
        nav("/app/mesas", { replace: true });
      }
    } catch (error: any) {
      console.error(error);
      setErr(
        error?.response?.data?.error || error?.message || "Error desconocido",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form onSubmit={onSubmit} className="login-card">
        {/* LOGO */}

        <div className="login-logo">🍽️</div>

        {/* TITLES */}

        <div className="login-title">TPV</div>

        <div className="login-subtitle">Acceso al sistema</div>

        {/* SERVER */}

        <div className="login-group">
          <label className="login-label">Servidor</label>

          <input
            className="login-input"
            value={baseURL}
            onChange={(e) => setB(e.target.value)}
            disabled={!ready}
          />
        </div>

        {/* USER */}

        <div className="login-group">
          <label className="login-label">Usuario</label>

          <input
            className="login-input"
            value={username}
            onChange={(e) => setU(e.target.value)}
          />
        </div>

        {/* PASSWORD */}

        <div className="login-group">
          <label className="login-label">Contraseña</label>

          <input
            type="password"
            className="login-input"
            value={password}
            onChange={(e) => setP(e.target.value)}
          />
        </div>

        {/* ERROR */}

        {err && <div className="login-error">{err}</div>}

        {/* BUTTON */}

        <button
          type="submit"
          disabled={loading || !ready}
          className="login-button"
        >
          {loading ? "Conectando..." : !ready ? "Cargando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
