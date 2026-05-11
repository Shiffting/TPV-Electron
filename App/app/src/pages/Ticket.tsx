import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getTicket,
  addLinea,
  decLinea,
  getCategorias,
  getProductos,
  cerrarTicket,
  getPropiedadesProducto,
  updateLinea,
  unlockMesa,
  pingMesaLock,
} from "../api/endpoints";
import "../styles/ticket.css";
import ProductConfigurator from "../components/ProductConfigurator";
import SwipeableTicketLine from "../components/SwipeableTicketLine";
import { socket } from "../lib/socket";

/* =======================
   INTERFACES
======================= */
interface PropiedadLinea {
  propiedad_nombre?: string;
  precioDelta?: number;
}

interface Linea {
  id: number;
  ticketId: number;
  productoId: number;
  nombreProducto: string;
  cantidad: number;
  pvp: number;
  pvpBase: number;
  totalLinea: number;
  estado: string;
  propiedades?: PropiedadLinea[];
}

/* =======================
   COMPONENTE
======================= */
export default function Ticket() {
  const { id } = useParams();
  const ticketId = Number(id);
  const nav = useNavigate();

  const [lineas, setLineas] = useState<Linea[]>([]);
  const [total, setTotal] = useState(0);
  const [mesaId, setMesaId] = useState<number | null>(null);

  const [categorias, setCategorias] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null);
  const [configurandoProducto, setConfigurandoProducto] = useState<any | null>(
    null,
  );

  const [pedidoTemporal, setPedidoTemporal] = useState<any[]>([]);

  /* =======================
     CARGA
  ======================= */
  async function loadTicket() {
    try {
      const res = await getTicket(ticketId);
      const ls = res.lineas || [];

      setLineas(ls);
      setMesaId(res.ticket?.mesaId || null);

      setPedidoTemporal(ls);

      // El total viene dentro del ticket
      setTotal(res.ticket?.totalNeto || res.ticket?.totalBruto || 0);
    } catch (e) {
      console.error("Error cargando ticket:", e);
    }
  }

  async function loadCategorias() {
    const res = await getCategorias();
    setCategorias(res);
    if (res.length > 0) setCategoriaActiva(res[0].id);
  }

  async function loadProductos() {
    const res = await getProductos();
    setProductos(res);
  }

  useEffect(() => {
    // =====================================
    // CARGA INICIAL
    // =====================================

    loadTicket();

    loadCategorias();

    loadProductos();

    // =====================================
    // LOCK PING
    // =====================================

    let interval: any = null;

    if (mesaId) {
      interval = setInterval(() => {
        pingMesaLock(mesaId);
      }, 30000);
    }

    // =====================================
    // SOCKETS
    // =====================================

    function onTicketUpdate(id: number) {
      if (id === ticketId) {
        loadTicket();
      }
    }

    socket.on("ticket:update", onTicketUpdate);

    // =====================================
    // CLEANUP
    // =====================================

    return () => {
      if (interval) {
        clearInterval(interval);
      }

      if (mesaId) {
        unlockMesa(mesaId);
      }

      socket.off("ticket:update", onTicketUpdate);
    };
  }, [ticketId, mesaId]);

  /* =======================
     ACCIONES
  ======================= */
  async function añadirProducto(p: any, propiedadesSeleccionadas: any[] = []) {
    const precioBase = Number(p.precio);

    const extraProps = propiedadesSeleccionadas.reduce(
      (acc, prop) => acc + Number(prop.precioDelta || 0),
      0,
    );

    const precioFinal = precioBase + extraProps;

    const nuevaLinea = {
      tempId: crypto.randomUUID(),
      productoId: p.id,
      nombreProducto: p.nombre,
      cantidad: 1,
      pvp: precioFinal,
      pvpBase: precioBase,
      totalLinea: precioFinal,
      estado: "pendiente",
      propiedades: propiedadesSeleccionadas.map((prop) => ({
        propiedadId: prop.id,
        propiedad_nombre: prop.nombre,
        precioDelta: Number(prop.precioDelta || 0),
      })),
    };

    setPedidoTemporal((prev) => [...prev, nuevaLinea]);
  }

  async function restarLinea(l: Linea) {
    try {
      await decLinea(l.id);
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al quitar producto");
    }
  }

  async function cobrar() {
    try {
      await cerrarTicket(ticketId);
      nav("/app/mesas");
    } catch (e: any) {
      alert(e.response?.data?.error || "Error al cobrar");
    }
  }

  async function enviarPedido() {
    try {
      for (const l of pedidoTemporal) {
        // SOLO enviar líneas nuevas
        if (l.id) continue;

        await addLinea(ticketId, {
          productoId: l.productoId,
          nombreProducto: l.nombreProducto,
          cantidad: l.cantidad,
          pvp: l.pvp,
          pvpBase: l.pvpBase,
          propiedades:
            l.propiedades?.map((p: any) => ({
              propiedadId: p.propiedadId,

              precioDelta: p.precioDelta || 0,
            })) || [],
        });
      }

      await loadTicket();
      nav("/app/mesas");
    } catch (error) {
      console.error(error);

      alert("Error enviando pedido");
    }
  }

  const productosFiltrados = productos.filter(
    (p) => p.categoria_id === categoriaActiva,
  );

  async function abrirConfiguradorProducto(p: any) {
    try {
      const propiedadesRaw = await getPropiedadesProducto(p.id);

      const propiedades = propiedadesRaw.map((prop: any) => ({
        id: prop.id,
        nombre: prop.nombre,
        precioDelta: Number(prop.precio_delta || 0),
      }));

      if (!propiedades.length) {
        await añadirProducto(p);
        return;
      }

      setConfigurandoProducto({
        producto: p,
        propiedades,
      });
    } catch (error) {
      console.error(error);
    }
  }

  async function editarLinea(linea: Linea) {
    try {
      // =====================================
      // PROPIEDADES DISPONIBLES DEL PRODUCTO
      // =====================================
      const propiedadesRaw = await getPropiedadesProducto(linea.productoId);

      // =====================================
      // NORMALIZAR → camelCase
      // =====================================
      const propiedades = propiedadesRaw.map((prop: any) => ({
        id: prop.id,
        nombre: prop.nombre,
        precioDelta: Number(prop.precio_delta || 0),
      }));

      // =====================================
      // PROPIEDADES YA SELECCIONADAS
      // =====================================
      const seleccionadasIniciales =
        linea.propiedades?.map((p: any) => ({
          // IMPORTANTE:
          // el modal usa "id"
          id: Number(p.propiedad_id ?? p.propiedadId ?? p.id),
          nombre: p.propiedad_nombre ?? p.propiedadNombre ?? p.nombre,
          precioDelta: Number(p.precio_delta ?? p.precioDelta ?? 0),
        })) || [];

      // =====================================
      // ABRIR MODAL
      // =====================================
      setConfigurandoProducto({
        modo: "editar",
        linea,
        producto: {
          id: linea.productoId,
          nombre: linea.nombreProducto,
          precio: linea.pvpBase,
        },
        propiedades,
        seleccionadasIniciales,
      });
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="ticket-page">
      {/* =========================================================
        HEADER SUPERIOR
    ========================================================== */}
      <header className="tpv-header">
        <div className="tpv-header-left">
          <div className="tpv-page-title">Mesa</div>

          <div className="tpv-ticket-badge">Ticket #{ticketId}</div>
        </div>

        <button
          onClick={async () => {
            try {
              if (mesaId) {
                await unlockMesa(mesaId);
              }
            } catch (e) {
              console.error(e);
            }

            nav("/app/mesas");
          }}
          className="tpv-back-button"
        >
          Volver
        </button>
      </header>

      {/* =========================================================
        CONTENIDO PRINCIPAL
    ========================================================== */}
      <div className="tpv-content">
        {/* =====================================================
          COLUMNA IZQUIERDA
          Categorías + Productos
      ====================================================== */}
        <section className="tpv-products-section">
          {/* ================================================
            CATEGORÍAS
        ================================================= */}
          <aside className="tpv-categories-panel">
            <div className="tpv-categories-scroll">
              {categorias.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoriaActiva(c.id)}
                  className={`tpv-category-button ${
                    categoriaActiva === c.id ? "active" : ""
                  }`}
                >
                  {c.nombre}
                </button>
              ))}
            </div>
          </aside>

          {/* ================================================
            PRODUCTOS
        ================================================= */}
          <div className="tpv-products-panel">
            <div className="tpv-products-grid">
              {productosFiltrados.map((p) => (
                <button
                  key={p.id}
                  onClick={() => abrirConfiguradorProducto(p)}
                  className="tpv-product-card"
                >
                  {/* ICONO / IMAGEN */}
                  <div className="tpv-product-image">IMG</div>

                  {/* INFO */}
                  <div className="tpv-product-info">
                    <div className="tpv-product-name">{p.nombre}</div>

                    <div className="tpv-product-category">ID {p.id}</div>
                  </div>

                  {/* PRECIO */}
                  <div className="tpv-product-price">
                    {Number(p.precio).toFixed(2)} €
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================
          PANEL DERECHO
          TICKET
      ====================================================== */}
        <aside className="tpv-ticket-panel">
          {/* ================================================
            HEADER TICKET
        ================================================= */}
          <div className="tpv-ticket-header">
            <div>
              <div className="tpv-ticket-title">Ticket #{ticketId}</div>

              <div className="tpv-ticket-subtitle">Mesa activa</div>
            </div>

            <div className="tpv-ticket-status">ABIERTO</div>
          </div>

          {/* ================================================
            LÍNEAS DEL TICKET
        ================================================= */}
          <div className="tpv-ticket-lines">
            {pedidoTemporal.length === 0 && (
              <div className="tpv-ticket-empty">No hay productos añadidos</div>
            )}
            {pedidoTemporal.map((l) => (
              <SwipeableTicketLine
                key={l.id || l.tempId}
                linea={l}
                onDelete={() => restarLinea(l)}
                onEdit={() => editarLinea(l)}
              />
            ))}
          </div>

          {/* ================================================
            FOOTER TICKET
        ================================================= */}
          <div className="tpv-ticket-footer">
            {/* RESUMEN */}
            <div className="tpv-summary">
              <div className="tpv-summary-row">
                <span>Productos</span>
                <span>{pedidoTemporal.length}</span>
              </div>

              <div className="tpv-summary-total">
                <span>Total</span>

                <span>
                  {pedidoTemporal
                    .reduce((acc, l) => acc + Number(l.totalLinea || 0), 0)
                    .toFixed(2)}{" "}
                  €
                </span>
              </div>
            </div>

            {/* BOTONES */}
            <div className="tpv-actions">
              <button className="tpv-secondary-button">Opciones</button>
              <button onClick={enviarPedido} className="tpv-secondary-button">
                Enviar
              </button>
              <button onClick={cobrar} className="tpv-primary-button">
                Cobrar
              </button>
            </div>
          </div>
        </aside>
      </div>
      {configurandoProducto && (
        <ProductConfigurator
          producto={configurandoProducto.producto}
          propiedades={configurandoProducto.propiedades}
          seleccionadasIniciales={configurandoProducto.seleccionadasIniciales}
          onClose={() => setConfigurandoProducto(null)}
          onConfirm={async (propsSeleccionadas) => {
            // =====================================
            // EDITAR
            // =====================================
            if (configurandoProducto.modo === "editar") {
              await updateLinea(configurandoProducto.linea.id, {
                propiedades: propsSeleccionadas.map((p: any) => ({
                  propiedadId: p.id,

                  precioDelta: p.precioDelta || 0,
                })),
              });
            } else {
              // =====================================
              // CREAR NUEVO
              // =====================================
              await añadirProducto(
                configurandoProducto.producto,
                propsSeleccionadas,
              );
            }
            setConfigurandoProducto(null);
          }}
        />
      )}
    </div>
  );
}
