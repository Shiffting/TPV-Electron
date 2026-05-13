import { pool } from "../../src/db/pool.js";
import { adjuntarAccionDeTicket } from "../../services/actionService.js";
import { recalcularTicket } from "../tickets/recalcularTicket.js";
import { emitirActualizacionTicket } from "../../events/emitirActualizacionTicket.js";

export async function deshacerUltimaAccion({ ticketId, usuarioId = null }) {
  const conn = await pool.getConnection();

  try {
    await conn.comenzarTransaccion();

    // =====================================
    // ÚLTIMA ACCIÓN REVERSIBLE
    // =====================================

    const [[accion]] = await conn.query(
      `
      SELECT *
      FROM ticket_actions
      WHERE ticket_id = ?
        AND reversed_by_action_uuid IS NULL
        AND action_type IN (
          'LINE_ADDED',
          'LINE_SENT_TO_KITCHEN',
          'LINE_READY'
        )
      ORDER BY id DESC
      LIMIT 1
      FOR UPDATE
      `,
      [ticketId],
    );

    if (!accion) {
      throw new Error("No hay acciones reversibles");
    }

    const payload = JSON.parse(accion.payload);

    // =====================================
    // LINE ADDED
    // =====================================

    if (accion.action_type === "LINE_ADDED") {
      await conn.execute(
        `
        UPDATE ticket_lineas
        SET lifecycle_status = 'anulado'
        WHERE id = ?
        `,
        [payload.lineaId],
      );
    }

    // =====================================
    // LINE SENT
    // =====================================

    if (accion.action_type === "LINE_SENT_TO_KITCHEN") {
      await conn.execute(
        `
        UPDATE ticket_lineas
        SET estatus_operacional = 'created'
        WHERE id = ?
        `,
        [payload.lineaId],
      );
    }

    // =====================================
    // LINE READY
    // =====================================

    if (accion.action_type === "LINE_READY") {
      await conn.execute(
        `
        UPDATE ticket_lineas
        SET estatus_operacional = 'sent'
        WHERE id = ?
        `,
        [payload.lineaId],
      );
    }

    // =====================================
    // ACCIÓN REVERSA
    // =====================================

    const reverseActionUuid = await adjuntarAccionDeTicket({
      conn,
      ticketId,
      actionType: "ACTION_REVERSED",
      payload: {
        reversedActionUuid: accion.action_uuid,
        reversedActionType: accion.action_type,
      },
      actorUserId: usuarioId,
      aggregateVersion: nuevaVersion,
    });

    // =====================================
    // MARCAR REVERSIÓN
    // =====================================

    await conn.execute(
      `
      UPDATE ticket_actions
      SET reversed_by_action_uuid = ?
      WHERE id = ?
      `,
      [reverseActionUuid, accion.id],
    );

    // =====================================
    // RECALCULAR
    // =====================================

    await recalcularTicket(conn, ticketId);

    await conn.commit();

    emitirActualizacionTicket(ticketId);

    return {
      ok: true,
      reversed: accion.action_type,
    };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
