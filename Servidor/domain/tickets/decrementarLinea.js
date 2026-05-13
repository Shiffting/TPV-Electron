import { pool } from "../../src/db/pool.js";
import { adjuntarAccionDeTicket } from "../../services/actionService.js";
import { recalcularTicket } from "./recalcularTicket.js";
import { emitirActualizacionTicket } from "../../events/emitirActualizacionTicket.js";
import { crearSnapshotLinea } from "../helpers/crearSnapshotLinea.js";
import { ACTION_TYPES } from "../constants/actionTypes.js";
import { incrementarVersionTicket } from "../helpers/incrementarVersionTicket.js";
import { ESTATUS_FINANCIERO } from "../constants/estatusFinanciero.js";

export async function decrementarLinea({
  lineaId,
  usuarioId = null,
  expectedVersion = null,
}) {
  const conn = await pool.getConnection();

  try {
    await conn.comenzarTransaccion();

    // =====================================
    // LÍNEA
    // =====================================

    const [[linea]] = await conn.query(
      `
      SELECT *
      FROM ticket_lineas
      WHERE id = ?
      LIMIT 1
      FOR UPDATE
      `,
      [lineaId],
    );

    if (!linea) {
      throw new Error("Línea no encontrada");
    }

    if (linea.lifecycle_status === "anulado") {
      throw new Error("La línea ya está anulada");
    }

    if (linea.estatus_financiero !== ESTATUS_FINANCIERO.SIMPA) {
      throw new Error("La línea ya está pagada");
    }

    await cargarTicketEditable({
      conn,
      ticketId: linea.ticket_id,
      expectedVersion,
    });

    // =====================================
    // NUEVA CANTIDAD
    // =====================================

    const nuevaCantidad = linea.cantidad - 1;

    // =====================================
    // VOID SI LLEGA A 0
    // =====================================

    if (nuevaCantidad <= 0) {
      await adjuntarAccionDeTicket({
        conn,
        ticketId: linea.ticket_id,
        actionType: ACTION_TYPES.LINE_VOIDED,
        payload: {
          lineaId,
          nombreProducto: linea.nombre_producto,
        },
        actorUserId: usuarioId,
        aggregateVersion: nuevaVersion,
      });

      await conn.execute(
        `
        UPDATE ticket_lineas
        SET
          lifecycle_status =
            'anulado'
        WHERE id = ?
        `,
        [lineaId],
      );
    } else {
      // =====================================
      // NUEVO SNAPSHOT
      // =====================================

      const nuevoTotal = Number(nuevaCantidad) * Number(linea.pvp);

      const nuevaLineaId = await crearSnapshotLinea({
        conn,
        lineaOriginal: linea,
        overrides: {
          cantidad: nuevaCantidad,
          total_linea: nuevoTotal,
        },
      });

      //Append Action
      const actionUuid = await adjuntarAccionDeTicket({
        conn,
        ticketId: linea.ticket_id,
        actionType: ACTION_TYPES.LINE_DECREMENTED,
        payload: {
          oldLineaId: lineaId,
          newLineaId: nuevaLineaId,
          oldQuantity: linea.cantidad,
          newQuantity: nuevaCantidad,
        },
        actorUserId: usuarioId,
        aggregateVersion: nuevaVersion,
      });

      await conn.execute(
        `
      UPDATE ticket_lineas
      SET created_by_action_uuid = ?
      WHERE id = ?
      `,
        [actionUuid, nuevaLineaId],
      );
    }

    const { version } = await finalizarMutacionTicket({
      conn,
      ticketId: linea.ticket_id,
    });

    return {
      ok: true,
    };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
