import { pool } from "../src/db/pool.js";

import { obtenerPropiedadesLineas } from "./obtenerPropiedadesLineas.js";

export async function obtenerLineasActivasTicket(ticketId) {
  // =====================================
  // LÍNEAS ACTIVAS
  // =====================================

  const [lineas] = await pool.query(
    `
    SELECT *
    FROM ticket_lineas
    WHERE ticket_id = ?
      AND lifecycle_status = 'activo'
    ORDER BY ORDER BY creado_en ASC
    `,
    [ticketId],
  );

  // =====================================
  // IDS
  // =====================================

  const lineasIds = lineas.map((l) => l.id);

  // =====================================
  // PROPIEDADES
  // =====================================

  const propsPorLinea = await obtenerPropiedadesLineas(lineasIds);

  // =====================================
  // VIEW MODEL FINAL
  // =====================================

  return lineas.map((linea) => ({
    ...linea,

    propiedades: propsPorLinea[linea.id] || [],
  }));
}
