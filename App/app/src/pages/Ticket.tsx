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
} from "../api/endpoints";
import "../styles/index.css";
import ProductConfigurator from "../components/ProductConfigurator";
import SwipeableTicketLine from "../components/SwipeableTicketLine";

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

  const [categorias, setCategorias] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null);
  const [configurandoProducto, setConfigurandoProducto] = useState<any | null>(
    null,
  );

  /* =======================
     CARGA
  ======================= */
  async function loadTicket() {
    try {
      const res = await getTicket(ticketId);
      setLineas(res.lineas || []);
      console.log(lineas);

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
    loadTicket();
    loadCategorias();
    loadProductos();
  }, [ticketId]);

  /* =======================
     ACCIONES
  ======================= */
  async function añadirProducto(p: any, propiedadesSeleccionadas: any[] = []) {
    try {
      // PRECIO BASE
      const precioBase = Number(p.precio);

      // SUMAR EXTRAS DE PROPIEDADES
      const extraProps = propiedadesSeleccionadas.reduce(
        (acc, prop) => acc + Number(prop.precioDelta || 0),
        0,
      );

      const precioFinal = precioBase + extraProps;

      // ENVIAR AL BACKEND
      await addLinea(ticketId, {
        productoId: p.id,
        nombreProducto: p.nombre,
        cantidad: 1,
        pvp: precioFinal,

        // IDs de propiedades
        propiedades: propiedadesSeleccionadas.map((p) => ({
          propiedadId: p.id,
          texto: null,
          precioDelta: Number(p.precioDelta || 0),
        })),
      });

      await loadTicket();
    } catch (error: any) {
      console.error(error);

      alert(error.response?.data?.error || "No se pudo añadir el producto");
    }
  }

  async function restarLinea(l: Linea) {
    try {
      await decLinea(l.id);
      await loadTicket();
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al quitar producto");
    }
  }

  async function cobrar() {
    try {
      await cerrarTicket(ticketId);
      nav("/mesas");
    } catch (e: any) {
      alert(e.response?.data?.error || "Error al cobrar");
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
        añadirProducto(p);
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
    const propiedades = await getPropiedadesProducto(linea.productoId);

    setConfigurandoProducto({
      linea,
      producto: {
        id: linea.productoId,
        nombre: linea.nombreProducto,
        precio: linea.pvp,
      },
      propiedades,
    });
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

        <button onClick={() => nav("/mesas")} className="tpv-back-button">
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
                  onClick={() => añadirProducto(p)}
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
            {lineas.length === 0 && (
              <div className="tpv-ticket-empty">No hay productos añadidos</div>
            )}
            {lineas.map((l) => (
              <SwipeableTicketLine
                key={l.id}
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
                <span>{lineas.length}</span>
              </div>

              <div className="tpv-summary-total">
                <span>Total</span>

                <span>{Number(total).toFixed(2)} €</span>
              </div>
            </div>

            {/* BOTONES */}
            <div className="tpv-actions">
              <button className="tpv-secondary-button">Opciones</button>

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
          onClose={() => setConfigurandoProducto(null)}
          onConfirm={async (propsSeleccionadas) => {
            await añadirProducto(
              configurandoProducto.producto,
              propsSeleccionadas,
            );

            setConfigurandoProducto(null);
          }}
        />
      )}
    </div>
  );
}
