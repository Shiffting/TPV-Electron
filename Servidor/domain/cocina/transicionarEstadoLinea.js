import { pool } from "../../src/db/pool.js";
import { adjuntarAccionDeTicket } from "../../services/actionService.js";
import { emitirActualizacionTicket } from "../../events/emitirActualizacionTicket.js";
import { validarLineaActiva } from "../policies/validarLineaActiva.js";
import { validarTransicionEstado } from "../policies/validarTransicionEstado.js";
import { ACTION_TYPES } from "../constants/actionTypes.js";
import { incrementarVersionTicket } from "../helpers/incrementarVersionTicket.js";
import { crearSnapshotLinea } from "../helpers/crearSnapshotLinea.js";
import { finalizarMutacionTicket } from "../helpers/finalizarMutacionTicket.js";
import { vincularSnapshotAAccion } from "../helpers/vincularSnapshotAAccion.js";

// =========================================
// TRANSICIONES VÁLIDAS
// =========================================

const actionMap = {
  enviado: ACTION_TYPES.LINE_SENT_TO_KITCHEN,
  preparando: ACTION_TYPES.LINE_PREPARATION_STARTED,
  listo: ACTION_TYPES.LINE_READY,
  servido: ACTION_TYPES.LINE_SERVED,
  cancelado: ACTION_TYPES.LINE_CANCELLED,
};

// =========================================
// TRANSITION
// =========================================

export async function transicionarEstadoLinea({
  lineaId,
  newStatus,
  usuarioId = null,
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

    validarLineaActiva(linea);

    const currentStatus = linea.estatus_operacional;

    // =====================================
    // VALIDAR TRANSICIÓN
    // =====================================

    validarTransicionEstado({
      actual: currentStatus,
      siguiente: newStatus,
    });

    // =====================================
    // MATERIALIZED STATE
    // =====================================

    const nuevaLineaId = await crearSnapshotLinea({
      conn,
      lineaOriginal: linea,
      overrides: {
        estatus_operacional: newStatus,
      },
    });

    //Append action
    const actionUuid = await adjuntarAccionDeTicket({
      conn,
      ticketId: linea.ticket_id,
      actionType: actionMap[newStatus],
      payload: {
        oldLineaId: lineaId,
        newLineaId: nuevaLineaId,
        from: currentStatus,
        to: newStatus,
      },
      actorUserId: usuarioId,
    });

    await vincularSnapshotAAccion({
      conn,
      lineaId: nuevaLineaId,
      actionUuid,
    });

    const { version } = await finalizarMutacionTicket({
      conn,
      ticketId: linea.ticket_id,
    });

    return {
      ok: true,
      from: currentStatus,
      to: newStatus,
      version,
    };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
