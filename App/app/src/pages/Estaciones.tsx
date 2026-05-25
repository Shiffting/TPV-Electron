import {
  useEffect,
  useState,
  useCallback
} from "react";

import {
  getEstaciones,
  cambiarEstadoEstacion,
} from "../api/endpoints";

import { useSwipeable } from "react-swipeable";

import { socket } from "../lib/socket";

import "../styles/estaciones.css";

function siguienteEstado(
  estado: string,
) {

  switch (estado) {

    case "enviado":
      return "preparando";

    case "preparando":
      return "listo";

    case "listo":
      return "servido";

    default:
      return estado;
  }
}

function estadoAnterior(
  estado: string,
) {

  switch (estado) {

    case "preparando":
      return "enviado";

    case "listo":
      return "preparando";

    case "servido":
      return "listo";

    default:
      return estado;
  }
}

function agruparLineas(
  lineas: any[],
) {

  const grupos: Record<
    string,
    any
  > = {};

  for (const linea of lineas) {

    const key =
      `${linea.ticketId}-${linea.estadoOperativo}`;

    if (!grupos[key]) {

      grupos[key] = {

        ticketId:
          linea.ticketId,

        mesaId:
          linea.mesaId,

        estado:
          linea.estadoOperativo,

        actualizadoEn:
          linea.actualizadoEn,

        lineas: [],
      };
    }

    grupos[key]
      .lineas
      .push(linea);
  }

  return Object.values(
    grupos,
  );
}

function formatElapsed(
  date?: string,
) {

  if (!date) {
    return "--:--";
  }

  const clean =
    date
      .replace("T", " ")
      .replace(".000Z", "")
      .replace("Z", "");

  const [
    ymd,
    hms,
  ] = clean.split(" ");

  const [
    year,
    month,
    day,
  ] = ymd.split("-").map(Number);

  const [
    hour,
    minute,
    second,
  ] = hms.split(":").map(Number);

  const utcMs =
    Date.UTC(
      year,
      month - 1,
      day,
      hour,
      minute,
      second,
    );

  const diff =
    Math.floor(
      (
        Date.now() -
        utcMs
      ) / 1000,
    ) - (2 * 3600);

  const safeDiff =
    Math.max(diff, 0);

  const hours =
    Math.floor(
      safeDiff / 3600,
    );

  const mins =
    Math.floor(
      (safeDiff % 3600) / 60,
    );

  const secs =
    safeDiff % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m ${secs}s`;
  }

  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }

  return `${secs}s`;
}

function ProductoItem({
  p,
  locked,
  setLocked,
  avanzarLinea,
  retrocederLinea,
}: any) {

  const itemHandlers =
    useSwipeable({

      onSwipedLeft:
        async () => {

          if (locked) {
            return;
          }

          try {

            setLocked(true);

            await retrocederLinea(
              p.lineas,
            );

          } finally {

            setLocked(false);
          }
        },

      onSwipedRight:
        async () => {

          if (locked) {
            return;
          }

          try {

            setLocked(true);

            await avanzarLinea(
              p.lineas,
            );

          } finally {

            setLocked(false);
          }
        },

      preventScrollOnSwipe:
        true,

      trackMouse: false,
    });

  return (

    <button
      {...itemHandlers}
      className="
        estacion-group-item
      "
    >

      <div className="
        estacion-group-item-qty
      ">
        x{p.cantidad}
      </div>

      <div className="
        estacion-group-item-content
      ">

        <div className="
          estacion-group-item-name
        ">
          {p.nombre}
        </div>

        {p.lineas.some(
          (l: any) =>
            l.propiedades?.length,
        ) && (

            <div className="
            estacion-group-item-props
          ">

              {([
                ...new Set(
                  p.lineas.flatMap(
                    (l: any) =>
                      l.propiedades || [],
                  ),
                ),
              ] as string[]).map((prop) => (

                <div
                  key={String(prop)}
                  className="
                  estacion-group-item-prop
                "
                >
                  • {prop}
                </div>
              ))}

            </div>
          )}

      </div>

    </button>
  );
}

function GrupoCard({
  grupo,
  productos,
  avanzarGrupo,
  retrocederGrupo,
  avanzarLinea,
  retrocederLinea,
  formatElapsed,
}: any) {

  const [
    swiping,
    setSwiping,
  ] = useState<
    "left" |
    "right" |
    null
  >(null);

  const [
    locked,
    setLocked,
  ] = useState(false);

  const handlers =
    useSwipeable({

      onSwiping: (e) => {

        if (
          e.dir === "Right"
        ) {
          setSwiping(
            "right",
          );
        }

        if (
          e.dir === "Left"
        ) {
          setSwiping(
            "left",
          );
        }
      },

      onSwipedRight: async () => {

        if (locked) {
          return;
        }

        try {

          setLocked(true);

          await avanzarGrupo(
            grupo,
          );

        } finally {

          setLocked(false);
        }
      },

      onSwipedLeft: async () => {

        if (locked) {
          return;
        }

        try {

          setLocked(true);

          await retrocederGrupo(
            grupo,
          );

        } finally {

          setLocked(false);
        }
      },

      onSwiped: () =>
        setSwiping(
          null,
        ),

      preventScrollOnSwipe:
        true,

      trackMouse: false,
    });

  return (

    <div
      {...handlers}
      className={`
  estacion-group-card
  ${swiping === "right"
          ? "swipe-next"
          : ""
        }
  ${swiping === "left"
          ? "swipe-back"
          : ""
        }
`}
    >

      {/* HEADER */}

      <button
        className="estacion-group-header"
      >

        <div className="estacion-group-title">
          Mesa {grupo.mesaId}
        </div>

        <div className="estacion-group-meta">

          <div className="estacion-group-time">
            {formatElapsed(
              grupo.actualizadoEn,
            )}
          </div>

          <div className="estacion-group-count">
            {grupo.lineas.length}
          </div>

        </div>

      </button>

      {/* ITEMS */}

      <div className="estacion-group-items">

        {Object.values(productos).map(
          (p: any) => {
            return (
              <ProductoItem
                key={p.nombre}
                p={p}
                locked={locked}
                setLocked={setLocked}
                avanzarLinea={avanzarLinea}
                retrocederLinea={retrocederLinea}
              />
            );
          },
        )}
      </div>
    </div>
  );
}

export default function Estaciones() {

  const [
    estaciones,
    setEstaciones,
  ] = useState<any[]>(
    [],
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    selectedEstacion,
    setSelectedEstacion,
  ] = useState<
    number | null
  >(null);

  const [
    now,
    setNow,
  ] = useState(
    Date.now(),
  );

  const load =
    useCallback(
      async (
        silent = false
      ) => {

        try {

          if (!silent) {
            setLoading(true);
          }

          const data =
            await getEstaciones();

          setEstaciones(data);

          if (
            data.length > 0 &&
            !selectedEstacion
          ) {

            setSelectedEstacion(
              data[0].id,
            );
          }

        } catch (e) {

          console.error(e);

        } finally {

          if (!silent) {
            setLoading(false);
          }
        }

      },
      [selectedEstacion],
    );

  useEffect(() => {

    load();

  }, []);

  useEffect(() => {

    const interval =
      setInterval(() => {

        setNow(
          Date.now(),
        );

      }, 1000);

    return () =>
      clearInterval(
        interval,
      );

  }, []);

  useEffect(() => {

    socket.on(
      "ticket:update",
      () => load(true),
    );

    return () => {

      socket.off(
        "ticket:update",
        load,
      );
    };

  }, []);

  function actualizarLineasLocalmente(
    lineasIds: number[],
    nuevoEstado: string,
  ) {

    setEstaciones(prev =>
      prev.map(estacion => ({

        ...estacion,

        lineas:
          estacion.lineas.map(
            (l: any) => {

              if (
                lineasIds.includes(
                  l.id,
                )
              ) {

                return {

                  ...l,

                  estadoOperativo:
                    nuevoEstado,

                  actualizadoEn:
                    new Date()
                      .toISOString(),
                };
              }

              return l;
            },
          ),
      })),
    );
  }

  async function avanzarLinea(
    lineas: any[],
  ) {

    if (!lineas?.length) {
      return;
    }

    const estadoActual =
      lineas[0]
        .estadoOperativo;

    const nuevoEstado =
      siguienteEstado(
        estadoActual,
      );

    const prev =
      structuredClone(
        estaciones,
      );

    try {

      actualizarLineasLocalmente(
        lineas.map(
          l => l.id,
        ),
        nuevoEstado,
      );

      await cambiarEstadoEstacion(
        lineas[0]
          .ticketId,

        lineas.map(
          l => l.id,
        ),

        nuevoEstado,
      );

    } catch (e) {

      setEstaciones(prev);

      console.error(e);
    }
  }

  async function retrocederLinea(
    lineas: any[],
  ) {

    if (
      !lineas?.length
    ) {
      return;
    }

    const estadoActual =
      lineas[0]
        .estadoOperativo;

    const nuevoEstado =
      estadoAnterior(
        estadoActual,
      );

    const prev =
      structuredClone(
        estaciones,
      );

    try {

      actualizarLineasLocalmente(
        lineas.map(
          l => l.id,
        ),
        nuevoEstado,
      );

      await cambiarEstadoEstacion(
        lineas[0]
          .ticketId,

        lineas.map(
          l => l.id,
        ),

        nuevoEstado,
      );

    } catch (e) {

      setEstaciones(prev);

      console.error(e);
    }
  }

  async function avanzarGrupo(
    grupo: any,
  ) {

    const nuevoEstado =
      siguienteEstado(
        grupo.estado,
      );

    await cambiarEstadoEstacion(
      grupo.lineas[0].ticketId,

      grupo.lineas.map(
        (l: any) => l.id,
      ),

      nuevoEstado,
    );
  }

  async function retrocederGrupo(
    grupo: any,
  ) {

    const nuevoEstado =
      estadoAnterior(
        grupo.estado,
      );

    await cambiarEstadoEstacion(
      grupo.lineas[0].ticketId,

      grupo.lineas.map(
        (l: any) => l.id,
      ),

      nuevoEstado,
    );
  }

  const estacion =
    estaciones.find(
      (e) =>
        e.id ===
        selectedEstacion,
    );

  if (loading) {

    return (
      <div>
        Cargando...
      </div>
    );
  }

  return (

    <div className="
      estacion-page
    ">

      <div className="
        estacion-header
      ">

        <h1 className="
          estacion-page-title
        ">
          Estaciones
        </h1>

        <div className="
          estacion-page-subtitle
        ">
          Producción activa
        </div>

      </div>

      {/* TABS */}

      <div className="
        estacion-tabs
      ">

        {estaciones.map(
          (e) => (

            <button
              key={e.id}
              className={`
                estacion-tab
                ${selectedEstacion ===
                  e.id
                  ? "active"
                  : ""
                }
              `}
              onClick={() =>
                setSelectedEstacion(
                  e.id,
                )
              }
            >
              {e.nombre}
            </button>

          ),
        )}

      </div>

      {/* ESTACION */}

      {estacion && (

        <div className="
          estacion-board
        ">

          <div className="
            estacion-board-header
          ">

            <div className="
              estacion-board-title
            ">

              <div
                className="
                  estacion-board-dot
                "
                style={{
                  background:
                    estacion.color,
                }}
              />

              {estacion.nombre}

            </div>

            <div className="
              estacion-board-count
            ">
              {
                estacion.lineas
                  .length
              }
            </div>

          </div>

          <div className="
            estacion-columns
          ">

            {[
              "enviado",
              "preparando",
              "listo",
            ].map(
              (estado) => {

                const lineas =
                  estacion.lineas.filter(
                    (
                      l: any,
                    ) =>
                      l.estadoOperativo ===
                      estado,
                  );

                const grupos =
                  agruparLineas(
                    lineas,
                  );

                return (

                  <div
                    key={estado}
                    className="
                      estacion-column
                    "
                  >

                    <div className="
                      estacion-column-title
                    ">
                      {estado}
                    </div>

                    <div className="
                      estacion-column-content
                    ">

                      {grupos.map((grupo) => {

                        const productos =
                          grupo.lineas.reduce(
                            (acc: any, l: any) => {

                              if (!acc[l.nombreProducto]) {

                                acc[l.nombreProducto] = {

                                  nombre:
                                    l.nombreProducto,

                                  cantidad: 0,

                                  lineas: [],
                                };
                              }

                              acc[l.nombreProducto]
                                .cantidad += l.cantidad;

                              acc[l.nombreProducto]
                                .lineas.push(l);

                              return acc;

                            },
                            {},
                          );

                        return (

                          <GrupoCard
                            key={`${grupo.ticketId}-${grupo.estado}`}
                            grupo={grupo}
                            productos={productos}
                            avanzarGrupo={avanzarGrupo}
                            retrocederGrupo={retrocederGrupo}
                            avanzarLinea={avanzarLinea}
                            retrocederLinea={retrocederLinea}
                            formatElapsed={formatElapsed}
                          />

                        );
                      })}

                    </div>

                  </div>

                );
              },
            )}

          </div>

        </div>

      )}

    </div>
  );
}