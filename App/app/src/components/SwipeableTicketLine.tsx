import { useRef, useState } from "react";

interface Props {
  linea: any;
  onDelete: () => void;
  onEdit: () => void;
}

export default function SwipeableTicketLine({
  linea,
  onDelete,
  onEdit,
}: Props) {
  const startX = useRef(0);

  const [offsetX, setOffsetX] = useState(0);
  const [dragging, setDragging] = useState(false);

  function handlePointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    setDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return;

    const delta = e.clientX - startX.current;

    // SOLO swipe izquierda
    if (delta < 0) {
      setOffsetX(Math.max(delta, -120));
    }
  }

  function handlePointerUp() {
    setDragging(false);

    // umbral delete
    if (offsetX < -90) {
      onDelete();
    }

    setOffsetX(0);
  }

  return (
    <div
      className={`tpv-ticket-swipe-wrapper ${offsetX < -8 ? "swiping" : ""}`}
    >
      {/* FONDO ROJO */}
      <div className="tpv-ticket-delete-bg">🗑</div>

      {/* TARJETA */}
      <div
        className="tpv-ticket-line"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: dragging ? "none" : "transform 0.2s ease",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={() => {
          if (Math.abs(offsetX) < 5) {
            onEdit();
          }
        }}
      >
        {/* IZQUIERDA */}
        <div className="tpv-ticket-line-left">
          <div className="tpv-ticket-line-top">
            <span className="tpv-ticket-edit-icon">✏</span>

            <div className="tpv-ticket-line-name">{linea.nombreProducto}</div>
          </div>

          <div className="tpv-ticket-line-qty">x{linea.cantidad}</div>

          {linea.propiedades?.length > 0 && (
            <div className="tpv-ticket-line-properties">
              {linea.propiedades
                .map((p: any) => p.propiedad_nombre)
                .join(" · ")}
            </div>
          )}
        </div>

        {/* PRECIO */}
        <div className="tpv-ticket-line-price">
          {Number(linea.totalLinea).toFixed(2)} €
        </div>
      </div>
    </div>
  );
}
