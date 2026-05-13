import { pool } from "../src/db/pool.js";

export async function obtenerHistorialLinea(lineGroupUuid) {
  const [rows] = await pool.query(
    `
    WITH RECURSIVE historial AS (

      -- =================================
      -- SNAPSHOT MÁS RECIENTE
      -- =================================

      SELECT
        tl.*

      FROM ticket_lineas tl

      WHERE tl.line_group_uuid = ?

      ORDER BY tl.id DESC

      LIMIT 1

      UNION ALL

      -- =================================
      -- SNAPSHOT ANTERIOR
      -- =================================

      SELECT
        anterior.*

      FROM ticket_lineas anterior

      INNER JOIN historial h
        ON h.previous_linea_id =
           anterior.id
    )

    SELECT
      h.*,

      ta.action_type,
      ta.actor_user_id,
      ta.created_at AS action_created_at,
      ta.payload AS action_payload

    FROM historial h

    LEFT JOIN ticket_actions ta
      ON ta.action_uuid =
         h.created_by_action_uuid

    ORDER BY h.id ASC
    `,
    [lineGroupUuid],
  );

  return rows;
}
