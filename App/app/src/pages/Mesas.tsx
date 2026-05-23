import { useEffect, useState } from "react";

import {
  getMesas,
  getTickets,
  crearTicket,
} from "../api/endpoints";

import { useNavigate } from "react-router-dom";

import "../styles/mesas.css";

import { socket } from "../lib/socket";

// =========================================
// TYPES
// =========================================

type Mesa = {
  id: number;

  nombre: string;

  sala: {
    nombre: string;
  };

  ocupacion: {
    ocupada: boolean;

    estado:
    | "libre"
    | "ocupada"
    | "pendiente"
    | "pagada";

    minutos: number;
  };

  ticket: {
    id: number;

    total_bruto: number;

    estado_financiero:
    | "pendiente"
    | "parcial"
    | "pagado";

    comensales: number;

    items_pendientes: number;
  } | null;
};

type Ticket = {
  id: number;

  mesa_id?: number;

  estatus_financiero:
  | "pendiente"
  | "parcial"
  | "pagado";
};

function formatTiempo(min: number) {

  if (min < 60) {
    return `${min} min`;
  }

  const h = Math.floor(min / 60);

  const m = min % 60;

  return `${h}h ${m}m`;
}

// =========================================
// COMPONENT
// =========================================

export default function Mesas() {

  const nav = useNavigate();

  // =========================================
  // STATE
  // =========================================

  const [mesas, setMesas] =
    useState<Mesa[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    abriendoMesaId,
    setAbriendoMesaId,
  ] = useState<number | null>(null);

  const [salaActiva, setSalaActiva] =
    useState("Todas");

  // =========================================
  // SALAS
  // =========================================

  const salas = [
    "Todas",

    ...Array.from(
      new Set(
        mesas
          .map((m) =>
            m.sala.nombre?.trim(),
          )
          .filter(Boolean),
      ),
    ),
  ];

  // =========================================
  // LOAD
  // =========================================

  useEffect(() => {

    async function cargarMesas() {

      try {

        setError("");

        const data =
          await getMesas();

        setMesas(data);

      } catch (err) {

        console.error(err);

        setError(
          "No se pudieron cargar las mesas",
        );

      } finally {

        setLoading(false);

      }
    }

    cargarMesas();

    socket.on(
      "mesas:update",
      cargarMesas,
    );

    return () => {

      socket.off(
        "mesas:update",
        cargarMesas,
      );

    };

  }, []);

  // =========================================
  // ABRIR
  // =========================================

  async function abrir(
    mesaId: number,
  ) {

    if (abriendoMesaId) {
      return;
    }

    try {

      setAbriendoMesaId(
        mesaId,
      );

      // =====================================
      // BUSCAR TICKET ABIERTO
      // =====================================

      const tickets =
        await getTickets();

      const abierto =
        tickets.find(
          (t: Ticket) =>
            t.mesa_id === mesaId &&
            t.estatus_financiero !==
            "pagado",
        );

      // =====================================
      // EXISTE
      // =====================================

      if (abierto) {

        nav(
          `/app/ticket/${abierto.id}`,
        );

        return;
      }

      // =====================================
      // CREAR NUEVO
      // =====================================

      const { ticketId } =
        await crearTicket(mesaId);

      nav(
        `/app/ticket/${ticketId}`,
      );

    } catch (err: any) {

      console.error(err);

      alert(
        err?.response?.data?.error ||
        "No se pudo abrir la mesa",
      );

    } finally {

      setAbriendoMesaId(
        null,
      );

    }
  }

  // =========================================
  // FILTRO SALA
  // =========================================

  const mesasFiltradas =
    mesas.filter(
      (m) =>
        salaActiva === "Todas"
          ? true
          : m.sala.nombre ===
          salaActiva,
    );

  // =========================================
  // LOADING
  // =========================================

  if (loading) {

    return (
      <div className="mesas-page">
        <div className="mesas-loading">
          Cargando mesas...
        </div>
      </div>
    );
  }

  // =========================================
  // ERROR
  // =========================================

  if (error) {

    return (
      <div className="mesas-page">
        <div className="mesas-error">
          {error}
        </div>
      </div>
    );
  }

  // =========================================
  // UI
  // =========================================

  return (
    <div className="mesas-page">

      {/* HEADER */}

      <header className="tpv-header">

        <div className="tpv-header-left">

          <div className="tpv-page-title">
            Mesas
          </div>

          <div className="tpv-ticket-badge">
            {mesasFiltradas.length}
            {" "}mesas
          </div>

        </div>

      </header>

      {/* SALAS */}

      <div className="salas-tabs">

        {salas.map((sala) => (

          <button
            key={`sala-${sala}`}
            onClick={() =>
              setSalaActiva(sala)
            }
            className={
              `sala-tab ${salaActiva === sala
                ? "active"
                : ""
              }`
            }
          >
            {sala}
          </button>

        ))}

      </div>

      {/* GRID */}

      <div className="mesas-grid">

        {mesasFiltradas.map((m) => (

          <button
            key={m.id}
            onClick={() =>
              abrir(m.id)
            }
            disabled={
              abriendoMesaId ===
              m.id
            }
            className={
              `mesa-card ${m.ocupacion.estado}`
            }
          >

            {/* HEADER */}

            <div className="mesa-card-top">

              <div className="mesa-title">
                {m.nombre}
              </div>

            </div>

            {/* LIBRE */}

            {!m.ocupacion.ocupada && (

              <div className="mesa-libre">
                Libre
              </div>

            )}

            {/* OCUPADA */}

            {m.ocupacion.ocupada && (
              <>

                {/* TIEMPO */}

                <div className="mesa-time">
                  {" "}
                  {formatTiempo(m.ocupacion.minutos)}
                  {" "}
                </div>

                {/* COMENSALES */}

                <div className="mesa-guests">
                  👥{" "}
                  {
                    m.ticket
                      ?.comensales
                  }
                </div>

                {/* TOTAL */}

                <div className="mesa-total">
                  {
                    Number(
                      m.ticket
                        ?.total_bruto || 0,
                    ).toFixed(2)
                  } €
                </div>

                {/* PENDIENTES */}

                {m.ocupacion.estado ===
                  "pendiente" && (
                    <div className="mesa-pending">
                      🔥{" "}
                      {
                        m.ticket
                          ?.items_pendientes
                      }
                      {" "}pendientes
                    </div>
                  )}

                {/* PAGADA */}

                {m.ocupacion.estado ===
                  "pagada" && (
                    <div className="mesa-paid">
                      ✓ Pagada
                    </div>
                  )}

              </>
            )}

          </button>

        ))}

      </div>
    </div>
  );
}