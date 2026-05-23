import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  setToken,
} from "../state/auth";
import PinModal from "../components/PinModal";

import "../styles/login.css";

const API_URL = "http://localhost:8080";

export default function Login() {
  const navigate = useNavigate();

  const [email, setU] = useState("");
  const [password, setP] = useState("");

  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");

  const [showPin, setShowPin] = useState(false);

  // =====================================
  // BOOTSTRAP
  // =====================================

  useEffect(() => {
    const token = localStorage.getItem("tpv_token");

    // Ya hay sesión
    if (token) {
      navigate("/app/mesas");
      return;
    }

    setReady(true);
  }, [navigate]);

  // =====================================
  // LOGIN
  // =====================================

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (loading) return;

    setErr("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${API_URL}/auth/login`,
        {
          email,
          password,
        },
      );

      const token = res.data.token;
      const user = res.data.user;

      // =====================================
      // GUARDAR SESIÓN
      // =====================================

      setToken(token);
      window.tpv.set("user", user);

      // PIN EMPLEADO
      setShowPin(true);
    } catch (e: any) {
      console.error(e);

      setErr(
        e?.response?.data?.error ||
        "No se pudo iniciar sesión",
      );
    } finally {
      setLoading(false);
    }
  }

  async function onPinSubmit(pin: string) {
    try {
      const token = localStorage.getItem("tpv_token");

      const res = await axios.post(
        `${API_URL}/empleados/pin-login`,
        {
          pin,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const empleado = res.data.empleado;

      window.tpv.set(
        "empleado",
        empleado,
      );

      navigate("/app/mesas");
    } catch (e: any) {
      throw new Error(
        e?.response?.data?.error ||
        "PIN incorrecto",
      );
    }
  }

  return (
    <div className="login-page">
      <form onSubmit={onSubmit} className="login-card">
        {/* LOGO */}

        <div className="login-logo">🍽️</div>

        {/* TITLES */}

        <div className="login-title">TPV</div>

        <div className="login-subtitle">
          Acceso al sistema
        </div>

        {/* USER */}

        <div className="login-group">
          <label className="login-label">
            Usuario
          </label>

          <input
            className="login-input"
            value={email}
            onChange={(e) => setU(e.target.value)}
            autoComplete="email"
            placeholder="Usuario"
          />
        </div>

        {/* PASSWORD */}

        <div className="login-group">
          <label className="login-label">
            Contraseña
          </label>

          <input
            type="password"
            className="login-input"
            value={password}
            onChange={(e) => setP(e.target.value)}
            autoComplete="current-password"
            placeholder="Contraseña"
          />
        </div>

        {/* ERROR */}

        {err && (
          <div className="login-error">{err}</div>
        )}

        {/* BUTTON */}

        <button
          type="submit"
          disabled={
            loading ||
            !ready ||
            !email.trim() ||
            !password.trim()
          }
          className="login-button"
        >
          {loading
            ? "Conectando..."
            : !ready
              ? "Cargando..."
              : "Entrar"}
        </button>
      </form>
      {showPin && (
        <PinModal
          title="Acceso empleado"
          onSubmit={onPinSubmit}
        />
      )}
    </div>
  );
}