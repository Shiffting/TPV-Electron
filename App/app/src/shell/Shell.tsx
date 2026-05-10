import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getToken } from "../state/auth";

export default function Shell() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    console.log("Shell check token:", !!token);

    if (!token) {
      console.log("❌ No token → redirigiendo a /login");
      nav("/login", { replace: true });
    } else {
      console.log("✅ Token válido → mostrando Shell");
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
    <div className="h-screen w-screen flex overflow-hidden bg-[#f4f6fb]">
      {/* =====================================================
        SIDEBAR
    ====================================================== */}
      <aside className="tpv-shell-sidebar">
        {/* LOGO */}

        <div className="tpv-shell-logo">TPV</div>

        {/* =========================================
      OPERACIÓN
  ========================================= */}

        <div className="tpv-shell-section">
          <div className="tpv-shell-section-title">OPERAR</div>

          <nav className="tpv-shell-nav">
            {/* DASHBOARD */}

            <NavLink
              to="/"
              className={({ isActive }) =>
                `tpv-shell-link ${isActive ? "active" : ""}`
              }
            >
              <span className="tpv-shell-icon">📊</span>

              <span className="tpv-shell-label">KPI</span>
            </NavLink>

            {/* MESAS */}

            <NavLink
              to="/mesas"
              className={({ isActive }) =>
                `tpv-shell-link ${isActive ? "active" : ""}`
              }
            >
              <span className="tpv-shell-icon">🍽️</span>

              <span className="tpv-shell-label">Mesas</span>
            </NavLink>

            {/* COCINA */}

            <NavLink
              to="/cocina"
              className={({ isActive }) =>
                `tpv-shell-link ${isActive ? "active" : ""}`
              }
            >
              <span className="tpv-shell-icon">👨‍🍳</span>

              <span className="tpv-shell-label">Cocina</span>
            </NavLink>
          </nav>
        </div>

        {/* SPACER */}

        <div style={{ flex: 1 }} />

        {/* =========================================
      USER
  ========================================= */}

        <div className="tpv-shell-user">
          <div className="tpv-shell-user-avatar">A</div>

          <div className="tpv-shell-user-info">
            <div className="tpv-shell-user-name">Admin</div>

            <div className="tpv-shell-user-role">Caja principal</div>
          </div>
        </div>
      </aside>

      {/* =====================================================
        CONTENIDO PRINCIPAL
    ====================================================== */}
      <main
        className="
    flex-1
    overflow-hidden
    bg-[#f4f5f8]
    p-5
  "
      >
        <Outlet />
      </main>
    </div>
  );
}
