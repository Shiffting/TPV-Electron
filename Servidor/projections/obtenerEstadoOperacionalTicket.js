import { pool } from "../src/db/pool.js";

export async function obtenerEstadoOperacionalTicket(
  ticketId,
) {
  const [lineas] = await obtenerLineasActivasTicket()

  // =====================================
  // PRIORIDAD OPERACIONAL
  // =====================================

  const estados =
    lineas.map(
      (l) => l.estatus_operacional,
    );

  // =====================================
  // READY
  // =====================================

  if (estados.includes("listo")) {
    return "listo";
  }

  // =====================================
  // preparando
  // =====================================

  if (
    estados.includes("preparando")
  ) {
    return "preparando";
  }

  // =====================================
  // enviado
  // =====================================

  if (estados.includes("enviado")) {
    return "enviado";
  }

  // =====================================
  // servido
  // =====================================

  if (
    estados.length > 0 &&
    estados.every(
      (s) => s === "servido",
    )
  ) {
    return "servido";
  }

  return "created";
}