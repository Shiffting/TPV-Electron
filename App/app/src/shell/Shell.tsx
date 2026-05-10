import { Outlet, Link, useNavigate } from "react-router-dom";
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
        {/* =================================================
          LOGO
      ================================================== */}
        <div className="tpv-shell-logo">TPV</div>

        {/* =================================================
          NAVEGACIÓN
      ================================================== */}
        <nav className="tpv-shell-nav">
          {/* DASHBOARD */}
          <Link to="/" className="tpv-shell-link">
            <span className="tpv-shell-icon">📊</span>

            <span className="tpv-shell-label">KPI</span>
          </Link>

          {/* MESAS */}
          <Link to="/mesas" className="tpv-shell-link">
            <span className="tpv-shell-icon">🍽️</span>

            <span className="tpv-shell-label">Mesas</span>
          </Link>
        </nav>

        {/* =================================================
          FOOTER SIDEBAR
      ================================================== */}
        <div className="mt-auto flex flex-col gap-3">
          {/* Usuario */}
          <div className="tpv-shell-user">
            <div className="tpv-shell-user-avatar">A</div>

            <div className="tpv-shell-user-info">
              <div className="tpv-shell-user-name">Admin</div>

              <div className="tpv-shell-user-role">Caja principal</div>
            </div>
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
