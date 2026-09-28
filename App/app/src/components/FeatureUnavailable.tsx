import { X, ShoppingCart, Sparkles } from "lucide-react";

import { FEATURES, type FeatureKey } from "../lib/features";

type Props = {
  feature: FeatureKey;
  onClose: () => void;
};

const FEATURE_INFO: Record<
  FeatureKey,
  {
    title: string;
    description: string;
  }
> = {
  [FEATURES.WAITER]: {
    title: "Gestión de sala",
    description:
      "Gestiona mesas y ventas de sala desde el TPV.",
  },
  [FEATURES.KITCHEN]: {
    title: "Estaciones",
    description:
      "Organiza los pedidos por estaciones y controla su estado en tiempo real.",
  },
  [FEATURES.DASHBOARD]: {
    title: "KPI",
    description:
      "Consulta ventas, rendimiento y estadísticas de tu negocio desde un único lugar.",
  },
  [FEATURES.STOCK]: {
    title: "Gestión de stock",
    description:
      "Controla existencias, compras, proveedores, escandallos, costes y consumo automático de productos.",
  },
};

export default function FeatureUnavailable({
  feature,
  onClose,
}: Props) {
  const info = FEATURE_INFO[feature];

  return (
    <div
      className="feature-unavailable-backdrop"
      onClick={onClose}
    >
      <section
        className="feature-unavailable-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feature-unavailable-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="feature-unavailable-close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        <div className="feature-unavailable-icon">
          <Sparkles size={24} />
        </div>

        <div>
          <div className="feature-unavailable-eyebrow">
            MÓDULO ADICIONAL
          </div>

          <h2 id="feature-unavailable-title">
            {info.title}
          </h2>

          <p>
            {info.description}
          </p>
        </div>

        <div className="feature-unavailable-available">
          <ShoppingCart size={18} />
          <span>
            Esta funcionalidad no está incluida en tu plan actual.
          </span>
        </div>

        <button
          type="button"
          className="feature-unavailable-cta"
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent("tpv:feature-request", {
                detail: { feature },
              }),
            );
          }}
        >
          Solicitar información
        </button>
      </section>
    </div>
  );
}
