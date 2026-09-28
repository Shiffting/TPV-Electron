import { useEffect, useState } from "react";
import {
  Package,
  ArrowDownUp,
  ShoppingCart,
  Truck,
  ChefHat,
  ClipboardList,
  Plus,
  AlertTriangle,
  X,
  Boxes,
} from "lucide-react";

import { api } from "../api/client";
import "../styles/stock.css";

type Section = {
  id: string;
  label: string;
  icon: typeof Package;
};

type StockArticle = {
  id: number;
  nombre: string;
  unidad: string;
  stockActual: number;
  stockMinimo: number;
  costeMedio: number;
  fraccionable: number;
  fraccionesPorUnidad: number | null;
  nombreFraccion: string | null;
  activo: number;
};

const SECTIONS: Section[] = [
  { id: "inventario", label: "Inventario", icon: Package },
  { id: "movimientos", label: "Movimientos", icon: ArrowDownUp },
  { id: "compras", label: "Compras", icon: ShoppingCart },
  { id: "proveedores", label: "Proveedores", icon: Truck },
  { id: "recetas", label: "Recetas / escandallos", icon: ChefHat },
];

const emptyForm = {
  nombre: "",
  unidad: "unidad",
  stockActual: "0",
  stockMinimo: "0",
  costeMedio: "0",
  fraccionable: false,
  fraccionesPorUnidad: "8",
  nombreFraccion: "",
};

export default function Stock() {
  const [articulos, setArticulos] = useState<StockArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cargarArticulos = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/stock/articulos");
      setArticulos(data);
    } catch (e) {
      console.error(e);
      setError("No se han podido cargar los artículos de stock.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarArticulos();
  }, []);

  const abrirNuevo = () => {
    setForm(emptyForm);
    setError("");
    setModal(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim()) {
      setError("Indica el nombre del artículo.");
      return;
    }

    if (form.fraccionable && Number(form.fraccionesPorUnidad) <= 0) {
      setError("Indica cuántas fracciones aproximadas salen de una unidad.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await api.post("/stock/articulos", {
        nombre: form.nombre,
        unidad: form.unidad,
        stockActual: Number(form.stockActual) || 0,
        stockMinimo: Number(form.stockMinimo) || 0,
        costeMedio: Number(form.costeMedio) || 0,
        fraccionable: form.fraccionable,
        fraccionesPorUnidad: form.fraccionable
          ? Number(form.fraccionesPorUnidad)
          : null,
        nombreFraccion: form.fraccionable
          ? form.nombreFraccion || null
          : null,
      });

      setModal(false);
      await cargarArticulos();
    } catch (e: any) {
      setError(
        e?.response?.data?.error ||
          "No se ha podido crear el artículo.",
      );
    } finally {
      setSaving(false);
    }
  };

  const stockBajo = articulos.filter(
    (a) => a.stockActual <= a.stockMinimo,
  ).length;

  const valorStock = articulos.reduce(
    (total, a) => total + a.stockActual * a.costeMedio,
    0,
  );

  const formatearStock = (a: StockArticle) =>
    `${Number(a.stockActual).toLocaleString("es-ES", {
      maximumFractionDigits: 3,
    })} ${a.unidad}`;

  return (
    <div className="stock-page">
      <header className="stock-header">
        <div>
          <div className="stock-eyebrow">GESTIÓN</div>
          <h1>Stock</h1>
          <p>
            Controla existencias, compras, costes y consumo de tu negocio.
          </p>
        </div>

        <button type="button" className="stock-primary-button" onClick={abrirNuevo}>
          <Plus size={19} />
          Nuevo artículo
        </button>
      </header>

      <div className="stock-summary">
        <div className="stock-summary-card">
          <span>Artículos</span>
          <strong>{articulos.length}</strong>
          <small>Configurados en stock</small>
        </div>

        <div className="stock-summary-card">
          <span>Stock bajo</span>
          <strong>{stockBajo}</strong>
          <small>Por debajo del mínimo</small>
        </div>

        <div className="stock-summary-card">
          <span>Valor del stock</span>
          <strong>{valorStock.toLocaleString("es-ES", {
            style: "currency",
            currency: "EUR",
          })}</strong>
          <small>Coste actual estimado</small>
        </div>

        <div className="stock-summary-card stock-summary-warning">
          <span>Alertas</span>
          <strong>{stockBajo}</strong>
          <small>Requieren revisión</small>
        </div>
      </div>

      <nav className="stock-tabs" aria-label="Gestión de stock">
        {SECTIONS.map(({ id, label, icon: Icon }, index) => (
          <button
            key={id}
            type="button"
            className={`stock-tab ${index === 0 ? "active" : ""}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <section className="stock-panel">
        <div className="stock-panel-header">
          <div>
            <h2>Inventario</h2>
            <p>
              Los artículos se almacenan en su unidad habitual. Por defecto,
              cada venta consume 1 unidad completa.
            </p>
          </div>

          <button type="button" className="stock-secondary-button">
            <ClipboardList size={18} />
            Inventario físico
          </button>
        </div>

        {loading ? (
          <div className="stock-empty">
            <Boxes size={34} />
            <h3>Cargando inventario...</h3>
          </div>
        ) : articulos.length === 0 ? (
          <div className="stock-empty">
            <div className="stock-empty-icon">
              <Package size={30} />
            </div>

            <h3>Aún no tienes artículos de stock</h3>

            <p>
              Empieza creando productos como botellas, alimentos o consumibles.
              Por defecto se consumirán a razón de 1/1. Solo tendrás que
              configurar fracciones cuando un artículo realmente lo necesite.
            </p>

            <button type="button" className="stock-primary-button" onClick={abrirNuevo}>
              <Plus size={18} />
              Crear primer artículo
            </button>
          </div>
        ) : (
          <div className="stock-table-wrap">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Artículo</th>
                  <th>Existencias</th>
                  <th>Mínimo</th>
                  <th>Coste</th>
                  <th>Consumo</th>
                </tr>
              </thead>
              <tbody>
                {articulos.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.nombre}</strong>
                      <small>{a.unidad}</small>
                    </td>
                    <td className={a.stockActual <= a.stockMinimo ? "stock-low" : ""}>
                      {formatearStock(a)}
                    </td>
                    <td>{Number(a.stockMinimo).toLocaleString("es-ES")}</td>
                    <td>{Number(a.costeMedio).toLocaleString("es-ES", {
                      style: "currency",
                      currency: "EUR",
                    })}</td>
                    <td>
                      {a.fraccionable
                        ? `Fraccionado: 1/${Number(a.fraccionesPorUnidad)}`
                        : "1/1"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="stock-info-grid">
        <div className="stock-info-card">
          <ArrowDownUp size={21} />
          <div>
            <h3>Movimientos</h3>
            <p>
              Entradas, salidas, ajustes, mermas y consumos quedan registrados
              para poder saber por qué ha cambiado el stock.
            </p>
          </div>
        </div>

        <div className="stock-info-card">
          <ChefHat size={21} />
          <div>
            <h3>Escandallos</h3>
            <p>
              Un cubata podrá consumir una fracción aproximada de una botella,
              mientras una lata de refresco consumirá 1/1.
            </p>
          </div>
        </div>

        <div className="stock-info-card">
          <AlertTriangle size={21} />
          <div>
            <h3>Control real</h3>
            <p>
              Las fracciones sirven para hacer un control orientativo: el
              rendimiento real de una botella puede variar según el servicio.
            </p>
          </div>
        </div>
      </section>

      {modal && (
        <div className="stock-modal-backdrop" onMouseDown={() => !saving && setModal(false)}>
          <div className="stock-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="stock-modal-header">
              <div>
                <div className="stock-eyebrow">NUEVO ARTÍCULO</div>
                <h2>Crear artículo de stock</h2>
              </div>
              <button
                type="button"
                className="stock-modal-close"
                onClick={() => setModal(false)}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <div className="stock-form-grid">
              <label>
                Nombre
                <input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej. Whisky JB"
                  autoFocus
                />
              </label>

              <label>
                Unidad de stock
                <input
                  value={form.unidad}
                  onChange={(e) => setForm({ ...form, unidad: e.target.value })}
                  placeholder="botella, lata, kg..."
                />
              </label>

              <label>
                Stock inicial
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.stockActual}
                  onChange={(e) => setForm({ ...form, stockActual: e.target.value })}
                />
              </label>

              <label>
                Stock mínimo
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.stockMinimo}
                  onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })}
                />
              </label>

              <label>
                Coste medio por unidad
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.costeMedio}
                  onChange={(e) => setForm({ ...form, costeMedio: e.target.value })}
                />
              </label>

              <label className="stock-form-check">
                <input
                  type="checkbox"
                  checked={form.fraccionable}
                  onChange={(e) => setForm({ ...form, fraccionable: e.target.checked })}
                />
                <span>
                  <strong>Permitir consumo por fracciones</strong>
                  <small>
                    Solo actívalo cuando una unidad pueda repartirse entre
                    varios servicios.
                  </small>
                </span>
              </label>

              {form.fraccionable && (
                <>
                  <label>
                    Fracciones aproximadas por unidad
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={form.fraccionesPorUnidad}
                      onChange={(e) =>
                        setForm({ ...form, fraccionesPorUnidad: e.target.value })
                      }
                    />
                  </label>

                  <label>
                    Nombre de la fracción (opcional)
                    <input
                      value={form.nombreFraccion}
                      onChange={(e) =>
                        setForm({ ...form, nombreFraccion: e.target.value })
                      }
                      placeholder="copa, chupito, ración..."
                    />
                  </label>
                </>
              )}
            </div>

            <div className="stock-fraction-note">
              {form.fraccionable ? (
                <>
                  <strong>Control orientativo.</strong> Si indicas 5 fracciones,
                  el sistema estimará que cada consumo equivale a 1/5 de la
                  unidad. No significa que físicamente todas las unidades den
                  exactamente cinco servicios.
                </>
              ) : (
                <>
                  <strong>Consumo normal:</strong> este artículo se considerará
                  1/1. Una venta descontará una unidad completa.
                </>
              )}
            </div>

            {error && <div className="stock-form-error">{error}</div>}

            <div className="stock-modal-actions">
              <button
                type="button"
                className="stock-secondary-button"
                onClick={() => setModal(false)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="stock-primary-button"
                onClick={guardar}
                disabled={saving}
              >
                {saving ? "Guardando..." : "Crear artículo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
