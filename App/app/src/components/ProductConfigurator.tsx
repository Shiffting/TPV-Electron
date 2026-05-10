import { useMemo, useState, useEffect } from "react";

import "../styles/product-configurator.css";

interface Props {
  producto: any;

  propiedades: any[];

  seleccionadasIniciales?: any[];

  onClose: () => void;

  onConfirm: (propiedadesSeleccionadas: any[]) => void;
}

export default function ProductConfigurator({
  producto,
  propiedades,
  seleccionadasIniciales = [],

  onClose,
  onConfirm,
}: Props) {
  /* =====================================================
      ESTADO
  ===================================================== */

  const [seleccionadas, setSeleccionadas] = useState<any[]>(
    () => seleccionadasIniciales || [],
  );

  /* =====================================================
      AGRUPAR PROPIEDADES
  ===================================================== */

  const grupos = useMemo(() => {
    const map = new Map();

    for (const p of propiedades) {
      const grupo = p.grupo || "Otros";

      if (!map.has(grupo)) {
        map.set(grupo, []);
      }

      map.get(grupo).push(p);
    }

    return Array.from(map.entries());
  }, [propiedades]);

  /* =====================================================
      TOGGLE CHECK
  ===================================================== */

  function togglePropiedad(prop: any) {
    setSeleccionadas((prev) => {
      const exists = prev.some((p) => p.id === prop.id);

      if (exists) {
        return prev.filter((p) => p.id !== prop.id);
      }

      return [...prev, prop];
    });
  }

  /* =====================================================
      RADIO
  ===================================================== */

  function selectRadio(grupo: string, propSeleccionada: any) {
    const idsGrupo = propiedades
      .filter((p) => p.grupo === grupo && p.tipo === "radio")
      .map((p) => p.id);

    setSeleccionadas((prev) => [
      // quitar radios del grupo
      ...prev.filter((p) => !idsGrupo.includes(p.id)),

      // añadir nueva
      propSeleccionada,
    ]);
  }

  /* =====================================================
      TOTAL
  ===================================================== */

  const total = useMemo(() => {
    let precio = Number(producto.precio);

    for (const prop of seleccionadas) {
      precio += Number(prop.precioDelta || 0);
    }

    return precio;
  }, [seleccionadas, producto]);

  /* =====================================================
      RENDER
  ===================================================== */

  return (
    <div className="pc-overlay">
      <div className="pc-modal">
        {/* HEADER */}

        <div className="pc-header">
          <div>
            <div className="pc-title">{producto.nombre}</div>

            <div className="pc-subtitle">Configurar producto</div>
          </div>

          <button className="pc-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* CONTENIDO */}

        <div className="pc-content">
          {grupos.map(([grupo, props]) => (
            <div key={grupo} className="pc-group">
              <div className="pc-group-title">{grupo}</div>

              <div className="pc-options">
                {props.map((p: any) => {
                  const checked = seleccionadas.some((s) => s.id === p.id);

                  return (
                    <button
                      key={p.id}
                      className={`
                        pc-option
                        ${checked ? "selected" : ""}
                      `}
                      onClick={() => {
                        if (p.tipo === "radio") {
                          selectRadio(p.grupo, p);
                        } else {
                          togglePropiedad(p);
                        }
                      }}
                    >
                      <div>
                        <div className="pc-option-name">{p.nombre}</div>

                        {Number(p.precioDelta) > 0 && (
                          <div className="pc-option-price">
                            +{Number(p.precioDelta).toFixed(2)}€
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* FOOTER */}

        <div className="pc-footer">
          <button className="pc-cancel" onClick={onClose}>
            Cancelar
          </button>

          <button
            className="pc-confirm"
            onClick={() => {
              onConfirm(seleccionadas);
            }}
          >
            Añadir · {total.toFixed(2)} €
          </button>
        </div>
      </div>
    </div>
  );
}
