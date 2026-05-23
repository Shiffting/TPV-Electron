import { useEffect, useState } from "react";

import {
  cambiarEstadoEstacion,
  getEstacion,
} from "../api/endpoints";

import { socket } from "../lib/socket";

import "../styles/estaciones.css";
import "../styles/index.css";

/* =========================================================
   TIPOS
========================================================= */

interface LineaEstacion {
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

export default function Estacion() {

  const [estaciones, setEstaciones] =
    useState<any[]>([]);

  /* =====================================================
      LOAD
  ===================================================== */

  async function load() {

    try {
      const res =
        await getEstacion();

      setEstaciones(res);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    load();
    socket.on(
      "estacion:update",
      load,
    );
    return () => {
      socket.off(
        "estacion:update",
        load,
      );
    };
  }, []);

  /* =====================================================
      CAMBIAR ESTADO
  ===================================================== */

  async function avanzarEstado(
    linea: LineaEstacion,
  ) {

    try {

      let nuevoEstado = "pendiente";

      if (
        linea.estadoOperativo === "pendiente"
      ) {
        nuevoEstado = "preparando";

      } else if (
        linea.estadoOperativo === "preparando"
      ) {
        nuevoEstado = "listo";

      } else {
        nuevoEstado = "pendiente";
      }

      await cambiarEstadoEstacion(
        linea.id,
        nuevoEstado,
      );

      await load();
    } catch (e) {
      console.error(e);
    }
  }

  /* =====================================================
      RENDER
  ===================================================== */

  return (
    <div className="estaciones-page">

      {/* =================================================
          HEADER
      ================================================== */}

      <div className="estaciones-header">

        <div>

          <div className="estaciones-title">
            Estaciones
          </div>

          <div className="estaciones-subtitle">
            Producción activa
          </div>

        </div>
      </div>

      {/* =================================================
          ESTACIONES
      ================================================== */}

      <div className="estaciones-grid">

        {estaciones.map(
          (estacion: any) => (

            <div
              key={estacion.id}
              className="estacion-card"
            >

              {/* HEADER */}

              <div className="estacion-header">

                <div
                  className="estacion-dot"
                  style={{
                    background:
                      estacion.color,
                  }}
                />

                <div className="estacion-title">
                  {estacion.nombre}
                </div>

                <div className="estacion-count">
                  {
                    estacion.lineas
                      .length
                  }
                </div>

              </div>

              {/* COLUMNAS */}

              <div className="estacion-columns">

                <EstadoColumn
                  titulo="Pendiente"
                  estado="pendiente"
                  lineas={
                    estacion.lineas.filter(
                      (
                        l: LineaEstacion,
                      ) =>
                        l.estadoOperativo ===
                        "pendiente",
                    )
                  }
                  onClick={
                    avanzarEstado
                  }
                />

                <EstadoColumn
                  titulo="Preparando"
                  estado="preparando"
                  lineas={
                    estacion.lineas.filter(
                      (
                        l: LineaEstacion,
                      ) =>
                        l.estadoOperativo ===
                        "preparando",
                    )
                  }
                  onClick={
                    avanzarEstado
                  }
                />

                <EstadoColumn
                  titulo="Listo"
                  estado="listo"
                  lineas={
                    estacion.lineas.filter(
                      (
                        l: LineaEstacion,
                      ) =>
                        l.estadoOperativo ===
                        "listo",
                    )
                  }
                  onClick={
                    avanzarEstado
                  }
                />

              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

/* =========================================================
   COLUMNA
========================================================= */

function EstadoColumn({
  titulo,
  estado,
  lineas,
  onClick,
}: any) {

  return (
    <div className="estacion-column">

      <div className="estacion-column-title">
        {titulo}
      </div>

      <div className="estacion-column-content">

        {lineas.map((l: any) => (

          <button
            key={l.id}
            className={`
              estacion-ticket
              ${estado}
            `}
            onClick={() =>
              onClick(l)
            }
          >

            {/* TOP */}

            <div className="estacion-ticket-top">

              <div className="estacion-ticket-mesa">
                Mesa {l.mesaId}
              </div>

              <div className="estacion-ticket-cantidad">
                x{l.cantidad}
              </div>

            </div>

            {/* PRODUCTO */}

            <div className="estacion-ticket-producto">
              {l.nombreProducto}
            </div>

            {/* PROPIEDADES */}

            {l.propiedades.length >
              0 && (
                <div className="estacion-ticket-props">

                  {l.propiedades.map(
                    (p: string) => (

                      <div
                        key={p}
                        className="estacion-ticket-prop"
                      >
                        • {p}
                      </div>
                    ),
                  )}

                </div>
              )}

          </button>
        ))}
      </div>
    </div>
  );
}