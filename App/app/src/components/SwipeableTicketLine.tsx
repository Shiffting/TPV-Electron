import {
  ReactNode,
  useRef,
  useState,
} from "react";

interface Props {
  children: ReactNode;

  linea: any;

  onDelete: () => void;
  onEdit: () => void;
}

export default function SwipeableTicketLine({
  children,
  linea,
  onDelete,
  onEdit,
}: Props) {

  const startX = useRef(0);
  const [offsetX, setOffsetX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const deletedRef = useRef(false);
  const movedRef = useRef(false);
  const offsetRef = useRef(0);

  function handlePointerDown(
    e: React.PointerEvent,
  ) {
    (
      e.target as HTMLElement
    ).setPointerCapture(
      e.pointerId,
    );
    startX.current = e.clientX;
    setDragging(true);
    movedRef.current = false;
  }

  function handlePointerMove(
    e: React.PointerEvent,
  ) {

    if (!dragging) return;

    const delta = e.clientX - startX.current;

    // SOLO swipe izquierda
    if (delta < 0) {
      setOffsetX(
        Math.max(delta, -120),
      );
    }

    if (Math.abs(delta) > 10) {
      movedRef.current = true;
    }

    const nextOffset = Math.max(delta, -120);
    offsetRef.current = nextOffset;
    setOffsetX(nextOffset);
  }

  function handlePointerUp() {
    setDragging(false);

    const finalOffset =
      offsetRef.current;

    // DELETE
    if (finalOffset < -90) {
      onDelete();
      setOffsetX(0);
      return;
    }

    // TAP
    if (
      Math.abs(finalOffset) < 10
    ) {
      onEdit();
    }

    setOffsetX(0);

    setTimeout(() => {
      offsetRef.current = 0;
    }, 50);
  }

  return (

    <div
      className={`tpv-ticket-swipe-wrapper ${offsetX < -8
        ? "swiping"
        : ""
        }`}
    >

      {/* FONDO DELETE */}
      <div className="tpv-ticket-delete-bg">
        🗑
      </div>

      {/* CONTENIDO DESLIZABLE */}
      <div
        style={{
          transform:
            `translateX(${offsetX}px)`,

          transition:
            dragging
              ? "none"
              : "transform .2s ease",
        }}

        onPointerDown={
          handlePointerDown
        }

        onPointerMove={
          handlePointerMove
        }

        onPointerUp={
          handlePointerUp
        }

        onPointerCancel={
          handlePointerUp
        }
      >

        {children}

      </div>

    </div>
  );
}