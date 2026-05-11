import { useEffect, useState } from "react";
import {
  getMesas,
  crearTicket,
  getTicketAbiertoMesa,
  lockMesa,
} from "../api/endpoints";
import { useNavigate } from "react-router-dom";
import "../styles/mesas.css";
import { socket } from "../lib/socket";

export default function Mesas() {
  const [mesas, setMesas] = useState<any[]>([]);
  const nav = useNavigate();
  const [filtro, setFiltro] = useState<
    "todas" | "libres" | "ocupadas" | "pendientes"
  >("todas");
  const [salaActiva, setSalaActiva] = useState("Todas");
  const salas = ["Todas", ...new Set(mesas.map((m) => m.sala_nombre))];

  useEffect(() => {
    socket.on("mesas:update", getMesas);
    getMesas().then(setMesas);
  }, []);

  const abrir = async (mesaId: number) => {
    try {
      await lockMesa(mesaId);

      const abierto = await getTicketAbiertoMesa(mesaId);

      if (abierto.ticketId) {
        nav(`/app/ticket/${abierto.ticketId}`);
        return;
      }

      const { ticketId } = await crearTicket(mesaId);

      nav(`/app/ticket/${ticketId}`);
    } catch (error: any) {
      alert(error?.response?.data?.error || "Mesa bloqueada");
    }
  };

  const mesasFiltradas = mesas.filter((m) => {
    // =====================================
    // FILTRO ESTADO
    // =====================================

    let cumpleEstado = true;

    switch (filtro) {
      case "libres":
        cumpleEstado = m.estado === "libre";
        break;

      case "ocupadas":
        cumpleEstado = m.estado === "ocupada";
        break;

      case "pendientes":
        cumpleEstado = Number(m.items_pendientes) > 0;
        break;
    }

    // =====================================
    // FILTRO SALA
    // =====================================

    const cumpleSala =
      salaActiva === "Todas" ? true : m.sala_nombre === salaActiva;

    return cumpleEstado && cumpleSala;
  });

  return (
    <div className="mesas-page">
      {/* =====================================================
      HEADER
    ===================================================== */}
      <header className="tpv-header">
        <div className="tpv-header-left">
          <div className="tpv-page-title">Mesas</div>

          <div className="tpv-ticket-badge">{mesasFiltradas.length} mesas</div>
        </div>
      </header>

      {/* =====================================================
      SALAS
    ===================================================== */}
      <div className="salas-tabs">
        {salas.map((sala) => (
          <button
            key={sala}
            onClick={() => setSalaActiva(sala)}
            className={`sala-tab ${salaActiva === sala ? "active" : ""}`}
          >
            {sala}
          </button>
        ))}
      </div>

      {/* =====================================================
      FILTROS ESTADO
    ===================================================== */}
      <div className="mesas-filters">
        <button
          onClick={() => setFiltro("todas")}
          className={`mesas-filter ${filtro === "todas" ? "active" : ""}`}
        >
          Todas
        </button>

        <button
          onClick={() => setFiltro("libres")}
          className={`mesas-filter ${filtro === "libres" ? "active" : ""}`}
        >
          Libres
        </button>

        <button
          onClick={() => setFiltro("ocupadas")}
          className={`mesas-filter ${filtro === "ocupadas" ? "active" : ""}`}
        >
          Ocupadas
        </button>

        <button
          onClick={() => setFiltro("pendientes")}
          className={`mesas-filter ${filtro === "pendientes" ? "active" : ""}`}
        >
          Pendientes
        </button>
      </div>

      {/* =====================================================
      GRID DE MESAS
    ===================================================== */}
      <div className="mesas-grid">
        {mesasFiltradas.map((m) => (
          <button
            key={m.id}
            onClick={() => abrir(m.id)}
            className={`mesa-card ${m.estado}`}
          >
            {/* HEADER */}
            <div className="mesa-card-top">
              <div className="mesa-title">{m.nombre}</div>

              <div className={`mesa-status ${m.estado}`}>{m.estado}</div>
            </div>

            {/* INFO */}
            <div className="mesa-info">
              <div className="mesa-items">{m.items_pendientes || 0} items</div>

              <div className="mesa-total">
                {Number(m.total || 0).toFixed(2)} €
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
