import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getTicket,
  addLinea,
  decLinea,
  getCategorias,
  getProductos,
  cerrarTicket,
} from "../api/endpoints";

/* =======================
   TIPOS
======================= */
interface Linea {
  id: number;
  nombreProducto: string;
  cantidad: number;
  totalLinea: number;
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

  /* =======================
     CARGA
  ======================= */
  async function loadTicket() {
    try {
      const res = await getTicket(ticketId);
      console.log(res);
      setLineas(res.lineas || []);

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
  async function añadirProducto(p: any) {
    try {
      await addLinea(ticketId, {
        productoId: p.id,
        nombreProducto: p.nombre,
        cantidad: 1,
        pvp: Number(p.precio),
        propiedades: [],
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

  return (
    <div className="h-screen flex flex-col bg-zinc-900 text-white">
      {/* HEADER */}
      <div className="p-3 border-b border-zinc-700 flex justify-between">
        <div>Ticket #{ticketId}</div>
        <button onClick={() => nav("/mesas")}>Volver</button>
      </div>

      {/* CONTENIDO */}
      <div className="flex flex-1">
        {/* CATEGORÍAS */}
        <div className="w-1/4 bg-zinc-800 p-2 overflow-y-auto">
          {categorias.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoriaActiva(c.id)}
              className={`w-full text-left px-3 py-2 mb-2 rounded ${
                categoriaActiva === c.id ? "bg-blue-600" : "bg-zinc-700"
              }`}
            >
              {c.nombre}
            </button>
          ))}
        </div>

        {/* PRODUCTOS */}
        <div className="w-3/4 bg-zinc-700 p-2 grid grid-cols-3 gap-2 overflow-y-auto">
          {productosFiltrados.map((p) => (
            <button
              key={p.id}
              onClick={() => añadirProducto(p)}
              className="bg-zinc-600 p-3 rounded hover:bg-zinc-500"
            >
              <div>{p.nombre}</div>
              <div className="text-sm">{p.precio} €</div>
            </button>
          ))}
        </div>
      </div>

      {/* TICKET */}
      <div className="h-1/3 bg-zinc-800 p-3 overflow-y-auto">
        {lineas.map((l) => (
          <div
            key={l.id}
            className="flex justify-between mb-2 bg-zinc-700 p-3 rounded cursor-pointer hover:bg-red-900/30"
            onClick={() => restarLinea(l)}
          >
            <div>
              {l.nombreProducto} × {l.cantidad}
            </div>
            <div>{Number(l.totalLinea).toFixed(2)} €</div>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="p-3 border-t border-zinc-700 flex justify-between items-center">
        <div className="text-xl font-bold">
          Total: {Number(total).toFixed(2)} €
        </div>
        <div className="flex gap-2">
          <button
            onClick={cobrar}
            className="bg-green-600 px-6 py-3 rounded font-medium"
          >
            Cobrar
          </button>
        </div>
      </div>
    </div>
  );
}
