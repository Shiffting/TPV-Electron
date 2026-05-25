import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  TrendingUp,
  Receipt,
  Clock3,
  AlertTriangle,
  Users,
  Activity,
} from "lucide-react";

import {
  getKpis,
} from "../api/endpoints";

import "../styles/dashboard.css";

const PIE_COLORS = [
  "#8b5cf6",
  "#6366f1",
  "#ec4899",
  "#06b6d4",
  "#14b8a6",
];

export default function Dashboard() {

  const [
    data,
    setData,
  ] = useState<any>(null);

  const [
    range,
    setRange,
  ] = useState("today");

  const [
    negocioId,
    setNegocioId,
  ] = useState("");

  async function cargar() {

    const res =
      await getKpis(
        range,
        negocioId,
      );

    setData(res);
  }

  useEffect(() => {

    cargar();

    const interval =
      setInterval(
        cargar,
        10000,
      );

    return () =>
      clearInterval(
        interval,
      );

  }, [
    range,
    negocioId,
  ]);

  const kpis = useMemo(() => {

    if (!data) {
      return [];
    }

    return [

      {
        title: "Ventas",
        value:
          `${data.hoy.ventas.toFixed(2)}€`,
        icon:
          <TrendingUp size={18} />,
      },

      {
        title: "Tickets",
        value:
          data.hoy.tickets,
        icon:
          <Receipt size={18} />,
      },

      {
        title: "Ticket medio",
        value:
          `${data.hoy.ticketMedio.toFixed(2)}€`,
        icon:
          <Clock3 size={18} />,
      },

      {
        title: "Pendientes",
        value:
          data.operacional
            .pendiente,
        icon:
          <AlertTriangle size={18} />,
      },

      {
        title: "Empleados",
        value:
          data.hoy
            .empleadosActivos,
        icon:
          <Users size={18} />,
      },

      {
        title: "Actividad",
        value:
          Object.values(
            data.operacional,
          ).reduce(
            (a: any, b: any) =>
              a + b,
            0,
          ),
        icon:
          <Activity size={18} />,
      },
    ];

  }, [data]);

  if (!data) {

    return (
      <div className="dashboard-loading">
        Cargando dashboard...
      </div>
    );
  }

  return (

    <div className="dashboard-page">

      {/* HERO */}

      <div className="dashboard-hero-v2">

        <div className="dashboard-hero-left">

          <div className="dashboard-badge">
            Analytics
          </div>

          <div className="dashboard-hero-title">
            Centro operativo
          </div>

          <div className="dashboard-hero-subtitle">
            Monitorización en tiempo real del negocio
          </div>

          <div className="dashboard-hero-stats">

            <div className="dashboard-hero-stat">
              <span>
                Revenue
              </span>

              <strong>
                {data.hoy.ventas.toFixed(2)}€
              </strong>
            </div>

            <div className="dashboard-hero-stat">
              <span>
                Tickets
              </span>

              <strong>
                {data.hoy.tickets}
              </strong>
            </div>

            <div className="dashboard-hero-stat">
              <span>
                Media
              </span>

              <strong>
                {data.hoy.ticketMedio.toFixed(2)}€
              </strong>
            </div>

          </div>

        </div>

        <div className="dashboard-hero-chart-v2">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <AreaChart
              data={
                data.ventasPorHora
              }
            >

              <defs>

                <linearGradient
                  id="heroFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >

                  <stop
                    offset="0%"
                    stopColor="#8b5cf6"
                    stopOpacity={0.7}
                  />

                  <stop
                    offset="100%"
                    stopColor="#8b5cf6"
                    stopOpacity={0}
                  />

                </linearGradient>

              </defs>

              <Area
                type="monotone"
                dataKey="total"
                stroke="#c4b5fd"
                fill="url(#heroFill)"
                strokeWidth={4}
              />

            </AreaChart>

          </ResponsiveContainer>

        </div>

      </div>

      {/* TOOLBAR */}

      <div className="dashboard-toolbar-v2">

        <div className="dashboard-range-v2">

          {[
            "today",
            "week",
            "month",
            "year",
          ].map((r) => (

            <button
              key={r}
              className={`
                dashboard-range-btn-v2
                ${range === r
                  ? "active"
                  : ""
                }
              `}
              onClick={() =>
                setRange(r)
              }
            >

              {{
                today: "Hoy",
                week: "Semana",
                month: "Mes",
                year: "Año",
              }[r]}

            </button>
          ))}

        </div>

        <select
          className="dashboard-select-v2"
          value={negocioId}
          onChange={(e) =>
            setNegocioId(
              e.target.value,
            )
          }
        >

          <option value="">
            Todos los locales
          </option>

          {data.negocios.map(
            (n: any) => (

              <option
                key={n.id}
                value={n.id}
              >
                {n.nombre}
              </option>
            ),
          )}

        </select>

      </div>

      {/* KPI */}

      <div className="dashboard-kpis-v2">

        {kpis.map((kpi: any) => (

          <div
            key={kpi.title}
            className="dashboard-kpi-v2"
          >

            <div className="dashboard-kpi-icon">
              {kpi.icon}
            </div>

            <div>

              <div className="dashboard-kpi-label">
                {kpi.title}
              </div>

              <div className="dashboard-kpi-value-v2">
                {kpi.value}
              </div>

            </div>

          </div>
        ))}

      </div>

      {/* GRID */}

      {/* ANALYTICS */}

      <div className="dashboard-analytics-grid">

        {/* REVENUE */}

        <div className="
        dashboard-panel
        dashboard-chart-panel
      ">

          <div className="dashboard-panel-header">

            <div>

              <div className="dashboard-panel-title">
                Revenue temporal
              </div>

              <div className="dashboard-panel-subtitle">
                Evolución de ventas
              </div>

            </div>

          </div>

          <div className="dashboard-chart-box">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={
                  data.ventasPorDia
                }
              >

                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,.06)"
                />

                <XAxis
                  dataKey="fecha"
                  stroke="#94a3b8"
                  tickFormatter={(value) => {

                    const d = new Date(value);

                    return d.toLocaleDateString(
                      "es-ES",
                      {
                        day: "2-digit",
                        month: "2-digit",
                      },
                    );
                  }}
                />

                <YAxis
                  stroke="#94a3b8"
                />

                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,.08)",
                    borderRadius: 12,
                    color: "white",
                  }}
                  labelFormatter={(value) => {

                    const d = new Date(String(value));

                    return d.toLocaleDateString(
                      "es-ES",
                      {
                        day: "2-digit",
                        month: "long",
                      },
                    );
                  }}
                  formatter={(value) => [

                    `${Number(value).toFixed(2)}€`,
                    "Ventas",
                  ]}
                />

                <Bar
                  dataKey="total"
                  radius={8}
                  fill="#8b5cf6"
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

        {/* FLOW */}

        <div className="dashboard-panel">

          <div className="dashboard-panel-title">
            Flujo operacional
          </div>

          <div className="dashboard-flow-list">

            {Object.entries(
              data.operacional,
            ).map(
              ([
                key,
                value,
              ]: any) => (

                <div
                  key={key}
                  className="dashboard-flow-item"
                >

                  <span>
                    {key}
                  </span>

                  <strong>
                    {value}
                  </strong>

                </div>
              ),
            )}

          </div>

          <div className="dashboard-donut-wrap">

            <ResponsiveContainer
              width="100%"
              height={220}
            >

              <PieChart>

                <Pie
                  data={
                    Object.entries(
                      data.operacional,
                    ).map(
                      ([
                        name,
                        value,
                      ]) => ({
                        name,
                        value,
                      }),
                    )
                  }
                  innerRadius={55}
                  outerRadius={82}
                  dataKey="value"
                >

                  {Object.entries(
                    data.operacional,
                  ).map((_, i) => (

                    <Cell
                      key={i}
                      fill={
                        PIE_COLORS[
                        i % PIE_COLORS.length
                        ]
                      }
                    />
                  ))}

                </Pie>

              </PieChart>

            </ResponsiveContainer>

          </div>

        </div>

      </div>
    </div>
  );
}