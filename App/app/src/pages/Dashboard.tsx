import { useEffect, useState } from "react";
import { getKpis } from "../api/endpoints";
import { socket } from "../lib/socket";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  Tooltip,
} from "recharts";

import "../styles/dashboard.css";

export default function Dashboard() {
  const [k, setK] = useState<any>(null);

  useEffect(() => {
    socket.on("dashboard:update", getKpis);
    getKpis().then(setK);
  }, []);

  if (!k) return null;

  // Datos fake para gráfica
  const ventasSemana = [
    { dia: "Lun", ventas: 420 },
    { dia: "Mar", ventas: 680 },
    { dia: "Mié", ventas: 540 },
    { dia: "Jue", ventas: 890 },
    { dia: "Vie", ventas: 1320 },
    { dia: "Sáb", ventas: 1840 },
    { dia: "Dom", ventas: 1260 },
  ];

  return (
    <div className="dashboard-page">
      {/* =====================================================
          HEADER
      ===================================================== */}
      <header className="dashboard-header">
        <div>
          <div className="dashboard-title">Dashboard</div>

          <div className="dashboard-subtitle">
            Resumen general del local
          </div>
        </div>
      </header>

      {/* =====================================================
          KPIs
      ===================================================== */}
      <section className="dashboard-kpis">
        <KpiCard
          title="Ventas hoy"
          value={k.hoy.ventas.toFixed(2) + " €"}
        />

        <KpiCard
          title="Tickets hoy"
          value={k.hoy.tickets}
        />

        <KpiCard
          title="Ticket medio"
          value={k.hoy.ticketMedio.toFixed(2) + " €"}
        />

        <KpiCard
          title="Mesas ocupadas"
          value="8 / 14"
        />
      </section>

      {/* =====================================================
          GRID CENTRAL
      ===================================================== */}
      <section className="dashboard-main-grid">
        {/* ===============================================
            GRÁFICA
        =============================================== */}
        <div className="dashboard-card dashboard-chart-card">
          <div className="dashboard-card-header">
            <div>
              <div className="dashboard-card-title">
                Ventas semanales
              </div>

              <div className="dashboard-card-subtitle">
                Últimos 7 días
              </div>
            </div>
          </div>

          <div className="dashboard-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ventasSemana}>
                <XAxis
                  dataKey="dia"
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="ventas"
                  stroke="#7c3aed"
                  strokeWidth={4}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ===============================================
            PANEL DERECHO
        =============================================== */}
        <div className="dashboard-side-column">
          <div className="dashboard-card">
            <div className="dashboard-card-title">
              Estado del local
            </div>

            <div className="dashboard-status-list">
              <StatusItem
                label="Mesas pendientes"
                value="3"
              />

              <StatusItem
                label="Cocina"
                value="Activa"
                success
              />

              <StatusItem
                label="Barra"
                value="2 comandas"
              />

              <StatusItem
                label="Tickets abiertos"
                value="12"
              />
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-title">
              Hora punta
            </div>

            <div className="dashboard-big-stat">
              21:00 - 22:00
            </div>

            <div className="dashboard-muted">
              Mayor volumen de ventas
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PRODUCTOS
      ===================================================== */}
      <section className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <div className="dashboard-card-title">
              Top productos
            </div>

            <div className="dashboard-card-subtitle">
              Últimos 7 días
            </div>
          </div>
        </div>

        <div className="dashboard-products">
          {k.topProductos.map((p: any) => (
            <div
              key={p.nombreProducto}
              className="dashboard-product-row"
            >
              <div>
                <div className="dashboard-product-name">
                  {p.nombreProducto}
                </div>

                <div className="dashboard-product-units">
                  {p.uds} uds
                </div>
              </div>

              <div className="dashboard-product-total">
                {Number(p.total || 0).toFixed(2)} €
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* =========================================================
    KPI CARD
========================================================= */

function KpiCard({
  title,
  value,
}: {
  title: string;
  value: any;
}) {
  return (
    <div className="dashboard-kpi-card">
      <div className="dashboard-kpi-title">
        {title}
      </div>

      <div className="dashboard-kpi-value">
        {value}
      </div>
    </div>
  );
}

/* =========================================================
    STATUS ITEM
========================================================= */

function StatusItem({
  label,
  value,
  success,
}: {
  label: string;
  value: string;
  success?: boolean;
}) {
  return (
    <div className="dashboard-status-item">
      <span>{label}</span>

      <span
        className={
          success
            ? "dashboard-status-success"
            : ""
        }
      >
        {value}
      </span>
    </div>
  );
}