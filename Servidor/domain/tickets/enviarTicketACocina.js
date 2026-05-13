import { pool } from "../../src/db/pool.js";
import { io } from "../../src/app.js";
import { adjuntarAccionDeTicket } from "../../services/actionService.js";
import { incrementarVersionTicket } from "../helpers/incrementarVersionTicket.js";
import { crearSnapshotLinea } from "../helpers/crearSnapshotLinea.js";
import { finalizarMutacionTicket } from "../helpers/finalizarMutacionTicket.js";
import { ACTION_TYPES } from "../constants/actionTypes.js";

export async function enviarTicketACocina({
  ticketId,
  usuarioId = null,
  expectedVersion = null,
}) {
  const conn = await pool.getConnection();

  try {
    await conn.comenzarTransaccion();

    // =====================================
    // LÍNEAS NO ENVIADAS
    // =====================================

    const [lineas] = await conn.query(
      `
      SELECT *
      FROM ticket_lineas
      WHERE ticket_id = ?
        AND estatus_operacional = 'pendiente'
        AND estatus_financiero = 'simpa'
      `,
      [ticketId],
    );

    if (lineas.length === 0) {
      throw new Error("No hay líneas pendientes de enviar");
    }

    await cargarTicketEditable({
      conn,
      ticketId,
      expectedVersion,
    });
    //Append
    for (const linea of lineas) {
      const nuevaLineaId = await crearSnapshotLinea({
        conn,
        lineaOriginal: linea,
        overrides: {
          estatus_operacional: "enviado",
        },
      });

      const actionUuid = await adjuntarAccionDeTicket({
        conn,
        ticketId,
        actionType: ACTION_TYPES.LINE_SENT_TO_KITCHEN,
        payload: {
          lineaId: linea.id,
          productoId: linea.producto_id,
          nombreProducto: linea.nombre_producto,
          cantidad: linea.cantidad,
        },
        actorUserId: usuarioId,
        aggregateVersion: nuevaVersion,
      });

      await vincularSnapshotAAccion({
        conn,
        lineaId: nuevaLineaId,
        actionUuid,
      });
    }

    const { version } = await finalizarMutacionTicket({
      conn,
      ticketId,
    });

    return {
      ok: true,
      enviado: lineas.length,
      versiion,
    };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
