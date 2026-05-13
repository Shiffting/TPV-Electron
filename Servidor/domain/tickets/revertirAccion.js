import { pool } from "../../src/db/pool.js";
import { adjuntarAccionDeTicket } from "../../services/actionService.js";
import { emitirActualizacionTicket } from "../../events/emitirActualizacionTicket.js";
import { ACTION_TYPES } from "../constants/actionTypes.js";
import { incrementarVersionTicket } from "../helpers/incrementarVersionTicket.js";
import { revertirLineaAñadida } from "./revertHandlers/revertirLineaAñadida.js";

export async function revertirAccion({ actionUuid, usuarioId = null }) {
  const conn = await pool.getConnection();

  try {
    await conn.comenzarTransaccion();

    // =====================================
    // ACTION ORIGINAL
    // =====================================

    const [[action]] = await conn.query(
      `
        SELECT *
        FROM ticket_actions
        WHERE action_uuid = ?
        LIMIT 1
        `,
      [actionUuid],
    );

    if (!action) {
      throw new Error("ACTION_NOT_FOUND");
    }

    if (action.reversed_by_action_uuid) {
      throw new Error("ACTION_ALREADY_REVERTED");
    }

    const payload = JSON.parse(action.payload);

    // =====================================
    // REVERT LINE ADDED
    // =====================================

    switch (action.action_type) {
      case ACTION_TYPES.LINE_ADDED:
        await revertirLineaAñadida({
          conn,
          payload,
        });

        break;
    }

    //Incrementar
    const nuevaVersion = await incrementarVersionTicket(conn, action.ticket_id);
    //Append
    const revertActionUuid = await adjuntarAccionDeTicket({
      conn,
      ticketId: action.ticket_id,
      actionType: ACTION_TYPES.ACTION_REVERTED,
      payload: {
        revertedActionUuid: actionUuid,
        compensationLineaId,
      },
      actorUserId: usuarioId,
      aggregateVersion: nuevaVersion,
    });

    // =====================================
    // MARCAR REVERTIDA
    // =====================================

    await conn.query(
      `
      UPDATE ticket_actions
      SET reversed_by_action_uuid = ?
      WHERE action_uuid = ?
      `,
      [revertActionUuid, actionUuid],
    );

    await conn.commit();

    emitirActualizacionTicket(action.ticket_id);

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
