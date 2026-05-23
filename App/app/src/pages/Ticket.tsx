import { useEffect, useMemo, useState } from "react";
import {
  getTicket,
  getCategorias,
  getProductos,
  getPropiedadesProducto,
  addLinea,
  eliminarLinea,
  enviarCocina,
  cerrarTicket,
  editarTicket,
  agregarPago
} from "../api/endpoints";
import { useNavigate, useParams } from "react-router-dom";
import SwipeableTicketLine from "../components/SwipeableTicketLine"
import ModalPago, { type Pago } from "../components/ModalPago";

import "../styles/ticket.css";
import { socket } from "../lib/socket";

// =========================================
// COMPONENT
// =========================================

type LineaTicket = {
  id: number;
  productoId: number;
  nombreProducto: string;
  cantidad: number;
  subTotal: number;
  propiedades?: any[];
  lineasIds?: number[];
};

export default function Ticket() {

  const { id } = useParams();
  const ticketId = Number(id);
  const nav = useNavigate();

  // =========================================
  // STATE
  // =========================================

  const [ticket, setTicket] = useState<any>(null);
  const [version, setVersion] = useState(0);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null);
  const [configurandoProducto, setConfigurandoProducto] = useState<any>(null);
  const [propiedadesProducto, setPropiedadesProducto] = useState<any[]>([]);
  const [propsSeleccionadas, setPropsSeleccionadas] = useState<any[]>([]);
  const [editandoLinea, setEditandoLinea] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================
  // LOAD TICKET
  // =========================================

  async function loadTicket() {
    try {
      const res = await getTicket(ticketId);

      setTicket({
        ...res.ticket,

        lineas:
          res.lineas || [],
      });

      setVersion(res.ticket?.version || 0);
      return res;
    } catch (err) {
      setError("No se pudo cargar el ticket");
      return null;
    }
  }

  // =========================================
  // INIT
  // =========================================

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);

        const [
          cats,
          prods,
        ] = await Promise.all([
          getCategorias(),
          getProductos(),
        ]);

        setCategorias(cats);
        setProductos(prods);

        if (cats.length > 0) { setCategoriaActiva(cats[0].id) }

        await loadTicket();
      } catch (err) {
        setError("Error cargando ticket");
      } finally {
        setLoading(false);
      }
    }

    socket.on(
      "ticket:update",
      loadTicket
    );

    init();

    return () => {
      socket.off(
        "ticket:update",
        loadTicket
      )
    }
  }, [ticketId]);

  // =========================================
  // FILTRAR PRODUCTOS
  // =========================================

  const productosFiltrados =
    useMemo(() => {
      return productos.filter(
        (p) =>
          p.categoriaId ===
          categoriaActiva,
      );
    },
      [productos, categoriaActiva],
    );

  // =========================================
  // AGREGAR PRODUCTO
  // =========================================

  async function agregarProducto(
    producto: any,
  ) {
    try {
      const propiedades =
        await getPropiedadesProducto(
          producto.id,
        );

      if (producto.requiereConfiguracion && propiedades.length > 0) {

        setConfigurandoProducto(producto);
        setPropiedadesProducto(propiedades);
        setPropsSeleccionadas([]);

        return;
      }

      // =====================================
      // AGREGAR DIRECTO
      // =====================================

      await addLinea(
        ticketId,
        {
          productoId:
            producto.id,
          cantidad: 1,
          propiedades: [],
        },
        version,
      );

      await loadTicket();
    } catch (err) {
      setError("No se pudo agregar producto");
    }
  }

  async function handleConfirmarPagos(
    pagos: Pago[],
  ) {

    try {

      let versionActual = version;
      for (const pago of pagos) {
        await agregarPago(
          ticketId,
          {
            metodoPagoId:
              pago.method ===
                "tarjeta"
                ? 1
                : 2,

            importe: pago.importe,
            lineas:  pago.lineas,
          },
          versionActual,
        );

        const ticketActualizado =
          await loadTicket();

        versionActual = ticketActualizado.ticket.version;
      }

      setShowPaymentModal(false);

    } catch (err: any) {

      setError(
        err?.response?.data?.error ||
        "No se pudo procesar el cobro",
      );
    }
  }

  //TODO eviar a estacion correspondiente
  async function onEnviar() {
    try {
      await enviarCocina(
        ticketId,
        version,
      );

      await loadTicket();
    } catch (err: any) {
      setError(err?.response?.data?.error || "No se pudo enviar");
    }
  }

  async function abrirEditarLinea(linea: any) {
    try {
      const propiedades = await getPropiedadesProducto(linea.productoId);

      if (propiedades.length === 0) { return }

      setConfigurandoProducto({
        id: linea.productoId,
        nombre: linea.nombreProducto,
      });

      setEditandoLinea(linea);
      setPropiedadesProducto(propiedades);

      setPropsSeleccionadas(
        (linea.propiedades || []).map(
          (p: any) => ({
            id: p.propiedad_id,
            nombre: p.nombre,
            precio_delta: p.precio_delta || 0,
          }),
        ),
      );

    } catch (err) {
      console.error(err);
    }
  }

  // =========================================
  // TOGGLE PROP
  // =========================================

  function togglePropiedad(prop: any) {
    const existe =
      propsSeleccionadas.some(
        (p) => p.id === prop.id,
      );

    if (existe) {
      setPropsSeleccionadas(
        propsSeleccionadas.filter(
          (p) => p.id !== prop.id,
        ),
      );

      return;
    }

    setPropsSeleccionadas([
      ...propsSeleccionadas,
      prop,
    ]);
  }

  // =========================================
  // CONFIRMAR CONFIG
  // =========================================

  async function confirmarConfiguracion() {
    const esEdicion = !!editandoLinea;

    if (!configurandoProducto) { return }

    try {
      if (esEdicion) {
        await editarTicket(
          ticketId,
          {
            accion: "editar_linea",
            payload: {
              lineaId: editandoLinea.id,
              propiedades:
                propsSeleccionadas.map(
                  (p) => ({ propiedadId: p.id }),
                ),
            },
            version,
          },
        );
      } else {
        await addLinea(
          ticketId,
          {
            productoId: configurandoProducto.id,
            cantidad: 1,
            propiedades:
              propsSeleccionadas.map(
                (p) => ({ propiedadId: p.id }),
              ),
          },
          version,
        );
      }

      await loadTicket();

      setConfigurandoProducto(null);
      setEditandoLinea(null);
      setPropiedadesProducto([]);
      setPropsSeleccionadas([]);
    } catch (err) {
      setError("No se pudo agregar producto");
    }
  }

  // =========================================
  // ELIMINAR
  // =========================================

  async function borrarLinea(
    lineaId: number,
  ) {
    try {
      await eliminarLinea(
        ticketId,
        lineaId,
        version,
      );

      await loadTicket();
    } catch (err: any) {
      setError("No se pudo eliminar");
    }
  }

  // =========================================
  // CERRAR
  // =========================================

  async function cerrar() {
    try {
      await cerrarTicket(
        ticketId,
        version,
      );

      nav("/app/mesas");
    } catch (err: any) {
      setError("No se pudo cerrar ticket");
    }
  }

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="ticket-page">
        Cargando ticket...
      </div>
    );
  }

  // =========================================
  // UI
  // =========================================

  const lineas: LineaTicket[] = ticket?.lineas || [];

  const lineasAgrupadas =
    Object.entries(
      lineas.reduce<
        Record<
          string,
          LineaTicket
        >
      >(
        (acc, l: LineaTicket) => {
          const key =
            JSON.stringify({
              productoId: l.productoId,
              props: (l.propiedades || [])
                .map(
                  (p: any) =>
                    p.propiedad_id,
                )
                .sort(
                  (a, b) =>
                    a - b,
                ),
            });
          if (!acc[key]) {
            acc[key] = {
              ...l,
              lineasIds: [l.id],
            };
          } else {
            acc[key].cantidad += l.cantidad;
            acc[key].subTotal += l.subTotal;
            acc[key].lineasIds?.push(l.id,);
          }
          return acc;
        },
        {},
      ),
    );

  const cantidadProductos =
    lineasAgrupadas.reduce(
      (acc, [, l]) =>
        acc + l.cantidad,
      0,
    );

  return (
    <div className="ticket-page">
      {/* =====================================================
        HEADER
    ===================================================== */}
      <header className="tpv-header">
        <div className="tpv-header-left">
          <div className="tpv-page-title">
            Ticket #{ticket?.id}
          </div>

          <div className="tpv-ticket-badge">
            {ticket?.mesaNombre || "-"}
          </div>
        </div>

        <button
          onClick={() => nav("/app/mesas")}
          className="tpv-back-button"
        >
          Volver
        </button>
      </header>

      {/* =====================================================
        CONTENIDO
    ===================================================== */}
      <div className="ticket-layout">
        <div className="tpv-content">
          {/* =====================================================
            PRODUCTOS
        ===================================================== */}
          <section className="tpv-products-section">
            {/* =====================================================
              CATEGORÍAS
          ===================================================== */}
            <aside className="tpv-categories-panel">
              <div className="tpv-categories-scroll">
                {categorias.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategoriaActiva(c.id)}
                    className={`tpv-category-button ${categoriaActiva === c.id
                      ? "active"
                      : ""
                      }`}
                  >
                    {c.nombre}
                  </button>
                ))}
              </div>
            </aside>

            {/* =====================================================
              PRODUCTOS
          ===================================================== */}
            <div className="tpv-products-panel">
              <div className="tpv-products-grid">
                {productosFiltrados.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => agregarProducto(p)}
                    className="tpv-product-card"
                  >
                    <div className="tpv-product-image">
                      IMG
                    </div>

                    <div className="tpv-product-info">
                      <div className="tpv-product-name">
                        {p.nombre}
                      </div>

                      <div className="tpv-product-category">
                        {p.categoria_nombre}
                      </div>
                    </div>

                    <div className="tpv-product-price">
                      {Number(p.precio || 0).toFixed(2)} €
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* =====================================================
            TICKET
        ===================================================== */}
          <aside className="tpv-ticket-panel">
            {/* HEADER */}
            <div className="tpv-ticket-header">
              <div>
                <div className="tpv-ticket-title">
                  Ticket
                </div>
              </div>

              <div className="tpv-ticket-status">
                {ticket?.estadoFinanciero ||
                  "pendiente"}
              </div>
            </div>

            {/* =====================================================
              LÍNEAS
          ===================================================== */}

            <div className="tpv-ticket-lines-container">
              {!lineas.length ? (
                <div className="tpv-ticket-empty">
                  No hay productos
                </div>
              ) : (
                lineasAgrupadas.map(
                  ([groupKey, l]) => (
                    <SwipeableTicketLine
                      key={groupKey}
                      linea={l}
                      onDelete={() =>
                        borrarLinea(
                          l.lineasIds?.[
                          l.lineasIds.length - 1
                          ] || l.id
                        )
                      }
                      onEdit={() =>
                        abrirEditarLinea(l)
                      }
                    >
                      <div
                        className="tpv-ticket-line"
                      >

                        <div className="tpv-ticket-line-left">

                          <div className="tpv-ticket-line-main">

                            <span className="tpv-ticket-line-qty">
                              x{l.cantidad}
                            </span>

                            <span className="tpv-ticket-line-name">
                              {l.nombreProducto}
                            </span>

                          </div>

                          {!!l.propiedades?.length && (
                            <div className="tpv-ticket-line-properties">

                              {l.propiedades.map((p: any) => (
                                <div
                                  key={p.propiedad_id}
                                  className="tpv-ticket-line-property"
                                >
                                  - {p.nombre}
                                </div>
                              ))}

                            </div>
                          )}

                        </div>

                        <div className="tpv-ticket-line-price">
                          {Number(
                            l.subTotal || 0,
                          ).toFixed(2)} €
                        </div>

                      </div>
                    </SwipeableTicketLine>
                  ))
              )}
            </div>

            {/* =====================================================
              FOOTER
          ===================================================== */}
            < div className="tpv-ticket-footer" >
              <div className="tpv-ticket-summary">
                <div className="tpv-ticket-count">
                  <span>Productos</span>

                  <span>
                    {cantidadProductos}
                  </span>
                </div>

                <div className="tpv-ticket-total">
                  <div className="tpv-ticket-total-label">
                    Total
                  </div>

                  <div className="tpv-ticket-total-price">
                    {Number(
                      ticket?.total || 0,
                    ).toFixed(2)}{" "}
                    €
                  </div>
                </div>
              </div>

              {/* =====================================================
                ACCIONES
            ===================================================== */}
              < div className="tpv-ticket-actions" >
                <button
                  onClick={onEnviar}
                  className="tpv-back-button"
                >
                  Enviar
                </button>

                <button
                  className={
                    ticket?.estadoFinanciero ===
                      "pagado"
                      ? "tpv-back-button pagado"
                      : "tpv-back-button cobrar"
                  }
                  disabled={
                    ticket?.estadoFinanciero ===
                    "pagado"
                  }
                  onClick={() => {

                    if (
                      ticket?.estadoFinanciero ===
                      "pagado"
                    ) {
                      return;
                    }

                    setShowPaymentModal(true);
                  }}
                >
                  {
                    ticket?.estadoFinanciero ===
                      "pagado"
                      ? "Pagado"
                      : "Cobrar"
                  }
                </button>

                <ModalPago
                  isOpen={showPaymentModal}
                  onClose={() =>
                    setShowPaymentModal(false)
                  }
                  total={Number(ticket?.total || 0)}

                  items={
                    ticket.lineas
                      .filter(
                        (l: any) =>
                          l.estadoFinanciero !==
                          "pagado",
                      )
                      .map((l: any) => ({
                        id: String(l.id),
                        nombre: l.nombreProducto,
                        precio: l.subTotal,
                      }))
                  }
                  onConfirmarPagos={
                    handleConfirmarPagos
                  }
                />
              </div>
            </div>
          </aside>
        </div>
      </div >
      {
        configurandoProducto && (
          <div className="tpv-modal-overlay">
            <div className="tpv-modal">
              <div className="tpv-modal-header">
                <h2>
                  {configurandoProducto.nombre}
                </h2>
              </div>

              <div className="tpv-modal-body">
                {propiedadesProducto.map((p) => {
                  const activa =
                    propsSeleccionadas.some(
                      (x) => x.id === p.id,
                    );

                  return (
                    <button
                      key={p.id}
                      onClick={() =>
                        togglePropiedad(p)
                      }
                      className={`tpv-prop-button ${activa
                        ? "active"
                        : ""
                        }`}
                    >
                      <span>{p.nombre}</span>

                      <span>
                        +{Number(
                          p.precio_delta || 0,
                        ).toFixed(2)} €
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="tpv-modal-footer">
                <button
                  onClick={() => {
                    setConfigurandoProducto(
                      null,
                    );

                    setPropiedadesProducto(
                      [],
                    );

                    setPropsSeleccionadas(
                      [],
                    );
                  }}
                  className="tpv-back-button"
                >
                  Cancelar
                </button>

                <button
                  onClick={
                    confirmarConfiguracion
                  }
                  className="tpv-primary-button"
                >
                  {
                    editandoLinea
                      ? "Guardar"
                      : "Añadir"
                  }
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}