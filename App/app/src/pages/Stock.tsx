import {
  Package,
  ArrowDownUp,
  ShoppingCart,
  Truck,
  ChefHat,
  ClipboardList,
  Plus,
  AlertTriangle,
} from "lucide-react";

import "../styles/stock.css";

type Section = {
  id: string;
  label: string;
  icon: typeof Package;
};

const SECTIONS: Section[] = [
  { id: "inventario", label: "Inventario", icon: Package },
  { id: "movimientos", label: "Movimientos", icon: ArrowDownUp },
  { id: "compras", label: "Compras", icon: ShoppingCart },
  { id: "proveedores", label: "Proveedores", icon: Truck },
  { id: "recetas", label: "Recetas / escandallos", icon: ChefHat },
];

export default function Stock() {
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

        <button type="button" className="stock-primary-button">
          <Plus size={19} />
          Nuevo artículo
        </button>
      </header>

      <div className="stock-summary">
        <div className="stock-summary-card">
          <span>Artículos</span>
          <strong>0</strong>
          <small>Configurados en stock</small>
        </div>

        <div className="stock-summary-card">
          <span>Stock bajo</span>
          <strong>0</strong>
          <small>Por debajo del mínimo</small>
        </div>

        <div className="stock-summary-card">
          <span>Valor del stock</span>
          <strong>0,00 €</strong>
          <small>Coste actual estimado</small>
        </div>

        <div className="stock-summary-card stock-summary-warning">
          <span>Alertas</span>
          <strong>0</strong>
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
              Aquí aparecerán los artículos de stock y sus existencias actuales.
            </p>
          </div>

          <button type="button" className="stock-secondary-button">
            <ClipboardList size={18} />
            Inventario físico
          </button>
        </div>

        <div className="stock-empty">
          <div className="stock-empty-icon">
            <Package size={30} />
          </div>

          <h3>Aún no tienes artículos de stock</h3>

          <p>
            Empieza creando productos como botellas, alimentos o consumibles.
            Después podremos asociarlos a tus productos del TPV y descontar
            automáticamente el stock según lo que vendas.
          </p>

          <button type="button" className="stock-primary-button">
            <Plus size={18} />
            Crear primer artículo
          </button>
        </div>
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
              Un cubata puede consumir 1/8 de botella de whisky y 1/3 de
              botella de refresco automáticamente.
            </p>
          </div>
        </div>

        <div className="stock-info-card">
          <AlertTriangle size={21} />
          <div>
            <h3>Control real</h3>
            <p>
              Una devolución de dinero no devuelve automáticamente producto al
              almacén: el stock refleja lo que físicamente queda disponible.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
