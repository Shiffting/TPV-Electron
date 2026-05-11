import { useEffect, useMemo, useState } from "react";
import { cambiarEstadoCocina, getCocina } from "../api/endpoints";
import { socket } from "../lib/socket";

import "../styles/cocina.css";
import "../styles/index.css";

/* =========================================================
   TIPOS
========================================================= */

interface LineaCocina {
  id: number;
  ticketId: number;
  nombreProducto: string;
  cantidad: number;
  estadoOperativo: string;
  mesaId: number;
  estacionId: number;
  estacionNombre: string;
  estacionColor: string;
  propiedades: string[];
}

/* =========================================================
   COMPONENTE
========================================================= */

export default function Cocina() {
  const [estaciones, setEstaciones] = useState<any[]>([]);

  /* =====================================================
      LOAD
  ===================================================== */

  async function load() {
    try {
      const res = await getCocina();
      setEstaciones(res);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    load();

    socket.on("cocina:update", () => {
      load();
    });

    return () => {
      socket.off("cocina:update");
    };
  }, []);

  /* =====================================================
      CAMBIAR ESTADO
  ===================================================== */

  async function avanzarEstado(linea: LineaCocina) {
    try {
      let nuevoEstado = "pendiente";

      if (linea.estadoOperativo === "pendiente") {
        nuevoEstado = "preparando";
      } else if (linea.estadoOperativo === "preparando") {
        nuevoEstado = "listo";
      } else {
        nuevoEstado = "pendiente";
      }

      await cambiarEstadoCocina(linea.id, nuevoEstado);

      await load();
    } catch (e) {
      console.error(e);
    }
  }

  /* =====================================================
      RENDER
  ===================================================== */

  return (
    <div className="cocina-page">
      {/* =================================================
          HEADER
      ================================================== */}

      <div className="cocina-header">
        <div>
          <div className="cocina-title">Cocina</div>

          <div className="cocina-subtitle">Producción activa</div>
        </div>
      </div>

      {/* =================================================
          ESTACIONES
      ================================================== */}

      <div className="cocina-stations">
        {estaciones.map((estacion: any) => (
          <div key={estacion.id} className="cocina-station">
            {/* HEADER */}

            <div className="cocina-station-header">
              <div
                className="cocina-station-dot"
                style={{
                  background: estacion.color,
                }}
              />

              <div className="cocina-station-title">{estacion.nombre}</div>

              <div className="cocina-station-count">
                {estacion.lineas.length}
              </div>
            </div>

            {/* COLUMNAS */}

            <div className="cocina-columns">
              <EstadoColumn
                titulo="Pendiente"
                estado="pendiente"
                lineas={estacion.lineas.filter(
                  (l: LineaCocina) => l.estadoOperativo === "pendiente",
                )}
                onClick={avanzarEstado}
              />

              <EstadoColumn
                titulo="Preparando"
                estado="preparando"
                lineas={estacion.lineas.filter(
                  (l: LineaCocina) => l.estadoOperativo === "preparando",
                )}
                onClick={avanzarEstado}
              />

              <EstadoColumn
                titulo="Listo"
                estado="listo"
                lineas={estacion.lineas.filter(
                  (l: LineaCocina) => l.estadoOperativo === "listo",
                )}
                onClick={avanzarEstado}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   COLUMNA
========================================================= */

function EstadoColumn({ titulo, estado, lineas, onClick }: any) {
  return (
    <div className="cocina-column">
      <div className="cocina-column-title">{titulo}</div>

      <div className="cocina-column-content">
        {lineas.map((l: any) => (
          <button
            key={l.id}
            className={`
              cocina-ticket
              ${estado}
            `}
            onClick={() => onClick(l)}
          >
            {/* TOP */}

            <div className="cocina-ticket-top">
              <div className="cocina-ticket-mesa">Mesa {l.mesaId}</div>

              <div className="cocina-ticket-cantidad">x{l.cantidad}</div>
            </div>

            {/* PRODUCTO */}

            <div className="cocina-ticket-producto">{l.nombreProducto}</div>

            {/* PROPIEDADES */}

            {l.propiedades.length > 0 && (
              <div className="cocina-ticket-props">
                {l.propiedades.map((p: string) => (
                  <div key={p} className="cocina-ticket-prop">
                    • {p}
                  </div>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
