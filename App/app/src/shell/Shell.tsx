import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { getToken } from "../state/auth";
import { getFeatures } from "../lib/auth";
import { Navigate } from "react-router-dom";
import { logout } from "../lib/auth";
import "../styles/shell.css";

export default function Shell() {
  const nav = useNavigate();
  const features = getFeatures();
  const token = getToken();

  if (!token) {
    return <Navigate to="/pin" replace />;
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

            {features.includes("dashboard") && (
              <NavLink
                to="/app/dashboard"
                className={({ isActive }) =>
                  `tpv-shell-link ${isActive ? "active" : ""}`
                }
              >
                <span className="tpv-shell-icon">📊</span>

                <span className="tpv-shell-label">KPI</span>
              </NavLink>
            )}

            {/* MESAS */}

            {features.includes("waiter") && (
              <NavLink
                to="/app/mesas"
                className={({ isActive }) =>
                  `tpv-shell-link ${isActive ? "active" : ""}`
                }
              >
                <span className="tpv-shell-icon">🍽️</span>

                <span className="tpv-shell-label">Mesas</span>
              </NavLink>
            )}

            {/* COCINA */}

            {features.includes("kitchen") && (
                <NavLink
                  to="/app/cocina"
                  className={({ isActive }) =>
                    `tpv-shell-link ${isActive ? "active" : ""}`
                  }
                >
                  <span className="tpv-shell-icon">👨‍🍳</span>

                  <span className="tpv-shell-label">Cocina</span>
                </NavLink>
              )}
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
        <button
          onClick={() => {
            logout();
            nav("/login");
          }}
          className="tpv-shell-link"
        >
          <span className="tpv-shell-icon">🚪</span>

          <span className="tpv-shell-label">Salir</span>
        </button>
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
