import { pool } from "../../src/db/pool.js";

export async function obtenerLineasActivasTicket(
  ticketId,
) {
  const [lineas] =
    await pool.query(
      `
      SELECT *
      FROM ticket_lineas
      WHERE ticket_id = ?
        AND lifecycle_status =
          'activo'
      ORDER BY id ASC
      `,
      [ticketId],
    );

  return lineas;
}