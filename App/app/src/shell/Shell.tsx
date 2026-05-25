import {
  Outlet,
  NavLink,
  useNavigate,
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  LayoutDashboard,
  UtensilsCrossed,
  ChefHat,
  LogOut,
  User,
  BarChart3,
} from "lucide-react";

import { getToken } from "../state/auth";

import {
  getFeatures,
  logout,
} from "../lib/auth";

import { useState } from "react";
import PinModal from "../components/PinModal";
import axios from "axios";

import "../styles/layout-shell.css";

export default function Shell() {

  const nav =
    useNavigate();

  const location =
    useLocation();

  const features =
    getFeatures();

  const token =
    getToken();

  const isOperationalView =
    location.pathname.includes("mesas") ||
    location.pathname.includes("estaciones") ||
    location.pathname.includes("ticket");

  const [
    sidebarExpanded,
    setSidebarExpanded,
  ] = useState(!isOperationalView);

  const sidebarCollapsed =
    isOperationalView &&
    !sidebarExpanded;

  const [
    empleado,
    setEmpleado,
  ] = useState(() => {

    try {

      const raw =
        localStorage.getItem(
          "empleado",
        );

      if (!raw) {
        return null;
      }

      return JSON.parse(raw);

    } catch {

      localStorage.removeItem(
        "empleado",
      );

      return null;
    }
  });

  const rol =
    empleado?.rol ||
    "camarero";

  const [
    showPinModal,
    setShowPinModal,
  ] = useState(false);

  if (!token) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  const canDashboard =
    [
      "admin",
      "encargado",
    ].includes(rol);

  const canMesas =
    [
      "admin",
      "encargado",
      "camarero",
      "caja",
    ].includes(rol);

  const canEstaciones =
    [
      "admin",
      "encargado",
      "cocina",
    ].includes(rol);

  async function cambiarEmpleado(
    pin: string,
  ) {

    const token =
      localStorage.getItem(
        "tpv_token",
      );

    const res =
      await axios.post(
        "http://localhost:8080/empleados/pin-login",
        { pin },
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      );

    const nuevoEmpleado =
      res.data.empleado;

    localStorage.setItem(
      "empleado",
      JSON.stringify(
        nuevoEmpleado,
      ),
    );

    setEmpleado(
      nuevoEmpleado,
    );

    setShowPinModal(false);
  }

  const currentTitle = (() => {

    if (
      location.pathname.includes(
        "dashboard",
      )
    ) {
      return "Centro operativo";
    }

    if (
      location.pathname.includes(
        "mesas",
      )
    ) {
      return "Mesas";
    }

    if (
      location.pathname.includes(
        "estaciones",
      )
    ) {
      return "Estaciones";
    }

    return "TPV";
  })();

  return (

    <div
      className={`
          tpv-shell
          ${sidebarCollapsed
          ? "sidebar-collapsed"
          : ""
        }
          ${isOperationalView
          ? "operational-mode"
          : ""
        }
      `}
    >

      {/* SIDEBAR */}

      <aside className="
        tpv-sidebar
      ">

        <button
          className="
            tpv-sidebar-toggle
          "
          onClick={() =>
            setSidebarExpanded(
              !sidebarExpanded,
            )
          }
        >
          ☰
        </button>

        {/* LOGO */}

        <div className="
          tpv-sidebar-logo
        ">
          TPV
        </div>

        {/* NAV */}

        <nav className="
          tpv-sidebar-nav
        ">

          {canDashboard &&
            features.includes(
              "dashboard",
            ) && (

              <NavLink
                to="/app/dashboard"
                className={(
                  {
                    isActive,
                  },
                ) =>
                  `
                tpv-sidebar-link
                ${isActive
                    ? "active"
                    : ""
                  }
              `
                }
              >

                <BarChart3
                  size={20}
                />

                {!sidebarCollapsed && (
                  <span>
                    KPI
                  </span>
                )}

              </NavLink>
            )}

          {canMesas &&
            features.includes(
              "waiter",
            ) && (

              <NavLink
                to="/app/mesas"
                className={(
                  {
                    isActive,
                  },
                ) =>
                  `
                tpv-sidebar-link
                ${isActive
                    ? "active"
                    : ""
                  }
              `
                }
              >

                <UtensilsCrossed
                  size={20}
                />

                {!sidebarCollapsed && (
                  <span>
                    Mesas
                  </span>
                )}

              </NavLink>
            )}

          {canEstaciones &&
            features.includes(
              "kitchen",
            ) && (

              <NavLink
                to="/app/estaciones"
                className={(
                  {
                    isActive,
                  },
                ) =>
                  `
                tpv-sidebar-link
                ${isActive
                    ? "active"
                    : ""
                  }
              `
                }
              >

                <ChefHat
                  size={20}
                />

                {!sidebarCollapsed && (
                  <span>
                    Estaciones
                  </span>
                )}

              </NavLink>
            )}

        </nav>

        {/* BOTTOM */}

        <div className="
          tpv-sidebar-bottom
        ">
          <button
            className={`
              tpv-sidebar-user
              ${sidebarCollapsed
                ? "collapsed"
                : ""
              }
            `}

            onClick={() =>
              setShowPinModal(
                true,
              )
            }
          >

            <div className="
              tpv-sidebar-avatar
            ">
              {
                empleado?.nombre?.[0]
                  ?.toUpperCase()
              }
            </div>

            {!sidebarCollapsed && (
              <>

                <div className="
                    tpv-sidebar-user-name
                  ">
                  {empleado?.nombre}
                </div>

                <div className="
                    tpv-sidebar-user-role
                  ">
                  {rol}
                </div>

              </>
            )}

          </button>

          <button
            className="
              tpv-sidebar-logout
            "
            onClick={() => {

              logout();

              localStorage.removeItem(
                "empleado",
              );

              nav("/login");
            }}
          >

            <LogOut size={18} />

            {!sidebarCollapsed && (
              <span>
                Salir
              </span>
            )}

          </button>

        </div>

      </aside>

      {/* MAIN */}

      <div className="
        tpv-main
      ">

        {/* CONTENT */}

        <main className="
          tpv-shell-content
        ">

          <Outlet />

        </main>

      </div>

      {/* PIN */}

      {showPinModal && (

        <PinModal
          title="
            Cambiar empleado
          "
          onSubmit={
            cambiarEmpleado
          }
          onClose={() =>
            setShowPinModal(
              false,
            )
          }
        />
      )}

    </div>
  );
}