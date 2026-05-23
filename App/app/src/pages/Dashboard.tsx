import { useEffect, useState } from "react";

import {
  BarChart3,
  Euro,
  Users,
  ShoppingBag,
} from "lucide-react";

import { getKpis } from "../api/endpoints";

import "../styles/dashboard.css";

// =========================================
// TYPES
// =========================================

type DashboardKpis = {
  hoy: {
    ventas: number;
    tickets: number;
    ticketMedio: number;
  };

  topProductos: {
    nombre: string;
    cantidad: number;
  }[];
};

// =========================================
// COMPONENT
// =========================================

export default function Dashboard() {
  const [k, setK] = useState<DashboardKpis | null>(
    null,
  );

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // =========================================
  // LOAD
  // =========================================

  useEffect(() => {
    async function cargar() {
      try {
        setError("");

        const data = await getKpis();

        setK(data);
      } catch (err) {
        console.error(err);

        setError(
          "No se pudo cargar el dashboard",
        );
      } finally {
        setLoading(false);
      }
    }

    cargar();

    const interval = setInterval(() => {
      cargar();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          Cargando dashboard...
        </div>
      </div>
    );
  }

  // =========================================
  // ERROR
  // =========================================

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">
          {error}
        </div>
      </div>
    );
  }

  // =========================================
  // FALLBACK
  // =========================================

  const hoy = k?.hoy || {
    ventas: 0,
    tickets: 0,
    ticketMedio: 0,
  };

  const topProductos = k?.topProductos || [];

  // =========================================
  // UI
  // =========================================

  return (
    <div className="dashboard-page">

      {/* HEADER */}

      <div className="dashboard-header">
        <div>
          <div className="dashboard-title">
            Dashboard
          </div>

          <div className="dashboard-subtitle">
            Resumen general del negocio
          </div>
        </div>
      </div>

      {/* KPIS */}

      <div className="dashboard-grid">

        {/* VENTAS */}

        <div className="dashboard-card">
          <div className="dashboard-card-top">

            <div className="dashboard-card-icon">
              <Euro size={22} />
            </div>

            <div className="dashboard-card-label">
              Ventas hoy
            </div>
          </div>

          <div className="dashboard-card-value">
            {Number(hoy.ventas).toFixed(2)} €
          </div>
        </div>

        {/* TICKETS */}

        <div className="dashboard-card">
          <div className="dashboard-card-top">

            <div className="dashboard-card-icon">
              <ShoppingBag size={22} />
            </div>

            <div className="dashboard-card-label">
              Tickets
            </div>
          </div>

          <div className="dashboard-card-value">
            {hoy.tickets}
          </div>
        </div>

        {/* TICKET MEDIO */}

        <div className="dashboard-card">
          <div className="dashboard-card-top">

            <div className="dashboard-card-icon">
              <Users size={22} />
            </div>

            <div className="dashboard-card-label">
              Ticket medio
            </div>
          </div>

          <div className="dashboard-card-value">
            {Number(hoy.ticketMedio).toFixed(2)} €
          </div>
        </div>

      </div>

      {/* TOP PRODUCTOS */}

      <div className="dashboard-section">

        <div className="dashboard-section-title">
          <BarChart3 size={18} />
          Productos más vendidos
        </div>

        <div className="dashboard-products">

          {topProductos.length === 0 && (
            <div className="dashboard-empty">
              No hay datos todavía
            </div>
          )}

          {topProductos.map((p, i) => (
            <div
              key={i}
              className="dashboard-product"
            >
              <div className="dashboard-product-name">
                {p.nombre}
              </div>

              <div className="dashboard-product-count">
                {p.cantidad}
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}