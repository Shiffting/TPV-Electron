import { useMemo, useState } from "react";

import "../styles/product-configurator.css";

interface Props {
  producto: any;
  propiedades: any[];

  onClose: () => void;

  onConfirm: (
    propiedadesSeleccionadas: any[]
  ) => void;
}

export default function ProductConfigurator({
  producto,
  propiedades,
  onClose,
  onConfirm,
}: Props) {

  /* =====================================================
      ESTADO
  ===================================================== */

  const [seleccionadas, setSeleccionadas] =
    useState<number[]>([]);

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

  function togglePropiedad(id: number) {
    setSeleccionadas((prev) => {

      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }

      return [...prev, id];
    });
  }

  /* =====================================================
      RADIO
  ===================================================== */

  function selectRadio(
    grupo: string,
    id: number
  ) {
    const delGrupo = propiedades
      .filter(
        (p) =>
          p.grupo === grupo &&
          p.tipo === "radio"
      )
      .map((p) => p.id);

    setSeleccionadas((prev) => [
      ...prev.filter(
        (x) => !delGrupo.includes(x)
      ),
      id,
    ]);
  }

  /* =====================================================
      TOTAL
  ===================================================== */

  const total = useMemo(() => {

    let precio =
      Number(producto.precio);

    for (const id of seleccionadas) {

      const prop = propiedades.find(
        (p) => p.id === id
      );

      if (prop) {
        precio += Number(
          prop.precioDelta || 0
        );
      }
    }

    return precio;

  }, [
    seleccionadas,
    propiedades,
    producto,
  ]);

  /* =====================================================
      RENDER
  ===================================================== */

  return (
    <div className="pc-overlay">

      <div className="pc-modal">

        {/* HEADER */}

        <div className="pc-header">

          <div>
            <div className="pc-title">
              {producto.nombre}
            </div>

            <div className="pc-subtitle">
              Configurar producto
            </div>
          </div>

          <button
            className="pc-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* CONTENIDO */}

        <div className="pc-content">

          {grupos.map(([grupo, props]) => (

            <div
              key={grupo}
              className="pc-group"
            >

              <div className="pc-group-title">
                {grupo}
              </div>

              <div className="pc-options">

                {props.map((p: any) => {

                  const checked =
                    seleccionadas.includes(
                      p.id
                    );

                  return (
                    <button
                      key={p.id}
                      className={`
                        pc-option
                        ${
                          checked
                            ? "selected"
                            : ""
                        }
                      `}
                      onClick={() => {

                        if (
                          p.tipo === "radio"
                        ) {
                          selectRadio(
                            p.grupo,
                            p.id
                          );
                        } else {
                          togglePropiedad(
                            p.id
                          );
                        }
                      }}
                    >

                      <div>
                        <div className="pc-option-name">
                          {p.nombre}
                        </div>

                        {Number(
                          p.precioDelta
                        ) > 0 && (
                          <div className="pc-option-price">
                            +{
                              Number(
                                p.precioDelta
                              ).toFixed(2)
                            } €
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

          <button
            className="pc-cancel"
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
            className="pc-confirm"
            onClick={() => {

              const propsFinales =
                propiedades.filter(
                  (p) =>
                    seleccionadas.includes(
                      p.id
                    )
                );

              onConfirm(propsFinales);
            }}
          >
            Añadir · {total.toFixed(2)} €
          </button>
        </div>
      </div>
    </div>
  );
}