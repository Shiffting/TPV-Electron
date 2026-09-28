import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { crearTicket } from "../api/endpoints";
import { getEmpleado } from "../state/empleado";

export default function Barra() {
  const nav = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    async function abrirVenta() {
      try {
        const empleado = getEmpleado();

        const { ticketId } = await crearTicket(
          undefined,
          empleado.id,
        );

        if (activo) {
          nav(`/app/ticket/${ticketId}?modo=barra`, {
            replace: true,
          });
        }
      } catch (err: any) {
        console.error(err);

        if (activo) {
          setError(
            err?.response?.data?.error ||
            "No se pudo abrir la venta de barra",
          );
        }
      }
    }

    abrirVenta();

    return () => {
      activo = false;
    };
  }, [nav]);

  return (
    <div
      className="ticket-page"
      style={{
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {error ? (
        <div className="mesas-error">
          {error}
        </div>
      ) : (
        <div className="mesas-loading">
          Abriendo barra...
        </div>
      )}
    </div>
  );
}
