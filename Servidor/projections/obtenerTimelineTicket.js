import { pool } from "../src/db/pool.js";

export async function obtenerTimelineTicket(
  ticketId,
) {
  const [acciones] = await pool.query(
    `
    SELECT
      ta.*
    FROM ticket_actions ta
    WHERE ta.ticket_id = ?
    ORDER BY ta.id ASC
    `,
    [ticketId],
  );

  return acciones.map((a) => ({
    id: a.id,

    actionUuid:
      a.action_uuid,

    actionType:
      a.action_type,

    payload:
      JSON.parse(a.payload),

    createdAt:
      a.creado_en,

    reversedBy:
      a.reversed_by_action_uuid,
  }));
}