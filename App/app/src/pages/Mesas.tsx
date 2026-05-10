import { useEffect, useState } from "react";
import { getMesas, crearTicket, getTicketAbiertoMesa } from "../api/endpoints";
import { useNavigate } from "react-router-dom";
import '../styles/mesas.css';
import { socket } from "../lib/socket";

export default function Mesas() {
  const [mesas, setMesas] = useState<any[]>([]);
  const nav = useNavigate();

  useEffect(() => {
    socket.on("mesas:update", getMesas);
    getMesas().then(setMesas);
  }, []);

  const abrir = async (mesaId: number) => {
    const abierto = await getTicketAbiertoMesa(mesaId);
    if (abierto.ticketId) {
      nav(`/ticket/${abierto.ticketId}`);
      return;
    }
    const { ticketId } = await crearTicket(mesaId);
    nav(`/ticket/${ticketId}`);
  };

  return (
    <div className="mesas-page">
      {/* =====================================================
        HEADER
    ===================================================== */}
      <header className="tpv-header">
        <div className="tpv-header-left">
          <div className="tpv-page-title">Mesas</div>

          <div className="tpv-ticket-badge">{mesas.length} mesas</div>
        </div>
      </header>

      {/* =====================================================
        FILTROS
    ===================================================== */}
      <div className="mesas-filters">
        <button className="mesas-filter active">Todas</button>

        <button className="mesas-filter">Libres</button>

        <button className="mesas-filter">Ocupadas</button>

        <button className="mesas-filter">Pendientes</button>
      </div>

      {/* =====================================================
        GRID DE MESAS
    ===================================================== */}
      <div className="mesas-grid">
        {mesas.map((m) => (
          <button
            key={m.id}
            onClick={() => abrir(m.id)}
            className={`mesa-card ${m.estado}`}
          >
            {/* NÚMERO / NOMBRE */}
            <div className="mesa-title">{m.nombre}</div>

            {/* ESTADO */}
            <div className={`mesa-status ${m.estado}`}>{m.estado}</div>

            {/* INFO */}
            <div className="mesa-info">
              <div>{m.items_pendientes || 0} items</div>

              {m.total && (
                <div className="mesa-total">{Number(m.total).toFixed(2)} €</div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
